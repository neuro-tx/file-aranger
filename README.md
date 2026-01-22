# 📁 File Operations

> A powerful, production-ready Node.js for advanced file system operations including deduplication, organization, and cleanup.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🔍 **Smart File Deduplication** - Find and remove duplicate files using SHA-256 hashing
- 📂 **Intelligent File Organization** - Auto-organize files into folders by type
- 🧹 **Empty File Cleanup** - Find and remove zero-byte files
- 💪 **TypeScript Native** - Full type safety and IntelliSense support
- 🎯 **Zero Dependencies** - Uses only Node.js built-in modules (crypto, fs, path)
- ⚡ **High Performance** - Optimized algorithms with size-based pre-filtering
- 🔒 **Safe Operations** - Dry-run mode, validation, and atomic operations

---

## 🚀 Quick Start

```typescript
import { dedupe, arrange, findEmptyFiles } from "./src";

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
    // rules sholud not contain dots(.)
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
    Scripts: [".js", ".mjs", ".sh", ".bat", ".ps1"],
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
console.log(`Found ${found.emptyFiles} empty files`);

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

## 🔧 Advanced Usage

### Combining Operations

```typescript
// Complete cleanup workflow
async function cleanupDirectory(path: string) {
  console.log("Step 1: Removing empty files...");
  const empty = await findEmptyFiles(path, { log: true, dryRun: false });
  console.log(`✓ Removed ${empty.deleted} empty files`);

  console.log("\nStep 2: Finding duplicates...");
  const dupes = await dedupe(path, {
    strategy: "newest",
    ignorePatterns: ["node_modules", ".git"],
  });
  console.log(`✓ Removed ${dupes.filesDeleted} duplicates`);
  console.log(`✓ Saved ${(dupes.spaceSaved / 1024 / 1024).toFixed(2)} MB`);

  console.log("\nStep 3: Organizing files...");
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
    Screenshots: [".png"],
    Installers: [".exe", ".dmg", ".pkg"],
    EBooks: [".epub", ".mobi", ".pdf"],
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
