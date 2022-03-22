// Inject Avian
var s = document.createElement('script');
s.src = chrome.runtime.getURL('avian.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener("getChromeData", function(evt) {
  var request = evt.detail.data;
  var send = notifyBackground(request.method, request.args);
  send.then(
      message => {
        alert("Content Script: " + message.response) 
        var response = {requestId: request.id, data: message};
        window.dispatchEvent(new CustomEvent("sendChromeData", {detail: response}));
      },
      error => console.log(`Error: ${error}`)
  );
}, false);

function notifyBackground(method, args) {
    var send = chrome.runtime.sendMessage({
        method: method,
        args: args
    });
    return send;
}
