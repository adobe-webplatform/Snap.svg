const { spawn } = require('child_process');

let core = [
    "./src/mina.js",
    "./src/svg.js",
    "./src/element.js",
    "./src/animation.js",
    "./src/matrix.js",
    "./src/attr.js",
    "./src/class.js",
    "./src/attradd.js",
    "./src/paper.js",
    "./src/path.js",
    "./src/set.js",
    "./src/equal.js",
    "./src/mouse.js",
    "./src/filter.js",
    "./src/align.js",
    "./src/colors.js",
];

const proc = spawn("node", ["node_modules/eslint/bin/eslint.js"]
    .concat(core, [" --fix"]));

proc.stdout.on('data', (data) => {
    console.log(data);
});

proc.stderr.on('data', (data) => {
    console.error(data);
});

proc.on('close', (code) => {
    console.log("Exit code: " + code + ".");
});

// This script is equivalent to this command line command:
// node node_modules/eslint/bin/eslint.js ./src/mina.js ./src/svg.js ./src/element.js ./src/animation.js ./src/matrix.js ./src/attr.js ./src/class.js ./src/attradd.js ./src/paper.js ./src/path.js ./src/set.js ./src/equal.js ./src/mouse.js ./src/filter.js ./src/align.js ./src/colors.js --fix
