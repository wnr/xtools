'use strict';

var utils = exports;

utils.noop = function() {};

utils.isUndefined = function(value) {
	return typeof value === 'undefined';
};