import { mediaTypes } from "../../utils/names";
import { ArrangeOptions, FileNode, MediaRules, OperationStats } from "../../utils/types";
import * as sp from "node:path";
import fs from "fs/promises";
import {
  isDirectory,
  normalizeExt,
  normalizePath,
  move as safeMove,
} from "../../utils/helper";
import { resolveLogger } from "../../utils/logger";

function resolveRules(user?: MediaRules): MediaRules {
  const system = mediaTypes;
  if (!user) return system;
  // create a copy of sysyem media types for safe edit
  const result: MediaRules = structuredClone(system);

  // Remove user extensions from all system folders
  const token = new Set(
    Object.values(user)
      .flat()
      .map((e) => e.toLowerCase())
  );

  for (const folder in result) {
    result[folder] = result[folder].filter((ext) => !token.has(ext));
  }

  //   Apply rules in result
  for (const [folder, exts] of Object.entries(user)) {
    result[folder] = exts;
  }
  return result;
}

function buildExtMap(rules: MediaRules): Map<string, string> {
  const map = new Map<string, string>();

  for (const [folder, exts] of Object.entries(rules)) {
    for (const ext of exts) {
      if (map.has(ext)) {
        throw new Error(`Extension "${ext}" assigned twice`);
      }
      map.set(ext, folder);
    }
  }

  return map;
}

function createRouter(rules?: MediaRules) {
  const resolved = resolveRules(rules);
  const extMap = buildExtMap(resolved);

  return (file: FileNode, baseDir: string) => {
    const folder = extMap.get(file.ext) ?? "others";
    const destDir = normalizePath(sp.join(baseDir, folder));
    const destPath = normalizePath(sp.join(destDir, file.name));
    return { file, destDir, destPath };
  };
}

async function intialBuildState(dir: string): Promise<FileNode[]> {
  const entries = await fs.readdir(normalizePath(dir), {
    withFileTypes: true,
  });

  const files: FileNode[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const full = normalizePath(sp.join(dir, entry.name));
    const stat = await fs.stat(full);

    files.push({
      dir,
      name: entry.name,
      fullPath: full,
      ext: normalizeExt(sp.extname(entry.name)),
      size: stat.size,
    });
  }
  return files;
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
 * @returns OperationStats  with scanned, moved, skipped, and error counts
 */
export async function arrange(
  path: string,
  options?: ArrangeOptions
): Promise<OperationStats> {
  const { rules, dryRun = false, onMove, log: enabled = false } = options ?? {};
  const stats: OperationStats = {
    scanned: 0,
    moved: 0,
    skipped: 0,
    errors: [],
  };

  const logger = resolveLogger(enabled);

  try {
    const isDir = await isDirectory(path);
    if (!isDir) throw new Error(`Path '${path}' is not a directory`);

    const files = await intialBuildState(path);
    if (files.length === 0) {
      logger?.info("Nothing to arrange");
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
        logger?.skipped(src);
        continue;
      }

      if (dryRun) {
        stats.moved++;
        logger?.dryRun(src, dest);
        onMove?.({ file: src, dest }, stats);
        continue;
      }

      try {
        await safeMove(src, dest);
        stats.moved++;
        logger?.success(src, dest);
        onMove?.({ file: src, dest }, stats);
      } catch (err) {
        const e = err as Error;
        stats.errors.push({
          file: src,
          error: e.message,
        });
        logger?.error(src, dest, err);
        onMove?.({ file: src, dest }, stats);
      }
    }

    return stats;
  } catch (error) {
    const err = error as Error;
    throw err;
  }
}
