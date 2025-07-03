import fs from "fs/promises";
import path from "path";
import { move, normalizedPath } from "../utils/actions";
import {
  createFoldersByExtension,
  getExtend,
  isDir,
} from "../utils/helper";
import { convertExtension, getAlldires } from "./collectFiles";

export const arange = async (mainPath: string): Promise<void> => {
  await createFoldersByExtension(mainPath);
  const files = await fs.readdir(normalizedPath(mainPath));
  const dires = await getAlldires(mainPath);

  for (const file of files) {
    if (!(await isDir(path.join(mainPath, file)))) {
      const transformer = convertExtension(getExtend(file));
      if (dires.includes(transformer)) {
        const main = path.join(mainPath, file);
        const destPath = path.join(mainPath, transformer, file);
        await move(main, destPath);
      }
    }
  }
};
