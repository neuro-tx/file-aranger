import { ArrangeStats, MediaRules } from "../utils/types";
import { buildPlan, intialBuildState, printPlan } from "./core/arrange";
import { move as safeMove } from "../utils/helper";

interface ArrangeOptions {
  rules?: MediaRules;
  dryRun?: boolean;
}

/**
 * Arrange files in a folder into sub-folders based on file extension.
 *
 * - Creates needed folders (Images, Videos, Documents, etc.)
 * - Skips directories
 * - Detects the correct folder for each file
 * - Moves each file into its category folder
 *
 * @param path Path of the directory to organize
 * @param options -
 *  - `dryRun`: for dry run simulation
 *  - `rules`: rules for folders names , if not arrange by defalut will rename folders to a readable names
 */
export async function arrange(
  path: string,
  options?: ArrangeOptions
): Promise<ArrangeStats> {
  const { rules, dryRun = false } = options ?? {};
  const stats: ArrangeStats = {
    scanned: 0,
    moved: 0,
    skipped: 0,
    errors: 0,
  };
  const files = await intialBuildState(path);
  stats.scanned = files.length;
  const plan = buildPlan(files, path, rules);
  console.log(plan)

  if (dryRun) {
    printPlan(plan);
  }

  for (const move of plan) {
    const src = move.file.fullPath;
    const dest = move.destPath;

    if (src === dest) {
      stats.skipped++;
      continue;
    }

    if (dryRun) {
      stats.moved++;
      continue;
    }

    try {
      await await safeMove(src, dest);
      stats.moved++;
    } catch (err) {
      console.error("Move failed:", src, "→", dest, err);
      stats.errors++;
    }
  }

  return stats;
}
