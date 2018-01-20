module.exports = function(grunt) {

    var pkg = grunt.file.readJSON("package.json"),
        core = [
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
        ],
        bundle = [
            "./node_modules/eve/eve.js",
            // the following splice injects files here
            "./src/banner.js",
            "./src/footer.js"
        ],
        slimBundle = [
            // the following splice injects files here
            "./src/banner.js",
            "./src/footer.js"
        ];;

    bundle.splice(2, 0, core);
    slimBundle.splice(1, 0, core);

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: pkg,
        banner: grunt.file.read("./src/copy.js")
            .replace(/@VERSION/, pkg.version)
            .replace(/@DATE/, grunt.template.today("yyyy-mm-dd")) + "\n",
        // Task configuration.
        uglify: {
            options: {
                banner: "<%= banner %>",
                report: "min"
            },
            dist: {
                src: "<%= concat.target.dest %>",
                dest: "dist/snap.svg.min.js"
            },
            'dist.slim': {
                src: "<%= concat.slim.dest %>",
                dest: "dist/snap.svg.slim.min.js"
            }
        },
        concat: {
            options: {
                banner: "<%= banner %>"
            },
            target: {
                dest: "dist/snap.svg.js",
                src: bundle,
            },
            /**
             * The slim bundle excludes dependencies, such as eve
             */
            slim: {
                dest: "dist/snap.svg.slim.js",
                src: slimBundle,
            }
        },
        exec: {
            dr: {
              command: "node node_modules/dr.js/dr dr.json"
            },
            test: {
              command: "cd test; phantomjs test.js"
            },
            eslint: {
                command: "./node_modules/eslint/bin/eslint.js " + core.join(" ")
            },
        },
        prettify: {
            options: {
                indent: 4,
                indent_char: " ",
                wrap_line_length: 80,
                brace_style: "expand",
                unformatted: ["code", "pre", "script"]
            },
            one: {
                src: "./doc/reference.html",
                dest: "./doc/reference.html"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-prettify");

    grunt.registerTask("default", ["exec:eslint", "concat", "uglify", "exec:dr", "prettify"]);
    grunt.registerTask("lint", ["exec:eslint"]);
    grunt.registerTask("test", ["exec:test"]);
};
