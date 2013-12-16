var expect = require('expect.js');
var datagen = require('./datagen.js');
var rewire = require('rewire');

describe('find', function() {

  before(function() {
    var fileStructure = new datagen.FileStructure([
      '/test/foo dir',
      '/test/foo/LICENSE file',
      '/test/foo/link link',
      '/test/foo/.git dir',
      '/test/foo/.git/test file',
      '/test/foo/.git/config dir',
      '/test/foo/.git/config/deepest link',
      '/test/foo/.git/config/dfile file',
      '/test/foo/.git/hooks dir',
      '/test/foo/node_modules dir',
      '/test/foo/node_modules/test file'
    ]);

    var fs = rewire('../lib/filesystem.js');
    fs.__set__({
      fs: {
        readdirSync: fileStructure.readdirSync.bind(fileStructure),
        lstatSync: fileStructure.lstatSync.bind(fileStructure)
      }
    });

    this.find = rewire('../lib/find.js');
    this.find.__set__({
      fs: fs,
      process: {
        cwd: function() {
          return '/test/foo/.git';
        }
      }
    });
  });

  it('should return the root dir as result on empty dir', function() {
    var expected = [
      datagen.makeFileObject('/test/foo/.git/hooks', 'dir')
    ];
    var actual = this.find('/test/foo/.git/hooks');
    datagen.testFileObject(actual, expected);
  });

  it('should expand the path with deep mode as default and output it as an array', function() {
    var expected = [
      datagen.makeFileObject('/test/foo', 'dir'),
      datagen.makeFileObject('/test/foo/LICENSE', 'file'),
      datagen.makeFileObject('/test/foo/link', 'link'),
      datagen.makeFileObject('/test/foo/.git', 'dir'),
      datagen.makeFileObject('/test/foo/.git/test', 'file'),
      datagen.makeFileObject('/test/foo/.git/config', 'dir'),
      datagen.makeFileObject('/test/foo/.git/config/deepest', 'link'),
      datagen.makeFileObject('/test/foo/.git/config/dfile', 'file'),
      datagen.makeFileObject('/test/foo/.git/hooks', 'dir'),
      datagen.makeFileObject('/test/foo/node_modules', 'dir'),
      datagen.makeFileObject('/test/foo/node_modules/test', 'file')
    ];

    var actual = this.find('/test/foo');
    datagen.testFileObject(actual, expected);
  });

  it('should default to current working directory if no path is given', function() {
    var expected = [
      datagen.makeFileObject('/test/foo/.git', 'dir'),
      datagen.makeFileObject('/test/foo/.git/test', 'file'),
      datagen.makeFileObject('/test/foo/.git/config', 'dir'),
      datagen.makeFileObject('/test/foo/.git/config/deepest', 'link'),
      datagen.makeFileObject('/test/foo/.git/config/dfile', 'file'),
      datagen.makeFileObject('/test/foo/.git/hooks', 'dir')
    ];
    var actual = this.find();
    datagen.testFileObject(actual, expected);
  });

  it('should return an array of filenames when filenames option is set to true', function() {
    var expected = [
      '/test/foo',
      '/test/foo/LICENSE',
      '/test/foo/link',
      '/test/foo/.git',
      '/test/foo/.git/test',
      '/test/foo/.git/config',
      '/test/foo/.git/config/deepest',
      '/test/foo/.git/config/dfile',
      '/test/foo/.git/hooks',
      '/test/foo/node_modules',
      '/test/foo/node_modules/test'
    ];
    var actual = this.find('/test/foo', { filenames: true });
    expect(actual).to.eql(expected);
  });

  it('should accept but remove trailing separators.', function() {
    var expected = [
      '/test/foo/.git/hooks'
    ];
    var actual = this.find('/test/foo/.git/hooks/', { filenames: true });
    expect(actual).to.eql(expected);
  });
});