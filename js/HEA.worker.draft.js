/*
Copyright 2013 Lcf.vs
Released under the MIT license
https://github.com/Lcfvs/HEA.js
*/
'use strict';

var
HEA;

HEA = function(global) {
    var
    toCodePoints,
    fromCodePoints,
    fromByteString,
    toByteString,
    convert,
    getUint8Array,
    getUint16Array,
    randomUint16,
    getRandomPoints,
    getRandomPoints,
    min,
    max,
    sum,
    reverse,
    trampoline,
    encryptData,
    decryptData;

    toCodePoints = function(str) {
        return [].map.call(str.normalize('NFKC'), function(chr) {
            return chr.codePointAt(0);
        });
    };

    fromCodePoints = function(points) {
        return String.fromCodePoint.apply(null, points);
    };

    fromByteString = function(str) {
        var
        codes;
        
        codes = [];
        
        str.split('').forEach(function(chr, key) {
            if (key & 1) {
                return;
            }
            
            codes.push(str.charCodeAt(key) * 256 + str.charCodeAt(key + 1));
        });
        
        return codes;
    };

    toByteString = function(codes) {
        var
        bytes;
        
        bytes = new Uint8Array(codes.length * 2);
        
        codes.forEach(function(value, key) {
            bytes[key * 2] = value >>> 8;
            bytes[key * 2 + 1] = value;
        });
        
        return String.fromCharCode.apply(null, bytes);
    };

    convert = function(data, method, inEncoding, outEncoding) {
        if (method) {
            return method(data);
        }
        
        return (new Buffer(data, inEncoding)).toString(outEncoding);
    };
    
    getUint16Array = function(length) {
        return new Uint16Array(length);
    };
    
    getUint8Array = function(length) {
        return new Uint8Array(length);
    };
    
    randomUint16 = function(length) {
        var
        generate,
        values;
        
        if (global.crypto) {
            return crypto.getRandomValues(getUint16Array(length));
        }
        
        generate = function() {
            if (values.length === length) {
                return values;
            }
            
            values.push(Math.ceil(Math.random() * 65536));
            
            return generate;
        };
        
        values = [];
        
        return trampoline(generate);
    };
    
    getRandomPoints = function() {
        var
        getLength,
        length,
        half;
        
        getLength = function() {
            var
            result;
            
            result = randomUint16(1)[0];

            if (result >= 32) {
                return result;
            }
            
            return getLength;
        };
        
        length = trampoline(getLength);
        half = length >>> 1;
        
        return Array.from(randomUint16(half))
        .concat(Array.from(randomUint16(length - half)));
    };

    min = function(values) {
        return values.reduce(function(previous, current) {
            return previous < current
                ? previous
                : current;
        }, 0);
    };

    max = function(values) {
        return values.reduce(function(previous, current) {
            return previous > current
                ? previous
                : current;
        }, 0);
    };

    reverse = function(dataPoints, keyPoint) {
        if ((min(dataPoints) ^ max(dataPoints) ^ keyPoint) & 1) {
            dataPoints.reverse();
        }
        
        return dataPoints;
    };

    encryptData = function(dataPoints, keyPoints) {
        dataPoints = dataPoints.slice(0);
        keyPoints = keyPoints.slice(0);
        
        keyPoints.forEach(function(keyPoint) {
            var
            last;
            
            last = keyPoint;
            
            dataPoints = reverse(getUint16Array(dataPoints).map(function(dataPoint) {
                var
                current;
                
                current = ((last + dataPoint) ^ keyPoint);
                last = dataPoint;
                
                return current;
            }), keyPoint);
        });
        
        return Array.from(dataPoints);
    };

    decryptData = function(dataPoints, keyPoints) {
        dataPoints = dataPoints.slice(0);
        keyPoints = keyPoints.slice(0);
        keyPoints.reverse();

        keyPoints.forEach(function(keyPoint) {
            var
            last;
            
            last = keyPoint;
            
            dataPoints = getUint16Array(reverse(dataPoints, keyPoint)).map(function(dataPoint) {
                last = ((dataPoint ^ keyPoint) - last + 65536);
                
                return last;
            });
        });
        
        return Array.from(dataPoints);
    };
    
    trampoline = function (value) {
        while (typeof value === 'function') {
            value = value();
        }

        return value;
    };
        
    return {
        encrypt: function(data, key) {
            var
            keyPoints,
            dataPoints,
            randomPoints,
            position,
            encrypted;
            
            keyPoints = toCodePoints(key);
            dataPoints = toCodePoints(data);
            randomPoints = getRandomPoints();
            position = randomUint16(1)[0];
            dataPoints = encryptData(dataPoints, randomPoints);
            
            randomPoints.forEach(function(point) {
                var
                length;
                
                length = dataPoints.length;
                position = (position + point) % length;
                dataPoints.splice(position, 0, point);
            });
            
            dataPoints.unshift(position, randomPoints.length);
            dataPoints = encryptData(dataPoints, keyPoints);
            encrypted = toByteString(dataPoints);

            return convert(encrypted, global.btoa, 'binary', 'base64');
        },
        decrypt: function(data, key) {
            var
            encrypted,
            keyPoints,
            dataPoints,
            randomPoints,
            position,
            iterator,
            length,
            point;
                
            encrypted = convert(data, global.atob, 'base64', 'binary');
            keyPoints = toCodePoints(key);
            dataPoints = fromByteString(encrypted);
            randomPoints = [];
            dataPoints = decryptData(dataPoints, keyPoints);
            position = dataPoints.shift();
            iterator = dataPoints.shift();
            
            for (;iterator;iterator -= 1) {
                point = dataPoints.splice(position, 1)[0];
                length = dataPoints.length;
                position = (position - (point % length) + length) % length;
                randomPoints.unshift(point);
            }
            
            dataPoints = decryptData(dataPoints, randomPoints);

            return fromCodePoints(dataPoints);
        }
    };
}(self);

self.addEventListener('message', function(event) {
    var
    message;
    
    message = event.data;
    
    self.postMessage({
        type: 'result',
        data: PES[message.method](message.data, message.key)
    });
}, false);