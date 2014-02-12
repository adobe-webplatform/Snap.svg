module.exports = function(grunt) {

    var pkg = grunt.file.readJSON("package.json");

    // Project configuration.
    grunt.initConfig({
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: './src/',
                        src: [
                            '*',
                            '!config.rb',
                            'js/vendor/require.min.js',
                            'js/vendor/modernizr.min.js'
                            ],
                        dest: './site/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: './src',
                        src: ['assets/**'],
                        dest: './site/'
                    }
                ]
            }
        },
        requirejs: {
            compile: {
                options: {
                    name: "main",
                    baseUrl: "./src/js/",
                    mainConfigFile: "./src/js/main.js",
                    out: "./site/js/main.js"
                }
            }
        },
        compass: {
            dist: {
                options: {
                    config: './src/config.rb',
                    sassDir: './src/sass',
                    cssDir: './site/css'
                }
            }
        },
        processhtml: {
            options: {
                // Task-specific options go here.
            },
            dist: {
                files: {
                    './site/index.html': ['./site/index.html']
                }
            }
        },
        inline: {
            dist: {
                src: ['./site/index.html'],
                dest: ['./site/index.min.html']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks("grunt-contrib-compass");
    grunt.loadNpmTasks("grunt-processhtml");
    grunt.loadNpmTasks("grunt-inline");

    grunt.registerTask("default", ["copy", "requirejs", "compass", "processhtml", "inline"]);
};