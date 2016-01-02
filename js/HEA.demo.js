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
        if (keyInput.value !== '') {
            HEA[this.id](dataTextarea.value, keyInput.value, function (data) {
                dataTextarea.value = data;
            });
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