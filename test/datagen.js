var p = require('path');
var utils = require('../lib/utils.js');
var _ = require('lodash');
var expect = require('expect.js');
var sm = require('sandboxed-module');

_.mixin({
  'cloneDeepWithProto': _.partialRight(_.cloneDeep, function (source) {
    if (_.isObject(source)) {
      var result = _.cloneDeep(source);
      result.__proto__ = _.cloneDeep(source.__proto__);
      return result;
    }
  })
});

exports.FileStructure = FileStructure;
exports.generateFileStructure = generateFileStructure;
exports.makeStatObject = makeStatObject;
exports.makeFileObject = makeFileObject;
exports.testFileObject = testFileObject;

function FileStructure(structure) {
  this.fileStructure = generateFileStructure(structure);
}

FileStructure.prototype.readdirSync = function(filename) {
  var object = this.fileStructure.readdir[filename];

  if (!object) {
    //TODO: Throw right error.
    throw new Error('Unable to find ' + filename);
  }

  return _.cloneDeepWithProto(object);
};

FileStructure.prototype.lstatSync = function(filename) {
  var object = this.fileStructure.lstat[filename];

  if (!object) {
    //TODO: Throw right error.
    throw new Error('Unable to find ' + filename);
  }

  return _.cloneDeepWithProto(object);
};

function generateFileStructure(structure) {
  var chunk = structure.join('\n');

  var output = {
    readdir: {},
    lstat: {},
    files: {}
  };

  structure.forEach(function(line) {
    var data = line.split(' ');

    output.lstat[data[0]] = makeStatObject(data[1]);

    if (output.lstat[data[0]].isDirectory()) {
      var files = _.unique(chunk.match(new RegExp('(' + data[0] + ')/[^' + p.sep + '\\s]+', 'g')) || []).map(function(element) {
        return _.last(element.split(p.sep));
      });
      output.readdir[data[0]] = files;
    }
  });

  return output;
};

//TODO: Since lstat sets __proto__ functions, read more about how they are done and make the functions here also __proto__.
function makeStatObject(type) {
  type = type || 'file';

  var base = {
    dev: 16777220,
    mode: 16877,
    nlink: 13,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 23707191,
    size: 442,
    blocks: 0,
    atime: 'Tue Oct 29 2013 21: 25: 29 GMT + 0100(CET)',
    mtime: 'Wed Oct 30 2013 00: 54: 18 GMT + 0100(CET)',
    ctime: 'Wed Oct 30 2013 00: 54: 18 GMT + 0100(CET)'
  };

  base.__proto__ = {};

  if (type === 'dir') {
    base.__proto__.isDirectory = function() {
      return true;
    };
    base.__proto__.isFile = function() {
      return false;
    };
    base.__proto__.isSymbolicLink = function() {
      return false;
    };
  } else if (type === 'link') {
    base.__proto__.isDirectory = function() {
      return false;
    };
    base.__proto__.isFile = function() {
      return false;
    };
    base.__proto__.isSymbolicLink = function() {
      return true;
    }
  } else if (type === 'file') {
    base.__proto__.isDirectory = function() {
      return false;
    };
    base.__proto__.isFile = function() {
      return true;
    };
    base.__proto__.isSymbolicLink = function() {
      return false;
    }
  } else {
    throw new Error('Unknown file type: ' + type);
  }

  return base;
}

function makeFileObject(path, file, type, files) {
  var base = makeStatObject(type);

  if (type === 'dir') {
    if (files) {
      base.files = files;
    }
  }

  base.path = path;
  base.file = file;
  base.filename = path + file;

  return base;
}

//TODO: How does there function tests work with new __proto__ functions.
function testFileObject(actuals, expected) {
  expect(actuals).to.have.length(expected.length);

  for (var i = 0; i < actuals.length; i++) {
    debugger;
    expect(_.isEqual(actuals[i], expected[i])).to.equal(true);

    if (expected[i].files) {
      testFileObject(actuals[i].files, expected[i].files);
    }
  }
}