// Inject JS
var s = document.createElement('script');
s.src = chrome.runtime.getURL('stream.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

var s = document.createElement('script');
s.src = chrome.runtime.getURL('avian.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

const avianStream = new PostMessageStream.WindowPostMessageStream({
  name: 'background',
  target: 'avian',
});
    
avianStream.on('data', (data) => {
    let method = data.method;
    let args = data.args;

    switch (method) {
        case "avn_balance":
            avianStream.write({result: "200"})
            break;    
        default:
            avianStream.write({result: "N/A"})
            break;
    }
});
