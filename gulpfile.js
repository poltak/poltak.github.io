var gulp = require('gulp');

// Constants
var CSS_FILES_INPUT_PATH = 'assets/css/src/**/*.+(scss|css)';
var CSS_FILES_OUTPUT_PATH = 'assets/css/build/';
var FINAL_CSS_FILE = 'master.min.css';


gulp.task('styles', function() {
  var sass       = require('gulp-sass');
  var postcss    = require('gulp-postcss');
  var sourcemaps = require('gulp-sourcemaps');
  var cssnano    = require('gulp-cssnano');
  var concat     = require('gulp-concat');

  gulp.src(CSS_FILES_INPUT_PATH)
      .pipe( sass().on('error', sass.logError) )
      .pipe( postcss([ require('autoprefixer'), require('precss') ]) )
      .pipe( cssnano() )
      .pipe( concat(FINAL_CSS_FILE) )
      .pipe( gulp.dest(CSS_FILES_OUTPUT_PATH) );
});

// Watch task
gulp.task('default', function() {
  gulp.watch(CSS_FILES_INPUT_PATH, ['styles']);
});
