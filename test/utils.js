var utils = require('../lib/utils.js');
var expect = require('expect.js');

describe('utils', function() {
  describe('flatten', function() {
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
      var object = {
        number: 1,
        more: {
          number: 2,
          more: {
            number: 3
          }
        }
      };

      var expected = [{number:1}, {number:2}, {number:3}];
      var actual = utils.flatten(object, 'more');
      expect(actual).to.eql(expected);
    });

    it('should be able to flatten arrays and objects', function() {
      var input = [
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

      //1
      //-2
      //--3
      //---4
      //--5
      //-6
      //--7
      //8
      //-9

      {
        var expected = [{number:1},{number:8},{number:2},{number:6},{number:9},{number:3},{number:5},{number:7},{number:4}];
        var actual = utils.flatten(input, 'more', 'shallow');
        expect(actual).to.eql(expected);
      }
      {
        var expected = [{number:1},{number:2},{number:3},{number:4},{number:5},{number:6},{number:7},{number:8},{number:9}];
        var actual = utils.flatten(input, 'more', 'deep');
        expect(actual).to.eql(expected);
      }
    });
  });
});