// Avian Web3 implementation
var Avian = {
    print: function(data){
      var e = `Avian Web3: ${data}`
      // Show popup
      callFunc(e, "test args")
    }
}

// Internal functions
function callFunc(func, args){
	var data = { "func": func, "args": args };
	document.dispatchEvent(new CustomEvent('print', { "detail": data }));
}
