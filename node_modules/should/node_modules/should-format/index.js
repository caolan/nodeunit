var getType = require('should-type');

function genKeysFunc(f) {
  return function(value) {
    var k = f(value);
    k.sort();
    return k;
  }
}

//XXX add ability to only inspect some paths
var format = function(value, opts) {
  opts = opts || {};

  if(!('seen' in opts)) opts.seen = [];
  opts.keys = genKeysFunc('keys' in opts && opts.keys === false ? Object.getOwnPropertyNames : Object.keys);

  if(!('maxLineLength' in opts)) opts.maxLineLength = 60;
  if(!('propSep' in opts)) opts.propSep = ',';

  var type = getType(value);
  return (format.formats[type] || format.formats['object'])(value, opts);
};

module.exports = format;

format.formats = {};

function add(t, f) {
  format.formats[t] = f;
}

[ 'undefined',  'boolean',  'null'].forEach(function(name) {
  add(name, String);
});

['number', 'boolean'].forEach(function(name) {
  var capName = name.substring(0, 1).toUpperCase() + name.substring(1);
  add('object-' + name, formatObjectWithPrefix(function(value) {
    return '[' + capName + ': ' + format(value.valueOf()) + ']';
  }));
});

add('object-string', function(value, opts) {
  var realValue = value.valueOf();
  var prefix = '[String: ' + format(realValue) + ']';
  var props = opts.keys(value);
  props = props.filter(function(p) {
    return !(p.match(/\d+/) && parseInt(p, 10) < realValue.length);
  });

  if(props.length == 0) return prefix;
  else return formatObject(value, opts, prefix, props);
});

add('regexp', formatObjectWithPrefix(String));

add('number', function(value) {
  if(value === 0 && 1 / value < 0) return '-0';
  return String(value);
});

add('string', function(value) {
  return '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
      .replace(/'/g, "\\'")
      .replace(/\\"/g, '"') + '\'';
});

add('object', formatObject);

add('array', function(value, opts) {
  var keys = opts.keys(value);
  var len = 0;

  opts.seen.push(value);

  var props = keys.map(function(prop) {
    var desc;
    try {
      desc = Object.getOwnPropertyDescriptor(value, prop) || {value: value[prop]};
    } catch(e) {
      desc = {value: e};
    }

    var f;
    if(prop.match(/\d+/)) {
      f = format(desc.value, opts);
    } else {
      f = formatProperty(desc.value, opts, prop)
    }
    len += f.length;
    return f;
  });

  opts.seen.pop();

  if(props.length === 0) return '[]';

  if(len <= opts.maxLineLength) {
    return '[ ' + props.join(opts.propSep + ' ') + ' ]';
  } else {
    return '[' + '\n' + props.map(addSpaces).join(opts.propSep + '\n') + '\n' + ']';
  }
});

function addSpaces(v) {
  return v.split('\n').map(function(vv) { return '  ' + vv; }).join('\n');
}

function formatObject(value, opts, prefix, props) {
  props = props || opts.keys(value);

  var len = 0;

  opts.seen.push(value);
  props = props.map(function(prop) {
    var f = formatProperty(value, opts, prop);
    len += f.length;
    return f;
  });
  opts.seen.pop();

  if(props.length === 0) return '{}';

  if(len <= opts.maxLineLength) {
    return '{ ' + (prefix ? prefix + ' ' : '') + props.join(opts.propSep + ' ') + ' }';
  } else {
    return '{' + '\n' + (prefix ? prefix + '\n' : '') + props.map(addSpaces).join(opts.propSep + '\n') + '\n' + '}';
  }
}

format.formatPropertyName = function(name, opts) {
  return name.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/) ? name : format(name, opts)
};


function formatProperty(value, opts, prop) {
  var desc;
  try {
    desc = Object.getOwnPropertyDescriptor(value, prop) || {value: value[prop]};
  } catch(e) {
    desc = {value: e};
  }

  var propName = format.formatPropertyName(prop, opts);

  var propValue = desc.get && desc.set ?
    '[Getter/Setter]' : desc.get ?
    '[Getter]' : desc.set ?
    '[Setter]' : opts.seen.indexOf(desc.value) >= 0 ?
    '[Circular]' :
    format(desc.value, opts);

  return propName + ': ' + propValue;
}


function pad2Zero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function pad3Zero(n) {
  return n < 100 ? '0' + pad2Zero(n) : '' + n;
}

function formatDate(value) {
  var to = value.getTimezoneOffset();
  var absTo = Math.abs(to);
  var hours = Math.floor(absTo / 60);
  var minutes = absTo - hours * 60;
  var tzFormat = 'GMT' + (to < 0 ? '+' : '-') + pad2Zero(hours) + pad2Zero(minutes);
  return value.toLocaleDateString() + ' ' + value.toLocaleTimeString() + '.' + pad3Zero(value.getMilliseconds()) + ' ' + tzFormat;
}

function formatObjectWithPrefix(f) {
  return function(value, opts) {
    var prefix = f(value);
    var props = opts.keys(value);
    if(props.length == 0) return prefix;
    else return formatObject(value, opts, prefix, props);
  }
}

add('date', formatObjectWithPrefix(formatDate));

var functionNameRE = /^\s*function\s*(\S*)\s*\(/;

function functionName(f) {
  if(f.name) {
    return f.name;
  }
  var name = f.toString().match(functionNameRE)[1];
  return name;
}

add('function', formatObjectWithPrefix(function(value) {
  var name = functionName(value);
  return '[Function' + (name ? ': ' + name : '') + ']';
}));

add('error', formatObjectWithPrefix(function(value) {
  var name = value.name;
  var message = value.message;
  return '[' + name + (message ? ': ' + message : '') + ']';
}));

function generateFunctionForIndexedArray(lengthProp, name) {
  return function(value) {
    var str = '';
    var max = 50;
    var len = value[lengthProp];
    if(len > 0) {
      for(var i = 0; i < max && i < len; i++) {
        var b = value[i] || 0;
        str += ' ' + pad2Zero(b.toString(16));
      }
      if(len > max)
        str += ' ... ';
    }
    return '[' + (value.constructor.name || name) + (str ? ':' + str : '') + ']';
  }
}

add('buffer', generateFunctionForIndexedArray('length', 'Buffer'));

add('array-buffer', generateFunctionForIndexedArray('byteLength'));

add('typed-array', generateFunctionForIndexedArray('byteLength'));

add('promise', function(value) {
  return '[Promise]';
});

add('xhr', function(value) {
  return '[XMLHttpRequest]';
});

add('html-element', function(value) {
  return value.outerHTML;
});

add('html-element-text', function(value) {
  return value.nodeValue;
});

add('document', function(value) {
  return value.documentElement.outerHTML;
});

add('window', function(value) {
  return '[Window]';
});