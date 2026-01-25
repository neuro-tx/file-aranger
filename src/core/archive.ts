import { formatSize, isDirectory, normalizePath } from "../../utils/helper";
import { walk } from "./handlers";
import fs from "fs/promises";
import { move as safeMove } from "../../utils/helper";
import * as sp from "node:path";
import { resolveLogger } from "../../utils/logger";
import { ArchiveOptions, ArchiveResult, FileError } from "../../utils/types";

/**
 * Archive old files based on modification time threshold.
 *
 * Moves files older than specified duration to an archive directory.
 * Files are considered "old" based on their last modification time (mtime).
 *
 * @param root - Root directory to scan for old files
 * @param opts - Archive configuration options
 * @returns ArchiveResult with statistics and errors
 *
 * @returns ArchiveResult with statistics
 */

export async function archive(root: string, opts: ArchiveOptions) {
  const {
    archivePath,
    durationDays,
    dryRun = false,
    log: enabled = false,
    onArchive,
  } = opts;

  const isDir = await isDirectory(root);
  if (!isDir) {
    throw new Error(`Path '${root}' is not a directory`);
  }

  if (!archivePath || archivePath.trim() === "") {
    throw new Error("Archive path is required");
  }

  if (durationDays <= 0) {
    throw new Error("durationDays must be greater than 0");
  }

  const result: ArchiveResult = {
    scanned: 0,
    archived: 0,
    archivedSize: "0 MB",
    errors: [],
  };

  const logger = resolveLogger(enabled);

  try {
    const { files, errors } = await walk(root);
    if (errors && errors.length > 0) {
      result.errors.push(...errors);
    }

    if (!files || files.length === 0) {
      logger?.info("No files found to scan");
      return result;
    }
    result.scanned = files.length;

    const thresholdMs = Date.now() - durationDays * 24 * 60 * 60 * 1000;

    const oldFiles = files.filter((file) => {
      if (!file.mtime) {
        return false;
      }
      return file.mtime.getTime() < thresholdMs;
    });

    if (oldFiles.length === 0) {
      logger?.info("No files eligible for archiving");
      return result;
    }

    // Create archive directory if it doesn't exist (skip in dry run)
    if (!dryRun) {
      try {
        await fs.access(archivePath);
      } catch {
        logger?.info(`Creating archive directory ${archivePath}`);
        await fs.mkdir(archivePath, { recursive: true });
      }
    }

    let toatlSize = 0;
    for (const file of oldFiles) {
      toatlSize += file.size;
      const destPath = normalizePath(sp.join(archivePath, file.name));
      if (dryRun) {
        logger?.archive(file.fullPath, dryRun);
        result.archived++;
        continue;
      }

      try {
        await safeMove(file.fullPath, destPath);
        onArchive?.(file.fullPath, destPath);
        result.archived++;

        logger?.archive(file.fullPath, dryRun);
      } catch (err) {
        logger?.error(file.fullPath, destPath, err);

        result.errors.push({
          file: file.fullPath,
          error: (err as Error).message,
        });
      }
    }
    result.archivedSize = formatSize(toatlSize);

    return result;
  } catch (e) {
    const err = e as Error;
    throw new Error(`Archive operation failed: ${err.message}`);
  }
}
