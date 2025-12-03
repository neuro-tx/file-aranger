import fs from "fs/promises";
import path from "path";
import { normalizedPath } from "./actions";
import { mediaTypes } from "./names";

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

  const extensions = await getFolders(mainPath);
  try {
    for (const ext of extensions) {
      const extPath = path.join(normalizedPath(mainPath), ext);
      try {
        await fs.access(extPath);
      } catch {
        await fs.mkdir(extPath);
        created++;
      }
    }

    if (created === 0) {
      console.log("All folders already exist.");
    } 
  } catch (error) {
    console.log(
      error instanceof Error ? error.message : "Failed to create folders."
    );
  }
};

export const getExtend = (file: string, withDot: boolean = false): string => {
  if (withDot) return path.extname(file);
  return path.extname(file).slice(1).toLowerCase();
};

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
    return [];
  }
};

const extMap: Record<string, string> = Object.entries(mediaTypes)
  .flatMap(([folder, exts]) => exts.map((ext) => [ext, folder]))
  .reduce((map, [ext, folder]) => {
    map[ext] = folder;
    return map;
  }, {} as Record<string, string>);

export async function getFolders(path: string) {
  const exts = await getExtnds(path);
  return Array.from(
    new Set(exts.map((ext) => extMap[ext.toLowerCase()] || "others"))
  );
}

const getFolder = (ext: string) : string => extMap[ext.toLowerCase()] || "others";

export const detectPath = async (file : string) => {
  const fExt = getExtend(file);
  return `${getFolder(fExt)}/${file}`;
};