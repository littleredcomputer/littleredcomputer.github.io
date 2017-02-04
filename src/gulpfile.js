var gulp = require('gulp')
var browserify = require('browserify')
var streamify = require('gulp-streamify')
var rename = require('gulp-rename')
var source = require('vinyl-source-stream')
var tsify = require('tsify')
var uglify = require('gulp-uglify')

args = {
  src: '.',
  dest: '../public/js'
}

function bundle_ts(f, s) {
  browserify({debug: true, standalone: s})
    .add(args.src + '/' + f + '.ts')
    .plugin(tsify, {global: true})
    .bundle()
    .pipe(source(f + '.bundle.js'))
    .pipe(gulp.dest(args.dest))
    .pipe(streamify(uglify()))
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest(args.dest));
}

gulp.task('bundle', function () {
  bundle_ts('odex-demo', 'odexdemo')
  bundle_ts('standard-map', 's')
})

gulp.task('default', ['bundle'])
