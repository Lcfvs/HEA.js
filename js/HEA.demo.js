void function (global) {
    var document,
        gEBI,
        dataTextarea,
        keyInput,
        methodSelect,
        encryptButton,
        decryptButton;

    document = global.document;

    gEBI = function gEBI(id) {
        return document.getElementById(id);
    };

    dataTextarea = gEBI('dataTextarea');
    keyInput = gEBI('keyInput');
    methodSelect = gEBI('methodSelect');
    encryptButton = gEBI('encrypt');
    decryptButton = gEBI('decrypt');

    encryptButton.onclick = decryptButton.onclick = function (event) {
        var method,
            data,
            HEAWorker;

        method = this.id;

        data = method === 'decrypt'
            ? global.decodeURIComponent(global.escape(global.atob(dataTextarea.value)))
            : dataTextarea.value;

        HEAWorker = new global.Worker('HEA.js');

        if (keyInput.value !== '') {
            HEAWorker.postMessage({
                method: method,
                data: data,
                key: keyInput.value
            });

            HEAWorker.onmessage = function onmessage(event) {
                var data;

                data = method === 'encrypt'
                    ? global.btoa(global.unescape(global.encodeURIComponent(event.data)))
                    : event.data;

                this.terminate();

                dataTextarea.value = data;
            };
        } else {
            global.setTimeout(function () {
                global.alert('Invalid encryption key');
            });
        }

        event.preventDefault();
        event.returnValue = false;

        return false;
    };
}(this);
