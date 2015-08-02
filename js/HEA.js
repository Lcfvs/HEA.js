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
    void function (global) {
        'use strict';
        
        var charsetLength,
            utils,
            core;
        
        charsetLength = 65536;
        
        utils = function () {
            var utils;
            
            utils = {};
            
            /**
            @method demethodize(method) - avoids .call method
                @argument {Function} method
                @return {Function}
                    @argument {Mixed} context
                    @rest {Mixed} args
                    @return {Mixed}
            */
            utils.demethodize = Function.bind.bind(Function.call);
            
            /**
            @method demethodize(method) - avoids .apply method
                @argument {Function} method
                @return {Function}
                    @argument {Mixed} context
                    @argument {Array} args
                    @return {Mixed}
            */
            utils.demethodizeAll = Function.bind.bind(Function.apply);
            
            /**
            @method spliceAll(array, index, howMany[, values])
                @argument {Array} array
                @argument {Number} index
                @argument {Number} howMany
                @optional @argument {Array} values
                @return {Array}
            */
            utils.spliceAll = function () {
                var spliceAll;
                
                spliceAll = utils.demethodizeAll(Array.prototype.splice);
                
                return function (array, index, howMany, values) {
                    var args;

                    args = [index, howMany].concat(values);
                    
                    return spliceAll(array, args);
                };
            }();
            
            /**
            @method fromCharCodes(charCodes)
                @argument {Array} charCodes
                @return {String}
            */
            utils.fromCharCodes = utils.demethodizeAll(String.fromCharCode, null);
            
            /**
            @method toCodePoints(string)
                @argument {String} string
                @return {Array}
            */
            utils.fromCodePoints = function (codePoints) {
                var iterator,
                    current,
                    start,
                    end;
                
                iterator = codePoints.length - 1;
                
                for (;iterator; iterator -= 1) {
                    current = codePoints[iterator] - 0x10000;
                    
                    if (current >= 0) {
                        start = 0xD800 + (current >> 10);
                        end = 0xDC00 + (current & 0x3FF);
                      
                        codePoints.splice(iterator, 1, start, end);
                    }
                }
                
                return utils.fromCharCodes(codePoints);
            };
            
            /**
            @method toCodePoints(string)
                @argument {String} string
                @return {Array}
            */
            utils.toCodePoints = function (string) {
                var iterator,
                    length,
                    codePoints,
                    current,
                    next;
                
                iterator = 0;
                length = string.length;
                codePoints = [];
                
                for (; iterator < length; iterator += 1) {
                    current = string.charCodeAt(iterator);
                    
                    if (current >= 0xD800 && current < 0xDC00 && iterator + 1 < length) {
                        next = string.charCodeAt(iterator + 1);
                        
                        if (next >= 0xDC00 && next < 0xE000) {
                            iterator += 1;
                            
                            codePoints.push(0x10000 + ((current - 0xD800) << 10) + (next - 0xDC00));
                            
                            continue;
                        }
                    }
                    
                    codePoints.push(current);
                }
                
                return codePoints;
            };
            
            /**
            @method reduce(array, modulo, modifier)
                @argument {Array} array
                @argument {Number} modulo
                @argument {Number} modifier
                @return {Number}
            */
            utils.reduce = function (array, modulo, modifier) {
                return array.concat([modifier || 0])
                .reduce(function (previous, current) {
                    return (previous + current) % modulo;
                });
            };
            
            /**
            @method random(modulo)
                @argument {Number} modulo
                @return {Number}
            */
            utils.random = function (modulo) {
                return ~~(Math.random() * 1e9) % modulo;
            };
            
            /**
            @method move(array, index, keyCode, toRight)
                @argument {Array} array
                @argument {Number} index
                @argument {Number} keyCode
                @argument {Boolean} toRight
                @return {Array}
            */
            utils.move = function (array, index, keyPoint, toRight) {
                var length,
                    position,
                    sliced1,
                    sliced2,
                    sum1,
                    sum2;

                length = array.length;
                position = toRight ? index : length - index;
                
                sliced1 = array.slice(0, position);
                sliced2 = array.slice(position);

                sum1 = utils.reduce(sliced1, length);
                sum2 = utils.reduce(sliced2, length);

                if ((sum1 ^ keyPoint ^ index) & 1) {
                    sliced1.reverse();
                }

                if ((sum2 ^ keyPoint ^ index) & 1) {
                    sliced2.reverse();
                }

                return sliced2.concat(sliced1);
            };
        
            /**
            @method trampoline(result)
                @argument {Mixed} result
                @return {Mixed}
            */
            utils.trampoline = function (result) {
                while (typeof result === 'function') {
                    result = result();
                }
                
                return result;
            };
            
            return utils;
        }();
        
        core = function () {
            var core;
            
            core = {};
            
            /**
            @method getSaltPoints(length)
                @argument {Number} length
                @return {Array}
            */
            core.getSaltPoints = function () {
                var addSaltPoint;
                
                addSaltPoint = function (saltPoints, length) {
                    var saltCode;
                    
                    if (length < 1) {
                        return saltPoints;
                    }

                    return function () {
                        length -= 1;
                        saltPoints[length] = utils.random(charsetLength);
                        
                        return addSaltPoint(saltPoints, length);
                    };
                };
                
                return function (length) {
                    return utils.trampoline(addSaltPoint([], length));
                };
            }();
            
            /**
            @method getInternalPoints(codePoints, minLength)
                @argument {Array} codePoints
                @argument {Number} minLength
                @return {Array}
            */
            core.getInternalPoints = function () {
                var addCodePoints;
                    
                addCodePoints = function (internalCodePoints, codePoints, minLength) {
                    if (internalCodePoints.length > minLength) {
                        return internalCodePoints;
                    }
                    
                    return function () {
                        var tmpCodePoints;
                        
                        tmpCodePoints = internalCodePoints.concat(codePoints);
                        tmpCodePoints = core.encryptData(codePoints, tmpCodePoints);
                        internalCodePoints = internalCodePoints.concat(tmpCodePoints);
                        
                        return addCodePoints(internalCodePoints, codePoints, minLength);
                    };
                };
                
                return function (codePoints, minLength) {
                    return utils.trampoline(addCodePoints([], codePoints, minLength));
                };
            }();
            
            /**
            @method translate(method, request)
                @argument {Function} method
                @argument {Object} request
                    @property {String} data
                    @property {String} key
                @return {String}
            */
            core.translate = function translate(method, request) {
                var data,
                    key,
                    keyPoints,
                    dataPoints,
                    translatedPoints,
                    translatedData;

                data = request.data;
                key = request.key;
                
                if (key.length === 0) {
                    translatedData = data;
                } else {
                    keyPoints = utils.toCodePoints(key);
                    dataPoints = utils.toCodePoints(data);
                    translatedPoints = method(keyPoints, dataPoints);
                    translatedData = utils.fromCodePoints(translatedPoints);
                }
                
                return translatedData;
            };
            
            /**
            @method encrypt((keyPoints, dataPoints))
                @argument {Array} keyPoints
                @argument {Array} dataPoints
                @return {Array}
            */
            core.encrypt = function (keyPoints, dataPoints) {
                var modifier,
                    dataLength,
                    saltModulo,
                    saltLength,
                    minKeyLength,
                    internalPoints,
                    saltIndex,
                    saltPoints,
                    tmpPoints,
                    encryptedPoints;

                modifier = utils.random(charsetLength);
                dataLength = dataPoints.length;
                saltModulo = keyPoints.length;
                saltLength = utils.reduce(keyPoints, saltModulo, modifier);
                minKeyLength = dataLength + saltLength + 1;
                internalPoints = core.getInternalPoints(keyPoints, minKeyLength);
                saltIndex = utils.reduce(internalPoints, dataLength);
                saltPoints = core.getSaltPoints(saltLength);
                tmpPoints = core.encryptData(internalPoints, dataPoints);
                tmpPoints = core.encryptData(saltPoints, tmpPoints);
                utils.spliceAll(tmpPoints, saltIndex, 0, saltPoints);
                tmpPoints.push(core.encryptData(keyPoints, [modifier])[0]);
                encryptedPoints = core.encryptData(keyPoints, tmpPoints);
                
                return encryptedPoints;
            };
            
            /**
            @method decrypt((keyPoints, dataPoints))
                @argument {Array} keyPoints
                @argument {Array} dataPoints
                @return {Array}
            */
            core.decrypt = function (keyPoints, dataPoints) {
                var modifier,
                    saltModulo,
                    saltLength,
                    minKeyLength,
                    dataLength,
                    internalPoints,
                    saltIndex,
                    tmpPoints,
                    saltPoints,
                    decryptedPoints;


                tmpPoints = core.decryptData(keyPoints, dataPoints);
                modifier = core.decryptData(keyPoints, [tmpPoints.pop()])[0];
                saltModulo = keyPoints.length;
                saltLength = utils.reduce(keyPoints, saltModulo, modifier);
                minKeyLength = tmpPoints.length;
                dataLength = minKeyLength - saltLength;
                internalPoints = core.getInternalPoints(keyPoints, minKeyLength);
                saltIndex = utils.reduce(internalPoints, dataLength);
                saltPoints = utils.spliceAll(tmpPoints, saltIndex, saltLength, []);
                tmpPoints = core.decryptData(saltPoints, tmpPoints);
                decryptedPoints = core.decryptData(internalPoints, tmpPoints);

                return decryptedPoints;
            };

            /**
            @method encryptData((keyPoints, dataPoints))
                @argument {Array} keyPoints
                @argument {Array} dataPoints
                @return {Array}
            */
            core.encryptData = function () {
                var encrypt;
                
                encrypt = function (keyPoints, dataPoints, keyIterator) {
                    if (keyIterator === keyPoints.length) {
                        return dataPoints;
                    }
                    
                    return function () {
                        var dataIterator,
                            dataLength,
                            keyPoint,
                            modifier,
                            index,
                            tmpPoints,
                            dataPoint;
                        
                        dataIterator = 0;
                        dataLength = dataPoints.length;
                        keyPoint = keyPoints[keyIterator];
                        modifier = keyPoint;
                        index = (dataLength + keyIterator + dataIterator) % dataLength;

                        if ((dataLength ^ keyPoint ^ charsetLength) % 2) {
                            dataPoints.reverse();
                        }

                        tmpPoints = utils.move(dataPoints, index, keyPoint, true);

                        for (; dataIterator < dataLength; dataIterator += 1) {
                            dataPoint = tmpPoints[dataIterator];
                            modifier = ((dataPoint + modifier) ^ keyPoint) % charsetLength;
                            tmpPoints[dataIterator] = modifier;
                        }

                        return encrypt(keyPoints, tmpPoints, keyIterator + 1);
                    };
                };
                
                return function (keyPoints, dataPoints) {
                    return utils.trampoline(encrypt(keyPoints, dataPoints, 0));
                };
            }();
            
            /**
            @method decryptData((keyPoints, dataPoints))
                @argument {Array} keyPoints
                @argument {Array} dataPoints
                @return {Array}
            */
            core.decryptData = function () {
                var decrypt;
                
                decrypt = function (keyPoints, dataPoints, keyIterator) {
                    if (keyIterator < 0) {
                        return dataPoints;
                    }
                    
                    return function () {
                        var dataLength,
                            dataIterator,
                            keyPoint,
                            dataPoint,
                            modifier,
                            index;
                        
                        dataLength = dataPoints.length;
                        dataIterator = dataLength - 1;
                        keyPoint = keyPoints[keyIterator];

                        for (; dataIterator > -1; dataIterator -= 1) {
                            dataPoint = dataPoints[dataIterator] + charsetLength;

                            modifier = dataIterator === 0
                                ? keyPoint
                                : dataPoints[dataIterator - 1];

                            dataPoint = ((dataPoint ^ keyPoint) - modifier) % charsetLength;
                            dataPoints[dataIterator] = dataPoint;
                        }
                        
                        index = (dataLength + keyIterator + dataIterator + 1) % dataLength;

                        dataPoints = utils.move(dataPoints, index, keyPoint, false);

                        if ((dataLength ^ keyPoint ^ charsetLength) % 2) {
                            dataPoints.reverse();
                        }
                    
                        return decrypt(keyPoints, dataPoints, keyIterator - 1);
                    };
                };   
                
                return function (keyPoints, dataPoints) {
                    return utils.trampoline(decrypt(keyPoints, dataPoints, keyPoints.length - 1));
                };
            }();
        
            return core;
        }();
        
        /**
        @property {Object} HEA
            @method {Function} encrypt($request)
                @argument {Object} request
                    @property {String} data
                    @property {String} key
                @return {String}
            @method {Function} decrypt($request)
                @argument {Object} request
                    @property {String} data
                    @property {String} key
                @return {String}
        */
        global.HEA = {
            encrypt: core.translate.bind(this, core.encrypt),
            decrypt: core.translate.bind(this, core.decrypt)
        };
    }(this);
    
    void function (scope) {
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
    }(this);
};

sourceData = '(' + source + '())';
sourceBlob = new Blob([sourceData], {type: 'application/javascript'});
HEASourceURL = window.URL.createObjectURL(sourceBlob);
