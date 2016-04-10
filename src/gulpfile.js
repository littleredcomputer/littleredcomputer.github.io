var browserify = require('browserify')
var gulp = require('gulp')
var ts = require('gulp-typescript')
var rename = require('gulp-rename')
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
      .pipe(source(src))
      .pipe(rename({extname: '.bundle.js'}))
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

gulp.task('js', function () {
  make_bundle('./js/odex-demo.js', 'odexdemo')
})

gulp.task('ts', function () {
  gulp.src('js/odex-demo.ts')
  .pipe(ts({
    noImplicitAny: false
  }))
  .pipe(gulp.dest('./foo'))
})

gulp.task('default', ['js'])
