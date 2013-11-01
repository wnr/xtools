'use strict';

var utils = exports;

utils.noop = function() {};


/**
 * Equals function taken directly from Angular.js.
 *
 * https://github.com/angular/angular.js/blob/master/src/Angular.js
 * commit 6578bd0c82b5cbb0cd6f6fea0787fb7ce820d4e7
 */

utils.equals = function(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  var t1 = typeof o1,
    t2 = typeof o2,
    length, key, keySet;
  if (t1 == t2) {
    if (t1 == 'object') {
      if (utils.isArray(o1)) {
        if (!utils.isArray(o2)) return false;
        if ((length = o1.length) == o2.length) {
          for (key = 0; key < length; key++) {
            if (!utils.equals(o1[key], o2[key])) return false;
          }
          return true;
        }
      } else if (utils.isDate(o1)) {
        return utils.isDate(o2) && o1.getTime() == o2.getTime();
      } else if (utils.isRegExp(o1) && utils.isRegExp(o2)) {
        return o1.toString() == o2.toString();
      } else {
        if (utils.isScope(o1) || utils.isScope(o2) || utils.isWindow(o1) || utils.isWindow(o2) || utils.isArray(o2)) return false;
        keySet = {};
        for (key in o1) {
          if (key.charAt(0) === '$' || utils.isFunction(o1[key])) continue;
          if (!utils.equals(o1[key], o2[key])) return false;
          keySet[key] = true;
        }
        for (key in o2) {
          if (!keySet.hasOwnProperty(key) &&
            key.charAt(0) !== '$' &&
            o2[key] !== undefined && !utils.isFunction(o2[key])) return false;
        }
        return true;
      }
    }
  }
  return false;
};

utils.isArray = function(value) {
  return toString.apply(value) == '[object Array]';
};

utils.isDate = function(value) {
  return toString.apply(value) == '[object Date]';
};

utils.isRegExp = function(value) {
  return toString.apply(value) == '[object RegExp]';
};

utils.isScope = function(obj) {
  return obj && obj.$evalAsync && obj.$watch;
};

utils.isWindow = function(obj) {
  return obj && obj.document && obj.location && obj.alert && obj.setInterval;
};

utils.isFunction = function(value) {
  return typeof value == 'function';
};