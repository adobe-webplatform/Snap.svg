module.exports = function(grunt) {

    var pkg = grunt.file.readJSON("package.json");

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
                    "./node_modules/eve/eve.js",
                    "./src/mina.js",
                    "./node_modules/elemental.js/elemental.js",
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
    
    // Run 'grunt --requirejs' for AMD/requirejs compatible build
    if (grunt.option("requirejs")) {
        var concat = grunt.config("concat");
        
        // Include eve in banner, wrap savage in define function
        concat.options.banner += "\n"
            + grunt.file.read("./node_modules/eve/eve.js")
            + ' define(["eve"], function(eve) {';
        concat.options.footer = "\n return Savage; \n });";
        
        // Remove eve from src list
        var first = concat.target.src.shift();
        if(first.indexOf("/eve.js") < 0) {
            throw Error("Expected first file to be eve.js for requirejs build");
        }
        
        grunt.config("concat", concat);
    }

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["concat", "uglify"]);
};