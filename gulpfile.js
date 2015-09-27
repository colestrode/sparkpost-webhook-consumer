var gulp = require('gulp')
  , jscs = require('gulp-jscs')
  , jshint = require('gulp-jshint')
  , stylish = require('gulp-jscs-stylish');

gulp.task('lint', function() {
  gulp.src(['./*.js', './**/*.js', '!./node_modules/**'])
    .pipe(jshint())
    .pipe(jscs())
    .pipe(stylish.combineWithHintResults())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('test', ['lint']);

gulp.task('default', ['test']);
