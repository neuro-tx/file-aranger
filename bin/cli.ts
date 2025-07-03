#!/usr/bin/env node
import { arange } from "../src/main";

const input = process.argv[2];

if (!input) {
  console.error("❌ Please provide a path to organize.");
  process.exit(1);
}

arange(input)
  .then(() => {
    console.log("✅ Done.");
  })
  .catch((err) => {
    console.error("❌ Failed to organize:", err);
  });
