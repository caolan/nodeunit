var toString = Object.prototype.toString;

var types = {
  NUMBER: 'number',
  UNDEFINED: 'undefined',
  STRING: 'string',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  FUNCTION: 'function',
  NULL: 'null',
  ARRAY: 'array',
  REGEXP: 'regexp',
  DATE: 'date',
  ERROR: 'error',
  ARGUMENTS: 'arguments',
  SYMBOL: 'symbol',
  ARRAY_BUFFER: 'array-buffer',
  TYPED_ARRAY: 'typed-array',
  DATA_VIEW: 'data-view',
  MAP: 'map',
  SET: 'set',
  WEAK_SET: 'weak-set',
  WEAK_MAP: 'weak-map',
  PROMISE: 'promise',

  WRAPPER_NUMBER: 'object-number',
  WRAPPER_BOOLEAN: 'object-boolean',
  WRAPPER_STRING: 'object-string',

// node buffer
  BUFFER: 'buffer',

// dom html element
  HTML_ELEMENT: 'html-element',
  HTML_ELEMENT_TEXT: 'html-element-text',
  DOCUMENT: 'document',
  WINDOW: 'window',
  FILE: 'file',
  FILE_LIST: 'file-list',
  BLOB: 'blob',

  XHR: 'xhr'
};

module.exports = function getType(instance) {
  var type = typeof instance;

  switch(type) {
    case types.NUMBER:
      return types.NUMBER;
    case types.UNDEFINED:
      return types.UNDEFINED;
    case types.STRING:
      return types.STRING;
    case types.BOOLEAN:
      return types.BOOLEAN;
    case types.FUNCTION:
      return types.FUNCTION;
    case types.SYMBOL:
      return types.SYMBOL;
    case types.OBJECT:
      if(instance === null) return types.NULL;

      var clazz = toString.call(instance);

      switch(clazz) {
        case '[object String]':
          return types.WRAPPER_STRING;
        case '[object Boolean]':
          return types.WRAPPER_BOOLEAN;
        case '[object Number]':
          return types.WRAPPER_NUMBER;
        case '[object Array]':
          return types.ARRAY;
        case '[object RegExp]':
          return types.REGEXP;
        case '[object Error]':
          return types.ERROR;
        case '[object Date]':
          return types.DATE;
        case '[object Arguments]':
          return types.ARGUMENTS;
        case '[object Math]':
          return types.OBJECT;
        case '[object JSON]':
          return types.OBJECT;
        case '[object ArrayBuffer]':
          return types.ARRAY_BUFFER;
        case '[object Int8Array]':
          return types.TYPED_ARRAY;
        case '[object Uint8Array]':
          return types.TYPED_ARRAY;
        case '[object Uint8ClampedArray]':
          return types.TYPED_ARRAY;
        case '[object Int16Array]':
          return types.TYPED_ARRAY;
        case '[object Uint16Array]':
          return types.TYPED_ARRAY;
        case '[object Int32Array]':
          return types.TYPED_ARRAY;
        case '[object Uint32Array]':
          return types.TYPED_ARRAY;
        case '[object Float32Array]':
          return types.TYPED_ARRAY;
        case '[object Float64Array]':
          return types.TYPED_ARRAY;
        case '[object DataView]':
          return types.DATA_VIEW;
        case '[object Map]':
          return types.MAP;
        case '[object WeakMap]':
          return types.WEAK_MAP;
        case '[object Set]':
          return types.SET;
        case '[object WeakSet]':
          return types.WEAK_SET;
        case '[object Promise]':
          return types.PROMISE;
        case '[object Window]':
          return types.WINDOW;
        case '[object HTMLDocument]':
          return types.DOCUMENT;
        case '[object Blob]':
          return types.BLOB;
        case '[object File]':
          return types.FILE;
        case '[object FileList]':
          return types.FILE_LIST;
        case '[object XMLHttpRequest]':
          return types.XHR;
        case '[object Text]':
          return types.HTML_ELEMENT_TEXT;
        default:
          if((typeof Promise === types.FUNCTION && instance instanceof Promise) || (getType(instance.then) === types.FUNCTION && instance.then.length >= 2)) {
            return types.PROMISE;
          }

          if(typeof Buffer !== 'undefined' && instance instanceof Buffer) {
            return types.BUFFER;
          }

          if(/^\[object HTML\w+Element\]$/.test(clazz)) {
            return types.HTML_ELEMENT;
          }

          if(clazz === '[object Object]') {
            return types.OBJECT;
          }
      }
  }
};

Object.keys(types).forEach(function(typeName) {
  module.exports[typeName] = types[typeName];
});
