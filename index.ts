import { arrange } from "./src";

async function name() {
  await arrange("D:/test/public", {
    dryRun: false,
    onMove(move, stats) {
      console.log(
        `[${stats.moved}/${stats.scanned}] ${move.file} → ${move.dest}`
      );
    },
  });
}

name();
