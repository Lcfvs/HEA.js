/*
Copyright 2014 Lcf.vs
Released under the MIT license
https://github.com/Lcfvs/HEA.js
*/
var HEASourceURL;

/**
 * {String} HEASourceURL
**/
HEASourceURL = function (global) {
    var source;

    source = function (global) {
        'use strict';

        var charsetLength,
            utils,
            core;

        charsetLength = 65536;

        utils = function () {
            var utils;

            utils = {};

            /**
             *  @method demethodize(method) - avoids .call method
             *      @argument {Function} method
             *      @return {Function}
             *          @argument {Mixed} context
             *          @argument {Mixed} ...args
             *          @return {Mixed}
            **/
            utils.demethodize = Function.bind.bind(Function.call);

            /**
             *  @method demethodize(method) - avoids .apply method
             *      @argument {Function} method
             *      @return {Function}
             *          @argument {Mixed} context
             *          @argument {Array} args
             *          @return {Mixed}
            **/
            utils.demethodizeAll = Function.bind.bind(Function.apply);

            /**
             *  @method spliceAll(array, index, howMany[, values])
             *      @argument {Array} array
             *      @argument {Number} index
             *      @argument {Number} howMany
             *      @argument {Array=} values
             *      @return {Array}
            **/
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
             *  @method fromCharCodes(charCodes)
             *      @argument {Array} charCodes
             *      @return {String}
            **/
            utils.fromCharCodes = utils.demethodizeAll(String.fromCharCode, null);

            /**
             *  @method toCharCodes(string)
             *      @argument {String} string
             *      @return {Array}
            **/
            utils.toCharCodes = function (string) {
                var iterator,
                    length,
                    charCodes;

                iterator = 0;
                length = string.length;
                charCodes = [];

                for (;iterator < length;iterator += 1) {
                    charCodes.push(string.charCodeAt(iterator));
                }

                return charCodes;
            };

            /**
             *  @method reduce(array, modulo, modifier)
             *      @argument {Array} array
             *      @argument {Number} modulo
             *      @argument {Number} modifier
             *      @return {Number}
            **/
            utils.reduce = function (array, modulo, modifier) {
                return array.concat([modifier || 0])
                .reduce(function (previous, current) {
                    return (previous + current) % modulo;
                });
            };

            /**
             *  @method random(modulo)
             *      @argument {Number} modulo
             *      @return {Number}
            **/
            utils.random = function (modulo) {
                return ~~(Math.random() * 1e9) % modulo;
            };

            /**
             *  @method move(array, index, keyCode, toRight)
             *      @argument {Array} array
             *      @argument {Number} index
             *      @argument {Number} keyCode
             *      @argument {Boolean} toRight
             *      @return {Array}
            **/
            utils.move = function (array, index, keyCode, toRight) {
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

                if ((sum1 ^ keyCode ^ index) & 1) {
                    sliced1.reverse();
                }

                if ((sum2 ^ keyCode ^ index) & 1) {
                    sliced2.reverse();
                }

                return sliced2.concat(sliced1);
            };

            /**
             *  @method trampoline(result)
             *      @argument {Mixed} result
             *      @return {Mixed}
            **/
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
             *  @method getSaltCodes(length)
             *      @argument {Number} length
             *      @return {Array}
            **/
            core.getSaltCodes = function () {
                var addSaltCode;

                addSaltCode = function (saltCodes, length) {
                    var saltCode;

                    if (length < 1) {
                        return saltCodes;
                    }

                    return function () {
                        length -= 1;
                        saltCodes[length] = utils.random(charsetLength);

                        return addSaltCode(saltCodes, length);
                    };
                };

                return function (length) {
                    return utils.trampoline(addSaltCode([], length));
                };
            }();

            /**
             *  @method getInternalCodes(charCodes, minLength)
             *      @argument {Array} charCodes
             *      @argument {Number} minLength
             *      @return {Array}
            **/
            core.getInternalCodes = function () {
                var addCodeCodes;

                addCodeCodes = function (internalCodeCodes, charCodes, minLength) {
                    if (internalCodeCodes.length > minLength) {
                        return internalCodeCodes;
                    }

                    return function () {
                        var tmpCodeCodes;

                        tmpCodeCodes = internalCodeCodes.concat(charCodes);
                        tmpCodeCodes = core.encryptData(charCodes, tmpCodeCodes);
                        internalCodeCodes = internalCodeCodes.concat(tmpCodeCodes);

                        return addCodeCodes(internalCodeCodes, charCodes, minLength);
                    };
                };

                return function (charCodes, minLength) {
                    return utils.trampoline(addCodeCodes([], charCodes, minLength));
                };
            }();

            /**
             *  @method translate(method, request)
             *      @argument {Function} method
             *      @argument {Object} request
             *      @argument {String} request.data
             *      @argument {String} request.key
             *      @return {String}
            **/
            core.translate = function (method, request) {
                var data,
                    key,
                    keyCodes,
                    dataCodes,
                    translatedCodes,
                    translatedData;

                data = request.data;
                key = request.key;

                if (key.length === 0) {
                    translatedData = data;
                } else {
                    keyCodes = utils.toCharCodes(key);
                    dataCodes = utils.toCharCodes(data);
                    translatedCodes = method(keyCodes, dataCodes);
                    translatedData = utils.fromCharCodes(translatedCodes);
                }

                return translatedData;
            };

            /**
             *  @method encrypt(keyCodes, dataCodes)
             *      @argument {Array} keyCodes
             *      @argument {Array} dataCodes
             *      @return {Array}
            **/
            core.encrypt = function (keyCodes, dataCodes) {
                var modifier,
                    dataLength,
                    saltModulo,
                    saltLength,
                    minKeyLength,
                    internalCodes,
                    saltIndex,
                    saltCodes,
                    tmpCodes,
                    encryptedCodes;

                modifier = utils.random(charsetLength);
                dataLength = dataCodes.length;
                saltModulo = keyCodes.length;
                saltLength = utils.reduce(keyCodes, saltModulo, modifier);
                minKeyLength = dataLength + saltLength + 1;
                internalCodes = core.getInternalCodes(keyCodes, minKeyLength);
                saltIndex = utils.reduce(internalCodes, dataLength);
                saltCodes = core.getSaltCodes(saltLength);
                tmpCodes = core.encryptData(internalCodes, dataCodes);
                tmpCodes = core.encryptData(saltCodes, tmpCodes);
                utils.spliceAll(tmpCodes, saltIndex, 0, saltCodes);
                tmpCodes.push(core.encryptData(keyCodes, [modifier])[0]);
                encryptedCodes = core.encryptData(keyCodes, tmpCodes);

                return encryptedCodes;
            };

            /**
             *  @method decrypt(keyCodes, dataCodes)
             *      @argument {Array} keyCodes
             *      @argument {Array} dataCodes
             *      @return {Array}
            **/
            core.decrypt = function (keyCodes, dataCodes) {
                var modifier,
                    saltModulo,
                    saltLength,
                    minKeyLength,
                    dataLength,
                    internalCodes,
                    saltIndex,
                    tmpCodes,
                    saltCodes,
                    decryptedCodes;

                tmpCodes = core.decryptData(keyCodes, dataCodes);
                modifier = core.decryptData(keyCodes, [tmpCodes.pop()])[0];
                saltModulo = keyCodes.length;
                saltLength = utils.reduce(keyCodes, saltModulo, modifier);
                minKeyLength = tmpCodes.length;
                dataLength = minKeyLength - saltLength;
                internalCodes = core.getInternalCodes(keyCodes, minKeyLength);
                saltIndex = utils.reduce(internalCodes, dataLength);
                saltCodes = utils.spliceAll(tmpCodes, saltIndex, saltLength, []);
                tmpCodes = core.decryptData(saltCodes, tmpCodes);
                decryptedCodes = core.decryptData(internalCodes, tmpCodes);

                return decryptedCodes;
            };

            /**
             *  @method encryptData(keyCodes, dataCodes)
             *      @argument {Array} keyCodes
             *      @argument {Array} dataCodes
             *      @return {Array}
            **/
            core.encryptData = function () {
                var encrypt;

                encrypt = function (keyCodes, dataCodes, keyIterator) {
                    if (keyIterator === keyCodes.length) {
                        return dataCodes;
                    }

                    return function () {
                        var dataIterator,
                            dataLength,
                            keyCode,
                            modifier,
                            index,
                            tmpCodes,
                            dataCode;

                        dataIterator = 0;
                        dataLength = dataCodes.length;
                        keyCode = keyCodes[keyIterator];
                        modifier = keyCode;
                        index = (dataLength + keyIterator + dataIterator) % dataLength;

                        if ((dataLength ^ keyCode ^ charsetLength) % 2) {
                            dataCodes.reverse();
                        }

                        tmpCodes = utils.move(dataCodes, index, keyCode, true);

                        for (; dataIterator < dataLength; dataIterator += 1) {
                            dataCode = tmpCodes[dataIterator];
                            modifier = ((dataCode + modifier) ^ keyCode) % charsetLength;
                            tmpCodes[dataIterator] = modifier;
                        }

                        return encrypt(keyCodes, tmpCodes, keyIterator + 1);
                    };
                };

                return function (keyCodes, dataCodes) {
                    return utils.trampoline(encrypt(keyCodes, dataCodes, 0));
                };
            }();

            /**
             *  @method decryptData(keyCodes, dataCodes)
             *      @argument {Array} keyCodes
             *      @argument {Array} dataCodes
             *      @return {Array}
            **/
            core.decryptData = function () {
                var decrypt;

                decrypt = function (keyCodes, dataCodes, keyIterator) {
                    if (keyIterator < 0) {
                        return dataCodes;
                    }

                    return function () {
                        var dataLength,
                            dataIterator,
                            keyCode,
                            dataCode,
                            modifier,
                            index;

                        dataLength = dataCodes.length;
                        dataIterator = dataLength - 1;
                        keyCode = keyCodes[keyIterator];

                        for (; dataIterator > -1; dataIterator -= 1) {
                            dataCode = dataCodes[dataIterator] + charsetLength;

                            modifier = dataIterator === 0
                                ? keyCode
                                : dataCodes[dataIterator - 1];

                            dataCode = ((dataCode ^ keyCode) - modifier) % charsetLength;
                            dataCodes[dataIterator] = dataCode;
                        }

                        index = (dataLength + keyIterator + dataIterator + 1) % dataLength;

                        dataCodes = utils.move(dataCodes, index, keyCode, false);

                        if ((dataLength ^ keyCode ^ charsetLength) % 2) {
                            dataCodes.reverse();
                        }

                        return decrypt(keyCodes, dataCodes, keyIterator - 1);
                    };
                };

                return function (keyCodes, dataCodes) {
                    return utils.trampoline(decrypt(keyCodes, dataCodes, keyCodes.length - 1));
                };
            }();

            return core;
        }();

        /**
         *  @property {Object} HEA
        **/
        global.HEA = {
            /**
             *  @method {Function} encrypt(request)
             *     @argument {Object} request
             *     @argument {String} request.data
             *     @argument {String} request.key
             *     @return {String}
             */
            encrypt: core.translate.bind(this, core.encrypt),
            /**
             *  @method {Function} decrypt(request)
             *     @argument {Object} request
             *     @argument {String} request.data
             *     @argument {String} request.key
             *     @return {String}
             */
            decrypt: core.translate.bind(this, core.decrypt)
        };

        global.onmessage = function (event) {
            var request,
                method,
                result;

            request = event.data;

            method = global.HEA[request.method];

            result = method(request);

            global.postMessage(result);
            
            return result;
        };
    };
    
    return 'data:application/javascript;base64,' + btoa('void ' + source + '(this);');
}(this);
