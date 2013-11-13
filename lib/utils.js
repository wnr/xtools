'use strict';

var utils = exports;

utils.noop = function() {};

utils.isSet = function(object) {
  return typeof object !== 'undefined' && object !== null;
};

utils.flatten = function(collection, index, order, depth) {
  order = order || 'shallow';

  var result = utils.copy(utils.isArray(collection) ? collection : [collection]);

  if(depth == 0) {
    return result;
  }

  var levelLimit = result.length;

  for(var i = 0; i < result.length; i++) {
    if(utils.isSet(depth) && i == levelLimit) {
      //One depth has been flattened.
       depth--;
       levelLimit = result.length;

       if(depth === 0) {
        break;
       }
    }

    if(result[i][index]) {
      if(order === 'shallow') {
        result = result.concat(utils.flatten(result[i][index], index, order, 0));
      } else if(order === 'deep') {
        var end = result.splice(i + 1, result.length - (i + 1));
        result = result.concat(utils.flatten(result[i][index], index, order, depth));
        result = result.concat(end);
      }

      delete result[i][index];
    }
  }

  return result;
};

// Functions below are stolen from Angular.js
//
// https://github.com/angular/angular.js/blob/master/src/Angular.js
// commit 98adc9e0383dc05efad168f30a0725cb67f5eda8

utils.isString = function(value) { return typeof value == 'string'; }
utils.isNumber = function(value) { return typeof value == 'number'; }
utils.isDate = function(value) { return toString.apply(value) == '[object Date]'; }
utils.isArray = function(value) { return toString.apply(value) == '[object Array]'; }
utils.isFunction = function(value) { return typeof value == 'function'; }
utils.isRegExp = function(value) { return toString.apply(value) == '[object RegExp]'; }
utils.isBoolean = function(value) { return typeof value == 'boolean'; }
utils.isObject = function(value) { return value != null && typeof value == 'object'; }

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
utils.copy = function(source, destination){
  if (!destination) {
    destination = source;
    if (source) {
      if (utils.isArray(source)) {
        destination = utils.copy(source, []);
      } else if (utils.isDate(source)) {
        destination = new Date(source.getTime());
      } else if (utils.isRegExp(source)) {
        destination = new RegExp(source.source);
      } else if (utils.isObject(source)) {
        destination = utils.copy(source, {});
      }
    }
  } else {
    if (source === destination) {
      throw new Error('Can\'t copy! Source and destination are identical.');
    }
    if (utils.isArray(source)) {
      destination.length = 0;
      for ( var i = 0; i < source.length; i++) {
        destination.push(utils.copy(source[i]));
      }
    } else {
      var h = destination.$$hashKey;
      forEach(destination, function(value, key){
        delete destination[key];
      });
      for ( var key in source) {
        destination[key] = utils.copy(source[key]);
      }
      setHashKey(destination,h);
    }
  }
  return destination;
}

/**
 * Set or clear the hashkey for an object.
 * @param obj object
 * @param h the hashkey (!truthy to delete the hashkey)
 */
function setHashKey(obj, h) {
  if (h) {
    obj.$$hashKey = h;
  }
  else {
    delete obj.$$hashKey;
  }
}

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
    if (utils.isFunction(obj)){
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

  return utils.isString(obj) || utils.isArray(obj) || length === 0 ||
         typeof length === 'number' && length > 0 && (length - 1) in obj;
}