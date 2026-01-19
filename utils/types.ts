export type FileNode = {
  fullPath: string;
  name: string;
  ext: string;
  size: number;
  dir: string;
};

export type OperationStats = {
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

export type ConflictStrategy = "rename" | "overwrite" | "skip";

export type DeleteEmptyDirsResult = {
  deleted: number;
  skipped: number;
};