// A test weback configuration to make sure snap.svg can be bundled
var path = require('path');
module.exports = {
    entry: "./test/webpackentry.js",
    output: {
        filename: "./.tmp/test-bundle.js",
    },
    devServer: {
        contentBase: ".",
        historyApiFallback: {
            index: "test/test.html",
        },
    },
    resolve: {
        alias: {
            "snapsvg": path.join(__dirname, "dist/snap.svg.slim.js"),
        },
    },
};