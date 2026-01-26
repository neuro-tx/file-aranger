# 📁 File Operations

> A powerful, production-ready Node.js for advanced file system operations including deduplication, organization, and cleanup.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🔍 **Smart File Deduplication** - Find and remove duplicate files using SHA-256 hashing
- 📂 **Intelligent File Organization** - Auto-organize files into folders by type
- 🧹 **Empty File Cleanup** - Find and remove zero-byte files
- 📦 **Large File Detection** - Identify files exceeding size thresholds
- 🗄️ **Automated Archiving** - Move old files based on age to archive locations
- 🚀 **Production-Ready** - Comprehensive error handling and detailed reporting
- 💪 **TypeScript Native** - Full type safety and IntelliSense support
- 🎯 **Zero Dependencies** - Uses only Node.js built-in modules (crypto, fs, path)
- ⚡ **High Performance** - Optimized algorithms with size-based pre-filtering
- 🔒 **Safe Operations** - Dry-run mode, validation, and atomic operations

---

## 🚀 Quick Start

```typescript
import {
  dedupe,
  arrange,
  findEmptyFiles,
  findLargeFiles,
  archive,
} from "./src";

// Remove duplicate files
const dedupeResult = await dedupe("/path/to/files", {
  strategy: "newest",
  dryRun: true,
  deleteEmpty: true,
});
console.log(`Would remove ${dedupeResult.filesDeleted} duplicates`);

// Organize files by type
const arrangeResult = await arrange("/messy/folder", {
  log: true,
  rules: {
    movies: ["mp4"],
  },
});
console.log(`Organized ${arrangeResult.moved} files`);

// Clean up empty files
const cleanResult = await findEmptyFiles("/path/to/clean", {
  deleteEmpty: true,
});
console.log(`Removed ${cleanResult.deleted} empty files`);

// Find large files
const largeFiles = await findLargeFiles("/path/to/scan", 100, 20);
console.log(`Found ${largeFiles.matched} files larger than 100MB`);

// Archive old files
const archiveResult = await archive("/documents", {
  archivePath: "/archive/old-docs",
  durationDays: 90,
});
console.log(`Archived ${archiveResult.archived} old files`);
```

---

## 📖 API Documentation

### 🔍 File Deduplication

Find and remove duplicate files based on content hash (SHA-256).

#### `dedupe(root: string, options?: DedupeOptions): Promise<DedupeResult>`

**Parameters:**

| Parameter | Type            | Description                           |
| --------- | --------------- | ------------------------------------- |
| `root`    | `string`        | Root directory to scan for duplicates |
| `options` | `DedupeOptions` | Configuration options (optional)      |

**Options:**

```typescript
interface DedupeOptions {
  strategy?: DedupeStrategy; // Which file to keep
  canonicalPath?: string; // Path prefix for 'canonical' strategy
  dryRun?: boolean; // Preview without deleting
  ignorePatterns?: string[]; // Patterns to skip (glob-style)
  onDuplicate?: (canonical, dups) => void; // Callback when duplicates found
  onError?: (file, error) => void; // Callback on error
}
```

**Strategies:**

| Strategy        | Behavior                                  |
| --------------- | ----------------------------------------- |
| `first`         | Keep first file encountered (default)     |
| `canonical`     | Keep file matching `canonicalPath` prefix |
| `oldest`        | Keep oldest file by modification time     |
| `newest`        | Keep newest file by modification time     |
| `shortest-path` | Keep file with shortest path              |
| `longest-path`  | Keep file with longest path               |

**Returns:**

```typescript
interface DedupeResult {
  scannedFiles: number; // Total files scanned
  duplicateGroups: number; // Number of duplicate groups found
  filesDeleted: number; // Files removed
  spaceSaved: number; // Bytes freed
  errors: WalkError[]; // Errors encountered
  groups: Array<{
    // Detailed group info
    hash: string;
    canonical: FileNode;
    duplicates: FileNode[];
    spaceSaved: number;
  }>;
}
```

**Examples:**

```typescript
// Basic deduplication - keep first occurrence
const result = await dedupe("/path/to/files");
console.log(`Removed ${result.filesDeleted} duplicates`);
console.log(`Saved ${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`);

// Keep newest files with dry run
const preview = await dedupe("/path/to/files", {
  strategy: "newest",
  dryRun: true,
});
console.log(`Would delete ${preview.filesDeleted} files`);

// Keep files from specific folder
const canonical = await dedupe("/path/to/files", {
  strategy: "canonical",
  canonicalPath: "/path/to/files/main",
});

// Ignore node_modules and .git
const filtered = await dedupe("/project", {
  ignorePatterns: ["node_modules", ".git", "*.log"],
  strategy: "oldest",
});

// Real-time progress tracking
await dedupe("/path/to/files", {
  onDuplicate: (canonical, duplicates) => {
    console.log(`Keeping: ${canonical.fullPath}`);
    console.log(`Removing: ${duplicates.length} duplicates`);
  },
  onError: (file, error) => {
    console.error(`Failed to process ${file.fullPath}: ${error.message}`);
  },
});
```

---

### 📂 File Organization

Automatically organize files into folders based on file extensions.

#### `arrange(path: string, options?: ArrangeOptions): Promise<OperationStats>`

**Parameters:**

| Parameter | Type             | Description                                 |
| --------- | ---------------- | ------------------------------------------- |
| `path`    | `string`         | Root directory containing files to organize |
| `options` | `ArrangeOptions` | Configuration options (optional)            |

**Options:**

```typescript
interface ArrangeOptions {
  rules?: MediaRules; // Custom folder rules
  dryRun?: boolean; // Preview without moving
  log?: boolean; // Enable logging
  onMove?: (move, stats) => void; // Callback on each move
}
```

**Default Folder Structure:**

Files are organized into these folders based on extension:

| Folder      | Extensions                                                                               |
| ----------- | ---------------------------------------------------------------------------------------- |
| `Images`    | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`, `.ico`                         |
| `Videos`    | `.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.mkv`, `.webm`, `.m4v`                          |
| `Audio`     | `.mp3`, `.wav`, `.flac`, `.aac`, `.ogg`, `.wma`, `.m4a`                                  |
| `Documents` | `.pdf`, `.doc`, `.docx`, `.txt`, `.rtf`, `.odt`, `.xls`, `.xlsx`, `.ppt`, `.pptx`        |
| `Archives`  | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz`                                      |
| `Code`      | `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.cs`, `.go`, `.rs`, `.php`, `.html`, `.css` |
| `Others`    | All other files                                                                          |

**Custom Rules:**

```typescript
interface MediaRules {
  [folderName: string]: readonly string[];
}
```

**Returns:**

```typescript
interface OperationStats {
  scanned: number; // Total files scanned
  moved: number; // Files moved successfully
  skipped: number; // Files already in correct location
  errors: WalkError[]; // Errors encountered
}
```

**Examples:**

```typescript
// Basic organization with default rules
const stats = await arrange("/messy/downloads");
console.log(`Organized ${stats.moved} files into folders`);

// Dry run - preview changes
const preview = await arrange("/messy/downloads", {
  dryRun: true,
  log: true,
});
console.log(`Would move ${preview.moved} files`);

// Custom folder rules
const custom = await arrange("/my/files", {
  rules: {
    // rules should not contain dots(.)
    Projects: ["psd", "ai", "sketch", "fig"],
    Databases: ["db", "sqlite", "sql"],
    Config: ["json", "yaml", "yml", "toml", "ini"],
  },
});

// Real-time progress
await arrange("/downloads", {
  log: true,
  onMove: (move, stats) => {
    console.log(
      `[${stats.moved}/${stats.scanned}] ${move.file} → ${move.dest}`
    );
  },
});

// Override default rules (move .js to Scripts instead of Code)
await arrange("/files", {
  rules: {
    Scripts: ["js", "mjs", "sh", "bat", "ps1"],
  },
});
```

**How Custom Rules Work:**

1. **Override System Rules**: When you specify an extension in custom rules, it's removed from all default folders
2. **Fallback to Others**: Files without matching rules go to "Others" folder
3. **Case Insensitive**: Extensions are matched case-insensitively
4. **No Duplicates**: Each extension can only belong to one folder

---

### 🧹 Empty File Cleanup

Find and remove files with 0 bytes size.

#### `findEmptyFiles(root: string, options?: FindEmptyOptions): Promise<FindEmptyResult>`

**Parameters:**

| Parameter | Type               | Description                      |
| --------- | ------------------ | -------------------------------- |
| `root`    | `string`           | Root directory to scan           |
| `options` | `FindEmptyOptions` | Configuration options (optional) |

**Options:**

```typescript
interface FindEmptyOptions {
  deleteEmpty?: boolean; // Delete instead of just finding
  dryRun?: boolean; // Preview deletions
  onEmptyFile?: (file, deleted) => void; // Callback when empty file found
  onError?: (file, error) => void; // Callback on error
  getFiles?: boolean; // option to get files path and size
}
```

**Returns:**

```typescript
interface FindEmptyResult {
  scanned: number;      // Total files scanned
  empty: number;   // Empty files found
  deleted: number;      // Files deleted
  errors: WalkError[];  // Errors encountered
  files: <"fullPath" |"dir" |"size">[]  // return files for view
}
```

**Examples:**

```typescript
// Find empty files without deleting
const found = await findEmptyFiles("/path/to/check");
console.log(`Found ${found.empty} empty files`);

// Delete empty files
const deleted = await findEmptyFiles("/path/to/clean", {
  deleteEmpty: true,
});
console.log(`Removed ${deleted.deleted} empty files`);

// Dry run - preview what would be deleted
const preview = await findEmptyFiles("/path/to/clean", {
  deleteEmpty: true,
  dryRun: true,
});
console.log(`Would delete ${preview.deleted} empty files`);

// Real-time feedback
await findEmptyFiles("/path", {
  deleteEmpty: true,
  onEmptyFile: (file, deleted) => {
    console.log(`${deleted ? "✓ Deleted" : "○ Found"}: ${file}`);
  },
  onError: (file, error) => {
    console.error(`✗ Failed: ${file} - ${error.message}`);
  },
});
```

---

### 📦 Large File Detection

Find files that exceed a specified size threshold, useful for identifying space hogs.

#### `findLargeFiles(root: string, minSizeMB?: number, limit?: number): Promise<LargeFinderState>`

**Parameters:**

| Parameter   | Type     | Default | Description                       |
| ----------- | -------- | ------- | --------------------------------- |
| `root`      | `string` | -       | Root directory to scan            |
| `minSizeMB` | `number` | `500`   | Minimum file size in MB           |
| `limit`     | `number` | `10`    | Maximum number of files to return |

**Returns:**

```typescript
interface LargeFinderState {
  limit: number; // Maximum files requested
  matched: number; // Total files matching criteria
  filesPath: LargeFile[]; // Array of large files found
  errors?: FileError[]; // Errors encountered
}

interface LargeFile {
  path: string; // Full file path
  sizeMB: string; // Human-readable size (e.g., "1.5 GB")
  sizeBytes: number; // Size in bytes
}
```

**Examples:**

```typescript
// Find top 10 files larger than 500MB (defaults)
const result = await findLargeFiles("/path/to/scan");
console.log(`Found ${result.matched} large files`);
result.filesPath.forEach((file) => {
  console.log(`${file.path}: ${file.sizeMB}`);
});

// Find top 20 files larger than 100MB
const custom = await findLargeFiles("/path/to/scan", 100, 20);
console.log(`Top 20 files over 100MB:`);
custom.filesPath.forEach((file, i) => {
  console.log(`${i + 1}. ${file.path} - ${file.sizeMB}`);
});

// Find all files larger than 1GB
const huge = await findLargeFiles("/videos", 1024, 100);
console.log(`Found ${huge.matched} files over 1GB`);
console.log(`Showing top ${huge.filesPath.length}`);

// Calculate total size of large files
const large = await findLargeFiles("/downloads", 50);
const totalGB =
  large.filesPath.reduce((sum, f) => sum + f.sizeBytes, 0) / 1024 ** 3;
console.log(`Large files occupy ${totalGB.toFixed(2)} GB`);
```

---

### 🗄️ File Archiving

Automatically move old files to an archive directory based on modification time.

#### `archive(root: string, options: ArchiveOptions): Promise<ArchiveResult>`

**Parameters:**

| Parameter | Type             | Description                          |
| --------- | ---------------- | ------------------------------------ |
| `root`    | `string`         | Root directory to scan for old files |
| `options` | `ArchiveOptions` | Archive configuration                |

**Options:**

```typescript
interface ArchiveOptions {
  archivePath: string; // Destination archive directory
  durationDays: number; // Files older than this (in days) will be archived
  dryRun?: boolean; // Preview without moving files
  log?: boolean; // Enable logging
  onArchive?: (src: string, dest: string) => void; // Callback on archive
}
```

**Returns:**

```typescript
interface ArchiveResult {
  scanned: number; // Total files scanned
  archived: number; // Files moved to archive
  archivedSize: string; // Total size archived (formatted)
  errors: FileError[]; // Errors encountered
}
```

**Examples:**

```typescript
// Archive files older than 90 days
const result = await archive("/documents", {
  archivePath: "/archive/old-docs",
  durationDays: 90,
});
console.log(`Archived ${result.archived} files (${result.archivedSize})`);

// Dry run - preview what would be archived
const preview = await archive("/logs", {
  archivePath: "/archive/logs",
  durationDays: 30,
  dryRun: true,
});
console.log(
  `Would archive ${preview.archived} files (${preview.archivedSize})`
);

// Archive with logging enabled
const logged = await archive("/temp", {
  archivePath: "/archive/temp",
  durationDays: 7,
  log: true,
});

// Archive with progress tracking
await archive("/data", {
  archivePath: "/archive/data",
  durationDays: 365,
  onArchive: (src, dest) => {
    console.log(`Archived: ${src} → ${dest}`);
  },
});

// Handle errors gracefully
const archiveResult = await archive("/project", {
  archivePath: "/backup/project",
  durationDays: 180,
});

if (archiveResult.errors.length > 0) {
  console.log(`⚠️  ${archiveResult.errors.length} files failed to archive:`);
  archiveResult.errors.forEach((err) => {
    console.log(`  ${err.file}: ${err.error}`);
  });
}
console.log(`✓ Successfully archived ${archiveResult.archived} files`);
```

**Age Calculation:**

Files are considered "old" based on their **last modification time (mtime)**:

```typescript
// Archive files not modified in the last 90 days
await archive("/data", {
  archivePath: "/archive",
  durationDays: 90,
});

// Archive files older than 1 year
await archive("/documents", {
  archivePath: "/archive/documents",
  durationDays: 365,
});

// Archive files older than 1 week
await archive("/temp", {
  archivePath: "/archive/temp",
  durationDays: 7,
});
```

---

## 🔧 Advanced Usage

### Combining Operations

```typescript
// Complete cleanup workflow
async function cleanupDirectory(path: string) {
  console.log("Step 1: Finding large files...");
  const large = await findLargeFiles(path, 1000);
  console.log(`✓ Found ${large.matched} files over 1GB`);

  console.log("\nStep 2: Removing empty files...");
  const empty = await findEmptyFiles(path, { deleteEmpty: true });
  console.log(`✓ Removed ${empty.deleted} empty files`);

  console.log("\nStep 3: Finding duplicates...");
  const dupes = await dedupe(path, {
    strategy: "newest",
    ignorePatterns: ["node_modules", ".git"],
  });
  console.log(`✓ Removed ${dupes.filesDeleted} duplicates`);
  console.log(`✓ Saved ${(dupes.spaceSaved / 1024 / 1024).toFixed(2)} MB`);

  console.log("\nStep 4: Archiving old files...");
  const archived = await archive(path, {
    archivePath: `${path}/archive`,
    durationDays: 180,
  });
  console.log(
    `✓ Archived ${archived.archived} old files (${archived.archivedSize})`
  );

  console.log("\nStep 5: Organizing files...");
  const organized = await arrange(path);
  console.log(`✓ Organized ${organized.moved} files`);

  console.log("\n🎉 Cleanup complete!");
}

cleanupDirectory("/messy/folder");
```

### Error Handling

```typescript
// Proper error handling
try {
  const result = await dedupe("/path/to/files", {
    strategy: "newest",
    onError: (file, error) => {
      // Handle individual file errors
      console.error(`Warning: ${file.fullPath} - ${error.message}`);
    },
  });

  // Check for errors in result
  if (result.errors.length > 0) {
    console.log(`\nEncountered ${result.errors.length} errors:`);
    result.errors.forEach((err) => {
      console.log(`  ${err.path}: ${err.error}`);
    });
  }

  console.log(`Success: Deleted ${result.filesDeleted} files`);
} catch (error) {
  // Fatal errors (invalid path, permissions, etc.)
  console.error("Operation failed:", error.message);
}
```

### Progress Tracking

```typescript
// Build a progress UI
let processed = 0;
const result = await dedupe("/large/directory", {
  onDuplicate: (canonical, duplicates) => {
    processed += duplicates.length;
    console.log(`Progress: ${processed} duplicates found`);
    console.log(`  Keeping: ${canonical.fullPath}`);
    duplicates.forEach((dup) => {
      console.log(`  Removing: ${dup.fullPath}`);
    });
  },
});
```

---

## 📊 Performance

### Optimization Strategies

**Deduplication:**

- Files are grouped by size before hashing (only hash potential duplicates)
- SHA-256 streaming hash (handles large files efficiently)
- Memory-efficient file processing (no full file loading)

**Organization:**

- Single-pass directory scan
- Pre-creates destination folders (reduces mkdir calls)
- Path normalization prevents duplicate processing

**Empty Files:**

- Size check from file stats (no content reading)
- Batch processing with minimal I/O

**Large Files:**

- Size filtering from file stats (fast lookup)
- Sorted results by size
- Memory-efficient processing

**Archive:**

- Single-pass directory scan
- mtime comparison (fast date checks)
- Atomic file moves

---

## 🛡️ Error Handling

All functions follow a consistent error handling pattern:

### Fatal Errors (Throws)

- Invalid root path
- Path is not a directory
- Permission denied on root
- Rule validation errors

### Non-Fatal Errors (Captured in result)

- Individual file access denied
- File locked/in use
- Disk full during move
- Network path timeout

### Example:

```typescript
try {
  const result = await dedupe("/path", { strategy: "newest" });

  // Operation completed, check for partial failures
  if (result.errors.length > 0) {
    console.log("Some files failed:");
    result.errors.forEach((err) => console.log(`  ${err.path}: ${err.error}`));
  }

  console.log(`Success: ${result.filesDeleted} files deleted`);
} catch (error) {
  // Fatal error - operation couldn't start or complete
  console.error("Operation failed:", error.message);
}
```

---

## 🔒 Safety Features

### Dry Run Mode

Test operations without making changes:

```typescript
const preview = await dedupe("/important/files", { dryRun: true });
console.log(`Would delete ${preview.filesDeleted} files`);
// Nothing was actually deleted
```

### Validation

All operations validate inputs before execution:

- Path existence check
- Directory verification
- Permission validation
- Rule conflict detection

### Atomic Operations

- File moves are atomic (rename when possible)
- Failed operations don't leave partial state
- Errors are isolated (one file failure doesn't stop others)

---

## 📝 Type Definitions

### Core Types

```typescript
interface FileNode {
  fullPath: string;
  name: string;
  ext: string;
  size: number;
  dir: string;
  mtime?: Date;
}

interface WalkError {
  path: string;
  error: string;
}

interface WalkResult {
  files: FileNode[];
  errors: WalkError[];
}

type MediaRules = Record<string, readonly string[]>;

type DedupeStrategy =
  | "canonical"
  | "oldest"
  | "newest"
  | "shortest-path"
  | "longest-path"
  | "first";

interface LargeFile {
  path: string;
  sizeMB: string;
  sizeBytes: number;
}

interface LargeFinderState {
  limit: number;
  matched: number;
  filesPath: LargeFile[];
  errors?: FileError[];
}

interface ArchiveOptions {
  archivePath: string;
  durationDays: number;
  dryRun?: boolean;
  log?: boolean;
  onArchive?: (src: string, dest: string) => void;
}

interface ArchiveResult {
  scanned: number;
  archived: number;
  archivedSize: string;
  errors: FileError[];
}
```

---

## 🎯 Use Cases

### Photo Library Cleanup

```typescript
// Remove duplicate photos, keep highest quality
await dedupe("/Photos", {
  strategy: "longest-path", // Assumes full-res in deeper folders
  ignorePatterns: ["*.thumbs", "*.cache"],
});
```

### Download Folder Organization

```typescript
// Auto-organize messy downloads
await arrange("/Downloads", {
  rules: {
    Screenshots: ["png"],
    Installers: ["exe", "dmg", "pkg"],
    EBooks: ["epub", "mobi", "pdf"],
  },
});
```

### Project Cleanup

```typescript
// Clean up development folders
await dedupe("/Projects", {
  strategy: "newest",
  ignorePatterns: ["node_modules", ".git", "dist", "build", "*.log"],
});

await findEmptyFiles("/Projects", {
  deleteEmpty: true,
});
```

### Backup Deduplication

```typescript
// Remove duplicate backups, keep oldest
await dedupe("/Backups", {
  strategy: "oldest",
  onDuplicate: (canonical, duplicates) => {
    // Log for audit trail
    logToFile(
      `Keeping ${canonical.fullPath}, removing ${duplicates.length} duplicates`
    );
  },
});
```

### Disk Space Analysis

```typescript
// Analyze what's taking up space
async function analyzeDiskUsage(path: string) {
  console.log("Disk Space Analysis\n");

  // Find largest files
  const large = await findLargeFiles(path, 50, 50);
  const largeSize = large.filesPath.reduce((sum, f) => sum + f.sizeBytes, 0);
  console.log(
    `Large files (>50MB): ${large.matched} files, ${(
      largeSize /
      1024 ** 3
    ).toFixed(2)} GB`
  );

  // Find duplicates
  const dupes = await dedupe(path, { dryRun: true });
  console.log(
    `Duplicate files: ${dupes.filesDeleted} files, ${(
      dupes.spaceSaved /
      1024 ** 2
    ).toFixed(2)} MB`
  );

  // Find old files
  const old = await archive(path, {
    archivePath: "/tmp/archive",
    durationDays: 180,
    dryRun: true,
  });
  console.log(
    `Old files (>180 days): ${old.archived} files, ${old.archivedSize}`
  );

  // Find empty files
  const empty = await findEmptyFiles(path);
  console.log(`Empty files: ${empty.empty} files`);
}

await analyzeDiskUsage("/home/user");
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
git clone https://github.com/neuro-tx/file-aranger.git
cd file-aranger
npm install
```

---

## 📄 License

MIT © **_neuro-tx_**

---

## 🙏 Acknowledgments

Built with ❤️ using:

- Node.js built-in modules (fs, crypto, path)
- TypeScript for type safety
- SHA-256 for reliable content hashing

---

**Made with 💪 by developers, for developers**
