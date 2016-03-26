// Global plugins
var gulp        = require('gulp');
var cache       = require('gulp-cache');
var concat      = require('gulp-concat');
var sourcemaps  = require('gulp-sourcemaps');


// Constants
var CSS_FILES_INPUT_PATH    = 'assets/css/src/**/*.+(scss|css)';
var CSS_FILES_OUTPUT_PATH   = 'assets/css/build/';
var JS_FILES_INPUT_PATH     = 'assets/js/src/**/*.js';
var JS_FILES_OUTPUT_PATH    = 'assets/js/build/';
var IMAGE_FILES_INPUT_PATH  = 'assets/img/src/**/*.+(jpg|png|gif|svg)';
var IMAGE_FILES_OUTPUT_PATH = 'assets/img/build/';
var FINAL_CSS_FILE          = 'master.min.css';
var FINAL_JS_FILE           = 'master.min.js';


// Task to handle concat and minification of CSS
gulp.task('css', function() {
  var sass       = require('gulp-sass');
  var postcss    = require('gulp-postcss');
  var cssnano    = require('gulp-cssnano');

  return gulp.src(CSS_FILES_INPUT_PATH)
             .pipe( sass().on('error', sass.logError) )
             .pipe( postcss([ require('autoprefixer'), require('precss') ]) )
             .pipe( cssnano() )
             .pipe( concat(FINAL_CSS_FILE) )
             .pipe( gulp.dest(CSS_FILES_OUTPUT_PATH) );
});


// Task to handle concat and minifcation of JS
gulp.task('js', function() {
  var uglify = require('gulp-uglify');

  return gulp.src(JS_FILES_INPUT_PATH)
             .pipe( sourcemaps.init() )
             .pipe( uglify() )
             .pipe( concat(FINAL_JS_FILE) )
             .pipe( sourcemaps.write() )
             .pipe( gulp.dest(JS_FILES_OUTPUT_PATH) );
});


// Task to handle compressing of images
gulp.task('images', function() {
  var imagemin = require('gulp-imagemin');

  return gulp.src(IMAGE_FILES_INPUT_PATH)
             .pipe( cache(imagemin()) )
             .pipe( gulp.dest(IMAGE_FILES_OUTPUT_PATH) );
});


// Default watch task for all above tasks
gulp.task('default', function() {
  gulp.watch(CSS_FILES_INPUT_PATH, ['css']);
  gulp.watch(JS_FILES_INPUT_PATH, ['js']);
  gulp.watch(IMAGE_FILES_INPUT_PATH, ['images']);
});
