var gulp = require('gulp')
var browserify = require('browserify')
var streamify = require('gulp-streamify')
var rename = require('gulp-rename')
var source = require('vinyl-source-stream')
var tsify = require('tsify')
var uglify = require('gulp-uglify')
var watch = require('gulp-watch')

args = {
  src: '.',
  dest: '../public/js'
}

function bundle_ts(f, s) {
  return browserify(args.src + '/' + f + '.ts', {debug: true, standalone: s})
    .plugin(tsify, {global: true})
    .bundle()
    .pipe(source(f + '.bundle.js'))
    .pipe(gulp.dest(args.dest))
    .pipe(streamify(uglify()))
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest(args.dest));
}

gulp.task('odex-bundle', function () {
  return bundle_ts('odex-demo', 'odexdemo')
})

gulp.task('standard-bundle', function () {
  return bundle_ts('standard-map', 's')
})

gulp.task('watch', function () {
  watch('odex-demo.ts', function () {
    gulp.start('odex-bundle')
  })
  watch('standard-map.ts', function () {
    gulp.start('standard-bundle')
  })
})

gulp.task('default', ['odex-bundle', 'standard-bundle'])

