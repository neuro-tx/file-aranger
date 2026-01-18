import { arrange, flatten } from "./src";

async function name() {
  await arrange("D:/test", {});

  await flatten("D:/test", {
    deleteEmpty: true,
  });
}

name();
