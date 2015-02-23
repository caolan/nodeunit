var format = require('../');
var assert = require('assert');

it('should format numbers', function() {
  assert.equal(format(10), '10');
  assert.equal(format(0.1e-5), '0.000001');
  assert.equal(format(-0), '-0');
  assert.equal(format(Infinity), 'Infinity');
  assert.equal(format(-Infinity), '-Infinity');
  assert.equal(format(NaN), 'NaN');
});

it('should format undefined', function() {
  assert.equal(format(undefined), 'undefined');
  assert.equal(format(void 0), 'undefined');
});

it('should format null', function() {
  assert.equal(format(null), 'null');
});

it('should format string', function() {
  assert.equal(format('abc'), "'abc'");
  assert.equal(format('abc" \' '), "'abc\" \\' '");
});

it('should format boolean', function() {
  assert.equal(format(true), 'true');
  assert.equal(format(false), 'false');
});

it('should format primitive wrappers', function() {
  assert.equal(format(new Number(10)), '[Number: 10]');
  assert.equal(format(new Boolean(true)), '[Boolean: true]');
  assert.equal(format(new String('abc')), '[String: \'abc\']');
});

it('should format primitive wrappers with keys', function() {
  var b = new Boolean(true);
  b.abc = 10;
  assert.equal(format(b), '{ [Boolean: true] abc: 10 }');

  var s = new String('abc');
  s.abc = 10;
  assert.equal(format(s), "{ [String: 'abc'] abc: 10 }");
});

it('should format regex', function() {
  assert.equal(format(/abc/gi), '/abc/gi');
  assert.equal(format(new RegExp('abc', 'gi')), '/abc/gi');
});

it('should format regex with keys', function() {
  var r = /abc/gi;
  r.abc = 10;
  assert.equal(format(r), '{ /abc/gi abc: 10 }');
});

function fff() {
}

it('should format function', function() {
  var f = function() {
  };
  assert.equal(format(f), '[Function]');

  assert.equal(format(fff), '[Function: fff]');
});

var getter = Object.create(null, {
  a: {
    get: function() {
      return 'aaa';
    }
  }
});
var setter = Object.create(null, {
  b: {
    set: function() {
    }
  }
});
var getterAndSetter = Object.create(null, {
  c: {
    get: function() {
      return 'ccc';
    },
    set: function() {
    }
  }
});

it('should format object', function() {
  assert.equal(format({a: 10, b: '10', '123': 'asd'}), "{ '123': 'asd', a: 10, b: '10' }");

  assert.equal(format(getter, {keys: false}), '{ a: [Getter] }');
  assert.equal(format(setter, {keys: false}), '{ b: [Setter] }');
  assert.equal(format(getterAndSetter, {keys: false}), '{ c: [Getter/Setter] }');

  var obj = {a: 10};
  obj.b = obj;
  assert.equal(format(obj), '{ a: 10, b: [Circular] }');

  var w = {
    '\\': 1,
    '\\\\': 2,
    '\\\\\\': 3,
    '\\\\\\\\': 4
  };

  var y = ['a', 'b', 'c'];
  y['\\\\\\'] = 'd';

  assert.ok(format(w),
    '{ \'\\\': 1, \'\\\\\': 2, \'\\\\\\\': 3, \'\\\\\\\\\': 4 }');
  assert.ok(format(y), '[ \'a\', \'b\', \'c\', \'\\\\\\\': \'d\' ]');
});

it('should format arguments', function() {
  var f = function() {
    return arguments
  };
  assert.equal(format(f(1, 2, 3)), '{ \'0\': 1, \'1\': 2, \'2\': 3 }');
});

it('should format node buffer', function() {
  if(typeof Buffer !== 'undefined') {
    var b = new Buffer('abc');
    assert.equal(format(b), '[Buffer: 61 62 63]');
  }
});

it('should format typed arrays', function() {
  if(typeof ArrayBuffer != 'undefined') {
    var buffer = new ArrayBuffer(8);
    for(var i = 0; i < buffer.byteLength; i++) buffer[i] = 0x00;
    buffer[1] = 0x20;
    buffer[2] = 0x2;
    assert.equal(format(buffer), '[ArrayBuffer: 00 20 02 00 00 00 00 00]');

    var int8 = new Int8Array(3);
    int8[0] = 0x20;
    int8[1] = 0x2;
    assert.equal(format(int8), '[Int8Array: 20 02 00]');

    //var dataView = new DataView(buffer);
    //assert.equal(format(dataView), '[DataView: 00 20 02 00 00 00 00 00]');
  }
});

it('should format html elements', function() {
  if(typeof window != 'undefined' && typeof document != 'undefined') {
    var btn = document.createElement("BUTTON");
    var t = document.createTextNode("CLICK ME");
    btn.appendChild(t);

    assert.equal(format(btn), '<button>CLICK ME</button>');

    assert.equal(format(t), 'CLICK ME');
  }
});

it('should correctly indent', function() {
  assert.equal(format({ a: { b: 'abc' }, d: 'abc'}, { maxLineLength: 0 }), '{\n  a: {\n    b: \'abc\'\n  },\n  d: \'abc\'\n}')
});