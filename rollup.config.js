import terser from "@rollup/plugin-terser";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
// Use a `/*! … */` legal comment so terser keeps it in the minified outputs
// (terser strips plain `//` comments by default).
const banner = `\
/*!
 * Snap.svg v${pkg.version}
 * Copyright (c) 2013 – 2025 Adobe Systems Incorporated. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 * https://www.apache.org/licenses/LICENSE-2.0
 */
`;

// Inject the package.json version into the source so `Snap.version` stays the
// single source of truth (the `__SNAP_VERSION__` placeholder lives in svg.js).
const injectVersion = {
  name: "inject-version",
  transform(code) {
    return code.includes("__SNAP_VERSION__")
      ? code.replace(/__SNAP_VERSION__/g, pkg.version)
      : null;
  },
};

export default [
  {
    input: "src/index.js",
    plugins: [injectVersion],
    output: [
      { file: "dist/snap.svg.esm.js", format: "es", banner },
      { file: "dist/snap.svg.esm.min.js", format: "es", plugins: [terser()], banner },
    ],
  },
  {
    input: "src/index.js",
    plugins: [injectVersion],
    output: [
      { file: "dist/snap.svg.js", format: "iife", name: "Snap", banner },
      { file: "dist/snap.svg.min.js", format: "iife", name: "Snap", plugins: [terser()], banner },
    ],
  },
];
