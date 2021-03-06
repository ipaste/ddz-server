/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var delta = 0x9E3779B9;


function longArrayToString(data, includeLength) {
    var result = [];
    var length = data.length
        , n = (length - 1) << 2;
    if (includeLength) {
        var m = data[length - 1];
        if ((m < n - 3) || (m > n)) return null;
        n = m;
    }
    for (var i = 0; i < length; ++i) {
//        data[i] = String.fromCharCode(
//            data[i] & 0xff,
//            data[i] >>> 8 & 0xff,
//            data[i] >>> 16 & 0xff,
//            data[i] >>> 24 & 0xff
//        );
      result.push(String.fromCharCode(data[i] & 0xff));
      result.push(String.fromCharCode(data[i] >>> 8 & 0xff));
      result.push(String.fromCharCode(data[i] >>> 16 & 0xff));
      result.push(String.fromCharCode(data[i] >>> 24 & 0xff));
    }
    if (includeLength) {
        return result.join("").substring(0, n);
    }
    else {
        return result.join("");
    }
}

function stringToLongArray(string, includeLength) {
    var length = string.length;
    var result = [];
    for (var i = 0; i < length; i += 4) {
        result[i >> 2] = (string.charCodeAt(i) |
            string.charCodeAt(i + 1) << 8 |
            string.charCodeAt(i + 2) << 16 |
            string.charCodeAt(i + 3) << 24);
    }
    if (includeLength) {
        result[result.length] = length;
    }
    return result;
}

function longArrayToBuffer(data, includeLength) {
  var length = data.length;
//  if (!!includeLength) {
//    length --;
//  }
  var buff = new Buffer(length * 4);
  for (var i=0; i<length; i++) {
    buff.writeInt32LE(data[i] & 0xffffffff, i * 4);
  }

  if (!!includeLength) {
    var newLen = data[length-1];
    buff = buff.slice(0, newLen);
  }

  return buff;
}

function bufferToLongArray(buffer, includeLength) {
  var length = buffer.length;
  var result = [];
  for (var i=0; i<length; i+=4) {
    //result[i >> 2] = buffer[i] + (buffer[i+1] << 8) + (buffer[i+2] << 16) + (buffer[i+3] << 24);
    result[i >> 2] = buffer.readInt32LE(i);
  }
  if (!!includeLength) {
    result[result.length] = length;
  }
  return result;
}

function encryptToArray(string, key) {
    if (string == "") {
        return "";
    }
    var v = stringToLongArray(string, true)
        , k = stringToLongArray(key, false)
        , n = v.length - 1
        , z = v[n]
        , y = v[0]
        , mx, e, p
        , q = Math.floor(6 + 52 / (n + 1))
        , sum = 0;
    if (k.length < 4) {
        k.length = 4;
    }

    while (0 <= --q) {
        sum = sum + delta & 0xffffffff;
        e = sum >>> 2 & 3;
        for (p = 0; p < n; ++p) {
            y = v[p + 1];
            mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            z = v[p] = v[p] + mx & 0xffffffff;
        }
        y = v[0];
        mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        z = v[n] = v[n] + mx & 0xffffffff;
    }

  return v;
}


function decryptToArray(string, key) {
    if (string == "") {
        return "";
    }
    var v;
    if (string instanceof Buffer) {
      v = bufferToLongArray(string, false);
    }
    else if (string instanceof Array){
      v = string;
    }
    else {
      v = stringToLongArray(string, false);
    }
    var k = stringToLongArray(key, false);
    if (k.length < 4) {
        k.length = 4;
    }
    var n = v.length - 1;
    //var n = v.length;

    var z = v[n - 1], y = v[0];
    var mx, e, p, q = Math.floor(6 + 52 / (n + 1)), sum = q * delta & 0xffffffff;
    while (sum != 0) {
        e = sum >>> 2 & 3;
        for (p = n; p > 0; --p) {
            z = v[p - 1];
            mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
            y = v[p] = v[p] - mx & 0xffffffff;
        }
        z = v[n];
        mx = (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[p & 3 ^ e] ^ z);
        y = v[0] = v[0] - mx & 0xffffffff;
        sum = sum - delta & 0xffffffff;
    }

    return v;
}

function encrypt(string, key) {
  var result = encryptToArray(string, key);
  return longArrayToString(result, false);
}

function decrypt(string, key) {
  var result = decryptToArray(string, key);
  return longArrayToString(result, false);
}

function encryptToBuffer(string, key) {
  var result = encryptToArray(string, key);
  var buf = longArrayToBuffer(result, false);

  return buf;
}

function decryptFromBuffer(buf, key) {
  //var result = bufferToLongArray(buf, false);
  var decryptedArray = decryptToArray(buf);
  var result = longArrayToBuffer(decryptedArray, true);
  return result;
}

exports.encryptToArray  =  encryptToArray;
exports.encrypt  =  encrypt;
exports.decrypt = decrypt;
exports.decryptToArray = decryptToArray;
exports.stringToLongArray = stringToLongArray;
exports.longArrayToString = longArrayToString;
exports.bufferToLongArray = bufferToLongArray;
exports.longArrayToBuffer = longArrayToBuffer;
exports.encryptToBuffer = encryptToBuffer;
exports.decryptFromBuffer = decryptFromBuffer;

