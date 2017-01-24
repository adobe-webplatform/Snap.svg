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
            "./src/colors.js"
        ],
        src = [
            "./node_modules/eve/eve.js",
            "./src/amd-banner.js",
            "./src/amd-footer.js"
        ];

    src.splice(2, 0, core);
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
                dest: "dist/snap.svg-min.js"
            }
        },
        concat: {
            options: {
                banner: "<%= banner %>"
            },
            target: {
                dest: "dist/snap.svg.js",
                src: src
            }
        },
        exec: {
            dr: {
              command: "node node_modules/dr.js/dr dr.json"
            },
            eslint: {
                command: "./node_modules/eslint/bin/eslint.js " + core.join(" ")
            },
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-exec");

    grunt.registerTask("default", ["exec:eslint", "concat", "uglify", "exec:dr"]);
    grunt.registerTask("lint", ["exec:eslint"]);
};
