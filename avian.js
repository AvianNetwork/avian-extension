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

  if(res.error) {
    console.error(`[Avian] Request returned error: ${res.error}`);
    return
  }

  return res.result;
}

function parseStream(stream) {
  return new Promise(resolve => {
    stream.on('data', (e) => { resolve(e) });
  });
}
