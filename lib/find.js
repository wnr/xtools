'use strict';

// ---- Dependecies -----------------------------------------------------------

var fs = require('./filesystem.js')();

var chalk = require('chalk');

// ---- Exports ---------------------------------------------------------------

exports = module.exports = find;

// ---- Public functions ------------------------------------------------------

find('/usr/bin/')

function find(path, options) {
  var options = options || {};

  var files = fs.expand(path);

  write(files);
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