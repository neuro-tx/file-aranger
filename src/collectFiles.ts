import fs from "fs/promises";
import { normalizedPath } from "../utils/actions";
import { capitalize } from "../utils/transform";

export const getAlldires = async (dirPath: string): Promise<string[]> => {
  try {
    const dir = await fs.opendir(normalizedPath(dirPath));
    const allDires: string[] = [];
    for await (const dirent of dir) {
      if (dirent.isDirectory()) {
        allDires.push(dirent.name);
      }
    }
    return allDires;
  } catch (err) {
    console.error(err);
    return []
  }
};

export const convertExtension = (extension : string): string => {
  const transform = capitalize(extension)
  if(transform.endsWith("s")) {
    return transform
  } else{
    return transform + "s"
  }
}