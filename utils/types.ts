export type FileNode = {
  fullPath: string;
  name: string;
  ext: string;
  size: number;
  dir: string;
};

export type MovePlan = {
  file: FileNode;
  destDir: string;
  destPath: string;
};

export type ArrangeStats = {
  scanned: number;
  moved: number;
  skipped: number;
  errors: number;
};

export type MediaRules = Record<string, readonly string[]>;

export interface WalkError {
  path: string;
  error: string;
}

export interface WalkResult {
  files: FileNode[];
  errors: WalkError[];
}