var gulp = require('gulp')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var tsify = require('tsify')

args = {
  src: 'js/',
  dest: '../public/js'
}

function bundle_ts(f, s) {
  browserify({debug: true, standalone: s})
    .add(args.src + f + '.ts')
    .plugin(tsify, {global: true})
    .bundle()
    .pipe(source(f + '.bundle.js'))
    .pipe(gulp.dest(args.dest));
}

gulp.task('bundle', function () {
  // bundle with dependencies
  bundle_ts('odex-demo', 'odexdemo')
  bundle_ts('standard-map', 's')
})

gulp.task('default', ['bundle'])
