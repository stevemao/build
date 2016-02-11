var assign = require('lodash/object/assign');
var babel = require('../lib/babel');
var galv = require('galvatron');
var gat = require('gulp-auto-task');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpDebug = require('gulp-debug');
var gulpFilter = require('gulp-filter');
var Server = require('karma').Server;

var opts = gat.opts();
var benchFilter = gulpFilter(['**', '!**/benchmark.js'], { restore: true });
var filterEverythingExceptWebcomponents = gulpFilter(['**/*','!**/webcomponents.js/**/*'], { restore: true });


module.exports = gulp.series(
  function () {
    return galv.trace(['node_modules/skatejs-build/node_modules/benchmark/benchmark.js', 'test/perf.js']).createStream()
      .pipe(gulpDebug())
      .pipe(benchFilter)
      .pipe(filterEverythingExceptWebcomponents)
      .pipe(galv.cache('babel', babel(opts.babel)))
      .pipe(filterEverythingExceptWebcomponents.restore)
      .pipe(galv.cache('globalize', galv.globalize()))
      .pipe(benchFilter.restore)
      .pipe(gulpConcat('perf.js'))
      .pipe(gulp.dest('.tmp'));
  },
  function (done) {
    var args = [];
    var opts = assign({
      browsers: 'Firefox'
    }, gat.opts());

    if (opts.grep) {
      args.push('--grep');
      args.push(opts.grep);
    }

    new Server({
      singleRun: true,
      browserNoActivityTimeout: 1000000,
      browsers: opts.browsers.split(','),
      client: { args: args },
      files: [
        '.tmp/perf.js'
      ],
      frameworks: ['mocha', 'sinon-chai']
    }, function finishTaskAndExit (exitCode) {
      done();
      process.exit(exitCode);
    }).start();
  }
);
