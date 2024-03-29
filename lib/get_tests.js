/* eslint no-process-exit: 0 */

"use strict";
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var spawnSync = require("child_process").spawnSync;
var Locator = require("./locator");
var mochaSettings = require("./settings");
var reporter = path.resolve(__dirname, "test_capture.js");

module.exports = function (settings) {
  var OUTPUT_PATH = path.resolve(settings.tempDir, "get_mocha_tests.json");

  if (!fs.existsSync(settings.tempDir)) {
    fs.mkdirSync(settings.tempDir);
  }

  var cmd = "./node_modules/.bin/mocha";
  var args = [];

  if ( mochaSettings.suiteTag !== undefined ) {
    reporter = path.resolve(__dirname, "suite_capture.js");
    args.push("--reporter-options", "tag=" + mochaSettings.suiteTag);
  }

  args.push("--reporter", reporter);

  /* istanbul ignore else */
  if (mochaSettings.mochaOpts) {
    args.push("--opts", mochaSettings.mochaOpts);
  }

  args = args.concat(mochaSettings.mochaTestFolders);
  var env = _.extend({}, process.env, {MOCHA_CAPTURE_PATH: OUTPUT_PATH});
  var capture = spawnSync(cmd, args, {env: env});

  /* istanbul ignore next */
  if (capture.status !== 0) {
    console.error(
      "Could not capture mocha tests. To debug, run the following command:\n" +
      "MOCHA_CAPTURE_PATH=%s %s %s", OUTPUT_PATH, cmd, args.join(" "));
    process.exit(1);
  }

  var tests = fs.readFileSync(OUTPUT_PATH, "utf-8");
  fs.unlinkSync(OUTPUT_PATH);

  tests = JSON.parse(tests).map(function (t) {
    return new Locator(t.fullTitle, t.file, t.pending, t.title);
  });

  return tests;
};
