'use strict';

var _ = require('lodash');

// ---- Exports -----------------------------------------------------------------------------------

exports.isSet = isSet;
exports.flatten = flatten;

// ---- Public functions --------------------------------------------------------------------------

function isSet(value) { return !(_.isUndefined(value) || _.isNull(value)); };

function flatten(collection, index, order, depth, remove) {
  order = order || 'shallow';
  remove = isSet(remove) ? remove : true;

  var result = _.cloneDeep(_.isArray(collection) ? collection : [collection]);

  if(isSet(depth) && depth === 0) {
    if(remove) {
      result = result.map(function(element) {
        delete element[index];
        return element;
      });
    }

    return result;
  }

  var levelLimit = result.length;

  for(var i = 0; i < result.length; i++) {
    if(isSet(depth) && i == levelLimit) {
      //One depth has been flattened.
       depth--;
       levelLimit = result.length;

       if(depth === 0) {
        break;
       }
    }

    if(result[i][index]) {
      if(order === 'shallow') {
        result = result.concat(flatten(result[i][index], index, order, 0, false));
      } else if(order === 'deep') {
        var end = result.splice(i + 1, result.length - (i + 1));
        result = result.concat(flatten(result[i][index], index, order, depth-1));
        result = result.concat(end);
        levelLimit += result.length - end.length;
      }

      if(remove) {
        delete result[i][index];
      }
    }
  }

  return result;
};