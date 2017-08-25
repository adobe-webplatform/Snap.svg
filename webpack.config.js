// A test weback configuration to make sure snap.svg can be bundled
var path = require("path");
module.exports = {
    entry: "./test/index.js",
    output: {
        filename: "./test-bundle.js",
    },
    devServer: {
        contentBase: ".",
        historyApiFallback: {
            index: "test/index.webpack.html",
        },
    },
    resolve: {
        alias: {
            "snapsvg": path.join(__dirname, "dist/snap.svg.slim.js"),
        },
    },
};