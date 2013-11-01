var expect = require('expect.js');
var utils = require('../lib/utils.js');

var sm = require('sandboxed-module');

var FILE = '../lib/filesystem.js';

describe('filesystem', function() {
  describe('pathify', function() {
    it('should add trailing separator when needed', function() {
      function test(sep) {
        var fs = sm.require(FILE, {
          requires: {
            'path': {
              sep: sep
            }
          }
        });

        expect(function() {
          fs.pathify(1337);
        }).to.throwError();
        expect(function() {
          fs.pathify('');
        }).to.throwError();

        expect(fs.pathify(sep)).to.equal(sep);
        expect(fs.pathify(sep + 'test' + sep + 'foo' + sep)).to.equal(sep + 'test' + sep + 'foo' + sep);
        expect(fs.pathify('test' + sep + 'foo')).to.equal('test' + sep + 'foo' + sep);
        expect(fs.pathify('.')).to.equal('.' + sep);
      }

      test('/');
      test('\\');
    });
  });

  describe('getPath', function() {
    it('should return the path of the filename with trailing separator', function() {
      function test(sep) {
        var fs = sm.require(FILE, {
          requires: {
            'path': {
              sep: sep,
              dirname: function(filename) {
                var path = require('path');
                var p = path.dirname(filename.replace(new RegExp('\\' + sep, 'g'), path.sep));
                var r = new RegExp('\\' + path.sep, 'g');
                return p.replace(r, sep);
              }
            }
          }
        });

        expect(function() {
          fs.getPath(true);
        }).to.throwError();
        expect(function() {
          fs.getPath('');
        }).to.throwError();

        expect(fs.getPath('test')).to.equal('.' + sep);
        expect(fs.getPath(sep + 'test' + sep + 'foo')).to.equal(sep + 'test' + sep);
        //TODO: Not sure if this should behave like this. (currently not)
        //expect(fs.getPath(sep + 'test' + sep + 'foo' + sep)).to.equal(sep + 'test' + sep + 'foo' + sep);
      }

      test('/');
      test('\\');
    });
  });

  describe('prepare', function() {
    it('should convert relative to absolute addresses, normalize and expand ~', function() {
      var fs = require(FILE);
      var path = require('path');

      expect(fs.prepare('~')).to.equal(process.env.HOME);
      expect(fs.prepare('/test/~/foo')).to.equal(path.normalize('/test/~/foo'));
      expect(fs.prepare('/test/../foo')).to.equal(path.normalize('/foo'));
      expect(fs.prepare('//foo/./../foo//test/')).to.equal(path.normalize('/foo/test/'));
    });
  });

  describe('expand', function() {
    it('should list files in a directory with valid file objects', function() {
      var path = require('path');
      var fs = sm.require(FILE, {
        requires: {
          'fs': {
            readdirSync: function(filename) {
              if (filename === process.env.HOME + '/test/foo') {
                return ['.git', 'LICENSE', 'node_modules', 'link'];
              }
            },
            lstatSync: function(filename) {
              if (filename === process.env.HOME + '/test/foo/.git') {
                return makeStatObject(process.env.HOME + '/test/foo/', '.git', 'dir');
              } else if (filename === process.env.HOME + '/test/foo/LICENSE') {
                return makeStatObject(process.env.HOME + '/test/foo/', 'LICENSE', 'file');
              } else if (filename === process.env.HOME + '/test/foo/node_modules') {
                return makeStatObject(process.env.HOME + '/test/foo/', 'node_modules', 'dir');
              } else if (filename === process.env.HOME + '/test/foo/link') {
                return makeStatObject(process.env.HOME + '/test/foo/', 'link', 'link');
              }
            }
          }
        }
      });

      var p = process.env.HOME + '/test/foo/';
      var expected = [
        makeStatObject(p, '.git', 'dir'),
        makeStatObject(p, 'LICENSE', 'file'),
        makeStatObject(p, 'node_modules', 'dir'),
        makeStatObject(p, 'link', 'link')
      ];
      var actual = fs.expand('~/noes/../test/./foo');
      testStatObjects(actual, expected);
    });
  });
});

function testStatObjects(actuals, expected) {
  for (var i = 0; i < actuals.length; i++) {
    expect(utils.equals(actuals[i], expected[i])).to.equal(true);
    expect(actuals[i].isDirectory()).to.equal(expected[i].isDirectory());
    expect(actuals[i].isFile()).to.equal(expected[i].isFile());
    expect(actuals[i].isSymbolicLink()).to.equal(expected[i].isSymbolicLink());
  }
}

function makeStatObject(path, file, type) {
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
  } else {
    base.isDirectory = function() {
      return false;
    };
    base.isFile = function() {
      return false;
    };
    base.isSymbolicLink = function() {
      return false;
    }
  }

  base.path = path;
  base.file = file;
  base.filename = path + file;

  return base;
}