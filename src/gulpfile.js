'use strict'

var browserify = require('browserify')
var gulp = require('gulp')
// var ts = require('gulp-typescript')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
// var gutil = require('gulp-util')
// var uglify = require('gulp-uglify')
var sourcemaps = require('gulp-sourcemaps')

function make_bundle (src, name) {
  browserify({
    entries: src,
    standalone: name
  }).bundle()
      .pipe(source(src.replace(/\.js$/, '-bundle.js')))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('../public'))
}

// gulp.task('ts', function () {
//   return gulp.src('js/foo.ts')
//   .pipe(ts({
//     noImplicitAny: true,
//     out: 'foo.js'
//   }))
//   .pipe(gulp.dest('../public'))
// })

gulp.task('default', function () {
  make_bundle('./js/odex-demo.js', 'odexdemo')
})
