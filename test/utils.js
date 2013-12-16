var utils = require('../lib/utils.js');
var expect = require('expect.js');
var _ = require('lodash');

describe('utils', function() {
  describe('isSet', function() {
    it('should return false only for undefined and null', function() {
      expect(utils.isSet(undefined)).to.be(false);
      expect(utils.isSet(null)).to.be(false);
      expect(utils.isSet('undefined')).to.be(true);
      expect(utils.isSet(false)).to.be(true);
      expect(utils.isSet(131)).to.be(true);
    });
  });

  describe('clone', function() {
    before(function() {
      this.object = {
        arr: [1,2,3],
        nested: {
          yes: true,
          no: false,
          more: [{hi:1}]
        },
        func: function() { return this.nested.yes; }
      };

      this.objectProto = this.object;
      this.objectProto.__proto__ = {
        test: function() {return 1337;},
        val: 'yep',
        nested: [{hi:false}]
      };

      this.arrayObjectProto = [this.objectProto, this.object];
    });

    it('should clone objects deep', function() {
      var actual = utils.clone(this.object);
      expect(_.isEqual(actual, this.object)).to.equal(true);
    });

    it('should clone objects deep with __proto__', function() {
      var actual = utils.clone(this.objectProto);
      expect(_.isEqual(actual, this.objectProto)).to.equal(true);
      expect(actual.test()).to.equal(1337);
    });

    it('should clone arrays deep with __proto__', function() {
      var actual = utils.clone(this.arrayObjectProto);
      expect(_.isEqual(actual, this.arrayObjectProto)).to.equal(true);
      expect(_.isEqual(actual[0], this.arrayObjectProto[0])).to.equal(true);
      expect(_.isEqual(actual[1], this.arrayObjectProto[1])).to.equal(true);
      expect(actual[0].test()).to.equal(1337);
    });
  });

  describe('flatten', function() {
    before(function() {
      //1
      //-2
      //--3
      //---4
      //--5
      //-6
      //--7
      //8
      //-9
      this.big = [
        {
          number: 1,
          more: [
            {
              number: 2,
              more: [
                {
                  number: 3,
                  more: {
                    number: 4
                  }
                },
                {
                  number: 5
                }
              ]
            },
            {
              number: 6,
              more: {
                number: 7
              }
            }
          ]
        },
        {
          number: 8,
          more: {
            number: 9
          }
        }
      ];

      this.small = {
        number: 1,
        more: {
          number: 2,
          more: {
            number: 3
          }
        }
      };
    });

    it('should return array of input when flatten is not applicable', function() {
      {
        var object = {number:1};
        expect(utils.flatten(object, 'more')).to.eql([object]);
      }
      {
        var object = [{number:1}, {number:2}];
        expect(utils.flatten(object, 'more')).to.eql(object);
      }
    });

    it('should be able to flatten objects', function() {
      var expected = [{number:1}, {number:2}, {number:3}];
      var actual = utils.flatten(this.small, 'more');
      expect(actual).to.eql(expected);
    });

    it('should be able to flatten arrays and objects', function() {
      {
        var expected = [{number:1},{number:8},{number:2},{number:6},{number:9},{number:3},{number:5},{number:7},{number:4}];
        var actual = utils.flatten(this.big, 'more', 'shallow');
        expect(actual).to.eql(expected);
      }
      {
        var expected = [{number:1},{number:2},{number:3},{number:4},{number:5},{number:6},{number:7},{number:8},{number:9}];
        var actual = utils.flatten(this.big, 'more', 'deep');
        expect(actual).to.eql(expected);
      }
    });

    it('should respond to the depth parameter', function() {
      {
        var expected = [{number:1},{number:8}];
        var actual = utils.flatten(this.big, 'more', 'deep', 0);
        expect(actual).to.eql(expected);
      }
      {
        var expected = [{number:1}];
        var actual = utils.flatten(this.small, 'more', 'shallow', 0);
        expect(actual).to.eql(expected);
      }
      {
        var expected = [{number:1},{number:2},{number:6},{number:8},{number:9}];
        var actual = utils.flatten(this.big, 'more', 'deep', 1);
        expect(actual).to.eql(expected);
      }
      {
        var expected = [{number:1},{number:2},{number:3},{number:5},{number:6},{number:7},{number:8},{number:9}];
        var actual = utils.flatten(this.big, 'more', 'deep', 2);
        expect(actual).to.eql(expected);
      }
    });

    it('should not alter objects except for index', function() {
      //TODO: This comparer should be rewritten.
      var comparer = function (a, b) {
        if(!_.isArray(a)) {
          for(var prop in a) {
            if(a.hasOwnProperty(prop)) {
              if(b.hasOwnProperty(prop)) {
                if(_.isFunction(a[prop])) {
                  if(a[prop]() === b[prop]()) {
                    return true;
                  }
                } else {
                  return a[prop] === b[prop];
                }
              }
              return false;
            }
          }
        }
      };

      {
        var object = {
          number: 1,
          func: function() {},
          more: {
            number: 2,
            f: function() {}
          }
        };

        var expected = [{number:1, func: function() {}}, {number:2, f:function(){}}];
        var actual = utils.flatten(object, 'more', 'deep');
        expect(_.isEqual(actual, expected, comparer)).to.be(true);
      }
      {
        var object = [{
          number: 1,
          func: function() {},
          more: {
            number: 2,
            f: function() {}
          }
        }];

        var expected = [{number:1, func: function() {}}, {number:2, f:function(){}}];
        var actual = utils.flatten(object, 'more', 'deep');
        expect(_.isEqual(actual, expected, comparer)).to.be(true);
      }
      {
        var object = {
          number: 1,
          more: {
            number: 2,
          }
        };

        var expected = [{number:1, func: function() {}}, {number:2, f:function(){}}];
        var actual = utils.flatten(object, 'more', 'deep');
        expect(_.isEqual(actual, expected, comparer)).to.be(true);
      }
    })
  });
});