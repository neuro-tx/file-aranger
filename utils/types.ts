export type FileNode = {
  fullPath: string;
  name: string;
  ext: string;
  size: number;
  dir: string;
  mtime?: Date;
};

export type OperationStats = {
  scanned: number;
  moved: number;
  skipped: number;
  errors: FileError[];
};

export type MediaRules = Record<string, readonly string[]>;

export interface FileError {
  file: string;
  error: string;
}

export interface WalkResult {
  files: FileNode[];
  errors: FileError[];
}

export type ConflictStrategy = "rename" | "overwrite" | "skip";

export type DeleteEmptyDirsResult = {
  deleted: number;
  skipped: number;
};

export type DedupeStrategy =
  | "canonical" // Keep file matching canonical path
  | "oldest" // Keep oldest file by modification time
  | "newest" // Keep newest file by modification time
  | "shortest-path" // Keep file with shortest path
  | "longest-path" // Keep file with longest path
  | "first"; // Keep first file encountered

export interface DedupeOptions {
  strategy?: DedupeStrategy;
  canonicalPath?: string;
  dryRun?: boolean;
  ignorePatterns?: string[];
  onDuplicate?: (canonical: FileNode, duplicates: FileNode[]) => void;
  onError?: (file: FileNode, error: Error) => void;
  log?: boolean;
  deleteEmpty?: boolean;
}

export interface DedupeResult {
  scannedFiles: number;
  duplicateGroups: number;
  filesDeleted: number;
  spaceSaved: number;
  errors: FileError[];
  groups: Array<{
    hash: string;
    canonical: FileNode;
    duplicates: FileNode[];
    spaceSaved: number;
  }>;
}

export interface ArrangeOptions {
  rules?: MediaRules;
  dryRun?: boolean;
  onMove?: (
    move: { file: string; dest: string },
    stats: OperationStats
  ) => void;
  log?: boolean;
}

export interface FlattenOpts {
  depth?: number;
  dryRun?: boolean;
  conflict?: ConflictStrategy;
  level?: number;
  deleteEmpty?: boolean;
  log?: boolean;
}

export interface FindEmptyOptions {
  deleteEmpty?: boolean;
  dryRun?: boolean;
  onEmptyFile?: (file: string, deleted: boolean) => void;
  onError?: (file: string, error: Error) => void;
  getFiles?: boolean;
  log?: boolean;
}

export interface FinderState {
  scanned: number;
  deleted: number;
  errors: FileError[];
  empty: number;
  files: Pick<FileNode, "fullPath" | "dir" | "size">[];
}

export interface ArchiveResult {
  scanned: number;
  archived: number;
  archivedSize: string;
  errors: FileError[];
}

export interface ArchiveOptions {
  durationDays: number;
  archivePath: string;
  dryRun?: boolean;
  onArchive?: (file: string, dest: string) => void;
  log?: boolean;
}