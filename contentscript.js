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
        case "getbalance":
            chrome.storage.local.get('address').then((result) => {
              var addr = result.address;
              if(addr == undefined || addr == null) {
                avianStream.write({result: "No address"});
                return;
              }
              addressBalance(addr).then(bal => {
                avianStream.write({result: bal});
              })
            });
            break;    
        default:
            avianStream.write({result: "N/A"})
            break;
    }
});

async function addressBalance(address) {
  const response = await fetch(`https://explorer-us.avn.network/ext/getbalance/${address}`);
  const bal = await response.text();
  return bal;
}
