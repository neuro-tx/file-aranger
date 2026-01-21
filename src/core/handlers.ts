import * as sp from "node:path";
import fs from "fs/promises";
import { normalizeExt, normalizePath } from "../../utils/helper";
import {
  DeleteEmptyDirsResult,
  FileNode,
  FileError,
  WalkResult,
} from "../../utils/types";
import { Dirent } from "node:fs";

export async function walk(
  path: string,
  depth: number = 0,
  level: number = 0,
  result: FileNode[] = [],
  _visited = new Set<string>(),
  _errors: FileError[] = []
): Promise<WalkResult> {
  // Resolve real path to avoid symlink loops
  const real = await fs.realpath(path);
  if (_visited.has(real)) {
    return { files: result, errors: _errors };
  }
  _visited.add(real);
  const unlimited = depth === 0;
  if (!unlimited && level > depth) return { files: result, errors: _errors };

  try {
    const entries = await fs.readdir(real, { withFileTypes: true });

    for (const entry of entries) {
      const full = normalizePath(sp.join(real, entry.name));

      try {
        if (entry.isDirectory()) {
          await walk(full, depth, level + 1, result, _visited, _errors);
        } else if (entry.isFile()) {
          const stat = await fs.stat(full);
          result.push({
            dir: path,
            ext: normalizeExt(sp.extname(full)),
            fullPath: full,
            name: entry.name,
            size: stat.size,
            mtime: stat.mtime,
          });
        }
      } catch (err: any) {
        _errors.push({
          file: full,
          error: err?.message ?? String(err),
        });
      }
    }
  } catch (error: any) {
    _errors.push({
      file: path,
      error: error?.message ?? String(error),
    });
  }

  return { files: result, errors: _errors };
}

export async function deleteEmptyDirs(
  root: string,
  _protectedDir: string = root
): Promise<DeleteEmptyDirsResult> {
  const protectedDir = sp.resolve(_protectedDir);

  let deleted = 0;
  let skipped = 0;

  async function dirsCrowl(dir: string): Promise<boolean> {
    let entries: Dirent<string>[];

    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      skipped++;
      return false;
    }

    let isEmpty = true;

    for (const entry of entries) {
      const fullPath = sp.join(dir, entry.name);

      if (entry.isDirectory()) {
        const childEmpty = await dirsCrowl(fullPath);
        if (!childEmpty) isEmpty = false;
      } else {
        isEmpty = false;
      }
    }

    if (isEmpty && sp.resolve(dir) !== protectedDir) {
      try {
        await fs.rmdir(dir);
        deleted++;
        return true;
      } catch (e) {
        console.error(e);
        skipped++;
        return false;
      }
    }
    return false;
  }

  await dirsCrowl(sp.resolve(root));

  return { deleted, skipped };
}
