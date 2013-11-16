'use strict';

// ---- Dependecies -----------------------------------------------------------

var fs = require('./filesystem.js');
var utils = require('./utils.js');
var _ = require('lodash');

var chalk = require('chalk');

// ---- Exports ---------------------------------------------------------------

exports = module.exports = find;

// ---- Public functions ------------------------------------------------------

function find(path, options) {
  var options = options || {};

  //Default path to current working directory.
  path = path || process.cwd();

  path = fs.prepare(path);

  //Expand the directory recursively.
  var files = fs.expand(path);

  //Flatten the file structure retrieved by expand.
  files = utils.flatten(files, 'files', 'deep');

  //Pluck out only the filenames of the file objects.
  var filenames = _.pluck(files, 'filename');

  //Add the root path as first element in filename array.
  filenames.unshift(path);

  //Return the filenames array.
  return filenames;
}

function write(files) {
  files.forEach(function(file) {
    var color = chalk.reset;

    if (file.isDirectory()) {
      color = chalk.red;
    } else if (file.isSymbolicLink()) {
      color = chalk.blue;
    }

    console.log(color(file.filename));
  });
};