'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('javascript', function() {
  // var b = browserify({
  //   entries: './js/odex-demo.js',
  //   debug: true
  // });
  gutil.log('here');
  browserify({
    entries: './js/odex-demo.js',
    standalone: 'odexdemo'
  })
      .bundle()
      .pipe(source('odex-demo-bundle.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('../public/js'));
});
