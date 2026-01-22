import { isDirectory } from "../../utils/helper";
import { resolveLogger } from "../../utils/logger";
import { FindEmptyOptions, FinderState } from "../../utils/types";
import { walk } from "./handlers";
import fs from "fs/promises";

/**
 * Find and optionally delete (dryRun by default) empty files (0 bytes) in a directory tree
 *
 * @param root - Root directory to scan
 * @param options - Options for finding/deleting empty files
 * @returns FindEmptyResult with counts and error details
 *
 * @throws Error if root path doesn't exist or is not a directory
 *
 * @example
 * ```typescript
 * // Find empty files without deleting
 * const result = await findEmptyFiles("/path/to/scan");
 * console.log(`Found ${result.emptyFiles} empty files`);
 *
 * // Delete empty files
 * const deleted = await findEmptyFiles("/path/to/scan", {
 *   deleteEmpty: true,
 *   onEmptyFile: (file, deleted) => {
 *     console.log(`${deleted ? 'Deleted' : 'Found'}: ${file}`);
 *   },
 *   dryRun:false
 * });
 * console.log(`Deleted ${deleted.deleted} empty files`);
 * ```
 */
export async function findEmptyFiles(
  root: string,
  options: FindEmptyOptions = {}
): Promise<FinderState> {
  const {
    deleteEmpty = false,
    dryRun = true,
    onEmptyFile,
    onError,
    getFiles = false,
    log = false,
  } = options;
  const result: FinderState = {
    scanned: 0,
    deleted: 0,
    empty: 0,
    errors: [],
    files: [],
  };

  const logger = resolveLogger(log);

  try {
    const isDir = await isDirectory(root);
    if (!isDir) throw new Error(`Path '${root}' is not a directory`);

    const { files, errors } = await walk(root);
    result.errors.push(...errors);

    if (!files || files.length === 0) {
      logger?.info("There is no files in the directory");
      return result;
    }
    result.scanned = files.length;

    for (const file of files) {
      if (file.size === 0) {
        result.empty++;
        getFiles &&
          result.files.push({
            dir: file.dir,
            fullPath: file.fullPath,
            size: file.size,
          });
        if (deleteEmpty) {
          try {
            if (!dryRun) {
              await fs.unlink(file.fullPath);
              logger?.deleted(file.fullPath);
              result.deleted++;
              onEmptyFile?.(file.fullPath, true);
            } else {
              logger?.deleteDryRun(file.fullPath);
              result.deleted++;
              onEmptyFile?.(file.fullPath, false);
            }
          } catch (err) {
            const error = err as Error;
            result.errors.push({
              file: file.fullPath,
              error: error.message,
            });
            logger?.errorMessage(error.message);
            onError?.(file.fullPath, error);
          }
        } else {
          logger?.deleteDryRun(file.fullPath);
          onEmptyFile?.(file.fullPath, false);
        }
      }
    }

    return result;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Find empty files operation failed: ${err.message}`);
  }
}
