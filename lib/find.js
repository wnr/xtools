'use strict';

// ---- Dependecies -----------------------------------------------------------

var fs = require('./filesystem.js');
var _ = require('lodash');
var utils = require('./utils.js');

var chalk = require('chalk');

// ---- Exports ---------------------------------------------------------------

exports = module.exports = find;

// ---- Public functions ------------------------------------------------------

function find(path, options) {
  var options = options || {};
  options.filenames = utils.isSet(options.filenames) ? options.filenames : false;

  //Default path to current working directory.
  path = path || process.cwd();

  path = fs.prepare(path);

  //Expand the directory recursively. Keep the path as root.
  var files = fs.expand(path, { keepRoot: true });

  //Flatten the file structure retrieved by expand.
  files = flatten(files);

  //Check if filenames only should be returned.
  if(options.filenames) {
    //Filenames only should be returned.

    //Pluck out only the filenames of the file objects.
    var filenames = _.pluck(files, 'filename');

    //Return the filenames array.
    return filenames;
  }

  //File objects should be returned, so return them.
  return files;
}

// ---- Private functions -----------------------------------------------------

function flatten(files) {
  var result = [];

  files.forEach(function(file) {
    result = result.concat(file.flatten());
  });

  return _.flatten(result);
}