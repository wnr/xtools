var p = require('path');
var utils = require('../lib/utils.js');
var _ = require('lodash');
var expect = require('expect.js')

exports.generateFileStructure = generateFileStructure;
exports.makeStatObject = makeStatObject;
exports.makeFileObject = makeFileObject;
exports.testFileObject = testFileObject;

function generateFileStructure(structure) {
  var chunk = structure.join('\n');

  var output = { readdir: {}, lstat: {}, files: {} };

  structure.forEach(function(line) {
    var data = line.split(' ');

    output.lstat[data[0]] = makeStatObject(data[1]);
    output.files[data[0]] = makeFileObject(p.dirname(data[0]) + p.sep, p.basename(data[0]), data[1]);

    if(output.lstat[data[0]].isDirectory()) {
      var files = _.unique(chunk.match(new RegExp('(' + data[0] + ')/[^' + p.sep + '\\s]+', 'g')) || []).map(function (element) {
        return _.last(element.split(p.sep));
      });
      output.readdir[data[0]] = files;
      output.files[data[0]] = files;
    }
  });

  return output;
};

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
  if (type === 'dir') {
    base.isDirectory = function() {
      return true;
    };
    base.isFile = function() {
      return false;
    };
    base.isSymbolicLink = function() {
      return false;
    };
  } else if (type === 'link') {
    base.isDirectory = function() {
      return false;
    };
    base.isFile = function() {
      return false;
    };
    base.isSymbolicLink = function() {
      return true;
    }
  } else if(type === 'file') {
    base.isDirectory = function() {
      return false;
    };
    base.isFile = function() {
      return false;
    };
    base.isSymbolicLink = function() {
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
    if(files) {
      base.files = files;
    }
  }

  base.path = path;
  base.file = file;
  base.filename = path + file;

  return base;
}

function testFileObject(actuals, expected) {
  expect(actuals).to.have.length(expected.length);

  for (var i = 0; i < actuals.length; i++) {
    expect(actuals[i].isDirectory()).to.equal(expected[i].isDirectory());
    expect(actuals[i].isFile()).to.equal(expected[i].isFile());
    expect(actuals[i].isSymbolicLink()).to.equal(expected[i].isSymbolicLink());

    //Validate the files field (if present) and then delete it.
    if(expected[i].files) {
      testFileObject(actuals[i].files, expected[i].files);
      delete actuals[i].files && delete expected[i].files;
    }

    //Since expect.eql doesnt work with functions: delete them.
    delete actuals[i].isDirectory && delete expected[i].isDirectory;
    delete actuals[i].isFile && delete expected[i].isFile;
    delete actuals[i].isSymbolicLink && delete expected[i].isSymbolicLink;

    expect(actuals[i]).to.eql(expected[i]);
  }
}