'use strict';

var exec = require('child_process').exec;

module.exports = function(grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-execute');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/.js']
      }
    },
    jshint: {
      // define the files to lint
      files: ['test/*.js','public/js/*.js','!public/js/bundle.js'],
      // configure JSHint (documented at http://www.js.jshint.com/docs/)
      options: {
        // more options here if you want to override JSHint defaults
        globalstrict : true,
        node : true,
        mocha : true,
        globals: {
          console: true,
          window: true,
          alert: true,
          $ : true
        }
      }
    },
    watch : {
      files: ['!.git/**','!node_modules/**'],
      js : {
        files: ['Gruntfile.js', './public/js/*.js','./lib/*.js'],
        tasks: ['jshint']
      }
     },
    execute: {
      target: {
        options : {
          cwd : '.'
        },
        src: ['app.js']
      }
    }
  });

  grunt.event.on('watch',function(action,filepath,target) {
    grunt.log.writeln(target + ':' + filepath + ':' + action);
  });

  grunt.registerTask('default', ['jshint','execute']);

};