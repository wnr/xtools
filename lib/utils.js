'use strict';

// ---- Exports -----------------------------------------------------------------------------------

exports.isSet = isSet;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isDate = isDate;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isRegExp = isRegExp;
exports.isBoolean = isBoolean;
exports.isObject = isObject;

exports.flatten = flatten;
exports.unique = unique;
exports.copy = copy;

// ---- Public functions --------------------------------------------------------------------------

function isSet(value) { return typeof value !== 'undefined' && value !== null; };
function isString(value) { return typeof value == 'string'; }
function isNumber(value) { return typeof value == 'number'; }
function isDate(value) { return toString.apply(value) == '[object Date]'; }
function isArray(value) { return toString.apply(value) == '[object Array]'; }
function isFunction(value) { return typeof value == 'function'; }
function isRegExp(value) { return toString.apply(value) == '[object RegExp]'; }
function isBoolean(value) { return typeof value == 'boolean'; }
function isObject(value) { return value != null && typeof value == 'object'; }

function flatten(collection, index, order, depth, remove) {
  order = order || 'shallow';
  remove = isSet(remove) ? remove : true;

  var result = copy(isArray(collection) ? collection : [collection]);

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

//TODO: Write test for me.
function unique(array, order) {
  order = isSet(order) ? order : true;

  if(order) {
    return array.reverse().filter(function (element, index, array) {
      return array.indexOf(element, index+1) === -1;
    }).reverse();
  } else if(!order) {
    return array.filter(function (element, index, array) {
      return array.lastIndexOf(element) === index;
    });
  }
}

// ---- Stolen public functions -------------------------------------------------------------------

// Functions below are stolen from Angular.js
//
// https://github.com/angular/angular.js/blob/master/src/Angular.js
// commit 98adc9e0383dc05efad168f30a0725cb67f5eda8

/**
 * @description
 * Creates a deep copy of `source`, which should be an object or an array.
 *
 * * If no destination is supplied, a copy of the object or array is created.
 * * If a destination is provided, all of its elements (for array) or properties (for objects)
 *   are deleted and then all elements/properties from the source are copied to it.
 * * If `source` is not an object or array (inc. `null` and `undefined`), `source` is returned.
 * * If `source` is identical to 'destination' an exception will be thrown.
 *
 * @param {*} source The source that will be used to make a copy.
 *                   Can be any type, including primitives, `null`, and `undefined`.
 * @param {(Object|Array)=} destination Destination into which the source is copied. If
 *     provided, must be of the same type as `source`.
 * @returns {*} The copy or updated `destination`, if `destination` was specified.
 */
function copy(source, destination){
  if (!destination) {
    destination = source;
    if (source) {
      if (isArray(source)) {
        destination = copy(source, []);
      } else if (isDate(source)) {
        destination = new Date(source.getTime());
      } else if (isRegExp(source)) {
        destination = new RegExp(source.source);
      } else if (isObject(source)) {
        destination = copy(source, {});
      }
    }
  } else {
    if (source === destination) {
      throw new Error('Can\'t copy! Source and destination are identical.');
    }
    if (isArray(source)) {
      destination.length = 0;
      for ( var i = 0; i < source.length; i++) {
        destination.push(copy(source[i]));
      }
    } else {
      forEach(destination, function(value, key){
        delete destination[key];
      });
      for ( var key in source) {
        destination[key] = copy(source[key]);
      }
    }
  }
  return destination;
}

// ---- Stolen private functions -------------------------------------------------------------------

/**
 * @description
 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
 * object or an array. The `iterator` function is invoked with `iterator(value, key)`, where `value`
 * is the value of an object property or an array element and `key` is the object property key or
 * array element index. Specifying a `context` for the function is optional.
 *
 * @param {Object|Array} obj Object to iterate over.
 * @param {Function} iterator Iterator function.
 * @param {Object=} context Object to become context (`this`) for the iterator function.
 * @returns {Object|Array} Reference to `obj`.
 */
function forEach(obj, iterator, context) {
  var key;
  if (obj) {
    if (isFunction(obj)){
      for (key in obj) {
        if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
      obj.forEach(iterator, context);
    } else if (isArrayLike(obj)) {
      for (key = 0; key < obj.length; key++)
        iterator.call(context, obj[key], key);
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    }
  }
  return obj;
}

/**
 * @private
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
function isArrayLike(obj) {
  if (obj == null) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === 1 && length) {
    return true;
  }

  return isString(obj) || isArray(obj) || length === 0 ||
    typeof length === 'number' && length > 0 && (length - 1) in obj;
}