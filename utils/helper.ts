import fs from "fs/promises";
import path from "path";
import { capitalize } from "./transform";
import { normalizedPath } from "./actions";

export const getExtnds = async (directory: string): Promise<string[]> => {
  if (!(await isDir(directory))) {
    throw new Error("only accept directories");
  }

  try {
    const files = await fs.readdir(normalizedPath(directory));
    if (files.length === 0) {
      throw new Error("This directory doesn't have any files.");
    }

    const allExts = files.map((file) =>
      path.extname(file).slice(1).toLowerCase()
    );

    return [...new Set(allExts)];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Unknown error occurred while reading directory.");
    }
  }
};

export const isDir = async (directory: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(normalizedPath(directory));
    return stats.isDirectory();
  } catch (err) {
    throw new Error(
      `Invalid directory: ${directory} - ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
};

export const createFoldersByExtension = async (
  mainPath: string
): Promise<void> => {
  let created = 0;

  const extensions = await getExtnds(mainPath);
  try {
    for (const ext of extensions) {
      let extPath = path.join(normalizedPath(mainPath), capitalize(ext));
      extPath = extPath.endsWith("s") ? extPath : extPath + "s";
      try {
        await fs.access(extPath);
      } catch {
        await fs.mkdir(extPath);
        created++;
        console.log(
          `📁 Created folder: "${extPath}"`
        );
      }
    }

    if (created === 0) {
      console.log("All folders already exist.");
    } else {
      console.log(`✅ Successfully created ${created} folder(s).`);
    }
  } catch (error) {
    console.log(error);
  }
};

export const getExtend = (
  file: string,
  withDot: boolean = false
): string => {
  if (withDot) return path.extname(file);
  return path.extname(file).slice(1).toLowerCase();
};
