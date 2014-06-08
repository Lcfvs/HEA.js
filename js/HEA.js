/*
Copyright 2014 Lcf.vs
Released under the MIT license
https://github.com/Lcfvs/HEA.js
*/
var source,
    sourceData,
    sourceBlob,
    HEASourceURL;

source = function () {
    (function (scope) {
        'use strict';

        var charsetLength,
            toString,
            toCharCodes,
            move,
            reduce,
            spliceAll,
            random,
            getSaltCodes,
            getInternalKeyCodes,
            encryptData,
            decryptData,
            encrypt,
            decrypt,
            translate;

        charsetLength = 65536;
        
        toString = (function () {
            var fromCharCode,
                toStr,
                toString;

            fromCharCode = String.fromCharCode;
            toStr = fromCharCode.apply.bind(fromCharCode, String);

            toString = function toString(data) {
                var isArray,
                    charCodes,
                    str;

                isArray = data instanceof Array;

                charCodes = isArray
                    ? data
                    : arguments;

                str = toStr(charCodes);

                return str;
            };

            return toString;
        }());

        toCharCodes = (function () {
            var charCodeAt,
                toCharCode,
                toCharCodes,
                push,
                pushTo;

            charCodeAt = String.prototype.charCodeAt;
            toCharCode = charCodeAt.call.bind(charCodeAt);
            push = Array.prototype.push;
            pushTo = push.call.bind(push);

            toCharCodes = function toCharCodes(str) {
                var iterator,
                    charCodes,
                    length,
                    charCode;

                iterator = 0;
                charCodes = [];
                length = str.length;

                for (; iterator < length; iterator += 1) {
                    charCode = toCharCode(str, iterator);
                    charCodes.push(charCode);
                }

                return charCodes;
            };

            return toCharCodes;
        }());

        move = function move(data, index, keyCode, toRight) {
            var dataLength,
                position,
                sliced1,
                sliced2,
                sum1,
                sum2,
                movedData;

            dataLength = data.length;
            position = toRight ? index : dataLength - index;
            sliced1 = data.slice(0, position);
            sliced2 = data.slice(position);

            sum1 = reduce(sliced1, dataLength);
            sum2 = reduce(sliced2, dataLength);

            if ((sum1 ^ keyCode ^ index) & 1) {
                sliced1.reverse();
            }

            if ((sum2 ^ keyCode ^ index) & 1) {
                sliced2.reverse();
            }

            movedData = sliced2.concat(sliced1);

            return movedData;

            return movedData;
        };

        reduce = function reduce(data, modulo, modifier) {
            var value,
                index,
                length;
                
            value = 0;
            index = 0;
            length = data.length;
            
            for (; index < length; index += 1) {
                value = (value + data[index]) % modulo;
            }
            
            value %= modulo;
            value += modifier || 0;

            return value;
        };

        spliceAll = (function () {
            var splice,
                spliceAll;

            splice = Array.prototype.splice;

            spliceAll = function spliceAll(data, index, howMany, values) {
                var args;

                args = [index, howMany].concat(values);
                splice.apply(data, args);
            };

            return spliceAll;
        }());

        random = function random(modulo) {
            var value;
            
            value = ~~(Math.random() * 1e9) % modulo;
            
            return value;
        };

        getSaltCodes = function getSaltCodes(length) {
            var saltCodes,
                saltCode;

            saltCodes = [];

            while (saltCodes.length < length) {
                saltCode = random(charsetLength);
                saltCodes.push(saltCode);
            }

            return saltCodes;
        };

        getInternalKeyCodes = function getInternalKeyCodes(keyCodes, minLength) {
            var internalKeyCodes,
                tmpKeyCodes;

            internalKeyCodes = [];

            while (internalKeyCodes.length < minLength) {
                tmpKeyCodes = internalKeyCodes.concat(keyCodes);
                tmpKeyCodes = encryptData(keyCodes, tmpKeyCodes);
                internalKeyCodes = internalKeyCodes.concat(tmpKeyCodes);
            }

            return internalKeyCodes;
        };

        encrypt = function encrypt(keyCodes, dataCodes) {
            var modifier,
                dataLength,
                saltModulo,
                saltLength,
                minKeyLength,
                internalKeyCodes,
                saltIndex,
                saltCodes,
                tmpDataCodes,
                encryptedDataCodes;

            modifier = random(charsetLength);
            dataLength = dataCodes.length;
            saltModulo = keyCodes.length;
            saltLength = reduce(keyCodes, saltModulo, modifier);
            minKeyLength = dataLength + saltLength + 1;
            internalKeyCodes = getInternalKeyCodes(keyCodes, minKeyLength);
            saltIndex = reduce(internalKeyCodes, dataLength) - 1;
            saltCodes = getSaltCodes(saltLength);

            tmpDataCodes = encryptData(internalKeyCodes, dataCodes);
            spliceAll(tmpDataCodes, saltIndex, 0, saltCodes);
            encryptedDataCodes = encryptData(keyCodes, tmpDataCodes);
            encryptedDataCodes.push(encryptData(keyCodes, [modifier]));
            
            return encryptedDataCodes;
        };

        decrypt = function decrypt(keyCodes, dataCodes) {
            var minKeyLength,
                modifier,
                saltModulo,
                saltLength,
                dataLength,
                internalKeyCodes,
                saltIndex,
                tmpDataCodes,
                decryptedDataCodes;

            minKeyLength = dataCodes.length;
            modifier = decryptData(keyCodes, [dataCodes.pop()])[0];
            saltModulo = keyCodes.length;
            saltLength = reduce(keyCodes, saltModulo, modifier);
            dataLength = minKeyLength - saltLength - 1;
            internalKeyCodes = getInternalKeyCodes(keyCodes, minKeyLength);
            saltIndex = reduce(internalKeyCodes, dataLength) - 1;

            tmpDataCodes = decryptData(keyCodes, dataCodes);
            spliceAll(tmpDataCodes, saltIndex, saltLength, []);
            decryptedDataCodes = decryptData(internalKeyCodes, tmpDataCodes);

            return decryptedDataCodes;
        };

        encryptData = function encryptData(keyCodes, dataCodes) {
            var tmpDataCodes,
                keyLength,
                dataLength,
                keyIterator,
                keyCode,
                dataIterator,
                dataCode,
                lastCode,
                index;

            tmpDataCodes = [].concat(dataCodes);
            keyLength = keyCodes.length;
            dataLength = tmpDataCodes.length;
            keyIterator = 0;

            for (; keyIterator < keyLength; keyIterator += 1) {
                dataIterator = 0;
                keyCode = keyCodes[keyIterator];
                lastCode = keyCode;
                index = (dataLength + keyIterator + dataIterator) % dataLength;

                if ((dataLength ^ keyCode ^ charsetLength) % 2) {
                    tmpDataCodes.reverse();
                }

                tmpDataCodes = move(tmpDataCodes, index, keyCode, true);

                for (; dataIterator < dataLength; dataIterator += 1) {
                    dataCode = tmpDataCodes[dataIterator];
                    lastCode = ((dataCode + lastCode) ^ keyCode) % charsetLength;
                    tmpDataCodes[dataIterator] = lastCode;
                }
            }

            return tmpDataCodes;
        };

        decryptData = function decryptData(keyCodes, dataCodes) {
            var tmpDataCodes,
                keyLength,
                dataLength,
                keyIterator,
                keyCode,
                dataIterator,
                dataCode,
                lastCode,
                index;

            tmpDataCodes = [].concat(dataCodes);
            keyLength = keyCodes.length;
            dataLength = tmpDataCodes.length;
            keyIterator = keyLength - 1;

            for (; keyIterator > -1; keyIterator -= 1) {
                dataIterator = dataLength - 1;
                keyCode = keyCodes[keyIterator];

                for (; dataIterator > -1; dataIterator -= 1) {
                    dataCode = tmpDataCodes[dataIterator] + charsetLength;

                    lastCode = dataIterator === 0
                        ? keyCode
                        : tmpDataCodes[dataIterator - 1];

                    dataCode = ((dataCode ^ keyCode) - lastCode) % charsetLength;
                    tmpDataCodes[dataIterator] = dataCode;
                }
                
                index = (dataLength + keyIterator + dataIterator + 1) % dataLength;

                tmpDataCodes = move(tmpDataCodes, index, keyCode, false);

                if ((dataLength ^ keyCode ^ charsetLength) % 2) {
                    tmpDataCodes.reverse();
                }
            }

            return tmpDataCodes;
        };

        translate = function translate(method, request) {
            var key,
                data,
                keyCodes,
                dataCodes,
                translatedDataCodes,
                translatedData;

            key = request.key;
            data = request.data;
            
            if (key.length === 0) {
                translatedData = data;
            } else {
                keyCodes = toCharCodes(key);
                dataCodes = toCharCodes(data);
                translatedDataCodes = method(keyCodes, dataCodes);
                translatedData = toString(translatedDataCodes);
            }
            
            return translatedData;
        };

        scope.HEA = {
            encrypt: translate.bind(this, encrypt),
            decrypt: translate.bind(this, decrypt)
        };
    }(this));

    (function (scope) {
        'use strict';

        var HEA,
            postMessage,
            onmessage;
        
        HEA = scope.HEA;
        
        postMessage = scope.postMessage;
        
        onmessage = function onmessage(event) {
            var request,
                method,
                result;
            
            request = event.data;
            
            method = HEA[request.method];
            
            result = method(request);
            
            postMessage(result);
        };
        
        scope.onmessage = onmessage;
    }(this));
};

sourceData = '(' + source + '())';
sourceBlob = new Blob([sourceData], {type: 'application/javascript'});
HEASourceURL = window.URL.createObjectURL(sourceBlob);