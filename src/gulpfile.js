var browserify = require('browserify')
var gulp = require('gulp')
var ts = require('gulp-typescript')
var rename = require('gulp-rename')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var sourcemaps = require('gulp-sourcemaps')

function make_bundle (src, name) {
  browserify({
    entries: src,
    standalone: name
  }).bundle()
      .pipe(source(src))
      .pipe(rename({extname: '.bundle.js'}))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('.', {sourceRoot: '/public'}))
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

gulp.task('bundle', function () {
  // bundle with dependencies
  make_bundle('./js/odex-demo.js', 'odexdemo')
  make_bundle('./js/standard-map.js', 'standardmap')
  // copy sources, so sourcemaps will work
  gulp.src(['js/**/*.js', '!js/node_modules/**'])
    .pipe(gulp.dest('../public/js'))
})

gulp.task('ts', function () {
  gulp.src('js/*.ts')
  .pipe(ts({
    noImplicitAny: false
  }))
  .pipe(gulp.dest('js'))
})

gulp.task('default', ['bundle'])

gulp.task('ts-bundle', ['ts', 'bundle'])
