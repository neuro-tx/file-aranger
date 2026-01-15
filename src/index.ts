import { ArrangeStats, MediaRules } from "../utils/types";
import { createRouter, intialBuildState, printPlan } from "./core/arrange";
import { normalizePath, move as safeMove } from "../utils/helper";

interface ArrangeOptions {
  rules?: MediaRules;
  dryRun?: boolean;
  onMove?: (move: { file: string; dest: string }, stats: ArrangeStats) => void;
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
    if (files.length === 0) return stats;
    stats.scanned = files.length;

    const route = createRouter(rules);
    const plan = files.map((f) => route(f, path));

    if (dryRun) {
      printPlan(plan);
    }

    for (const move of plan) {
      const src = normalizePath(move.file.fullPath);
      const dest = normalizePath(move.destPath);

      if (src === dest) {
        stats.skipped++;
        onMove?.({ file: src, dest }, stats);
        continue;
      }

      if (dryRun) {
        stats.moved++;
        onMove?.({ file: src, dest }, stats);
        continue;
      }

      try {
        await safeMove(src, dest);
        stats.moved++;
        onMove?.({ file: src, dest }, stats);
      } catch (err) {
        console.error("Move failed:", src, "→", dest, err);
        stats.errors++;
        onMove?.({ file: src, dest }, stats);
      }
    }
  } catch (err: any) {
    console.error("Arrange process failed:", err?.message ?? err);
    stats.errors = stats.scanned;
  }

  return stats;
}
