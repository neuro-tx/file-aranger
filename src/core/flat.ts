import * as sp from "node:path";
import { ConflictStrategy, FileNode } from "../../utils/types";
import { normalizePath } from "../../utils/helper";

export interface UniquePathResult {
  action: "use" | "skip";
  destName: string;
  destPath: string;
}

export const resolveNames = (
  destRoot: string,
  files: FileNode[],
  conflict: ConflictStrategy = "rename"
) => {
  const used = new Map();

  return files.map((file) => {
    const ext = `.${file.ext}`;
    const base = sp.basename(file.name, ext);

    let finalName = `${base}${ext}`;
    switch (conflict) {
      case "overwrite":
        return {
          src: file.fullPath,
          dest: normalizePath(sp.join(destRoot, finalName)),
        };

      case "skip":
        return {
          src: file.fullPath,
          dest: normalizePath(sp.join(destRoot, finalName)),
        };

      case "rename":
      default: {
        if (used.has(finalName)) {
          const counter = used.get(finalName) + 1;
          used.set(finalName, counter);
          finalName = `${base}-(${counter === 1 ? 2 : counter + 1})${ext}`;
        } else {
          used.set(finalName, 0);
        }
      }
    }

    return {
      src: file.fullPath,
      dest: normalizePath(sp.join(destRoot, finalName)),
    };
  });
};
