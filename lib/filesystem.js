'use strict';

var fs = require('fs');
var p = require('path');

var utils = require('./utils.js');
var _ = require('lodash');

// ---- Exports -----------------------------------------------------------------------------------

exports.File = File;

exports.expand = expand;
exports.prepare = prepare;
exports.pathify = pathify;
exports.getPath = getPath;

// ---- Constructors functions --------------------------------------------------------------------

function File(file, stats, files) {
  if(file instanceof File) {
    //parameter file is of type File, so create a copy by extending this and cloning all objects deep.
    return _.extend(this, file, function (destVal, sourceVal) {
      if(_.isObject(sourceVal)) {
        //If value is an object, clone it deep.
        return _.cloneDeep(sourceVal);
      }

      //If non-object then only copy the value.
      return sourceVal;
    });
  } else if(!_.isString(file)) {
    //Parameter file has to be either File or String (filename).
    throw new Error('Invalid arguments.');
  }

  //Set the filename, path and basename fields.
  this.filename = prepare(file);
  this.path = getPath(this.filename);
  this.basename = p.basename(file);

  //If no stats object is provided, then it has to be read by filesystem.
  if(!stats) {
    //TODO: Handle exceptions.
    stats = fs.lstatSync(this.filename);
  }

  //TODO: Store more data from stats as needed.
  
  //Store the is-functions of fs.Stats object as properties instead, to make File more clone-friendly.
  this.is = {
    file: stats.isFile(),
    dir: stats.isDirectory(),
    link: stats.isSymbolicLink()
  };

  //If dir then assign files if present, otherwise empty array.
  if(this.is.dir) {
    this.files = files || [];
  }
}

// ---- Public functions --------------------------------------------------------------------------

function expand(filename, options) {
  options = options || {};
  var recurse = utils.isSet(options.recurse) ? options.recurse : true;
  var keepRoot = utils.isSet(options.keepRoot) ? options.keepRoot : false;

  //Prepare the filename.
  filename = prepare(filename);

  //Check if root filename should be kept when expanding, or discarded.
  if(keepRoot) {
    //The root should be kept, so set files to the filename, which means the filename will
    //be expanded recursively and then contain the whole tree in the object.files array.
    var files = [p.basename(filename)];
    var path = pathify(p.dirname(filename));
  } else {
    //The root should be discarded, so just read the files under the root and add them to
    //the files array to be expanded later.

    //Read all the files in the directory.
    var files = fs.readdirSync(filename);

    //Add the trailing separator if missing.
    var path = pathify(filename);
  }

  files = files.map(function(basename) {
    //Assemble the filename of the file which consists of the root path and the basename.
    var filename = path + basename;

    //Create a File object, which will handle the lstat reading.
    var file = new File(filename);

    //If the file is a directory and recursive expand is enabled, then expand
    //the directory recursively and store it to the file object.
    //TODO: This should really be handled by the File object instead. Later...
    if (recurse && file.is.dir) {
      file.files = expand(file.filename);
    }

    //Store the file object.
    return file;
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