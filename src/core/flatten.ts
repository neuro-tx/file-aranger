import * as sp from "node:path";
import { ConflictStrategy, FileNode, FlattenOpts, OperationStats } from "../../utils/types";
import {
  isDirectory,
  normalizePath,
  move as safeMove,
} from "../../utils/helper";
import { deleteEmptyDirs, walk } from "./handlers";
import { resolveLogger } from "../../utils/logger";

const resolveNames = (
  destRoot: string,
  files: FileNode[],
  conflict: ConflictStrategy = "rename"
) => {
  const used = new Map();

  return files.map((file) => {
    const ext = `.${file.ext}`;
    const base = sp.basename(file.name, ext);

    let finalName = `${base}${ext}`;
    switch (conflict) {
      case "overwrite":
        return {
          src: file.fullPath,
          dest: normalizePath(sp.join(destRoot, finalName)),
        };

      case "skip":
        return {
          src: file.fullPath,
          dest: normalizePath(sp.join(destRoot, finalName)),
        };

      case "rename":
      default: {
        if (used.has(finalName)) {
          const counter = used.get(finalName) + 1;
          used.set(finalName, counter);
          finalName = `${base}-(${counter === 1 ? 2 : counter + 1})${ext}`;
        } else {
          used.set(finalName, 0);
        }
      }
    }

    return {
      src: file.fullPath,
      dest: normalizePath(sp.join(destRoot, finalName)),
    };
  });
};

/**
 * Flatten all files in a directory tree into the root folder.
 *
 * Moves all files found under `path` (recursively up to `depth`) into the root,
 * resolving name conflicts according to `conflict` strategy.
 * Optionally deletes empty directories after moving.
 *
 * @param path - The root directory to flatten.
 * @param opts - Options to control flatten behavior.
 *
 * @returns A promise that resolves when all files have been flattened.
 */
export async function flatten(path: string, opts?: FlattenOpts) {
  const {
    depth = 0,
    level = 0,
    conflict = "rename",
    dryRun = false,
    deleteEmpty = true,
    log: enabled = false,
  } = opts ?? {};
  path = normalizePath(path);
  const stats: OperationStats = {
    scanned: 0,
    moved: 0,
    errors: [],
    skipped: 0,
  };

  const logger = resolveLogger(enabled);

  try {
    const isDir = await isDirectory(path);
    if (!isDir) throw new Error(`Path '${path}' is not a directory`);

    const { files, errors } = await walk(path, depth, level);
    stats.scanned = files.length;
    stats.errors.push(...errors);

    if (files.length === 0) {
      logger?.info("Nothing to flatten (no files found)");
      return stats;
    }

    const hasNestedFiles = files.some((f) => normalizePath(f.dir) !== path);

    if (!hasNestedFiles) {
      logger?.info("Nothing to flatten (no nested folders)");
      return stats;
    }

    const plan = resolveNames(path, files, conflict);
    for (const p of plan) {
      const src = p.src;
      const dest = p.dest;

      if (src === dest) {
        logger?.skipped(src);
        stats.skipped++;
        continue;
      }
      if (dryRun) {
        stats.moved++;
        logger?.dryRun(src, dest);
        continue;
      }
      try {
        await safeMove(src, dest);
        stats.moved++;
        logger?.success(src, dest);
      } catch (err) {
        const e = err as Error;
        stats.errors.push({
          file: src,
          error: e.message,
        });
        logger?.error(src, dest, err);
      }
    }

    if (deleteEmpty) {
      await deleteEmptyDirs(path);
    }

    return stats;
  } catch (err) {
    const error = err as Error;
    throw error;
  }
}
