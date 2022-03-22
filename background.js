function handleMessage(request, sender, sendResponse) {
    let method = request.method;
    let args = request.args;

    // switch (method) {
    //     case "avn_balance":
    //         sendResponse({ method: method, response: '200 AVN' });
    //         break;
    //     default:
    //         sendResponse({ method: method, response: 'N/A' });
    //         break;
    // }

    browser.windows.create({
        url: chrome.extension.getURL("wallet/index.html"),
        width: 600,
        height: 600,
        type: 'popup'
    });

}

chrome.runtime.onMessage.addListener(handleMessage);
