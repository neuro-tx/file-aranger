import { formatSize, isDirectory } from "../../utils/helper";
import { FileError } from "../../utils/types";
import { walk } from "./handlers";

interface LargeFile {
  path: string;
  sizeMB: string;
  sizeBytes: number;
}

interface LargeFinderState {
  limit: number;
  matched: number;
  errors?: FileError[];
  filesPath: LargeFile[];
}

/**
 * Finds large files in a directory tree that exceed a minimum size threshold
 * @param root - Root directory path to start the search
 * @param minSizeMB - Minimum file size in MB (default 500MB)
 * @param limit - Maximum number of files to return (default 10)
 * @returns Promise resolving to search results with matched files
 * @throws Error if root path is invalid, not a directory, or walk operation fails
 */
export async function findLargeFiles(
  root: string,
  minSizeMB = 500,
  limit = 10
): Promise<LargeFinderState> {
  const isDir = await isDirectory(root);
  if (!isDir) throw new Error(`Path '${root}' is not a directory`);

  if (minSizeMB <= 0) {
    throw new Error("minSizeMB must be greater than 0");
  }

  if (limit <= 0) {
    throw new Error("limit must be greater than 0");
  }

  const bytes = minSizeMB * 1024 ** 2;
  const result: LargeFinderState = {
    limit,
    matched: 0,
    filesPath: [],
  };

  try {
    const { files, errors } = await walk(root);

    if (errors && errors.length > 0) {
      result.errors?.push(...errors);
    }

    if (!files || files.length === 0) {
      return result;
    }

    const largeFiles: LargeFile[] = files
      .filter((file) => {
        // Ensure file has required properties
        if (!file || typeof file.size !== "number" || !file.fullPath) {
          return false;
        }
        return file.size >= bytes;
      })
      .map((file) => ({
        path: file.fullPath,
        sizeMB: formatSize(file.size),
        sizeBytes: file.size,
      }))
      .sort((a, b) => b.sizeBytes - a.sizeBytes);

    result.filesPath = largeFiles.slice(0, limit);
    result.matched = largeFiles.length;

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to find large files in "${root}": ${errorMessage}`);
  }
}
