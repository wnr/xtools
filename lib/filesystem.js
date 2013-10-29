'use strict';

var Filesystem = {};

// ---- Exports -----------------------------------------------------------------------------------

exports = module.exports = Filesystem;

// ---- Constructors ------------------------------------------------------------------------------

function Filesystem(options) {
  options = options || {};

  this.fs = options.fs || require('fs');
  this.path = options.path || require('path');
  this.utils = options.utils || require('utils.js');
  this.envhome = options.envhome || process.env.HOME;
}

// ---- Public functions --------------------------------------------------------------------------

var p = Filesystem.prototype;

p.expand = function(filename, options) {
  //Prepare the filename.
  filename = this.prepare(filename);

  //Read all the files in the directory.
  var files = this.fs.readdirSync(filename);

  //Add the trailing separator if missing.
  var path = this.pathify(filename);

  files = files.map(function(file) {
    var filename = path + file;

    //Check the stat of the file. Will not follow symbolic links.
    var stat = this.fs.lstatSync(filename);

    //Extend the stat object with the filename and path.
    stat.path = path;
    stat.file = file;
    stat.filename = filename;

    //Store the extended stat object instead.
    return stat;
  });

  return files;
};

p.prepare = function(filename) {
  //Check if the filename contains a HOME-relative path.
  //TODO: How does this work for systems that do not have a HOME ~ char. Windows?
  if (filename.charAt(0) === '~') {
    //It is a HOME relative path. So replace it by the HOME as defined in process env var.
    filename = this.envhome + filename.substr(1);
  }

  //Resolve the path into an absolute path.
  filename = this.path.resolve(filename);

  //Normalize the filename to be less OS specific.
  filename = this.path.normalize(filename);

  return filename;
};

p.pathify = function(path) {
  //Checks if the path is missing the trailing separator.
  if (path.charAt(path.length - 1) !== this.path.sep) {
    //It is, so add it to the path.
    path += this.path.sep;
  }

  return path;
}

function getPath(filename) {
  //Get the dirname of the path of the filename.
  var path = this.path.dirname(filename);

  //Adds the trailing separator if missing.
  path = this.pathify(path);

  return path;
};