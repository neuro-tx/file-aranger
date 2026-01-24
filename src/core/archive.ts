import { formatSize, isDirectory, normalizePath } from "../../utils/helper";
import { walk } from "./handlers";
import fs from "fs/promises";
import { move as safeMove } from "../../utils/helper";
import * as sp from "node:path";

interface ArchiveResult {
  scanned: number;
  archived: number;
  archivedSize: string;
}

/**
 * Archive old files based on modification time threshold.
 *
 * Moves files older than specified duration to an archive directory.
 * Files are considered "old" based on their last modification time (mtime).
 *
 * @param root - Root directory to scan for old files
 * @param archivePath - Archive destination path
 * @param durationDays - Number of days - files older than this will be archived
 * @returns ArchiveResult with statistics
 */

export async function archive(
  root: string,
  archivePath: string,
  durationDays: number,
  dryRun?: boolean
) {
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
    archivedSize: "",
  };

  try {
    const { files } = await walk(root);
    if (!files || files.length === 0) {
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
      return result;
    }

    // Create archive directory if it doesn't exist (skip in dry run)
    if (!dryRun) {
      try {
        await fs.access(archivePath);
      } catch {
        await fs.mkdir(archivePath, { recursive: true });
      }
    }

    let toatlSize = 0;
    for (const file of oldFiles) {
      toatlSize += file.size;
      const destPath = normalizePath(sp.join(archivePath, file.name));
      if (!dryRun) {
        await safeMove(file.fullPath, destPath);
        result.archived++;
      }
    }
    result.archivedSize = formatSize(toatlSize);

    return result;
  } catch (e) {
    const err = e as Error;
    throw new Error(`Archive operation failed: ${err.message}`);
  }
}
