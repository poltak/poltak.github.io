/* eslint import/no-extraneous-dependencies: 0, import/no-unresolved: 0, global-require: 0 */
const gulp = require('gulp');
const cache = require('gulp-cache');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');

// CSS Stuff
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const cssnano = require('gulp-cssnano');
const postcssPlugins = [require('autoprefixer'), require('precss')];

// JS Stuff
const uglify = require('gulp-uglify');

// Image stuff
const imagemin = require('gulp-imagemin');

// Paths
const config = {
  css: {
    input: 'assets/css/src/**/*.+(scss|css)',
    output: 'assets/css/build/',
    bundle: 'master.min.css',
  },
  js: {
    input: 'assets/js/src/**/*.js',
    output: 'assets/js/build/',
    bundle: 'master.min.js',
  },
  img: {
    input: 'assets/img/src/**/*.+(jpg|png|gif|svg)',
    output: 'assets/img/build/',
  },
};

// Task to handle concat and minification of CSS
gulp.task('css', () => gulp.src(config.css.input)
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss(postcssPlugins))
  .pipe(cssnano())
  .pipe(concat(config.css.bundle))
  .pipe(gulp.dest(config.css.output)));

// Task to handle concat and minifcation of JS
gulp.task('js', () => gulp.src(config.js.input)
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(concat(config.js.bundle))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest(config.js.output)));

// Task to handle compressing of images
gulp.task('images', () => gulp.src(config.img.input)
  .pipe(cache(imagemin()))
  .pipe(gulp.dest(config.img.output)));

// Default watch task for all above tasks
gulp.task('default', () => {
  gulp.watch(config.css.input, ['css']);
  gulp.watch(config.js.input, ['js']);
  gulp.watch(config.img.input, ['images']);
});
