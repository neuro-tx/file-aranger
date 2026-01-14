import { mediaTypes } from "../../utils/names";
import { FileNode, MediaRules, MovePlan } from "../../utils/types";
import * as sp from "node:path";
import fs from "fs/promises";
import { normalizeExt, normalizePath } from "../../utils/helper";

export function resolveRules(user?: MediaRules): MediaRules {
  const system = mediaTypes;
  if (!user) return system;
  // create a copy of sysyem media types for safe edit
  const result: MediaRules = structuredClone(system);

  // Remove user extensions from all system folders
  const token = new Set(
    Object.values(user)
      .flat()
      .map((e) => e.toLowerCase())
  );

  for (const folder in result) {
    result[folder] = result[folder].filter((ext) => !token.has(ext));
  }

  //   Apply rules in result
  for (const [folder, exts] of Object.entries(user)) {
    result[folder] = exts;
  }
  return result;
}

function buildExtMap(rules: MediaRules): Map<string, string> {
  const map = new Map<string, string>();

  for (const [folder, exts] of Object.entries(rules)) {
    for (const ext of exts) {
      if (map.has(ext)) {
        throw new Error(`Extension "${ext}" assigned twice`);
      }
      map.set(ext, folder);
    }
  }

  return map;
}

export function buildPlan(
  files: FileNode[],
  baseDir: string,
  rules?: MediaRules
): MovePlan[] {
  const resolved = resolveRules(rules);
  const extMap = buildExtMap(resolved);

  return files.map((file) => {
    const folder = extMap.get(file.ext) ?? "others";
    const destDir = normalizePath(sp.join(baseDir, folder));
    const destPath = normalizePath(sp.join(destDir, file.name));

    return { file, destDir, destPath };
  });
}

export async function intialBuildState(dir: string): Promise<FileNode[]> {
  const entries = await fs.readdir(normalizePath(dir), {
    withFileTypes: true,
  });

  const files: FileNode[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const full = normalizePath(sp.join(dir, entry.name));
    const stat = await fs.stat(full);

    files.push({
      dir,
      name: entry.name,
      fullPath: full,
      ext: normalizeExt(sp.extname(entry.name)),
      size: stat.size,
    });
  }
  return files;
}

export function printPlan(plan: MovePlan[]) {
  const rows = plan.map((p) => ({
    from: p.file.fullPath,
    to: p.destPath,
  }));
  const fromWidth = Math.max("FROM".length, ...rows.map((r) => r.from.length));
  const toWidth = Math.max("TO".length, ...rows.map((r) => r.to.length));

  const line = () => "─".repeat(fromWidth / 2 + toWidth);

  console.log(` FROM${" ".repeat(fromWidth - 4)} │ TO`);
  console.log(line());

  for (const r of rows) {
    console.log(` ${r.from}${" ".repeat(fromWidth - r.from.length)} │ ${r.to}`);
  }
}
