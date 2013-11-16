var expect = require('expect.js');
var utils = require('../lib/utils.js');

var datagen = require('./datagen.js');

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
    before(function() {
      var self = this;
      this.path = require('path');
      this.p = process.env.HOME + '/test/foo/';
      var output = datagen.generateFileStructure([
        process.env.HOME + '/test/foo dir',
        process.env.HOME + '/test/foo/LICENSE file',
        process.env.HOME + '/test/foo/link link',
        process.env.HOME + '/test/foo/.git dir',
        process.env.HOME + '/test/foo/.git/test file',
        process.env.HOME + '/test/foo/.git/config dir',
        process.env.HOME + '/test/foo/.git/config/deepest link',
        process.env.HOME + '/test/foo/.git/config/dfile file',
        process.env.HOME + '/test/foo/.git/hooks dir',
        process.env.HOME + '/test/foo/node_modules dir',
        process.env.HOME + '/test/foo/node_modules/test file'
      ]);
      this.fs = sm.require(FILE, {
        requires: {
          'fs': {
            readdirSync: function(filename) {
              var object = output.readdir[filename];

              if(!object) {
                //TODO: Throw right error.
                throw new Error('Unable to find ' + filename);
              }

              return utils.copy(object);
            },
            lstatSync: function(filename) {
              var object = output.lstat[filename];

              if(!object) {
                //TODO: Throw right error.
                throw new Error('Unable to find ' + filename);
              }

              return utils.copy(object);
            }
          }
        }
      });
    });

    it('should list files in a directory with valid file objects', function() {
      var expected = [
        datagen.makeFileObject(this.p, 'LICENSE', 'file'),
        datagen.makeFileObject(this.p, 'link', 'link'),
        datagen.makeFileObject(this.p, '.git', 'dir'),
        datagen.makeFileObject(this.p, 'node_modules', 'dir'),
      ];
      var actual = this.fs.expand('~/noes/../test/./foo', {
        recurse: false
      });
      datagen.testFileObject(actual, utils.copy(expected));
    });

    it('should be able to expand directories recursively', function() {
      var expected = [
        datagen.makeFileObject(this.p, 'LICENSE', 'file'),
        datagen.makeFileObject(this.p, 'link', 'link'),
        datagen.makeFileObject(this.p, '.git', 'dir', [
          datagen.makeFileObject(this.p + '.git/', 'test', 'file'),
          datagen.makeFileObject(this.p + '.git/', 'config', 'dir', [
            datagen.makeFileObject(this.p + '.git/config/', 'deepest', 'link'),
            datagen.makeFileObject(this.p + '.git/config/', 'dfile', 'file')
          ]),
          datagen.makeFileObject(this.p + '.git/', 'hooks', 'dir', [])
        ]),
        datagen.makeFileObject(this.p, 'node_modules', 'dir', [
          datagen.makeFileObject(this.p + 'node_modules/', 'test', 'file')
        ])
      ];
      var actual = this.fs.expand('~/noes/../test/./foo');
      datagen.testFileObject(actual, utils.copy(expected));
    });
  });
});