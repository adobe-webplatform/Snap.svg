module.exports = function(grunt) {

    var pkg = grunt.file.readJSON("package.json");

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: pkg,
        banner: grunt.file.read("copy.js")
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
                dest: "dist/" + pkg.name.toLowerCase() + "-min.js"
            }
        },
        concat: {
            options: {
                banner: "<%= banner %>"
            },
            target: {
                dest: "dist/" + pkg.name.toLowerCase() + ".js",
                src: [
                    "./third-party/eve/eve.js",
                    "./src/mina.js",
                    "./third-party/elemental.js",
                    "./src/svg.js",
                    "./src/path.js",
                    "./src/set.js",
                    "./src/equal.js",
                    "./src/mouse.js",
                    "./src/filter.js"
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["concat", "uglify"]);
};