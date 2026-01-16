import { arrange, flatten } from "./src";
import { log } from "./utils/logger";

async function name() {
  await arrange("D:/test", {
    dryRun: false,
    onMove(move, stats) {
      log.onMove(move, stats);
    },
  });

  await flatten("D:/test", {
    deleteEmpty: true,
    conflict: "overwrite",
  });
}

name();
