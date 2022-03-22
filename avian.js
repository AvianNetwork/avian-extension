var avian = {
  call: function(data) {
      return notifyContent(data.method, data.args)
  },
  getBal: function() {
      return notifyContent("avn_balance", {});
  }
}

var ChromeRequest = (function(){
  var requestId = 0;

  function getData(data) {
    var id = requestId++;

    return new Promise(function(resolve, reject) {
      var listener = function(evt) {
        console.log(evt);
        if(evt.detail.requestId == id) {
          // Deregister self
          window.removeEventListener("sendChromeData", listener);
          resolve(evt.detail.data);
        }
      }

      window.addEventListener("sendChromeData", listener);

      var payload = { data: data, id: id };

      window.dispatchEvent(new CustomEvent("getChromeData", {detail: payload}));
    });        
  }

  return { getData: getData };
})();

function notifyContent(method, args) {
  ChromeRequest.getData({method, args}).then(function(data){
    alert(data);
  });
}
