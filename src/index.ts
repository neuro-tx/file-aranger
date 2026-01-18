import { ArrangeStats, ConflictStrategy, MediaRules } from "../utils/types";
import { createRouter, intialBuildState, printPlan } from "./core/arrange";
import { normalizePath, move as safeMove } from "../utils/helper";
import { deleteEmptyDirs, walk } from "./core/handlers";
import { resolveNames } from "./core/flat";
import { log } from "../utils/logger";

interface ArrangeOptions {
  rules?: MediaRules;
  dryRun?: boolean;
  onMove?: (move: { file: string; dest: string }, stats: ArrangeStats) => void;
}

interface FlattenOpts {
  depth?: number;
  dryRun?: boolean;
  conflict?: ConflictStrategy;
  level?: number;
  deleteEmpty?: boolean;
}

/**
 * Arrange files in a folder into sub-folders based on file extension.
 *
 * Features:
 * - Creates necessary folders (Images, Videos, Documents, etc.)
 * - Skips directories automatically
 * - Detects the correct folder for each file based on extension rules
 * - Supports custom rules to override default folders
 * - Dry-run mode to simulate moves without touching files
 * - Returns detailed stats for scanned, moved, skipped, and errors
 * - Optional callback for integration with UI or real-time updates
 *
 * @param path The root directory containing files to organize
 * @param options Optional settings including rules, dryRun, and callback
 * @returns ArrangeStats with scanned, moved, skipped, and error counts
 */
export async function arrange(
  path: string,
  options?: ArrangeOptions
): Promise<ArrangeStats> {
  const { rules, dryRun = false, onMove } = options ?? {};
  const stats: ArrangeStats = {
    scanned: 0,
    moved: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const files = await intialBuildState(path);
    if (files.length === 0) {
      log.info("Nothing to arrange");
      return stats;
    }
    stats.scanned = files.length;

    const route = createRouter(rules);
    const plan = files.map((f) => route(f, path));

    for (const move of plan) {
      const src = normalizePath(move.file.fullPath);
      const dest = normalizePath(move.destPath);

      if (src === dest) {
        stats.skipped++;
        onMove?.({ file: src, dest }, stats);
        log.skipped(src);
        continue;
      }

      if (dryRun) {
        stats.moved++;
        log.dryRun(src, dest);
        onMove?.({ file: src, dest }, stats);
        continue;
      }

      try {
        await safeMove(src, dest);
        stats.moved++;
        log.success(src, dest);
        onMove?.({ file: src, dest }, stats);
      } catch (err) {
        stats.errors++;
        log.error(src, dest, err);
        onMove?.({ file: src, dest }, stats);
      }
    }
  } catch (err: any) {
    log.fatal(err);
    stats.errors = stats.scanned;
  }

  return stats;
}

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
  } = opts ?? {};
  path = normalizePath(path);
  const stats = {
    scanned: 0,
    moved: 0,
    errors: 0,
  };

  try {
    const { files, errors } = await walk(path, depth, level);
    stats.scanned = files.length;
    stats.errors = errors.length;

    if (files.length === 0) {
      log.info("Nothing to flatten (no files found)");
      return stats;
    }

    const hasNestedFiles = files.some((f) => normalizePath(f.dir) !== path);

    if (!hasNestedFiles) {
      log.info("Nothing to flatten (no nested folders)");
      return stats;
    }

    const plan = resolveNames(path, files, conflict);
    for (const p of plan) {
      const src = p.src;
      const dest = p.dest;

      if (src === dest) {
        log.skipped(src);
        continue;
      }
      if (dryRun) {
        stats.moved++;
        log.dryRun(src, dest);
        continue;
      }
      try {
        await safeMove(src, dest);
        stats.moved++;
        log.success(src, dest);
      } catch (err) {
        stats.errors++;
        log.error(src, dest, err);
      }
    }

    if (deleteEmpty) {
      await deleteEmptyDirs(path);
    }
  } catch (err) {
    log.fatal(err);
    stats.errors = stats.scanned;
  }

  return stats;
}
