import { DedupeOptions, DedupeResult, FileNode } from "../../utils/types";
import { deleteEmptyDirs, walk } from "./handlers";
import fs from "fs/promises";
import { createReadStream } from "fs";
import crypto from "crypto";
import { normalizePath } from "../../utils/helper";
import { resolveLogger } from "../../utils/logger";
import path from "path";

const hashFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};

const shouldIgnore = (filePath: string, patterns: string[]): boolean => {
  if (!patterns || patterns.length === 0) return false;

  return patterns.some((pattern) => {
    // Simple glob-like matching
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(regexPattern);
    return (
      regex.test(normalizePath(filePath)) ||
      normalizePath(filePath).includes(pattern)
    );
  });
};

const chooseCanonical = (
  files: FileNode[],
  options: DedupeOptions
): FileNode => {
  const { canonicalPath, strategy = canonicalPath ? "canonical" : "first" } =
    options;

  switch (strategy) {
    case "canonical":
      if (!canonicalPath) {
        throw new Error("canonicalPath is required for 'canonical' strategy");
      }
      const preferred = files.find((f) => f.fullPath.startsWith(canonicalPath));
      if (!preferred) {
        console.warn(
          `No file matches canonical path '${canonicalPath}', falling back to first file`
        );
        return files[0];
      }
      return preferred;

    case "oldest":
      return files.reduce((oldest, current) =>
        current.mtime && oldest.mtime && current.mtime < oldest.mtime
          ? current
          : oldest
      );

    case "newest":
      return files.reduce((newest, current) =>
        current.mtime && newest.mtime && current.mtime > newest.mtime
          ? current
          : newest
      );

    case "shortest-path":
      return files.reduce((shortest, current) =>
        current.fullPath.length < shortest.fullPath.length ? current : shortest
      );

    case "longest-path":
      return files.reduce((longest, current) =>
        current.fullPath.length > longest.fullPath.length ? current : longest
      );

    case "first":
    default:
      return files[0];
  }
};

/**
 * Deduplicate files in a directory tree
 *
 * @param root - Root directory to scan
 * @param options - Deduplication options
 * @returns Promise<DedupeResult> - Results of the deduplication
 *
 * @example
 * ```typescript
 * const result = await dedupe("/path/to/files", {
 *   strategy: "newest",
 *   dryRun: true,
 * });
 *
 * console.log(`Deleted ${result.filesDeleted} files`);
 * console.log(`Saved ${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
 * ```
 */
export async function dedupe(
  root: string,
  options: DedupeOptions = {}
): Promise<DedupeResult> {
  const {
    dryRun = false,
    ignorePatterns = [],
    onDuplicate,
    onError,
    deleteEmpty = false,
    log: enabled = false,
  } = options;

  const logger = resolveLogger(enabled);

  // Initialize result
  const result: DedupeResult = {
    scannedFiles: 0,
    duplicateGroups: 0,
    filesDeleted: 0,
    spaceSaved: 0,
    errors: [],
    groups: [],
  };

  logger?.info(
    dryRun
      ? "Running in dry-run mode (no changes will be applied)"
      : `Starting scan in ${root}`
  );

  try {
    const stats = await fs.stat(root);
    if (!stats.isDirectory()) {
      throw new Error(`Path '${root}' is not a directory`);
    }

    const { files, errors: walkErrors } = await walk(root);
    result.errors.push(...walkErrors);

    // Filter out ignored files
    const filteredFiles = files.filter(
      (file) => !shouldIgnore(file.fullPath, ignorePatterns)
    );
    result.scannedFiles = filteredFiles.length;
    if (filteredFiles.length === 0) {
      logger?.info("there is no duplicated files.");
      return result;
    }

    // Group files by size first
    const sizeMap = new Map<number, FileNode[]>();

    for (const file of filteredFiles) {
      if (!sizeMap.has(file.size)) {
        sizeMap.set(file.size, []);
      }
      sizeMap.get(file.size)!.push(file);
    }

    // Hash files that have potential duplicates and group by content
    const potentialDuplicates = Array.from(sizeMap.values()).filter(
      (group) => group.length > 1
    );

    const hashMap = new Map<string, FileNode[]>();

    for (const sizeGroup of potentialDuplicates) {
      for (const file of sizeGroup) {
        try {
          const hash = await hashFile(file.fullPath);
          logger?.hashing(`Hashing ${file.fullPath}`);

          if (!hashMap.has(hash)) {
            hashMap.set(hash, []);
          }
          hashMap.get(hash)!.push(file);
        } catch (error) {
          const err = error as Error;
          result.errors.push({
            file: file.fullPath,
            error: err.message,
          });
          logger?.errorMessage(err.message);
          onError?.(file, err);
        }
      }
    }

    // Process duplicate groups
    let deletedCount = 0;
    const duplicateGroups = Array.from(hashMap.entries()).filter(
      ([_, group]) => group.length > 1
    );

    result.duplicateGroups = duplicateGroups.length;

    for (const [hash, group] of duplicateGroups) {
      try {
        // Choose canonical file
        const canonical = chooseCanonical(group, options);
        const duplicates = group.filter((f) => f !== canonical);
        onDuplicate?.(canonical, duplicates);
        logger?.canonical(canonical.fullPath);

        const groupInfo = {
          hash,
          canonical,
          duplicates,
          spaceSaved: duplicates.reduce((sum, f) => sum + f.size, 0),
        };
        result.groups.push(groupInfo);

        // Delete duplicates
        for (const dup of duplicates) {
          try {
            if (dryRun) {
              logger?.deleteDryRun(dup.fullPath);
            } else {
              await fs.unlink(dup.fullPath);
              logger?.deleted(dup.fullPath, dup.size);
            }
            result.filesDeleted++;
            result.spaceSaved += dup.size;
            deletedCount++;
          } catch (error) {
            const err = error as Error;
            result.errors.push({
              file: dup.fullPath,
              error: err.message,
            });
            logger?.errorMessage(err.message);
            onError?.(dup, err);
          }
        }
      } catch (error) {
        const err = error as Error;
        result.errors.push({
          file: `group:${hash.substring(0, 8)}`,
          error: err.message,
        });
        logger?.errorMessage(err.message);
      }
    }
    logger?.dedupeSummary(result.filesDeleted, result.spaceSaved);

    if (deleteEmpty) {
      if (!dryRun) {
        const { deleted } = await deleteEmptyDirs(root);
        logger?.deleted(`Deleted ${deleted} empty directories`);
      }
    }

    return result;
  } catch (error) {
    const err = error as Error;
    throw err;
  }
}
