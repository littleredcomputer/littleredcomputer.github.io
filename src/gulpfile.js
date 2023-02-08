var gulp = require('gulp')
var ts = require('gulp-typescript')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var babelify = require('babelify')

function tsc() {
  return gulp.src('*.ts')
    .pipe(ts({
      noImplicitAny: true,
      target: 'es2015',
      module: "CommonJS",
      moduleResolution: 'node'
    }))
    .pipe(gulp.dest('dist'))
}
exports.tsc = tsc

function make_bundle(name, app, deps) {
  return browserify({ standalone: 's' })
    .transform(babelify, { global: true })
    .add([app].concat(deps))
    .bundle()
    .pipe(source(name))
    .pipe(gulp.dest('../public/js'))
}

exports.odex_demo = odex_demo = () => make_bundle('odexdemo.js', 'dist/odex-demo.js', ['dist/graph.js'])
exports.sicm_demo = sicm_demo = () => make_bundle('sicmdemo.js', 'dist/sicm.js', ['dist/graph.js'])

exports.default = gulp.series(
  tsc,
  gulp.parallel(odex_demo, sicm_demo)
)
