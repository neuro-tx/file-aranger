import { formatSize } from "./helper";
import { OperationStats } from "./types";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const colors = {
  green: "\x1b[32m",
  brightGreen: "\x1b[92m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

const ARROW = "➜";

const log = {
  dryRun(src: string, dest: string) {
    console.log(
      `${colors.yellow}${BOLD}[DryRun]${RESET} ` +
        `${colors.cyan}move${RESET} ` +
        `${src}${RESET} ${ARROW} ` +
        `${colors.green}${dest}${RESET}`
    );
  },

  success(src: string, dest: string) {
    console.log(
      `${colors.brightGreen}${BOLD}[Success]${RESET} ` +
        `${DIM}${src}${RESET} ${ARROW} ` +
        `${colors.yellow}${BOLD}${dest}${RESET}`
    );
  },

  skipped(src: string) {
    console.log(`${colors.blue}[Skip]${RESET} ${DIM}${src}${RESET}`);
  },

  onMove(move: { file: string; dest: string }, stats: OperationStats) {
    console.log(
      `${colors.cyan}${BOLD}[${stats.moved}/${stats.scanned}]${RESET} ` +
        `${DIM}${move.file}${RESET} ${ARROW} ` +
        `${colors.green}${BOLD}${move.dest}${RESET}`
    );
  },

  info(message: string) {
    console.log(`${colors.yellow}[INFO]${RESET} ${message}`);
  },

  error(src: string, dest: string, err: unknown) {
    console.error(
      `${colors.red}${BOLD}[Error]${RESET} Move failed\n` +
        `  ${DIM}${src}${RESET} ${ARROW} ${colors.red}${dest}${RESET}\n` +
        `  ${colors.red}${(err as Error)?.message ?? err}${RESET}`
    );
  },

  fatal(err: unknown) {
    console.error(
      `${colors.red}${BOLD}[Fatal]${RESET} Arrange process failed\n` +
        `  ${colors.red}${(err as Error)?.message ?? err}${RESET}`
    );
  },

  warn(message: string) {
    console.warn(`${colors.yellow}[WARN]${RESET} ${message}`);
  },

  errorMessage(message: string) {
    console.error(`${colors.red}${BOLD}[Error]${RESET} ${message}`);
  },

  hashing(file: string) {
    console.log(`${colors.magenta}[Hash]${RESET} ${DIM}${file}${RESET}`);
  },

  duplicateGroup(count: number) {
    console.log(
      `${colors.yellow}${BOLD}[Duplicate]${RESET} ` +
        `${count} identical files found`
    );
  },

  canonical(file: string) {
    console.log(`${colors.blue}${BOLD}[Keep]${RESET} ${colors.magenta}${file}${RESET}`);
  },

  deleted(file: string, size?: number) {
    console.log(
      `${colors.red}[Delete]${RESET} ${DIM}${file}${RESET}` +
        (size ? ` ${colors.gray}(${formatSize(size)})${RESET}` : "")
    );
  },

  deleteDryRun(file: string) {
    console.log(
      `${colors.yellow}[DryRun]${RESET} delete ${DIM}${file}${RESET}`
    );
  },

  dedupeSummary(files: number, savedBytes: number) {
    console.log(
      `${colors.brightGreen}${BOLD}[Done]${RESET} ` +
        `${files} files removed, ` +
        `${colors.green}${formatSize(savedBytes)} saved${RESET}`
    );
  },
};

export function resolveLogger(enabled?: boolean) {
  if (!enabled) return undefined;
  return log;
}
