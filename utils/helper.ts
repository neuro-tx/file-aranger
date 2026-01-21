import * as sp from "node:path";
import fs from "fs/promises";

export function normalizePath(path: string): string {
  if (typeof path !== "string") throw new Error("string expected");
  path = sp.normalize(path);
  path = path.replace(/\\/g, "/");
  let prepend = false;
  if (path.startsWith("//")) prepend = true;
  path = path.replace(/\/\//g, "/");
  if (prepend) path = "/" + path;
  return path;
}

export function normalizeExt(ext: string) {
  return ext.startsWith(".") ? ext.slice(1).toLowerCase() : ext.toLowerCase();
}

export async function move(src: string, dest: string) {
  src = normalizePath(src);
  dest = normalizePath(dest);

  await fs.mkdir(sp.dirname(dest), { recursive: true });

  try {
    await fs.access(dest);
    throw new Error(`File already exists: ${dest}`);
  } catch {}

  try {
    await fs.rename(src, dest);
  } catch (e: any) {
    if (e.code !== "EXDEV") throw e;

    const tmp = dest + ".tmp";
    await fs.copyFile(src, tmp);
    await fs.rename(tmp, dest);
    await fs.unlink(src);
  }
}

export const isDirectory = async (path: string): Promise<boolean> => {
  const stat = await fs.stat(path);
  if (stat.isDirectory()) return true;
  return false;
};
