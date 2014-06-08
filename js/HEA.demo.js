(function () {
    var gEBI, dataTextarea, keyInput, methodSelect, encryptButton, decryptButton;

    gEBI = function gEBI(id) {
        return document.getElementById(id);
    };

    dataTextarea = gEBI('dataTextarea');
    keyInput = gEBI('keyInput');
    methodSelect = gEBI('methodSelect');
    encryptButton = gEBI('encrypt');
    decryptButton = gEBI('decrypt');

    encryptButton.onclick = decryptButton.onclick = function (event) {
        var HEAWorker;

        HEAWorker = new Worker(HEASourceURL);

        if (keyInput.value !== '') {
            HEAWorker.postMessage({
                method: this.id,
                data: dataTextarea.value,
                key: keyInput.value
            });

            HEAWorker.onmessage = function onmessage(event) {
                this.terminate();

                dataTextarea.value = event.data;
            };
        } else {
            setTimeout(function () {
                alert('Invalid encryption key');
            });
        }

        event.preventDefault();
        event.returnValue = false;

        return false;
    };
}());
