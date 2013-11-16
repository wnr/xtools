var expect = require('expect.js');
var datagen = require('./datagen.js');
var sm = require('sandboxed-module');

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

    var fs = sm.require('../lib/filesystem.js', {
      requires: {
        'fs': {
          readdirSync: fileStructure.readdirSync.bind(fileStructure),
          lstatSync: fileStructure.lstatSync.bind(fileStructure)
        }
      }
    });

    this.find = sm.require('../lib/find.js', {
      requires: {
        './filesystem.js': {
          expand: fs.expand,
          prepare: fs.prepare
        }
      },
      globals: {
        process: {
          cwd: function() {
            return '/test/foo/.git';
          }
        }
      }
    });
  });

  it('should have the root dir as result on empty dir', function() {
    var expected = [
      '/test/foo/.git/hooks'
    ];
    var actual = this.find('/test/foo/.git/hooks');
    expect(actual).to.eql(expected);
  });

  it('should accept but remove trailing separators.', function() {
    var expected = [
      '/test/foo/.git/hooks'
    ];
    var actual = this.find('/test/foo/.git/hooks/');
    expect(actual).to.eql(expected);
  });

  it('should expand the path with deep mode as default and output it as an array', function() {
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

    var actual = this.find('/test/foo');

    expect(actual).to.eql(expected);
  });

  it('should default to current working directory if no path is given', function() {
    var expected = [
      '/test/foo/.git',
      '/test/foo/.git/test',
      '/test/foo/.git/config',
      '/test/foo/.git/config/deepest',
      '/test/foo/.git/config/dfile',
      '/test/foo/.git/hooks'
    ];
    var actual = this.find();
    expect(actual).to.eql(expected);
  });
});