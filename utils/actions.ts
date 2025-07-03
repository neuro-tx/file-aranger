import path from "path";
import fs from "fs/promises";

export const move = async (main: string, dest: string): Promise<void> => {
  try {
    await fs.copyFile(normalizedPath(main), normalizedPath(dest));
    await fs.rm(main);
    console.log(`- Moving ${main}`);
  } catch (error) {
    console.error(error);
  }
};

export const normalizedPath = (dirPath: string): string => {
  return path.normalize(dirPath);
};