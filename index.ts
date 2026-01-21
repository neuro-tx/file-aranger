import { arrange, flatten, dedupe } from "./src";

async function name() {
  await arrange("D:/test");
  await flatten("D:/test");
  await dedupe("D:/test");
}

name();
