(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],2:[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    var sheet = doc.createStyleSheet()
    sheet.cssText = css;
    return sheet.ownerNode;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }

    head.appendChild(style);
    return style;
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    return document.createStyleSheet(url).ownerNode;
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
    return link;
  }
};

},{}],3:[function(require,module,exports){
'use strict';
const PCancelable = require('p-cancelable');

const targetCache = new WeakMap();

const cleanCache = (target, selector) => {
	const map = targetCache.get(target);
	if (map) {
		map.delete(selector);
		if (map.size === 0) {
			targetCache.delete(target);
		}
	}
};

const elementReady = (selector, options) => {
	options = Object.assign({
		target: document
	}, options);

	if (targetCache.has(options.target) && targetCache.get(options.target).has(selector)) {
		return targetCache.get(options.target).get(selector);
	}

	let alreadyFound = false;
	const promise = new PCancelable((resolve, reject, onCancel) => {
		let rafId;
		onCancel(() => {
			cancelAnimationFrame(rafId);
			cleanCache(options.target, selector);
		});

		// Interval to keep checking for it to come into the DOM
		(function check() {
			const el = options.target.querySelector(selector);

			if (el) {
				resolve(el);
				alreadyFound = true;
				cleanCache(options.target, selector);
			} else {
				rafId = requestAnimationFrame(check);
			}
		})();
	});

	// The element might have been found in the first synchronous check
	if (!alreadyFound) {
		if (targetCache.has(options.target)) {
			targetCache.get(options.target).set(selector, promise);
		} else {
			targetCache.set(options.target, new Map([[selector, promise]]));
		}
	}

	return promise;
};

module.exports = elementReady;
module.exports.default = elementReady;

},{"p-cancelable":7}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],5:[function(require,module,exports){
module.exports = require('cssify');

},{"cssify":2}],6:[function(require,module,exports){
(function (global){
/**
 * @license
 * lodash 3.10.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -d -o ./index.js`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
  var undefined;

  /** Used as the semantic version number. */
  var VERSION = '3.10.1';

  /** Used to compose bitmasks for wrapper metadata. */
  var BIND_FLAG = 1,
      BIND_KEY_FLAG = 2,
      CURRY_BOUND_FLAG = 4,
      CURRY_FLAG = 8,
      CURRY_RIGHT_FLAG = 16,
      PARTIAL_FLAG = 32,
      PARTIAL_RIGHT_FLAG = 64,
      ARY_FLAG = 128,
      REARG_FLAG = 256;

  /** Used as default options for `_.trunc`. */
  var DEFAULT_TRUNC_LENGTH = 30,
      DEFAULT_TRUNC_OMISSION = '...';

  /** Used to detect when a function becomes hot. */
  var HOT_COUNT = 150,
      HOT_SPAN = 16;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used to indicate the type of lazy iteratees. */
  var LAZY_FILTER_FLAG = 1,
      LAZY_MAP_FLAG = 2;

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used as the internal argument placeholder. */
  var PLACEHOLDER = '__lodash_placeholder__';

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities and HTML characters. */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
      reUnescapedHtml = /[&<>"'`]/g,
      reHasEscapedHtml = RegExp(reEscapedHtml.source),
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g,
      reEvaluate = /<%([\s\S]+?)%>/g,
      reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

  /**
   * Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns)
   * and those outlined by [`EscapeRegExpPattern`](http://ecma-international.org/ecma-262/6.0/#sec-escaperegexppattern).
   */
  var reRegExpChars = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
      reHasRegExpChars = RegExp(reRegExpChars.source);

  /** Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks). */
  var reComboMark = /[\u0300-\u036f\ufe20-\ufe23]/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /** Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect hexadecimal string values. */
  var reHasHexPrefix = /^0[xX]/;

  /** Used to detect host constructors (Safari > 5). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^\d+$/;

  /** Used to match latin-1 supplementary letters (excluding mathematical operators). */
  var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used to match words to create compound words. */
  var reWords = (function() {
    var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
        lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';

    return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
  }());

  /** Used to assign default `context` object properties. */
  var contextProps = [
    'Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array',
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number',
    'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'isFinite',
    'parseFloat', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array',
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap'
  ];

  /** Used to make template sourceURLs easier to identify. */
  var templateCounter = -1;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
  cloneableTags[dateTag] = cloneableTags[float32Tag] =
  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[stringTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[mapTag] = cloneableTags[setTag] =
  cloneableTags[weakMapTag] = false;

  /** Used to map latin-1 supplementary letters to basic latin letters. */
  var deburredLetters = {
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcC': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xeC': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss'
  };

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  };

  /** Used to map HTML entities to characters. */
  var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#96;': '`'
  };

  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Used to escape characters for inclusion in compiled regexes. */
  var regexpEscapes = {
    '0': 'x30', '1': 'x31', '2': 'x32', '3': 'x33', '4': 'x34',
    '5': 'x35', '6': 'x36', '7': 'x37', '8': 'x38', '9': 'x39',
    'A': 'x41', 'B': 'x42', 'C': 'x43', 'D': 'x44', 'E': 'x45', 'F': 'x46',
    'a': 'x61', 'b': 'x62', 'c': 'x63', 'd': 'x64', 'e': 'x65', 'f': 'x66',
    'n': 'x6e', 'r': 'x72', 't': 'x74', 'u': 'x75', 'v': 'x76', 'x': 'x78'
  };

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

  /** Detect free variable `self`. */
  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

  /** Detect free variable `window`. */
  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /**
   * Used as a reference to the global object.
   *
   * The `this` value is used if it's the global object to avoid Greasemonkey's
   * restricted `window` object, otherwise the `window` object is used.
   */
  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `compareAscending` which compares values and
   * sorts them in ascending order without guaranteeing a stable sort.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {number} Returns the sort order indicator for `value`.
   */
  function baseCompareAscending(value, other) {
    if (value !== other) {
      var valIsNull = value === null,
          valIsUndef = value === undefined,
          valIsReflexive = value === value;

      var othIsNull = other === null,
          othIsUndef = other === undefined,
          othIsReflexive = other === other;

      if ((value > other && !othIsNull) || !valIsReflexive ||
          (valIsNull && !othIsUndef && othIsReflexive) ||
          (valIsUndef && othIsReflexive)) {
        return 1;
      }
      if ((value < other && !valIsNull) || !othIsReflexive ||
          (othIsNull && !valIsUndef && valIsReflexive) ||
          (othIsUndef && valIsReflexive)) {
        return -1;
      }
    }
    return 0;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {Function} predicate The function invoked per iteration.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromRight) {
    var length = array.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.indexOf` without support for binary searches.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    if (value !== value) {
      return indexOfNaN(array, fromIndex);
    }
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.isFunction` without support for environments
   * with incorrect `typeof` results.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   */
  function baseIsFunction(value) {
    // Avoid a Chakra JIT bug in compatibility modes of IE 11.
    // See https://github.com/jashkenas/underscore/issues/1621 for more details.
    return typeof value == 'function' || false;
  }

  /**
   * Converts `value` to a string if it's not one. An empty string is returned
   * for `null` or `undefined` values.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    return value == null ? '' : (value + '');
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the first character not found in `chars`.
   */
  function charsLeftIndex(string, chars) {
    var index = -1,
        length = string.length;

    while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the last character not found in `chars`.
   */
  function charsRightIndex(string, chars) {
    var index = string.length;

    while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.sortBy` to compare transformed elements of a collection and stable
   * sort them in ascending order.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareAscending(object, other) {
    return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
  }

  /**
   * Used by `_.sortByOrder` to compare multiple properties of a value to another
   * and stable sort them.
   *
   * If `orders` is unspecified, all valuess are sorted in ascending order. Otherwise,
   * a value is sorted in ascending order if its corresponding order is "asc", and
   * descending if "desc".
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {boolean[]} orders The order to sort by for each property.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareMultiple(object, other, orders) {
    var index = -1,
        objCriteria = object.criteria,
        othCriteria = other.criteria,
        length = objCriteria.length,
        ordersLength = orders.length;

    while (++index < length) {
      var result = baseCompareAscending(objCriteria[index], othCriteria[index]);
      if (result) {
        if (index >= ordersLength) {
          return result;
        }
        var order = orders[index];
        return result * ((order === 'asc' || order === true) ? 1 : -1);
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to provide the same value for
    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
    // for more details.
    //
    // This also ensures a stable sort in V8 and other engines.
    // See https://code.google.com/p/v8/issues/detail?id=90 for more details.
    return object.index - other.index;
  }

  /**
   * Used by `_.deburr` to convert latin-1 supplementary letters to basic latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  function deburrLetter(letter) {
    return deburredLetters[letter];
  }

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeHtmlChar(chr) {
    return htmlEscapes[chr];
  }

  /**
   * Used by `_.escapeRegExp` to escape characters for inclusion in compiled regexes.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @param {string} leadingChar The capture group for a leading character.
   * @param {string} whitespaceChar The capture group for a whitespace character.
   * @returns {string} Returns the escaped character.
   */
  function escapeRegExpChar(chr, leadingChar, whitespaceChar) {
    if (leadingChar) {
      chr = regexpEscapes[chr];
    } else if (whitespaceChar) {
      chr = stringEscapes[chr];
    }
    return '\\' + chr;
  }

  /**
   * Used by `_.template` to escape characters for inclusion in compiled string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /**
   * Gets the index at which the first occurrence of `NaN` is found in `array`.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched `NaN`, else `-1`.
   */
  function indexOfNaN(array, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 0 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      var other = array[index];
      if (other !== other) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Checks if `value` is object-like.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /**
   * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
   * character code is whitespace.
   *
   * @private
   * @param {number} charCode The character code to inspect.
   * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
   */
  function isSpace(charCode) {
    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
      (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
  }

  /**
   * Replaces all `placeholder` elements in `array` with an internal placeholder
   * and returns an array of their indexes.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {*} placeholder The placeholder to replace.
   * @returns {Array} Returns the new array of placeholder indexes.
   */
  function replaceHolders(array, placeholder) {
    var index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      if (array[index] === placeholder) {
        array[index] = PLACEHOLDER;
        result[++resIndex] = index;
      }
    }
    return result;
  }

  /**
   * An implementation of `_.uniq` optimized for sorted arrays without support
   * for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The function invoked per iteration.
   * @returns {Array} Returns the new duplicate-value-free array.
   */
  function sortedUniq(array, iteratee) {
    var seen,
        index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value, index, array) : value;

      if (!index || seen !== computed) {
        seen = computed;
        result[++resIndex] = value;
      }
    }
    return result;
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the first non-whitespace character.
   */
  function trimmedLeftIndex(string) {
    var index = -1,
        length = string.length;

    while (++index < length && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the last non-whitespace character.
   */
  function trimmedRightIndex(string) {
    var index = string.length;

    while (index-- && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {string} chr The matched character to unescape.
   * @returns {string} Returns the unescaped character.
   */
  function unescapeHtmlChar(chr) {
    return htmlUnescapes[chr];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new pristine `lodash` function using the given `context` object.
   *
   * @static
   * @memberOf _
   * @category Utility
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns a new `lodash` function.
   * @example
   *
   * _.mixin({ 'foo': _.constant('foo') });
   *
   * var lodash = _.runInContext();
   * lodash.mixin({ 'bar': lodash.constant('bar') });
   *
   * _.isFunction(_.foo);
   * // => true
   * _.isFunction(_.bar);
   * // => false
   *
   * lodash.isFunction(lodash.foo);
   * // => false
   * lodash.isFunction(lodash.bar);
   * // => true
   *
   * // using `context` to mock `Date#getTime` use in `_.now`
   * var mock = _.runInContext({
   *   'Date': function() {
   *     return { 'getTime': getTimeMock };
   *   }
   * });
   *
   * // or creating a suped-up `defer` in Node.js
   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See https://es5.github.io/#x11.1.5 for more details.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references. */
    var Array = context.Array,
        Date = context.Date,
        Error = context.Error,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for native method references. */
    var arrayProto = Array.prototype,
        objectProto = Object.prototype,
        stringProto = String.prototype;

    /** Used to resolve the decompiled source of functions. */
    var fnToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to generate unique IDs. */
    var idCounter = 0;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objToString = objectProto.toString;

    /** Used to restore the original `_` reference in `_.noConflict`. */
    var oldDash = root._;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Native method references. */
    var ArrayBuffer = context.ArrayBuffer,
        clearTimeout = context.clearTimeout,
        parseFloat = context.parseFloat,
        pow = Math.pow,
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        Set = getNative(context, 'Set'),
        setTimeout = context.setTimeout,
        splice = arrayProto.splice,
        Uint8Array = context.Uint8Array,
        WeakMap = getNative(context, 'WeakMap');

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil,
        nativeCreate = getNative(Object, 'create'),
        nativeFloor = Math.floor,
        nativeIsArray = getNative(Array, 'isArray'),
        nativeIsFinite = context.isFinite,
        nativeKeys = getNative(Object, 'keys'),
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeNow = getNative(Date, 'now'),
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used as references for `-Infinity` and `Infinity`. */
    var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,
        POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

    /** Used as references for the maximum length and index of an array. */
    var MAX_ARRAY_LENGTH = 4294967295,
        MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
        HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

    /**
     * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /** Used to store function metadata. */
    var metaMap = WeakMap && new WeakMap;

    /** Used to lookup unminified function names. */
    var realNames = {};

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps `value` to enable implicit chaining.
     * Methods that operate on and return arrays, collections, and functions can
     * be chained together. Methods that retrieve a single value or may return a
     * primitive value will automatically end the chain returning the unwrapped
     * value. Explicit chaining may be enabled using `_.chain`. The execution of
     * chained methods is lazy, that is, execution is deferred until `_#value`
     * is implicitly or explicitly called.
     *
     * Lazy evaluation allows several methods to support shortcut fusion. Shortcut
     * fusion is an optimization strategy which merge iteratee calls; this can help
     * to avoid the creation of intermediate data structures and greatly reduce the
     * number of iteratee executions.
     *
     * Chaining is supported in custom builds as long as the `_#value` method is
     * directly or indirectly included in the build.
     *
     * In addition to lodash methods, wrappers have `Array` and `String` methods.
     *
     * The wrapper `Array` methods are:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`,
     * `splice`, and `unshift`
     *
     * The wrapper `String` methods are:
     * `replace` and `split`
     *
     * The wrapper methods that support shortcut fusion are:
     * `compact`, `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `filter`,
     * `first`, `initial`, `last`, `map`, `pluck`, `reject`, `rest`, `reverse`,
     * `slice`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, `toArray`,
     * and `where`
     *
     * The chainable wrapper methods are:
     * `after`, `ary`, `assign`, `at`, `before`, `bind`, `bindAll`, `bindKey`,
     * `callback`, `chain`, `chunk`, `commit`, `compact`, `concat`, `constant`,
     * `countBy`, `create`, `curry`, `debounce`, `defaults`, `defaultsDeep`,
     * `defer`, `delay`, `difference`, `drop`, `dropRight`, `dropRightWhile`,
     * `dropWhile`, `fill`, `filter`, `flatten`, `flattenDeep`, `flow`, `flowRight`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`,
     * `matchesProperty`, `memoize`, `merge`, `method`, `methodOf`, `mixin`,
     * `modArgs`, `negate`, `omit`, `once`, `pairs`, `partial`, `partialRight`,
     * `partition`, `pick`, `plant`, `pluck`, `property`, `propertyOf`, `pull`,
     * `pullAt`, `push`, `range`, `rearg`, `reject`, `remove`, `rest`, `restParam`,
     * `reverse`, `set`, `shuffle`, `slice`, `sort`, `sortBy`, `sortByAll`,
     * `sortByOrder`, `splice`, `spread`, `take`, `takeRight`, `takeRightWhile`,
     * `takeWhile`, `tap`, `throttle`, `thru`, `times`, `toArray`, `toPlainObject`,
     * `transform`, `union`, `uniq`, `unshift`, `unzip`, `unzipWith`, `values`,
     * `valuesIn`, `where`, `without`, `wrap`, `xor`, `zip`, `zipObject`, `zipWith`
     *
     * The wrapper methods that are **not** chainable by default are:
     * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clone`, `cloneDeep`,
     * `deburr`, `endsWith`, `escape`, `escapeRegExp`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `findWhere`, `first`,
     * `floor`, `get`, `gt`, `gte`, `has`, `identity`, `includes`, `indexOf`,
     * `inRange`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isError`, `isFinite` `isFunction`, `isMatch`,
     * `isNative`, `isNaN`, `isNull`, `isNumber`, `isObject`, `isPlainObject`,
     * `isRegExp`, `isString`, `isUndefined`, `isTypedArray`, `join`, `kebabCase`,
     * `last`, `lastIndexOf`, `lt`, `lte`, `max`, `min`, `noConflict`, `noop`,
     * `now`, `pad`, `padLeft`, `padRight`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `repeat`, `result`, `round`, `runInContext`, `shift`, `size`,
     * `snakeCase`, `some`, `sortedIndex`, `sortedLastIndex`, `startCase`,
     * `startsWith`, `sum`, `template`, `trim`, `trimLeft`, `trimRight`, `trunc`,
     * `unescape`, `uniqueId`, `value`, and `words`
     *
     * The wrapper method `sample` will return a wrapped value when `n` is provided,
     * otherwise an unwrapped value is returned.
     *
     * @name _
     * @constructor
     * @category Chain
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(total, n) {
     *   return total + n;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(n) {
     *   return n * n;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
        if (value instanceof LodashWrapper) {
          return value;
        }
        if (hasOwnProperty.call(value, '__chain__') && hasOwnProperty.call(value, '__wrapped__')) {
          return wrapperClone(value);
        }
      }
      return new LodashWrapper(value);
    }

    /**
     * The function whose prototype all chaining wrappers inherit from.
     *
     * @private
     */
    function baseLodash() {
      // No operation performed.
    }

    /**
     * The base constructor for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap.
     * @param {boolean} [chainAll] Enable chaining for all wrapper methods.
     * @param {Array} [actions=[]] Actions to peform to resolve the unwrapped value.
     */
    function LodashWrapper(value, chainAll, actions) {
      this.__wrapped__ = value;
      this.__actions__ = actions || [];
      this.__chain__ = !!chainAll;
    }

    /**
     * An object environment feature flags.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * By default, the template delimiters used by lodash are like those in
     * embedded Ruby (ERB). Change the following template settings to use
     * alternative delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': reEscape,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': reEvaluate,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*------------------------------------------------------------------------*/

    /**
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
     *
     * @private
     * @param {*} value The value to wrap.
     */
    function LazyWrapper(value) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__dir__ = 1;
      this.__filtered__ = false;
      this.__iteratees__ = [];
      this.__takeCount__ = POSITIVE_INFINITY;
      this.__views__ = [];
    }

    /**
     * Creates a clone of the lazy wrapper object.
     *
     * @private
     * @name clone
     * @memberOf LazyWrapper
     * @returns {Object} Returns the cloned `LazyWrapper` object.
     */
    function lazyClone() {
      var result = new LazyWrapper(this.__wrapped__);
      result.__actions__ = arrayCopy(this.__actions__);
      result.__dir__ = this.__dir__;
      result.__filtered__ = this.__filtered__;
      result.__iteratees__ = arrayCopy(this.__iteratees__);
      result.__takeCount__ = this.__takeCount__;
      result.__views__ = arrayCopy(this.__views__);
      return result;
    }

    /**
     * Reverses the direction of lazy iteration.
     *
     * @private
     * @name reverse
     * @memberOf LazyWrapper
     * @returns {Object} Returns the new reversed `LazyWrapper` object.
     */
    function lazyReverse() {
      if (this.__filtered__) {
        var result = new LazyWrapper(this);
        result.__dir__ = -1;
        result.__filtered__ = true;
      } else {
        result = this.clone();
        result.__dir__ *= -1;
      }
      return result;
    }

    /**
     * Extracts the unwrapped value from its lazy wrapper.
     *
     * @private
     * @name value
     * @memberOf LazyWrapper
     * @returns {*} Returns the unwrapped value.
     */
    function lazyValue() {
      var array = this.__wrapped__.value(),
          dir = this.__dir__,
          isArr = isArray(array),
          isRight = dir < 0,
          arrLength = isArr ? array.length : 0,
          view = getView(0, arrLength, this.__views__),
          start = view.start,
          end = view.end,
          length = end - start,
          index = isRight ? end : (start - 1),
          iteratees = this.__iteratees__,
          iterLength = iteratees.length,
          resIndex = 0,
          takeCount = nativeMin(length, this.__takeCount__);

      if (!isArr || arrLength < LARGE_ARRAY_SIZE || (arrLength == length && takeCount == length)) {
        return baseWrapperValue((isRight && isArr) ? array.reverse() : array, this.__actions__);
      }
      var result = [];

      outer:
      while (length-- && resIndex < takeCount) {
        index += dir;

        var iterIndex = -1,
            value = array[index];

        while (++iterIndex < iterLength) {
          var data = iteratees[iterIndex],
              iteratee = data.iteratee,
              type = data.type,
              computed = iteratee(value);

          if (type == LAZY_MAP_FLAG) {
            value = computed;
          } else if (!computed) {
            if (type == LAZY_FILTER_FLAG) {
              continue outer;
            } else {
              break outer;
            }
          }
        }
        result[resIndex++] = value;
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a cache object to store key/value pairs.
     *
     * @private
     * @static
     * @name Cache
     * @memberOf _.memoize
     */
    function MapCache() {
      this.__data__ = {};
    }

    /**
     * Removes `key` and its value from the cache.
     *
     * @private
     * @name delete
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.
     */
    function mapDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }

    /**
     * Gets the cached value for `key`.
     *
     * @private
     * @name get
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the cached value.
     */
    function mapGet(key) {
      return key == '__proto__' ? undefined : this.__data__[key];
    }

    /**
     * Checks if a cached value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapHas(key) {
      return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
    }

    /**
     * Sets `value` to `key` of the cache.
     *
     * @private
     * @name set
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to cache.
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache object.
     */
    function mapSet(key, value) {
      if (key != '__proto__') {
        this.__data__[key] = value;
      }
      return this;
    }

    /*------------------------------------------------------------------------*/

    /**
     *
     * Creates a cache object to store unique values.
     *
     * @private
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var length = values ? values.length : 0;

      this.data = { 'hash': nativeCreate(null), 'set': new Set };
      while (length--) {
        this.push(values[length]);
      }
    }

    /**
     * Checks if `value` is in `cache` mimicking the return signature of
     * `_.indexOf` by returning `0` if the value is found, else `-1`.
     *
     * @private
     * @param {Object} cache The cache to search.
     * @param {*} value The value to search for.
     * @returns {number} Returns `0` if `value` is found, else `-1`.
     */
    function cacheIndexOf(cache, value) {
      var data = cache.data,
          result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

      return result ? 0 : -1;
    }

    /**
     * Adds `value` to the cache.
     *
     * @private
     * @name push
     * @memberOf SetCache
     * @param {*} value The value to cache.
     */
    function cachePush(value) {
      var data = this.data;
      if (typeof value == 'string' || isObject(value)) {
        data.set.add(value);
      } else {
        data.hash[value] = true;
      }
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a new array joining `array` with `other`.
     *
     * @private
     * @param {Array} array The array to join.
     * @param {Array} other The other array to join.
     * @returns {Array} Returns the new concatenated array.
     */
    function arrayConcat(array, other) {
      var index = -1,
          length = array.length,
          othIndex = -1,
          othLength = other.length,
          result = Array(length + othLength);

      while (++index < length) {
        result[index] = array[index];
      }
      while (++othIndex < othLength) {
        result[index++] = other[othIndex];
      }
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function arrayCopy(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.forEachRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEachRight(array, iteratee) {
      var length = array.length;

      while (length--) {
        if (iteratee(array[length], length, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.every` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     */
    function arrayEvery(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (!predicate(array[index], index, array)) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseExtremum` for arrays which invokes `iteratee`
     * with one argument: (value).
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {*} Returns the extremum value.
     */
    function arrayExtremum(array, iteratee, comparator, exValue) {
      var index = -1,
          length = array.length,
          computed = exValue,
          result = computed;

      while (++index < length) {
        var value = array[index],
            current = +iteratee(value);

        if (comparator(current, computed)) {
          computed = current;
          result = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.filter` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.map` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.reduce` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the first element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduce(array, iteratee, accumulator, initFromArray) {
      var index = -1,
          length = array.length;

      if (initFromArray && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.reduceRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the last element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduceRight(array, iteratee, accumulator, initFromArray) {
      var length = array.length;
      if (initFromArray && length) {
        accumulator = array[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array[length], length, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.some` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * A specialized version of `_.sum` for arrays without support for callback
     * shorthands and `this` binding..
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function arraySum(array, iteratee) {
      var length = array.length,
          result = 0;

      while (length--) {
        result += +iteratee(array[length]) || 0;
      }
      return result;
    }

    /**
     * Used by `_.defaults` to customize its `_.assign` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : objectValue;
    }

    /**
     * Used by `_.template` to customize its `_.assign` use.
     *
     * **Note:** This function is like `assignDefaults` except that it ignores
     * inherited property values when checking if a property is `undefined`.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @param {string} key The key associated with the object and source values.
     * @param {Object} object The destination object.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignOwnDefaults(objectValue, sourceValue, key, object) {
      return (objectValue === undefined || !hasOwnProperty.call(object, key))
        ? sourceValue
        : objectValue;
    }

    /**
     * A specialized version of `_.assign` for customizing assigned values without
     * support for argument juggling, multiple sources, and `this` binding `customizer`
     * functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Object} Returns `object`.
     */
    function assignWith(object, source, customizer) {
      var index = -1,
          props = keys(source),
          length = props.length;

      while (++index < length) {
        var key = props[index],
            value = object[key],
            result = customizer(value, source[key], key, object, source);

        if ((result === result ? (result !== value) : (value === value)) ||
            (value === undefined && !(key in object))) {
          object[key] = result;
        }
      }
      return object;
    }

    /**
     * The base implementation of `_.assign` without support for argument juggling,
     * multiple sources, and `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return source == null
        ? object
        : baseCopy(source, keys(source), object);
    }

    /**
     * The base implementation of `_.at` without support for string collections
     * and individual key arguments.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {number[]|string[]} props The property names or indexes of elements to pick.
     * @returns {Array} Returns the new array of picked elements.
     */
    function baseAt(collection, props) {
      var index = -1,
          isNil = collection == null,
          isArr = !isNil && isArrayLike(collection),
          length = isArr ? collection.length : 0,
          propsLength = props.length,
          result = Array(propsLength);

      while(++index < propsLength) {
        var key = props[index];
        if (isArr) {
          result[index] = isIndex(key, length) ? collection[key] : undefined;
        } else {
          result[index] = isNil ? undefined : collection[key];
        }
      }
      return result;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property names to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @returns {Object} Returns `object`.
     */
    function baseCopy(source, props, object) {
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];
        object[key] = source[key];
      }
      return object;
    }

    /**
     * The base implementation of `_.callback` which supports specifying the
     * number of arguments to provide to `func`.
     *
     * @private
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function baseCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (type == 'function') {
        return thisArg === undefined
          ? func
          : bindCallback(func, thisArg, argCount);
      }
      if (func == null) {
        return identity;
      }
      if (type == 'object') {
        return baseMatches(func);
      }
      return thisArg === undefined
        ? property(func)
        : baseMatchesProperty(func, thisArg);
    }

    /**
     * The base implementation of `_.clone` without support for argument juggling
     * and `this` binding `customizer` functions.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The object `value` belongs to.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
      var result;
      if (customizer) {
        result = object ? customizer(value, key, object) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return arrayCopy(value, result);
        }
      } else {
        var tag = objToString.call(value),
            isFunc = tag == funcTag;

        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          result = initCloneObject(isFunc ? {} : value);
          if (!isDeep) {
            return baseAssign(result, value);
          }
        } else {
          return cloneableTags[tag]
            ? initCloneByTag(value, tag, isDeep)
            : (object ? value : {});
        }
      }
      // Check for circular references and return its corresponding clone.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == value) {
          return stackB[length];
        }
      }
      // Add the source value to the stack of traversed objects and associate it with its clone.
      stackA.push(value);
      stackB.push(result);

      // Recursively populate clone (susceptible to call stack limits).
      (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
      });
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(prototype) {
        if (isObject(prototype)) {
          object.prototype = prototype;
          var result = new object;
          object.prototype = undefined;
        }
        return result || {};
      };
    }());

    /**
     * The base implementation of `_.delay` and `_.defer` which accepts an index
     * of where to slice the arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {Object} args The arguments provide to `func`.
     * @returns {number} Returns the timer id.
     */
    function baseDelay(func, wait, args) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * The base implementation of `_.difference` which accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values) {
      var length = array ? array.length : 0,
          result = [];

      if (!length) {
        return result;
      }
      var index = -1,
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
          valuesLength = values.length;

      if (cache) {
        indexOf = cacheIndexOf;
        isCommon = false;
        values = cache;
      }
      outer:
      while (++index < length) {
        var value = array[index];

        if (isCommon && value === value) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === value) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (indexOf(values, value, 0) < 0) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.forEach` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `_.forEachRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEachRight = createBaseEach(baseForOwnRight, true);

    /**
     * The base implementation of `_.every` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`
     */
    function baseEvery(collection, predicate) {
      var result = true;
      baseEach(collection, function(value, index, collection) {
        result = !!predicate(value, index, collection);
        return result;
      });
      return result;
    }

    /**
     * Gets the extremum value of `collection` invoking `iteratee` for each value
     * in `collection` to generate the criterion by which the value is ranked.
     * The `iteratee` is invoked with three arguments: (value, index|key, collection).
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {*} Returns the extremum value.
     */
    function baseExtremum(collection, iteratee, comparator, exValue) {
      var computed = exValue,
          result = computed;

      baseEach(collection, function(value, index, collection) {
        var current = +iteratee(value, index, collection);
        if (comparator(current, computed) || (current === exValue && current === result)) {
          computed = current;
          result = value;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.fill` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     */
    function baseFill(array, value, start, end) {
      var length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : (end >>> 0);
      start >>>= 0;

      while (start < length) {
        array[start++] = value;
      }
      return array;
    }

    /**
     * The base implementation of `_.filter` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection) {
        if (predicate(value, index, collection)) {
          result.push(value);
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
     * without support for callback shorthands and `this` binding, which iterates
     * over `collection` using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function} predicate The function invoked per iteration.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @param {boolean} [retKey] Specify returning the key of the found element
     *  instead of the element itself.
     * @returns {*} Returns the found element or its key, else `undefined`.
     */
    function baseFind(collection, predicate, eachFunc, retKey) {
      var result;
      eachFunc(collection, function(value, key, collection) {
        if (predicate(value, key, collection)) {
          result = retKey ? key : value;
          return false;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.flatten` with added support for restricting
     * flattening and specifying the start index.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
     * @param {Array} [result=[]] The initial result value.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, isDeep, isStrict, result) {
      result || (result = []);

      var index = -1,
          length = array.length;

      while (++index < length) {
        var value = array[index];
        if (isObjectLike(value) && isArrayLike(value) &&
            (isStrict || isArray(value) || isArguments(value))) {
          if (isDeep) {
            // Recursively flatten arrays (susceptible to call stack limits).
            baseFlatten(value, isDeep, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `baseForIn` and `baseForOwn` which iterates
     * over `object` properties returned by `keysFunc` invoking `iteratee` for
     * each property. Iteratee functions may exit iteration early by explicitly
     * returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `baseFor` except that it iterates over properties
     * in the opposite order.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseForRight = createBaseFor(true);

    /**
     * The base implementation of `_.forIn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForIn(object, iteratee) {
      return baseFor(object, iteratee, keysIn);
    }

    /**
     * The base implementation of `_.forOwn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return baseFor(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.forOwnRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwnRight(object, iteratee) {
      return baseForRight(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.functions` which creates an array of
     * `object` function property names filtered from those provided.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The property names to filter.
     * @returns {Array} Returns the new array of filtered property names.
     */
    function baseFunctions(object, props) {
      var index = -1,
          length = props.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var key = props[index];
        if (isFunction(object[key])) {
          result[++resIndex] = key;
        }
      }
      return result;
    }

    /**
     * The base implementation of `get` without support for string paths
     * and default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path of the property to get.
     * @param {string} [pathKey] The key representation of path.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path, pathKey) {
      if (object == null) {
        return;
      }
      if (pathKey !== undefined && pathKey in toObject(object)) {
        path = [pathKey];
      }
      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[path[index++]];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * The base implementation of `_.isEqual` without support for `this` binding
     * `customizer` functions.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `value` objects.
     * @param {Array} [stackB=[]] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = arrayTag,
          othTag = arrayTag;

      if (!objIsArr) {
        objTag = objToString.call(object);
        if (objTag == argsTag) {
          objTag = objectTag;
        } else if (objTag != objectTag) {
          objIsArr = isTypedArray(object);
        }
      }
      if (!othIsArr) {
        othTag = objToString.call(other);
        if (othTag == argsTag) {
          othTag = objectTag;
        } else if (othTag != objectTag) {
          othIsArr = isTypedArray(other);
        }
      }
      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && !(objIsArr || objIsObj)) {
        return equalByTag(object, other, objTag);
      }
      if (!isLoose) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
        }
      }
      if (!isSameTag) {
        return false;
      }
      // Assume cyclic values are equal.
      // For more information on detecting circular references see https://es5.github.io/#JO.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == object) {
          return stackB[length] == other;
        }
      }
      // Add `object` and `other` to the stack of traversed objects.
      stackA.push(object);
      stackB.push(other);

      var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

      stackA.pop();
      stackB.pop();

      return result;
    }

    /**
     * The base implementation of `_.isMatch` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} matchData The propery names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = toObject(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var result = customizer ? customizer(objValue, srcValue, key) : undefined;
          if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.map` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function baseMap(collection, iteratee) {
      var index = -1,
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value, key, collection) {
        result[++index] = iteratee(value, key, collection);
      });
      return result;
    }

    /**
     * The base implementation of `_.matches` which does not clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        var key = matchData[0][0],
            value = matchData[0][1];

        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === value && (value !== undefined || (key in toObject(object)));
        };
      }
      return function(object) {
        return baseIsMatch(object, matchData);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to compare.
     * @returns {Function} Returns the new function.
     */
    function baseMatchesProperty(path, srcValue) {
      var isArr = isArray(path),
          isCommon = isKey(path) && isStrictComparable(srcValue),
          pathKey = (path + '');

      path = toPath(path);
      return function(object) {
        if (object == null) {
          return false;
        }
        var key = pathKey;
        object = toObject(object);
        if ((isArr || !isCommon) && !(key in object)) {
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          if (object == null) {
            return false;
          }
          key = last(path);
          object = toObject(object);
        }
        return object[key] === srcValue
          ? (srcValue !== undefined || (key in object))
          : baseIsEqual(srcValue, object[key], undefined, true);
      };
    }

    /**
     * The base implementation of `_.merge` without support for argument juggling,
     * multiple sources, and `this` binding `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {Object} Returns `object`.
     */
    function baseMerge(object, source, customizer, stackA, stackB) {
      if (!isObject(object)) {
        return object;
      }
      var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
          props = isSrcArr ? undefined : keys(source);

      arrayEach(props || source, function(srcValue, key) {
        if (props) {
          key = srcValue;
          srcValue = source[key];
        }
        if (isObjectLike(srcValue)) {
          stackA || (stackA = []);
          stackB || (stackB = []);
          baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
        }
        else {
          var value = object[key],
              result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
              isCommon = result === undefined;

          if (isCommon) {
            result = srcValue;
          }
          if ((result !== undefined || (isSrcArr && !(key in object))) &&
              (isCommon || (result === result ? (result !== value) : (value === value)))) {
            object[key] = result;
          }
        }
      });
      return object;
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
      var length = stackA.length,
          srcValue = source[key];

      while (length--) {
        if (stackA[length] == srcValue) {
          object[key] = stackB[length];
          return;
        }
      }
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
        if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
          result = isArray(value)
            ? value
            : (isArrayLike(value) ? arrayCopy(value) : []);
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          result = isArguments(value)
            ? toPlainObject(value)
            : (isPlainObject(value) ? value : {});
        }
        else {
          isCommon = false;
        }
      }
      // Add the source value to the stack of traversed objects and associate
      // it with its merged value.
      stackA.push(srcValue);
      stackB.push(result);

      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
      } else if (result === result ? (result !== value) : (value === value)) {
        object[key] = result;
      }
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     */
    function basePropertyDeep(path) {
      var pathKey = (path + '');
      path = toPath(path);
      return function(object) {
        return baseGet(object, path, pathKey);
      };
    }

    /**
     * The base implementation of `_.pullAt` without support for individual
     * index arguments and capturing the removed elements.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {number[]} indexes The indexes of elements to remove.
     * @returns {Array} Returns `array`.
     */
    function basePullAt(array, indexes) {
      var length = array ? indexes.length : 0;
      while (length--) {
        var index = indexes[length];
        if (index != previous && isIndex(index)) {
          var previous = index;
          splice.call(array, index, 1);
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.random` without support for argument juggling
     * and returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns the random number.
     */
    function baseRandom(min, max) {
      return min + nativeFloor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.reduce` and `_.reduceRight` without support
     * for callback shorthands and `this` binding, which iterates over `collection`
     * using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} accumulator The initial value.
     * @param {boolean} initFromCollection Specify using the first or last element
     *  of `collection` as the initial value.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @returns {*} Returns the accumulated value.
     */
    function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
      eachFunc(collection, function(value, index, collection) {
        accumulator = initFromCollection
          ? (initFromCollection = false, value)
          : iteratee(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The base implementation of `setData` without support for hot loop detection.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var baseSetData = !metaMap ? identity : function(func, data) {
      metaMap.set(func, data);
      return func;
    };

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * The base implementation of `_.some` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function baseSome(collection, predicate) {
      var result;

      baseEach(collection, function(value, index, collection) {
        result = predicate(value, index, collection);
        return !result;
      });
      return !!result;
    }

    /**
     * The base implementation of `_.sortBy` which uses `comparer` to define
     * the sort order of `array` and replaces criteria objects with their
     * corresponding values.
     *
     * @private
     * @param {Array} array The array to sort.
     * @param {Function} comparer The function to define sort order.
     * @returns {Array} Returns `array`.
     */
    function baseSortBy(array, comparer) {
      var length = array.length;

      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }

    /**
     * The base implementation of `_.sortByOrder` without param guards.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} orders The sort orders of `iteratees`.
     * @returns {Array} Returns the new sorted array.
     */
    function baseSortByOrder(collection, iteratees, orders) {
      var callback = getCallback(),
          index = -1;

      iteratees = arrayMap(iteratees, function(iteratee) { return callback(iteratee); });

      var result = baseMap(collection, function(value) {
        var criteria = arrayMap(iteratees, function(iteratee) { return iteratee(value); });
        return { 'criteria': criteria, 'index': ++index, 'value': value };
      });

      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }

    /**
     * The base implementation of `_.sum` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function baseSum(collection, iteratee) {
      var result = 0;
      baseEach(collection, function(value, index, collection) {
        result += +iteratee(value, index, collection) || 0;
      });
      return result;
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The function invoked per iteration.
     * @returns {Array} Returns the new duplicate-value-free array.
     */
    function baseUniq(array, iteratee) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array.length,
          isCommon = indexOf == baseIndexOf,
          isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
          seen = isLarge ? createCache() : null,
          result = [];

      if (seen) {
        indexOf = cacheIndexOf;
        isCommon = false;
      } else {
        isLarge = false;
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value, index, array) : value;

        if (isCommon && value === value) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (indexOf(seen, computed, 0) < 0) {
          if (iteratee || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.values` and `_.valuesIn` which creates an
     * array of `object` property values corresponding to the property names
     * of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the array of property values.
     */
    function baseValues(object, props) {
      var index = -1,
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /**
     * The base implementation of `_.dropRightWhile`, `_.dropWhile`, `_.takeRightWhile`,
     * and `_.takeWhile` without support for callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseWhile(array, predicate, isDrop, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
      return isDrop
        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
    }

    /**
     * The base implementation of `wrapperValue` which returns the result of
     * performing a sequence of actions on the unwrapped `value`, where each
     * successive action is supplied the return value of the previous.
     *
     * @private
     * @param {*} value The unwrapped value.
     * @param {Array} actions Actions to peform to resolve the unwrapped value.
     * @returns {*} Returns the resolved value.
     */
    function baseWrapperValue(value, actions) {
      var result = value;
      if (result instanceof LazyWrapper) {
        result = result.value();
      }
      var index = -1,
          length = actions.length;

      while (++index < length) {
        var action = actions[index];
        result = action.func.apply(action.thisArg, arrayPush([result], action.args));
      }
      return result;
    }

    /**
     * Performs a binary search of `array` to determine the index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndex(array, value, retHighest) {
      var low = 0,
          high = array ? array.length : low;

      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
        while (low < high) {
          var mid = (low + high) >>> 1,
              computed = array[mid];

          if ((retHighest ? (computed <= value) : (computed < value)) && computed !== null) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return high;
      }
      return binaryIndexBy(array, value, identity, retHighest);
    }

    /**
     * This function is like `binaryIndex` except that it invokes `iteratee` for
     * `value` and each element of `array` to compute their sort ranking. The
     * iteratee is invoked with one argument; (value).
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndexBy(array, value, iteratee, retHighest) {
      value = iteratee(value);

      var low = 0,
          high = array ? array.length : 0,
          valIsNaN = value !== value,
          valIsNull = value === null,
          valIsUndef = value === undefined;

      while (low < high) {
        var mid = nativeFloor((low + high) / 2),
            computed = iteratee(array[mid]),
            isDef = computed !== undefined,
            isReflexive = computed === computed;

        if (valIsNaN) {
          var setLow = isReflexive || retHighest;
        } else if (valIsNull) {
          setLow = isReflexive && isDef && (retHighest || computed != null);
        } else if (valIsUndef) {
          setLow = isReflexive && (retHighest || isDef);
        } else if (computed == null) {
          setLow = false;
        } else {
          setLow = retHighest ? (computed <= value) : (computed < value);
        }
        if (setLow) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return nativeMin(high, MAX_ARRAY_INDEX);
    }

    /**
     * A specialized version of `baseCallback` which only supports `this` binding
     * and specifying the number of arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function bindCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      if (thisArg === undefined) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
        case 5: return function(value, other, key, object, source) {
          return func.call(thisArg, value, other, key, object, source);
        };
      }
      return function() {
        return func.apply(thisArg, arguments);
      };
    }

    /**
     * Creates a clone of the given array buffer.
     *
     * @private
     * @param {ArrayBuffer} buffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function bufferClone(buffer) {
      var result = new ArrayBuffer(buffer.byteLength),
          view = new Uint8Array(result);

      view.set(new Uint8Array(buffer));
      return result;
    }

    /**
     * Creates an array that is the composition of partially applied arguments,
     * placeholders, and provided arguments into a single array of arguments.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to prepend to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgs(args, partials, holders) {
      var holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          leftIndex = -1,
          leftLength = partials.length,
          result = Array(leftLength + argsLength);

      while (++leftIndex < leftLength) {
        result[leftIndex] = partials[leftIndex];
      }
      while (++argsIndex < holdersLength) {
        result[holders[argsIndex]] = args[argsIndex];
      }
      while (argsLength--) {
        result[leftIndex++] = args[argsIndex++];
      }
      return result;
    }

    /**
     * This function is like `composeArgs` except that the arguments composition
     * is tailored for `_.partialRight`.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to append to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgsRight(args, partials, holders) {
      var holdersIndex = -1,
          holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          rightIndex = -1,
          rightLength = partials.length,
          result = Array(argsLength + rightLength);

      while (++argsIndex < argsLength) {
        result[argsIndex] = args[argsIndex];
      }
      var offset = argsIndex;
      while (++rightIndex < rightLength) {
        result[offset + rightIndex] = partials[rightIndex];
      }
      while (++holdersIndex < holdersLength) {
        result[offset + holders[holdersIndex]] = args[argsIndex++];
      }
      return result;
    }

    /**
     * Creates a `_.countBy`, `_.groupBy`, `_.indexBy`, or `_.partition` function.
     *
     * @private
     * @param {Function} setter The function to set keys and values of the accumulator object.
     * @param {Function} [initializer] The function to initialize the accumulator object.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter, initializer) {
      return function(collection, iteratee, thisArg) {
        var result = initializer ? initializer() : {};
        iteratee = getCallback(iteratee, thisArg, 3);

        if (isArray(collection)) {
          var index = -1,
              length = collection.length;

          while (++index < length) {
            var value = collection[index];
            setter(result, value, iteratee(value, index, collection), collection);
          }
        } else {
          baseEach(collection, function(value, key, collection) {
            setter(result, value, iteratee(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return restParam(function(object, sources) {
        var index = -1,
            length = object == null ? 0 : sources.length,
            customizer = length > 2 ? sources[length - 2] : undefined,
            guard = length > 2 ? sources[2] : undefined,
            thisArg = length > 1 ? sources[length - 1] : undefined;

        if (typeof customizer == 'function') {
          customizer = bindCallback(customizer, thisArg, 5);
          length -= 2;
        } else {
          customizer = typeof thisArg == 'function' ? thisArg : undefined;
          length -= (customizer ? 1 : 0);
        }
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, customizer);
          }
        }
        return object;
      });
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        var length = collection ? getLength(collection) : 0;
        if (!isLength(length)) {
          return eachFunc(collection, iteratee);
        }
        var index = fromRight ? length : -1,
            iterable = toObject(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var iterable = toObject(object),
            props = keysFunc(object),
            length = props.length,
            index = fromRight ? length : -1;

        while ((fromRight ? index-- : ++index < length)) {
          var key = props[index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with the `this`
     * binding of `thisArg`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @returns {Function} Returns the new bound function.
     */
    function createBindWrapper(func, thisArg) {
      var Ctor = createCtorWrapper(func);

      function wrapper() {
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(thisArg, arguments);
      }
      return wrapper;
    }

    /**
     * Creates a `Set` cache object to optimize linear searches of large arrays.
     *
     * @private
     * @param {Array} [values] The values to cache.
     * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
     */
    function createCache(values) {
      return (nativeCreate && Set) ? new SetCache(values) : null;
    }

    /**
     * Creates a function that produces compound words out of the words in a
     * given string.
     *
     * @private
     * @param {Function} callback The function to combine each word.
     * @returns {Function} Returns the new compounder function.
     */
    function createCompounder(callback) {
      return function(string) {
        var index = -1,
            array = words(deburr(string)),
            length = array.length,
            result = '';

        while (++index < length) {
          result = callback(result, array[index], index);
        }
        return result;
      };
    }

    /**
     * Creates a function that produces an instance of `Ctor` regardless of
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
     *
     * @private
     * @param {Function} Ctor The constructor to wrap.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCtorWrapper(Ctor) {
      return function() {
        // Use a `switch` statement to work with class constructors.
        // See http://ecma-international.org/ecma-262/6.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
        // for more details.
        var args = arguments;
        switch (args.length) {
          case 0: return new Ctor;
          case 1: return new Ctor(args[0]);
          case 2: return new Ctor(args[0], args[1]);
          case 3: return new Ctor(args[0], args[1], args[2]);
          case 4: return new Ctor(args[0], args[1], args[2], args[3]);
          case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
          case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
          case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
        var thisBinding = baseCreate(Ctor.prototype),
            result = Ctor.apply(thisBinding, args);

        // Mimic the constructor's `return` behavior.
        // See https://es5.github.io/#x13.2.2 for more details.
        return isObject(result) ? result : thisBinding;
      };
    }

    /**
     * Creates a `_.curry` or `_.curryRight` function.
     *
     * @private
     * @param {boolean} flag The curry bit flag.
     * @returns {Function} Returns the new curry function.
     */
    function createCurry(flag) {
      function curryFunc(func, arity, guard) {
        if (guard && isIterateeCall(func, arity, guard)) {
          arity = undefined;
        }
        var result = createWrapper(func, flag, undefined, undefined, undefined, undefined, undefined, arity);
        result.placeholder = curryFunc.placeholder;
        return result;
      }
      return curryFunc;
    }

    /**
     * Creates a `_.defaults` or `_.defaultsDeep` function.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Function} Returns the new defaults function.
     */
    function createDefaults(assigner, customizer) {
      return restParam(function(args) {
        var object = args[0];
        if (object == null) {
          return object;
        }
        args.push(customizer);
        return assigner.apply(undefined, args);
      });
    }

    /**
     * Creates a `_.max` or `_.min` function.
     *
     * @private
     * @param {Function} comparator The function used to compare values.
     * @param {*} exValue The initial extremum value.
     * @returns {Function} Returns the new extremum function.
     */
    function createExtremum(comparator, exValue) {
      return function(collection, iteratee, thisArg) {
        if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
          iteratee = undefined;
        }
        iteratee = getCallback(iteratee, thisArg, 3);
        if (iteratee.length == 1) {
          collection = isArray(collection) ? collection : toIterable(collection);
          var result = arrayExtremum(collection, iteratee, comparator, exValue);
          if (!(collection.length && result === exValue)) {
            return result;
          }
        }
        return baseExtremum(collection, iteratee, comparator, exValue);
      };
    }

    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFind(eachFunc, fromRight) {
      return function(collection, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        if (isArray(collection)) {
          var index = baseFindIndex(collection, predicate, fromRight);
          return index > -1 ? collection[index] : undefined;
        }
        return baseFind(collection, predicate, eachFunc);
      };
    }

    /**
     * Creates a `_.findIndex` or `_.findLastIndex` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFindIndex(fromRight) {
      return function(array, predicate, thisArg) {
        if (!(array && array.length)) {
          return -1;
        }
        predicate = getCallback(predicate, thisArg, 3);
        return baseFindIndex(array, predicate, fromRight);
      };
    }

    /**
     * Creates a `_.findKey` or `_.findLastKey` function.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new find function.
     */
    function createFindKey(objectFunc) {
      return function(object, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        return baseFind(object, predicate, objectFunc, true);
      };
    }

    /**
     * Creates a `_.flow` or `_.flowRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new flow function.
     */
    function createFlow(fromRight) {
      return function() {
        var wrapper,
            length = arguments.length,
            index = fromRight ? length : -1,
            leftIndex = 0,
            funcs = Array(length);

        while ((fromRight ? index-- : ++index < length)) {
          var func = funcs[leftIndex++] = arguments[index];
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (!wrapper && LodashWrapper.prototype.thru && getFuncName(func) == 'wrapper') {
            wrapper = new LodashWrapper([], true);
          }
        }
        index = wrapper ? -1 : length;
        while (++index < length) {
          func = funcs[index];

          var funcName = getFuncName(func),
              data = funcName == 'wrapper' ? getData(func) : undefined;

          if (data && isLaziable(data[0]) && data[1] == (ARY_FLAG | CURRY_FLAG | PARTIAL_FLAG | REARG_FLAG) && !data[4].length && data[9] == 1) {
            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
          } else {
            wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
          }
        }
        return function() {
          var args = arguments,
              value = args[0];

          if (wrapper && args.length == 1 && isArray(value) && value.length >= LARGE_ARRAY_SIZE) {
            return wrapper.plant(value).value();
          }
          var index = 0,
              result = length ? funcs[index].apply(this, args) : value;

          while (++index < length) {
            result = funcs[index].call(this, result);
          }
          return result;
        };
      };
    }

    /**
     * Creates a function for `_.forEach` or `_.forEachRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createForEach(arrayFunc, eachFunc) {
      return function(collection, iteratee, thisArg) {
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee)
          : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
      };
    }

    /**
     * Creates a function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForIn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee, keysIn);
      };
    }

    /**
     * Creates a function for `_.forOwn` or `_.forOwnRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForOwn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee);
      };
    }

    /**
     * Creates a function for `_.mapKeys` or `_.mapValues`.
     *
     * @private
     * @param {boolean} [isMapKeys] Specify mapping keys instead of values.
     * @returns {Function} Returns the new map function.
     */
    function createObjectMapper(isMapKeys) {
      return function(object, iteratee, thisArg) {
        var result = {};
        iteratee = getCallback(iteratee, thisArg, 3);

        baseForOwn(object, function(value, key, object) {
          var mapped = iteratee(value, key, object);
          key = isMapKeys ? mapped : key;
          value = isMapKeys ? value : mapped;
          result[key] = value;
        });
        return result;
      };
    }

    /**
     * Creates a function for `_.padLeft` or `_.padRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify padding from the right.
     * @returns {Function} Returns the new pad function.
     */
    function createPadDir(fromRight) {
      return function(string, length, chars) {
        string = baseToString(string);
        return (fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string);
      };
    }

    /**
     * Creates a `_.partial` or `_.partialRight` function.
     *
     * @private
     * @param {boolean} flag The partial bit flag.
     * @returns {Function} Returns the new partial function.
     */
    function createPartial(flag) {
      var partialFunc = restParam(function(func, partials) {
        var holders = replaceHolders(partials, partialFunc.placeholder);
        return createWrapper(func, flag, undefined, partials, holders);
      });
      return partialFunc;
    }

    /**
     * Creates a function for `_.reduce` or `_.reduceRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createReduce(arrayFunc, eachFunc) {
      return function(collection, iteratee, accumulator, thisArg) {
        var initFromArray = arguments.length < 3;
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee, accumulator, initFromArray)
          : baseReduce(collection, getCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with optional `this`
     * binding of, partial application, and currying.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [partialsRight] The arguments to append to those provided to the new function.
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
      var isAry = bitmask & ARY_FLAG,
          isBind = bitmask & BIND_FLAG,
          isBindKey = bitmask & BIND_KEY_FLAG,
          isCurry = bitmask & CURRY_FLAG,
          isCurryBound = bitmask & CURRY_BOUND_FLAG,
          isCurryRight = bitmask & CURRY_RIGHT_FLAG,
          Ctor = isBindKey ? undefined : createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it to other functions.
        var length = arguments.length,
            index = length,
            args = Array(length);

        while (index--) {
          args[index] = arguments[index];
        }
        if (partials) {
          args = composeArgs(args, partials, holders);
        }
        if (partialsRight) {
          args = composeArgsRight(args, partialsRight, holdersRight);
        }
        if (isCurry || isCurryRight) {
          var placeholder = wrapper.placeholder,
              argsHolders = replaceHolders(args, placeholder);

          length -= argsHolders.length;
          if (length < arity) {
            var newArgPos = argPos ? arrayCopy(argPos) : undefined,
                newArity = nativeMax(arity - length, 0),
                newsHolders = isCurry ? argsHolders : undefined,
                newHoldersRight = isCurry ? undefined : argsHolders,
                newPartials = isCurry ? args : undefined,
                newPartialsRight = isCurry ? undefined : args;

            bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
            bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

            if (!isCurryBound) {
              bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
            }
            var newData = [func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, newArity],
                result = createHybridWrapper.apply(undefined, newData);

            if (isLaziable(func)) {
              setData(result, newData);
            }
            result.placeholder = placeholder;
            return result;
          }
        }
        var thisBinding = isBind ? thisArg : this,
            fn = isBindKey ? thisBinding[func] : func;

        if (argPos) {
          args = reorder(args, argPos);
        }
        if (isAry && ary < args.length) {
          args.length = ary;
        }
        if (this && this !== root && this instanceof wrapper) {
          fn = Ctor || createCtorWrapper(func);
        }
        return fn.apply(thisBinding, args);
      }
      return wrapper;
    }

    /**
     * Creates the padding required for `string` based on the given `length`.
     * The `chars` string is truncated if the number of characters exceeds `length`.
     *
     * @private
     * @param {string} string The string to create padding for.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the pad for `string`.
     */
    function createPadding(string, length, chars) {
      var strLength = string.length;
      length = +length;

      if (strLength >= length || !nativeIsFinite(length)) {
        return '';
      }
      var padLength = length - strLength;
      chars = chars == null ? ' ' : (chars + '');
      return repeat(chars, nativeCeil(padLength / chars.length)).slice(0, padLength);
    }

    /**
     * Creates a function that wraps `func` and invokes it with the optional `this`
     * binding of `thisArg` and the `partials` prepended to those provided to
     * the wrapper.
     *
     * @private
     * @param {Function} func The function to partially apply arguments to.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} partials The arguments to prepend to those provided to the new function.
     * @returns {Function} Returns the new bound function.
     */
    function createPartialWrapper(func, bitmask, thisArg, partials) {
      var isBind = bitmask & BIND_FLAG,
          Ctor = createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it `func`.
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(leftLength + argsLength);

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }
        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(isBind ? thisArg : this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.ceil`, `_.floor`, or `_.round` function.
     *
     * @private
     * @param {string} methodName The name of the `Math` method to use when rounding.
     * @returns {Function} Returns the new round function.
     */
    function createRound(methodName) {
      var func = Math[methodName];
      return function(number, precision) {
        precision = precision === undefined ? 0 : (+precision || 0);
        if (precision) {
          precision = pow(10, precision);
          return func(number * precision) / precision;
        }
        return func(number);
      };
    }

    /**
     * Creates a `_.sortedIndex` or `_.sortedLastIndex` function.
     *
     * @private
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {Function} Returns the new index function.
     */
    function createSortedIndex(retHighest) {
      return function(array, value, iteratee, thisArg) {
        var callback = getCallback(iteratee);
        return (iteratee == null && callback === baseCallback)
          ? binaryIndex(array, value, retHighest)
          : binaryIndexBy(array, value, callback(iteratee, thisArg, 1), retHighest);
      };
    }

    /**
     * Creates a function that either curries or invokes `func` with optional
     * `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags.
     *  The bitmask may be composed of the following flags:
     *     1 - `_.bind`
     *     2 - `_.bindKey`
     *     4 - `_.curry` or `_.curryRight` of a bound function
     *     8 - `_.curry`
     *    16 - `_.curryRight`
     *    32 - `_.partial`
     *    64 - `_.partialRight`
     *   128 - `_.rearg`
     *   256 - `_.ary`
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to be partially applied.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
      var isBindKey = bitmask & BIND_KEY_FLAG;
      if (!isBindKey && typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = partials ? partials.length : 0;
      if (!length) {
        bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
        partials = holders = undefined;
      }
      length -= (holders ? holders.length : 0);
      if (bitmask & PARTIAL_RIGHT_FLAG) {
        var partialsRight = partials,
            holdersRight = holders;

        partials = holders = undefined;
      }
      var data = isBindKey ? undefined : getData(func),
          newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];

      if (data) {
        mergeData(newData, data);
        bitmask = newData[1];
        arity = newData[9];
      }
      newData[9] = arity == null
        ? (isBindKey ? 0 : func.length)
        : (nativeMax(arity - length, 0) || 0);

      if (bitmask == BIND_FLAG) {
        var result = createBindWrapper(newData[0], newData[2]);
      } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {
        result = createPartialWrapper.apply(undefined, newData);
      } else {
        result = createHybridWrapper.apply(undefined, newData);
      }
      var setter = data ? baseSetData : setData;
      return setter(result, newData);
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing arrays.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var index = -1,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
        return false;
      }
      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index],
            result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

        if (result !== undefined) {
          if (result) {
            continue;
          }
          return false;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (isLoose) {
          if (!arraySome(other, function(othValue) {
                return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
              })) {
            return false;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag) {
      switch (tag) {
        case boolTag:
        case dateTag:
          // Coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
          return +object == +other;

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case numberTag:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object)
            ? other != +other
            : object == +other;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings primitives and string
          // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
          return object == (other + '');
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objProps = keys(object),
          objLength = objProps.length,
          othProps = keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isLoose) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var skipCtor = isLoose;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key],
            result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

        // Recursively compare objects (susceptible to call stack limits).
        if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
          return false;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (!skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Gets the appropriate "callback" function. If the `_.callback` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseCallback` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function} Returns the chosen function or its result.
     */
    function getCallback(func, thisArg, argCount) {
      var result = lodash.callback || callback;
      result = result === callback ? baseCallback : result;
      return argCount ? result(func, thisArg, argCount) : result;
    }

    /**
     * Gets metadata for `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {*} Returns the metadata for `func`.
     */
    var getData = !metaMap ? noop : function(func) {
      return metaMap.get(func);
    };

    /**
     * Gets the name of `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {string} Returns the function name.
     */
    function getFuncName(func) {
      var result = func.name,
          array = realNames[result],
          length = array ? array.length : 0;

      while (length--) {
        var data = array[length],
            otherFunc = data.func;
        if (otherFunc == null || otherFunc == func) {
          return data.name;
        }
      }
      return result;
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseIndexOf` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function|number} Returns the chosen function or its result.
     */
    function getIndexOf(collection, target, fromIndex) {
      var result = lodash.indexOf || indexOf;
      result = result === indexOf ? baseIndexOf : result;
      return collection ? result(collection, target, fromIndex) : result;
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
     * that affects Safari on at least iOS 8.1-8.3 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /**
     * Gets the propery names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = pairs(object),
          length = result.length;

      while (length--) {
        result[length][2] = isStrictComparable(result[length][1]);
      }
      return result;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = object == null ? undefined : object[key];
      return isNative(value) ? value : undefined;
    }

    /**
     * Gets the view, applying any `transforms` to the `start` and `end` positions.
     *
     * @private
     * @param {number} start The start of the view.
     * @param {number} end The end of the view.
     * @param {Array} transforms The transformations to apply to the view.
     * @returns {Object} Returns an object containing the `start` and `end`
     *  positions of the view.
     */
    function getView(start, end, transforms) {
      var index = -1,
          length = transforms.length;

      while (++index < length) {
        var data = transforms[index],
            size = data.size;

        switch (data.type) {
          case 'drop':      start += size; break;
          case 'dropRight': end -= size; break;
          case 'take':      end = nativeMin(end, start + size); break;
          case 'takeRight': start = nativeMax(start, end - size); break;
        }
      }
      return { 'start': start, 'end': end };
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add array properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      var Ctor = object.constructor;
      if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
        Ctor = Object;
      }
      return new Ctor;
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return bufferClone(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          var buffer = object.buffer;
          return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          var result = new Ctor(object.source, reFlags.exec(object));
          result.lastIndex = object.lastIndex;
      }
      return result;
    }

    /**
     * Invokes the method at `path` on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {Array} args The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     */
    function invokePath(object, path, args) {
      if (object != null && !isKey(path, object)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        path = last(path);
      }
      var func = object == null ? object : object[path];
      return func == null ? undefined : func.apply(object, args);
    }

    /**
     * Checks if `value` is array-like.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     */
    function isArrayLike(value) {
      return value != null && isLength(getLength(value));
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return value > -1 && value % 1 == 0 && value < length;
    }

    /**
     * Checks if the provided arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
          ? (isArrayLike(object) && isIndex(index, object.length))
          : (type == 'string' && index in object)) {
        var other = object[index];
        return value === value ? (value === other) : (other !== other);
      }
      return false;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      var type = typeof value;
      if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
        return true;
      }
      if (isArray(value)) {
        return false;
      }
      var result = !reIsDeepProp.test(value);
      return result || (object != null && value in toObject(object));
    }

    /**
     * Checks if `func` has a lazy counterpart.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` has a lazy counterpart, else `false`.
     */
    function isLaziable(func) {
      var funcName = getFuncName(func);
      if (!(funcName in LazyWrapper.prototype)) {
        return false;
      }
      var other = lodash[funcName];
      if (func === other) {
        return true;
      }
      var data = getData(other);
      return !!data && func === data[0];
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * Merges the function metadata of `source` into `data`.
     *
     * Merging metadata reduces the number of wrappers required to invoke a function.
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
     * may be applied regardless of execution order. Methods like `_.ary` and `_.rearg`
     * augment function arguments, making the order in which they are executed important,
     * preventing the merging of metadata. However, we make an exception for a safe
     * common case where curried functions have `_.ary` and or `_.rearg` applied.
     *
     * @private
     * @param {Array} data The destination metadata.
     * @param {Array} source The source metadata.
     * @returns {Array} Returns `data`.
     */
    function mergeData(data, source) {
      var bitmask = data[1],
          srcBitmask = source[1],
          newBitmask = bitmask | srcBitmask,
          isCommon = newBitmask < ARY_FLAG;

      var isCombo =
        (srcBitmask == ARY_FLAG && bitmask == CURRY_FLAG) ||
        (srcBitmask == ARY_FLAG && bitmask == REARG_FLAG && data[7].length <= source[8]) ||
        (srcBitmask == (ARY_FLAG | REARG_FLAG) && bitmask == CURRY_FLAG);

      // Exit early if metadata can't be merged.
      if (!(isCommon || isCombo)) {
        return data;
      }
      // Use source `thisArg` if available.
      if (srcBitmask & BIND_FLAG) {
        data[2] = source[2];
        // Set when currying a bound function.
        newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;
      }
      // Compose partial arguments.
      var value = source[3];
      if (value) {
        var partials = data[3];
        data[3] = partials ? composeArgs(partials, value, source[4]) : arrayCopy(value);
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : arrayCopy(source[4]);
      }
      // Compose partial right arguments.
      value = source[5];
      if (value) {
        partials = data[5];
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : arrayCopy(value);
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : arrayCopy(source[6]);
      }
      // Use source `argPos` if available.
      value = source[7];
      if (value) {
        data[7] = arrayCopy(value);
      }
      // Use source `ary` if it's smaller.
      if (srcBitmask & ARY_FLAG) {
        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
      }
      // Use source `arity` if one is not provided.
      if (data[9] == null) {
        data[9] = source[9];
      }
      // Use source `func` and merge bitmasks.
      data[0] = source[0];
      data[1] = newBitmask;

      return data;
    }

    /**
     * Used by `_.defaultsDeep` to customize its `_.merge` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function mergeDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : merge(objectValue, sourceValue, mergeDefaults);
    }

    /**
     * A specialized version of `_.pick` which picks `object` properties specified
     * by `props`.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} props The property names to pick.
     * @returns {Object} Returns the new object.
     */
    function pickByArray(object, props) {
      object = toObject(object);

      var index = -1,
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        if (key in object) {
          result[key] = object[key];
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.pick` which picks `object` properties `predicate`
     * returns truthy for.
     *
     * @private
     * @param {Object} object The source object.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Object} Returns the new object.
     */
    function pickByCallback(object, predicate) {
      var result = {};
      baseForIn(object, function(value, key, object) {
        if (predicate(value, key, object)) {
          result[key] = value;
        }
      });
      return result;
    }

    /**
     * Reorder `array` according to the specified indexes where the element at
     * the first index is assigned as the first element, the element at
     * the second index is assigned as the second element, and so on.
     *
     * @private
     * @param {Array} array The array to reorder.
     * @param {Array} indexes The arranged array indexes.
     * @returns {Array} Returns `array`.
     */
    function reorder(array, indexes) {
      var arrLength = array.length,
          length = nativeMin(indexes.length, arrLength),
          oldArray = arrayCopy(array);

      while (length--) {
        var index = indexes[length];
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
      }
      return array;
    }

    /**
     * Sets metadata for `func`.
     *
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
     * period of time, it will trip its breaker and transition to an identity function
     * to avoid garbage collection pauses in V8. See [V8 issue 2070](https://code.google.com/p/v8/issues/detail?id=2070)
     * for more details.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var setData = (function() {
      var count = 0,
          lastCalled = 0;

      return function(key, value) {
        var stamp = now(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return key;
          }
        } else {
          count = 0;
        }
        return baseSetData(key, value);
      };
    }());

    /**
     * A fallback implementation of `Object.keys` which creates an array of the
     * own enumerable property names of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function shimKeys(object) {
      var props = keysIn(object),
          propsLength = props.length,
          length = propsLength && object.length;

      var allowIndexes = !!length && isLength(length) &&
        (isArray(object) || isArguments(object));

      var index = -1,
          result = [];

      while (++index < propsLength) {
        var key = props[index];
        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Converts `value` to an array-like object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array|Object} Returns the array-like object.
     */
    function toIterable(value) {
      if (value == null) {
        return [];
      }
      if (!isArrayLike(value)) {
        return values(value);
      }
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to an object if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject(value) {
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to property path array if it's not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array} Returns the property path array.
     */
    function toPath(value) {
      if (isArray(value)) {
        return value;
      }
      var result = [];
      baseToString(value).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    }

    /**
     * Creates a clone of `wrapper`.
     *
     * @private
     * @param {Object} wrapper The wrapper to clone.
     * @returns {Object} Returns the cloned wrapper.
     */
    function wrapperClone(wrapper) {
      return wrapper instanceof LazyWrapper
        ? wrapper.clone()
        : new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__, arrayCopy(wrapper.__actions__));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements split into groups the length of `size`.
     * If `collection` can't be split evenly, the final chunk will be the remaining
     * elements.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to process.
     * @param {number} [size=1] The length of each chunk.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new array containing chunks.
     * @example
     *
     * _.chunk(['a', 'b', 'c', 'd'], 2);
     * // => [['a', 'b'], ['c', 'd']]
     *
     * _.chunk(['a', 'b', 'c', 'd'], 3);
     * // => [['a', 'b', 'c'], ['d']]
     */
    function chunk(array, size, guard) {
      if (guard ? isIterateeCall(array, size, guard) : size == null) {
        size = 1;
      } else {
        size = nativeMax(nativeFloor(size) || 1, 1);
      }
      var index = 0,
          length = array ? array.length : 0,
          resIndex = -1,
          result = Array(nativeCeil(length / size));

      while (index < length) {
        result[++resIndex] = baseSlice(array, index, (index += size));
      }
      return result;
    }

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are falsey.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to compact.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * Creates an array of unique `array` values not included in the other
     * provided arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3], [4, 2]);
     * // => [1, 3]
     */
    var difference = restParam(function(array, values) {
      return (isObjectLike(array) && isArrayLike(array))
        ? baseDifference(array, baseFlatten(values, false, true))
        : [];
    });

    /**
     * Creates a slice of `array` with `n` elements dropped from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.drop([1, 2, 3]);
     * // => [2, 3]
     *
     * _.drop([1, 2, 3], 2);
     * // => [3]
     *
     * _.drop([1, 2, 3], 5);
     * // => []
     *
     * _.drop([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function drop(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements dropped from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRight([1, 2, 3]);
     * // => [1, 2]
     *
     * _.dropRight([1, 2, 3], 2);
     * // => [1]
     *
     * _.dropRight([1, 2, 3], 5);
     * // => []
     *
     * _.dropRight([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function dropRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the end.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that match the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [1]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active', false), 'user');
     * // => ['barney']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true, true)
        : [];
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the beginning.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropWhile(users, 'active', false), 'user');
     * // => ['pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true)
        : [];
    }

    /**
     * Fills elements of `array` with `value` from `start` up to, but not
     * including, `end`.
     *
     * **Note:** This method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.fill(array, 'a');
     * console.log(array);
     * // => ['a', 'a', 'a']
     *
     * _.fill(Array(3), 2);
     * // => [2, 2, 2]
     *
     * _.fill([4, 6, 8], '*', 1, 2);
     * // => [4, '*', 8]
     */
    function fill(array, value, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
        start = 0;
        end = length;
      }
      return baseFill(array, value, start, end);
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.findIndex(users, function(chr) {
     *   return chr.user == 'barney';
     * });
     * // => 0
     *
     * // using the `_.matches` callback shorthand
     * _.findIndex(users, { 'user': 'fred', 'active': false });
     * // => 1
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findIndex(users, 'active', false);
     * // => 0
     *
     * // using the `_.property` callback shorthand
     * _.findIndex(users, 'active');
     * // => 2
     */
    var findIndex = createFindIndex();

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of `collection` from right to left.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.findLastIndex(users, function(chr) {
     *   return chr.user == 'pebbles';
     * });
     * // => 2
     *
     * // using the `_.matches` callback shorthand
     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
     * // => 0
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastIndex(users, 'active', false);
     * // => 2
     *
     * // using the `_.property` callback shorthand
     * _.findLastIndex(users, 'active');
     * // => 0
     */
    var findLastIndex = createFindIndex(true);

    /**
     * Gets the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias head
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the first element of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([]);
     * // => undefined
     */
    function first(array) {
      return array ? array[0] : undefined;
    }

    /**
     * Flattens a nested array. If `isDeep` is `true` the array is recursively
     * flattened, otherwise it is only flattened a single level.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flatten([1, [2, 3, [4]]]);
     * // => [1, 2, 3, [4]]
     *
     * // using `isDeep`
     * _.flatten([1, [2, 3, [4]]], true);
     * // => [1, 2, 3, 4]
     */
    function flatten(array, isDeep, guard) {
      var length = array ? array.length : 0;
      if (guard && isIterateeCall(array, isDeep, guard)) {
        isDeep = false;
      }
      return length ? baseFlatten(array, isDeep) : [];
    }

    /**
     * Recursively flattens a nested array.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to recursively flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flattenDeep([1, [2, 3, [4]]]);
     * // => [1, 2, 3, 4]
     */
    function flattenDeep(array) {
      var length = array ? array.length : 0;
      return length ? baseFlatten(array, true) : [];
    }

    /**
     * Gets the index at which the first occurrence of `value` is found in `array`
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
     * from the end of `array`. If `array` is sorted providing `true` for `fromIndex`
     * performs a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.indexOf([1, 2, 1, 2], 2);
     * // => 1
     *
     * // using `fromIndex`
     * _.indexOf([1, 2, 1, 2], 2, 2);
     * // => 3
     *
     * // performing a binary search
     * _.indexOf([1, 1, 2, 2], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      if (typeof fromIndex == 'number') {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
      } else if (fromIndex) {
        var index = binaryIndex(array, value);
        if (index < length &&
            (value === value ? (value === array[index]) : (array[index] !== array[index]))) {
          return index;
        }
        return -1;
      }
      return baseIndexOf(array, value, fromIndex || 0);
    }

    /**
     * Gets all but the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     */
    function initial(array) {
      return dropRight(array, 1);
    }

    /**
     * Creates an array of unique values that are included in all of the provided
     * arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of shared values.
     * @example
     * _.intersection([1, 2], [4, 2], [2, 1]);
     * // => [2]
     */
    var intersection = restParam(function(arrays) {
      var othLength = arrays.length,
          othIndex = othLength,
          caches = Array(length),
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          result = [];

      while (othIndex--) {
        var value = arrays[othIndex] = isArrayLike(value = arrays[othIndex]) ? value : [];
        caches[othIndex] = (isCommon && value.length >= 120) ? createCache(othIndex && value) : null;
      }
      var array = arrays[0],
          index = -1,
          length = array ? array.length : 0,
          seen = caches[0];

      outer:
      while (++index < length) {
        value = array[index];
        if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
          var othIndex = othLength;
          while (--othIndex) {
            var cache = caches[othIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(arrays[othIndex], value, 0)) < 0) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(value);
          }
          result.push(value);
        }
      }
      return result;
    });

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array ? array.length : 0;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.indexOf` except that it iterates over elements of
     * `array` from right to left.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=array.length-1] The index to search from
     *  or `true` to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 1, 2], 2);
     * // => 3
     *
     * // using `fromIndex`
     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
     * // => 1
     *
     * // performing a binary search
     * _.lastIndexOf([1, 1, 2, 2], 2, true);
     * // => 3
     */
    function lastIndexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      var index = length;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;
      } else if (fromIndex) {
        index = binaryIndex(array, value, true) - 1;
        var other = array[index];
        if (value === value ? (value === other) : (other !== other)) {
          return index;
        }
        return -1;
      }
      if (value !== value) {
        return indexOfNaN(array, index, true);
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from `array` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.without`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...*} [values] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     *
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull() {
      var args = arguments,
          array = args[0];

      if (!(array && array.length)) {
        return array;
      }
      var index = 0,
          indexOf = getIndexOf(),
          length = args.length;

      while (++index < length) {
        var fromIndex = 0,
            value = args[index];

        while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
          splice.call(array, fromIndex, 1);
        }
      }
      return array;
    }

    /**
     * Removes elements from `array` corresponding to the given indexes and returns
     * an array of the removed elements. Indexes may be specified as an array of
     * indexes or as individual arguments.
     *
     * **Note:** Unlike `_.at`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...(number|number[])} [indexes] The indexes of elements to remove,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [5, 10, 15, 20];
     * var evens = _.pullAt(array, 1, 3);
     *
     * console.log(array);
     * // => [5, 15]
     *
     * console.log(evens);
     * // => [10, 20]
     */
    var pullAt = restParam(function(array, indexes) {
      indexes = baseFlatten(indexes);

      var result = baseAt(array, indexes);
      basePullAt(array, indexes.sort(baseCompareAscending));
      return result;
    });

    /**
     * Removes all elements from `array` that `predicate` returns truthy for
     * and returns an array of the removed elements. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * **Note:** Unlike `_.filter`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4];
     * var evens = _.remove(array, function(n) {
     *   return n % 2 == 0;
     * });
     *
     * console.log(array);
     * // => [1, 3]
     *
     * console.log(evens);
     * // => [2, 4]
     */
    function remove(array, predicate, thisArg) {
      var result = [];
      if (!(array && array.length)) {
        return result;
      }
      var index = -1,
          indexes = [],
          length = array.length;

      predicate = getCallback(predicate, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result.push(value);
          indexes.push(index);
        }
      }
      basePullAt(array, indexes);
      return result;
    }

    /**
     * Gets all but the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias tail
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     */
    function rest(array) {
      return drop(array, 1);
    }

    /**
     * Creates a slice of `array` from `start` up to, but not including, `end`.
     *
     * **Note:** This method is used instead of `Array#slice` to support node
     * lists in IE < 9 and to ensure dense arrays are returned.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function slice(array, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
        start = 0;
        end = length;
      }
      return baseSlice(array, start, end);
    }

    /**
     * Uses a binary search to determine the lowest index at which `value` should
     * be inserted into `array` in order to maintain its sort order. If an iteratee
     * function is provided it is invoked for `value` and each element of `array`
     * to compute their sort ranking. The iteratee is bound to `thisArg` and
     * invoked with one argument; (value).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([30, 50], 40);
     * // => 1
     *
     * _.sortedIndex([4, 4, 5, 5], 5);
     * // => 2
     *
     * var dict = { 'data': { 'thirty': 30, 'forty': 40, 'fifty': 50 } };
     *
     * // using an iteratee function
     * _.sortedIndex(['thirty', 'fifty'], 'forty', function(word) {
     *   return this.data[word];
     * }, dict);
     * // => 1
     *
     * // using the `_.property` callback shorthand
     * _.sortedIndex([{ 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 1
     */
    var sortedIndex = createSortedIndex();

    /**
     * This method is like `_.sortedIndex` except that it returns the highest
     * index at which `value` should be inserted into `array` in order to
     * maintain its sort order.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedLastIndex([4, 4, 5, 5], 5);
     * // => 4
     */
    var sortedLastIndex = createSortedIndex(true);

    /**
     * Creates a slice of `array` with `n` elements taken from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.take([1, 2, 3]);
     * // => [1]
     *
     * _.take([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.take([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.take([1, 2, 3], 0);
     * // => []
     */
    function take(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRight([1, 2, 3]);
     * // => [3]
     *
     * _.takeRight([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.takeRight([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.takeRight([1, 2, 3], 0);
     * // => []
     */
    function takeRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with elements taken from the end. Elements are
     * taken until `predicate` returns falsey. The predicate is bound to `thisArg`
     * and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [2, 3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active', false), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active'), 'user');
     * // => []
     */
    function takeRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), false, true)
        : [];
    }

    /**
     * Creates a slice of `array` with elements taken from the beginning. Elements
     * are taken until `predicate` returns falsey. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [1, 2]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false},
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeWhile(users, 'active', false), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeWhile(users, 'active'), 'user');
     * // => []
     */
    function takeWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3))
        : [];
    }

    /**
     * Creates an array of unique values, in order, from all of the provided arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.union([1, 2], [4, 2], [2, 1]);
     * // => [1, 2, 4]
     */
    var union = restParam(function(arrays) {
      return baseUniq(baseFlatten(arrays, false, true));
    });

    /**
     * Creates a duplicate-free version of an array, using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons, in which only the first occurence of each element
     * is kept. Providing `true` for `isSorted` performs a faster search algorithm
     * for sorted arrays. If an iteratee function is provided it is invoked for
     * each element in the array to generate the criterion by which uniqueness
     * is computed. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, array).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {boolean} [isSorted] Specify the array is sorted.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new duplicate-value-free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     *
     * // using `isSorted`
     * _.uniq([1, 1, 2], true);
     * // => [1, 2]
     *
     * // using an iteratee function
     * _.uniq([1, 2.5, 1.5, 2], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => [1, 2.5]
     *
     * // using the `_.property` callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (isSorted != null && typeof isSorted != 'boolean') {
        thisArg = iteratee;
        iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
        isSorted = false;
      }
      var callback = getCallback();
      if (!(iteratee == null && callback === baseCallback)) {
        iteratee = callback(iteratee, thisArg, 3);
      }
      return (isSorted && getIndexOf() == baseIndexOf)
        ? sortedUniq(array, iteratee)
        : baseUniq(array, iteratee);
    }

    /**
     * This method is like `_.zip` except that it accepts an array of grouped
     * elements and creates an array regrouping the elements to their pre-zip
     * configuration.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     *
     * _.unzip(zipped);
     * // => [['fred', 'barney'], [30, 40], [true, false]]
     */
    function unzip(array) {
      if (!(array && array.length)) {
        return [];
      }
      var index = -1,
          length = 0;

      array = arrayFilter(array, function(group) {
        if (isArrayLike(group)) {
          length = nativeMax(group.length, length);
          return true;
        }
      });
      var result = Array(length);
      while (++index < length) {
        result[index] = arrayMap(array, baseProperty(index));
      }
      return result;
    }

    /**
     * This method is like `_.unzip` except that it accepts an iteratee to specify
     * how regrouped values should be combined. The `iteratee` is bound to `thisArg`
     * and invoked with four arguments: (accumulator, value, index, group).
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @param {Function} [iteratee] The function to combine regrouped values.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
     * // => [[1, 10, 100], [2, 20, 200]]
     *
     * _.unzipWith(zipped, _.add);
     * // => [3, 30, 300]
     */
    function unzipWith(array, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      var result = unzip(array);
      if (iteratee == null) {
        return result;
      }
      iteratee = bindCallback(iteratee, thisArg, 4);
      return arrayMap(result, function(group) {
        return arrayReduce(group, iteratee, undefined, true);
      });
    }

    /**
     * Creates an array excluding all provided values using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to filter.
     * @param {...*} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 3], 1, 2);
     * // => [3]
     */
    var without = restParam(function(array, values) {
      return isArrayLike(array)
        ? baseDifference(array, values)
        : [];
    });

    /**
     * Creates an array of unique values that is the [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
     * of the provided arrays.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of values.
     * @example
     *
     * _.xor([1, 2], [4, 2]);
     * // => [1, 4]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArrayLike(array)) {
          var result = result
            ? arrayPush(baseDifference(result, array), baseDifference(array, result))
            : array;
        }
      }
      return result ? baseUniq(result) : [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second elements
     * of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    var zip = restParam(unzip);

    /**
     * The inverse of `_.pairs`; this method returns an object composed from arrays
     * of property names and values. Provide either a single two dimensional array,
     * e.g. `[[key1, value1], [key2, value2]]` or two arrays, one of property names
     * and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Array
     * @param {Array} props The property names.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject([['fred', 30], ['barney', 40]]);
     * // => { 'fred': 30, 'barney': 40 }
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(props, values) {
      var index = -1,
          length = props ? props.length : 0,
          result = {};

      if (length && !values && !isArray(props[0])) {
        values = [];
      }
      while (++index < length) {
        var key = props[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /**
     * This method is like `_.zip` except that it accepts an iteratee to specify
     * how grouped values should be combined. The `iteratee` is bound to `thisArg`
     * and invoked with four arguments: (accumulator, value, index, group).
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @param {Function} [iteratee] The function to combine grouped values.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zipWith([1, 2], [10, 20], [100, 200], _.add);
     * // => [111, 222]
     */
    var zipWith = restParam(function(arrays) {
      var length = arrays.length,
          iteratee = length > 2 ? arrays[length - 2] : undefined,
          thisArg = length > 1 ? arrays[length - 1] : undefined;

      if (length > 2 && typeof iteratee == 'function') {
        length -= 2;
      } else {
        iteratee = (length > 1 && typeof thisArg == 'function') ? (--length, thisArg) : undefined;
        thisArg = undefined;
      }
      arrays.length = length;
      return unzipWith(arrays, iteratee, thisArg);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps `value` with explicit method
     * chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36 },
     *   { 'user': 'fred',    'age': 40 },
     *   { 'user': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(users)
     *   .sortBy('age')
     *   .map(function(chr) {
     *     return chr.user + ' is ' + chr.age;
     *   })
     *   .first()
     *   .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      var result = lodash(value);
      result.__chain__ = true;
      return result;
    }

    /**
     * This method invokes `interceptor` and returns `value`. The interceptor is
     * bound to `thisArg` and invoked with one argument; (value). The purpose of
     * this method is to "tap into" a method chain in order to perform operations
     * on intermediate results within the chain.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3])
     *  .tap(function(array) {
     *    array.pop();
     *  })
     *  .reverse()
     *  .value();
     * // => [2, 1]
     */
    function tap(value, interceptor, thisArg) {
      interceptor.call(thisArg, value);
      return value;
    }

    /**
     * This method is like `_.tap` except that it returns the result of `interceptor`.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns the result of `interceptor`.
     * @example
     *
     * _('  abc  ')
     *  .chain()
     *  .trim()
     *  .thru(function(value) {
     *    return [value];
     *  })
     *  .value();
     * // => ['abc']
     */
    function thru(value, interceptor, thisArg) {
      return interceptor.call(thisArg, value);
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(users).first();
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(users).chain()
     *   .first()
     *   .pick('user')
     *   .value();
     * // => { 'user': 'barney' }
     */
    function wrapperChain() {
      return chain(this);
    }

    /**
     * Executes the chained sequence and returns the wrapped result.
     *
     * @name commit
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).push(3);
     *
     * console.log(array);
     * // => [1, 2]
     *
     * wrapped = wrapped.commit();
     * console.log(array);
     * // => [1, 2, 3]
     *
     * wrapped.last();
     * // => 3
     *
     * console.log(array);
     * // => [1, 2, 3]
     */
    function wrapperCommit() {
      return new LodashWrapper(this.value(), this.__chain__);
    }

    /**
     * Creates a new array joining a wrapped array with any additional arrays
     * and/or values.
     *
     * @name concat
     * @memberOf _
     * @category Chain
     * @param {...*} [values] The values to concatenate.
     * @returns {Array} Returns the new concatenated array.
     * @example
     *
     * var array = [1];
     * var wrapped = _(array).concat(2, [3], [[4]]);
     *
     * console.log(wrapped.value());
     * // => [1, 2, 3, [4]]
     *
     * console.log(array);
     * // => [1]
     */
    var wrapperConcat = restParam(function(values) {
      values = baseFlatten(values);
      return this.thru(function(array) {
        return arrayConcat(isArray(array) ? array : [toObject(array)], values);
      });
    });

    /**
     * Creates a clone of the chained sequence planting `value` as the wrapped value.
     *
     * @name plant
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).map(function(value) {
     *   return Math.pow(value, 2);
     * });
     *
     * var other = [3, 4];
     * var otherWrapped = wrapped.plant(other);
     *
     * otherWrapped.value();
     * // => [9, 16]
     *
     * wrapped.value();
     * // => [1, 4]
     */
    function wrapperPlant(value) {
      var result,
          parent = this;

      while (parent instanceof baseLodash) {
        var clone = wrapperClone(parent);
        if (result) {
          previous.__wrapped__ = clone;
        } else {
          result = clone;
        }
        var previous = clone;
        parent = parent.__wrapped__;
      }
      previous.__wrapped__ = value;
      return result;
    }

    /**
     * Reverses the wrapped array so the first element becomes the last, the
     * second element becomes the second to last, and so on.
     *
     * **Note:** This method mutates the wrapped array.
     *
     * @name reverse
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new reversed `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _(array).reverse().value()
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function wrapperReverse() {
      var value = this.__wrapped__;

      var interceptor = function(value) {
        return (wrapped && wrapped.__dir__ < 0) ? value : value.reverse();
      };
      if (value instanceof LazyWrapper) {
        var wrapped = value;
        if (this.__actions__.length) {
          wrapped = new LazyWrapper(this);
        }
        wrapped = wrapped.reverse();
        wrapped.__actions__.push({ 'func': thru, 'args': [interceptor], 'thisArg': undefined });
        return new LodashWrapper(wrapped, this.__chain__);
      }
      return this.thru(interceptor);
    }

    /**
     * Produces the result of coercing the unwrapped value to a string.
     *
     * @name toString
     * @memberOf _
     * @category Chain
     * @returns {string} Returns the coerced string value.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return (this.value() + '');
    }

    /**
     * Executes the chained sequence to extract the unwrapped value.
     *
     * @name value
     * @memberOf _
     * @alias run, toJSON, valueOf
     * @category Chain
     * @returns {*} Returns the resolved unwrapped value.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
      return baseWrapperValue(this.__wrapped__, this.__actions__);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements corresponding to the given keys, or indexes,
     * of `collection`. Keys may be specified as individual arguments or as arrays
     * of keys.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [props] The property names
     *  or indexes of elements to pick, specified individually or in arrays.
     * @returns {Array} Returns the new array of picked elements.
     * @example
     *
     * _.at(['a', 'b', 'c'], [0, 2]);
     * // => ['a', 'c']
     *
     * _.at(['barney', 'fred', 'pebbles'], 0, 2);
     * // => ['barney', 'pebbles']
     */
    var at = restParam(function(collection, props) {
      return baseAt(collection, baseFlatten(props));
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the number of times the key was returned by `iteratee`.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
    });

    /**
     * Checks if `predicate` returns truthy for **all** elements of `collection`.
     * The predicate is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var users = [
     *   { 'user': 'barney', 'active': false },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.every(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.every(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.every(users, 'active');
     * // => false
     */
    function every(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayEvery : baseEvery;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = undefined;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning an array of all elements
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.filter([4, 5, 6], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [4, 6]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.filter(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.filter(users, 'active'), 'user');
     * // => ['barney']
     */
    function filter(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.result(_.find(users, function(chr) {
     *   return chr.age < 40;
     * }), 'user');
     * // => 'barney'
     *
     * // using the `_.matches` callback shorthand
     * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.result(_.find(users, 'active', false), 'user');
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.result(_.find(users, 'active'), 'user');
     * // => 'barney'
     */
    var find = createFind(baseEach);

    /**
     * This method is like `_.find` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(n) {
     *   return n % 2 == 1;
     * });
     * // => 3
     */
    var findLast = createFind(baseEachRight, true);

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning the first element that has equivalent property
     * values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.result(_.findWhere(users, { 'age': 36, 'active': true }), 'user');
     * // => 'barney'
     *
     * _.result(_.findWhere(users, { 'age': 40, 'active': false }), 'user');
     * // => 'fred'
     */
    function findWhere(collection, source) {
      return find(collection, baseMatches(source));
    }

    /**
     * Iterates over elements of `collection` invoking `iteratee` for each element.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection). Iteratee functions may exit iteration early
     * by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length" property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEach(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from left to right and returns the array
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
     *   console.log(n, key);
     * });
     * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
     */
    var forEach = createForEach(arrayEach, baseEach);

    /**
     * This method is like `_.forEach` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEachRight(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from right to left and returns the array
     */
    var forEachRight = createForEach(arrayEachRight, baseEachRight);

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using the `_.property` callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        result[key] = [value];
      }
    });

    /**
     * Checks if `value` is in `collection` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
     * from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @alias contains, include
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {*} target The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {boolean} Returns `true` if a matching element is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.includes('pebbles', 'eb');
     * // => true
     */
    function includes(collection, target, fromIndex, guard) {
      var length = collection ? getLength(collection) : 0;
      if (!isLength(length)) {
        collection = values(collection);
        length = collection.length;
      }
      if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
        fromIndex = 0;
      } else {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
      }
      return (typeof collection == 'string' || !isArray(collection) && isString(collection))
        ? (fromIndex <= length && collection.indexOf(target, fromIndex) > -1)
        : (!!length && getIndexOf(collection, target, fromIndex) > -1);
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the last element responsible for generating the key. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keyData = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keyData, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return String.fromCharCode(object.code);
     * });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return this.fromCharCode(object.code);
     * }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method at `path` of each element in `collection`, returning
     * an array of the results of each invoked method. Any additional arguments
     * are provided to each invoked method. If `methodName` is a function it is
     * invoked for, and `this` bound to, each element in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|string} path The path of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    var invoke = restParam(function(collection, path, args) {
      var index = -1,
          isFunc = typeof path == 'function',
          isProp = isKey(path),
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value) {
        var func = isFunc ? path : ((isProp && value != null) ? value[path] : undefined);
        result[++index] = func ? func.apply(value, args) : invokePath(value, path, args);
      });
      return result;
    });

    /**
     * Creates an array of values by running each element in `collection` through
     * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
     *
     * The guarded methods are:
     * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
     * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
     * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
     * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
     * `sum`, `uniq`, and `words`
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new mapped array.
     * @example
     *
     * function timesThree(n) {
     *   return n * 3;
     * }
     *
     * _.map([1, 2], timesThree);
     * // => [3, 6]
     *
     * _.map({ 'a': 1, 'b': 2 }, timesThree);
     * // => [3, 6] (iteration order is not guaranteed)
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.map(users, 'user');
     * // => ['barney', 'fred']
     */
    function map(collection, iteratee, thisArg) {
      var func = isArray(collection) ? arrayMap : baseMap;
      iteratee = getCallback(iteratee, thisArg, 3);
      return func(collection, iteratee);
    }

    /**
     * Creates an array of elements split into two groups, the first of which
     * contains elements `predicate` returns truthy for, while the second of which
     * contains elements `predicate` returns falsey for. The predicate is bound
     * to `thisArg` and invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the array of grouped elements.
     * @example
     *
     * _.partition([1, 2, 3], function(n) {
     *   return n % 2;
     * });
     * // => [[1, 3], [2]]
     *
     * _.partition([1.2, 2.3, 3.4], function(n) {
     *   return this.floor(n) % 2;
     * }, Math);
     * // => [[1.2, 3.4], [2.3]]
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': false },
     *   { 'user': 'fred',    'age': 40, 'active': true },
     *   { 'user': 'pebbles', 'age': 1,  'active': false }
     * ];
     *
     * var mapper = function(array) {
     *   return _.pluck(array, 'user');
     * };
     *
     * // using the `_.matches` callback shorthand
     * _.map(_.partition(users, { 'age': 1, 'active': false }), mapper);
     * // => [['pebbles'], ['barney', 'fred']]
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.map(_.partition(users, 'active', false), mapper);
     * // => [['barney', 'pebbles'], ['fred']]
     *
     * // using the `_.property` callback shorthand
     * _.map(_.partition(users, 'active'), mapper);
     * // => [['fred'], ['barney', 'pebbles']]
     */
    var partition = createAggregator(function(result, value, key) {
      result[key ? 0 : 1].push(value);
    }, function() { return [[], []]; });

    /**
     * Gets the property value of `path` from all elements in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|string} path The path of the property to pluck.
     * @returns {Array} Returns the property values.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(users, 'user');
     * // => ['barney', 'fred']
     *
     * var userIndex = _.indexBy(users, 'user');
     * _.pluck(userIndex, 'age');
     * // => [36, 40] (iteration order is not guaranteed)
     */
    function pluck(collection, path) {
      return map(collection, property(path));
    }

    /**
     * Reduces `collection` to a value which is the accumulated result of running
     * each element in `collection` through `iteratee`, where each successive
     * invocation is supplied the return value of the previous. If `accumulator`
     * is not provided the first element of `collection` is used as the initial
     * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.reduce`, `_.reduceRight`, and `_.transform`.
     *
     * The guarded methods are:
     * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
     * and `sortByOrder`
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.reduce([1, 2], function(total, n) {
     *   return total + n;
     * });
     * // => 3
     *
     * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
     */
    var reduce = createReduce(arrayReduce, baseEach);

    /**
     * This method is like `_.reduce` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var array = [[0, 1], [2, 3], [4, 5]];
     *
     * _.reduceRight(array, function(flattened, other) {
     *   return flattened.concat(other);
     * }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    var reduceRight = createReduce(arrayReduceRight, baseEachRight);

    /**
     * The opposite of `_.filter`; this method returns the elements of `collection`
     * that `predicate` does **not** return truthy for.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.reject([1, 2, 3, 4], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [1, 3]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.reject(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.reject(users, 'active'), 'user');
     * // => ['barney']
     */
    function reject(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, function(value, index, collection) {
        return !predicate(value, index, collection);
      });
    }

    /**
     * Gets a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {*} Returns the random sample(s).
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (guard ? isIterateeCall(collection, n, guard) : n == null) {
        collection = toIterable(collection);
        var length = collection.length;
        return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;
      }
      var index = -1,
          result = toArray(collection),
          length = result.length,
          lastIndex = length - 1;

      n = nativeMin(n < 0 ? 0 : (+n || 0), length);
      while (++index < n) {
        var rand = baseRandom(index, lastIndex),
            value = result[rand];

        result[rand] = result[index];
        result[index] = value;
      }
      result.length = n;
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      return sample(collection, POSITIVE_INFINITY);
    }

    /**
     * Gets the size of `collection` by returning its length for array-like
     * values or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns the size of `collection`.
     * @example
     *
     * _.size([1, 2, 3]);
     * // => 3
     *
     * _.size({ 'a': 1, 'b': 2 });
     * // => 2
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? getLength(collection) : 0;
      return isLength(length) ? length : keys(collection).length;
    }

    /**
     * Checks if `predicate` returns truthy for **any** element of `collection`.
     * The function returns as soon as it finds a passing value and does not iterate
     * over the entire collection. The predicate is bound to `thisArg` and invoked
     * with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var users = [
     *   { 'user': 'barney', 'active': true },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.some(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.some(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.some(users, 'active');
     * // => true
     */
    function some(collection, predicate, thisArg) {
      var func = isArray(collection) ? arraySome : baseSome;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = undefined;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through `iteratee`. This method performs
     * a stable sort, that is, it preserves the original sort order of equal elements.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return Math.sin(n);
     * });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return this.sin(n);
     * }, Math);
     * // => [3, 1, 2]
     *
     * var users = [
     *   { 'user': 'fred' },
     *   { 'user': 'pebbles' },
     *   { 'user': 'barney' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.sortBy(users, 'user'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function sortBy(collection, iteratee, thisArg) {
      if (collection == null) {
        return [];
      }
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = undefined;
      }
      var index = -1;
      iteratee = getCallback(iteratee, thisArg, 3);

      var result = baseMap(collection, function(value, key, collection) {
        return { 'criteria': iteratee(value, key, collection), 'index': ++index, 'value': value };
      });
      return baseSortBy(result, compareAscending);
    }

    /**
     * This method is like `_.sortBy` except that it can sort by multiple iteratees
     * or property names.
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(Function|Function[]|Object|Object[]|string|string[])} iteratees
     *  The iteratees to sort by, specified as individual values or arrays of values.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 34 }
     * ];
     *
     * _.map(_.sortByAll(users, ['user', 'age']), _.values);
     * // => [['barney', 34], ['barney', 36], ['fred', 42], ['fred', 48]]
     *
     * _.map(_.sortByAll(users, 'user', function(chr) {
     *   return Math.floor(chr.age / 10);
     * }), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    var sortByAll = restParam(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var guard = iteratees[2];
      if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
        iteratees.length = 1;
      }
      return baseSortByOrder(collection, baseFlatten(iteratees), []);
    });

    /**
     * This method is like `_.sortByAll` except that it allows specifying the
     * sort orders of the iteratees to sort by. If `orders` is unspecified, all
     * values are sorted in ascending order. Otherwise, a value is sorted in
     * ascending order if its corresponding order is "asc", and descending if "desc".
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} [orders] The sort orders of `iteratees`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 34 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 36 }
     * ];
     *
     * // sort by `user` in ascending order and by `age` in descending order
     * _.map(_.sortByOrder(users, ['user', 'age'], ['asc', 'desc']), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    function sortByOrder(collection, iteratees, orders, guard) {
      if (collection == null) {
        return [];
      }
      if (guard && isIterateeCall(iteratees, orders, guard)) {
        orders = undefined;
      }
      if (!isArray(iteratees)) {
        iteratees = iteratees == null ? [] : [iteratees];
      }
      if (!isArray(orders)) {
        orders = orders == null ? [] : [orders];
      }
      return baseSortByOrder(collection, iteratees, orders);
    }

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning an array of all elements that have equivalent
     * property values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false, 'pets': ['hoppy'] },
     *   { 'user': 'fred',   'age': 40, 'active': true, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.pluck(_.where(users, { 'age': 36, 'active': false }), 'user');
     * // => ['barney']
     *
     * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');
     * // => ['fred']
     */
    function where(collection, source) {
      return filter(collection, baseMatches(source));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    var now = nativeNow || function() {
      return new Date().getTime();
    };

    /*------------------------------------------------------------------------*/

    /**
     * The opposite of `_.before`; this method creates a function that invokes
     * `func` once it is called `n` or more times.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls before `func` is invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'done saving!' after the two async saves have completed
     */
    function after(n, func) {
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      n = nativeIsFinite(n = +n) ? n : 0;
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that accepts up to `n` arguments ignoring any
     * additional arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @param {number} [n=func.length] The arity cap.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new function.
     * @example
     *
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
     * // => [6, 8, 10]
     */
    function ary(func, n, guard) {
      if (guard && isIterateeCall(func, n, guard)) {
        n = undefined;
      }
      n = (func && n == null) ? func.length : nativeMax(+n || 0, 0);
      return createWrapper(func, ARY_FLAG, undefined, undefined, undefined, undefined, n);
    }

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it is called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery('#add').on('click', _.before(5, addContactToList));
     * // => allows adding up to 4 contacts to the list
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = undefined;
        }
        return result;
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and prepends any additional `_.bind` arguments to those provided to the
     * bound function.
     *
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for partially applied arguments.
     *
     * **Note:** Unlike native `Function#bind` this method does not set the "length"
     * property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var greet = function(greeting, punctuation) {
     *   return greeting + ' ' + this.user + punctuation;
     * };
     *
     * var object = { 'user': 'fred' };
     *
     * var bound = _.bind(greet, object, 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * // using placeholders
     * var bound = _.bind(greet, object, _, '!');
     * bound('hi');
     * // => 'hi fred!'
     */
    var bind = restParam(function(func, thisArg, partials) {
      var bitmask = BIND_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bind.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(func, bitmask, thisArg, partials, holders);
    });

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all enumerable function
     * properties, own and inherited, of `object` are bound.
     *
     * **Note:** This method does not set the "length" property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...(string|string[])} [methodNames] The object method names to bind,
     *  specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() {
     *     console.log('clicked ' + this.label);
     *   }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs' when the element is clicked
     */
    var bindAll = restParam(function(object, methodNames) {
      methodNames = methodNames.length ? baseFlatten(methodNames) : functions(object);

      var index = -1,
          length = methodNames.length;

      while (++index < length) {
        var key = methodNames[index];
        object[key] = createWrapper(object[key], BIND_FLAG, object);
      }
      return object;
    });

    /**
     * Creates a function that invokes the method at `object[key]` and prepends
     * any additional `_.bindKey` arguments to those provided to the bound function.
     *
     * This method differs from `_.bind` by allowing bound functions to reference
     * methods that may be redefined or don't yet exist.
     * See [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
     * for more details.
     *
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'user': 'fred',
     *   'greet': function(greeting, punctuation) {
     *     return greeting + ' ' + this.user + punctuation;
     *   }
     * };
     *
     * var bound = _.bindKey(object, 'greet', 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * object.greet = function(greeting, punctuation) {
     *   return greeting + 'ya ' + this.user + punctuation;
     * };
     *
     * bound('!');
     * // => 'hiya fred!'
     *
     * // using placeholders
     * var bound = _.bindKey(object, 'greet', _, '!');
     * bound('hi');
     * // => 'hiya fred!'
     */
    var bindKey = restParam(function(object, key, partials) {
      var bitmask = BIND_FLAG | BIND_KEY_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bindKey.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(key, bitmask, object, partials, holders);
    });

    /**
     * Creates a function that accepts one or more arguments of `func` that when
     * called either invokes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` may be specified
     * if `func.length` is not sufficient.
     *
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curry(abc);
     *
     * curried(1)(2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(1)(_, 3)(2);
     * // => [1, 2, 3]
     */
    var curry = createCurry(CURRY_FLAG);

    /**
     * This method is like `_.curry` except that arguments are applied to `func`
     * in the manner of `_.partialRight` instead of `_.partial`.
     *
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curryRight(abc);
     *
     * curried(3)(2)(1);
     * // => [1, 2, 3]
     *
     * curried(2, 3)(1);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(3)(1, _)(2);
     * // => [1, 2, 3]
     */
    var curryRight = createCurry(CURRY_RIGHT_FLAG);

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the debounced function return the result of the last
     * `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it is invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : (+wait || 0);
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = !!options.leading;
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }

      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function maxDelayed() {
        complete(trailing, timeoutId);
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0 || remaining > maxWait;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
        return result;
      }
      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Defers invoking the `func` until the current call stack has cleared. Any
     * additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to defer.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) {
     *   console.log(text);
     * }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    var defer = restParam(function(func, args) {
      return baseDelay(func, 1, args);
    });

    /**
     * Invokes `func` after `wait` milliseconds. Any additional arguments are
     * provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) {
     *   console.log(text);
     * }, 1000, 'later');
     * // => logs 'later' after one second
     */
    var delay = restParam(function(func, wait, args) {
      return baseDelay(func, wait, args);
    });

    /**
     * Creates a function that returns the result of invoking the provided
     * functions with the `this` binding of the created function, where each
     * successive invocation is supplied the return value of the previous.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flow(_.add, square);
     * addSquare(1, 2);
     * // => 9
     */
    var flow = createFlow();

    /**
     * This method is like `_.flow` except that it creates a function that
     * invokes the provided functions from right to left.
     *
     * @static
     * @memberOf _
     * @alias backflow, compose
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flowRight(square, _.add);
     * addSquare(1, 2);
     * // => 9
     */
    var flowRight = createFlow(true);

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is coerced to a string and used as the
     * cache key. The `func` is invoked with the `this` binding of the memoized
     * function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var upperCase = _.memoize(function(string) {
     *   return string.toUpperCase();
     * });
     *
     * upperCase('fred');
     * // => 'FRED'
     *
     * // modifying the result cache
     * upperCase.cache.set('fred', 'BARNEY');
     * upperCase('fred');
     * // => 'BARNEY'
     *
     * // replacing `_.memoize.Cache`
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'barney' };
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'fred' }
     *
     * _.memoize.Cache = WeakMap;
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'barney' }
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result);
        return result;
      };
      memoized.cache = new memoize.Cache;
      return memoized;
    }

    /**
     * Creates a function that runs each argument through a corresponding
     * transform function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to wrap.
     * @param {...(Function|Function[])} [transforms] The functions to transform
     * arguments, specified as individual functions or arrays of functions.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function doubled(n) {
     *   return n * 2;
     * }
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var modded = _.modArgs(function(x, y) {
     *   return [x, y];
     * }, square, doubled);
     *
     * modded(1, 2);
     * // => [1, 4]
     *
     * modded(5, 10);
     * // => [25, 20]
     */
    var modArgs = restParam(function(func, transforms) {
      transforms = baseFlatten(transforms);
      if (typeof func != 'function' || !arrayEvery(transforms, baseIsFunction)) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = transforms.length;
      return restParam(function(args) {
        var index = nativeMin(args.length, length);
        while (index--) {
          args[index] = transforms[index](args[index]);
        }
        return func.apply(this, args);
      });
    });

    /**
     * Creates a function that negates the result of the predicate `func`. The
     * `func` predicate is invoked with the `this` binding and arguments of the
     * created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} predicate The predicate to negate.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function isEven(n) {
     *   return n % 2 == 0;
     * }
     *
     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
     * // => [1, 3, 5]
     */
    function negate(predicate) {
      if (typeof predicate != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function() {
        return !predicate.apply(this, arguments);
      };
    }

    /**
     * Creates a function that is restricted to invoking `func` once. Repeat calls
     * to the function return the value of the first call. The `func` is invoked
     * with the `this` binding and arguments of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` invokes `createApplication` once
     */
    function once(func) {
      return before(2, func);
    }

    /**
     * Creates a function that invokes `func` with `partial` arguments prepended
     * to those provided to the new function. This method is like `_.bind` except
     * it does **not** alter the `this` binding.
     *
     * The `_.partial.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var sayHelloTo = _.partial(greet, 'hello');
     * sayHelloTo('fred');
     * // => 'hello fred'
     *
     * // using placeholders
     * var greetFred = _.partial(greet, _, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     */
    var partial = createPartial(PARTIAL_FLAG);

    /**
     * This method is like `_.partial` except that partially applied arguments
     * are appended to those provided to the new function.
     *
     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var greetFred = _.partialRight(greet, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     *
     * // using placeholders
     * var sayHelloTo = _.partialRight(greet, 'hello', _);
     * sayHelloTo('fred');
     * // => 'hello fred'
     */
    var partialRight = createPartial(PARTIAL_RIGHT_FLAG);

    /**
     * Creates a function that invokes `func` with arguments arranged according
     * to the specified indexes where the argument value at the first index is
     * provided as the first argument, the argument value at the second index is
     * provided as the second argument, and so on.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to rearrange arguments for.
     * @param {...(number|number[])} indexes The arranged argument indexes,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var rearged = _.rearg(function(a, b, c) {
     *   return [a, b, c];
     * }, 2, 0, 1);
     *
     * rearged('b', 'c', 'a')
     * // => ['a', 'b', 'c']
     *
     * var map = _.rearg(_.map, [1, 0]);
     * map(function(n) {
     *   return n * 3;
     * }, [1, 2, 3]);
     * // => [3, 6, 9]
     */
    var rearg = restParam(function(func, indexes) {
      return createWrapper(func, REARG_FLAG, undefined, undefined, undefined, baseFlatten(indexes));
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as an array.
     *
     * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.restParam(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function restParam(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            rest = Array(length);

        while (++index < length) {
          rest[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, rest);
          case 1: return func.call(this, args[0], rest);
          case 2: return func.call(this, args[0], args[1], rest);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = rest;
        return func.apply(this, otherArgs);
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of the created
     * function and an array of arguments much like [`Function#apply`](https://es5.github.io/#x15.3.4.3).
     *
     * **Note:** This method is based on the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to spread arguments over.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.spread(function(who, what) {
     *   return who + ' says ' + what;
     * });
     *
     * say(['fred', 'hello']);
     * // => 'fred says hello'
     *
     * // with a Promise
     * var numbers = Promise.all([
     *   Promise.resolve(40),
     *   Promise.resolve(36)
     * ]);
     *
     * numbers.then(_.spread(function(x, y) {
     *   return x + y;
     * }));
     * // => a Promise of 76
     */
    function spread(func) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function(array) {
        return func.apply(this, array);
      };
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed invocations. Provide an options object to indicate
     * that `func` should be invoked on the leading and/or trailing edge of the
     * `wait` timeout. Subsequent calls to the throttled function return the
     * result of the last `func` call.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify invoking on the leading
     *  edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     *
     * // cancel a trailing throttled call
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Any additional arguments provided to the function are
     * appended to those provided to the wrapper function. The wrapper is invoked
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('fred, barney, & pebbles');
     * // => '<p>fred, barney, &amp; pebbles</p>'
     */
    function wrap(value, wrapper) {
      wrapper = wrapper == null ? identity : wrapper;
      return createWrapper(wrapper, PARTIAL_FLAG, undefined, [value], []);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
     * otherwise they are assigned by reference. If `customizer` is provided it is
     * invoked to produce the cloned values. If `customizer` returns `undefined`
     * cloning is handled by the method instead. The `customizer` is bound to
     * `thisArg` and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var shallow = _.clone(users);
     * shallow[0] === users[0];
     * // => true
     *
     * var deep = _.clone(users, true);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.clone(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(false);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, customizer, thisArg) {
      if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
        isDeep = false;
      }
      else if (typeof isDeep == 'function') {
        thisArg = customizer;
        customizer = isDeep;
        isDeep = false;
      }
      return typeof customizer == 'function'
        ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 1))
        : baseClone(value, isDeep);
    }

    /**
     * Creates a deep clone of `value`. If `customizer` is provided it is invoked
     * to produce the cloned values. If `customizer` returns `undefined` cloning
     * is handled by the method instead. The `customizer` is bound to `thisArg`
     * and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var deep = _.cloneDeep(users);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.cloneDeep(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(true);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 20
     */
    function cloneDeep(value, customizer, thisArg) {
      return typeof customizer == 'function'
        ? baseClone(value, true, bindCallback(customizer, thisArg, 1))
        : baseClone(value, true);
    }

    /**
     * Checks if `value` is greater than `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than `other`, else `false`.
     * @example
     *
     * _.gt(3, 1);
     * // => true
     *
     * _.gt(3, 3);
     * // => false
     *
     * _.gt(1, 3);
     * // => false
     */
    function gt(value, other) {
      return value > other;
    }

    /**
     * Checks if `value` is greater than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than or equal to `other`, else `false`.
     * @example
     *
     * _.gte(3, 1);
     * // => true
     *
     * _.gte(3, 3);
     * // => true
     *
     * _.gte(1, 3);
     * // => false
     */
    function gte(value, other) {
      return value >= other;
    }

    /**
     * Checks if `value` is classified as an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return isObjectLike(value) && isArrayLike(value) &&
        hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(function() { return arguments; }());
     * // => false
     */
    var isArray = nativeIsArray || function(value) {
      return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
    };

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isBoolean(false);
     * // => true
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
    }

    /**
     * Checks if `value` is classified as a `Date` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     *
     * _.isDate('Mon April 23 2012');
     * // => false
     */
    function isDate(value) {
      return isObjectLike(value) && objToString.call(value) == dateTag;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     *
     * _.isElement('<body>');
     * // => false
     */
    function isElement(value) {
      return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
    }

    /**
     * Checks if `value` is empty. A value is considered empty unless it is an
     * `arguments` object, array, string, or jQuery-like collection with a length
     * greater than `0` or an object with own enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty(null);
     * // => true
     *
     * _.isEmpty(true);
     * // => true
     *
     * _.isEmpty(1);
     * // => true
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({ 'a': 1 });
     * // => false
     */
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
          (isObjectLike(value) && isFunction(value.splice)))) {
        return !value.length;
      }
      return !keys(value).length;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent. If `customizer` is provided it is invoked to compare values.
     * If `customizer` returns `undefined` comparisons are handled by the method
     * instead. The `customizer` is bound to `thisArg` and invoked with three
     * arguments: (value, other [, index|key]).
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. Functions and DOM nodes
     * are **not** supported. Provide a customizer function to extend support
     * for comparing other values.
     *
     * @static
     * @memberOf _
     * @alias eq
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
     *
     * object == other;
     * // => false
     *
     * _.isEqual(object, other);
     * // => true
     *
     * // using a customizer callback
     * var array = ['hello', 'goodbye'];
     * var other = ['hi', 'goodbye'];
     *
     * _.isEqual(array, other, function(value, other) {
     *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
     *     return true;
     *   }
     * });
     * // => true
     */
    function isEqual(value, other, customizer, thisArg) {
      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
      var result = customizer ? customizer(value, other) : undefined;
      return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
    }

    /**
     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
     * `SyntaxError`, `TypeError`, or `URIError` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
     * @example
     *
     * _.isError(new Error);
     * // => true
     *
     * _.isError(Error);
     * // => false
     */
    function isError(value) {
      return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
    }

    /**
     * Checks if `value` is a finite primitive number.
     *
     * **Note:** This method is based on [`Number.isFinite`](http://ecma-international.org/ecma-262/6.0/#sec-number.isfinite).
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
     * @example
     *
     * _.isFinite(10);
     * // => true
     *
     * _.isFinite('10');
     * // => false
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite(Object(10));
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return typeof value == 'number' && nativeIsFinite(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in older versions of Chrome and Safari which return 'function' for regexes
      // and Safari 8 equivalents which return 'object' for typed array constructors.
      return isObject(value) && objToString.call(value) == funcTag;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Performs a deep comparison between `object` and `source` to determine if
     * `object` contains equivalent property values. If `customizer` is provided
     * it is invoked to compare values. If `customizer` returns `undefined`
     * comparisons are handled by the method instead. The `customizer` is bound
     * to `thisArg` and invoked with three arguments: (value, other, index|key).
     *
     * **Note:** This method supports comparing properties of arrays, booleans,
     * `Date` objects, numbers, `Object` objects, regexes, and strings. Functions
     * and DOM nodes are **not** supported. Provide a customizer function to extend
     * support for comparing other values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.isMatch(object, { 'age': 40 });
     * // => true
     *
     * _.isMatch(object, { 'age': 36 });
     * // => false
     *
     * // using a customizer callback
     * var object = { 'greeting': 'hello' };
     * var source = { 'greeting': 'hi' };
     *
     * _.isMatch(object, source, function(value, other) {
     *   return _.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/) || undefined;
     * });
     * // => true
     */
    function isMatch(object, source, customizer, thisArg) {
      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
      return baseIsMatch(object, getMatchData(source), customizer);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * **Note:** This method is not the same as [`isNaN`](https://es5.github.io/#x15.1.2.4)
     * which returns `true` for `undefined` and other non-numeric values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // An `NaN` primitive is the only value that is not equal to itself.
      // Perform the `toStringTag` check first to avoid errors with some host objects in IE.
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (value == null) {
        return false;
      }
      if (isFunction(value)) {
        return reIsNative.test(fnToString.call(value));
      }
      return isObjectLike(value) && reIsHostCtor.test(value);
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(void 0);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is classified as a `Number` primitive or object.
     *
     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
     * as numbers, use the `_.isFinite` method.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isNumber(8.4);
     * // => true
     *
     * _.isNumber(NaN);
     * // => true
     *
     * _.isNumber('8.4');
     * // => false
     */
    function isNumber(value) {
      return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
    }

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * **Note:** This method assumes objects created by the `Object` constructor
     * have no inherited enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    function isPlainObject(value) {
      var Ctor;

      // Exit early for non `Object` objects.
      if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
          (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
        return false;
      }
      // IE < 9 iterates inherited properties before own properties. If the first
      // iterated property is an object's own property then there are no inherited
      // enumerable properties.
      var result;
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      baseForIn(value, function(subValue, key) {
        result = key;
      });
      return result === undefined || hasOwnProperty.call(value, result);
    }

    /**
     * Checks if `value` is classified as a `RegExp` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isRegExp(/abc/);
     * // => true
     *
     * _.isRegExp('/abc/');
     * // => false
     */
    function isRegExp(value) {
      return isObject(value) && objToString.call(value) == regexpTag;
    }

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     *
     * _.isUndefined(null);
     * // => false
     */
    function isUndefined(value) {
      return value === undefined;
    }

    /**
     * Checks if `value` is less than `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than `other`, else `false`.
     * @example
     *
     * _.lt(1, 3);
     * // => true
     *
     * _.lt(3, 3);
     * // => false
     *
     * _.lt(3, 1);
     * // => false
     */
    function lt(value, other) {
      return value < other;
    }

    /**
     * Checks if `value` is less than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than or equal to `other`, else `false`.
     * @example
     *
     * _.lte(1, 3);
     * // => true
     *
     * _.lte(3, 3);
     * // => true
     *
     * _.lte(3, 1);
     * // => false
     */
    function lte(value, other) {
      return value <= other;
    }

    /**
     * Converts `value` to an array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Array} Returns the converted array.
     * @example
     *
     * (function() {
     *   return _.toArray(arguments).slice(1);
     * }(1, 2, 3));
     * // => [2, 3]
     */
    function toArray(value) {
      var length = value ? getLength(value) : 0;
      if (!isLength(length)) {
        return values(value);
      }
      if (!length) {
        return [];
      }
      return arrayCopy(value);
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable
     * properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return baseCopy(value, keysIn(value));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * overwrite property assignments of previous sources. If `customizer` is
     * provided it is invoked to produce the merged values of the destination and
     * source properties. If `customizer` returns `undefined` merging is handled
     * by the method instead. The `customizer` is bound to `thisArg` and invoked
     * with five arguments: (objectValue, sourceValue, key, object, source).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var users = {
     *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
     * };
     *
     * var ages = {
     *   'data': [{ 'age': 36 }, { 'age': 40 }]
     * };
     *
     * _.merge(users, ages);
     * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
     *
     * // using a customizer callback
     * var object = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var other = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(object, other, function(a, b) {
     *   if (_.isArray(a)) {
     *     return a.concat(b);
     *   }
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
     */
    var merge = createAssigner(baseMerge);

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources overwrite property assignments of previous sources.
     * If `customizer` is provided it is invoked to produce the assigned values.
     * The `customizer` is bound to `thisArg` and invoked with five arguments:
     * (objectValue, sourceValue, key, object, source).
     *
     * **Note:** This method mutates `object` and is based on
     * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
     *
     * @static
     * @memberOf _
     * @alias extend
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using a customizer callback
     * var defaults = _.partialRight(_.assign, function(value, other) {
     *   return _.isUndefined(value) ? other : value;
     * });
     *
     * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var assign = createAssigner(function(object, source, customizer) {
      return customizer
        ? assignWith(object, source, customizer)
        : baseAssign(object, source);
    });

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, {
     *   'constructor': Circle
     * });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties, guard) {
      var result = baseCreate(prototype);
      if (guard && isIterateeCall(prototype, properties, guard)) {
        properties = undefined;
      }
      return properties ? baseAssign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional values of the same property are ignored.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var defaults = createDefaults(assign, assignDefaults);

    /**
     * This method is like `_.defaults` except that it recursively assigns
     * default properties.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaultsDeep({ 'user': { 'name': 'barney' } }, { 'user': { 'name': 'fred', 'age': 36 } });
     * // => { 'user': { 'name': 'barney', 'age': 36 } }
     *
     */
    var defaultsDeep = createDefaults(merge, mergeDefaults);

    /**
     * This method is like `_.find` except that it returns the key of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (iteration order is not guaranteed)
     *
     * // using the `_.matches` callback shorthand
     * _.findKey(users, { 'age': 1, 'active': true });
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findKey(users, 'active');
     * // => 'barney'
     */
    var findKey = createFindKey(baseForOwn);

    /**
     * This method is like `_.findKey` except that it iterates over elements of
     * a collection in the opposite order.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findLastKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles` assuming `_.findKey` returns `barney`
     *
     * // using the `_.matches` callback shorthand
     * _.findLastKey(users, { 'age': 36, 'active': true });
     * // => 'barney'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findLastKey(users, 'active');
     * // => 'pebbles'
     */
    var findLastKey = createFindKey(baseForOwnRight);

    /**
     * Iterates over own and inherited enumerable properties of an object invoking
     * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked
     * with three arguments: (value, key, object). Iteratee functions may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forIn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a', 'b', and 'c' (iteration order is not guaranteed)
     */
    var forIn = createForIn(baseFor);

    /**
     * This method is like `_.forIn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forInRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'c', 'b', and 'a' assuming `_.forIn ` logs 'a', 'b', and 'c'
     */
    var forInRight = createForIn(baseForRight);

    /**
     * Iterates over own enumerable properties of an object invoking `iteratee`
     * for each property. The `iteratee` is bound to `thisArg` and invoked with
     * three arguments: (value, key, object). Iteratee functions may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a' and 'b' (iteration order is not guaranteed)
     */
    var forOwn = createForOwn(baseForOwn);

    /**
     * This method is like `_.forOwn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwnRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'b' and 'a' assuming `_.forOwn` logs 'a' and 'b'
     */
    var forOwnRight = createForOwn(baseForOwnRight);

    /**
     * Creates an array of function property names from all enumerable properties,
     * own and inherited, of `object`.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Object
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns the new array of property names.
     * @example
     *
     * _.functions(_);
     * // => ['after', 'ary', 'assign', ...]
     */
    function functions(object) {
      return baseFunctions(object, keysIn(object));
    }

    /**
     * Gets the property value at `path` of `object`. If the resolved value is
     * `undefined` the `defaultValue` is used in its place.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, toPath(path), path + '');
      return result === undefined ? defaultValue : result;
    }

    /**
     * Checks if `path` is a direct property.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
     * @example
     *
     * var object = { 'a': { 'b': { 'c': 3 } } };
     *
     * _.has(object, 'a');
     * // => true
     *
     * _.has(object, 'a.b.c');
     * // => true
     *
     * _.has(object, ['a', 'b', 'c']);
     * // => true
     */
    function has(object, path) {
      if (object == null) {
        return false;
      }
      var result = hasOwnProperty.call(object, path);
      if (!result && !isKey(path)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        if (object == null) {
          return false;
        }
        path = last(path);
        result = hasOwnProperty.call(object, path);
      }
      return result || (isLength(object.length) && isIndex(path, object.length) &&
        (isArray(object) || isArguments(object)));
    }

    /**
     * Creates an object composed of the inverted keys and values of `object`.
     * If `object` contains duplicate values, subsequent values overwrite property
     * assignments of previous values unless `multiValue` is `true`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to invert.
     * @param {boolean} [multiValue] Allow multiple values per key.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new inverted object.
     * @example
     *
     * var object = { 'a': 1, 'b': 2, 'c': 1 };
     *
     * _.invert(object);
     * // => { '1': 'c', '2': 'b' }
     *
     * // with `multiValue`
     * _.invert(object, true);
     * // => { '1': ['a', 'c'], '2': ['b'] }
     */
    function invert(object, multiValue, guard) {
      if (guard && isIterateeCall(object, multiValue, guard)) {
        multiValue = undefined;
      }
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index],
            value = object[key];

        if (multiValue) {
          if (hasOwnProperty.call(result, value)) {
            result[value].push(key);
          } else {
            result[value] = [key];
          }
        }
        else {
          result[value] = key;
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      var Ctor = object == null ? undefined : object.constructor;
      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
          (typeof object != 'function' && isArrayLike(object))) {
        return shimKeys(object);
      }
      return isObject(object) ? nativeKeys(object) : [];
    };

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      if (object == null) {
        return [];
      }
      if (!isObject(object)) {
        object = Object(object);
      }
      var length = object.length;
      length = (length && isLength(length) &&
        (isArray(object) || isArguments(object)) && length) || 0;

      var Ctor = object.constructor,
          index = -1,
          isProto = typeof Ctor == 'function' && Ctor.prototype === object,
          result = Array(length),
          skipIndexes = length > 0;

      while (++index < length) {
        result[index] = (index + '');
      }
      for (var key in object) {
        if (!(skipIndexes && isIndex(key, length)) &&
            !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The opposite of `_.mapValues`; this method creates an object with the
     * same values as `object` and keys generated by running each own enumerable
     * property of `object` through `iteratee`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
     *   return key + value;
     * });
     * // => { 'a1': 1, 'b2': 2 }
     */
    var mapKeys = createObjectMapper(true);

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through `iteratee`. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, key, object).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
     *   return n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     *
     * var users = {
     *   'fred':    { 'user': 'fred',    'age': 40 },
     *   'pebbles': { 'user': 'pebbles', 'age': 1 }
     * };
     *
     * // using the `_.property` callback shorthand
     * _.mapValues(users, 'age');
     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
     */
    var mapValues = createObjectMapper();

    /**
     * The opposite of `_.pick`; this method creates an object composed of the
     * own and inherited enumerable properties of `object` that are not omitted.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to omit, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.omit(object, 'age');
     * // => { 'user': 'fred' }
     *
     * _.omit(object, _.isNumber);
     * // => { 'user': 'fred' }
     */
    var omit = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      if (typeof props[0] != 'function') {
        var props = arrayMap(baseFlatten(props), String);
        return pickByArray(object, baseDifference(keysIn(object), props));
      }
      var predicate = bindCallback(props[0], props[1], 3);
      return pickByCallback(object, function(value, key, object) {
        return !predicate(value, key, object);
      });
    });

    /**
     * Creates a two dimensional array of the key-value pairs for `object`,
     * e.g. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
     */
    function pairs(object) {
      object = toObject(object);

      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates an object composed of the picked `object` properties. Property
     * names may be specified as individual arguments or as arrays of property
     * names. If `predicate` is provided it is invoked for each property of `object`
     * picking the properties `predicate` returns truthy for. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.pick(object, 'user');
     * // => { 'user': 'fred' }
     *
     * _.pick(object, _.isString);
     * // => { 'user': 'fred' }
     */
    var pick = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      return typeof props[0] == 'function'
        ? pickByCallback(object, bindCallback(props[0], props[1], 3))
        : pickByArray(object, baseFlatten(props));
    });

    /**
     * This method is like `_.get` except that if the resolved value is a function
     * it is invoked with the `this` binding of its parent object and its result
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to resolve.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
     *
     * _.result(object, 'a[0].b.c1');
     * // => 3
     *
     * _.result(object, 'a[0].b.c2');
     * // => 4
     *
     * _.result(object, 'a.b.c', 'default');
     * // => 'default'
     *
     * _.result(object, 'a.b.c', _.constant('default'));
     * // => 'default'
     */
    function result(object, path, defaultValue) {
      var result = object == null ? undefined : object[path];
      if (result === undefined) {
        if (object != null && !isKey(path, object)) {
          path = toPath(path);
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          result = object == null ? undefined : object[last(path)];
        }
        result = result === undefined ? defaultValue : result;
      }
      return isFunction(result) ? result.call(object) : result;
    }

    /**
     * Sets the property value of `path` on `object`. If a portion of `path`
     * does not exist it is created.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to augment.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, 'x[0].y.z', 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    function set(object, path, value) {
      if (object == null) {
        return object;
      }
      var pathKey = (path + '');
      path = (object[pathKey] != null || isKey(path, object)) ? [pathKey] : toPath(path);

      var index = -1,
          length = path.length,
          lastIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = path[index];
        if (isObject(nested)) {
          if (index == lastIndex) {
            nested[key] = value;
          } else if (nested[key] == null) {
            nested[key] = isIndex(path[index + 1]) ? [] : {};
          }
        }
        nested = nested[key];
      }
      return object;
    }

    /**
     * An alternative to `_.reduce`; this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own enumerable
     * properties through `iteratee`, with each invocation potentially mutating
     * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
     * with four arguments: (accumulator, value, key, object). Iteratee functions
     * may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.transform([2, 3, 4], function(result, n) {
     *   result.push(n *= n);
     *   return n % 2 == 0;
     * });
     * // => [4, 9]
     *
     * _.transform({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     */
    function transform(object, iteratee, accumulator, thisArg) {
      var isArr = isArray(object) || isTypedArray(object);
      iteratee = getCallback(iteratee, thisArg, 4);

      if (accumulator == null) {
        if (isArr || isObject(object)) {
          var Ctor = object.constructor;
          if (isArr) {
            accumulator = isArray(object) ? new Ctor : [];
          } else {
            accumulator = baseCreate(isFunction(Ctor) ? Ctor.prototype : undefined);
          }
        } else {
          accumulator = {};
        }
      }
      (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
        return iteratee(accumulator, value, index, object);
      });
      return accumulator;
    }

    /**
     * Creates an array of the own enumerable property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values(object) {
      return baseValues(object, keys(object));
    }

    /**
     * Creates an array of the own and inherited enumerable property values
     * of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.valuesIn(new Foo);
     * // => [1, 2, 3] (iteration order is not guaranteed)
     */
    function valuesIn(object) {
      return baseValues(object, keysIn(object));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Checks if `n` is between `start` and up to but not including, `end`. If
     * `end` is not specified it is set to `start` with `start` then set to `0`.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} n The number to check.
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `n` is in the range, else `false`.
     * @example
     *
     * _.inRange(3, 2, 4);
     * // => true
     *
     * _.inRange(4, 8);
     * // => true
     *
     * _.inRange(4, 2);
     * // => false
     *
     * _.inRange(2, 2);
     * // => false
     *
     * _.inRange(1.2, 2);
     * // => true
     *
     * _.inRange(5.2, 4);
     * // => false
     */
    function inRange(value, start, end) {
      start = +start || 0;
      if (end === undefined) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      return value >= nativeMin(start, end) && value < nativeMax(start, end);
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number is returned.
     * If `floating` is `true`, or either `min` or `max` are floats, a floating-point
     * number is returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating] Specify returning a floating-point number.
     * @returns {number} Returns the random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      if (floating && isIterateeCall(min, max, floating)) {
        max = floating = undefined;
      }
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (noMax && typeof min == 'boolean') {
          floating = min;
          min = 1;
        }
        else if (typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
        noMax = false;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the camel cased string.
     * @example
     *
     * _.camelCase('Foo Bar');
     * // => 'fooBar'
     *
     * _.camelCase('--foo-bar');
     * // => 'fooBar'
     *
     * _.camelCase('__foo_bar__');
     * // => 'fooBar'
     */
    var camelCase = createCompounder(function(result, word, index) {
      word = word.toLowerCase();
      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
    });

    /**
     * Capitalizes the first character of `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to capitalize.
     * @returns {string} Returns the capitalized string.
     * @example
     *
     * _.capitalize('fred');
     * // => 'Fred'
     */
    function capitalize(string) {
      string = baseToString(string);
      return string && (string.charAt(0).toUpperCase() + string.slice(1));
    }

    /**
     * Deburrs `string` by converting [latin-1 supplementary letters](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
     * to basic latin letters and removing [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to deburr.
     * @returns {string} Returns the deburred string.
     * @example
     *
     * _.deburr('déjà vu');
     * // => 'deja vu'
     */
    function deburr(string) {
      string = baseToString(string);
      return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
    }

    /**
     * Checks if `string` ends with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=string.length] The position to search from.
     * @returns {boolean} Returns `true` if `string` ends with `target`, else `false`.
     * @example
     *
     * _.endsWith('abc', 'c');
     * // => true
     *
     * _.endsWith('abc', 'b');
     * // => false
     *
     * _.endsWith('abc', 'b', 2);
     * // => true
     */
    function endsWith(string, target, position) {
      string = baseToString(string);
      target = (target + '');

      var length = string.length;
      position = position === undefined
        ? length
        : nativeMin(position < 0 ? 0 : (+position || 0), length);

      position -= target.length;
      return position >= 0 && string.indexOf(target, position) == position;
    }

    /**
     * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
     * their corresponding HTML entities.
     *
     * **Note:** No other characters are escaped. To escape additional characters
     * use a third-party library like [_he_](https://mths.be/he).
     *
     * Though the ">" character is escaped for symmetry, characters like
     * ">" and "/" don't need escaping in HTML and have no special meaning
     * unless they're part of a tag or unquoted attribute value.
     * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
     * (under "semi-related fun fact") for more details.
     *
     * Backticks are escaped because in Internet Explorer < 9, they can break out
     * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
     * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
     * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
     * for more details.
     *
     * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
     * to reduce XSS vectors.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('fred, barney, & pebbles');
     * // => 'fred, barney, &amp; pebbles'
     */
    function escape(string) {
      // Reset `lastIndex` because in IE < 9 `String#replace` does not.
      string = baseToString(string);
      return (string && reHasUnescapedHtml.test(string))
        ? string.replace(reUnescapedHtml, escapeHtmlChar)
        : string;
    }

    /**
     * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
     * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escapeRegExp('[lodash](https://lodash.com/)');
     * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
     */
    function escapeRegExp(string) {
      string = baseToString(string);
      return (string && reHasRegExpChars.test(string))
        ? string.replace(reRegExpChars, escapeRegExpChar)
        : (string || '(?:)');
    }

    /**
     * Converts `string` to [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the kebab cased string.
     * @example
     *
     * _.kebabCase('Foo Bar');
     * // => 'foo-bar'
     *
     * _.kebabCase('fooBar');
     * // => 'foo-bar'
     *
     * _.kebabCase('__foo_bar__');
     * // => 'foo-bar'
     */
    var kebabCase = createCompounder(function(result, word, index) {
      return result + (index ? '-' : '') + word.toLowerCase();
    });

    /**
     * Pads `string` on the left and right sides if it's shorter than `length`.
     * Padding characters are truncated if they can't be evenly divided by `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.pad('abc', 8);
     * // => '  abc   '
     *
     * _.pad('abc', 8, '_-');
     * // => '_-abc_-_'
     *
     * _.pad('abc', 3);
     * // => 'abc'
     */
    function pad(string, length, chars) {
      string = baseToString(string);
      length = +length;

      var strLength = string.length;
      if (strLength >= length || !nativeIsFinite(length)) {
        return string;
      }
      var mid = (length - strLength) / 2,
          leftLength = nativeFloor(mid),
          rightLength = nativeCeil(mid);

      chars = createPadding('', rightLength, chars);
      return chars.slice(0, leftLength) + string + chars;
    }

    /**
     * Pads `string` on the left side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padLeft('abc', 6);
     * // => '   abc'
     *
     * _.padLeft('abc', 6, '_-');
     * // => '_-_abc'
     *
     * _.padLeft('abc', 3);
     * // => 'abc'
     */
    var padLeft = createPadDir();

    /**
     * Pads `string` on the right side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padRight('abc', 6);
     * // => 'abc   '
     *
     * _.padRight('abc', 6, '_-');
     * // => 'abc_-_'
     *
     * _.padRight('abc', 3);
     * // => 'abc'
     */
    var padRight = createPadDir(true);

    /**
     * Converts `string` to an integer of the specified radix. If `radix` is
     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a hexadecimal,
     * in which case a `radix` of `16` is used.
     *
     * **Note:** This method aligns with the [ES5 implementation](https://es5.github.io/#E)
     * of `parseInt`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} string The string to convert.
     * @param {number} [radix] The radix to interpret `value` by.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     *
     * _.map(['6', '08', '10'], _.parseInt);
     * // => [6, 8, 10]
     */
    function parseInt(string, radix, guard) {
      // Firefox < 21 and Opera < 15 follow ES3 for `parseInt`.
      // Chrome fails to trim leading <BOM> whitespace characters.
      // See https://code.google.com/p/v8/issues/detail?id=3109 for more details.
      if (guard ? isIterateeCall(string, radix, guard) : radix == null) {
        radix = 0;
      } else if (radix) {
        radix = +radix;
      }
      string = trim(string);
      return nativeParseInt(string, radix || (reHasHexPrefix.test(string) ? 16 : 10));
    }

    /**
     * Repeats the given string `n` times.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to repeat.
     * @param {number} [n=0] The number of times to repeat the string.
     * @returns {string} Returns the repeated string.
     * @example
     *
     * _.repeat('*', 3);
     * // => '***'
     *
     * _.repeat('abc', 2);
     * // => 'abcabc'
     *
     * _.repeat('abc', 0);
     * // => ''
     */
    function repeat(string, n) {
      var result = '';
      string = baseToString(string);
      n = +n;
      if (n < 1 || !string || !nativeIsFinite(n)) {
        return result;
      }
      // Leverage the exponentiation by squaring algorithm for a faster repeat.
      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
      do {
        if (n % 2) {
          result += string;
        }
        n = nativeFloor(n / 2);
        string += string;
      } while (n);

      return result;
    }

    /**
     * Converts `string` to [snake case](https://en.wikipedia.org/wiki/Snake_case).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the snake cased string.
     * @example
     *
     * _.snakeCase('Foo Bar');
     * // => 'foo_bar'
     *
     * _.snakeCase('fooBar');
     * // => 'foo_bar'
     *
     * _.snakeCase('--foo-bar');
     * // => 'foo_bar'
     */
    var snakeCase = createCompounder(function(result, word, index) {
      return result + (index ? '_' : '') + word.toLowerCase();
    });

    /**
     * Converts `string` to [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the start cased string.
     * @example
     *
     * _.startCase('--foo-bar');
     * // => 'Foo Bar'
     *
     * _.startCase('fooBar');
     * // => 'Foo Bar'
     *
     * _.startCase('__foo_bar__');
     * // => 'Foo Bar'
     */
    var startCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + (word.charAt(0).toUpperCase() + word.slice(1));
    });

    /**
     * Checks if `string` starts with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=0] The position to search from.
     * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.
     * @example
     *
     * _.startsWith('abc', 'a');
     * // => true
     *
     * _.startsWith('abc', 'b');
     * // => false
     *
     * _.startsWith('abc', 'b', 1);
     * // => true
     */
    function startsWith(string, target, position) {
      string = baseToString(string);
      position = position == null
        ? 0
        : nativeMin(position < 0 ? 0 : (+position || 0), string.length);

      return string.lastIndexOf(target, position) == position;
    }

    /**
     * Creates a compiled template function that can interpolate data properties
     * in "interpolate" delimiters, HTML-escape interpolated data properties in
     * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
     * properties may be accessed as free variables in the template. If a setting
     * object is provided it takes precedence over `_.templateSettings` values.
     *
     * **Note:** In the development build `_.template` utilizes
     * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
     * for easier debugging.
     *
     * For more information on precompiling templates see
     * [lodash's custom builds documentation](https://lodash.com/custom-builds).
     *
     * For more information on Chrome extension sandboxes see
     * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The template string.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The HTML "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as free variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [options.variable] The data object variable name.
     * @param- {Object} [otherOptions] Enables the legacy `options` param signature.
     * @returns {Function} Returns the compiled template function.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= user %>!');
     * compiled({ 'user': 'fred' });
     * // => 'hello fred!'
     *
     * // using the HTML "escape" delimiter to escape data property values
     * var compiled = _.template('<b><%- value %></b>');
     * compiled({ 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to execute JavaScript and generate HTML
     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * var compiled = _.template('<% print("hello " + user); %>!');
     * compiled({ 'user': 'barney' });
     * // => 'hello barney!'
     *
     * // using the ES delimiter as an alternative to the default "interpolate" delimiter
     * var compiled = _.template('hello ${ user }!');
     * compiled({ 'user': 'pebbles' });
     * // => 'hello pebbles!'
     *
     * // using custom template delimiters
     * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
     * var compiled = _.template('hello {{ user }}!');
     * compiled({ 'user': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using backslashes to treat delimiters as plain text
     * var compiled = _.template('<%= "\\<%- value %\\>" %>');
     * compiled({ 'value': 'ignored' });
     * // => '<%- value %>'
     *
     * // using the `imports` option to import `jQuery` as `jq`
     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     * //   var __t, __p = '';
     * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
     * //   return __p;
     * // }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(string, options, otherOptions) {
      // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
      // and Laura Doktorova's doT.js (https://github.com/olado/doT).
      var settings = lodash.templateSettings;

      if (otherOptions && isIterateeCall(string, options, otherOptions)) {
        options = otherOptions = undefined;
      }
      string = baseToString(string);
      options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);

      var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
          importsKeys = keys(imports),
          importsValues = baseValues(imports, importsKeys);

      var isEscaping,
          isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // Compile the regexp to match each delimiter.
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      // Use a sourceURL for easier debugging.
      var sourceURL = '//# sourceURL=' +
        ('sourceURL' in options
          ? options.sourceURL
          : ('lodash.templateSources[' + (++templateCounter) + ']')
        ) + '\n';

      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // Escape characters that can't be included in string literals.
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // Replace delimiters with snippets.
        if (escapeValue) {
          isEscaping = true;
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // The JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value.
        return match;
      });

      source += "';\n";

      // If `variable` is not specified wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain.
      var variable = options.variable;
      if (!variable) {
        source = 'with (obj) {\n' + source + '\n}\n';
      }
      // Cleanup code by stripping empty strings.
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // Frame code as the function body.
      source = 'function(' + (variable || 'obj') + ') {\n' +
        (variable
          ? ''
          : 'obj || (obj = {});\n'
        ) +
        "var __t, __p = ''" +
        (isEscaping
           ? ', __e = _.escape'
           : ''
        ) +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      var result = attempt(function() {
        return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
      });

      // Provide the compiled function's source by its `toString` method or
      // the `source` property as a convenience for inlining compiled templates.
      result.source = source;
      if (isError(result)) {
        throw result;
      }
      return result;
    }

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
      }
      chars = (chars + '');
      return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
    }

    /**
     * Removes leading whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimLeft('  abc  ');
     * // => 'abc  '
     *
     * _.trimLeft('-_-abc-_-', '_-');
     * // => 'abc-_-'
     */
    function trimLeft(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string));
      }
      return string.slice(charsLeftIndex(string, (chars + '')));
    }

    /**
     * Removes trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimRight('  abc  ');
     * // => '  abc'
     *
     * _.trimRight('-_-abc-_-', '_-');
     * // => '-_-abc'
     */
    function trimRight(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(0, trimmedRightIndex(string) + 1);
      }
      return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
    }

    /**
     * Truncates `string` if it's longer than the given maximum string length.
     * The last characters of the truncated string are replaced with the omission
     * string which defaults to "...".
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to truncate.
     * @param {Object|number} [options] The options object or maximum string length.
     * @param {number} [options.length=30] The maximum string length.
     * @param {string} [options.omission='...'] The string to indicate text is omitted.
     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the truncated string.
     * @example
     *
     * _.trunc('hi-diddly-ho there, neighborino');
     * // => 'hi-diddly-ho there, neighbo...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', 24);
     * // => 'hi-diddly-ho there, n...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': ' '
     * });
     * // => 'hi-diddly-ho there,...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': /,? +/
     * });
     * // => 'hi-diddly-ho there...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'omission': ' [...]'
     * });
     * // => 'hi-diddly-ho there, neig [...]'
     */
    function trunc(string, options, guard) {
      if (guard && isIterateeCall(string, options, guard)) {
        options = undefined;
      }
      var length = DEFAULT_TRUNC_LENGTH,
          omission = DEFAULT_TRUNC_OMISSION;

      if (options != null) {
        if (isObject(options)) {
          var separator = 'separator' in options ? options.separator : separator;
          length = 'length' in options ? (+options.length || 0) : length;
          omission = 'omission' in options ? baseToString(options.omission) : omission;
        } else {
          length = +options || 0;
        }
      }
      string = baseToString(string);
      if (length >= string.length) {
        return string;
      }
      var end = length - omission.length;
      if (end < 1) {
        return omission;
      }
      var result = string.slice(0, end);
      if (separator == null) {
        return result + omission;
      }
      if (isRegExp(separator)) {
        if (string.slice(end).search(separator)) {
          var match,
              newEnd,
              substring = string.slice(0, end);

          if (!separator.global) {
            separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');
          }
          separator.lastIndex = 0;
          while ((match = separator.exec(substring))) {
            newEnd = match.index;
          }
          result = result.slice(0, newEnd == null ? end : newEnd);
        }
      } else if (string.indexOf(separator, end) != end) {
        var index = result.lastIndexOf(separator);
        if (index > -1) {
          result = result.slice(0, index);
        }
      }
      return result + omission;
    }

    /**
     * The inverse of `_.escape`; this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `&#96;` in `string` to their
     * corresponding characters.
     *
     * **Note:** No other HTML entities are unescaped. To unescape additional HTML
     * entities use a third-party library like [_he_](https://mths.be/he).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('fred, barney, &amp; pebbles');
     * // => 'fred, barney, & pebbles'
     */
    function unescape(string) {
      string = baseToString(string);
      return (string && reHasEscapedHtml.test(string))
        ? string.replace(reEscapedHtml, unescapeHtmlChar)
        : string;
    }

    /**
     * Splits `string` into an array of its words.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {RegExp|string} [pattern] The pattern to match words.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the words of `string`.
     * @example
     *
     * _.words('fred, barney, & pebbles');
     * // => ['fred', 'barney', 'pebbles']
     *
     * _.words('fred, barney, & pebbles', /[^, ]+/g);
     * // => ['fred', 'barney', '&', 'pebbles']
     */
    function words(string, pattern, guard) {
      if (guard && isIterateeCall(string, pattern, guard)) {
        pattern = undefined;
      }
      string = baseToString(string);
      return string.match(pattern || reWords) || [];
    }

    /*------------------------------------------------------------------------*/

    /**
     * Attempts to invoke `func`, returning either the result or the caught error
     * object. Any additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function} func The function to attempt.
     * @returns {*} Returns the `func` result or error object.
     * @example
     *
     * // avoid throwing errors for invalid selectors
     * var elements = _.attempt(function(selector) {
     *   return document.querySelectorAll(selector);
     * }, '>_>');
     *
     * if (_.isError(elements)) {
     *   elements = [];
     * }
     */
    var attempt = restParam(function(func, args) {
      try {
        return func.apply(undefined, args);
      } catch(e) {
        return isError(e) ? e : new Error(e);
      }
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and arguments of the created function. If `func` is a property name the
     * created callback returns the property value for a given element. If `func`
     * is an object the created callback returns `true` for elements that contain
     * the equivalent object properties, otherwise it returns `false`.
     *
     * @static
     * @memberOf _
     * @alias iteratee
     * @category Utility
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the callback.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);
     *   if (!match) {
     *     return callback(func, thisArg);
     *   }
     *   return function(object) {
     *     return match[2] == 'gt'
     *       ? object[match[1]] > match[3]
     *       : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(users, 'age__gt36');
     * // => [{ 'user': 'fred', 'age': 40 }]
     */
    function callback(func, thisArg, guard) {
      if (guard && isIterateeCall(func, thisArg, guard)) {
        thisArg = undefined;
      }
      return isObjectLike(func)
        ? matches(func)
        : baseCallback(func, thisArg);
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var getter = _.constant(object);
     *
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Creates a function that performs a deep comparison between a given object
     * and `source`, returning `true` if the given object has equivalent property
     * values, else `false`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.filter(users, _.matches({ 'age': 40, 'active': false }));
     * // => [{ 'user': 'fred', 'age': 40, 'active': false }]
     */
    function matches(source) {
      return baseMatches(baseClone(source, true));
    }

    /**
     * Creates a function that compares the property value of `path` on a given
     * object to `value`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * _.find(users, _.matchesProperty('user', 'fred'));
     * // => { 'user': 'fred' }
     */
    function matchesProperty(path, srcValue) {
      return baseMatchesProperty(path, baseClone(srcValue, true));
    }

    /**
     * Creates a function that invokes the method at `path` on a given object.
     * Any additional arguments are provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the method to invoke.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': _.constant(2) } } },
     *   { 'a': { 'b': { 'c': _.constant(1) } } }
     * ];
     *
     * _.map(objects, _.method('a.b.c'));
     * // => [2, 1]
     *
     * _.invoke(_.sortBy(objects, _.method(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    var method = restParam(function(path, args) {
      return function(object) {
        return invokePath(object, path, args);
      };
    });

    /**
     * The opposite of `_.method`; this method creates a function that invokes
     * the method at a given path on `object`. Any additional arguments are
     * provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = _.times(3, _.constant),
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.methodOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.methodOf(object));
     * // => [2, 0]
     */
    var methodOf = restParam(function(object, args) {
      return function(path) {
        return invokePath(object, path, args);
      };
    });

    /**
     * Adds all own enumerable function properties of a source object to the
     * destination object. If `object` is a function then methods are added to
     * its prototype as well.
     *
     * **Note:** Use `_.runInContext` to create a pristine `lodash` function to
     * avoid conflicts caused by modifying the original.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function|Object} [object=lodash] The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added
     *  are chainable.
     * @returns {Function|Object} Returns `object`.
     * @example
     *
     * function vowels(string) {
     *   return _.filter(string, function(v) {
     *     return /[aeiou]/i.test(v);
     *   });
     * }
     *
     * _.mixin({ 'vowels': vowels });
     * _.vowels('fred');
     * // => ['e']
     *
     * _('fred').vowels().value();
     * // => ['e']
     *
     * _.mixin({ 'vowels': vowels }, { 'chain': false });
     * _('fred').vowels();
     * // => ['e']
     */
    function mixin(object, source, options) {
      if (options == null) {
        var isObj = isObject(source),
            props = isObj ? keys(source) : undefined,
            methodNames = (props && props.length) ? baseFunctions(source, props) : undefined;

        if (!(methodNames ? methodNames.length : isObj)) {
          methodNames = false;
          options = source;
          source = object;
          object = this;
        }
      }
      if (!methodNames) {
        methodNames = baseFunctions(source, keys(source));
      }
      var chain = true,
          index = -1,
          isFunc = isFunction(object),
          length = methodNames.length;

      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      while (++index < length) {
        var methodName = methodNames[index],
            func = source[methodName];

        object[methodName] = func;
        if (isFunc) {
          object.prototype[methodName] = (function(func) {
            return function() {
              var chainAll = this.__chain__;
              if (chain || chainAll) {
                var result = object(this.__wrapped__),
                    actions = result.__actions__ = arrayCopy(this.__actions__);

                actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
                result.__chain__ = chainAll;
                return result;
              }
              return func.apply(object, arrayPush([this.value()], arguments));
            };
          }(func));
        }
      }
      return object;
    }

    /**
     * Reverts the `_` variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      root._ = oldDash;
      return this;
    }

    /**
     * A no-operation function that returns `undefined` regardless of the
     * arguments it receives.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // No operation performed.
    }

    /**
     * Creates a function that returns the property value at `path` on a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': 2 } } },
     *   { 'a': { 'b': { 'c': 1 } } }
     * ];
     *
     * _.map(objects, _.property('a.b.c'));
     * // => [2, 1]
     *
     * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
    }

    /**
     * The opposite of `_.property`; this method creates a function that returns
     * the property value at a given path on `object`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = [0, 1, 2],
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
     * // => [2, 0]
     */
    function propertyOf(object) {
      return function(path) {
        return baseGet(object, toPath(path), path + '');
      };
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to, but not including, `end`. If `end` is not specified it is
     * set to `start` with `start` then set to `0`. If `end` is less than `start`
     * a zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the new array of numbers.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      if (step && isIterateeCall(start, end, step)) {
        end = step = undefined;
      }
      start = +start || 0;
      step = step == null ? 1 : (+step || 0);

      if (end == null) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      // Use `Array(length)` so engines like Chakra and V8 avoid slower modes.
      // See https://youtu.be/XAqIpGU8ZZk#t=17m25s for more details.
      var index = -1,
          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Invokes the iteratee function `n` times, returning an array of the results
     * of each invocation. The `iteratee` is bound to `thisArg` and invoked with
     * one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6, false));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) {
     *   mage.castSpell(n);
     * });
     * // => invokes `mage.castSpell(n)` three times with `n` of `0`, `1`, and `2`
     *
     * _.times(3, function(n) {
     *   this.cast(n);
     * }, mage);
     * // => also invokes `mage.castSpell(n)` three times
     */
    function times(n, iteratee, thisArg) {
      n = nativeFloor(n);

      // Exit early to avoid a JSC JIT bug in Safari 8
      // where `Array(0)` is treated as `Array(1)`.
      if (n < 1 || !nativeIsFinite(n)) {
        return [];
      }
      var index = -1,
          result = Array(nativeMin(n, MAX_ARRAY_LENGTH));

      iteratee = bindCallback(iteratee, thisArg, 1);
      while (++index < n) {
        if (index < MAX_ARRAY_LENGTH) {
          result[index] = iteratee(index);
        } else {
          iteratee(index);
        }
      }
      return result;
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID is appended to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return baseToString(prefix) + id;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Adds two numbers.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} augend The first number to add.
     * @param {number} addend The second number to add.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.add(6, 4);
     * // => 10
     */
    function add(augend, addend) {
      return (+augend || 0) + (+addend || 0);
    }

    /**
     * Calculates `n` rounded up to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round up.
     * @param {number} [precision=0] The precision to round up to.
     * @returns {number} Returns the rounded up number.
     * @example
     *
     * _.ceil(4.006);
     * // => 5
     *
     * _.ceil(6.004, 2);
     * // => 6.01
     *
     * _.ceil(6040, -2);
     * // => 6100
     */
    var ceil = createRound('ceil');

    /**
     * Calculates `n` rounded down to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round down.
     * @param {number} [precision=0] The precision to round down to.
     * @returns {number} Returns the rounded down number.
     * @example
     *
     * _.floor(4.006);
     * // => 4
     *
     * _.floor(0.046, 2);
     * // => 0.04
     *
     * _.floor(4060, -2);
     * // => 4000
     */
    var floor = createRound('floor');

    /**
     * Gets the maximum value of `collection`. If `collection` is empty or falsey
     * `-Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * _.max([]);
     * // => -Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.max(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using the `_.property` callback shorthand
     * _.max(users, 'age');
     * // => { 'user': 'fred', 'age': 40 }
     */
    var max = createExtremum(gt, NEGATIVE_INFINITY);

    /**
     * Gets the minimum value of `collection`. If `collection` is empty or falsey
     * `Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * _.min([]);
     * // => Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.min(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // using the `_.property` callback shorthand
     * _.min(users, 'age');
     * // => { 'user': 'barney', 'age': 36 }
     */
    var min = createExtremum(lt, POSITIVE_INFINITY);

    /**
     * Calculates `n` rounded to `precision`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} n The number to round.
     * @param {number} [precision=0] The precision to round to.
     * @returns {number} Returns the rounded number.
     * @example
     *
     * _.round(4.006);
     * // => 4
     *
     * _.round(4.006, 2);
     * // => 4.01
     *
     * _.round(4060, -2);
     * // => 4100
     */
    var round = createRound('round');

    /**
     * Gets the sum of the values in `collection`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.sum([4, 6]);
     * // => 10
     *
     * _.sum({ 'a': 4, 'b': 6 });
     * // => 10
     *
     * var objects = [
     *   { 'n': 4 },
     *   { 'n': 6 }
     * ];
     *
     * _.sum(objects, function(object) {
     *   return object.n;
     * });
     * // => 10
     *
     * // using the `_.property` callback shorthand
     * _.sum(objects, 'n');
     * // => 10
     */
    function sum(collection, iteratee, thisArg) {
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = undefined;
      }
      iteratee = getCallback(iteratee, thisArg, 3);
      return iteratee.length == 1
        ? arraySum(isArray(collection) ? collection : toIterable(collection), iteratee)
        : baseSum(collection, iteratee);
    }

    /*------------------------------------------------------------------------*/

    // Ensure wrappers are instances of `baseLodash`.
    lodash.prototype = baseLodash.prototype;

    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
    LodashWrapper.prototype.constructor = LodashWrapper;

    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
    LazyWrapper.prototype.constructor = LazyWrapper;

    // Add functions to the `Map` cache.
    MapCache.prototype['delete'] = mapDelete;
    MapCache.prototype.get = mapGet;
    MapCache.prototype.has = mapHas;
    MapCache.prototype.set = mapSet;

    // Add functions to the `Set` cache.
    SetCache.prototype.push = cachePush;

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    // Add functions that return wrapped values when chaining.
    lodash.after = after;
    lodash.ary = ary;
    lodash.assign = assign;
    lodash.at = at;
    lodash.before = before;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.callback = callback;
    lodash.chain = chain;
    lodash.chunk = chunk;
    lodash.compact = compact;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.curry = curry;
    lodash.curryRight = curryRight;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defaultsDeep = defaultsDeep;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.drop = drop;
    lodash.dropRight = dropRight;
    lodash.dropRightWhile = dropRightWhile;
    lodash.dropWhile = dropWhile;
    lodash.fill = fill;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.flattenDeep = flattenDeep;
    lodash.flow = flow;
    lodash.flowRight = flowRight;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.keysIn = keysIn;
    lodash.map = map;
    lodash.mapKeys = mapKeys;
    lodash.mapValues = mapValues;
    lodash.matches = matches;
    lodash.matchesProperty = matchesProperty;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.method = method;
    lodash.methodOf = methodOf;
    lodash.mixin = mixin;
    lodash.modArgs = modArgs;
    lodash.negate = negate;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.partition = partition;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.propertyOf = propertyOf;
    lodash.pull = pull;
    lodash.pullAt = pullAt;
    lodash.range = range;
    lodash.rearg = rearg;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.restParam = restParam;
    lodash.set = set;
    lodash.shuffle = shuffle;
    lodash.slice = slice;
    lodash.sortBy = sortBy;
    lodash.sortByAll = sortByAll;
    lodash.sortByOrder = sortByOrder;
    lodash.spread = spread;
    lodash.take = take;
    lodash.takeRight = takeRight;
    lodash.takeRightWhile = takeRightWhile;
    lodash.takeWhile = takeWhile;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.thru = thru;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.toPlainObject = toPlainObject;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.unzip = unzip;
    lodash.unzipWith = unzipWith;
    lodash.values = values;
    lodash.valuesIn = valuesIn;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;
    lodash.zipWith = zipWith;

    // Add aliases.
    lodash.backflow = flowRight;
    lodash.collect = map;
    lodash.compose = flowRight;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.iteratee = callback;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;

    // Add functions to `lodash.prototype`.
    mixin(lodash, lodash);

    /*------------------------------------------------------------------------*/

    // Add functions that return unwrapped values when chaining.
    lodash.add = add;
    lodash.attempt = attempt;
    lodash.camelCase = camelCase;
    lodash.capitalize = capitalize;
    lodash.ceil = ceil;
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.deburr = deburr;
    lodash.endsWith = endsWith;
    lodash.escape = escape;
    lodash.escapeRegExp = escapeRegExp;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.findWhere = findWhere;
    lodash.first = first;
    lodash.floor = floor;
    lodash.get = get;
    lodash.gt = gt;
    lodash.gte = gte;
    lodash.has = has;
    lodash.identity = identity;
    lodash.includes = includes;
    lodash.indexOf = indexOf;
    lodash.inRange = inRange;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isError = isError;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isMatch = isMatch;
    lodash.isNaN = isNaN;
    lodash.isNative = isNative;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isTypedArray = isTypedArray;
    lodash.isUndefined = isUndefined;
    lodash.kebabCase = kebabCase;
    lodash.last = last;
    lodash.lastIndexOf = lastIndexOf;
    lodash.lt = lt;
    lodash.lte = lte;
    lodash.max = max;
    lodash.min = min;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.pad = pad;
    lodash.padLeft = padLeft;
    lodash.padRight = padRight;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.repeat = repeat;
    lodash.result = result;
    lodash.round = round;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.snakeCase = snakeCase;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.sortedLastIndex = sortedLastIndex;
    lodash.startCase = startCase;
    lodash.startsWith = startsWith;
    lodash.sum = sum;
    lodash.template = template;
    lodash.trim = trim;
    lodash.trimLeft = trimLeft;
    lodash.trimRight = trimRight;
    lodash.trunc = trunc;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;
    lodash.words = words;

    // Add aliases.
    lodash.all = every;
    lodash.any = some;
    lodash.contains = includes;
    lodash.eq = isEqual;
    lodash.detect = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.head = first;
    lodash.include = includes;
    lodash.inject = reduce;

    mixin(lodash, (function() {
      var source = {};
      baseForOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }()), false);

    /*------------------------------------------------------------------------*/

    // Add functions capable of returning wrapped and unwrapped values when chaining.
    lodash.sample = sample;

    lodash.prototype.sample = function(n) {
      if (!this.__chain__ && n == null) {
        return sample(this.value());
      }
      return this.thru(function(value) {
        return sample(value, n);
      });
    };

    /*------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = VERSION;

    // Assign default placeholders.
    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
      lodash[methodName].placeholder = lodash;
    });

    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.
    arrayEach(['drop', 'take'], function(methodName, index) {
      LazyWrapper.prototype[methodName] = function(n) {
        var filtered = this.__filtered__;
        if (filtered && !index) {
          return new LazyWrapper(this);
        }
        n = n == null ? 1 : nativeMax(nativeFloor(n) || 0, 0);

        var result = this.clone();
        if (filtered) {
          result.__takeCount__ = nativeMin(result.__takeCount__, n);
        } else {
          result.__views__.push({ 'size': n, 'type': methodName + (result.__dir__ < 0 ? 'Right' : '') });
        }
        return result;
      };

      LazyWrapper.prototype[methodName + 'Right'] = function(n) {
        return this.reverse()[methodName](n).reverse();
      };
    });

    // Add `LazyWrapper` methods that accept an `iteratee` value.
    arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {
      var type = index + 1,
          isFilter = type != LAZY_MAP_FLAG;

      LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {
        var result = this.clone();
        result.__iteratees__.push({ 'iteratee': getCallback(iteratee, thisArg, 1), 'type': type });
        result.__filtered__ = result.__filtered__ || isFilter;
        return result;
      };
    });

    // Add `LazyWrapper` methods for `_.first` and `_.last`.
    arrayEach(['first', 'last'], function(methodName, index) {
      var takeName = 'take' + (index ? 'Right' : '');

      LazyWrapper.prototype[methodName] = function() {
        return this[takeName](1).value()[0];
      };
    });

    // Add `LazyWrapper` methods for `_.initial` and `_.rest`.
    arrayEach(['initial', 'rest'], function(methodName, index) {
      var dropName = 'drop' + (index ? '' : 'Right');

      LazyWrapper.prototype[methodName] = function() {
        return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
      };
    });

    // Add `LazyWrapper` methods for `_.pluck` and `_.where`.
    arrayEach(['pluck', 'where'], function(methodName, index) {
      var operationName = index ? 'filter' : 'map',
          createCallback = index ? baseMatches : property;

      LazyWrapper.prototype[methodName] = function(value) {
        return this[operationName](createCallback(value));
      };
    });

    LazyWrapper.prototype.compact = function() {
      return this.filter(identity);
    };

    LazyWrapper.prototype.reject = function(predicate, thisArg) {
      predicate = getCallback(predicate, thisArg, 1);
      return this.filter(function(value) {
        return !predicate(value);
      });
    };

    LazyWrapper.prototype.slice = function(start, end) {
      start = start == null ? 0 : (+start || 0);

      var result = this;
      if (result.__filtered__ && (start > 0 || end < 0)) {
        return new LazyWrapper(result);
      }
      if (start < 0) {
        result = result.takeRight(-start);
      } else if (start) {
        result = result.drop(start);
      }
      if (end !== undefined) {
        end = (+end || 0);
        result = end < 0 ? result.dropRight(-end) : result.take(end - start);
      }
      return result;
    };

    LazyWrapper.prototype.takeRightWhile = function(predicate, thisArg) {
      return this.reverse().takeWhile(predicate, thisArg).reverse();
    };

    LazyWrapper.prototype.toArray = function() {
      return this.take(POSITIVE_INFINITY);
    };

    // Add `LazyWrapper` methods to `lodash.prototype`.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var checkIteratee = /^(?:filter|map|reject)|While$/.test(methodName),
          retUnwrapped = /^(?:first|last)$/.test(methodName),
          lodashFunc = lodash[retUnwrapped ? ('take' + (methodName == 'last' ? 'Right' : '')) : methodName];

      if (!lodashFunc) {
        return;
      }
      lodash.prototype[methodName] = function() {
        var args = retUnwrapped ? [1] : arguments,
            chainAll = this.__chain__,
            value = this.__wrapped__,
            isHybrid = !!this.__actions__.length,
            isLazy = value instanceof LazyWrapper,
            iteratee = args[0],
            useLazy = isLazy || isArray(value);

        if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
          // Avoid lazy use if the iteratee has a "length" value other than `1`.
          isLazy = useLazy = false;
        }
        var interceptor = function(value) {
          return (retUnwrapped && chainAll)
            ? lodashFunc(value, 1)[0]
            : lodashFunc.apply(undefined, arrayPush([value], args));
        };

        var action = { 'func': thru, 'args': [interceptor], 'thisArg': undefined },
            onlyLazy = isLazy && !isHybrid;

        if (retUnwrapped && !chainAll) {
          if (onlyLazy) {
            value = value.clone();
            value.__actions__.push(action);
            return func.call(value);
          }
          return lodashFunc.call(undefined, this.value())[0];
        }
        if (!retUnwrapped && useLazy) {
          value = onlyLazy ? value : new LazyWrapper(this);
          var result = func.apply(value, args);
          result.__actions__.push(action);
          return new LodashWrapper(result, chainAll);
        }
        return this.thru(interceptor);
      };
    });

    // Add `Array` and `String` methods to `lodash.prototype`.
    arrayEach(['join', 'pop', 'push', 'replace', 'shift', 'sort', 'splice', 'split', 'unshift'], function(methodName) {
      var func = (/^(?:replace|split)$/.test(methodName) ? stringProto : arrayProto)[methodName],
          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
          retUnwrapped = /^(?:join|pop|replace|shift)$/.test(methodName);

      lodash.prototype[methodName] = function() {
        var args = arguments;
        if (retUnwrapped && !this.__chain__) {
          return func.apply(this.value(), args);
        }
        return this[chainName](function(value) {
          return func.apply(value, args);
        });
      };
    });

    // Map minified function names to their real names.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var lodashFunc = lodash[methodName];
      if (lodashFunc) {
        var key = lodashFunc.name,
            names = realNames[key] || (realNames[key] = []);

        names.push({ 'name': methodName, 'func': lodashFunc });
      }
    });

    realNames[createHybridWrapper(undefined, BIND_KEY_FLAG).name] = [{ 'name': 'wrapper', 'func': undefined }];

    // Add functions to the lazy wrapper.
    LazyWrapper.prototype.clone = lazyClone;
    LazyWrapper.prototype.reverse = lazyReverse;
    LazyWrapper.prototype.value = lazyValue;

    // Add chaining functions to the `lodash` wrapper.
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.commit = wrapperCommit;
    lodash.prototype.concat = wrapperConcat;
    lodash.prototype.plant = wrapperPlant;
    lodash.prototype.reverse = wrapperReverse;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.run = lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;

    // Add function aliases to the `lodash` wrapper.
    lodash.prototype.collect = lodash.prototype.map;
    lodash.prototype.head = lodash.prototype.first;
    lodash.prototype.select = lodash.prototype.filter;
    lodash.prototype.tail = lodash.prototype.rest;

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // Export lodash.
  var _ = runInContext();

  // Some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose lodash to the global object when an AMD loader is present to avoid
    // errors in cases where lodash is loaded by a script tag and not intended
    // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
    // more details.
    root._ = _;

    // Define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module.
    define(function() {
      return _;
    });
  }
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
  else if (freeExports && freeModule) {
    // Export for Node.js or RingoJS.
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // Export for Rhino with CommonJS support.
    else {
      freeExports._ = _;
    }
  }
  else {
    // Export for a browser or Rhino.
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
'use strict';

class CancelError extends Error {
	constructor(reason) {
		super(reason || 'Promise was canceled');
		this.name = 'CancelError';
	}

	get isCanceled() {
		return true;
	}
}

class PCancelable {
	static fn(userFn) {
		return (...args) => {
			return new PCancelable((resolve, reject, onCancel) => {
				args.push(onCancel);
				userFn(...args).then(resolve, reject);
			});
		};
	}

	constructor(executor) {
		this._cancelHandlers = [];
		this._isPending = true;
		this._isCanceled = false;
		this._rejectOnCancel = true;

		this._promise = new Promise((resolve, reject) => {
			this._reject = reject;

			const onResolve = value => {
				this._isPending = false;
				resolve(value);
			};

			const onReject = error => {
				this._isPending = false;
				reject(error);
			};

			const onCancel = handler => {
				this._cancelHandlers.push(handler);
			};

			Object.defineProperties(onCancel, {
				shouldReject: {
					get: () => this._rejectOnCancel,
					set: bool => {
						this._rejectOnCancel = bool;
					}
				}
			});

			return executor(onResolve, onReject, onCancel);
		});
	}

	then(onFulfilled, onRejected) {
		return this._promise.then(onFulfilled, onRejected);
	}

	catch(onRejected) {
		return this._promise.catch(onRejected);
	}

	finally(onFinally) {
		return this._promise.finally(onFinally);
	}

	cancel(reason) {
		if (!this._isPending || this._isCanceled) {
			return;
		}

		if (this._cancelHandlers.length > 0) {
			try {
				for (const handler of this._cancelHandlers) {
					handler();
				}
			} catch (error) {
				this._reject(error);
			}
		}

		this._isCanceled = true;
		if (this._rejectOnCancel) {
			this._reject(new CancelError(reason));
		}
	}

	get isCanceled() {
		return this._isCanceled;
	}
}

Object.setPrototypeOf(PCancelable.prototype, Promise.prototype);

module.exports = PCancelable;
module.exports.default = PCancelable;

module.exports.CancelError = CancelError;

},{}],8:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],9:[function(require,module,exports){
const zip = window.zip = require('zipjs-browserify');
require('./lib/zip-fs');

/**
 * Watches an element for file drops, parses to create a filemap hierarchy,
 * and emits the result.
 */
class SimpleDropzone {

  /**
   * @param  {Element} el
   * @param  {Element} inputEl
   */
  constructor (el, inputEl) {
    this.el = el;
    this.inputEl = inputEl;

    this.listeners = {
      drop: [],
      dropstart: [],
      droperror: []
    };

    this._onDragover = this._onDragover.bind(this);
    this._onDrop = this._onDrop.bind(this);
    this._onSelect = this._onSelect.bind(this);

    el.addEventListener('dragover', this._onDragover, false);
    el.addEventListener('drop', this._onDrop, false);
    inputEl.addEventListener('change', this._onSelect);
  }

  /**
   * @param  {string}   type
   * @param  {Function} callback
   * @return {SimpleDropzone}
   */
  on (type, callback) {
    this.listeners[type].push(callback);
    return this;
  }

  /**
   * @param  {string} type
   * @param  {Object} data
   * @return {SimpleDropzone}
   */
  _emit (type, data) {
    this.listeners[type]
      .forEach((callback) => callback(data));
    return this;
  }

  /**
   * Destroys the instance.
   */
  destroy () {
    const el = this.el;
    const inputEl = this.inputEl;

    el.removeEventListener(this._onDragover);
    el.removeEventListener(this._onDrop);
    inputEl.removeEventListener(this._onSelect);

    delete this.el;
    delete this.inputEl;
    delete this.listeners;
  }

  /**
   * @param  {Event} e
   */
  _onDrop (e) {
    e.stopPropagation();
    e.preventDefault();

    this._emit('dropstart');

    let entries;
    if (e.dataTransfer.items) {
      entries = [].slice.call(e.dataTransfer.items)
        .map((item) => item.webkitGetAsEntry());
    } else if ((e.dataTransfer.files||[]).length === 1) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/zip') {
        this._loadZip(file);
        return;
      } else {
        this._emit('drop', {files: new Map([[file.name, file]])});
        return;
      }
    }

    if (!entries) {
      this._fail('Required drag-and-drop APIs are not supported in this browser.');
    }

    if (entries.length === 1 && entries[0].name.match(/\.zip$/)) {
      entries[0].file((file) => this._loadZip(file));
    } else {
      this._loadNextEntry(new Map(), entries);
    }
  }

  /**
   * @param  {Event} e
   */
  _onDragover (e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  /**
   * @param  {Event} e
   */
  _onSelect (e) {
    // HTML file inputs do not seem to support folders, so assume this is a flat file list.
    const files = [].slice.call(this.inputEl.files);
    const fileMap = new Map();
    files.forEach((file) => fileMap.set(file.name, file));
    this._emit('drop', {files: fileMap});
  }

  /**
   * Iterates through a list of FileSystemEntry objects, creates the fileMap
   * tree, and emits the result.
   * @param  {Map<string, File>} fileMap
   * @param  {Array<FileSystemEntry>} entries
   */
  _loadNextEntry (fileMap, entries) {
    const entry = entries.pop();

    if (!entry) {
      this._emit('drop', {files: fileMap});
      return;
    }

    if (entry.isFile) {
      entry.file((file) => {
        fileMap.set(entry.fullPath, file);
        this._loadNextEntry(fileMap, entries);
      }, () => console.error('Could not load file: %s', entry.fullPath));
    } else if (entry.isDirectory) {
      // readEntries() must be called repeatedly until it stops returning results.
      // https://www.w3.org/TR/2012/WD-file-system-api-20120417/#the-directoryreader-interface
      // https://bugs.chromium.org/p/chromium/issues/detail?id=378883
      const reader = entry.createReader();
      const readerCallback = (newEntries) => {
        if (newEntries.length) {
          entries = entries.concat(newEntries);
          reader.readEntries(readerCallback);
        } else {
          this._loadNextEntry(fileMap, entries);
        }
      };
      reader.readEntries(readerCallback);
    } else {
      console.warn('Unknown asset type: ' + entry.fullPath);
      this._loadNextEntry(fileMap, entries);
    }
  }

  /**
   * Inflates a File in .ZIP format, creates the fileMap tree, and emits the
   * result.
   * @param  {File} file
   */
  _loadZip (file) {
    const pending = [];
    const fileMap = new Map();
    const archive = new zip.fs.FS();

    const traverse = (node) => {
      if (node.directory) {
        node.children.forEach(traverse);
      } else if (node.name[0] !== '.') {
        pending.push(new Promise((resolve) => {
          node.getData(new zip.BlobWriter(), (blob) => {
            blob.name = node.name;
            fileMap.set(node.getFullname(), blob);
            resolve();
          });
        }));
      }
    };

    archive.importBlob(file, () => {
      traverse(archive.root);
      Promise.all(pending).then(() => {
        this._emit('drop', {files: fileMap});
      });
    });
  }

  /**
   * @param {string} message
   * @throws
   */
  _fail (message) {
    this._emit('droperror', {message: message});
  }
}

module.exports = SimpleDropzone;

},{"./lib/zip-fs":10,"zipjs-browserify":18}],10:[function(require,module,exports){
/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
  "use strict";

  var CHUNK_SIZE = 512 * 1024;

  var TextWriter = zip.TextWriter, //
  BlobWriter = zip.BlobWriter, //
  Data64URIWriter = zip.Data64URIWriter, //
  Reader = zip.Reader, //
  TextReader = zip.TextReader, //
  BlobReader = zip.BlobReader, //
  Data64URIReader = zip.Data64URIReader, //
  createReader = zip.createReader, //
  createWriter = zip.createWriter;

  function ZipBlobReader(entry) {
    var that = this, blobReader;

    function init(callback) {
      that.size = entry.uncompressedSize;
      callback();
    }

    function getData(callback) {
      if (that.data)
        callback();
      else
        entry.getData(new BlobWriter(), function(data) {
          that.data = data;
          blobReader = new BlobReader(data);
          callback();
        }, null, that.checkCrc32);
    }

    function readUint8Array(index, length, callback, onerror) {
      getData(function() {
        blobReader.readUint8Array(index, length, callback, onerror);
      }, onerror);
    }

    that.size = 0;
    that.init = init;
    that.readUint8Array = readUint8Array;
  }
  ZipBlobReader.prototype = new Reader();
  ZipBlobReader.prototype.constructor = ZipBlobReader;
  ZipBlobReader.prototype.checkCrc32 = false;

  function getTotalSize(entry) {
    var size = 0;

    function process(entry) {
      size += entry.uncompressedSize || 0;
      entry.children.forEach(process);
    }

    process(entry);
    return size;
  }

  function initReaders(entry, onend, onerror) {
    var index = 0;

    function next() {
      index++;
      if (index < entry.children.length)
        process(entry.children[index]);
      else
        onend();
    }

    function process(child) {
      if (child.directory)
        initReaders(child, next, onerror);
      else {
        child.reader = new child.Reader(child.data, onerror);
        child.reader.init(function() {
          child.uncompressedSize = child.reader.size;
          next();
        });
      }
    }

    if (entry.children.length)
      process(entry.children[index]);
    else
      onend();
  }

  function detach(entry) {
    var children = entry.parent.children;
    children.forEach(function(child, index) {
      if (child.id == entry.id)
        children.splice(index, 1);
    });
  }

  function exportZip(zipWriter, entry, onend, onprogress, totalSize) {
    var currentIndex = 0;

    function process(zipWriter, entry, onend, onprogress, totalSize) {
      var childIndex = 0;

      function exportChild() {
        var child = entry.children[childIndex];
        if (child)
          zipWriter.add(child.getFullname(), child.reader, function() {
            currentIndex += child.uncompressedSize || 0;
            process(zipWriter, child, function() {
              childIndex++;
              exportChild();
            }, onprogress, totalSize);
          }, function(index) {
            if (onprogress)
              onprogress(currentIndex + index, totalSize);
          }, {
            directory : child.directory,
            version : child.zipVersion
          });
        else
          onend();
      }

      exportChild();
    }

    process(zipWriter, entry, onend, onprogress, totalSize);
  }

  function addFileEntry(zipEntry, fileEntry, onend, onerror) {
    function getChildren(fileEntry, callback) {
      if (fileEntry.isDirectory)
        fileEntry.createReader().readEntries(callback);
      if (fileEntry.isFile)
        callback([]);
    }

    function process(zipEntry, fileEntry, onend) {
      getChildren(fileEntry, function(children) {
        var childIndex = 0;

        function addChild(child) {
          function nextChild(childFileEntry) {
            process(childFileEntry, child, function() {
              childIndex++;
              processChild();
            });
          }

          if (child.isDirectory)
            nextChild(zipEntry.addDirectory(child.name));
          if (child.isFile)
            child.file(function(file) {
              var childZipEntry = zipEntry.addBlob(child.name, file);
              childZipEntry.uncompressedSize = file.size;
              nextChild(childZipEntry);
            }, onerror);
        }

        function processChild() {
          var child = children[childIndex];
          if (child)
            addChild(child);
          else
            onend();
        }

        processChild();
      });
    }

    if (fileEntry.isDirectory)
      process(zipEntry, fileEntry, onend);
    else
      fileEntry.file(function(file) {
        zipEntry.addBlob(fileEntry.name, file);
        onend();
      }, onerror);
  }

  function getFileEntry(fileEntry, entry, onend, onprogress, onerror, totalSize, checkCrc32) {
    var currentIndex = 0;

    function process(fileEntry, entry, onend, onprogress, onerror, totalSize) {
      var childIndex = 0;

      function addChild(child) {
        function nextChild(childFileEntry) {
          currentIndex += child.uncompressedSize || 0;
          process(childFileEntry, child, function() {
            childIndex++;
            processChild();
          }, onprogress, onerror, totalSize);
        }

        if (child.directory)
          fileEntry.getDirectory(child.name, {
            create : true
          }, nextChild, onerror);
        else
          fileEntry.getFile(child.name, {
            create : true
          }, function(file) {
            child.getData(new zip.FileWriter(file, zip.getMimeType(child.name)), nextChild, function(index) {
              if (onprogress)
                onprogress(currentIndex + index, totalSize);
            }, checkCrc32);
          }, onerror);
      }

      function processChild() {
        var child = entry.children[childIndex];
        if (child)
          addChild(child);
        else
          onend();
      }

      processChild();
    }

    if (entry.directory)
      process(fileEntry, entry, onend, onprogress, onerror, totalSize);
    else
      entry.getData(new zip.FileWriter(fileEntry, zip.getMimeType(entry.name)), onend, onprogress, checkCrc32);
  }

  function resetFS(fs) {
    fs.entries = [];
    fs.root = new ZipDirectoryEntry(fs);
  }

  function bufferedCopy(reader, writer, onend, onprogress, onerror) {
    var chunkIndex = 0;

    function stepCopy() {
      var index = chunkIndex * CHUNK_SIZE;
      if (onprogress)
        onprogress(index, reader.size);
      if (index < reader.size)
        reader.readUint8Array(index, Math.min(CHUNK_SIZE, reader.size - index), function(array) {
          writer.writeUint8Array(new Uint8Array(array), function() {
            chunkIndex++;
            stepCopy();
          });
        }, onerror);
      else
        writer.getData(onend);
    }

    stepCopy();
  }

  function addChild(parent, name, params, directory) {
    if (parent.directory)
      return directory ? new ZipDirectoryEntry(parent.fs, name, params, parent) : new ZipFileEntry(parent.fs, name, params, parent);
    else
      throw "Parent entry is not a directory.";
  }

  function ZipEntry() {
  }

  ZipEntry.prototype = {
    init : function(fs, name, params, parent) {
      var that = this;
      if (fs.root && parent && parent.getChildByName(name))
        throw "Entry filename already exists.";
      if (!params)
        params = {};
      that.fs = fs;
      that.name = name;
      that.id = fs.entries.length;
      that.parent = parent;
      that.children = [];
      that.zipVersion = params.zipVersion || 0x14;
      that.uncompressedSize = 0;
      fs.entries.push(that);
      if (parent)
        that.parent.children.push(that);
    },
    getFileEntry : function(fileEntry, onend, onprogress, onerror, checkCrc32) {
      var that = this;
      initReaders(that, function() {
        getFileEntry(fileEntry, that, onend, onprogress, onerror, getTotalSize(that), checkCrc32);
      }, onerror);
    },
    moveTo : function(target) {
      var that = this;
      if (target.directory) {
        if (!target.isDescendantOf(that)) {
          if (that != target) {
            if (target.getChildByName(that.name))
              throw "Entry filename already exists.";
            detach(that);
            that.parent = target;
            target.children.push(that);
          }
        } else
          throw "Entry is a ancestor of target entry.";
      } else
        throw "Target entry is not a directory.";
    },
    getFullname : function() {
      var that = this, fullname = that.name, entry = that.parent;
      while (entry) {
        fullname = (entry.name ? entry.name + "/" : "") + fullname;
        entry = entry.parent;
      }
      return fullname;
    },
    isDescendantOf : function(ancestor) {
      var entry = this.parent;
      while (entry && entry.id != ancestor.id)
        entry = entry.parent;
      return !!entry;
    }
  };
  ZipEntry.prototype.constructor = ZipEntry;

  var ZipFileEntryProto;

  function ZipFileEntry(fs, name, params, parent) {
    var that = this;
    ZipEntry.prototype.init.call(that, fs, name, params, parent);
    that.Reader = params.Reader;
    that.Writer = params.Writer;
    that.data = params.data;
    if (params.getData) {
      that.getData = params.getData;
    }
  }

  ZipFileEntry.prototype = ZipFileEntryProto = new ZipEntry();
  ZipFileEntryProto.constructor = ZipFileEntry;
  ZipFileEntryProto.getData = function(writer, onend, onprogress, onerror) {
    var that = this;
    if (!writer || (writer.constructor == that.Writer && that.data))
      onend(that.data);
    else {
      if (!that.reader)
        that.reader = new that.Reader(that.data, onerror);
      that.reader.init(function() {
        writer.init(function() {
          bufferedCopy(that.reader, writer, onend, onprogress, onerror);
        }, onerror);
      });
    }
  };

  ZipFileEntryProto.getText = function(onend, onprogress, checkCrc32, encoding) {
    this.getData(new TextWriter(encoding), onend, onprogress, checkCrc32);
  };
  ZipFileEntryProto.getBlob = function(mimeType, onend, onprogress, checkCrc32) {
    this.getData(new BlobWriter(mimeType), onend, onprogress, checkCrc32);
  };
  ZipFileEntryProto.getData64URI = function(mimeType, onend, onprogress, checkCrc32) {
    this.getData(new Data64URIWriter(mimeType), onend, onprogress, checkCrc32);
  };

  var ZipDirectoryEntryProto;

  function ZipDirectoryEntry(fs, name, params, parent) {
    var that = this;
    ZipEntry.prototype.init.call(that, fs, name, params, parent);
    that.directory = true;
  }

  ZipDirectoryEntry.prototype = ZipDirectoryEntryProto = new ZipEntry();
  ZipDirectoryEntryProto.constructor = ZipDirectoryEntry;
  ZipDirectoryEntryProto.addDirectory = function(name) {
    return addChild(this, name, null, true);
  };
  ZipDirectoryEntryProto.addText = function(name, text) {
    return addChild(this, name, {
      data : text,
      Reader : TextReader,
      Writer : TextWriter
    });
  };
  ZipDirectoryEntryProto.addBlob = function(name, blob) {
    return addChild(this, name, {
      data : blob,
      Reader : BlobReader,
      Writer : BlobWriter
    });
  };
  ZipDirectoryEntryProto.addData64URI = function(name, dataURI) {
    return addChild(this, name, {
      data : dataURI,
      Reader : Data64URIReader,
      Writer : Data64URIWriter
    });
  };
  ZipDirectoryEntryProto.addFileEntry = function(fileEntry, onend, onerror) {
    addFileEntry(this, fileEntry, onend, onerror);
  };
  ZipDirectoryEntryProto.addData = function(name, params) {
    return addChild(this, name, params);
  };
  ZipDirectoryEntryProto.importBlob = function(blob, onend, onerror) {
    this.importZip(new BlobReader(blob), onend, onerror);
  };
  ZipDirectoryEntryProto.importText = function(text, onend, onerror) {
    this.importZip(new TextReader(text), onend, onerror);
  };
  ZipDirectoryEntryProto.importData64URI = function(dataURI, onend, onerror) {
    this.importZip(new Data64URIReader(dataURI), onend, onerror);
  };
  ZipDirectoryEntryProto.exportBlob = function(onend, onprogress, onerror) {
    this.exportZip(new BlobWriter("application/zip"), onend, onprogress, onerror);
  };
  ZipDirectoryEntryProto.exportText = function(onend, onprogress, onerror) {
    this.exportZip(new TextWriter(), onend, onprogress, onerror);
  };
  ZipDirectoryEntryProto.exportFileEntry = function(fileEntry, onend, onprogress, onerror) {
    this.exportZip(new zip.FileWriter(fileEntry, "application/zip"), onend, onprogress, onerror);
  };
  ZipDirectoryEntryProto.exportData64URI = function(onend, onprogress, onerror) {
    this.exportZip(new Data64URIWriter("application/zip"), onend, onprogress, onerror);
  };
  ZipDirectoryEntryProto.importZip = function(reader, onend, onerror) {
    var that = this;
    createReader(reader, function(zipReader) {
      zipReader.getEntries(function(entries) {
        entries.forEach(function(entry) {
          var parent = that, path = entry.filename.split("/"), name = path.pop();
          path.forEach(function(pathPart) {
            parent = parent.getChildByName(pathPart) || new ZipDirectoryEntry(that.fs, pathPart, null, parent);
          });
          if (!entry.directory)
            addChild(parent, name, {
              data : entry,
              Reader : ZipBlobReader
            });
        });
        onend();
      });
    }, onerror);
  };
  ZipDirectoryEntryProto.exportZip = function(writer, onend, onprogress, onerror) {
    var that = this;
    initReaders(that, function() {
      createWriter(writer, function(zipWriter) {
        exportZip(zipWriter, that, function() {
          zipWriter.close(onend);
        }, onprogress, getTotalSize(that));
      }, onerror);
    }, onerror);
  };
  ZipDirectoryEntryProto.getChildByName = function(name) {
    var childIndex, child, that = this;
    for (childIndex = 0; childIndex < that.children.length; childIndex++) {
      child = that.children[childIndex];
      if (child.name == name)
        return child;
    }
  };

  function FS() {
    resetFS(this);
  }
  FS.prototype = {
    remove : function(entry) {
      detach(entry);
      this.entries[entry.id] = null;
    },
    find : function(fullname) {
      var index, path = fullname.split("/"), node = this.root;
      for (index = 0; node && index < path.length; index++)
        node = node.getChildByName(path[index]);
      return node;
    },
    getById : function(id) {
      return this.entries[id];
    },
    importBlob : function(blob, onend, onerror) {
      resetFS(this);
      this.root.importBlob(blob, onend, onerror);
    },
    importText : function(text, onend, onerror) {
      resetFS(this);
      this.root.importText(text, onend, onerror);
    },
    importData64URI : function(dataURI, onend, onerror) {
      resetFS(this);
      this.root.importData64URI(dataURI, onend, onerror);
    },
    exportBlob : function(onend, onprogress, onerror) {
      this.root.exportBlob(onend, onprogress, onerror);
    },
    exportText : function(onend, onprogress, onerror) {
      this.root.exportText(onend, onprogress, onerror);
    },
    exportFileEntry : function(fileEntry, onend, onprogress, onerror) {
      this.root.exportFileEntry(fileEntry, onend, onprogress, onerror);
    },
    exportData64URI : function(onend, onprogress, onerror) {
      this.root.exportData64URI(onend, onprogress, onerror);
    }
  };

  zip.fs = {
    FS : FS,
    ZipDirectoryEntry : ZipDirectoryEntry,
    ZipFileEntry : ZipFileEntry
  };

  zip.getMimeType = function() {
    return "application/octet-stream";
  };

})();

},{}],11:[function(require,module,exports){
'use strict';

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ## default options
 */
let defaults = {
  // start unpaused ?
  active: true,
  // requests per `ratePer` ms
  rate: 40,
  // ms per `rate` requests
  ratePer: 40000,
  // max concurrent requests
  concurrent: 20
};

/**
 * ## Throttle
 * The throttle object.
 *
 * @class
 * @param {object} options - key value options
 */
class Throttle extends _events2.default {
  constructor(options) {
    super();
    // instance properties
    this._options({
      _requestTimes: [0],
      _current: 0,
      _buffer: [],
      _serials: {},
      _timeout: false
    });
    this._options(defaults);
    this._options(options);
  }

  /**
   * ## _options
   * updates options on instance
   *
   * @method
   * @param {Object} options - key value object
   * @returns null
   */
  _options(options) {
    for (let property in options) {
      if (options.hasOwnProperty(property)) {
        this[property] = options[property];
      }
    }
  }

  /**
   * ## options
   * thin wrapper for _options
   *
   *  * calls `this.cycle()`
   *  * adds alternate syntax
   *
   * alternate syntax:
   * throttle.options('active', true)
   * throttle.options({active: true})
   *
   * @method
   * @param {Object} options - either key value object or keyname
   * @param {Mixed} [value] - value for key
   * @returns null
   */
  options(options, value) {
    if (typeof options === 'string' && value) {
      options = { options: value };
    }
    this._options(options);
    this.cycle();
  }

  /**
   * ## next
   * checks whether instance has available capacity and calls throttle.send()
   *
   * @returns {Boolean}
   */
  next() {
    let throttle = this;
    // make requestTimes `throttle.rate` long. Oldest request will be 0th index
    throttle._requestTimes = throttle._requestTimes.slice(throttle.rate * -1);

    if (
    // paused
    !throttle.active ||
    // at concurrency limit
    throttle._current >= throttle.concurrent ||
    // less than `ratePer`
    throttle._isRateBound() ||
    // something waiting in the throttle
    !throttle._buffer.length) {
      return false;
    }
    let idx = throttle._buffer.findIndex(request => {
      return !request.serial || !throttle._serials[request.serial];
    });
    if (idx === -1) {
      throttle._isSerialBound = true;
      return false;
    }
    throttle.send(throttle._buffer.splice(idx, 1)[0]);
    return true;
  }

  /**
   * ## serial
   * updates throttle.\_serials and throttle.\_isRateBound
   *
   * serial subthrottles allow some requests to be serialised, whilst maintaining
   * their place in the queue. The _serials structure keeps track of what serial
   * queues are waiting for a response.
   *
   * ```
   * throttle._serials = {
   *   'example.com/end/point': true,
   *   'example.com/another': false
   * }
   * ```
   *
   * @param {Request} request superagent request
   * @param {Boolean} state new state for serial
   */
  serial(request, state) {
    let serials = this._serials;
    let throttle = this;
    if (request.serial === false) {
      return;
    }
    if (state === undefined) {
      return serials[request.serial];
    }
    if (state === false) {
      throttle._isSerialBound = false;
    }
    serials[request.serial] = state;
  }

  /**
   * ## _isRateBound
   * returns true if throttle is bound by rate
   *
   * @returns {Boolean}
   */
  _isRateBound() {
    let throttle = this;
    return Date.now() - throttle._requestTimes[0] < throttle.ratePer && throttle._buffer.length > 0;
  }

  /**
   * ## cycle
   * an iterator of sorts. Should be called when
   *
   *  - something added to throttle (check if it can be sent immediately)
   *  - `ratePer` ms have elapsed since nth last call where n is `rate` (may have
   *    available rate)
   *  - some request has ended (may have available concurrency)
   *
   * @param {Request} request the superagent request
   * @returns null
   */
  cycle(request) {
    let throttle = this;
    if (request) {
      throttle._buffer.push(request);
    }
    clearTimeout(throttle._timeout);

    // fire requests
    // throttle.next will return false if there's no capacity or throttle is
    // drained
    while (throttle.next()) {}

    // if bound by rate, set timeout to reassess later.
    if (throttle._isRateBound()) {
      let timeout;
      // defined rate
      timeout = throttle.ratePer;
      // less ms elapsed since oldest request
      timeout -= Date.now() - throttle._requestTimes[0];
      // plus 1 ms to ensure you don't fire a request exactly ratePer ms later
      timeout += 1;
      throttle._timeout = setTimeout(function () {
        throttle.cycle();
      }, timeout);
    }
  }

  /**
   * ## send
   *
   * sends a queued request.
   *
   * @param {Request} request superagent request
   * @returns null
   */
  send(request) {
    let throttle = this;
    throttle.serial(request, true);

    // declare callback within this enclosure, for access to throttle & request
    function cleanup(err, response) {
      throttle._current -= 1;
      if (err && _events2.default.listenerCount(throttle, 'error')) {
        throttle.emit('error', response);
      }
      throttle.emit('received', request);

      if (!throttle._buffer.length && !throttle._current) {
        throttle.emit('drained');
      }
      throttle.serial(request, false);
      throttle.cycle();
      // original `callback` was stored at `request._maskedCallback`
      request._maskedCallback(err, response);
    }

    // original `request.end` was stored at `request._maskedEnd`
    request._maskedEnd(cleanup);
    throttle._requestTimes.push(Date.now());
    throttle._current += 1;
    this.emit('sent', request);
  }

  /**
   * ## plugin
   *
   * `superagent` `use` function should refer to this plugin method a la
   * `.use(throttle.plugin())`
   *
   * mask the original `.end` and store the callback passed in
   *
   * @method
   * @param {string} serial any string is ok, it's just a namespace
   * @returns null
   */
  plugin(serial) {
    let throttle = this;
    // let patch = function(request) {
    return request => {
      request.throttle = throttle;
      request.serial = serial || false;
      // replace request.end
      request._maskedEnd = request.end;
      request.end = function (callback) {
        // store callback as superagent does
        request._maskedCallback = callback || function () {};
        // place this request in the queue
        request.throttle.cycle(request);
        return request;
      };
      return request;
    };
  }
}

module.exports = Throttle;
},{"events":4}],12:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');
var requestBase = require('./request-base');
var isObject = require('./is-object');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Expose `request`.
 */

var request = module.exports = require('./request').bind(null, Request);

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
        }
      }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter` and `requestBase`.
 */

Emitter(Request.prototype);
for (var key in requestBase) {
  Request.prototype[key] = requestBase[key];
}

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr && this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set responseType to `val`. Presently valid responseTypes are 'blob' and 
 * 'arraybuffer'.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'basic'
    }
  }

  switch (options.type) {
    case 'basic':
      var str = btoa(user + ':' + pass);
      this.set('Authorization', 'Basic ' + str);
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  this._getFormData().append(field, file, filename || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this._header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * @deprecated
 */
Response.prototype.parse = function serialize(fn){
  if (root.console) {
    console.warn("Client-side parse() method has been renamed to serialize(). This method is not compatible with superagent v2.0");
  }
  this.serialize(fn);
  return this;
};

Response.prototype.serialize = function serialize(fn){
  this._parser = fn;
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = 'download';
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};


/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":13,"./request":15,"./request-base":14,"emitter":1,"reduce":8}],13:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null != obj && 'object' == typeof obj;
}

module.exports = isObject;

},{}],14:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

exports.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Force given parser
 *
 * Sets the body parser no matter type.
 *
 * @param {Function}
 * @api public
 */

exports.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

exports.timeout = function timeout(ms){
  this._timeout = ms;
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

exports.then = function then(fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Allow for extension
 */

exports.use = function use(fn) {
  fn(this);
  return this;
}


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

exports.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

exports.getHeader = exports.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

exports.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
exports.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
exports.field = function(name, val) {
  this._getFormData().append(name, val);
  return this;
};

},{"./is-object":13}],15:[function(require,module,exports){
// The node and browser modules expose versions of this with the
// appropriate constructor function bound as first argument
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(RequestConstructor, method, url) {
  // callback
  if ('function' == typeof url) {
    return new RequestConstructor('GET', method).end(url);
  }

  // url first
  if (2 == arguments.length) {
    return new RequestConstructor('GET', method);
  }

  return new RequestConstructor(method, url);
}

module.exports = request;

},{}],16:[function(require,module,exports){
(function (global){

var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],17:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":16}],18:[function(require,module,exports){

var zip = require('zip');

function createUrl(src){
  var blob = new Blob([src], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

var zWorker = createUrl("/* jshint worker:true */\n(function main(global) {\n\t\"use strict\";\n\n\tif (global.zWorkerInitialized)\n\t\tthrow new Error('z-worker.js should be run only once');\n\tglobal.zWorkerInitialized = true;\n\n\taddEventListener(\"message\", function(event) {\n\t\tvar message = event.data, type = message.type, sn = message.sn;\n\t\tvar handler = handlers[type];\n\t\tif (handler) {\n\t\t\ttry {\n\t\t\t\thandler(message);\n\t\t\t} catch (e) {\n\t\t\t\tonError(type, sn, e);\n\t\t\t}\n\t\t}\n\t\t//for debug\n\t\t//postMessage({type: 'echo', originalType: type, sn: sn});\n\t});\n\n\tvar handlers = {\n\t\timportScripts: doImportScripts,\n\t\tnewTask: newTask,\n\t\tappend: processData,\n\t\tflush: processData,\n\t};\n\n\t// deflater/inflater tasks indexed by serial numbers\n\tvar tasks = {};\n\n\tfunction doImportScripts(msg) {\n\t\tif (msg.scripts && msg.scripts.length > 0)\n\t\t\timportScripts.apply(undefined, msg.scripts);\n\t\tpostMessage({type: 'importScripts'});\n\t}\n\n\tfunction newTask(msg) {\n\t\tvar CodecClass = global[msg.codecClass];\n\t\tvar sn = msg.sn;\n\t\tif (tasks[sn])\n\t\t\tthrow Error('duplicated sn');\n\t\ttasks[sn] =  {\n\t\t\tcodec: new CodecClass(msg.options),\n\t\t\tcrcInput: msg.crcType === 'input',\n\t\t\tcrcOutput: msg.crcType === 'output',\n\t\t\tcrc: new Crc32(),\n\t\t};\n\t\tpostMessage({type: 'newTask', sn: sn});\n\t}\n\n\t// performance may not be supported\n\tvar now = global.performance ? global.performance.now.bind(global.performance) : Date.now;\n\n\tfunction processData(msg) {\n\t\tvar sn = msg.sn, type = msg.type, input = msg.data;\n\t\tvar task = tasks[sn];\n\t\t// allow creating codec on first append\n\t\tif (!task && msg.codecClass) {\n\t\t\tnewTask(msg);\n\t\t\ttask = tasks[sn];\n\t\t}\n\t\tvar isAppend = type === 'append';\n\t\tvar start = now();\n\t\tvar output;\n\t\tif (isAppend) {\n\t\t\ttry {\n\t\t\t\toutput = task.codec.append(input, function onprogress(loaded) {\n\t\t\t\t\tpostMessage({type: 'progress', sn: sn, loaded: loaded});\n\t\t\t\t});\n\t\t\t} catch (e) {\n\t\t\t\tdelete tasks[sn];\n\t\t\t\tthrow e;\n\t\t\t}\n\t\t} else {\n\t\t\tdelete tasks[sn];\n\t\t\toutput = task.codec.flush();\n\t\t}\n\t\tvar codecTime = now() - start;\n\n\t\tstart = now();\n\t\tif (input && task.crcInput)\n\t\t\ttask.crc.append(input);\n\t\tif (output && task.crcOutput)\n\t\t\ttask.crc.append(output);\n\t\tvar crcTime = now() - start;\n\n\t\tvar rmsg = {type: type, sn: sn, codecTime: codecTime, crcTime: crcTime};\n\t\tvar transferables = [];\n\t\tif (output) {\n\t\t\trmsg.data = output;\n\t\t\ttransferables.push(output.buffer);\n\t\t}\n\t\tif (!isAppend && (task.crcInput || task.crcOutput))\n\t\t\trmsg.crc = task.crc.get();\n\t\t\n\t\t// posting a message with transferables will fail on IE10\n\t\ttry {\n\t\t\tpostMessage(rmsg, transferables);\n\t\t} catch(ex) {\n\t\t\tpostMessage(rmsg); // retry without transferables\n\t\t}\n\t}\n\n\tfunction onError(type, sn, e) {\n\t\tvar msg = {\n\t\t\ttype: type,\n\t\t\tsn: sn,\n\t\t\terror: formatError(e)\n\t\t};\n\t\tpostMessage(msg);\n\t}\n\n\tfunction formatError(e) {\n\t\treturn { message: e.message, stack: e.stack };\n\t}\n\n\t// Crc32 code copied from file zip.js\n\tfunction Crc32() {\n\t\tthis.crc = -1;\n\t}\n\tCrc32.prototype.append = function append(data) {\n\t\tvar crc = this.crc | 0, table = this.table;\n\t\tfor (var offset = 0, len = data.length | 0; offset < len; offset++)\n\t\t\tcrc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];\n\t\tthis.crc = crc;\n\t};\n\tCrc32.prototype.get = function get() {\n\t\treturn ~this.crc;\n\t};\n\tCrc32.prototype.table = (function() {\n\t\tvar i, j, t, table = []; // Uint32Array is actually slower than []\n\t\tfor (i = 0; i < 256; i++) {\n\t\t\tt = i;\n\t\t\tfor (j = 0; j < 8; j++)\n\t\t\t\tif (t & 1)\n\t\t\t\t\tt = (t >>> 1) ^ 0xEDB88320;\n\t\t\t\telse\n\t\t\t\t\tt = t >>> 1;\n\t\t\ttable[i] = t;\n\t\t}\n\t\treturn table;\n\t})();\n\n\t// \"no-op\" codec\n\tfunction NOOP() {}\n\tglobal.NOOP = NOOP;\n\tNOOP.prototype.append = function append(bytes, onprogress) {\n\t\treturn bytes;\n\t};\n\tNOOP.prototype.flush = function flush() {};\n})(this);\n");
zip.workerScripts = {
  deflater: [zWorker, createUrl("/*\n Copyright (c) 2013 Gildas Lormeau. All rights reserved.\n\n Redistribution and use in source and binary forms, with or without\n modification, are permitted provided that the following conditions are met:\n\n 1. Redistributions of source code must retain the above copyright notice,\n this list of conditions and the following disclaimer.\n\n 2. Redistributions in binary form must reproduce the above copyright \n notice, this list of conditions and the following disclaimer in \n the documentation and/or other materials provided with the distribution.\n\n 3. The names of the authors may not be used to endorse or promote products\n derived from this software without specific prior written permission.\n\n THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,\n INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND\n FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,\n INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,\n INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,\n OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF\n LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING\n NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,\n EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n/*\n * This program is based on JZlib 1.0.2 ymnk, JCraft,Inc.\n * JZlib is based on zlib-1.1.3, so all credit should go authors\n * Jean-loup Gailly(jloup@gzip.org) and Mark Adler(madler@alumni.caltech.edu)\n * and contributors of zlib.\n */\n\n(function(global) {\n\t\"use strict\";\n\n\t// Global\n\n\tvar MAX_BITS = 15;\n\tvar D_CODES = 30;\n\tvar BL_CODES = 19;\n\n\tvar LENGTH_CODES = 29;\n\tvar LITERALS = 256;\n\tvar L_CODES = (LITERALS + 1 + LENGTH_CODES);\n\tvar HEAP_SIZE = (2 * L_CODES + 1);\n\n\tvar END_BLOCK = 256;\n\n\t// Bit length codes must not exceed MAX_BL_BITS bits\n\tvar MAX_BL_BITS = 7;\n\n\t// repeat previous bit length 3-6 times (2 bits of repeat count)\n\tvar REP_3_6 = 16;\n\n\t// repeat a zero length 3-10 times (3 bits of repeat count)\n\tvar REPZ_3_10 = 17;\n\n\t// repeat a zero length 11-138 times (7 bits of repeat count)\n\tvar REPZ_11_138 = 18;\n\n\t// The lengths of the bit length codes are sent in order of decreasing\n\t// probability, to avoid transmitting the lengths for unused bit\n\t// length codes.\n\n\tvar Buf_size = 8 * 2;\n\n\t// JZlib version : \"1.0.2\"\n\tvar Z_DEFAULT_COMPRESSION = -1;\n\n\t// compression strategy\n\tvar Z_FILTERED = 1;\n\tvar Z_HUFFMAN_ONLY = 2;\n\tvar Z_DEFAULT_STRATEGY = 0;\n\n\tvar Z_NO_FLUSH = 0;\n\tvar Z_PARTIAL_FLUSH = 1;\n\tvar Z_FULL_FLUSH = 3;\n\tvar Z_FINISH = 4;\n\n\tvar Z_OK = 0;\n\tvar Z_STREAM_END = 1;\n\tvar Z_NEED_DICT = 2;\n\tvar Z_STREAM_ERROR = -2;\n\tvar Z_DATA_ERROR = -3;\n\tvar Z_BUF_ERROR = -5;\n\n\t// Tree\n\n\t// see definition of array dist_code below\n\tvar _dist_code = [ 0, 1, 2, 3, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,\n\t\t\t10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,\n\t\t\t12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,\n\t\t\t13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,\n\t\t\t14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,\n\t\t\t14, 14, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,\n\t\t\t15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 0, 16, 17, 18, 18, 19, 19,\n\t\t\t20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n\t\t\t24, 24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,\n\t\t\t26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27,\n\t\t\t27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,\n\t\t\t28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29,\n\t\t\t29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29,\n\t\t\t29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29 ];\n\n\tfunction Tree() {\n\t\tvar that = this;\n\n\t\t// dyn_tree; // the dynamic tree\n\t\t// max_code; // largest code with non zero frequency\n\t\t// stat_desc; // the corresponding static tree\n\n\t\t// Compute the optimal bit lengths for a tree and update the total bit\n\t\t// length\n\t\t// for the current block.\n\t\t// IN assertion: the fields freq and dad are set, heap[heap_max] and\n\t\t// above are the tree nodes sorted by increasing frequency.\n\t\t// OUT assertions: the field len is set to the optimal bit length, the\n\t\t// array bl_count contains the frequencies for each bit length.\n\t\t// The length opt_len is updated; static_len is also updated if stree is\n\t\t// not null.\n\t\tfunction gen_bitlen(s) {\n\t\t\tvar tree = that.dyn_tree;\n\t\t\tvar stree = that.stat_desc.static_tree;\n\t\t\tvar extra = that.stat_desc.extra_bits;\n\t\t\tvar base = that.stat_desc.extra_base;\n\t\t\tvar max_length = that.stat_desc.max_length;\n\t\t\tvar h; // heap index\n\t\t\tvar n, m; // iterate over the tree elements\n\t\t\tvar bits; // bit length\n\t\t\tvar xbits; // extra bits\n\t\t\tvar f; // frequency\n\t\t\tvar overflow = 0; // number of elements with bit length too large\n\n\t\t\tfor (bits = 0; bits <= MAX_BITS; bits++)\n\t\t\t\ts.bl_count[bits] = 0;\n\n\t\t\t// In a first pass, compute the optimal bit lengths (which may\n\t\t\t// overflow in the case of the bit length tree).\n\t\t\ttree[s.heap[s.heap_max] * 2 + 1] = 0; // root of the heap\n\n\t\t\tfor (h = s.heap_max + 1; h < HEAP_SIZE; h++) {\n\t\t\t\tn = s.heap[h];\n\t\t\t\tbits = tree[tree[n * 2 + 1] * 2 + 1] + 1;\n\t\t\t\tif (bits > max_length) {\n\t\t\t\t\tbits = max_length;\n\t\t\t\t\toverflow++;\n\t\t\t\t}\n\t\t\t\ttree[n * 2 + 1] = bits;\n\t\t\t\t// We overwrite tree[n*2+1] which is no longer needed\n\n\t\t\t\tif (n > that.max_code)\n\t\t\t\t\tcontinue; // not a leaf node\n\n\t\t\t\ts.bl_count[bits]++;\n\t\t\t\txbits = 0;\n\t\t\t\tif (n >= base)\n\t\t\t\t\txbits = extra[n - base];\n\t\t\t\tf = tree[n * 2];\n\t\t\t\ts.opt_len += f * (bits + xbits);\n\t\t\t\tif (stree)\n\t\t\t\t\ts.static_len += f * (stree[n * 2 + 1] + xbits);\n\t\t\t}\n\t\t\tif (overflow === 0)\n\t\t\t\treturn;\n\n\t\t\t// This happens for example on obj2 and pic of the Calgary corpus\n\t\t\t// Find the first bit length which could increase:\n\t\t\tdo {\n\t\t\t\tbits = max_length - 1;\n\t\t\t\twhile (s.bl_count[bits] === 0)\n\t\t\t\t\tbits--;\n\t\t\t\ts.bl_count[bits]--; // move one leaf down the tree\n\t\t\t\ts.bl_count[bits + 1] += 2; // move one overflow item as its brother\n\t\t\t\ts.bl_count[max_length]--;\n\t\t\t\t// The brother of the overflow item also moves one step up,\n\t\t\t\t// but this does not affect bl_count[max_length]\n\t\t\t\toverflow -= 2;\n\t\t\t} while (overflow > 0);\n\n\t\t\tfor (bits = max_length; bits !== 0; bits--) {\n\t\t\t\tn = s.bl_count[bits];\n\t\t\t\twhile (n !== 0) {\n\t\t\t\t\tm = s.heap[--h];\n\t\t\t\t\tif (m > that.max_code)\n\t\t\t\t\t\tcontinue;\n\t\t\t\t\tif (tree[m * 2 + 1] != bits) {\n\t\t\t\t\t\ts.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];\n\t\t\t\t\t\ttree[m * 2 + 1] = bits;\n\t\t\t\t\t}\n\t\t\t\t\tn--;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Reverse the first len bits of a code, using straightforward code (a\n\t\t// faster\n\t\t// method would use a table)\n\t\t// IN assertion: 1 <= len <= 15\n\t\tfunction bi_reverse(code, // the value to invert\n\t\tlen // its bit length\n\t\t) {\n\t\t\tvar res = 0;\n\t\t\tdo {\n\t\t\t\tres |= code & 1;\n\t\t\t\tcode >>>= 1;\n\t\t\t\tres <<= 1;\n\t\t\t} while (--len > 0);\n\t\t\treturn res >>> 1;\n\t\t}\n\n\t\t// Generate the codes for a given tree and bit counts (which need not be\n\t\t// optimal).\n\t\t// IN assertion: the array bl_count contains the bit length statistics for\n\t\t// the given tree and the field len is set for all tree elements.\n\t\t// OUT assertion: the field code is set for all tree elements of non\n\t\t// zero code length.\n\t\tfunction gen_codes(tree, // the tree to decorate\n\t\tmax_code, // largest code with non zero frequency\n\t\tbl_count // number of codes at each bit length\n\t\t) {\n\t\t\tvar next_code = []; // next code value for each\n\t\t\t// bit length\n\t\t\tvar code = 0; // running code value\n\t\t\tvar bits; // bit index\n\t\t\tvar n; // code index\n\t\t\tvar len;\n\n\t\t\t// The distribution counts are first used to generate the code values\n\t\t\t// without bit reversal.\n\t\t\tfor (bits = 1; bits <= MAX_BITS; bits++) {\n\t\t\t\tnext_code[bits] = code = ((code + bl_count[bits - 1]) << 1);\n\t\t\t}\n\n\t\t\t// Check that the bit counts in bl_count are consistent. The last code\n\t\t\t// must be all ones.\n\t\t\t// Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,\n\t\t\t// \"inconsistent bit counts\");\n\t\t\t// Tracev((stderr,\"\\ngen_codes: max_code %d \", max_code));\n\n\t\t\tfor (n = 0; n <= max_code; n++) {\n\t\t\t\tlen = tree[n * 2 + 1];\n\t\t\t\tif (len === 0)\n\t\t\t\t\tcontinue;\n\t\t\t\t// Now reverse the bits\n\t\t\t\ttree[n * 2] = bi_reverse(next_code[len]++, len);\n\t\t\t}\n\t\t}\n\n\t\t// Construct one Huffman tree and assigns the code bit strings and lengths.\n\t\t// Update the total bit length for the current block.\n\t\t// IN assertion: the field freq is set for all tree elements.\n\t\t// OUT assertions: the fields len and code are set to the optimal bit length\n\t\t// and corresponding code. The length opt_len is updated; static_len is\n\t\t// also updated if stree is not null. The field max_code is set.\n\t\tthat.build_tree = function(s) {\n\t\t\tvar tree = that.dyn_tree;\n\t\t\tvar stree = that.stat_desc.static_tree;\n\t\t\tvar elems = that.stat_desc.elems;\n\t\t\tvar n, m; // iterate over heap elements\n\t\t\tvar max_code = -1; // largest code with non zero frequency\n\t\t\tvar node; // new node being created\n\n\t\t\t// Construct the initial heap, with least frequent element in\n\t\t\t// heap[1]. The sons of heap[n] are heap[2*n] and heap[2*n+1].\n\t\t\t// heap[0] is not used.\n\t\t\ts.heap_len = 0;\n\t\t\ts.heap_max = HEAP_SIZE;\n\n\t\t\tfor (n = 0; n < elems; n++) {\n\t\t\t\tif (tree[n * 2] !== 0) {\n\t\t\t\t\ts.heap[++s.heap_len] = max_code = n;\n\t\t\t\t\ts.depth[n] = 0;\n\t\t\t\t} else {\n\t\t\t\t\ttree[n * 2 + 1] = 0;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\t// The pkzip format requires that at least one distance code exists,\n\t\t\t// and that at least one bit should be sent even if there is only one\n\t\t\t// possible code. So to avoid special checks later on we force at least\n\t\t\t// two codes of non zero frequency.\n\t\t\twhile (s.heap_len < 2) {\n\t\t\t\tnode = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;\n\t\t\t\ttree[node * 2] = 1;\n\t\t\t\ts.depth[node] = 0;\n\t\t\t\ts.opt_len--;\n\t\t\t\tif (stree)\n\t\t\t\t\ts.static_len -= stree[node * 2 + 1];\n\t\t\t\t// node is 0 or 1 so it does not have extra bits\n\t\t\t}\n\t\t\tthat.max_code = max_code;\n\n\t\t\t// The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,\n\t\t\t// establish sub-heaps of increasing lengths:\n\n\t\t\tfor (n = Math.floor(s.heap_len / 2); n >= 1; n--)\n\t\t\t\ts.pqdownheap(tree, n);\n\n\t\t\t// Construct the Huffman tree by repeatedly combining the least two\n\t\t\t// frequent nodes.\n\n\t\t\tnode = elems; // next internal node of the tree\n\t\t\tdo {\n\t\t\t\t// n = node of least frequency\n\t\t\t\tn = s.heap[1];\n\t\t\t\ts.heap[1] = s.heap[s.heap_len--];\n\t\t\t\ts.pqdownheap(tree, 1);\n\t\t\t\tm = s.heap[1]; // m = node of next least frequency\n\n\t\t\t\ts.heap[--s.heap_max] = n; // keep the nodes sorted by frequency\n\t\t\t\ts.heap[--s.heap_max] = m;\n\n\t\t\t\t// Create a new node father of n and m\n\t\t\t\ttree[node * 2] = (tree[n * 2] + tree[m * 2]);\n\t\t\t\ts.depth[node] = Math.max(s.depth[n], s.depth[m]) + 1;\n\t\t\t\ttree[n * 2 + 1] = tree[m * 2 + 1] = node;\n\n\t\t\t\t// and insert the new node in the heap\n\t\t\t\ts.heap[1] = node++;\n\t\t\t\ts.pqdownheap(tree, 1);\n\t\t\t} while (s.heap_len >= 2);\n\n\t\t\ts.heap[--s.heap_max] = s.heap[1];\n\n\t\t\t// At this point, the fields freq and dad are set. We can now\n\t\t\t// generate the bit lengths.\n\n\t\t\tgen_bitlen(s);\n\n\t\t\t// The field len is now set, we can generate the bit codes\n\t\t\tgen_codes(tree, that.max_code, s.bl_count);\n\t\t};\n\n\t}\n\n\tTree._length_code = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16,\n\t\t\t16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20,\n\t\t\t20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,\n\t\t\t22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n\t\t\t24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25,\n\t\t\t25, 25, 25, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,\n\t\t\t26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28 ];\n\n\tTree.base_length = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 0 ];\n\n\tTree.base_dist = [ 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096, 6144, 8192, 12288, 16384,\n\t\t\t24576 ];\n\n\t// Mapping from a distance to a distance code. dist is the distance - 1 and\n\t// must not have side effects. _dist_code[256] and _dist_code[257] are never\n\t// used.\n\tTree.d_code = function(dist) {\n\t\treturn ((dist) < 256 ? _dist_code[dist] : _dist_code[256 + ((dist) >>> 7)]);\n\t};\n\n\t// extra bits for each length code\n\tTree.extra_lbits = [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0 ];\n\n\t// extra bits for each distance code\n\tTree.extra_dbits = [ 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 ];\n\n\t// extra bits for each bit length code\n\tTree.extra_blbits = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7 ];\n\n\tTree.bl_order = [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];\n\n\t// StaticTree\n\n\tfunction StaticTree(static_tree, extra_bits, extra_base, elems, max_length) {\n\t\tvar that = this;\n\t\tthat.static_tree = static_tree;\n\t\tthat.extra_bits = extra_bits;\n\t\tthat.extra_base = extra_base;\n\t\tthat.elems = elems;\n\t\tthat.max_length = max_length;\n\t}\n\n\tStaticTree.static_ltree = [ 12, 8, 140, 8, 76, 8, 204, 8, 44, 8, 172, 8, 108, 8, 236, 8, 28, 8, 156, 8, 92, 8, 220, 8, 60, 8, 188, 8, 124, 8, 252, 8, 2, 8,\n\t\t\t130, 8, 66, 8, 194, 8, 34, 8, 162, 8, 98, 8, 226, 8, 18, 8, 146, 8, 82, 8, 210, 8, 50, 8, 178, 8, 114, 8, 242, 8, 10, 8, 138, 8, 74, 8, 202, 8, 42,\n\t\t\t8, 170, 8, 106, 8, 234, 8, 26, 8, 154, 8, 90, 8, 218, 8, 58, 8, 186, 8, 122, 8, 250, 8, 6, 8, 134, 8, 70, 8, 198, 8, 38, 8, 166, 8, 102, 8, 230, 8,\n\t\t\t22, 8, 150, 8, 86, 8, 214, 8, 54, 8, 182, 8, 118, 8, 246, 8, 14, 8, 142, 8, 78, 8, 206, 8, 46, 8, 174, 8, 110, 8, 238, 8, 30, 8, 158, 8, 94, 8,\n\t\t\t222, 8, 62, 8, 190, 8, 126, 8, 254, 8, 1, 8, 129, 8, 65, 8, 193, 8, 33, 8, 161, 8, 97, 8, 225, 8, 17, 8, 145, 8, 81, 8, 209, 8, 49, 8, 177, 8, 113,\n\t\t\t8, 241, 8, 9, 8, 137, 8, 73, 8, 201, 8, 41, 8, 169, 8, 105, 8, 233, 8, 25, 8, 153, 8, 89, 8, 217, 8, 57, 8, 185, 8, 121, 8, 249, 8, 5, 8, 133, 8,\n\t\t\t69, 8, 197, 8, 37, 8, 165, 8, 101, 8, 229, 8, 21, 8, 149, 8, 85, 8, 213, 8, 53, 8, 181, 8, 117, 8, 245, 8, 13, 8, 141, 8, 77, 8, 205, 8, 45, 8,\n\t\t\t173, 8, 109, 8, 237, 8, 29, 8, 157, 8, 93, 8, 221, 8, 61, 8, 189, 8, 125, 8, 253, 8, 19, 9, 275, 9, 147, 9, 403, 9, 83, 9, 339, 9, 211, 9, 467, 9,\n\t\t\t51, 9, 307, 9, 179, 9, 435, 9, 115, 9, 371, 9, 243, 9, 499, 9, 11, 9, 267, 9, 139, 9, 395, 9, 75, 9, 331, 9, 203, 9, 459, 9, 43, 9, 299, 9, 171, 9,\n\t\t\t427, 9, 107, 9, 363, 9, 235, 9, 491, 9, 27, 9, 283, 9, 155, 9, 411, 9, 91, 9, 347, 9, 219, 9, 475, 9, 59, 9, 315, 9, 187, 9, 443, 9, 123, 9, 379,\n\t\t\t9, 251, 9, 507, 9, 7, 9, 263, 9, 135, 9, 391, 9, 71, 9, 327, 9, 199, 9, 455, 9, 39, 9, 295, 9, 167, 9, 423, 9, 103, 9, 359, 9, 231, 9, 487, 9, 23,\n\t\t\t9, 279, 9, 151, 9, 407, 9, 87, 9, 343, 9, 215, 9, 471, 9, 55, 9, 311, 9, 183, 9, 439, 9, 119, 9, 375, 9, 247, 9, 503, 9, 15, 9, 271, 9, 143, 9,\n\t\t\t399, 9, 79, 9, 335, 9, 207, 9, 463, 9, 47, 9, 303, 9, 175, 9, 431, 9, 111, 9, 367, 9, 239, 9, 495, 9, 31, 9, 287, 9, 159, 9, 415, 9, 95, 9, 351, 9,\n\t\t\t223, 9, 479, 9, 63, 9, 319, 9, 191, 9, 447, 9, 127, 9, 383, 9, 255, 9, 511, 9, 0, 7, 64, 7, 32, 7, 96, 7, 16, 7, 80, 7, 48, 7, 112, 7, 8, 7, 72, 7,\n\t\t\t40, 7, 104, 7, 24, 7, 88, 7, 56, 7, 120, 7, 4, 7, 68, 7, 36, 7, 100, 7, 20, 7, 84, 7, 52, 7, 116, 7, 3, 8, 131, 8, 67, 8, 195, 8, 35, 8, 163, 8,\n\t\t\t99, 8, 227, 8 ];\n\n\tStaticTree.static_dtree = [ 0, 5, 16, 5, 8, 5, 24, 5, 4, 5, 20, 5, 12, 5, 28, 5, 2, 5, 18, 5, 10, 5, 26, 5, 6, 5, 22, 5, 14, 5, 30, 5, 1, 5, 17, 5, 9, 5,\n\t\t\t25, 5, 5, 5, 21, 5, 13, 5, 29, 5, 3, 5, 19, 5, 11, 5, 27, 5, 7, 5, 23, 5 ];\n\n\tStaticTree.static_l_desc = new StaticTree(StaticTree.static_ltree, Tree.extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);\n\n\tStaticTree.static_d_desc = new StaticTree(StaticTree.static_dtree, Tree.extra_dbits, 0, D_CODES, MAX_BITS);\n\n\tStaticTree.static_bl_desc = new StaticTree(null, Tree.extra_blbits, 0, BL_CODES, MAX_BL_BITS);\n\n\t// Deflate\n\n\tvar MAX_MEM_LEVEL = 9;\n\tvar DEF_MEM_LEVEL = 8;\n\n\tfunction Config(good_length, max_lazy, nice_length, max_chain, func) {\n\t\tvar that = this;\n\t\tthat.good_length = good_length;\n\t\tthat.max_lazy = max_lazy;\n\t\tthat.nice_length = nice_length;\n\t\tthat.max_chain = max_chain;\n\t\tthat.func = func;\n\t}\n\n\tvar STORED = 0;\n\tvar FAST = 1;\n\tvar SLOW = 2;\n\tvar config_table = [ new Config(0, 0, 0, 0, STORED), new Config(4, 4, 8, 4, FAST), new Config(4, 5, 16, 8, FAST), new Config(4, 6, 32, 32, FAST),\n\t\t\tnew Config(4, 4, 16, 16, SLOW), new Config(8, 16, 32, 32, SLOW), new Config(8, 16, 128, 128, SLOW), new Config(8, 32, 128, 256, SLOW),\n\t\t\tnew Config(32, 128, 258, 1024, SLOW), new Config(32, 258, 258, 4096, SLOW) ];\n\n\tvar z_errmsg = [ \"need dictionary\", // Z_NEED_DICT\n\t// 2\n\t\"stream end\", // Z_STREAM_END 1\n\t\"\", // Z_OK 0\n\t\"\", // Z_ERRNO (-1)\n\t\"stream error\", // Z_STREAM_ERROR (-2)\n\t\"data error\", // Z_DATA_ERROR (-3)\n\t\"\", // Z_MEM_ERROR (-4)\n\t\"buffer error\", // Z_BUF_ERROR (-5)\n\t\"\",// Z_VERSION_ERROR (-6)\n\t\"\" ];\n\n\t// block not completed, need more input or more output\n\tvar NeedMore = 0;\n\n\t// block flush performed\n\tvar BlockDone = 1;\n\n\t// finish started, need only more output at next deflate\n\tvar FinishStarted = 2;\n\n\t// finish done, accept no more input or output\n\tvar FinishDone = 3;\n\n\t// preset dictionary flag in zlib header\n\tvar PRESET_DICT = 0x20;\n\n\tvar INIT_STATE = 42;\n\tvar BUSY_STATE = 113;\n\tvar FINISH_STATE = 666;\n\n\t// The deflate compression method\n\tvar Z_DEFLATED = 8;\n\n\tvar STORED_BLOCK = 0;\n\tvar STATIC_TREES = 1;\n\tvar DYN_TREES = 2;\n\n\tvar MIN_MATCH = 3;\n\tvar MAX_MATCH = 258;\n\tvar MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);\n\n\tfunction smaller(tree, n, m, depth) {\n\t\tvar tn2 = tree[n * 2];\n\t\tvar tm2 = tree[m * 2];\n\t\treturn (tn2 < tm2 || (tn2 == tm2 && depth[n] <= depth[m]));\n\t}\n\n\tfunction Deflate() {\n\n\t\tvar that = this;\n\t\tvar strm; // pointer back to this zlib stream\n\t\tvar status; // as the name implies\n\t\t// pending_buf; // output still pending\n\t\tvar pending_buf_size; // size of pending_buf\n\t\t// pending_out; // next pending byte to output to the stream\n\t\t// pending; // nb of bytes in the pending buffer\n\t\tvar method; // STORED (for zip only) or DEFLATED\n\t\tvar last_flush; // value of flush param for previous deflate call\n\n\t\tvar w_size; // LZ77 window size (32K by default)\n\t\tvar w_bits; // log2(w_size) (8..16)\n\t\tvar w_mask; // w_size - 1\n\n\t\tvar window;\n\t\t// Sliding window. Input bytes are read into the second half of the window,\n\t\t// and move to the first half later to keep a dictionary of at least wSize\n\t\t// bytes. With this organization, matches are limited to a distance of\n\t\t// wSize-MAX_MATCH bytes, but this ensures that IO is always\n\t\t// performed with a length multiple of the block size. Also, it limits\n\t\t// the window size to 64K, which is quite useful on MSDOS.\n\t\t// To do: use the user input buffer as sliding window.\n\n\t\tvar window_size;\n\t\t// Actual size of window: 2*wSize, except when the user input buffer\n\t\t// is directly used as sliding window.\n\n\t\tvar prev;\n\t\t// Link to older string with same hash index. To limit the size of this\n\t\t// array to 64K, this link is maintained only for the last 32K strings.\n\t\t// An index in this array is thus a window index modulo 32K.\n\n\t\tvar head; // Heads of the hash chains or NIL.\n\n\t\tvar ins_h; // hash index of string to be inserted\n\t\tvar hash_size; // number of elements in hash table\n\t\tvar hash_bits; // log2(hash_size)\n\t\tvar hash_mask; // hash_size-1\n\n\t\t// Number of bits by which ins_h must be shifted at each input\n\t\t// step. It must be such that after MIN_MATCH steps, the oldest\n\t\t// byte no longer takes part in the hash key, that is:\n\t\t// hash_shift * MIN_MATCH >= hash_bits\n\t\tvar hash_shift;\n\n\t\t// Window position at the beginning of the current output block. Gets\n\t\t// negative when the window is moved backwards.\n\n\t\tvar block_start;\n\n\t\tvar match_length; // length of best match\n\t\tvar prev_match; // previous match\n\t\tvar match_available; // set if previous match exists\n\t\tvar strstart; // start of string to insert\n\t\tvar match_start; // start of matching string\n\t\tvar lookahead; // number of valid bytes ahead in window\n\n\t\t// Length of the best match at previous step. Matches not greater than this\n\t\t// are discarded. This is used in the lazy match evaluation.\n\t\tvar prev_length;\n\n\t\t// To speed up deflation, hash chains are never searched beyond this\n\t\t// length. A higher limit improves compression ratio but degrades the speed.\n\t\tvar max_chain_length;\n\n\t\t// Attempt to find a better match only when the current match is strictly\n\t\t// smaller than this value. This mechanism is used only for compression\n\t\t// levels >= 4.\n\t\tvar max_lazy_match;\n\n\t\t// Insert new strings in the hash table only if the match length is not\n\t\t// greater than this length. This saves time but degrades compression.\n\t\t// max_insert_length is used only for compression levels <= 3.\n\n\t\tvar level; // compression level (1..9)\n\t\tvar strategy; // favor or force Huffman coding\n\n\t\t// Use a faster search when the previous match is longer than this\n\t\tvar good_match;\n\n\t\t// Stop searching when current match exceeds this\n\t\tvar nice_match;\n\n\t\tvar dyn_ltree; // literal and length tree\n\t\tvar dyn_dtree; // distance tree\n\t\tvar bl_tree; // Huffman tree for bit lengths\n\n\t\tvar l_desc = new Tree(); // desc for literal tree\n\t\tvar d_desc = new Tree(); // desc for distance tree\n\t\tvar bl_desc = new Tree(); // desc for bit length tree\n\n\t\t// that.heap_len; // number of elements in the heap\n\t\t// that.heap_max; // element of largest frequency\n\t\t// The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.\n\t\t// The same heap array is used to build all trees.\n\n\t\t// Depth of each subtree used as tie breaker for trees of equal frequency\n\t\tthat.depth = [];\n\n\t\tvar l_buf; // index for literals or lengths */\n\n\t\t// Size of match buffer for literals/lengths. There are 4 reasons for\n\t\t// limiting lit_bufsize to 64K:\n\t\t// - frequencies can be kept in 16 bit counters\n\t\t// - if compression is not successful for the first block, all input\n\t\t// data is still in the window so we can still emit a stored block even\n\t\t// when input comes from standard input. (This can also be done for\n\t\t// all blocks if lit_bufsize is not greater than 32K.)\n\t\t// - if compression is not successful for a file smaller than 64K, we can\n\t\t// even emit a stored file instead of a stored block (saving 5 bytes).\n\t\t// This is applicable only for zip (not gzip or zlib).\n\t\t// - creating new Huffman trees less frequently may not provide fast\n\t\t// adaptation to changes in the input data statistics. (Take for\n\t\t// example a binary file with poorly compressible code followed by\n\t\t// a highly compressible string table.) Smaller buffer sizes give\n\t\t// fast adaptation but have of course the overhead of transmitting\n\t\t// trees more frequently.\n\t\t// - I can't count above 4\n\t\tvar lit_bufsize;\n\n\t\tvar last_lit; // running index in l_buf\n\n\t\t// Buffer for distances. To simplify the code, d_buf and l_buf have\n\t\t// the same number of elements. To use different lengths, an extra flag\n\t\t// array would be necessary.\n\n\t\tvar d_buf; // index of pendig_buf\n\n\t\t// that.opt_len; // bit length of current block with optimal trees\n\t\t// that.static_len; // bit length of current block with static trees\n\t\tvar matches; // number of string matches in current block\n\t\tvar last_eob_len; // bit length of EOB code for last block\n\n\t\t// Output buffer. bits are inserted starting at the bottom (least\n\t\t// significant bits).\n\t\tvar bi_buf;\n\n\t\t// Number of valid bits in bi_buf. All bits above the last valid bit\n\t\t// are always zero.\n\t\tvar bi_valid;\n\n\t\t// number of codes at each bit length for an optimal tree\n\t\tthat.bl_count = [];\n\n\t\t// heap used to build the Huffman trees\n\t\tthat.heap = [];\n\n\t\tdyn_ltree = [];\n\t\tdyn_dtree = [];\n\t\tbl_tree = [];\n\n\t\tfunction lm_init() {\n\t\t\tvar i;\n\t\t\twindow_size = 2 * w_size;\n\n\t\t\thead[hash_size - 1] = 0;\n\t\t\tfor (i = 0; i < hash_size - 1; i++) {\n\t\t\t\thead[i] = 0;\n\t\t\t}\n\n\t\t\t// Set the default configuration parameters:\n\t\t\tmax_lazy_match = config_table[level].max_lazy;\n\t\t\tgood_match = config_table[level].good_length;\n\t\t\tnice_match = config_table[level].nice_length;\n\t\t\tmax_chain_length = config_table[level].max_chain;\n\n\t\t\tstrstart = 0;\n\t\t\tblock_start = 0;\n\t\t\tlookahead = 0;\n\t\t\tmatch_length = prev_length = MIN_MATCH - 1;\n\t\t\tmatch_available = 0;\n\t\t\tins_h = 0;\n\t\t}\n\n\t\tfunction init_block() {\n\t\t\tvar i;\n\t\t\t// Initialize the trees.\n\t\t\tfor (i = 0; i < L_CODES; i++)\n\t\t\t\tdyn_ltree[i * 2] = 0;\n\t\t\tfor (i = 0; i < D_CODES; i++)\n\t\t\t\tdyn_dtree[i * 2] = 0;\n\t\t\tfor (i = 0; i < BL_CODES; i++)\n\t\t\t\tbl_tree[i * 2] = 0;\n\n\t\t\tdyn_ltree[END_BLOCK * 2] = 1;\n\t\t\tthat.opt_len = that.static_len = 0;\n\t\t\tlast_lit = matches = 0;\n\t\t}\n\n\t\t// Initialize the tree data structures for a new zlib stream.\n\t\tfunction tr_init() {\n\n\t\t\tl_desc.dyn_tree = dyn_ltree;\n\t\t\tl_desc.stat_desc = StaticTree.static_l_desc;\n\n\t\t\td_desc.dyn_tree = dyn_dtree;\n\t\t\td_desc.stat_desc = StaticTree.static_d_desc;\n\n\t\t\tbl_desc.dyn_tree = bl_tree;\n\t\t\tbl_desc.stat_desc = StaticTree.static_bl_desc;\n\n\t\t\tbi_buf = 0;\n\t\t\tbi_valid = 0;\n\t\t\tlast_eob_len = 8; // enough lookahead for inflate\n\n\t\t\t// Initialize the first block of the first file:\n\t\t\tinit_block();\n\t\t}\n\n\t\t// Restore the heap property by moving down the tree starting at node k,\n\t\t// exchanging a node with the smallest of its two sons if necessary,\n\t\t// stopping\n\t\t// when the heap property is re-established (each father smaller than its\n\t\t// two sons).\n\t\tthat.pqdownheap = function(tree, // the tree to restore\n\t\tk // node to move down\n\t\t) {\n\t\t\tvar heap = that.heap;\n\t\t\tvar v = heap[k];\n\t\t\tvar j = k << 1; // left son of k\n\t\t\twhile (j <= that.heap_len) {\n\t\t\t\t// Set j to the smallest of the two sons:\n\t\t\t\tif (j < that.heap_len && smaller(tree, heap[j + 1], heap[j], that.depth)) {\n\t\t\t\t\tj++;\n\t\t\t\t}\n\t\t\t\t// Exit if v is smaller than both sons\n\t\t\t\tif (smaller(tree, v, heap[j], that.depth))\n\t\t\t\t\tbreak;\n\n\t\t\t\t// Exchange v with the smallest son\n\t\t\t\theap[k] = heap[j];\n\t\t\t\tk = j;\n\t\t\t\t// And continue down the tree, setting j to the left son of k\n\t\t\t\tj <<= 1;\n\t\t\t}\n\t\t\theap[k] = v;\n\t\t};\n\n\t\t// Scan a literal or distance tree to determine the frequencies of the codes\n\t\t// in the bit length tree.\n\t\tfunction scan_tree(tree,// the tree to be scanned\n\t\tmax_code // and its largest code of non zero frequency\n\t\t) {\n\t\t\tvar n; // iterates over all tree elements\n\t\t\tvar prevlen = -1; // last emitted length\n\t\t\tvar curlen; // length of current code\n\t\t\tvar nextlen = tree[0 * 2 + 1]; // length of next code\n\t\t\tvar count = 0; // repeat count of the current code\n\t\t\tvar max_count = 7; // max repeat count\n\t\t\tvar min_count = 4; // min repeat count\n\n\t\t\tif (nextlen === 0) {\n\t\t\t\tmax_count = 138;\n\t\t\t\tmin_count = 3;\n\t\t\t}\n\t\t\ttree[(max_code + 1) * 2 + 1] = 0xffff; // guard\n\n\t\t\tfor (n = 0; n <= max_code; n++) {\n\t\t\t\tcurlen = nextlen;\n\t\t\t\tnextlen = tree[(n + 1) * 2 + 1];\n\t\t\t\tif (++count < max_count && curlen == nextlen) {\n\t\t\t\t\tcontinue;\n\t\t\t\t} else if (count < min_count) {\n\t\t\t\t\tbl_tree[curlen * 2] += count;\n\t\t\t\t} else if (curlen !== 0) {\n\t\t\t\t\tif (curlen != prevlen)\n\t\t\t\t\t\tbl_tree[curlen * 2]++;\n\t\t\t\t\tbl_tree[REP_3_6 * 2]++;\n\t\t\t\t} else if (count <= 10) {\n\t\t\t\t\tbl_tree[REPZ_3_10 * 2]++;\n\t\t\t\t} else {\n\t\t\t\t\tbl_tree[REPZ_11_138 * 2]++;\n\t\t\t\t}\n\t\t\t\tcount = 0;\n\t\t\t\tprevlen = curlen;\n\t\t\t\tif (nextlen === 0) {\n\t\t\t\t\tmax_count = 138;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else if (curlen == nextlen) {\n\t\t\t\t\tmax_count = 6;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else {\n\t\t\t\t\tmax_count = 7;\n\t\t\t\t\tmin_count = 4;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Construct the Huffman tree for the bit lengths and return the index in\n\t\t// bl_order of the last bit length code to send.\n\t\tfunction build_bl_tree() {\n\t\t\tvar max_blindex; // index of last bit length code of non zero freq\n\n\t\t\t// Determine the bit length frequencies for literal and distance trees\n\t\t\tscan_tree(dyn_ltree, l_desc.max_code);\n\t\t\tscan_tree(dyn_dtree, d_desc.max_code);\n\n\t\t\t// Build the bit length tree:\n\t\t\tbl_desc.build_tree(that);\n\t\t\t// opt_len now includes the length of the tree representations, except\n\t\t\t// the lengths of the bit lengths codes and the 5+5+4 bits for the\n\t\t\t// counts.\n\n\t\t\t// Determine the number of bit length codes to send. The pkzip format\n\t\t\t// requires that at least 4 bit length codes be sent. (appnote.txt says\n\t\t\t// 3 but the actual value used is 4.)\n\t\t\tfor (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {\n\t\t\t\tif (bl_tree[Tree.bl_order[max_blindex] * 2 + 1] !== 0)\n\t\t\t\t\tbreak;\n\t\t\t}\n\t\t\t// Update opt_len to include the bit length tree and counts\n\t\t\tthat.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;\n\n\t\t\treturn max_blindex;\n\t\t}\n\n\t\t// Output a byte on the stream.\n\t\t// IN assertion: there is enough room in pending_buf.\n\t\tfunction put_byte(p) {\n\t\t\tthat.pending_buf[that.pending++] = p;\n\t\t}\n\n\t\tfunction put_short(w) {\n\t\t\tput_byte(w & 0xff);\n\t\t\tput_byte((w >>> 8) & 0xff);\n\t\t}\n\n\t\tfunction putShortMSB(b) {\n\t\t\tput_byte((b >> 8) & 0xff);\n\t\t\tput_byte((b & 0xff) & 0xff);\n\t\t}\n\n\t\tfunction send_bits(value, length) {\n\t\t\tvar val, len = length;\n\t\t\tif (bi_valid > Buf_size - len) {\n\t\t\t\tval = value;\n\t\t\t\t// bi_buf |= (val << bi_valid);\n\t\t\t\tbi_buf |= ((val << bi_valid) & 0xffff);\n\t\t\t\tput_short(bi_buf);\n\t\t\t\tbi_buf = val >>> (Buf_size - bi_valid);\n\t\t\t\tbi_valid += len - Buf_size;\n\t\t\t} else {\n\t\t\t\t// bi_buf |= (value) << bi_valid;\n\t\t\t\tbi_buf |= (((value) << bi_valid) & 0xffff);\n\t\t\t\tbi_valid += len;\n\t\t\t}\n\t\t}\n\n\t\tfunction send_code(c, tree) {\n\t\t\tvar c2 = c * 2;\n\t\t\tsend_bits(tree[c2] & 0xffff, tree[c2 + 1] & 0xffff);\n\t\t}\n\n\t\t// Send a literal or distance tree in compressed form, using the codes in\n\t\t// bl_tree.\n\t\tfunction send_tree(tree,// the tree to be sent\n\t\tmax_code // and its largest code of non zero frequency\n\t\t) {\n\t\t\tvar n; // iterates over all tree elements\n\t\t\tvar prevlen = -1; // last emitted length\n\t\t\tvar curlen; // length of current code\n\t\t\tvar nextlen = tree[0 * 2 + 1]; // length of next code\n\t\t\tvar count = 0; // repeat count of the current code\n\t\t\tvar max_count = 7; // max repeat count\n\t\t\tvar min_count = 4; // min repeat count\n\n\t\t\tif (nextlen === 0) {\n\t\t\t\tmax_count = 138;\n\t\t\t\tmin_count = 3;\n\t\t\t}\n\n\t\t\tfor (n = 0; n <= max_code; n++) {\n\t\t\t\tcurlen = nextlen;\n\t\t\t\tnextlen = tree[(n + 1) * 2 + 1];\n\t\t\t\tif (++count < max_count && curlen == nextlen) {\n\t\t\t\t\tcontinue;\n\t\t\t\t} else if (count < min_count) {\n\t\t\t\t\tdo {\n\t\t\t\t\t\tsend_code(curlen, bl_tree);\n\t\t\t\t\t} while (--count !== 0);\n\t\t\t\t} else if (curlen !== 0) {\n\t\t\t\t\tif (curlen != prevlen) {\n\t\t\t\t\t\tsend_code(curlen, bl_tree);\n\t\t\t\t\t\tcount--;\n\t\t\t\t\t}\n\t\t\t\t\tsend_code(REP_3_6, bl_tree);\n\t\t\t\t\tsend_bits(count - 3, 2);\n\t\t\t\t} else if (count <= 10) {\n\t\t\t\t\tsend_code(REPZ_3_10, bl_tree);\n\t\t\t\t\tsend_bits(count - 3, 3);\n\t\t\t\t} else {\n\t\t\t\t\tsend_code(REPZ_11_138, bl_tree);\n\t\t\t\t\tsend_bits(count - 11, 7);\n\t\t\t\t}\n\t\t\t\tcount = 0;\n\t\t\t\tprevlen = curlen;\n\t\t\t\tif (nextlen === 0) {\n\t\t\t\t\tmax_count = 138;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else if (curlen == nextlen) {\n\t\t\t\t\tmax_count = 6;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else {\n\t\t\t\t\tmax_count = 7;\n\t\t\t\t\tmin_count = 4;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Send the header for a block using dynamic Huffman trees: the counts, the\n\t\t// lengths of the bit length codes, the literal tree and the distance tree.\n\t\t// IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.\n\t\tfunction send_all_trees(lcodes, dcodes, blcodes) {\n\t\t\tvar rank; // index in bl_order\n\n\t\t\tsend_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt\n\t\t\tsend_bits(dcodes - 1, 5);\n\t\t\tsend_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt\n\t\t\tfor (rank = 0; rank < blcodes; rank++) {\n\t\t\t\tsend_bits(bl_tree[Tree.bl_order[rank] * 2 + 1], 3);\n\t\t\t}\n\t\t\tsend_tree(dyn_ltree, lcodes - 1); // literal tree\n\t\t\tsend_tree(dyn_dtree, dcodes - 1); // distance tree\n\t\t}\n\n\t\t// Flush the bit buffer, keeping at most 7 bits in it.\n\t\tfunction bi_flush() {\n\t\t\tif (bi_valid == 16) {\n\t\t\t\tput_short(bi_buf);\n\t\t\t\tbi_buf = 0;\n\t\t\t\tbi_valid = 0;\n\t\t\t} else if (bi_valid >= 8) {\n\t\t\t\tput_byte(bi_buf & 0xff);\n\t\t\t\tbi_buf >>>= 8;\n\t\t\t\tbi_valid -= 8;\n\t\t\t}\n\t\t}\n\n\t\t// Send one empty static block to give enough lookahead for inflate.\n\t\t// This takes 10 bits, of which 7 may remain in the bit buffer.\n\t\t// The current inflate code requires 9 bits of lookahead. If the\n\t\t// last two codes for the previous block (real code plus EOB) were coded\n\t\t// on 5 bits or less, inflate may have only 5+3 bits of lookahead to decode\n\t\t// the last real code. In this case we send two empty static blocks instead\n\t\t// of one. (There are no problems if the previous block is stored or fixed.)\n\t\t// To simplify the code, we assume the worst case of last real code encoded\n\t\t// on one bit only.\n\t\tfunction _tr_align() {\n\t\t\tsend_bits(STATIC_TREES << 1, 3);\n\t\t\tsend_code(END_BLOCK, StaticTree.static_ltree);\n\n\t\t\tbi_flush();\n\n\t\t\t// Of the 10 bits for the empty block, we have already sent\n\t\t\t// (10 - bi_valid) bits. The lookahead for the last real code (before\n\t\t\t// the EOB of the previous block) was thus at least one plus the length\n\t\t\t// of the EOB plus what we have just sent of the empty static block.\n\t\t\tif (1 + last_eob_len + 10 - bi_valid < 9) {\n\t\t\t\tsend_bits(STATIC_TREES << 1, 3);\n\t\t\t\tsend_code(END_BLOCK, StaticTree.static_ltree);\n\t\t\t\tbi_flush();\n\t\t\t}\n\t\t\tlast_eob_len = 7;\n\t\t}\n\n\t\t// Save the match info and tally the frequency counts. Return true if\n\t\t// the current block must be flushed.\n\t\tfunction _tr_tally(dist, // distance of matched string\n\t\tlc // match length-MIN_MATCH or unmatched char (if dist==0)\n\t\t) {\n\t\t\tvar out_length, in_length, dcode;\n\t\t\tthat.pending_buf[d_buf + last_lit * 2] = (dist >>> 8) & 0xff;\n\t\t\tthat.pending_buf[d_buf + last_lit * 2 + 1] = dist & 0xff;\n\n\t\t\tthat.pending_buf[l_buf + last_lit] = lc & 0xff;\n\t\t\tlast_lit++;\n\n\t\t\tif (dist === 0) {\n\t\t\t\t// lc is the unmatched char\n\t\t\t\tdyn_ltree[lc * 2]++;\n\t\t\t} else {\n\t\t\t\tmatches++;\n\t\t\t\t// Here, lc is the match length - MIN_MATCH\n\t\t\t\tdist--; // dist = match distance - 1\n\t\t\t\tdyn_ltree[(Tree._length_code[lc] + LITERALS + 1) * 2]++;\n\t\t\t\tdyn_dtree[Tree.d_code(dist) * 2]++;\n\t\t\t}\n\n\t\t\tif ((last_lit & 0x1fff) === 0 && level > 2) {\n\t\t\t\t// Compute an upper bound for the compressed length\n\t\t\t\tout_length = last_lit * 8;\n\t\t\t\tin_length = strstart - block_start;\n\t\t\t\tfor (dcode = 0; dcode < D_CODES; dcode++) {\n\t\t\t\t\tout_length += dyn_dtree[dcode * 2] * (5 + Tree.extra_dbits[dcode]);\n\t\t\t\t}\n\t\t\t\tout_length >>>= 3;\n\t\t\t\tif ((matches < Math.floor(last_lit / 2)) && out_length < Math.floor(in_length / 2))\n\t\t\t\t\treturn true;\n\t\t\t}\n\n\t\t\treturn (last_lit == lit_bufsize - 1);\n\t\t\t// We avoid equality with lit_bufsize because of wraparound at 64K\n\t\t\t// on 16 bit machines and because stored blocks are restricted to\n\t\t\t// 64K-1 bytes.\n\t\t}\n\n\t\t// Send the block data compressed using the given Huffman trees\n\t\tfunction compress_block(ltree, dtree) {\n\t\t\tvar dist; // distance of matched string\n\t\t\tvar lc; // match length or unmatched char (if dist === 0)\n\t\t\tvar lx = 0; // running index in l_buf\n\t\t\tvar code; // the code to send\n\t\t\tvar extra; // number of extra bits to send\n\n\t\t\tif (last_lit !== 0) {\n\t\t\t\tdo {\n\t\t\t\t\tdist = ((that.pending_buf[d_buf + lx * 2] << 8) & 0xff00) | (that.pending_buf[d_buf + lx * 2 + 1] & 0xff);\n\t\t\t\t\tlc = (that.pending_buf[l_buf + lx]) & 0xff;\n\t\t\t\t\tlx++;\n\n\t\t\t\t\tif (dist === 0) {\n\t\t\t\t\t\tsend_code(lc, ltree); // send a literal byte\n\t\t\t\t\t} else {\n\t\t\t\t\t\t// Here, lc is the match length - MIN_MATCH\n\t\t\t\t\t\tcode = Tree._length_code[lc];\n\n\t\t\t\t\t\tsend_code(code + LITERALS + 1, ltree); // send the length\n\t\t\t\t\t\t// code\n\t\t\t\t\t\textra = Tree.extra_lbits[code];\n\t\t\t\t\t\tif (extra !== 0) {\n\t\t\t\t\t\t\tlc -= Tree.base_length[code];\n\t\t\t\t\t\t\tsend_bits(lc, extra); // send the extra length bits\n\t\t\t\t\t\t}\n\t\t\t\t\t\tdist--; // dist is now the match distance - 1\n\t\t\t\t\t\tcode = Tree.d_code(dist);\n\n\t\t\t\t\t\tsend_code(code, dtree); // send the distance code\n\t\t\t\t\t\textra = Tree.extra_dbits[code];\n\t\t\t\t\t\tif (extra !== 0) {\n\t\t\t\t\t\t\tdist -= Tree.base_dist[code];\n\t\t\t\t\t\t\tsend_bits(dist, extra); // send the extra distance bits\n\t\t\t\t\t\t}\n\t\t\t\t\t} // literal or match pair ?\n\n\t\t\t\t\t// Check that the overlay between pending_buf and d_buf+l_buf is\n\t\t\t\t\t// ok:\n\t\t\t\t} while (lx < last_lit);\n\t\t\t}\n\n\t\t\tsend_code(END_BLOCK, ltree);\n\t\t\tlast_eob_len = ltree[END_BLOCK * 2 + 1];\n\t\t}\n\n\t\t// Flush the bit buffer and align the output on a byte boundary\n\t\tfunction bi_windup() {\n\t\t\tif (bi_valid > 8) {\n\t\t\t\tput_short(bi_buf);\n\t\t\t} else if (bi_valid > 0) {\n\t\t\t\tput_byte(bi_buf & 0xff);\n\t\t\t}\n\t\t\tbi_buf = 0;\n\t\t\tbi_valid = 0;\n\t\t}\n\n\t\t// Copy a stored block, storing first the length and its\n\t\t// one's complement if requested.\n\t\tfunction copy_block(buf, // the input data\n\t\tlen, // its length\n\t\theader // true if block header must be written\n\t\t) {\n\t\t\tbi_windup(); // align on byte boundary\n\t\t\tlast_eob_len = 8; // enough lookahead for inflate\n\n\t\t\tif (header) {\n\t\t\t\tput_short(len);\n\t\t\t\tput_short(~len);\n\t\t\t}\n\n\t\t\tthat.pending_buf.set(window.subarray(buf, buf + len), that.pending);\n\t\t\tthat.pending += len;\n\t\t}\n\n\t\t// Send a stored block\n\t\tfunction _tr_stored_block(buf, // input block\n\t\tstored_len, // length of input block\n\t\teof // true if this is the last block for a file\n\t\t) {\n\t\t\tsend_bits((STORED_BLOCK << 1) + (eof ? 1 : 0), 3); // send block type\n\t\t\tcopy_block(buf, stored_len, true); // with header\n\t\t}\n\n\t\t// Determine the best encoding for the current block: dynamic trees, static\n\t\t// trees or store, and output the encoded block to the zip file.\n\t\tfunction _tr_flush_block(buf, // input block, or NULL if too old\n\t\tstored_len, // length of input block\n\t\teof // true if this is the last block for a file\n\t\t) {\n\t\t\tvar opt_lenb, static_lenb;// opt_len and static_len in bytes\n\t\t\tvar max_blindex = 0; // index of last bit length code of non zero freq\n\n\t\t\t// Build the Huffman trees unless a stored block is forced\n\t\t\tif (level > 0) {\n\t\t\t\t// Construct the literal and distance trees\n\t\t\t\tl_desc.build_tree(that);\n\n\t\t\t\td_desc.build_tree(that);\n\n\t\t\t\t// At this point, opt_len and static_len are the total bit lengths\n\t\t\t\t// of\n\t\t\t\t// the compressed block data, excluding the tree representations.\n\n\t\t\t\t// Build the bit length tree for the above two trees, and get the\n\t\t\t\t// index\n\t\t\t\t// in bl_order of the last bit length code to send.\n\t\t\t\tmax_blindex = build_bl_tree();\n\n\t\t\t\t// Determine the best encoding. Compute first the block length in\n\t\t\t\t// bytes\n\t\t\t\topt_lenb = (that.opt_len + 3 + 7) >>> 3;\n\t\t\t\tstatic_lenb = (that.static_len + 3 + 7) >>> 3;\n\n\t\t\t\tif (static_lenb <= opt_lenb)\n\t\t\t\t\topt_lenb = static_lenb;\n\t\t\t} else {\n\t\t\t\topt_lenb = static_lenb = stored_len + 5; // force a stored block\n\t\t\t}\n\n\t\t\tif ((stored_len + 4 <= opt_lenb) && buf != -1) {\n\t\t\t\t// 4: two words for the lengths\n\t\t\t\t// The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.\n\t\t\t\t// Otherwise we can't have processed more than WSIZE input bytes\n\t\t\t\t// since\n\t\t\t\t// the last block flush, because compression would have been\n\t\t\t\t// successful. If LIT_BUFSIZE <= WSIZE, it is never too late to\n\t\t\t\t// transform a block into a stored block.\n\t\t\t\t_tr_stored_block(buf, stored_len, eof);\n\t\t\t} else if (static_lenb == opt_lenb) {\n\t\t\t\tsend_bits((STATIC_TREES << 1) + (eof ? 1 : 0), 3);\n\t\t\t\tcompress_block(StaticTree.static_ltree, StaticTree.static_dtree);\n\t\t\t} else {\n\t\t\t\tsend_bits((DYN_TREES << 1) + (eof ? 1 : 0), 3);\n\t\t\t\tsend_all_trees(l_desc.max_code + 1, d_desc.max_code + 1, max_blindex + 1);\n\t\t\t\tcompress_block(dyn_ltree, dyn_dtree);\n\t\t\t}\n\n\t\t\t// The above check is made mod 2^32, for files larger than 512 MB\n\t\t\t// and uLong implemented on 32 bits.\n\n\t\t\tinit_block();\n\n\t\t\tif (eof) {\n\t\t\t\tbi_windup();\n\t\t\t}\n\t\t}\n\n\t\tfunction flush_block_only(eof) {\n\t\t\t_tr_flush_block(block_start >= 0 ? block_start : -1, strstart - block_start, eof);\n\t\t\tblock_start = strstart;\n\t\t\tstrm.flush_pending();\n\t\t}\n\n\t\t// Fill the window when the lookahead becomes insufficient.\n\t\t// Updates strstart and lookahead.\n\t\t//\n\t\t// IN assertion: lookahead < MIN_LOOKAHEAD\n\t\t// OUT assertions: strstart <= window_size-MIN_LOOKAHEAD\n\t\t// At least one byte has been read, or avail_in === 0; reads are\n\t\t// performed for at least two bytes (required for the zip translate_eol\n\t\t// option -- not supported here).\n\t\tfunction fill_window() {\n\t\t\tvar n, m;\n\t\t\tvar p;\n\t\t\tvar more; // Amount of free space at the end of the window.\n\n\t\t\tdo {\n\t\t\t\tmore = (window_size - lookahead - strstart);\n\n\t\t\t\t// Deal with !@#$% 64K limit:\n\t\t\t\tif (more === 0 && strstart === 0 && lookahead === 0) {\n\t\t\t\t\tmore = w_size;\n\t\t\t\t} else if (more == -1) {\n\t\t\t\t\t// Very unlikely, but possible on 16 bit machine if strstart ==\n\t\t\t\t\t// 0\n\t\t\t\t\t// and lookahead == 1 (input done one byte at time)\n\t\t\t\t\tmore--;\n\n\t\t\t\t\t// If the window is almost full and there is insufficient\n\t\t\t\t\t// lookahead,\n\t\t\t\t\t// move the upper half to the lower one to make room in the\n\t\t\t\t\t// upper half.\n\t\t\t\t} else if (strstart >= w_size + w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\twindow.set(window.subarray(w_size, w_size + w_size), 0);\n\n\t\t\t\t\tmatch_start -= w_size;\n\t\t\t\t\tstrstart -= w_size; // we now have strstart >= MAX_DIST\n\t\t\t\t\tblock_start -= w_size;\n\n\t\t\t\t\t// Slide the hash table (could be avoided with 32 bit values\n\t\t\t\t\t// at the expense of memory usage). We slide even when level ==\n\t\t\t\t\t// 0\n\t\t\t\t\t// to keep the hash table consistent if we switch back to level\n\t\t\t\t\t// > 0\n\t\t\t\t\t// later. (Using level 0 permanently is not an optimal usage of\n\t\t\t\t\t// zlib, so we don't care about this pathological case.)\n\n\t\t\t\t\tn = hash_size;\n\t\t\t\t\tp = n;\n\t\t\t\t\tdo {\n\t\t\t\t\t\tm = (head[--p] & 0xffff);\n\t\t\t\t\t\thead[p] = (m >= w_size ? m - w_size : 0);\n\t\t\t\t\t} while (--n !== 0);\n\n\t\t\t\t\tn = w_size;\n\t\t\t\t\tp = n;\n\t\t\t\t\tdo {\n\t\t\t\t\t\tm = (prev[--p] & 0xffff);\n\t\t\t\t\t\tprev[p] = (m >= w_size ? m - w_size : 0);\n\t\t\t\t\t\t// If n is not on any hash chain, prev[n] is garbage but\n\t\t\t\t\t\t// its value will never be used.\n\t\t\t\t\t} while (--n !== 0);\n\t\t\t\t\tmore += w_size;\n\t\t\t\t}\n\n\t\t\t\tif (strm.avail_in === 0)\n\t\t\t\t\treturn;\n\n\t\t\t\t// If there was no sliding:\n\t\t\t\t// strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&\n\t\t\t\t// more == window_size - lookahead - strstart\n\t\t\t\t// => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)\n\t\t\t\t// => more >= window_size - 2*WSIZE + 2\n\t\t\t\t// In the BIG_MEM or MMAP case (not yet supported),\n\t\t\t\t// window_size == input_size + MIN_LOOKAHEAD &&\n\t\t\t\t// strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.\n\t\t\t\t// Otherwise, window_size == 2*WSIZE so more >= 2.\n\t\t\t\t// If there was sliding, more >= WSIZE. So in all cases, more >= 2.\n\n\t\t\t\tn = strm.read_buf(window, strstart + lookahead, more);\n\t\t\t\tlookahead += n;\n\n\t\t\t\t// Initialize the hash value now that we have some input:\n\t\t\t\tif (lookahead >= MIN_MATCH) {\n\t\t\t\t\tins_h = window[strstart] & 0xff;\n\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[strstart + 1] & 0xff)) & hash_mask;\n\t\t\t\t}\n\t\t\t\t// If the whole input has less than MIN_MATCH bytes, ins_h is\n\t\t\t\t// garbage,\n\t\t\t\t// but this is not important since only literal bytes will be\n\t\t\t\t// emitted.\n\t\t\t} while (lookahead < MIN_LOOKAHEAD && strm.avail_in !== 0);\n\t\t}\n\n\t\t// Copy without compression as much as possible from the input stream,\n\t\t// return\n\t\t// the current block state.\n\t\t// This function does not insert new strings in the dictionary since\n\t\t// uncompressible data is probably not useful. This function is used\n\t\t// only for the level=0 compression option.\n\t\t// NOTE: this function should be optimized to avoid extra copying from\n\t\t// window to pending_buf.\n\t\tfunction deflate_stored(flush) {\n\t\t\t// Stored blocks are limited to 0xffff bytes, pending_buf is limited\n\t\t\t// to pending_buf_size, and each stored block has a 5 byte header:\n\n\t\t\tvar max_block_size = 0xffff;\n\t\t\tvar max_start;\n\n\t\t\tif (max_block_size > pending_buf_size - 5) {\n\t\t\t\tmax_block_size = pending_buf_size - 5;\n\t\t\t}\n\n\t\t\t// Copy as much as possible from input to output:\n\t\t\twhile (true) {\n\t\t\t\t// Fill the window as much as possible:\n\t\t\t\tif (lookahead <= 1) {\n\t\t\t\t\tfill_window();\n\t\t\t\t\tif (lookahead === 0 && flush == Z_NO_FLUSH)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\tif (lookahead === 0)\n\t\t\t\t\t\tbreak; // flush the current block\n\t\t\t\t}\n\n\t\t\t\tstrstart += lookahead;\n\t\t\t\tlookahead = 0;\n\n\t\t\t\t// Emit a stored block if pending_buf will be full:\n\t\t\t\tmax_start = block_start + max_block_size;\n\t\t\t\tif (strstart === 0 || strstart >= max_start) {\n\t\t\t\t\t// strstart === 0 is possible when wraparound on 16-bit machine\n\t\t\t\t\tlookahead = (strstart - max_start);\n\t\t\t\t\tstrstart = max_start;\n\n\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\n\t\t\t\t}\n\n\t\t\t\t// Flush if we may have to slide, otherwise block_start may become\n\t\t\t\t// negative and the data will be gone:\n\t\t\t\tif (strstart - block_start >= w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tflush_block_only(flush == Z_FINISH);\n\t\t\tif (strm.avail_out === 0)\n\t\t\t\treturn (flush == Z_FINISH) ? FinishStarted : NeedMore;\n\n\t\t\treturn flush == Z_FINISH ? FinishDone : BlockDone;\n\t\t}\n\n\t\tfunction longest_match(cur_match) {\n\t\t\tvar chain_length = max_chain_length; // max hash chain length\n\t\t\tvar scan = strstart; // current string\n\t\t\tvar match; // matched string\n\t\t\tvar len; // length of current match\n\t\t\tvar best_len = prev_length; // best match length so far\n\t\t\tvar limit = strstart > (w_size - MIN_LOOKAHEAD) ? strstart - (w_size - MIN_LOOKAHEAD) : 0;\n\t\t\tvar _nice_match = nice_match;\n\n\t\t\t// Stop when cur_match becomes <= limit. To simplify the code,\n\t\t\t// we prevent matches with the string of window index 0.\n\n\t\t\tvar wmask = w_mask;\n\n\t\t\tvar strend = strstart + MAX_MATCH;\n\t\t\tvar scan_end1 = window[scan + best_len - 1];\n\t\t\tvar scan_end = window[scan + best_len];\n\n\t\t\t// The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of\n\t\t\t// 16.\n\t\t\t// It is easy to get rid of this optimization if necessary.\n\n\t\t\t// Do not waste too much time if we already have a good match:\n\t\t\tif (prev_length >= good_match) {\n\t\t\t\tchain_length >>= 2;\n\t\t\t}\n\n\t\t\t// Do not look for matches beyond the end of the input. This is\n\t\t\t// necessary\n\t\t\t// to make deflate deterministic.\n\t\t\tif (_nice_match > lookahead)\n\t\t\t\t_nice_match = lookahead;\n\n\t\t\tdo {\n\t\t\t\tmatch = cur_match;\n\n\t\t\t\t// Skip to next match if the match length cannot increase\n\t\t\t\t// or if the match length is less than 2:\n\t\t\t\tif (window[match + best_len] != scan_end || window[match + best_len - 1] != scan_end1 || window[match] != window[scan]\n\t\t\t\t\t\t|| window[++match] != window[scan + 1])\n\t\t\t\t\tcontinue;\n\n\t\t\t\t// The check at best_len-1 can be removed because it will be made\n\t\t\t\t// again later. (This heuristic is not always a win.)\n\t\t\t\t// It is not necessary to compare scan[2] and match[2] since they\n\t\t\t\t// are always equal when the other bytes match, given that\n\t\t\t\t// the hash keys are equal and that HASH_BITS >= 8.\n\t\t\t\tscan += 2;\n\t\t\t\tmatch++;\n\n\t\t\t\t// We check for insufficient lookahead only every 8th comparison;\n\t\t\t\t// the 256th check will be made at strstart+258.\n\t\t\t\tdo {\n\t\t\t\t} while (window[++scan] == window[++match] && window[++scan] == window[++match] && window[++scan] == window[++match]\n\t\t\t\t\t\t&& window[++scan] == window[++match] && window[++scan] == window[++match] && window[++scan] == window[++match]\n\t\t\t\t\t\t&& window[++scan] == window[++match] && window[++scan] == window[++match] && scan < strend);\n\n\t\t\t\tlen = MAX_MATCH - (strend - scan);\n\t\t\t\tscan = strend - MAX_MATCH;\n\n\t\t\t\tif (len > best_len) {\n\t\t\t\t\tmatch_start = cur_match;\n\t\t\t\t\tbest_len = len;\n\t\t\t\t\tif (len >= _nice_match)\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tscan_end1 = window[scan + best_len - 1];\n\t\t\t\t\tscan_end = window[scan + best_len];\n\t\t\t\t}\n\n\t\t\t} while ((cur_match = (prev[cur_match & wmask] & 0xffff)) > limit && --chain_length !== 0);\n\n\t\t\tif (best_len <= lookahead)\n\t\t\t\treturn best_len;\n\t\t\treturn lookahead;\n\t\t}\n\n\t\t// Compress as much as possible from the input stream, return the current\n\t\t// block state.\n\t\t// This function does not perform lazy evaluation of matches and inserts\n\t\t// new strings in the dictionary only for unmatched strings or for short\n\t\t// matches. It is used only for the fast compression options.\n\t\tfunction deflate_fast(flush) {\n\t\t\t// short hash_head = 0; // head of the hash chain\n\t\t\tvar hash_head = 0; // head of the hash chain\n\t\t\tvar bflush; // set if current block must be flushed\n\n\t\t\twhile (true) {\n\t\t\t\t// Make sure that we always have enough lookahead, except\n\t\t\t\t// at the end of the input file. We need MAX_MATCH bytes\n\t\t\t\t// for the next match, plus MIN_MATCH bytes to insert the\n\t\t\t\t// string following the next match.\n\t\t\t\tif (lookahead < MIN_LOOKAHEAD) {\n\t\t\t\t\tfill_window();\n\t\t\t\t\tif (lookahead < MIN_LOOKAHEAD && flush == Z_NO_FLUSH) {\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\t}\n\t\t\t\t\tif (lookahead === 0)\n\t\t\t\t\t\tbreak; // flush the current block\n\t\t\t\t}\n\n\t\t\t\t// Insert the string window[strstart .. strstart+2] in the\n\t\t\t\t// dictionary, and set hash_head to the head of the hash chain:\n\t\t\t\tif (lookahead >= MIN_MATCH) {\n\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\n\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\thead[ins_h] = strstart;\n\t\t\t\t}\n\n\t\t\t\t// Find the longest match, discarding those <= prev_length.\n\t\t\t\t// At this point we have always match_length < MIN_MATCH\n\n\t\t\t\tif (hash_head !== 0 && ((strstart - hash_head) & 0xffff) <= w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\t// To simplify the code, we prevent matches with the string\n\t\t\t\t\t// of window index 0 (in particular we have to avoid a match\n\t\t\t\t\t// of the string with itself at the start of the input file).\n\t\t\t\t\tif (strategy != Z_HUFFMAN_ONLY) {\n\t\t\t\t\t\tmatch_length = longest_match(hash_head);\n\t\t\t\t\t}\n\t\t\t\t\t// longest_match() sets match_start\n\t\t\t\t}\n\t\t\t\tif (match_length >= MIN_MATCH) {\n\t\t\t\t\t// check_match(strstart, match_start, match_length);\n\n\t\t\t\t\tbflush = _tr_tally(strstart - match_start, match_length - MIN_MATCH);\n\n\t\t\t\t\tlookahead -= match_length;\n\n\t\t\t\t\t// Insert new strings in the hash table only if the match length\n\t\t\t\t\t// is not too large. This saves time but degrades compression.\n\t\t\t\t\tif (match_length <= max_lazy_match && lookahead >= MIN_MATCH) {\n\t\t\t\t\t\tmatch_length--; // string at strstart already in hash table\n\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\tstrstart++;\n\n\t\t\t\t\t\t\tins_h = ((ins_h << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\t\t\thead[ins_h] = strstart;\n\n\t\t\t\t\t\t\t// strstart never exceeds WSIZE-MAX_MATCH, so there are\n\t\t\t\t\t\t\t// always MIN_MATCH bytes ahead.\n\t\t\t\t\t\t} while (--match_length !== 0);\n\t\t\t\t\t\tstrstart++;\n\t\t\t\t\t} else {\n\t\t\t\t\t\tstrstart += match_length;\n\t\t\t\t\t\tmatch_length = 0;\n\t\t\t\t\t\tins_h = window[strstart] & 0xff;\n\n\t\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[strstart + 1] & 0xff)) & hash_mask;\n\t\t\t\t\t\t// If lookahead < MIN_MATCH, ins_h is garbage, but it does\n\t\t\t\t\t\t// not\n\t\t\t\t\t\t// matter since it will be recomputed at next deflate call.\n\t\t\t\t\t}\n\t\t\t\t} else {\n\t\t\t\t\t// No match, output a literal byte\n\n\t\t\t\t\tbflush = _tr_tally(0, window[strstart] & 0xff);\n\t\t\t\t\tlookahead--;\n\t\t\t\t\tstrstart++;\n\t\t\t\t}\n\t\t\t\tif (bflush) {\n\n\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tflush_block_only(flush == Z_FINISH);\n\t\t\tif (strm.avail_out === 0) {\n\t\t\t\tif (flush == Z_FINISH)\n\t\t\t\t\treturn FinishStarted;\n\t\t\t\telse\n\t\t\t\t\treturn NeedMore;\n\t\t\t}\n\t\t\treturn flush == Z_FINISH ? FinishDone : BlockDone;\n\t\t}\n\n\t\t// Same as above, but achieves better compression. We use a lazy\n\t\t// evaluation for matches: a match is finally adopted only if there is\n\t\t// no better match at the next window position.\n\t\tfunction deflate_slow(flush) {\n\t\t\t// short hash_head = 0; // head of hash chain\n\t\t\tvar hash_head = 0; // head of hash chain\n\t\t\tvar bflush; // set if current block must be flushed\n\t\t\tvar max_insert;\n\n\t\t\t// Process the input block.\n\t\t\twhile (true) {\n\t\t\t\t// Make sure that we always have enough lookahead, except\n\t\t\t\t// at the end of the input file. We need MAX_MATCH bytes\n\t\t\t\t// for the next match, plus MIN_MATCH bytes to insert the\n\t\t\t\t// string following the next match.\n\n\t\t\t\tif (lookahead < MIN_LOOKAHEAD) {\n\t\t\t\t\tfill_window();\n\t\t\t\t\tif (lookahead < MIN_LOOKAHEAD && flush == Z_NO_FLUSH) {\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\t}\n\t\t\t\t\tif (lookahead === 0)\n\t\t\t\t\t\tbreak; // flush the current block\n\t\t\t\t}\n\n\t\t\t\t// Insert the string window[strstart .. strstart+2] in the\n\t\t\t\t// dictionary, and set hash_head to the head of the hash chain:\n\n\t\t\t\tif (lookahead >= MIN_MATCH) {\n\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\thead[ins_h] = strstart;\n\t\t\t\t}\n\n\t\t\t\t// Find the longest match, discarding those <= prev_length.\n\t\t\t\tprev_length = match_length;\n\t\t\t\tprev_match = match_start;\n\t\t\t\tmatch_length = MIN_MATCH - 1;\n\n\t\t\t\tif (hash_head !== 0 && prev_length < max_lazy_match && ((strstart - hash_head) & 0xffff) <= w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\t// To simplify the code, we prevent matches with the string\n\t\t\t\t\t// of window index 0 (in particular we have to avoid a match\n\t\t\t\t\t// of the string with itself at the start of the input file).\n\n\t\t\t\t\tif (strategy != Z_HUFFMAN_ONLY) {\n\t\t\t\t\t\tmatch_length = longest_match(hash_head);\n\t\t\t\t\t}\n\t\t\t\t\t// longest_match() sets match_start\n\n\t\t\t\t\tif (match_length <= 5 && (strategy == Z_FILTERED || (match_length == MIN_MATCH && strstart - match_start > 4096))) {\n\n\t\t\t\t\t\t// If prev_match is also MIN_MATCH, match_start is garbage\n\t\t\t\t\t\t// but we will ignore the current match anyway.\n\t\t\t\t\t\tmatch_length = MIN_MATCH - 1;\n\t\t\t\t\t}\n\t\t\t\t}\n\n\t\t\t\t// If there was a match at the previous step and the current\n\t\t\t\t// match is not better, output the previous match:\n\t\t\t\tif (prev_length >= MIN_MATCH && match_length <= prev_length) {\n\t\t\t\t\tmax_insert = strstart + lookahead - MIN_MATCH;\n\t\t\t\t\t// Do not insert strings in hash table beyond this.\n\n\t\t\t\t\t// check_match(strstart-1, prev_match, prev_length);\n\n\t\t\t\t\tbflush = _tr_tally(strstart - 1 - prev_match, prev_length - MIN_MATCH);\n\n\t\t\t\t\t// Insert in hash table all strings up to the end of the match.\n\t\t\t\t\t// strstart-1 and strstart are already inserted. If there is not\n\t\t\t\t\t// enough lookahead, the last two strings are not inserted in\n\t\t\t\t\t// the hash table.\n\t\t\t\t\tlookahead -= prev_length - 1;\n\t\t\t\t\tprev_length -= 2;\n\t\t\t\t\tdo {\n\t\t\t\t\t\tif (++strstart <= max_insert) {\n\t\t\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\t\t\thead[ins_h] = strstart;\n\t\t\t\t\t\t}\n\t\t\t\t\t} while (--prev_length !== 0);\n\t\t\t\t\tmatch_available = 0;\n\t\t\t\t\tmatch_length = MIN_MATCH - 1;\n\t\t\t\t\tstrstart++;\n\n\t\t\t\t\tif (bflush) {\n\t\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\t}\n\t\t\t\t} else if (match_available !== 0) {\n\n\t\t\t\t\t// If there was no match at the previous position, output a\n\t\t\t\t\t// single literal. If there was a match but the current match\n\t\t\t\t\t// is longer, truncate the previous match to a single literal.\n\n\t\t\t\t\tbflush = _tr_tally(0, window[strstart - 1] & 0xff);\n\n\t\t\t\t\tif (bflush) {\n\t\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\t}\n\t\t\t\t\tstrstart++;\n\t\t\t\t\tlookahead--;\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t} else {\n\t\t\t\t\t// There is no previous match to compare with, wait for\n\t\t\t\t\t// the next step to decide.\n\n\t\t\t\t\tmatch_available = 1;\n\t\t\t\t\tstrstart++;\n\t\t\t\t\tlookahead--;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif (match_available !== 0) {\n\t\t\t\tbflush = _tr_tally(0, window[strstart - 1] & 0xff);\n\t\t\t\tmatch_available = 0;\n\t\t\t}\n\t\t\tflush_block_only(flush == Z_FINISH);\n\n\t\t\tif (strm.avail_out === 0) {\n\t\t\t\tif (flush == Z_FINISH)\n\t\t\t\t\treturn FinishStarted;\n\t\t\t\telse\n\t\t\t\t\treturn NeedMore;\n\t\t\t}\n\n\t\t\treturn flush == Z_FINISH ? FinishDone : BlockDone;\n\t\t}\n\n\t\tfunction deflateReset(strm) {\n\t\t\tstrm.total_in = strm.total_out = 0;\n\t\t\tstrm.msg = null; //\n\t\t\t\n\t\t\tthat.pending = 0;\n\t\t\tthat.pending_out = 0;\n\n\t\t\tstatus = BUSY_STATE;\n\n\t\t\tlast_flush = Z_NO_FLUSH;\n\n\t\t\ttr_init();\n\t\t\tlm_init();\n\t\t\treturn Z_OK;\n\t\t}\n\n\t\tthat.deflateInit = function(strm, _level, bits, _method, memLevel, _strategy) {\n\t\t\tif (!_method)\n\t\t\t\t_method = Z_DEFLATED;\n\t\t\tif (!memLevel)\n\t\t\t\tmemLevel = DEF_MEM_LEVEL;\n\t\t\tif (!_strategy)\n\t\t\t\t_strategy = Z_DEFAULT_STRATEGY;\n\n\t\t\t// byte[] my_version=ZLIB_VERSION;\n\n\t\t\t//\n\t\t\t// if (!version || version[0] != my_version[0]\n\t\t\t// || stream_size != sizeof(z_stream)) {\n\t\t\t// return Z_VERSION_ERROR;\n\t\t\t// }\n\n\t\t\tstrm.msg = null;\n\n\t\t\tif (_level == Z_DEFAULT_COMPRESSION)\n\t\t\t\t_level = 6;\n\n\t\t\tif (memLevel < 1 || memLevel > MAX_MEM_LEVEL || _method != Z_DEFLATED || bits < 9 || bits > 15 || _level < 0 || _level > 9 || _strategy < 0\n\t\t\t\t\t|| _strategy > Z_HUFFMAN_ONLY) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\n\t\t\tstrm.dstate = that;\n\n\t\t\tw_bits = bits;\n\t\t\tw_size = 1 << w_bits;\n\t\t\tw_mask = w_size - 1;\n\n\t\t\thash_bits = memLevel + 7;\n\t\t\thash_size = 1 << hash_bits;\n\t\t\thash_mask = hash_size - 1;\n\t\t\thash_shift = Math.floor((hash_bits + MIN_MATCH - 1) / MIN_MATCH);\n\n\t\t\twindow = new Uint8Array(w_size * 2);\n\t\t\tprev = [];\n\t\t\thead = [];\n\n\t\t\tlit_bufsize = 1 << (memLevel + 6); // 16K elements by default\n\n\t\t\t// We overlay pending_buf and d_buf+l_buf. This works since the average\n\t\t\t// output size for (length,distance) codes is <= 24 bits.\n\t\t\tthat.pending_buf = new Uint8Array(lit_bufsize * 4);\n\t\t\tpending_buf_size = lit_bufsize * 4;\n\n\t\t\td_buf = Math.floor(lit_bufsize / 2);\n\t\t\tl_buf = (1 + 2) * lit_bufsize;\n\n\t\t\tlevel = _level;\n\n\t\t\tstrategy = _strategy;\n\t\t\tmethod = _method & 0xff;\n\n\t\t\treturn deflateReset(strm);\n\t\t};\n\n\t\tthat.deflateEnd = function() {\n\t\t\tif (status != INIT_STATE && status != BUSY_STATE && status != FINISH_STATE) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\t// Deallocate in reverse order of allocations:\n\t\t\tthat.pending_buf = null;\n\t\t\thead = null;\n\t\t\tprev = null;\n\t\t\twindow = null;\n\t\t\t// free\n\t\t\tthat.dstate = null;\n\t\t\treturn status == BUSY_STATE ? Z_DATA_ERROR : Z_OK;\n\t\t};\n\n\t\tthat.deflateParams = function(strm, _level, _strategy) {\n\t\t\tvar err = Z_OK;\n\n\t\t\tif (_level == Z_DEFAULT_COMPRESSION) {\n\t\t\t\t_level = 6;\n\t\t\t}\n\t\t\tif (_level < 0 || _level > 9 || _strategy < 0 || _strategy > Z_HUFFMAN_ONLY) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\n\t\t\tif (config_table[level].func != config_table[_level].func && strm.total_in !== 0) {\n\t\t\t\t// Flush the last buffer:\n\t\t\t\terr = strm.deflate(Z_PARTIAL_FLUSH);\n\t\t\t}\n\n\t\t\tif (level != _level) {\n\t\t\t\tlevel = _level;\n\t\t\t\tmax_lazy_match = config_table[level].max_lazy;\n\t\t\t\tgood_match = config_table[level].good_length;\n\t\t\t\tnice_match = config_table[level].nice_length;\n\t\t\t\tmax_chain_length = config_table[level].max_chain;\n\t\t\t}\n\t\t\tstrategy = _strategy;\n\t\t\treturn err;\n\t\t};\n\n\t\tthat.deflateSetDictionary = function(strm, dictionary, dictLength) {\n\t\t\tvar length = dictLength;\n\t\t\tvar n, index = 0;\n\n\t\t\tif (!dictionary || status != INIT_STATE)\n\t\t\t\treturn Z_STREAM_ERROR;\n\n\t\t\tif (length < MIN_MATCH)\n\t\t\t\treturn Z_OK;\n\t\t\tif (length > w_size - MIN_LOOKAHEAD) {\n\t\t\t\tlength = w_size - MIN_LOOKAHEAD;\n\t\t\t\tindex = dictLength - length; // use the tail of the dictionary\n\t\t\t}\n\t\t\twindow.set(dictionary.subarray(index, index + length), 0);\n\n\t\t\tstrstart = length;\n\t\t\tblock_start = length;\n\n\t\t\t// Insert all strings in the hash table (except for the last two bytes).\n\t\t\t// s->lookahead stays null, so s->ins_h will be recomputed at the next\n\t\t\t// call of fill_window.\n\n\t\t\tins_h = window[0] & 0xff;\n\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[1] & 0xff)) & hash_mask;\n\n\t\t\tfor (n = 0; n <= length - MIN_MATCH; n++) {\n\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(n) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\tprev[n & w_mask] = head[ins_h];\n\t\t\t\thead[ins_h] = n;\n\t\t\t}\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.deflate = function(_strm, flush) {\n\t\t\tvar i, header, level_flags, old_flush, bstate;\n\n\t\t\tif (flush > Z_FINISH || flush < 0) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\n\t\t\tif (!_strm.next_out || (!_strm.next_in && _strm.avail_in !== 0) || (status == FINISH_STATE && flush != Z_FINISH)) {\n\t\t\t\t_strm.msg = z_errmsg[Z_NEED_DICT - (Z_STREAM_ERROR)];\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\tif (_strm.avail_out === 0) {\n\t\t\t\t_strm.msg = z_errmsg[Z_NEED_DICT - (Z_BUF_ERROR)];\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\t}\n\n\t\t\tstrm = _strm; // just in case\n\t\t\told_flush = last_flush;\n\t\t\tlast_flush = flush;\n\n\t\t\t// Write the zlib header\n\t\t\tif (status == INIT_STATE) {\n\t\t\t\theader = (Z_DEFLATED + ((w_bits - 8) << 4)) << 8;\n\t\t\t\tlevel_flags = ((level - 1) & 0xff) >> 1;\n\n\t\t\t\tif (level_flags > 3)\n\t\t\t\t\tlevel_flags = 3;\n\t\t\t\theader |= (level_flags << 6);\n\t\t\t\tif (strstart !== 0)\n\t\t\t\t\theader |= PRESET_DICT;\n\t\t\t\theader += 31 - (header % 31);\n\n\t\t\t\tstatus = BUSY_STATE;\n\t\t\t\tputShortMSB(header);\n\t\t\t}\n\n\t\t\t// Flush as much pending output as possible\n\t\t\tif (that.pending !== 0) {\n\t\t\t\tstrm.flush_pending();\n\t\t\t\tif (strm.avail_out === 0) {\n\t\t\t\t\t// console.log(\" avail_out==0\");\n\t\t\t\t\t// Since avail_out is 0, deflate will be called again with\n\t\t\t\t\t// more output space, but possibly with both pending and\n\t\t\t\t\t// avail_in equal to zero. There won't be anything to do,\n\t\t\t\t\t// but this is not an error situation so make sure we\n\t\t\t\t\t// return OK instead of BUF_ERROR at next call of deflate:\n\t\t\t\t\tlast_flush = -1;\n\t\t\t\t\treturn Z_OK;\n\t\t\t\t}\n\n\t\t\t\t// Make sure there is something to do and avoid duplicate\n\t\t\t\t// consecutive\n\t\t\t\t// flushes. For repeated and useless calls with Z_FINISH, we keep\n\t\t\t\t// returning Z_STREAM_END instead of Z_BUFF_ERROR.\n\t\t\t} else if (strm.avail_in === 0 && flush <= old_flush && flush != Z_FINISH) {\n\t\t\t\tstrm.msg = z_errmsg[Z_NEED_DICT - (Z_BUF_ERROR)];\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\t}\n\n\t\t\t// User must not provide more input after the first FINISH:\n\t\t\tif (status == FINISH_STATE && strm.avail_in !== 0) {\n\t\t\t\t_strm.msg = z_errmsg[Z_NEED_DICT - (Z_BUF_ERROR)];\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\t}\n\n\t\t\t// Start a new block or continue the current one.\n\t\t\tif (strm.avail_in !== 0 || lookahead !== 0 || (flush != Z_NO_FLUSH && status != FINISH_STATE)) {\n\t\t\t\tbstate = -1;\n\t\t\t\tswitch (config_table[level].func) {\n\t\t\t\tcase STORED:\n\t\t\t\t\tbstate = deflate_stored(flush);\n\t\t\t\t\tbreak;\n\t\t\t\tcase FAST:\n\t\t\t\t\tbstate = deflate_fast(flush);\n\t\t\t\t\tbreak;\n\t\t\t\tcase SLOW:\n\t\t\t\t\tbstate = deflate_slow(flush);\n\t\t\t\t\tbreak;\n\t\t\t\tdefault:\n\t\t\t\t}\n\n\t\t\t\tif (bstate == FinishStarted || bstate == FinishDone) {\n\t\t\t\t\tstatus = FINISH_STATE;\n\t\t\t\t}\n\t\t\t\tif (bstate == NeedMore || bstate == FinishStarted) {\n\t\t\t\t\tif (strm.avail_out === 0) {\n\t\t\t\t\t\tlast_flush = -1; // avoid BUF_ERROR next call, see above\n\t\t\t\t\t}\n\t\t\t\t\treturn Z_OK;\n\t\t\t\t\t// If flush != Z_NO_FLUSH && avail_out === 0, the next call\n\t\t\t\t\t// of deflate should use the same flush parameter to make sure\n\t\t\t\t\t// that the flush is complete. So we don't have to output an\n\t\t\t\t\t// empty block here, this will be done at next call. This also\n\t\t\t\t\t// ensures that for a very small output buffer, we emit at most\n\t\t\t\t\t// one empty block.\n\t\t\t\t}\n\n\t\t\t\tif (bstate == BlockDone) {\n\t\t\t\t\tif (flush == Z_PARTIAL_FLUSH) {\n\t\t\t\t\t\t_tr_align();\n\t\t\t\t\t} else { // FULL_FLUSH or SYNC_FLUSH\n\t\t\t\t\t\t_tr_stored_block(0, 0, false);\n\t\t\t\t\t\t// For a full flush, this empty block will be recognized\n\t\t\t\t\t\t// as a special marker by inflate_sync().\n\t\t\t\t\t\tif (flush == Z_FULL_FLUSH) {\n\t\t\t\t\t\t\t// state.head[s.hash_size-1]=0;\n\t\t\t\t\t\t\tfor (i = 0; i < hash_size/*-1*/; i++)\n\t\t\t\t\t\t\t\t// forget history\n\t\t\t\t\t\t\t\thead[i] = 0;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tstrm.flush_pending();\n\t\t\t\t\tif (strm.avail_out === 0) {\n\t\t\t\t\t\tlast_flush = -1; // avoid BUF_ERROR at next call, see above\n\t\t\t\t\t\treturn Z_OK;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif (flush != Z_FINISH)\n\t\t\t\treturn Z_OK;\n\t\t\treturn Z_STREAM_END;\n\t\t};\n\t}\n\n\t// ZStream\n\n\tfunction ZStream() {\n\t\tvar that = this;\n\t\tthat.next_in_index = 0;\n\t\tthat.next_out_index = 0;\n\t\t// that.next_in; // next input byte\n\t\tthat.avail_in = 0; // number of bytes available at next_in\n\t\tthat.total_in = 0; // total nb of input bytes read so far\n\t\t// that.next_out; // next output byte should be put there\n\t\tthat.avail_out = 0; // remaining free space at next_out\n\t\tthat.total_out = 0; // total nb of bytes output so far\n\t\t// that.msg;\n\t\t// that.dstate;\n\t}\n\n\tZStream.prototype = {\n\t\tdeflateInit : function(level, bits) {\n\t\t\tvar that = this;\n\t\t\tthat.dstate = new Deflate();\n\t\t\tif (!bits)\n\t\t\t\tbits = MAX_BITS;\n\t\t\treturn that.dstate.deflateInit(that, level, bits);\n\t\t},\n\n\t\tdeflate : function(flush) {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\treturn that.dstate.deflate(that, flush);\n\t\t},\n\n\t\tdeflateEnd : function() {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tvar ret = that.dstate.deflateEnd();\n\t\t\tthat.dstate = null;\n\t\t\treturn ret;\n\t\t},\n\n\t\tdeflateParams : function(level, strategy) {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.dstate.deflateParams(that, level, strategy);\n\t\t},\n\n\t\tdeflateSetDictionary : function(dictionary, dictLength) {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.dstate.deflateSetDictionary(that, dictionary, dictLength);\n\t\t},\n\n\t\t// Read a new buffer from the current input stream, update the\n\t\t// total number of bytes read. All deflate() input goes through\n\t\t// this function so some applications may wish to modify it to avoid\n\t\t// allocating a large strm->next_in buffer and copying from it.\n\t\t// (See also flush_pending()).\n\t\tread_buf : function(buf, start, size) {\n\t\t\tvar that = this;\n\t\t\tvar len = that.avail_in;\n\t\t\tif (len > size)\n\t\t\t\tlen = size;\n\t\t\tif (len === 0)\n\t\t\t\treturn 0;\n\t\t\tthat.avail_in -= len;\n\t\t\tbuf.set(that.next_in.subarray(that.next_in_index, that.next_in_index + len), start);\n\t\t\tthat.next_in_index += len;\n\t\t\tthat.total_in += len;\n\t\t\treturn len;\n\t\t},\n\n\t\t// Flush as much pending output as possible. All deflate() output goes\n\t\t// through this function so some applications may wish to modify it\n\t\t// to avoid allocating a large strm->next_out buffer and copying into it.\n\t\t// (See also read_buf()).\n\t\tflush_pending : function() {\n\t\t\tvar that = this;\n\t\t\tvar len = that.dstate.pending;\n\n\t\t\tif (len > that.avail_out)\n\t\t\t\tlen = that.avail_out;\n\t\t\tif (len === 0)\n\t\t\t\treturn;\n\n\t\t\t// if (that.dstate.pending_buf.length <= that.dstate.pending_out || that.next_out.length <= that.next_out_index\n\t\t\t// || that.dstate.pending_buf.length < (that.dstate.pending_out + len) || that.next_out.length < (that.next_out_index +\n\t\t\t// len)) {\n\t\t\t// console.log(that.dstate.pending_buf.length + \", \" + that.dstate.pending_out + \", \" + that.next_out.length + \", \" +\n\t\t\t// that.next_out_index + \", \" + len);\n\t\t\t// console.log(\"avail_out=\" + that.avail_out);\n\t\t\t// }\n\n\t\t\tthat.next_out.set(that.dstate.pending_buf.subarray(that.dstate.pending_out, that.dstate.pending_out + len), that.next_out_index);\n\n\t\t\tthat.next_out_index += len;\n\t\t\tthat.dstate.pending_out += len;\n\t\t\tthat.total_out += len;\n\t\t\tthat.avail_out -= len;\n\t\t\tthat.dstate.pending -= len;\n\t\t\tif (that.dstate.pending === 0) {\n\t\t\t\tthat.dstate.pending_out = 0;\n\t\t\t}\n\t\t}\n\t};\n\n\t// Deflater\n\n\tfunction Deflater(options) {\n\t\tvar that = this;\n\t\tvar z = new ZStream();\n\t\tvar bufsize = 512;\n\t\tvar flush = Z_NO_FLUSH;\n\t\tvar buf = new Uint8Array(bufsize);\n\t\tvar level = options ? options.level : Z_DEFAULT_COMPRESSION;\n\t\tif (typeof level == \"undefined\")\n\t\t\tlevel = Z_DEFAULT_COMPRESSION;\n\t\tz.deflateInit(level);\n\t\tz.next_out = buf;\n\n\t\tthat.append = function(data, onprogress) {\n\t\t\tvar err, buffers = [], lastIndex = 0, bufferIndex = 0, bufferSize = 0, array;\n\t\t\tif (!data.length)\n\t\t\t\treturn;\n\t\t\tz.next_in_index = 0;\n\t\t\tz.next_in = data;\n\t\t\tz.avail_in = data.length;\n\t\t\tdo {\n\t\t\t\tz.next_out_index = 0;\n\t\t\t\tz.avail_out = bufsize;\n\t\t\t\terr = z.deflate(flush);\n\t\t\t\tif (err != Z_OK)\n\t\t\t\t\tthrow new Error(\"deflating: \" + z.msg);\n\t\t\t\tif (z.next_out_index)\n\t\t\t\t\tif (z.next_out_index == bufsize)\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf));\n\t\t\t\t\telse\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));\n\t\t\t\tbufferSize += z.next_out_index;\n\t\t\t\tif (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {\n\t\t\t\t\tonprogress(z.next_in_index);\n\t\t\t\t\tlastIndex = z.next_in_index;\n\t\t\t\t}\n\t\t\t} while (z.avail_in > 0 || z.avail_out === 0);\n\t\t\tarray = new Uint8Array(bufferSize);\n\t\t\tbuffers.forEach(function(chunk) {\n\t\t\t\tarray.set(chunk, bufferIndex);\n\t\t\t\tbufferIndex += chunk.length;\n\t\t\t});\n\t\t\treturn array;\n\t\t};\n\t\tthat.flush = function() {\n\t\t\tvar err, buffers = [], bufferIndex = 0, bufferSize = 0, array;\n\t\t\tdo {\n\t\t\t\tz.next_out_index = 0;\n\t\t\t\tz.avail_out = bufsize;\n\t\t\t\terr = z.deflate(Z_FINISH);\n\t\t\t\tif (err != Z_STREAM_END && err != Z_OK)\n\t\t\t\t\tthrow new Error(\"deflating: \" + z.msg);\n\t\t\t\tif (bufsize - z.avail_out > 0)\n\t\t\t\t\tbuffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));\n\t\t\t\tbufferSize += z.next_out_index;\n\t\t\t} while (z.avail_in > 0 || z.avail_out === 0);\n\t\t\tz.deflateEnd();\n\t\t\tarray = new Uint8Array(bufferSize);\n\t\t\tbuffers.forEach(function(chunk) {\n\t\t\t\tarray.set(chunk, bufferIndex);\n\t\t\t\tbufferIndex += chunk.length;\n\t\t\t});\n\t\t\treturn array;\n\t\t};\n\t}\n\n\t// 'zip' may not be defined in z-worker and some tests\n\tvar env = global.zip || global;\n\tenv.Deflater = env._jzlib_Deflater = Deflater;\n})(this);\n")],
  inflater: [zWorker, createUrl("/*\n Copyright (c) 2013 Gildas Lormeau. All rights reserved.\n\n Redistribution and use in source and binary forms, with or without\n modification, are permitted provided that the following conditions are met:\n\n 1. Redistributions of source code must retain the above copyright notice,\n this list of conditions and the following disclaimer.\n\n 2. Redistributions in binary form must reproduce the above copyright \n notice, this list of conditions and the following disclaimer in \n the documentation and/or other materials provided with the distribution.\n\n 3. The names of the authors may not be used to endorse or promote products\n derived from this software without specific prior written permission.\n\n THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,\n INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND\n FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,\n INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,\n INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,\n OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF\n LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING\n NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,\n EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n/*\n * This program is based on JZlib 1.0.2 ymnk, JCraft,Inc.\n * JZlib is based on zlib-1.1.3, so all credit should go authors\n * Jean-loup Gailly(jloup@gzip.org) and Mark Adler(madler@alumni.caltech.edu)\n * and contributors of zlib.\n */\n\n(function(global) {\n\t\"use strict\";\n\n\t// Global\n\tvar MAX_BITS = 15;\n\n\tvar Z_OK = 0;\n\tvar Z_STREAM_END = 1;\n\tvar Z_NEED_DICT = 2;\n\tvar Z_STREAM_ERROR = -2;\n\tvar Z_DATA_ERROR = -3;\n\tvar Z_MEM_ERROR = -4;\n\tvar Z_BUF_ERROR = -5;\n\n\tvar inflate_mask = [ 0x00000000, 0x00000001, 0x00000003, 0x00000007, 0x0000000f, 0x0000001f, 0x0000003f, 0x0000007f, 0x000000ff, 0x000001ff, 0x000003ff,\n\t\t\t0x000007ff, 0x00000fff, 0x00001fff, 0x00003fff, 0x00007fff, 0x0000ffff ];\n\n\tvar MANY = 1440;\n\n\t// JZlib version : \"1.0.2\"\n\tvar Z_NO_FLUSH = 0;\n\tvar Z_FINISH = 4;\n\n\t// InfTree\n\tvar fixed_bl = 9;\n\tvar fixed_bd = 5;\n\n\tvar fixed_tl = [ 96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9, 192, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 160, 0, 8, 0,\n\t\t\t0, 8, 128, 0, 8, 64, 0, 9, 224, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 144, 83, 7, 59, 0, 8, 120, 0, 8, 56, 0, 9, 208, 81, 7, 17, 0, 8, 104, 0, 8, 40,\n\t\t\t0, 9, 176, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 240, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8, 227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 200, 81, 7, 13,\n\t\t\t0, 8, 100, 0, 8, 36, 0, 9, 168, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 232, 80, 7, 8, 0, 8, 92, 0, 8, 28, 0, 9, 152, 84, 7, 83, 0, 8, 124, 0, 8, 60,\n\t\t\t0, 9, 216, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 184, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9, 248, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7,\n\t\t\t35, 0, 8, 114, 0, 8, 50, 0, 9, 196, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 164, 0, 8, 2, 0, 8, 130, 0, 8, 66, 0, 9, 228, 80, 7, 7, 0, 8, 90, 0, 8,\n\t\t\t26, 0, 9, 148, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 212, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9, 180, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 244, 80,\n\t\t\t7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 204, 81, 7, 15, 0, 8, 102, 0, 8, 38, 0, 9, 172, 0, 8, 6, 0, 8, 134, 0,\n\t\t\t8, 70, 0, 9, 236, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 156, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9, 220, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 188, 0,\n\t\t\t8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 252, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0, 8, 113, 0, 8, 49, 0, 9, 194, 80, 7, 10, 0, 8, 97,\n\t\t\t0, 8, 33, 0, 9, 162, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 226, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9, 146, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 210,\n\t\t\t81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 178, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 242, 80, 7, 4, 0, 8, 85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117,\n\t\t\t0, 8, 53, 0, 9, 202, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 170, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9, 234, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 154,\n\t\t\t84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 218, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 186, 0, 8, 13, 0, 8, 141, 0, 8, 77, 0, 9, 250, 80, 7, 3, 0, 8, 83,\n\t\t\t0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 198, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9, 166, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 230,\n\t\t\t80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 150, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 214, 82, 7, 19, 0, 8, 107, 0, 8, 43, 0, 9, 182, 0, 8, 11, 0, 8, 139,\n\t\t\t0, 8, 75, 0, 9, 246, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9, 206, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 174,\n\t\t\t0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 238, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 158, 84, 7, 99, 0, 8, 127, 0, 8, 63, 0, 9, 222, 82, 7, 27, 0, 8, 111,\n\t\t\t0, 8, 47, 0, 9, 190, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 254, 96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9,\n\t\t\t193, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 161, 0, 8, 0, 0, 8, 128, 0, 8, 64, 0, 9, 225, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 145, 83, 7, 59, 0, 8,\n\t\t\t120, 0, 8, 56, 0, 9, 209, 81, 7, 17, 0, 8, 104, 0, 8, 40, 0, 9, 177, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 241, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8,\n\t\t\t227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 201, 81, 7, 13, 0, 8, 100, 0, 8, 36, 0, 9, 169, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 233, 80, 7, 8, 0, 8,\n\t\t\t92, 0, 8, 28, 0, 9, 153, 84, 7, 83, 0, 8, 124, 0, 8, 60, 0, 9, 217, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 185, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9,\n\t\t\t249, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7, 35, 0, 8, 114, 0, 8, 50, 0, 9, 197, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 165, 0, 8, 2, 0, 8,\n\t\t\t130, 0, 8, 66, 0, 9, 229, 80, 7, 7, 0, 8, 90, 0, 8, 26, 0, 9, 149, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 213, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9,\n\t\t\t181, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 245, 80, 7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 205, 81, 7, 15, 0, 8,\n\t\t\t102, 0, 8, 38, 0, 9, 173, 0, 8, 6, 0, 8, 134, 0, 8, 70, 0, 9, 237, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 157, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9,\n\t\t\t221, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 189, 0, 8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 253, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0,\n\t\t\t8, 113, 0, 8, 49, 0, 9, 195, 80, 7, 10, 0, 8, 97, 0, 8, 33, 0, 9, 163, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 227, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9,\n\t\t\t147, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 211, 81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 179, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 243, 80, 7, 4, 0, 8,\n\t\t\t85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117, 0, 8, 53, 0, 9, 203, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 171, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9,\n\t\t\t235, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 155, 84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 219, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 187, 0, 8, 13, 0, 8,\n\t\t\t141, 0, 8, 77, 0, 9, 251, 80, 7, 3, 0, 8, 83, 0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 199, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9,\n\t\t\t167, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 231, 80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 151, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 215, 82, 7, 19, 0, 8,\n\t\t\t107, 0, 8, 43, 0, 9, 183, 0, 8, 11, 0, 8, 139, 0, 8, 75, 0, 9, 247, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9,\n\t\t\t207, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 175, 0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 239, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 159, 84, 7, 99, 0, 8,\n\t\t\t127, 0, 8, 63, 0, 9, 223, 82, 7, 27, 0, 8, 111, 0, 8, 47, 0, 9, 191, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 255 ];\n\tvar fixed_td = [ 80, 5, 1, 87, 5, 257, 83, 5, 17, 91, 5, 4097, 81, 5, 5, 89, 5, 1025, 85, 5, 65, 93, 5, 16385, 80, 5, 3, 88, 5, 513, 84, 5, 33, 92, 5,\n\t\t\t8193, 82, 5, 9, 90, 5, 2049, 86, 5, 129, 192, 5, 24577, 80, 5, 2, 87, 5, 385, 83, 5, 25, 91, 5, 6145, 81, 5, 7, 89, 5, 1537, 85, 5, 97, 93, 5,\n\t\t\t24577, 80, 5, 4, 88, 5, 769, 84, 5, 49, 92, 5, 12289, 82, 5, 13, 90, 5, 3073, 86, 5, 193, 192, 5, 24577 ];\n\n\t// Tables for deflate from PKZIP's appnote.txt.\n\tvar cplens = [ // Copy lengths for literal codes 257..285\n\t3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0 ];\n\n\t// see note #13 above about 258\n\tvar cplext = [ // Extra bits for literal codes 257..285\n\t0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 112, 112 // 112==invalid\n\t];\n\n\tvar cpdist = [ // Copy offsets for distance codes 0..29\n\t1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577 ];\n\n\tvar cpdext = [ // Extra bits for distance codes\n\t0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 ];\n\n\t// If BMAX needs to be larger than 16, then h and x[] should be uLong.\n\tvar BMAX = 15; // maximum bit length of any code\n\n\tfunction InfTree() {\n\t\tvar that = this;\n\n\t\tvar hn; // hufts used in space\n\t\tvar v; // work area for huft_build\n\t\tvar c; // bit length count table\n\t\tvar r; // table entry for structure assignment\n\t\tvar u; // table stack\n\t\tvar x; // bit offsets, then code stack\n\n\t\tfunction huft_build(b, // code lengths in bits (all assumed <=\n\t\t// BMAX)\n\t\tbindex, n, // number of codes (assumed <= 288)\n\t\ts, // number of simple-valued codes (0..s-1)\n\t\td, // list of base values for non-simple codes\n\t\te, // list of extra bits for non-simple codes\n\t\tt, // result: starting table\n\t\tm, // maximum lookup bits, returns actual\n\t\thp,// space for trees\n\t\thn,// hufts used in space\n\t\tv // working area: values in order of bit length\n\t\t) {\n\t\t\t// Given a list of code lengths and a maximum table size, make a set of\n\t\t\t// tables to decode that set of codes. Return Z_OK on success,\n\t\t\t// Z_BUF_ERROR\n\t\t\t// if the given code set is incomplete (the tables are still built in\n\t\t\t// this\n\t\t\t// case), Z_DATA_ERROR if the input is invalid (an over-subscribed set\n\t\t\t// of\n\t\t\t// lengths), or Z_MEM_ERROR if not enough memory.\n\n\t\t\tvar a; // counter for codes of length k\n\t\t\tvar f; // i repeats in table every f entries\n\t\t\tvar g; // maximum code length\n\t\t\tvar h; // table level\n\t\t\tvar i; // counter, current code\n\t\t\tvar j; // counter\n\t\t\tvar k; // number of bits in current code\n\t\t\tvar l; // bits per table (returned in m)\n\t\t\tvar mask; // (1 << w) - 1, to avoid cc -O bug on HP\n\t\t\tvar p; // pointer into c[], b[], or v[]\n\t\t\tvar q; // points to current table\n\t\t\tvar w; // bits before this table == (l * h)\n\t\t\tvar xp; // pointer into x\n\t\t\tvar y; // number of dummy codes added\n\t\t\tvar z; // number of entries in current table\n\n\t\t\t// Generate counts for each bit length\n\n\t\t\tp = 0;\n\t\t\ti = n;\n\t\t\tdo {\n\t\t\t\tc[b[bindex + p]]++;\n\t\t\t\tp++;\n\t\t\t\ti--; // assume all entries <= BMAX\n\t\t\t} while (i !== 0);\n\n\t\t\tif (c[0] == n) { // null input--all zero length codes\n\t\t\t\tt[0] = -1;\n\t\t\t\tm[0] = 0;\n\t\t\t\treturn Z_OK;\n\t\t\t}\n\n\t\t\t// Find minimum and maximum length, bound *m by those\n\t\t\tl = m[0];\n\t\t\tfor (j = 1; j <= BMAX; j++)\n\t\t\t\tif (c[j] !== 0)\n\t\t\t\t\tbreak;\n\t\t\tk = j; // minimum code length\n\t\t\tif (l < j) {\n\t\t\t\tl = j;\n\t\t\t}\n\t\t\tfor (i = BMAX; i !== 0; i--) {\n\t\t\t\tif (c[i] !== 0)\n\t\t\t\t\tbreak;\n\t\t\t}\n\t\t\tg = i; // maximum code length\n\t\t\tif (l > i) {\n\t\t\t\tl = i;\n\t\t\t}\n\t\t\tm[0] = l;\n\n\t\t\t// Adjust last length count to fill out codes, if needed\n\t\t\tfor (y = 1 << j; j < i; j++, y <<= 1) {\n\t\t\t\tif ((y -= c[j]) < 0) {\n\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\t}\n\t\t\t}\n\t\t\tif ((y -= c[i]) < 0) {\n\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t}\n\t\t\tc[i] += y;\n\n\t\t\t// Generate starting offsets into the value table for each length\n\t\t\tx[1] = j = 0;\n\t\t\tp = 1;\n\t\t\txp = 2;\n\t\t\twhile (--i !== 0) { // note that i == g from above\n\t\t\t\tx[xp] = (j += c[p]);\n\t\t\t\txp++;\n\t\t\t\tp++;\n\t\t\t}\n\n\t\t\t// Make a table of values in order of bit lengths\n\t\t\ti = 0;\n\t\t\tp = 0;\n\t\t\tdo {\n\t\t\t\tif ((j = b[bindex + p]) !== 0) {\n\t\t\t\t\tv[x[j]++] = i;\n\t\t\t\t}\n\t\t\t\tp++;\n\t\t\t} while (++i < n);\n\t\t\tn = x[g]; // set n to length of v\n\n\t\t\t// Generate the Huffman codes and for each, make the table entries\n\t\t\tx[0] = i = 0; // first Huffman code is zero\n\t\t\tp = 0; // grab values in bit order\n\t\t\th = -1; // no tables yet--level -1\n\t\t\tw = -l; // bits decoded == (l * h)\n\t\t\tu[0] = 0; // just to keep compilers happy\n\t\t\tq = 0; // ditto\n\t\t\tz = 0; // ditto\n\n\t\t\t// go through the bit lengths (k already is bits in shortest code)\n\t\t\tfor (; k <= g; k++) {\n\t\t\t\ta = c[k];\n\t\t\t\twhile (a-- !== 0) {\n\t\t\t\t\t// here i is the Huffman code of length k bits for value *p\n\t\t\t\t\t// make tables up to required level\n\t\t\t\t\twhile (k > w + l) {\n\t\t\t\t\t\th++;\n\t\t\t\t\t\tw += l; // previous table always l bits\n\t\t\t\t\t\t// compute minimum size table less than or equal to l bits\n\t\t\t\t\t\tz = g - w;\n\t\t\t\t\t\tz = (z > l) ? l : z; // table size upper limit\n\t\t\t\t\t\tif ((f = 1 << (j = k - w)) > a + 1) { // try a k-w bit table\n\t\t\t\t\t\t\t// too few codes for\n\t\t\t\t\t\t\t// k-w bit table\n\t\t\t\t\t\t\tf -= a + 1; // deduct codes from patterns left\n\t\t\t\t\t\t\txp = k;\n\t\t\t\t\t\t\tif (j < z) {\n\t\t\t\t\t\t\t\twhile (++j < z) { // try smaller tables up to z bits\n\t\t\t\t\t\t\t\t\tif ((f <<= 1) <= c[++xp])\n\t\t\t\t\t\t\t\t\t\tbreak; // enough codes to use up j bits\n\t\t\t\t\t\t\t\t\tf -= c[xp]; // else deduct codes from patterns\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tz = 1 << j; // table entries for j-bit table\n\n\t\t\t\t\t\t// allocate new table\n\t\t\t\t\t\tif (hn[0] + z > MANY) { // (note: doesn't matter for fixed)\n\t\t\t\t\t\t\treturn Z_DATA_ERROR; // overflow of MANY\n\t\t\t\t\t\t}\n\t\t\t\t\t\tu[h] = q = /* hp+ */hn[0]; // DEBUG\n\t\t\t\t\t\thn[0] += z;\n\n\t\t\t\t\t\t// connect to last table, if there is one\n\t\t\t\t\t\tif (h !== 0) {\n\t\t\t\t\t\t\tx[h] = i; // save pattern for backing up\n\t\t\t\t\t\t\tr[0] = /* (byte) */j; // bits in this table\n\t\t\t\t\t\t\tr[1] = /* (byte) */l; // bits to dump before this table\n\t\t\t\t\t\t\tj = i >>> (w - l);\n\t\t\t\t\t\t\tr[2] = /* (int) */(q - u[h - 1] - j); // offset to this table\n\t\t\t\t\t\t\thp.set(r, (u[h - 1] + j) * 3);\n\t\t\t\t\t\t\t// to\n\t\t\t\t\t\t\t// last\n\t\t\t\t\t\t\t// table\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tt[0] = q; // first table is returned result\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t// set up table entry in r\n\t\t\t\t\tr[1] = /* (byte) */(k - w);\n\t\t\t\t\tif (p >= n) {\n\t\t\t\t\t\tr[0] = 128 + 64; // out of values--invalid code\n\t\t\t\t\t} else if (v[p] < s) {\n\t\t\t\t\t\tr[0] = /* (byte) */(v[p] < 256 ? 0 : 32 + 64); // 256 is\n\t\t\t\t\t\t// end-of-block\n\t\t\t\t\t\tr[2] = v[p++]; // simple code is just the value\n\t\t\t\t\t} else {\n\t\t\t\t\t\tr[0] = /* (byte) */(e[v[p] - s] + 16 + 64); // non-simple--look\n\t\t\t\t\t\t// up in lists\n\t\t\t\t\t\tr[2] = d[v[p++] - s];\n\t\t\t\t\t}\n\n\t\t\t\t\t// fill code-like entries with r\n\t\t\t\t\tf = 1 << (k - w);\n\t\t\t\t\tfor (j = i >>> w; j < z; j += f) {\n\t\t\t\t\t\thp.set(r, (q + j) * 3);\n\t\t\t\t\t}\n\n\t\t\t\t\t// backwards increment the k-bit code i\n\t\t\t\t\tfor (j = 1 << (k - 1); (i & j) !== 0; j >>>= 1) {\n\t\t\t\t\t\ti ^= j;\n\t\t\t\t\t}\n\t\t\t\t\ti ^= j;\n\n\t\t\t\t\t// backup over finished tables\n\t\t\t\t\tmask = (1 << w) - 1; // needed on HP, cc -O bug\n\t\t\t\t\twhile ((i & mask) != x[h]) {\n\t\t\t\t\t\th--; // don't need to update q\n\t\t\t\t\t\tw -= l;\n\t\t\t\t\t\tmask = (1 << w) - 1;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t\t// Return Z_BUF_ERROR if we were given an incomplete table\n\t\t\treturn y !== 0 && g != 1 ? Z_BUF_ERROR : Z_OK;\n\t\t}\n\n\t\tfunction initWorkArea(vsize) {\n\t\t\tvar i;\n\t\t\tif (!hn) {\n\t\t\t\thn = []; // []; //new Array(1);\n\t\t\t\tv = []; // new Array(vsize);\n\t\t\t\tc = new Int32Array(BMAX + 1); // new Array(BMAX + 1);\n\t\t\t\tr = []; // new Array(3);\n\t\t\t\tu = new Int32Array(BMAX); // new Array(BMAX);\n\t\t\t\tx = new Int32Array(BMAX + 1); // new Array(BMAX + 1);\n\t\t\t}\n\t\t\tif (v.length < vsize) {\n\t\t\t\tv = []; // new Array(vsize);\n\t\t\t}\n\t\t\tfor (i = 0; i < vsize; i++) {\n\t\t\t\tv[i] = 0;\n\t\t\t}\n\t\t\tfor (i = 0; i < BMAX + 1; i++) {\n\t\t\t\tc[i] = 0;\n\t\t\t}\n\t\t\tfor (i = 0; i < 3; i++) {\n\t\t\t\tr[i] = 0;\n\t\t\t}\n\t\t\t// for(int i=0; i<BMAX; i++){u[i]=0;}\n\t\t\tu.set(c.subarray(0, BMAX), 0);\n\t\t\t// for(int i=0; i<BMAX+1; i++){x[i]=0;}\n\t\t\tx.set(c.subarray(0, BMAX + 1), 0);\n\t\t}\n\n\t\tthat.inflate_trees_bits = function(c, // 19 code lengths\n\t\tbb, // bits tree desired/actual depth\n\t\ttb, // bits tree result\n\t\thp, // space for trees\n\t\tz // for messages\n\t\t) {\n\t\t\tvar result;\n\t\t\tinitWorkArea(19);\n\t\t\thn[0] = 0;\n\t\t\tresult = huft_build(c, 0, 19, 19, null, null, tb, bb, hp, hn, v);\n\n\t\t\tif (result == Z_DATA_ERROR) {\n\t\t\t\tz.msg = \"oversubscribed dynamic bit lengths tree\";\n\t\t\t} else if (result == Z_BUF_ERROR || bb[0] === 0) {\n\t\t\t\tz.msg = \"incomplete dynamic bit lengths tree\";\n\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t}\n\t\t\treturn result;\n\t\t};\n\n\t\tthat.inflate_trees_dynamic = function(nl, // number of literal/length codes\n\t\tnd, // number of distance codes\n\t\tc, // that many (total) code lengths\n\t\tbl, // literal desired/actual bit depth\n\t\tbd, // distance desired/actual bit depth\n\t\ttl, // literal/length tree result\n\t\ttd, // distance tree result\n\t\thp, // space for trees\n\t\tz // for messages\n\t\t) {\n\t\t\tvar result;\n\n\t\t\t// build literal/length tree\n\t\t\tinitWorkArea(288);\n\t\t\thn[0] = 0;\n\t\t\tresult = huft_build(c, 0, nl, 257, cplens, cplext, tl, bl, hp, hn, v);\n\t\t\tif (result != Z_OK || bl[0] === 0) {\n\t\t\t\tif (result == Z_DATA_ERROR) {\n\t\t\t\t\tz.msg = \"oversubscribed literal/length tree\";\n\t\t\t\t} else if (result != Z_MEM_ERROR) {\n\t\t\t\t\tz.msg = \"incomplete literal/length tree\";\n\t\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t\t}\n\t\t\t\treturn result;\n\t\t\t}\n\n\t\t\t// build distance tree\n\t\t\tinitWorkArea(288);\n\t\t\tresult = huft_build(c, nl, nd, 0, cpdist, cpdext, td, bd, hp, hn, v);\n\n\t\t\tif (result != Z_OK || (bd[0] === 0 && nl > 257)) {\n\t\t\t\tif (result == Z_DATA_ERROR) {\n\t\t\t\t\tz.msg = \"oversubscribed distance tree\";\n\t\t\t\t} else if (result == Z_BUF_ERROR) {\n\t\t\t\t\tz.msg = \"incomplete distance tree\";\n\t\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t\t} else if (result != Z_MEM_ERROR) {\n\t\t\t\t\tz.msg = \"empty distance tree with lengths\";\n\t\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t\t}\n\t\t\t\treturn result;\n\t\t\t}\n\n\t\t\treturn Z_OK;\n\t\t};\n\n\t}\n\n\tInfTree.inflate_trees_fixed = function(bl, // literal desired/actual bit depth\n\tbd, // distance desired/actual bit depth\n\ttl,// literal/length tree result\n\ttd// distance tree result\n\t) {\n\t\tbl[0] = fixed_bl;\n\t\tbd[0] = fixed_bd;\n\t\ttl[0] = fixed_tl;\n\t\ttd[0] = fixed_td;\n\t\treturn Z_OK;\n\t};\n\n\t// InfCodes\n\n\t// waiting for \"i:\"=input,\n\t// \"o:\"=output,\n\t// \"x:\"=nothing\n\tvar START = 0; // x: set up for LEN\n\tvar LEN = 1; // i: get length/literal/eob next\n\tvar LENEXT = 2; // i: getting length extra (have base)\n\tvar DIST = 3; // i: get distance next\n\tvar DISTEXT = 4;// i: getting distance extra\n\tvar COPY = 5; // o: copying bytes in window, waiting\n\t// for space\n\tvar LIT = 6; // o: got literal, waiting for output\n\t// space\n\tvar WASH = 7; // o: got eob, possibly still output\n\t// waiting\n\tvar END = 8; // x: got eob and all data flushed\n\tvar BADCODE = 9;// x: got error\n\n\tfunction InfCodes() {\n\t\tvar that = this;\n\n\t\tvar mode; // current inflate_codes mode\n\n\t\t// mode dependent information\n\t\tvar len = 0;\n\n\t\tvar tree; // pointer into tree\n\t\tvar tree_index = 0;\n\t\tvar need = 0; // bits needed\n\n\t\tvar lit = 0;\n\n\t\t// if EXT or COPY, where and how much\n\t\tvar get = 0; // bits to get for extra\n\t\tvar dist = 0; // distance back to copy from\n\n\t\tvar lbits = 0; // ltree bits decoded per branch\n\t\tvar dbits = 0; // dtree bits decoder per branch\n\t\tvar ltree; // literal/length/eob tree\n\t\tvar ltree_index = 0; // literal/length/eob tree\n\t\tvar dtree; // distance tree\n\t\tvar dtree_index = 0; // distance tree\n\n\t\t// Called with number of bytes left to write in window at least 258\n\t\t// (the maximum string length) and number of input bytes available\n\t\t// at least ten. The ten bytes are six bytes for the longest length/\n\t\t// distance pair plus four bytes for overloading the bit buffer.\n\n\t\tfunction inflate_fast(bl, bd, tl, tl_index, td, td_index, s, z) {\n\t\t\tvar t; // temporary pointer\n\t\t\tvar tp; // temporary pointer\n\t\t\tvar tp_index; // temporary pointer\n\t\t\tvar e; // extra bits or operation\n\t\t\tvar b; // bit buffer\n\t\t\tvar k; // bits in bit buffer\n\t\t\tvar p; // input data pointer\n\t\t\tvar n; // bytes available there\n\t\t\tvar q; // output window write pointer\n\t\t\tvar m; // bytes to end of window or read pointer\n\t\t\tvar ml; // mask for literal/length tree\n\t\t\tvar md; // mask for distance tree\n\t\t\tvar c; // bytes to copy\n\t\t\tvar d; // distance back to copy from\n\t\t\tvar r; // copy source pointer\n\n\t\t\tvar tp_index_t_3; // (tp_index+t)*3\n\n\t\t\t// load input, output, bit values\n\t\t\tp = z.next_in_index;\n\t\t\tn = z.avail_in;\n\t\t\tb = s.bitb;\n\t\t\tk = s.bitk;\n\t\t\tq = s.write;\n\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t// initialize masks\n\t\t\tml = inflate_mask[bl];\n\t\t\tmd = inflate_mask[bd];\n\n\t\t\t// do until not enough input or output space for fast loop\n\t\t\tdo { // assume called with m >= 258 && n >= 10\n\t\t\t\t// get literal/length code\n\t\t\t\twhile (k < (20)) { // max bits for literal/length code\n\t\t\t\t\tn--;\n\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\tk += 8;\n\t\t\t\t}\n\n\t\t\t\tt = b & ml;\n\t\t\t\ttp = tl;\n\t\t\t\ttp_index = tl_index;\n\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\tif ((e = tp[tp_index_t_3]) === 0) {\n\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\ts.window[q++] = /* (byte) */tp[tp_index_t_3 + 2];\n\t\t\t\t\tm--;\n\t\t\t\t\tcontinue;\n\t\t\t\t}\n\t\t\t\tdo {\n\n\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\tif ((e & 16) !== 0) {\n\t\t\t\t\t\te &= 15;\n\t\t\t\t\t\tc = tp[tp_index_t_3 + 2] + (/* (int) */b & inflate_mask[e]);\n\n\t\t\t\t\t\tb >>= e;\n\t\t\t\t\t\tk -= e;\n\n\t\t\t\t\t\t// decode distance base of block to copy\n\t\t\t\t\t\twhile (k < (15)) { // max bits for distance code\n\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tt = b & md;\n\t\t\t\t\t\ttp = td;\n\t\t\t\t\t\ttp_index = td_index;\n\t\t\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\t\t\te = tp[tp_index_t_3];\n\n\t\t\t\t\t\tdo {\n\n\t\t\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\t\t\tif ((e & 16) !== 0) {\n\t\t\t\t\t\t\t\t// get extra bits to add to distance base\n\t\t\t\t\t\t\t\te &= 15;\n\t\t\t\t\t\t\t\twhile (k < (e)) { // get extra bits (up to 13)\n\t\t\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\td = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]);\n\n\t\t\t\t\t\t\t\tb >>= (e);\n\t\t\t\t\t\t\t\tk -= (e);\n\n\t\t\t\t\t\t\t\t// do the copy\n\t\t\t\t\t\t\t\tm -= c;\n\t\t\t\t\t\t\t\tif (q >= d) { // offset before dest\n\t\t\t\t\t\t\t\t\t// just copy\n\t\t\t\t\t\t\t\t\tr = q - d;\n\t\t\t\t\t\t\t\t\tif (q - r > 0 && 2 > (q - r)) {\n\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++]; // minimum\n\t\t\t\t\t\t\t\t\t\t// count is\n\t\t\t\t\t\t\t\t\t\t// three,\n\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++]; // so unroll\n\t\t\t\t\t\t\t\t\t\t// loop a\n\t\t\t\t\t\t\t\t\t\t// little\n\t\t\t\t\t\t\t\t\t\tc -= 2;\n\t\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\t\ts.window.set(s.window.subarray(r, r + 2), q);\n\t\t\t\t\t\t\t\t\t\tq += 2;\n\t\t\t\t\t\t\t\t\t\tr += 2;\n\t\t\t\t\t\t\t\t\t\tc -= 2;\n\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t} else { // else offset after destination\n\t\t\t\t\t\t\t\t\tr = q - d;\n\t\t\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\t\t\tr += s.end; // force pointer in window\n\t\t\t\t\t\t\t\t\t} while (r < 0); // covers invalid distances\n\t\t\t\t\t\t\t\t\te = s.end - r;\n\t\t\t\t\t\t\t\t\tif (c > e) { // if source crosses,\n\t\t\t\t\t\t\t\t\t\tc -= e; // wrapped copy\n\t\t\t\t\t\t\t\t\t\tif (q - r > 0 && e > (q - r)) {\n\t\t\t\t\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++];\n\t\t\t\t\t\t\t\t\t\t\t} while (--e !== 0);\n\t\t\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\t\t\ts.window.set(s.window.subarray(r, r + e), q);\n\t\t\t\t\t\t\t\t\t\t\tq += e;\n\t\t\t\t\t\t\t\t\t\t\tr += e;\n\t\t\t\t\t\t\t\t\t\t\te = 0;\n\t\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t\t\tr = 0; // copy rest from start of window\n\t\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\t// copy all or what's left\n\t\t\t\t\t\t\t\tif (q - r > 0 && c > (q - r)) {\n\t\t\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++];\n\t\t\t\t\t\t\t\t\t} while (--c !== 0);\n\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\ts.window.set(s.window.subarray(r, r + c), q);\n\t\t\t\t\t\t\t\t\tq += c;\n\t\t\t\t\t\t\t\t\tr += c;\n\t\t\t\t\t\t\t\t\tc = 0;\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t\t} else if ((e & 64) === 0) {\n\t\t\t\t\t\t\t\tt += tp[tp_index_t_3 + 2];\n\t\t\t\t\t\t\t\tt += (b & inflate_mask[e]);\n\t\t\t\t\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\t\t\t\t\te = tp[tp_index_t_3];\n\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\tz.msg = \"invalid distance code\";\n\n\t\t\t\t\t\t\t\tc = z.avail_in - n;\n\t\t\t\t\t\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\t\t\t\t\t\tn += c;\n\t\t\t\t\t\t\t\tp -= c;\n\t\t\t\t\t\t\t\tk -= c << 3;\n\n\t\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\ts.write = q;\n\n\t\t\t\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t} while (true);\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ((e & 64) === 0) {\n\t\t\t\t\t\tt += tp[tp_index_t_3 + 2];\n\t\t\t\t\t\tt += (b & inflate_mask[e]);\n\t\t\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\t\t\tif ((e = tp[tp_index_t_3]) === 0) {\n\n\t\t\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\t\t\ts.window[q++] = /* (byte) */tp[tp_index_t_3 + 2];\n\t\t\t\t\t\t\tm--;\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\t\t\t\t\t} else if ((e & 32) !== 0) {\n\n\t\t\t\t\t\tc = z.avail_in - n;\n\t\t\t\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\t\t\t\tn += c;\n\t\t\t\t\t\tp -= c;\n\t\t\t\t\t\tk -= c << 3;\n\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\n\t\t\t\t\t\treturn Z_STREAM_END;\n\t\t\t\t\t} else {\n\t\t\t\t\t\tz.msg = \"invalid literal/length code\";\n\n\t\t\t\t\t\tc = z.avail_in - n;\n\t\t\t\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\t\t\t\tn += c;\n\t\t\t\t\t\tp -= c;\n\t\t\t\t\t\tk -= c << 3;\n\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\n\t\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\t\t}\n\t\t\t\t} while (true);\n\t\t\t} while (m >= 258 && n >= 10);\n\n\t\t\t// not enough input or output--restore pointers and return\n\t\t\tc = z.avail_in - n;\n\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\tn += c;\n\t\t\tp -= c;\n\t\t\tk -= c << 3;\n\n\t\t\ts.bitb = b;\n\t\t\ts.bitk = k;\n\t\t\tz.avail_in = n;\n\t\t\tz.total_in += p - z.next_in_index;\n\t\t\tz.next_in_index = p;\n\t\t\ts.write = q;\n\n\t\t\treturn Z_OK;\n\t\t}\n\n\t\tthat.init = function(bl, bd, tl, tl_index, td, td_index) {\n\t\t\tmode = START;\n\t\t\tlbits = /* (byte) */bl;\n\t\t\tdbits = /* (byte) */bd;\n\t\t\tltree = tl;\n\t\t\tltree_index = tl_index;\n\t\t\tdtree = td;\n\t\t\tdtree_index = td_index;\n\t\t\ttree = null;\n\t\t};\n\n\t\tthat.proc = function(s, z, r) {\n\t\t\tvar j; // temporary storage\n\t\t\tvar tindex; // temporary pointer\n\t\t\tvar e; // extra bits or operation\n\t\t\tvar b = 0; // bit buffer\n\t\t\tvar k = 0; // bits in bit buffer\n\t\t\tvar p = 0; // input data pointer\n\t\t\tvar n; // bytes available there\n\t\t\tvar q; // output window write pointer\n\t\t\tvar m; // bytes to end of window or read pointer\n\t\t\tvar f; // pointer to copy strings from\n\n\t\t\t// copy input/output information to locals (UPDATE macro restores)\n\t\t\tp = z.next_in_index;\n\t\t\tn = z.avail_in;\n\t\t\tb = s.bitb;\n\t\t\tk = s.bitk;\n\t\t\tq = s.write;\n\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t// process input and output based on current state\n\t\t\twhile (true) {\n\t\t\t\tswitch (mode) {\n\t\t\t\t// waiting for \"i:\"=input, \"o:\"=output, \"x:\"=nothing\n\t\t\t\tcase START: // x: set up for LEN\n\t\t\t\t\tif (m >= 258 && n >= 10) {\n\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\tr = inflate_fast(lbits, dbits, ltree, ltree_index, dtree, dtree_index, s, z);\n\n\t\t\t\t\t\tp = z.next_in_index;\n\t\t\t\t\t\tn = z.avail_in;\n\t\t\t\t\t\tb = s.bitb;\n\t\t\t\t\t\tk = s.bitk;\n\t\t\t\t\t\tq = s.write;\n\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\t\tif (r != Z_OK) {\n\t\t\t\t\t\t\tmode = r == Z_STREAM_END ? WASH : BADCODE;\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tneed = lbits;\n\t\t\t\t\ttree = ltree;\n\t\t\t\t\ttree_index = ltree_index;\n\n\t\t\t\t\tmode = LEN;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase LEN: // i: get length/literal/eob next\n\t\t\t\t\tj = need;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\ttindex = (tree_index + (b & inflate_mask[j])) * 3;\n\n\t\t\t\t\tb >>>= (tree[tindex + 1]);\n\t\t\t\t\tk -= (tree[tindex + 1]);\n\n\t\t\t\t\te = tree[tindex];\n\n\t\t\t\t\tif (e === 0) { // literal\n\t\t\t\t\t\tlit = tree[tindex + 2];\n\t\t\t\t\t\tmode = LIT;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 16) !== 0) { // length\n\t\t\t\t\t\tget = e & 15;\n\t\t\t\t\t\tlen = tree[tindex + 2];\n\t\t\t\t\t\tmode = LENEXT;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 64) === 0) { // next table\n\t\t\t\t\t\tneed = e;\n\t\t\t\t\t\ttree_index = tindex / 3 + tree[tindex + 2];\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 32) !== 0) { // end of block\n\t\t\t\t\t\tmode = WASH;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tmode = BADCODE; // invalid code\n\t\t\t\t\tz.msg = \"invalid literal/length code\";\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tcase LENEXT: // i: getting length extra (have base)\n\t\t\t\t\tj = get;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\tlen += (b & inflate_mask[j]);\n\n\t\t\t\t\tb >>= j;\n\t\t\t\t\tk -= j;\n\n\t\t\t\t\tneed = dbits;\n\t\t\t\t\ttree = dtree;\n\t\t\t\t\ttree_index = dtree_index;\n\t\t\t\t\tmode = DIST;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DIST: // i: get distance next\n\t\t\t\t\tj = need;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\ttindex = (tree_index + (b & inflate_mask[j])) * 3;\n\n\t\t\t\t\tb >>= tree[tindex + 1];\n\t\t\t\t\tk -= tree[tindex + 1];\n\n\t\t\t\t\te = (tree[tindex]);\n\t\t\t\t\tif ((e & 16) !== 0) { // distance\n\t\t\t\t\t\tget = e & 15;\n\t\t\t\t\t\tdist = tree[tindex + 2];\n\t\t\t\t\t\tmode = DISTEXT;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 64) === 0) { // next table\n\t\t\t\t\t\tneed = e;\n\t\t\t\t\t\ttree_index = tindex / 3 + tree[tindex + 2];\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tmode = BADCODE; // invalid code\n\t\t\t\t\tz.msg = \"invalid distance code\";\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tcase DISTEXT: // i: getting distance extra\n\t\t\t\t\tj = get;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\tdist += (b & inflate_mask[j]);\n\n\t\t\t\t\tb >>= j;\n\t\t\t\t\tk -= j;\n\n\t\t\t\t\tmode = COPY;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase COPY: // o: copying bytes in window, waiting for space\n\t\t\t\t\tf = q - dist;\n\t\t\t\t\twhile (f < 0) { // modulo window size-\"while\" instead\n\t\t\t\t\t\tf += s.end; // of \"if\" handles invalid distances\n\t\t\t\t\t}\n\t\t\t\t\twhile (len !== 0) {\n\n\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\t\tr = s.inflate_flush(z, r);\n\t\t\t\t\t\t\t\tq = s.write;\n\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\ts.window[q++] = s.window[f++];\n\t\t\t\t\t\tm--;\n\n\t\t\t\t\t\tif (f == s.end)\n\t\t\t\t\t\t\tf = 0;\n\t\t\t\t\t\tlen--;\n\t\t\t\t\t}\n\t\t\t\t\tmode = START;\n\t\t\t\t\tbreak;\n\t\t\t\tcase LIT: // o: got literal, waiting for output space\n\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\tr = s.inflate_flush(z, r);\n\t\t\t\t\t\t\tq = s.write;\n\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tr = Z_OK;\n\n\t\t\t\t\ts.window[q++] = /* (byte) */lit;\n\t\t\t\t\tm--;\n\n\t\t\t\t\tmode = START;\n\t\t\t\t\tbreak;\n\t\t\t\tcase WASH: // o: got eob, possibly more output\n\t\t\t\t\tif (k > 7) { // return unused byte, if any\n\t\t\t\t\t\tk -= 8;\n\t\t\t\t\t\tn++;\n\t\t\t\t\t\tp--; // can always return one\n\t\t\t\t\t}\n\n\t\t\t\t\ts.write = q;\n\t\t\t\t\tr = s.inflate_flush(z, r);\n\t\t\t\t\tq = s.write;\n\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\tif (s.read != s.write) {\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tmode = END;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase END:\n\t\t\t\t\tr = Z_STREAM_END;\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tcase BADCODE: // x: got error\n\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tdefault:\n\t\t\t\t\tr = Z_STREAM_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthat.free = function() {\n\t\t\t// ZFREE(z, c);\n\t\t};\n\n\t}\n\n\t// InfBlocks\n\n\t// Table for deflate from PKZIP's appnote.txt.\n\tvar border = [ // Order of the bit length code lengths\n\t16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];\n\n\tvar TYPE = 0; // get type bits (3, including end bit)\n\tvar LENS = 1; // get lengths for stored\n\tvar STORED = 2;// processing stored block\n\tvar TABLE = 3; // get table lengths\n\tvar BTREE = 4; // get bit lengths tree for a dynamic\n\t// block\n\tvar DTREE = 5; // get length, distance trees for a\n\t// dynamic block\n\tvar CODES = 6; // processing fixed or dynamic block\n\tvar DRY = 7; // output remaining window bytes\n\tvar DONELOCKS = 8; // finished last block, done\n\tvar BADBLOCKS = 9; // ot a data error--stuck here\n\n\tfunction InfBlocks(z, w) {\n\t\tvar that = this;\n\n\t\tvar mode = TYPE; // current inflate_block mode\n\n\t\tvar left = 0; // if STORED, bytes left to copy\n\n\t\tvar table = 0; // table lengths (14 bits)\n\t\tvar index = 0; // index into blens (or border)\n\t\tvar blens; // bit lengths of codes\n\t\tvar bb = [ 0 ]; // bit length tree depth\n\t\tvar tb = [ 0 ]; // bit length decoding tree\n\n\t\tvar codes = new InfCodes(); // if CODES, current state\n\n\t\tvar last = 0; // true if this block is the last block\n\n\t\tvar hufts = new Int32Array(MANY * 3); // single malloc for tree space\n\t\tvar check = 0; // check on output\n\t\tvar inftree = new InfTree();\n\n\t\tthat.bitk = 0; // bits in bit buffer\n\t\tthat.bitb = 0; // bit buffer\n\t\tthat.window = new Uint8Array(w); // sliding window\n\t\tthat.end = w; // one byte after sliding window\n\t\tthat.read = 0; // window read pointer\n\t\tthat.write = 0; // window write pointer\n\n\t\tthat.reset = function(z, c) {\n\t\t\tif (c)\n\t\t\t\tc[0] = check;\n\t\t\t// if (mode == BTREE || mode == DTREE) {\n\t\t\t// }\n\t\t\tif (mode == CODES) {\n\t\t\t\tcodes.free(z);\n\t\t\t}\n\t\t\tmode = TYPE;\n\t\t\tthat.bitk = 0;\n\t\t\tthat.bitb = 0;\n\t\t\tthat.read = that.write = 0;\n\t\t};\n\n\t\tthat.reset(z, null);\n\n\t\t// copy as much as possible from the sliding window to the output area\n\t\tthat.inflate_flush = function(z, r) {\n\t\t\tvar n;\n\t\t\tvar p;\n\t\t\tvar q;\n\n\t\t\t// local copies of source and destination pointers\n\t\t\tp = z.next_out_index;\n\t\t\tq = that.read;\n\n\t\t\t// compute number of bytes to copy as far as end of window\n\t\t\tn = /* (int) */((q <= that.write ? that.write : that.end) - q);\n\t\t\tif (n > z.avail_out)\n\t\t\t\tn = z.avail_out;\n\t\t\tif (n !== 0 && r == Z_BUF_ERROR)\n\t\t\t\tr = Z_OK;\n\n\t\t\t// update counters\n\t\t\tz.avail_out -= n;\n\t\t\tz.total_out += n;\n\n\t\t\t// copy as far as end of window\n\t\t\tz.next_out.set(that.window.subarray(q, q + n), p);\n\t\t\tp += n;\n\t\t\tq += n;\n\n\t\t\t// see if more to copy at beginning of window\n\t\t\tif (q == that.end) {\n\t\t\t\t// wrap pointers\n\t\t\t\tq = 0;\n\t\t\t\tif (that.write == that.end)\n\t\t\t\t\tthat.write = 0;\n\n\t\t\t\t// compute bytes to copy\n\t\t\t\tn = that.write - q;\n\t\t\t\tif (n > z.avail_out)\n\t\t\t\t\tn = z.avail_out;\n\t\t\t\tif (n !== 0 && r == Z_BUF_ERROR)\n\t\t\t\t\tr = Z_OK;\n\n\t\t\t\t// update counters\n\t\t\t\tz.avail_out -= n;\n\t\t\t\tz.total_out += n;\n\n\t\t\t\t// copy\n\t\t\t\tz.next_out.set(that.window.subarray(q, q + n), p);\n\t\t\t\tp += n;\n\t\t\t\tq += n;\n\t\t\t}\n\n\t\t\t// update pointers\n\t\t\tz.next_out_index = p;\n\t\t\tthat.read = q;\n\n\t\t\t// done\n\t\t\treturn r;\n\t\t};\n\n\t\tthat.proc = function(z, r) {\n\t\t\tvar t; // temporary storage\n\t\t\tvar b; // bit buffer\n\t\t\tvar k; // bits in bit buffer\n\t\t\tvar p; // input data pointer\n\t\t\tvar n; // bytes available there\n\t\t\tvar q; // output window write pointer\n\t\t\tvar m; // bytes to end of window or read pointer\n\n\t\t\tvar i;\n\n\t\t\t// copy input/output information to locals (UPDATE macro restores)\n\t\t\t// {\n\t\t\tp = z.next_in_index;\n\t\t\tn = z.avail_in;\n\t\t\tb = that.bitb;\n\t\t\tk = that.bitk;\n\t\t\t// }\n\t\t\t// {\n\t\t\tq = that.write;\n\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t// }\n\n\t\t\t// process input based on current state\n\t\t\t// DEBUG dtree\n\t\t\twhile (true) {\n\t\t\t\tswitch (mode) {\n\t\t\t\tcase TYPE:\n\n\t\t\t\t\twhile (k < (3)) {\n\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\t\t\t\t\tt = /* (int) */(b & 7);\n\t\t\t\t\tlast = t & 1;\n\n\t\t\t\t\tswitch (t >>> 1) {\n\t\t\t\t\tcase 0: // stored\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\t\t\t\t\t\tt = k & 7; // go to byte boundary\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (t);\n\t\t\t\t\t\tk -= (t);\n\t\t\t\t\t\t// }\n\t\t\t\t\t\tmode = LENS; // get length of stored block\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tcase 1: // fixed\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tvar bl = []; // new Array(1);\n\t\t\t\t\t\tvar bd = []; // new Array(1);\n\t\t\t\t\t\tvar tl = [ [] ]; // new Array(1);\n\t\t\t\t\t\tvar td = [ [] ]; // new Array(1);\n\n\t\t\t\t\t\tInfTree.inflate_trees_fixed(bl, bd, tl, td);\n\t\t\t\t\t\tcodes.init(bl[0], bd[0], tl[0], 0, td[0], 0);\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\tmode = CODES;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tcase 2: // dynamic\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\tmode = TABLE;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tcase 3: // illegal\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\tz.msg = \"invalid block type\";\n\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tbreak;\n\t\t\t\tcase LENS:\n\n\t\t\t\t\twhile (k < (32)) {\n\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ((((~b) >>> 16) & 0xffff) != (b & 0xffff)) {\n\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\tz.msg = \"invalid stored block lengths\";\n\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tleft = (b & 0xffff);\n\t\t\t\t\tb = k = 0; // dump bits\n\t\t\t\t\tmode = left !== 0 ? STORED : (last !== 0 ? DRY : TYPE);\n\t\t\t\t\tbreak;\n\t\t\t\tcase STORED:\n\t\t\t\t\tif (n === 0) {\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\n\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\tif (q == that.end && that.read !== 0) {\n\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\tr = that.inflate_flush(z, r);\n\t\t\t\t\t\t\tq = that.write;\n\t\t\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\t\t\tif (q == that.end && that.read !== 0) {\n\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tr = Z_OK;\n\n\t\t\t\t\tt = left;\n\t\t\t\t\tif (t > n)\n\t\t\t\t\t\tt = n;\n\t\t\t\t\tif (t > m)\n\t\t\t\t\t\tt = m;\n\t\t\t\t\tthat.window.set(z.read_buf(p, t), q);\n\t\t\t\t\tp += t;\n\t\t\t\t\tn -= t;\n\t\t\t\t\tq += t;\n\t\t\t\t\tm -= t;\n\t\t\t\t\tif ((left -= t) !== 0)\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tmode = last !== 0 ? DRY : TYPE;\n\t\t\t\t\tbreak;\n\t\t\t\tcase TABLE:\n\n\t\t\t\t\twhile (k < (14)) {\n\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\ttable = t = (b & 0x3fff);\n\t\t\t\t\tif ((t & 0x1f) > 29 || ((t >> 5) & 0x1f) > 29) {\n\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\tz.msg = \"too many length or distance symbols\";\n\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tt = 258 + (t & 0x1f) + ((t >> 5) & 0x1f);\n\t\t\t\t\tif (!blens || blens.length < t) {\n\t\t\t\t\t\tblens = []; // new Array(t);\n\t\t\t\t\t} else {\n\t\t\t\t\t\tfor (i = 0; i < t; i++) {\n\t\t\t\t\t\t\tblens[i] = 0;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t// {\n\t\t\t\t\tb >>>= (14);\n\t\t\t\t\tk -= (14);\n\t\t\t\t\t// }\n\n\t\t\t\t\tindex = 0;\n\t\t\t\t\tmode = BTREE;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase BTREE:\n\t\t\t\t\twhile (index < 4 + (table >>> 10)) {\n\t\t\t\t\t\twhile (k < (3)) {\n\t\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tblens[border[index++]] = b & 7;\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\t\t\t\t\t}\n\n\t\t\t\t\twhile (index < 19) {\n\t\t\t\t\t\tblens[border[index++]] = 0;\n\t\t\t\t\t}\n\n\t\t\t\t\tbb[0] = 7;\n\t\t\t\t\tt = inftree.inflate_trees_bits(blens, bb, tb, hufts, z);\n\t\t\t\t\tif (t != Z_OK) {\n\t\t\t\t\t\tr = t;\n\t\t\t\t\t\tif (r == Z_DATA_ERROR) {\n\t\t\t\t\t\t\tblens = null;\n\t\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\n\t\t\t\t\tindex = 0;\n\t\t\t\t\tmode = DTREE;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DTREE:\n\t\t\t\t\twhile (true) {\n\t\t\t\t\t\tt = table;\n\t\t\t\t\t\tif (index >= 258 + (t & 0x1f) + ((t >> 5) & 0x1f)) {\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tvar j, c;\n\n\t\t\t\t\t\tt = bb[0];\n\n\t\t\t\t\t\twhile (k < (t)) {\n\t\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\t// if (tb[0] == -1) {\n\t\t\t\t\t\t// System.err.println(\"null...\");\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\tt = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 1];\n\t\t\t\t\t\tc = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 2];\n\n\t\t\t\t\t\tif (c < 16) {\n\t\t\t\t\t\t\tb >>>= (t);\n\t\t\t\t\t\t\tk -= (t);\n\t\t\t\t\t\t\tblens[index++] = c;\n\t\t\t\t\t\t} else { // c == 16..18\n\t\t\t\t\t\t\ti = c == 18 ? 7 : c - 14;\n\t\t\t\t\t\t\tj = c == 18 ? 11 : 3;\n\n\t\t\t\t\t\t\twhile (k < (t + i)) {\n\t\t\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\tb >>>= (t);\n\t\t\t\t\t\t\tk -= (t);\n\n\t\t\t\t\t\t\tj += (b & inflate_mask[i]);\n\n\t\t\t\t\t\t\tb >>>= (i);\n\t\t\t\t\t\t\tk -= (i);\n\n\t\t\t\t\t\t\ti = index;\n\t\t\t\t\t\t\tt = table;\n\t\t\t\t\t\t\tif (i + j > 258 + (t & 0x1f) + ((t >> 5) & 0x1f) || (c == 16 && i < 1)) {\n\t\t\t\t\t\t\t\tblens = null;\n\t\t\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\t\t\tz.msg = \"invalid bit length repeat\";\n\t\t\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\tc = c == 16 ? blens[i - 1] : 0;\n\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\tblens[i++] = c;\n\t\t\t\t\t\t\t} while (--j !== 0);\n\t\t\t\t\t\t\tindex = i;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\ttb[0] = -1;\n\t\t\t\t\t// {\n\t\t\t\t\tvar bl_ = []; // new Array(1);\n\t\t\t\t\tvar bd_ = []; // new Array(1);\n\t\t\t\t\tvar tl_ = []; // new Array(1);\n\t\t\t\t\tvar td_ = []; // new Array(1);\n\t\t\t\t\tbl_[0] = 9; // must be <= 9 for lookahead assumptions\n\t\t\t\t\tbd_[0] = 6; // must be <= 9 for lookahead assumptions\n\n\t\t\t\t\tt = table;\n\t\t\t\t\tt = inftree.inflate_trees_dynamic(257 + (t & 0x1f), 1 + ((t >> 5) & 0x1f), blens, bl_, bd_, tl_, td_, hufts, z);\n\n\t\t\t\t\tif (t != Z_OK) {\n\t\t\t\t\t\tif (t == Z_DATA_ERROR) {\n\t\t\t\t\t\t\tblens = null;\n\t\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tr = t;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tcodes.init(bl_[0], bd_[0], hufts, tl_[0], hufts, td_[0]);\n\t\t\t\t\t// }\n\t\t\t\t\tmode = CODES;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase CODES:\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\n\t\t\t\t\tif ((r = codes.proc(that, z, r)) != Z_STREAM_END) {\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tr = Z_OK;\n\t\t\t\t\tcodes.free(z);\n\n\t\t\t\t\tp = z.next_in_index;\n\t\t\t\t\tn = z.avail_in;\n\t\t\t\t\tb = that.bitb;\n\t\t\t\t\tk = that.bitk;\n\t\t\t\t\tq = that.write;\n\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\n\t\t\t\t\tif (last === 0) {\n\t\t\t\t\t\tmode = TYPE;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tmode = DRY;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DRY:\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\tr = that.inflate_flush(z, r);\n\t\t\t\t\tq = that.write;\n\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\tif (that.read != that.write) {\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tmode = DONELOCKS;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DONELOCKS:\n\t\t\t\t\tr = Z_STREAM_END;\n\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\tcase BADBLOCKS:\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\treturn that.inflate_flush(z, r);\n\n\t\t\t\tdefault:\n\t\t\t\t\tr = Z_STREAM_ERROR;\n\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthat.free = function(z) {\n\t\t\tthat.reset(z, null);\n\t\t\tthat.window = null;\n\t\t\thufts = null;\n\t\t\t// ZFREE(z, s);\n\t\t};\n\n\t\tthat.set_dictionary = function(d, start, n) {\n\t\t\tthat.window.set(d.subarray(start, start + n), 0);\n\t\t\tthat.read = that.write = n;\n\t\t};\n\n\t\t// Returns true if inflate is currently at the end of a block generated\n\t\t// by Z_SYNC_FLUSH or Z_FULL_FLUSH.\n\t\tthat.sync_point = function() {\n\t\t\treturn mode == LENS ? 1 : 0;\n\t\t};\n\n\t}\n\n\t// Inflate\n\n\t// preset dictionary flag in zlib header\n\tvar PRESET_DICT = 0x20;\n\n\tvar Z_DEFLATED = 8;\n\n\tvar METHOD = 0; // waiting for method byte\n\tvar FLAG = 1; // waiting for flag byte\n\tvar DICT4 = 2; // four dictionary check bytes to go\n\tvar DICT3 = 3; // three dictionary check bytes to go\n\tvar DICT2 = 4; // two dictionary check bytes to go\n\tvar DICT1 = 5; // one dictionary check byte to go\n\tvar DICT0 = 6; // waiting for inflateSetDictionary\n\tvar BLOCKS = 7; // decompressing blocks\n\tvar DONE = 12; // finished check, done\n\tvar BAD = 13; // got an error--stay here\n\n\tvar mark = [ 0, 0, 0xff, 0xff ];\n\n\tfunction Inflate() {\n\t\tvar that = this;\n\n\t\tthat.mode = 0; // current inflate mode\n\n\t\t// mode dependent information\n\t\tthat.method = 0; // if FLAGS, method byte\n\n\t\t// if CHECK, check values to compare\n\t\tthat.was = [ 0 ]; // new Array(1); // computed check value\n\t\tthat.need = 0; // stream check value\n\n\t\t// if BAD, inflateSync's marker bytes count\n\t\tthat.marker = 0;\n\n\t\t// mode independent information\n\t\tthat.wbits = 0; // log2(window size) (8..15, defaults to 15)\n\n\t\t// this.blocks; // current inflate_blocks state\n\n\t\tfunction inflateReset(z) {\n\t\t\tif (!z || !z.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\n\t\t\tz.total_in = z.total_out = 0;\n\t\t\tz.msg = null;\n\t\t\tz.istate.mode = BLOCKS;\n\t\t\tz.istate.blocks.reset(z, null);\n\t\t\treturn Z_OK;\n\t\t}\n\n\t\tthat.inflateEnd = function(z) {\n\t\t\tif (that.blocks)\n\t\t\t\tthat.blocks.free(z);\n\t\t\tthat.blocks = null;\n\t\t\t// ZFREE(z, z->state);\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.inflateInit = function(z, w) {\n\t\t\tz.msg = null;\n\t\t\tthat.blocks = null;\n\n\t\t\t// set window size\n\t\t\tif (w < 8 || w > 15) {\n\t\t\t\tthat.inflateEnd(z);\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\tthat.wbits = w;\n\n\t\t\tz.istate.blocks = new InfBlocks(z, 1 << w);\n\n\t\t\t// reset state\n\t\t\tinflateReset(z);\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.inflate = function(z, f) {\n\t\t\tvar r;\n\t\t\tvar b;\n\n\t\t\tif (!z || !z.istate || !z.next_in)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tf = f == Z_FINISH ? Z_BUF_ERROR : Z_OK;\n\t\t\tr = Z_BUF_ERROR;\n\t\t\twhile (true) {\n\t\t\t\t// System.out.println(\"mode: \"+z.istate.mode);\n\t\t\t\tswitch (z.istate.mode) {\n\t\t\t\tcase METHOD:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tif (((z.istate.method = z.read_byte(z.next_in_index++)) & 0xf) != Z_DEFLATED) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.msg = \"unknown compression method\";\n\t\t\t\t\t\tz.istate.marker = 5; // can't try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((z.istate.method >> 4) + 8 > z.istate.wbits) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.msg = \"invalid window size\";\n\t\t\t\t\t\tz.istate.marker = 5; // can't try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tz.istate.mode = FLAG;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase FLAG:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tb = (z.read_byte(z.next_in_index++)) & 0xff;\n\n\t\t\t\t\tif ((((z.istate.method << 8) + b) % 31) !== 0) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.msg = \"incorrect header check\";\n\t\t\t\t\t\tz.istate.marker = 5; // can't try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ((b & PRESET_DICT) === 0) {\n\t\t\t\t\t\tz.istate.mode = BLOCKS;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tz.istate.mode = DICT4;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT4:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need = ((z.read_byte(z.next_in_index++) & 0xff) << 24) & 0xff000000;\n\t\t\t\t\tz.istate.mode = DICT3;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT3:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need += ((z.read_byte(z.next_in_index++) & 0xff) << 16) & 0xff0000;\n\t\t\t\t\tz.istate.mode = DICT2;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT2:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need += ((z.read_byte(z.next_in_index++) & 0xff) << 8) & 0xff00;\n\t\t\t\t\tz.istate.mode = DICT1;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT1:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need += (z.read_byte(z.next_in_index++) & 0xff);\n\t\t\t\t\tz.istate.mode = DICT0;\n\t\t\t\t\treturn Z_NEED_DICT;\n\t\t\t\tcase DICT0:\n\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\tz.msg = \"need dictionary\";\n\t\t\t\t\tz.istate.marker = 0; // can try inflateSync\n\t\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t\tcase BLOCKS:\n\n\t\t\t\t\tr = z.istate.blocks.proc(z, r);\n\t\t\t\t\tif (r == Z_DATA_ERROR) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.istate.marker = 0; // can try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif (r == Z_OK) {\n\t\t\t\t\t\tr = f;\n\t\t\t\t\t}\n\t\t\t\t\tif (r != Z_STREAM_END) {\n\t\t\t\t\t\treturn r;\n\t\t\t\t\t}\n\t\t\t\t\tr = f;\n\t\t\t\t\tz.istate.blocks.reset(z, z.istate.was);\n\t\t\t\t\tz.istate.mode = DONE;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DONE:\n\t\t\t\t\treturn Z_STREAM_END;\n\t\t\t\tcase BAD:\n\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\tdefault:\n\t\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthat.inflateSetDictionary = function(z, dictionary, dictLength) {\n\t\t\tvar index = 0;\n\t\t\tvar length = dictLength;\n\t\t\tif (!z || !z.istate || z.istate.mode != DICT0)\n\t\t\t\treturn Z_STREAM_ERROR;\n\n\t\t\tif (length >= (1 << z.istate.wbits)) {\n\t\t\t\tlength = (1 << z.istate.wbits) - 1;\n\t\t\t\tindex = dictLength - length;\n\t\t\t}\n\t\t\tz.istate.blocks.set_dictionary(dictionary, index, length);\n\t\t\tz.istate.mode = BLOCKS;\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.inflateSync = function(z) {\n\t\t\tvar n; // number of bytes to look at\n\t\t\tvar p; // pointer to bytes\n\t\t\tvar m; // number of marker bytes found in a row\n\t\t\tvar r, w; // temporaries to save total_in and total_out\n\n\t\t\t// set up\n\t\t\tif (!z || !z.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tif (z.istate.mode != BAD) {\n\t\t\t\tz.istate.mode = BAD;\n\t\t\t\tz.istate.marker = 0;\n\t\t\t}\n\t\t\tif ((n = z.avail_in) === 0)\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\tp = z.next_in_index;\n\t\t\tm = z.istate.marker;\n\n\t\t\t// search\n\t\t\twhile (n !== 0 && m < 4) {\n\t\t\t\tif (z.read_byte(p) == mark[m]) {\n\t\t\t\t\tm++;\n\t\t\t\t} else if (z.read_byte(p) !== 0) {\n\t\t\t\t\tm = 0;\n\t\t\t\t} else {\n\t\t\t\t\tm = 4 - m;\n\t\t\t\t}\n\t\t\t\tp++;\n\t\t\t\tn--;\n\t\t\t}\n\n\t\t\t// restore\n\t\t\tz.total_in += p - z.next_in_index;\n\t\t\tz.next_in_index = p;\n\t\t\tz.avail_in = n;\n\t\t\tz.istate.marker = m;\n\n\t\t\t// return no joy or set up to restart on a new block\n\t\t\tif (m != 4) {\n\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t}\n\t\t\tr = z.total_in;\n\t\t\tw = z.total_out;\n\t\t\tinflateReset(z);\n\t\t\tz.total_in = r;\n\t\t\tz.total_out = w;\n\t\t\tz.istate.mode = BLOCKS;\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\t// Returns true if inflate is currently at the end of a block generated\n\t\t// by Z_SYNC_FLUSH or Z_FULL_FLUSH. This function is used by one PPP\n\t\t// implementation to provide an additional safety check. PPP uses\n\t\t// Z_SYNC_FLUSH\n\t\t// but removes the length bytes of the resulting empty stored block. When\n\t\t// decompressing, PPP checks that at the end of input packet, inflate is\n\t\t// waiting for these length bytes.\n\t\tthat.inflateSyncPoint = function(z) {\n\t\t\tif (!z || !z.istate || !z.istate.blocks)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn z.istate.blocks.sync_point();\n\t\t};\n\t}\n\n\t// ZStream\n\n\tfunction ZStream() {\n\t}\n\n\tZStream.prototype = {\n\t\tinflateInit : function(bits) {\n\t\t\tvar that = this;\n\t\t\tthat.istate = new Inflate();\n\t\t\tif (!bits)\n\t\t\t\tbits = MAX_BITS;\n\t\t\treturn that.istate.inflateInit(that, bits);\n\t\t},\n\n\t\tinflate : function(f) {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.istate.inflate(that, f);\n\t\t},\n\n\t\tinflateEnd : function() {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tvar ret = that.istate.inflateEnd(that);\n\t\t\tthat.istate = null;\n\t\t\treturn ret;\n\t\t},\n\n\t\tinflateSync : function() {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.istate.inflateSync(that);\n\t\t},\n\t\tinflateSetDictionary : function(dictionary, dictLength) {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.istate.inflateSetDictionary(that, dictionary, dictLength);\n\t\t},\n\t\tread_byte : function(start) {\n\t\t\tvar that = this;\n\t\t\treturn that.next_in.subarray(start, start + 1)[0];\n\t\t},\n\t\tread_buf : function(start, size) {\n\t\t\tvar that = this;\n\t\t\treturn that.next_in.subarray(start, start + size);\n\t\t}\n\t};\n\n\t// Inflater\n\n\tfunction Inflater() {\n\t\tvar that = this;\n\t\tvar z = new ZStream();\n\t\tvar bufsize = 512;\n\t\tvar flush = Z_NO_FLUSH;\n\t\tvar buf = new Uint8Array(bufsize);\n\t\tvar nomoreinput = false;\n\n\t\tz.inflateInit();\n\t\tz.next_out = buf;\n\n\t\tthat.append = function(data, onprogress) {\n\t\t\tvar err, buffers = [], lastIndex = 0, bufferIndex = 0, bufferSize = 0, array;\n\t\t\tif (data.length === 0)\n\t\t\t\treturn;\n\t\t\tz.next_in_index = 0;\n\t\t\tz.next_in = data;\n\t\t\tz.avail_in = data.length;\n\t\t\tdo {\n\t\t\t\tz.next_out_index = 0;\n\t\t\t\tz.avail_out = bufsize;\n\t\t\t\tif ((z.avail_in === 0) && (!nomoreinput)) { // if buffer is empty and more input is available, refill it\n\t\t\t\t\tz.next_in_index = 0;\n\t\t\t\t\tnomoreinput = true;\n\t\t\t\t}\n\t\t\t\terr = z.inflate(flush);\n\t\t\t\tif (nomoreinput && (err === Z_BUF_ERROR)) {\n\t\t\t\t\tif (z.avail_in !== 0)\n\t\t\t\t\t\tthrow new Error(\"inflating: bad input\");\n\t\t\t\t} else if (err !== Z_OK && err !== Z_STREAM_END)\n\t\t\t\t\tthrow new Error(\"inflating: \" + z.msg);\n\t\t\t\tif ((nomoreinput || err === Z_STREAM_END) && (z.avail_in === data.length))\n\t\t\t\t\tthrow new Error(\"inflating: bad input\");\n\t\t\t\tif (z.next_out_index)\n\t\t\t\t\tif (z.next_out_index === bufsize)\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf));\n\t\t\t\t\telse\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));\n\t\t\t\tbufferSize += z.next_out_index;\n\t\t\t\tif (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {\n\t\t\t\t\tonprogress(z.next_in_index);\n\t\t\t\t\tlastIndex = z.next_in_index;\n\t\t\t\t}\n\t\t\t} while (z.avail_in > 0 || z.avail_out === 0);\n\t\t\tarray = new Uint8Array(bufferSize);\n\t\t\tbuffers.forEach(function(chunk) {\n\t\t\t\tarray.set(chunk, bufferIndex);\n\t\t\t\tbufferIndex += chunk.length;\n\t\t\t});\n\t\t\treturn array;\n\t\t};\n\t\tthat.flush = function() {\n\t\t\tz.inflateEnd();\n\t\t};\n\t}\n\n\t// 'zip' may not be defined in z-worker and some tests\n\tvar env = global.zip || global;\n\tenv.Inflater = env._jzlib_Inflater = Inflater;\n})(this);\n")]
};

module.exports = zip;


},{"zip":19}],19:[function(require,module,exports){
(function (global){
; var __browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function(obj) {
	"use strict";

	var ERR_BAD_FORMAT = "File format is not recognized.";
	var ERR_CRC = "CRC failed.";
	var ERR_ENCRYPTED = "File contains encrypted entry.";
	var ERR_ZIP64 = "File is using Zip64 (4gb+ file size).";
	var ERR_READ = "Error while reading zip file.";
	var ERR_WRITE = "Error while writing zip file.";
	var ERR_WRITE_DATA = "Error while writing file data.";
	var ERR_READ_DATA = "Error while reading file data.";
	var ERR_DUPLICATED_NAME = "File already exists.";
	var CHUNK_SIZE = 512 * 1024;
	
	var TEXT_PLAIN = "text/plain";

	var appendABViewSupported;
	try {
		appendABViewSupported = new Blob([ new DataView(new ArrayBuffer(0)) ]).size === 0;
	} catch (e) {
	}

	function Crc32() {
		this.crc = -1;
	}
	Crc32.prototype.append = function append(data) {
		var crc = this.crc | 0, table = this.table;
		for (var offset = 0, len = data.length | 0; offset < len; offset++)
			crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];
		this.crc = crc;
	};
	Crc32.prototype.get = function get() {
		return ~this.crc;
	};
	Crc32.prototype.table = (function() {
		var i, j, t, table = []; // Uint32Array is actually slower than []
		for (i = 0; i < 256; i++) {
			t = i;
			for (j = 0; j < 8; j++)
				if (t & 1)
					t = (t >>> 1) ^ 0xEDB88320;
				else
					t = t >>> 1;
			table[i] = t;
		}
		return table;
	})();
	
	// "no-op" codec
	function NOOP() {}
	NOOP.prototype.append = function append(bytes, onprogress) {
		return bytes;
	};
	NOOP.prototype.flush = function flush() {};

	function blobSlice(blob, index, length) {
		if (index < 0 || length < 0 || index + length > blob.size)
			throw new RangeError('offset:' + index + ', length:' + length + ', size:' + blob.size);
		if (blob.slice)
			return blob.slice(index, index + length);
		else if (blob.webkitSlice)
			return blob.webkitSlice(index, index + length);
		else if (blob.mozSlice)
			return blob.mozSlice(index, index + length);
		else if (blob.msSlice)
			return blob.msSlice(index, index + length);
	}

	function getDataHelper(byteLength, bytes) {
		var dataBuffer, dataArray;
		dataBuffer = new ArrayBuffer(byteLength);
		dataArray = new Uint8Array(dataBuffer);
		if (bytes)
			dataArray.set(bytes, 0);
		return {
			buffer : dataBuffer,
			array : dataArray,
			view : new DataView(dataBuffer)
		};
	}

	// Readers
	function Reader() {
	}

	function TextReader(text) {
		var that = this, blobReader;

		function init(callback, onerror) {
			var blob = new Blob([ text ], {
				type : TEXT_PLAIN
			});
			blobReader = new BlobReader(blob);
			blobReader.init(function() {
				that.size = blobReader.size;
				callback();
			}, onerror);
		}

		function readUint8Array(index, length, callback, onerror) {
			blobReader.readUint8Array(index, length, callback, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	TextReader.prototype = new Reader();
	TextReader.prototype.constructor = TextReader;

	function Data64URIReader(dataURI) {
		var that = this, dataStart;

		function init(callback) {
			var dataEnd = dataURI.length;
			while (dataURI.charAt(dataEnd - 1) == "=")
				dataEnd--;
			dataStart = dataURI.indexOf(",") + 1;
			that.size = Math.floor((dataEnd - dataStart) * 0.75);
			callback();
		}

		function readUint8Array(index, length, callback) {
			var i, data = getDataHelper(length);
			var start = Math.floor(index / 3) * 4;
			var end = Math.ceil((index + length) / 3) * 4;
			var bytes = obj.atob(dataURI.substring(start + dataStart, end + dataStart));
			var delta = index - Math.floor(start / 4) * 3;
			for (i = delta; i < delta + length; i++)
				data.array[i - delta] = bytes.charCodeAt(i);
			callback(data.array);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	Data64URIReader.prototype = new Reader();
	Data64URIReader.prototype.constructor = Data64URIReader;

	function BlobReader(blob) {
		var that = this;

		function init(callback) {
			that.size = blob.size;
			callback();
		}

		function readUint8Array(index, length, callback, onerror) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(new Uint8Array(e.target.result));
			};
			reader.onerror = onerror;
			try {
				reader.readAsArrayBuffer(blobSlice(blob, index, length));
			} catch (e) {
				onerror(e);
			}
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	BlobReader.prototype = new Reader();
	BlobReader.prototype.constructor = BlobReader;

	// Writers

	function Writer() {
	}
	Writer.prototype.getData = function(callback) {
		callback(this.data);
	};

	function TextWriter(encoding) {
		var that = this, blob;

		function init(callback) {
			blob = new Blob([], {
				type : TEXT_PLAIN
			});
			callback();
		}

		function writeUint8Array(array, callback) {
			blob = new Blob([ blob, appendABViewSupported ? array : array.buffer ], {
				type : TEXT_PLAIN
			});
			callback();
		}

		function getData(callback, onerror) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(e.target.result);
			};
			reader.onerror = onerror;
			reader.readAsText(blob, encoding);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	TextWriter.prototype = new Writer();
	TextWriter.prototype.constructor = TextWriter;

	function Data64URIWriter(contentType) {
		var that = this, data = "", pending = "";

		function init(callback) {
			data += "data:" + (contentType || "") + ";base64,";
			callback();
		}

		function writeUint8Array(array, callback) {
			var i, delta = pending.length, dataString = pending;
			pending = "";
			for (i = 0; i < (Math.floor((delta + array.length) / 3) * 3) - delta; i++)
				dataString += String.fromCharCode(array[i]);
			for (; i < array.length; i++)
				pending += String.fromCharCode(array[i]);
			if (dataString.length > 2)
				data += obj.btoa(dataString);
			else
				pending = dataString;
			callback();
		}

		function getData(callback) {
			callback(data + obj.btoa(pending));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	Data64URIWriter.prototype = new Writer();
	Data64URIWriter.prototype.constructor = Data64URIWriter;

	function BlobWriter(contentType) {
		var blob, that = this;

		function init(callback) {
			blob = new Blob([], {
				type : contentType
			});
			callback();
		}

		function writeUint8Array(array, callback) {
			blob = new Blob([ blob, appendABViewSupported ? array : array.buffer ], {
				type : contentType
			});
			callback();
		}

		function getData(callback) {
			callback(blob);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	BlobWriter.prototype = new Writer();
	BlobWriter.prototype.constructor = BlobWriter;

	/** 
	 * inflate/deflate core functions
	 * @param worker {Worker} web worker for the task.
	 * @param initialMessage {Object} initial message to be sent to the worker. should contain
	 *   sn(serial number for distinguishing multiple tasks sent to the worker), and codecClass.
	 *   This function may add more properties before sending.
	 */
	function launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0, index, outputSize, sn = initialMessage.sn, crc;

		function onflush() {
			worker.removeEventListener('message', onmessage, false);
			onend(outputSize, crc);
		}

		function onmessage(event) {
			var message = event.data, data = message.data, err = message.error;
			if (err) {
				err.toString = function () { return 'Error: ' + this.message; };
				onreaderror(err);
				return;
			}
			if (message.sn !== sn)
				return;
			if (typeof message.codecTime === 'number')
				worker.codecTime += message.codecTime; // should be before onflush()
			if (typeof message.crcTime === 'number')
				worker.crcTime += message.crcTime;

			switch (message.type) {
				case 'append':
					if (data) {
						outputSize += data.length;
						writer.writeUint8Array(data, function() {
							step();
						}, onwriteerror);
					} else
						step();
					break;
				case 'flush':
					crc = message.crc;
					if (data) {
						outputSize += data.length;
						writer.writeUint8Array(data, function() {
							onflush();
						}, onwriteerror);
					} else
						onflush();
					break;
				case 'progress':
					if (onprogress)
						onprogress(index + message.loaded, size);
					break;
				case 'importScripts': //no need to handle here
				case 'newTask':
				case 'echo':
					break;
				default:
					console.warn('zip.js:launchWorkerProcess: unknown message: ', message);
			}
		}

		function step() {
			index = chunkIndex * CHUNK_SIZE;
			// use `<=` instead of `<`, because `size` may be 0.
			if (index <= size) {
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(array) {
					if (onprogress)
						onprogress(index, size);
					var msg = index === 0 ? initialMessage : {sn : sn};
					msg.type = 'append';
					msg.data = array;
					
					// posting a message with transferables will fail on IE10
					try {
						worker.postMessage(msg, [array.buffer]);
					} catch(ex) {
						worker.postMessage(msg); // retry without transferables
					}
					chunkIndex++;
				}, onreaderror);
			} else {
				worker.postMessage({
					sn: sn,
					type: 'flush'
				});
			}
		}

		outputSize = 0;
		worker.addEventListener('message', onmessage, false);
		step();
	}

	function launchProcess(process, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0, index, outputSize = 0,
			crcInput = crcType === 'input',
			crcOutput = crcType === 'output',
			crc = new Crc32();
		function step() {
			var outputData;
			index = chunkIndex * CHUNK_SIZE;
			if (index < size)
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(inputData) {
					var outputData;
					try {
						outputData = process.append(inputData, function(loaded) {
							if (onprogress)
								onprogress(index + loaded, size);
						});
					} catch (e) {
						onreaderror(e);
						return;
					}
					if (outputData) {
						outputSize += outputData.length;
						writer.writeUint8Array(outputData, function() {
							chunkIndex++;
							setTimeout(step, 1);
						}, onwriteerror);
						if (crcOutput)
							crc.append(outputData);
					} else {
						chunkIndex++;
						setTimeout(step, 1);
					}
					if (crcInput)
						crc.append(inputData);
					if (onprogress)
						onprogress(index, size);
				}, onreaderror);
			else {
				try {
					outputData = process.flush();
				} catch (e) {
					onreaderror(e);
					return;
				}
				if (outputData) {
					if (crcOutput)
						crc.append(outputData);
					outputSize += outputData.length;
					writer.writeUint8Array(outputData, function() {
						onend(outputSize, crc.get());
					}, onwriteerror);
				} else
					onend(outputSize, crc.get());
			}
		}

		step();
	}

	function inflate(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = computeCrc32 ? 'output' : 'none';
		if (obj.zip.useWebWorkers) {
			var initialMessage = {
				sn: sn,
				codecClass: 'Inflater',
				crcType: crcType,
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
		} else
			launchProcess(new obj.zip.Inflater(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	function deflate(worker, sn, reader, writer, level, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = 'input';
		if (obj.zip.useWebWorkers) {
			var initialMessage = {
				sn: sn,
				options: {level: level},
				codecClass: 'Deflater',
				crcType: crcType,
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, 0, reader.size, onprogress, onend, onreaderror, onwriteerror);
		} else
			launchProcess(new obj.zip.Deflater(), reader, writer, 0, reader.size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	function copy(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = 'input';
		if (obj.zip.useWebWorkers && computeCrc32) {
			var initialMessage = {
				sn: sn,
				codecClass: 'NOOP',
				crcType: crcType,
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
		} else
			launchProcess(new NOOP(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	// ZipReader

	function decodeASCII(str) {
		var i, out = "", charCode, extendedASCII = [ '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7', '\u00EA', '\u00EB',
				'\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5', '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9',
				'\u00FF', '\u00D6', '\u00DC', '\u00F8', '\u00A3', '\u00D8', '\u00D7', '\u0192', '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1',
				'\u00AA', '\u00BA', '\u00BF', '\u00AE', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB', '_', '_', '_', '\u00A6', '\u00A6',
				'\u00C1', '\u00C2', '\u00C0', '\u00A9', '\u00A6', '\u00A6', '+', '+', '\u00A2', '\u00A5', '+', '+', '-', '-', '+', '-', '+', '\u00E3',
				'\u00C3', '+', '+', '-', '-', '\u00A6', '-', '+', '\u00A4', '\u00F0', '\u00D0', '\u00CA', '\u00CB', '\u00C8', 'i', '\u00CD', '\u00CE',
				'\u00CF', '+', '+', '_', '_', '\u00A6', '\u00CC', '_', '\u00D3', '\u00DF', '\u00D4', '\u00D2', '\u00F5', '\u00D5', '\u00B5', '\u00FE',
				'\u00DE', '\u00DA', '\u00DB', '\u00D9', '\u00FD', '\u00DD', '\u00AF', '\u00B4', '\u00AD', '\u00B1', '_', '\u00BE', '\u00B6', '\u00A7',
				'\u00F7', '\u00B8', '\u00B0', '\u00A8', '\u00B7', '\u00B9', '\u00B3', '\u00B2', '_', ' ' ];
		for (i = 0; i < str.length; i++) {
			charCode = str.charCodeAt(i) & 0xFF;
			if (charCode > 127)
				out += extendedASCII[charCode - 128];
			else
				out += String.fromCharCode(charCode);
		}
		return out;
	}

	function decodeUTF8(string) {
		return decodeURIComponent(escape(string));
	}

	function getString(bytes) {
		var i, str = "";
		for (i = 0; i < bytes.length; i++)
			str += String.fromCharCode(bytes[i]);
		return str;
	}

	function getDate(timeRaw) {
		var date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
		try {
			return new Date(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5,
					(time & 0x001F) * 2, 0);
		} catch (e) {
		}
	}

	function readCommonHeader(entry, data, index, centralDirectory, onerror) {
		entry.version = data.view.getUint16(index, true);
		entry.bitFlag = data.view.getUint16(index + 2, true);
		entry.compressionMethod = data.view.getUint16(index + 4, true);
		entry.lastModDateRaw = data.view.getUint32(index + 6, true);
		entry.lastModDate = getDate(entry.lastModDateRaw);
		if ((entry.bitFlag & 0x01) === 0x01) {
			onerror(ERR_ENCRYPTED);
			return;
		}
		if (centralDirectory || (entry.bitFlag & 0x0008) != 0x0008) {
			entry.crc32 = data.view.getUint32(index + 10, true);
			entry.compressedSize = data.view.getUint32(index + 14, true);
			entry.uncompressedSize = data.view.getUint32(index + 18, true);
		}
		if (entry.compressedSize === 0xFFFFFFFF || entry.uncompressedSize === 0xFFFFFFFF) {
			onerror(ERR_ZIP64);
			return;
		}
		entry.filenameLength = data.view.getUint16(index + 22, true);
		entry.extraFieldLength = data.view.getUint16(index + 24, true);
	}

	function createZipReader(reader, callback, onerror) {
		var inflateSN = 0;

		function Entry() {
		}

		Entry.prototype.getData = function(writer, onend, onprogress, checkCrc32) {
			var that = this;

			function testCrc32(crc32) {
				var dataCrc32 = getDataHelper(4);
				dataCrc32.view.setUint32(0, crc32);
				return that.crc32 == dataCrc32.view.getUint32(0);
			}

			function getWriterData(uncompressedSize, crc32) {
				if (checkCrc32 && !testCrc32(crc32))
					onerror(ERR_CRC);
				else
					writer.getData(function(data) {
						onend(data);
					});
			}

			function onreaderror(err) {
				onerror(err || ERR_READ_DATA);
			}

			function onwriteerror(err) {
				onerror(err || ERR_WRITE_DATA);
			}

			reader.readUint8Array(that.offset, 30, function(bytes) {
				var data = getDataHelper(bytes.length, bytes), dataOffset;
				if (data.view.getUint32(0) != 0x504b0304) {
					onerror(ERR_BAD_FORMAT);
					return;
				}
				readCommonHeader(that, data, 4, false, onerror);
				dataOffset = that.offset + 30 + that.filenameLength + that.extraFieldLength;
				writer.init(function() {
					if (that.compressionMethod === 0)
						copy(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
					else
						inflate(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
				}, onwriteerror);
			}, onreaderror);
		};

		function seekEOCDR(eocdrCallback) {
			// "End of central directory record" is the last part of a zip archive, and is at least 22 bytes long.
			// Zip file comment is the last part of EOCDR and has max length of 64KB,
			// so we only have to search the last 64K + 22 bytes of a archive for EOCDR signature (0x06054b50).
			var EOCDR_MIN = 22;
			if (reader.size < EOCDR_MIN) {
				onerror(ERR_BAD_FORMAT);
				return;
			}
			var ZIP_COMMENT_MAX = 256 * 256, EOCDR_MAX = EOCDR_MIN + ZIP_COMMENT_MAX;

			// In most cases, the EOCDR is EOCDR_MIN bytes long
			doSeek(EOCDR_MIN, function() {
				// If not found, try within EOCDR_MAX bytes
				doSeek(Math.min(EOCDR_MAX, reader.size), function() {
					onerror(ERR_BAD_FORMAT);
				});
			});

			// seek last length bytes of file for EOCDR
			function doSeek(length, eocdrNotFoundCallback) {
				reader.readUint8Array(reader.size - length, length, function(bytes) {
					for (var i = bytes.length - EOCDR_MIN; i >= 0; i--) {
						if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
							eocdrCallback(new DataView(bytes.buffer, i, EOCDR_MIN));
							return;
						}
					}
					eocdrNotFoundCallback();
				}, function() {
					onerror(ERR_READ);
				});
			}
		}

		var zipReader = {
			getEntries : function(callback) {
				var worker = this._worker;
				// look for End of central directory record
				seekEOCDR(function(dataView) {
					var datalength, fileslength;
					datalength = dataView.getUint32(16, true);
					fileslength = dataView.getUint16(8, true);
					if (datalength < 0 || datalength >= reader.size) {
						onerror(ERR_BAD_FORMAT);
						return;
					}
					reader.readUint8Array(datalength, reader.size - datalength, function(bytes) {
						var i, index = 0, entries = [], entry, filename, comment, data = getDataHelper(bytes.length, bytes);
						for (i = 0; i < fileslength; i++) {
							entry = new Entry();
							entry._worker = worker;
							if (data.view.getUint32(index) != 0x504b0102) {
								onerror(ERR_BAD_FORMAT);
								return;
							}
							readCommonHeader(entry, data, index + 6, true, onerror);
							entry.commentLength = data.view.getUint16(index + 32, true);
							entry.directory = ((data.view.getUint8(index + 38) & 0x10) == 0x10);
							entry.offset = data.view.getUint32(index + 42, true);
							filename = getString(data.array.subarray(index + 46, index + 46 + entry.filenameLength));
							entry.filename = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(filename) : decodeASCII(filename);
							if (!entry.directory && entry.filename.charAt(entry.filename.length - 1) == "/")
								entry.directory = true;
							comment = getString(data.array.subarray(index + 46 + entry.filenameLength + entry.extraFieldLength, index + 46
									+ entry.filenameLength + entry.extraFieldLength + entry.commentLength));
							entry.comment = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(comment) : decodeASCII(comment);
							entries.push(entry);
							index += 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength;
						}
						callback(entries);
					}, function() {
						onerror(ERR_READ);
					});
				});
			},
			close : function(callback) {
				if (this._worker) {
					this._worker.terminate();
					this._worker = null;
				}
				if (callback)
					callback();
			},
			_worker: null
		};

		if (!obj.zip.useWebWorkers)
			callback(zipReader);
		else {
			createWorker('inflater',
				function(worker) {
					zipReader._worker = worker;
					callback(zipReader);
				},
				function(err) {
					onerror(err);
				}
			);
		}
	}

	// ZipWriter

	function encodeUTF8(string) {
		return unescape(encodeURIComponent(string));
	}

	function getBytes(str) {
		var i, array = [];
		for (i = 0; i < str.length; i++)
			array.push(str.charCodeAt(i));
		return array;
	}

	function createZipWriter(writer, callback, onerror, dontDeflate) {
		var files = {}, filenames = [], datalength = 0;
		var deflateSN = 0;

		function onwriteerror(err) {
			onerror(err || ERR_WRITE);
		}

		function onreaderror(err) {
			onerror(err || ERR_READ_DATA);
		}

		var zipWriter = {
			add : function(name, reader, onend, onprogress, options) {
				var header, filename, date;
				var worker = this._worker;

				function writeHeader(callback) {
					var data;
					date = options.lastModDate || new Date();
					header = getDataHelper(26);
					files[name] = {
						headerArray : header.array,
						directory : options.directory,
						filename : filename,
						offset : datalength,
						comment : getBytes(encodeUTF8(options.comment || ""))
					};
					header.view.setUint32(0, 0x14000808);
					if (options.version)
						header.view.setUint8(0, options.version);
					if (!dontDeflate && options.level !== 0 && !options.directory)
						header.view.setUint16(4, 0x0800);
					header.view.setUint16(6, (((date.getHours() << 6) | date.getMinutes()) << 5) | date.getSeconds() / 2, true);
					header.view.setUint16(8, ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate(), true);
					header.view.setUint16(22, filename.length, true);
					data = getDataHelper(30 + filename.length);
					data.view.setUint32(0, 0x504b0304);
					data.array.set(header.array, 4);
					data.array.set(filename, 30);
					datalength += data.array.length;
					writer.writeUint8Array(data.array, callback, onwriteerror);
				}

				function writeFooter(compressedLength, crc32) {
					var footer = getDataHelper(16);
					datalength += compressedLength || 0;
					footer.view.setUint32(0, 0x504b0708);
					if (typeof crc32 != "undefined") {
						header.view.setUint32(10, crc32, true);
						footer.view.setUint32(4, crc32, true);
					}
					if (reader) {
						footer.view.setUint32(8, compressedLength, true);
						header.view.setUint32(14, compressedLength, true);
						footer.view.setUint32(12, reader.size, true);
						header.view.setUint32(18, reader.size, true);
					}
					writer.writeUint8Array(footer.array, function() {
						datalength += 16;
						onend();
					}, onwriteerror);
				}

				function writeFile() {
					options = options || {};
					name = name.trim();
					if (options.directory && name.charAt(name.length - 1) != "/")
						name += "/";
					if (files.hasOwnProperty(name)) {
						onerror(ERR_DUPLICATED_NAME);
						return;
					}
					filename = getBytes(encodeUTF8(name));
					filenames.push(name);
					writeHeader(function() {
						if (reader)
							if (dontDeflate || options.level === 0)
								copy(worker, deflateSN++, reader, writer, 0, reader.size, true, writeFooter, onprogress, onreaderror, onwriteerror);
							else
								deflate(worker, deflateSN++, reader, writer, options.level, writeFooter, onprogress, onreaderror, onwriteerror);
						else
							writeFooter();
					}, onwriteerror);
				}

				if (reader)
					reader.init(writeFile, onreaderror);
				else
					writeFile();
			},
			close : function(callback) {
				if (this._worker) {
					this._worker.terminate();
					this._worker = null;
				}

				var data, length = 0, index = 0, indexFilename, file;
				for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
					file = files[filenames[indexFilename]];
					length += 46 + file.filename.length + file.comment.length;
				}
				data = getDataHelper(length + 22);
				for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
					file = files[filenames[indexFilename]];
					data.view.setUint32(index, 0x504b0102);
					data.view.setUint16(index + 4, 0x1400);
					data.array.set(file.headerArray, index + 6);
					data.view.setUint16(index + 32, file.comment.length, true);
					if (file.directory)
						data.view.setUint8(index + 38, 0x10);
					data.view.setUint32(index + 42, file.offset, true);
					data.array.set(file.filename, index + 46);
					data.array.set(file.comment, index + 46 + file.filename.length);
					index += 46 + file.filename.length + file.comment.length;
				}
				data.view.setUint32(index, 0x504b0506);
				data.view.setUint16(index + 8, filenames.length, true);
				data.view.setUint16(index + 10, filenames.length, true);
				data.view.setUint32(index + 12, length, true);
				data.view.setUint32(index + 16, datalength, true);
				writer.writeUint8Array(data.array, function() {
					writer.getData(callback);
				}, onwriteerror);
			},
			_worker: null
		};

		if (!obj.zip.useWebWorkers)
			callback(zipWriter);
		else {
			createWorker('deflater',
				function(worker) {
					zipWriter._worker = worker;
					callback(zipWriter);
				},
				function(err) {
					onerror(err);
				}
			);
		}
	}

	function resolveURLs(urls) {
		var a = document.createElement('a');
		return urls.map(function(url) {
			a.href = url;
			return a.href;
		});
	}

	var DEFAULT_WORKER_SCRIPTS = {
		deflater: ['z-worker.js', 'deflate.js'],
		inflater: ['z-worker.js', 'inflate.js']
	};
	function createWorker(type, callback, onerror) {
		if (obj.zip.workerScripts !== null && obj.zip.workerScriptsPath !== null) {
			onerror(new Error('Either zip.workerScripts or zip.workerScriptsPath may be set, not both.'));
			return;
		}
		var scripts;
		if (obj.zip.workerScripts) {
			scripts = obj.zip.workerScripts[type];
			if (!Array.isArray(scripts)) {
				onerror(new Error('zip.workerScripts.' + type + ' is not an array!'));
				return;
			}
			scripts = resolveURLs(scripts);
		} else {
			scripts = DEFAULT_WORKER_SCRIPTS[type].slice(0);
			scripts[0] = (obj.zip.workerScriptsPath || '') + scripts[0];
		}
		var worker = new Worker(scripts[0]);
		// record total consumed time by inflater/deflater/crc32 in this worker
		worker.codecTime = worker.crcTime = 0;
		worker.postMessage({ type: 'importScripts', scripts: scripts.slice(1) });
		worker.addEventListener('message', onmessage);
		function onmessage(ev) {
			var msg = ev.data;
			if (msg.error) {
				worker.terminate(); // should before onerror(), because onerror() may throw.
				onerror(msg.error);
				return;
			}
			if (msg.type === 'importScripts') {
				worker.removeEventListener('message', onmessage);
				worker.removeEventListener('error', errorHandler);
				callback(worker);
			}
		}
		// catch entry script loading error and other unhandled errors
		worker.addEventListener('error', errorHandler);
		function errorHandler(err) {
			worker.terminate();
			onerror(err);
		}
	}

	function onerror_default(error) {
		console.error(error);
	}
	obj.zip = {
		Reader : Reader,
		Writer : Writer,
		BlobReader : BlobReader,
		Data64URIReader : Data64URIReader,
		TextReader : TextReader,
		BlobWriter : BlobWriter,
		Data64URIWriter : Data64URIWriter,
		TextWriter : TextWriter,
		createReader : function(reader, callback, onerror) {
			onerror = onerror || onerror_default;

			reader.init(function() {
				createZipReader(reader, callback, onerror);
			}, onerror);
		},
		createWriter : function(writer, callback, onerror, dontDeflate) {
			onerror = onerror || onerror_default;
			dontDeflate = !!dontDeflate;

			writer.init(function() {
				createZipWriter(writer, callback, onerror, dontDeflate);
			}, onerror);
		},
		useWebWorkers : true,
		/**
		 * Directory containing the default worker scripts (z-worker.js, deflate.js, and inflate.js), relative to current base url.
		 * E.g.: zip.workerScripts = './';
		 */
		workerScriptsPath : null,
		/**
		 * Advanced option to control which scripts are loaded in the Web worker. If this option is specified, then workerScriptsPath must not be set.
		 * workerScripts.deflater/workerScripts.inflater should be arrays of urls to scripts for deflater/inflater, respectively.
		 * Scripts in the array are executed in order, and the first one should be z-worker.js, which is used to start the worker.
		 * All urls are relative to current base url.
		 * E.g.:
		 * zip.workerScripts = {
		 *   deflater: ['z-worker.js', 'deflate.js'],
		 *   inflater: ['z-worker.js', 'inflate.js']
		 * };
		 */
		workerScripts : null,
	};

})(this);

; browserify_shim__define__module__export__(typeof zip != "undefined" ? zip : window.zip);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],20:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _elementReady = require('element-ready');

var _elementReady2 = _interopRequireDefault(_elementReady);

var _simpleDropzone = require('simple-dropzone');

var _simpleDropzone2 = _interopRequireDefault(_simpleDropzone);

var _stylesContentLess = require('./styles/content.less');

var _stylesContentLess2 = _interopRequireDefault(_stylesContentLess);

var _uploadEmoji = require('./upload-emoji');

var _uploadEmoji2 = _interopRequireDefault(_uploadEmoji);

var ELEMENT_TO_INSERT_BEFORE_SELECTOR = '.p-customize_emoji_wrapper';
var SET_ICON_URL = chrome.runtime.getURL('images/icon_128.png');

function createUploadElement(upload) {
  var filePreview = window.URL.createObjectURL(upload.file);
  var element = document.createElement('li');
  element.id = 'nfet__upload-' + upload.id;
  element.classList.add('nfet__uploader__upload');
  element.innerHTML = '\n    <img class="nfet__uploader__upload__preview" src="' + filePreview + '" />\n    <span class="nfet__uploader__upload__filename">' + upload.file.name + '</span>\n    <span class="nfet__uploader__upload__status">\n      <i class="nfet__uploader__upload__status__icon nfet__uploader__upload__status__icon-uploading ts_icon ts_icon_spinner"></i>\n      <i class="nfet__uploader__upload__status__icon nfet__uploader__upload__status__icon-error ts_icon ts_icon_warning"></i>\n      <i class="nfet__uploader__upload__status__icon nfet__uploader__upload__status__icon-success ts_icon ts_icon_check_circle_o"></i>\n      <span class="nfet__uploader__upload__status__text"></span>\n    </span>';

  return element;
}

(0, _elementReady2['default'])(ELEMENT_TO_INSERT_BEFORE_SELECTOR).then(function () {
  var elementToInsertBefore = document.querySelector(ELEMENT_TO_INSERT_BEFORE_SELECTOR);
  var containerDvi = document.createElement('div');

  elementToInsertBefore.before(containerDvi);

  containerDvi.innerHTML = '\n      <div class="neutral-face-emoji-tools">\n        <h4 class="nfet__uploader__heading">\n          <img class="nfet__uploader__heading__icon" src="' + SET_ICON_URL + '"></img>\n          <span class="nfet__uploader__heading__text">Bulk Emoji Uploader</span>\n        </h4>\n        <p class="nfet__uploader__subheading">Drag and drop images into the area below. Any images dropped there will be automatically uploaded using their filename as the emoji name.</p>\n        <p class="nfet__uploader__input-note input_note">Example: <span class="normal">"ditto.gif" will be added as "ditto"</span></p>\n        <div id="nfet-upload-zone" class="nfet__uploader__dropzone">\n          <div class="nfet__uploader__dropzone__content input_note">\n            <strong>Drop images here</strong> or click to open a file dialog\n          </div>\n          <input class="nfet__uploader__dropzone__input" id="nfet-upload-input" type="file" />\n        </div>\n        <ul class="nfet__uploader__uploads"></ul>\n      </div>';
  var uploadInputElement = document.querySelector('#nfet-upload-input');
  var uploadZoneElement = document.querySelector('#nfet-upload-zone');
  var dropzone = new _simpleDropzone2['default'](uploadZoneElement, uploadInputElement);

  dropzone.on('drop', function (_ref) {
    var files = _ref.files;

    var uploadsElement = document.querySelector('.neutral-face-emoji-tools .nfet__uploader__uploads');

    files.forEach(function (file) {
      var uploadElement = undefined;
      var id = (0, _uploadEmoji2['default'])(file, function (error) {
        if (error) {
          uploadElement.classList.add('nfet__uploader__upload--error');
          uploadElement.querySelector('.nfet__uploader__upload__status__text').innerText = error;
        } else {
          uploadElement.classList.add('nfet__uploader__upload--success');
          uploadElement.querySelector('.nfet__uploader__upload__status__text').innerText = 'added successfully';
        }
      });
      uploadElement = createUploadElement({
        id: id,
        file: file
      });
      uploadsElement.appendChild(uploadElement);
    });
  });
});

},{"./styles/content.less":22,"./upload-emoji":23,"element-ready":3,"simple-dropzone":9}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = getSlackApiData;

function getSlackApiData() {
  var scripts = document.querySelectorAll('script[type="text/javascript"]');
  var apiToken = undefined;
  var versionUid = undefined;

  scripts.forEach(function (script) {
    var isBootDataScript = /var\sboot_data\s\=\s\{/.test(script.innerText);

    if (!isBootDataScript) {
      return;
    }

    var apiTokenResult = /["]?api_token["]?\:\s*\"(.+?)\"/g.exec(script.innerText);
    var versionUidResult = /["]?version_uid["]?\:\s*\"(.+?)\"/g.exec(script.innerText);

    if (apiTokenResult) {
      apiToken = apiTokenResult[1];
    }

    if (versionUidResult) {
      versionUid = versionUidResult[1];
    }
  });

  return {
    apiToken: apiToken,
    versionUid: versionUid
  };
}

module.exports = exports['default'];

},{}],22:[function(require,module,exports){
var css = ".neutral-face-emoji-tools {\n  border: #e8e8e8 1px solid;\n  border-left: #D293E4 3px solid;\n  margin: 0 0 25px 0;\n  padding: 25px;\n  background: white;\n}\n.nfet__uploader__heading__icon {\n  margin: 0 5px 0 0;\n  height: 1.25em;\n  vertical-align: -25%;\n}\n.nfet__uploader__dropzone {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  position: relative;\n  margin: 0 0 10px 0;\n  width: 100%;\n  height: 150px;\n  border: #f0f0f0 3px dashed;\n  border-radius: 5px;\n  background: #fafafa;\n  transition: background 450ms, border-color 450ms;\n}\n.nfet__uploader__dropzone--active,\n.nfet__uploader__dropzone:hover {\n  background: #f0f0f0;\n  border-color: #e6e6e6;\n}\n.nfet__uploader__dropzone__content {\n  margin: 15px;\n}\n.nfet__uploader__dropzone__input {\n  cursor: pointer;\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  display: block;\n  width: 100% !important;\n  opacity: 0;\n}\n.nfet__uploader__uploads {\n  font-size: 0.9rem;\n  list-style: none;\n  margin: 0;\n}\n.nfet__uploader__upload {\n  display: flex;\n  align-items: center;\n  border-bottom: 1px solid #e8e8e8;\n}\n.nfet__uploader__upload:last-child {\n  border-bottom: none;\n}\n.nfet__uploader__upload__preview {\n  width: 1.25rem;\n  height: 1.25rem;\n  margin-right: 0.5em;\n}\n.nfet__uploader__upload__filename {\n  font-weight: bold;\n  margin-right: 1em;\n}\n.nfet__uploader__upload__status {\n  color: #3aa3e3;\n}\n.nfet__uploader__upload__status__icon {\n  display: none;\n  vertical-align: top;\n  margin-right: 0.25em;\n  font-size: 0.9rem !important;\n}\n.nfet__uploader__upload__status__icon-uploading {\n  display: inline-block;\n}\n.nfet__uploader__upload--success .nfet__uploader__upload__status__icon-uploading,\n.nfet__uploader__upload--error .nfet__uploader__upload__status__icon-uploading {\n  display: none;\n}\n.nfet__uploader__upload--success .nfet__uploader__upload__status {\n  color: #2ab27b;\n}\n.nfet__uploader__upload--success .nfet__uploader__upload__status__icon-success {\n  display: inline-block;\n}\n.nfet__uploader__upload--error .nfet__uploader__upload__status {\n  color: #cb5234;\n}\n.nfet__uploader__upload--error .nfet__uploader__upload__status__icon-error {\n  display: inline-block;\n}\n";(require('lessify'))(css); module.exports = css;
},{"lessify":5}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = uploadEmoji;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _superagentThrottle = require('superagent-throttle');

var _superagentThrottle2 = _interopRequireDefault(_superagentThrottle);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _getSlackApiData2 = require('./get-slack-api-data');

var _getSlackApiData3 = _interopRequireDefault(_getSlackApiData2);

var NO_OP = function NO_OP() {};

/**
 * Throttle requests to no more than 15 per minute to avoid hitting Slack API's
 * rate limit.
 *
 * @see [Slack API rate limit docs](https://api.slack.com/docs/rate-limits#web)
 */
var superagentThrottle = new _superagentThrottle2['default']({
  active: true,
  concurrent: 5,
  rate: 15,
  ratePer: 60000
});

function uploadEmoji(file) {
  var callback = arguments.length <= 1 || arguments[1] === undefined ? NO_OP : arguments[1];

  var _getSlackApiData = (0, _getSlackApiData3['default'])();

  var apiToken = _getSlackApiData.apiToken;
  var versionUid = _getSlackApiData.versionUid;

  var timestamp = Date.now() / 1000;
  var version = versionUid ? versionUid.substring(0, 8) : 'noversion';
  var id = _uuid2['default'].v4();
  var name = file.name.split('.')[0];
  var imageUploadRequest = _superagent2['default'].post('/api/emoji.add').withCredentials().query('_x_id=' + version + '-' + timestamp).field('name', name).field('mode', 'data').field('token', apiToken).attach('image', file).use(superagentThrottle.plugin()).end(function (error, response) {
    var uploadError = error || _lodash2['default'].get(response.body, 'error');
    callback(uploadError, response);
  });

  return id;
}

module.exports = exports['default'];

},{"./get-slack-api-data":21,"lodash":6,"superagent":12,"superagent-throttle":11,"uuid":17}]},{},[20])