// Inject Avian
var s = document.createElement('script');
s.src = browser.runtime.getURL('avian.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener("sendAvianData", function (e) {
    var data = e.detail;
    var send = notifyBackground(data.method, data.args);
    send.then(
        message => alert(message.response),
        error => console.log(`Error: ${error}`)
    );
}, false);

function notifyBackground(method, args) {
    var send = browser.runtime.sendMessage({
        method: method,
        args: args
    });
    return send;
}
console.log(message.response);
