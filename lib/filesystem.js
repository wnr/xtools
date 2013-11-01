'use strict';

var fs = require('fs');
var p = require('path');

// ---- Exports -----------------------------------------------------------------------------------

exports.expand = expand;
exports.prepare = prepare;
exports.pathify = pathify;
exports.getPath = getPath;

// ---- Public functions --------------------------------------------------------------------------

function expand(filename, options) {
  //Prepare the filename.
  filename = prepare(filename);

  //Read all the files in the directory.
  var files = fs.readdirSync(filename);

  //Add the trailing separator if missing.
  var path = pathify(filename);

  files = files.map(function(file) {
    var filename = path + file;

    //Check the stat of the file. Will not follow symbolic links.
    var stat = fs.lstatSync(filename);

    //Extend the stat object with the filename and path.
    stat.path = path;
    stat.file = file;
    stat.filename = filename;

    //Store the extended stat object instead.
    return stat;
  });

  return files;
}

function prepare(filename) {
  var prepared = filename;

  //Check if the filename contains a HOME-relative path.
  //TODO: How does this work for systems that do not have a HOME ~ char. Windows?
  if (prepared.charAt(0) === '~') {
    //It is a HOME relative path. So replace it by the HOME as defined in process env var.
    prepared = process.env.HOME + prepared.substr(1);
  }

  //Resolve the path into an absolute path.
  prepared = p.resolve(prepared);

  //Remove double separators and slashes, etc.
  prepared = p.normalize(prepared);

  //If the original filename had a trailing separator, then preserve it. (resolve removes it)
  if (filename.charAt(filename.length - 1) === p.sep) {
    prepared += p.sep;
  }

  return prepared;
}

function getPath(filename) {
  if (typeof filename !== 'string' || filename.length === 0)
    throw new Error('Invalid filename.');

  //Get the dirname of the path of the filename.
  var path = p.dirname(filename);

  //Adds the trailing separator if missing.
  path = pathify(path);

  return path;
}

function pathify(path) {
  if (typeof path !== 'string' || path.length === 0)
    throw new Error('Invalid path.');

  //Checks if the path is missing the trailing separator.
  if (path.charAt(path.length - 1) !== p.sep) {
    //It is, so add it to the path.
    path += p.sep;
  }

  return path;
}