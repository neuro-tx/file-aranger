import * as sp from "node:path";
import fs from "fs/promises";
import { normalizeExt, normalizePath } from "../../utils/helper";
import { FileNode, WalkError, WalkResult } from "../../utils/types";

export async function walk(
  path: string,
  result: FileNode[] = [],
  _visited = new Set<string>(),
  _errors: WalkError[] = []
): Promise<WalkResult> {
  // Resolve real path to avoid symlink loops
  const real = await fs.realpath(path);
  if (_visited.has(real)) {
    return { files: result, errors: _errors };
  }
  _visited.add(real);

  try {
    const entries = await fs.readdir(real, { withFileTypes: true });

    for (const entry of entries) {
      const full = normalizePath(sp.join(real, entry.name));

      try {
        if (entry.isDirectory()) {
          await walk(full, result, _visited, _errors);
        } else if (entry.isFile()) {
          const stat = await fs.stat(full);
          result.push({
            dir: path,
            ext: normalizeExt(sp.extname(full)),
            fullPath: full,
            name: entry.name,
            size: stat.size,
          });
        }
      } catch (err: any) {
        _errors.push({
          path: full,
          error: err?.message ?? String(err),
        });
      }
    }
  } catch (error: any) {
    _errors.push({
      path,
      error: error?.message ?? String(error),
    });
  }

  return { files: result, errors: _errors };
}
