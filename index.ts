import { arrange, flatten } from "./src";

async function name() {
  await arrange("D:/test", {
    dryRun: true,
    log: true,
  });

  await flatten("D:/test", {
    deleteEmpty: true,
  });
}

name();
