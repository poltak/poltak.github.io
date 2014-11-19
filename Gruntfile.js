module.exports = function(grunt) {
  grunt.initConfig({
    pkg:    grunt.file.readJSON('package.json'),

    concat: {
      js: {
        src: ['assets/js/*.js'],
        dest: 'assets/js/build/production.js',
      },
    },

    uglify: {
      options: {
        mangle: true,
        preserveComments: false,
        compress: true,
      },
      dist: {
        src:  'assets/js/build/production.js',
        dest: 'assets/js/build/production.min.js',
      },
    },

    imagemin: {
      dynamic: {
        files: [{
          expand: true,
          cwd: 'assets/img/',
          src: ['**/*.{png,jpg,gif}'],
          dest: 'assets/img/build/'
        }]
      }
    },
  });

  // All the plugins we want to use
  var plugins = [
    'concat',
    'uglify',
    'imagemin',
    'watch',
  ];

  // Load all the plugins
  plugins.forEach(function(plugin) {
    grunt.loadNpmTasks('grunt-contrib-' + plugin);
  });

  // Register all of the plugins
  grunt.registerTask('default', plugins);
};