var avian = {
  call: function(data) {
      notifyContent(data.method, data.args)
  },
  getBal: function() {
      notifyContent("avn_balance", {});
  }
}

function notifyContent(method, args) {
  var evt = new CustomEvent("sendAvianData", {detail: {method, args}});
  window.dispatchEvent(evt);        
}
