/*
    Copyright 2013 Lcf.vs
    Released under the MIT license
    https://github.com/Lcfvs/HEA.js
*/
'use strict';

var HEA;

HEA = function() {
    var
    source,
    url,
    createWorker,
    methods,
    onmessage;
    
    source = '"use strict";var HEA;HEA=function(n){var r,t,e,u,o,i,c,f,a,a,s,l,h,p,y,v;return r=function(n){return[].map.call(n.normalize("NFKC"),function(n){return n.codePointAt(0)})},t=function(n){return String.fromCodePoint.apply(null,n)},e=function(n){var r;return r=[],n.split("").forEach(function(t,e){1&e||r.push(256*n.charCodeAt(e)+n.charCodeAt(e+1))}),r},u=function(n){var r;return r=new Uint8Array(2*n.length),n.forEach(function(n,t){r[2*t]=n>>>8,r[2*t+1]=n}),String.fromCharCode.apply(null,r)},o=function(n,r,t,e){return r?r(n):new Buffer(n,t).toString(e)},c=function(n){return new Uint16Array(n)},i=function(n){return new Uint8Array(n)},f=function(n){return crypto.getRandomValues(c(n))},a=function(){var n,r,t;return n=function(){var r;return r=f(1)[0],r>=32?r:n},r=p(n),t=r>>>1,Array.from(f(t)).concat(Array.from(f(r-t)))},s=function(n){return n.reduce(function(n,r){return r>n?n:r},0)},l=function(n){return n.reduce(function(n,r){return n>r?n:r},0)},h=function(n,r){return 1&(s(n)^l(n)^r)&&n.reverse(),n},y=function(n,r){return n=n.slice(0),r=r.slice(0),r.forEach(function(r){var t;t=r,n=h(c(n).map(function(n){var e;return e=t+n^r,t=n,e}),r)}),Array.from(n)},v=function(n,r){return n=n.slice(0),r=r.slice(0),r.reverse(),r.forEach(function(r){var t;t=r,n=c(h(n,r)).map(function(n){return t=(n^r)-t+65536})}),Array.from(n)},p=function(n){for(;"function"==typeof n;)n=n();return n},{encrypt:function(t,e){var i,c,s,l,h;return i=r(e),c=r(t),s=a(),l=f(1)[0],c=y(c,s),s.forEach(function(n){var r;r=c.length,l=(l+n)%r,c.splice(l,0,n)}),c.unshift(l,s.length),c=y(c,i),h=u(c),o(h,n.btoa,"binary","base64")},decrypt:function(u,i){var c,f,a,s,l,h,p,y;for(c=o(u,n.atob,"base64","binary"),f=r(i),a=e(c),s=[],a=v(a,f),l=a.shift(),h=a.shift();h;h-=1)y=a.splice(l,1)[0],p=a.length,l=(l-y%p+p)%p,s.unshift(y);return a=v(a,s),t(a)}}}(self),self.addEventListener("message",function(n){var r;r=n.data,self.postMessage({type:"result",data:HEA[r.method](r.data,r.key)})},!1);';

    url = URL.createObjectURL(new Blob([source], {
        type:'application/javascript'
    }));
    
    createWorker = function(method, data, key, callback) {
        var
        worker;
        
        worker = new Worker(url);
        worker.callback = callback;
        worker.onmessage = onmessage;
        methods[method].call(worker, data, key, callback);
    };

    methods = {
        encrypt: function(data, key) {
            this.postMessage({
                method: 'encrypt',
                data: data,
                key: key
            });
        },
        decrypt: function(data, key) {
            this.postMessage({
                method: 'decrypt',
                data: data,
                key: key
            });
        }
    };

    onmessage = function(event) {
        this.terminate();
        this.callback(event.data.data);
    };

    return {
        encrypt: function(data, key, callback) {
            createWorker('encrypt', data, key, callback);
        },
        decrypt: function(data, key, callback) {
            createWorker('decrypt', data, key, callback);
        }
    };
}();