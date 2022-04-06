var backgroundStream;

window.addEventListener('load', function () {
  backgroundStream = new PostMessageStream.WindowPostMessageStream({
    name: 'avian',
    target: 'background',
  });      
});

var avian = {
  call: (data) => {
    return notifyContent(data.method, data.args)
  },
  getBalance: () => {
    return notifyContent("getbalance", {})
  },
  getAddress: () => {
    return notifyContent("getaddress", {})
  }
}

async function notifyContent(method, args) {
  backgroundStream.write({ method, args });
  const res = await parseStream(backgroundStream)
  return res.result;
}

// TODO: Fix Event leaking
function parseStream(stream) {
  return new Promise((resolve, reject) => {
    stream.on('data', (e) => { 
      if(e.error) reject(e.error);
      else resolve(e) 
    });
  });
}
