import fs from "fs/promises";
import path from "path";
import { move, normalizedPath } from "../utils/actions";
import { createFoldersByExtension, detectPath, isDir } from "../utils/helper";

/**
 * Arrange files in a folder into sub-folders based on file extension.
 *
 * - Creates needed folders (Images, Videos, Documents, etc.)
 * - Skips directories
 * - Detects the correct folder for each file
 * - Moves each file into its category folder
 *
 * @param mainPath Path of the directory to organize
 */
export const arange = async (mainPath: string): Promise<void> => {
  await createFoldersByExtension(mainPath);
  const files = await fs.readdir(normalizedPath(mainPath));

  for (const file of files) {
    if (!(await isDir(path.join(mainPath, file)))) {
      const main = path.join(mainPath, file);
      const destPath = path.join(mainPath, await detectPath(file));
      await move(main, destPath);
    }
  }
};
