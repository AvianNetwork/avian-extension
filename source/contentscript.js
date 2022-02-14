// Inject Avian web3
var s = document.createElement('script');
s.src = chrome.runtime.getURL('avian-web3.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// Inject MetaMask Web3 Bridge (testing only)
var e = document.createElement('script');
e.src = chrome.runtime.getURL('metamask-bridge.js');
e.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(e);

// Custom event listeners
document.addEventListener('print', function (e) {
  var data = e.detail
  console.log('Received: ', data);
});
