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
        var worker;

        worker = new global.Worker('js/HEA.js');

        if (keyInput.value !== '') {
            worker.postMessage({
                method: this.id,
                data: dataTextarea.value,
                key: keyInput.value
            });

            worker.onmessage = function onmessage(event) {
                worker.terminate();

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
