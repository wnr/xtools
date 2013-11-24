var expect = require('expect.js');
var utils = require('../lib/utils.js');

var datagen = require('./datagen.js');

var sm = require('sandboxed-module');

var FILE = '../lib/filesystem.js';

var _ = require('lodash');

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
      expect(fs.prepare('//foo/./../foo//test/')).to.equal(path.normalize('/foo/test'));
    });
  });

  describe('File', function() {
    it('should create file objects by invoking lstat', function() {
        debugger;

      var fileStructure = new datagen.FileStructure([
        process.env.HOME + '/test/foo dir',
        process.env.HOME + '/test/foo/LICENSE file',
        process.env.HOME + '/test/foo/link link',
      ]);
      var fs = sm.require(FILE, {
        requires: {
          'fs': {
            lstatSync: fileStructure.lstatSync.bind(fileStructure)
          }
        }
      });

      {
        var actual = new fs.File(process.env.HOME + '/test/foo');
        expect(actual).to.be.an(fs.File);
        expect(actual.filename).to.equal(fs.prepare(process.env.HOME + '/test/foo'));
        expect(actual.basename).to.equal('foo');
        expect(actual.path).to.equal(process.env.HOME + '/test/');
        expect(actual.is).to.be.an('object');
        expect(actual.is.file).to.equal(false);
        expect(actual.is.link).to.equal(false);
        expect(actual.is.dir).to.equal(true);
      }
      {
        var actual = new fs.File('~/test/foo/fake/..//LICENSE');
        expect(actual).to.be.an(fs.File);
        expect(actual.filename).to.equal(fs.prepare(process.env.HOME + '/test/foo/LICENSE'));
        expect(actual.basename).to.equal('LICENSE');
        expect(actual.path).to.equal(process.env.HOME + '/test/foo/');
        expect(actual.is).to.be.an('object');
        expect(actual.is.file).to.equal(true);
        expect(actual.is.link).to.equal(false);
        expect(actual.is.dir).to.equal(false);
      }
      {
        var actual = new fs.File('~/test/foo/fake/../y/../link');
        expect(actual).to.be.an(fs.File);
        expect(actual.filename).to.equal(fs.prepare(process.env.HOME + '/test/foo/link'));
        expect(actual.basename).to.equal('link');
        expect(actual.path).to.equal(process.env.HOME + '/test/foo/');
        expect(actual.is).to.be.an('object');
        expect(actual.is.file).to.equal(false);
        expect(actual.is.link).to.equal(true);
        expect(actual.is.dir).to.equal(false);
      }
    });

    it('should init file object by stats object', function() {
      var fs = require(FILE);

      {
        var stats = datagen.makeStatObject('file');
        var actual = new fs.File('/some/dir/~/conf', stats);
        expect(actual).to.be.an(fs.File);
        expect(actual.filename).to.equal('/some/dir/~/conf');
        expect(actual.basename).to.equal('conf');
        expect(actual.path).to.equal('/some/dir/~/');
        expect(actual.is).to.be.an('object');
        expect(actual.is.file).to.equal(true);
        expect(actual.is.link).to.equal(false);
        expect(actual.is.dir).to.equal(false);
      }
      {
        var stats = datagen.makeStatObject('link');
        var actual = new fs.File('/some/dir/~/link', stats);
        expect(actual).to.be.an(fs.File);
        expect(actual.filename).to.equal('/some/dir/~/link');
        expect(actual.basename).to.equal('link');
        expect(actual.path).to.equal('/some/dir/~/');
        expect(actual.is).to.be.an('object');
        expect(actual.is.file).to.equal(false);
        expect(actual.is.link).to.equal(true);
        expect(actual.is.dir).to.equal(false);
      }
    });

    it('should create copy when passed another File object', function() {
      var fs = require(FILE);
      {
        var stats = datagen.makeStatObject('dir');
        var original = new fs.File('/a/dir/something', stats);
        var copy = new fs.File(original);
        expect(copy).to.be.an(fs.File);
        expect(copy.filename).to.equal('/a/dir/something');
        expect(copy.basename).to.equal('something');
        expect(copy.path).to.equal('/a/dir/');
        expect(copy.is).to.be.an('object');
        expect(copy.is.file).to.equal(false);
        expect(copy.is.link).to.equal(false);
        expect(copy.is.dir).to.equal(true);

        expect(copy == original).to.equal(false);
        expect(copy.is == original.is).to.equal(false);

        delete original.is.dir;
        expect(copy.is.dir).to.equal(true);

        delete original.is;
        expect(copy.is).to.be.an('object');
      }
    });

    it('should init with files array if present and directory', function() {
      var fs = require(FILE);
      {
        var stats = datagen.makeStatObject('file');
        var actual = new fs.File('foo', stats, [true]);
        expect(actual.files).to.be(undefined);
      }
      {
        var stats = datagen.makeStatObject('dir');
        var files = ['file1', 'dir2'];
        var actual = new fs.File('foo', stats, files);
        expect(actual.files).to.equal(files);
      }
    });
  });

  describe('expand', function() {
    before(function() {
      var self = this;
      this.path = require('path');
      this.p = process.env.HOME + '/test/foo/';
      var fileStructure = new datagen.FileStructure([
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
            readdirSync: fileStructure.readdirSync.bind(fileStructure),
            lstatSync: fileStructure.lstatSync.bind(fileStructure)
          }
        }
      });
    });

    it('should list files in a directory with valid file objects', function() {
      var expected = [
        new this.fs.File(this.p + '/LICENSE', datagen.makeStatObject('file')),
        new this.fs.File(this.p + '/link', datagen.makeStatObject('link')),
        new this.fs.File(this.p + '/.git', datagen.makeStatObject('dir')),
        new this.fs.File(this.p + '/node_modules', datagen.makeStatObject('dir')),
      ];
      var actual = this.fs.expand('~/noes/../test/./foo', {
        recurse: false
      });
      datagen.testFileObject(actual, expected);
    });

    it('should be able to expand directories recursively', function() {
      var expected = [
        new this.fs.File(this.p + '/LICENSE', datagen.makeStatObject('file')),
        new this.fs.File(this.p + '/link', datagen.makeStatObject('link')),
        new this.fs.File(this.p + '/.git', datagen.makeStatObject('dir'), [
          new this.fs.File(this.p + '/.git/test', datagen.makeStatObject('file')),
          new this.fs.File(this.p + '/.git/config', datagen.makeStatObject('dir'), [
            new this.fs.File(this.p + '/.git/config/deepest', datagen.makeStatObject('link')),
            new this.fs.File(this.p + '/.git/config/dfile', datagen.makeStatObject('file'))
          ]),
          new this.fs.File(this.p + '/.git/hooks', datagen.makeStatObject('dir'))
        ]),
        new this.fs.File(this.p + '/node_modules', datagen.makeStatObject('dir'), [
          new this.fs.File(this.p + '/node_modules/test', datagen.makeStatObject('file'))
        ])
      ];

      var actual = this.fs.expand('~/noes/../test/./foo');
      datagen.testFileObject(actual, expected);
    });

    it('should be keeping root dir if keepRoot is set to true', function() {
      var expected = [
        new this.fs.File(this.p + '/.git', datagen.makeStatObject('dir'), [
          new this.fs.File(this.p + '/.git/test', datagen.makeStatObject('file')),
          new this.fs.File(this.p + '/.git/config', datagen.makeStatObject('dir'), [
            new this.fs.File(this.p + '/.git/config/deepest', datagen.makeStatObject('link')),
            new this.fs.File(this.p + '.git/config/dfile', datagen.makeStatObject('file'))
          ]),
          new this.fs.File(this.p + '.git/hooks', datagen.makeStatObject('dir'))
        ])
      ];
      var actual = this.fs.expand(this.p + '/.git', { keepRoot: true });
      datagen.testFileObject(actual, expected);
    });
  });
});