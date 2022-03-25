// Config
var stream = undefined
var walletTimer = false
var walletVersion = '1.0.0'
var networkConfigs = {
	'AVN': {
		'uri': 'avian:',
		'title': 'AVN Wallet',
		'name': 'Main Network (Avian)',
		'api': 'https://api.avn.network',
		'ticker': 'AVN',
		'decimals': 8,
		'fee': 0.01,
		'network': {
			'messagePrefix': '\x19Raven Signed Message:\n',
			'bip32': {
				'public': 0x0488b21e,
				'private': 0x0488ade4
			},
			'bech32': 'raven',
			'pubKeyHash': 0x3C,
			'scriptHash': 0x7A,
			'wif': 0x80
		}
	}
}

// Explorer links
var blockExplorer = {
	'address': function (address) {
		return 'https://explorer-us.avn.network/address/' + address;
	},
	'tx': function (tx) {
		return 'https://explorer-us.avn.network/tx/' + tx;
	}
}

var globalData = {
	'balance': 0,
	'keys': undefined,
	'address': undefined,
	'rfee': getConfig()['fee'],
	'tx': {
		'amount': 0,
		'outputs': [],
		'fee': 0
	},
	'resetTx': function () {
		this.tx = {
			'amount': 0,
			'outputs': [],
			'fee': 0
		}
	},
	'clear': function () {
		this.keys = {}
		this.address = ''
		this.balance = 0
		this.resetTx()
	}
}

// Messages
var messages = initMessages()

function initMessages() {
	return {
		'settings': {
			'typeSwitched': function (type) {
				return getText('address-type-changed') + ' <b>' + type + '</b>'
			},
			'backendSwitched': function (url) {
				returngetText('backend-switched') + ' <b>' + url + '</b>'
			},
			'backendNotWorking': function (url) {
				return '<b>' + url + '</b> ' + getText('backend-down')
			}
		},
		'errors': {
			'bad-utxo': getText('bad-utxo'),
			'balance-load-failed': getText('balance-load-failed'),
			'not-enough-funds': getText('not-enough-funds'),
			'not-valid-address': getText('not-valid-address'),
			'not-valid-amount': getText('not-valid-amount'),
			'not-valid-fee': getText('not-valid-fee'),
			'bad-priv-key': getText('bad-priv-key'),
			'not-enough-utxo': getText('not-enough-utxo'),
			'broadcast-failed': getText('broadcast-failed'),
			'pass-not-match': getText('pass-not-match'),
			'pass-too-short': getText('pass-too-short'),
			'bad-email': getText('bad-email'),
			'small-fee': getText('small-fee') + ' ' + getConfig()['fee'] + ' ' + getConfig()['ticker'] + '!'
		},
		'tx': {
			'loading-utxo': getText('loading-utxo'),
			'generating': getText('transaction-creation'),
			'success': getText('transaction-broadcasted'),
		},
		'title': {
			'sure': getText('send-sure'),
			'processing': getText('send-processing'),
			'success': getText('success'),
			'failed': getText('failed')
		},
		'misc': {
			'outputAdded': function (address) {
				return getText('address') + ' ' + '<b class="break-word">' + address + '</b>' + ' ' + getText('outputs-added')
			}
		}
	}
}

function initLang() {
	var language = readData('language')
	var set_lang = 'en'

	if (language == null || walletLanguages[language] == undefined) {
		var user_lang = navigator.language.substr(0, 2)
		if (user_lang in walletLanguages) {
			set_lang = user_lang
		}

		setData('language', set_lang, 60)
		language = readData('language')
	}

	$('#wallet-language-select select').empty()
	for (key in walletLanguages) {
		$('#wallet-language-select select').append($('<option>', {
			'value': key,
			'text': walletLanguages[key]['lang-alias']
		}))
	}

	$('#wallet-language-select select').val(language)
	$("[tkey]").each(function () {
		if (['INPUT', 'TEXTAREA'].indexOf($(this).prop('tagName')) >= 0) {
			$(this).attr('placeholder', getText($(this).attr('tkey')))
		} else {
			$(this).html(getText($(this).attr('tkey')))
		}
	})

	messages = initMessages()
	setTitle(getText('wallet-settings'))
	return language
}

// Get current wallet language translation token
function getText(token) {
	var language = readData('language')
	if (language == undefined) {
		language = initLang()
	}

	if (token in walletLanguages[language]) {
		return walletLanguages[language][token]
	} else {
		return walletLanguages['en'][token]
	}
}

// Get current network config
function getConfig() {
	var network = readData('network')
	if (network == null || networkConfigs[network] == undefined) {
		setData('network', Object.keys(networkConfigs)[0], 60)
		network = readData('network')
	}

	return networkConfigs[network]
}

// Switch network
function switchConfig(network, page = '') {
	network = network.toUpperCase()
	if (networkConfigs[network] != undefined & networkConfigs[network] != getConfig()) {
		setData('network', network, 60)
		closeWallet()
		displayNetworks()
		switchBackend(networkConfigs[network]['api'])
	}

	switchPage(page)
}

// Display networks list
function displayNetworks() {
	network = getConfig()
	$('#network-versions').text(network['name'])
	$('#network-list .dropdown-menu').empty()

	for (var key in networkConfigs) {
		$('#network-list .dropdown-menu').append(`<a class="dropdown-item ${networkConfigs[key]['name'] == network['name'] ? 'active' : ''}" href="#/network/${key}">${networkConfigs[key]['name']}</a>`)
	}
}

// Get current address type
function getAddressType() {
	var type = readData('type')
	if (type == null || !['bech32', 'segwit', 'legacy'].includes(type)) {
		setData('type', 'legacy', 60)
		type = readData('type')
	}

	return type
}

// Switch address type
function switchAddressType(type) {
	if (['bech32', 'segwit', 'legacy'].includes(type)) {
		setData('type', 'legacy', 60)
	}
}

// Get current wallet backend
function getBackend() {
	var backend = readData('backend')
	backend = null
	if (backend == null) {
		setData('backend', getConfig()['api'], 60)
		backend = readData('backend')
	}

	return backend
}

// Switch wallet backend
function switchBackend(url) {
	Promise.resolve($.ajax({
		'url': url + '/info',
	})).then(function (data) {
		setData('backend', url, 60)
		showMessage(messages.settings.backendSwitched(url))
	}).catch(function () {
		showMessage(messages.settings.backendNotWorking(url))
		$('#wallet-backend input').val(getBackend())
	})
}

// Set item
function setData(name, value) {
	localStorage.setItem(name, value);
}

// Read item
function readData(name) {
	return localStorage.getItem(name);
}

// Delete item
function deleteData(name) {
	localStorage.removeItem(name);
}

// Check item
function checkData(name) {
	return localStorage.getItem(name) == null ? false : true;
}

// SPA router function
function routePage() {
	var urlParams = readParams()
	if (window.location.hash == '') {
		window.location.replace(window.location.href.split('#')[0] + '#/')
	}

	if (urlParams[0] == '#') {
		var pageName = urlParams[1] != '' ? urlParams[1] : 'homepage'
		var templateName = '#' + pageName

		$('.router-link').removeClass('active')
		$('.router-link[data-route=' + pageName + ']').addClass('active')
		if ($('.router-page:visible').attr('id') != urlParams[1]) {
			$('div.router-page').hide()
			if ($(templateName).length) {
				$(templateName).show()
			}
		}

		switch (pageName) {
			// Home page ¯\_(ツ)_/¯
			case 'homepage':
				setHomeTitle()
				break

			case 'create':
				setTitle(getText('create-wallet'))
				break

			case 'broadcast':
				setTitle(getText('broadcast-transaction'))
				break

			case 'settings':
				setTitle(getText('wallet-settings'))
				break

			// Swith network
			case 'network':
				network = urlParams[2]
				if (network != undefined) {
					switchConfig(network)
				}

				break

			default:
				switchPage()

				break
		}
	}
}

// Switch router page
function switchPage(url = '', params = []) {
	params = params.length > 0 ? '/' + params.join('/') : ''
	window.location.hash = '#' + '/' + url + params;
}

// Read URL params
function readParams() {
	return window.location.hash.split('/')
}

// Set window title
function setTitle(title) {
	document.title = title + ' | ' + getConfig()['title'];
}

// Broadcast tx
function transactionBroadcast(rawtx) {
	return Promise.resolve($.ajax({
		'method': 'POST',
		'url': getBackend() + '/broadcast',
		'data': {
			'raw': rawtx
		}
	}))
}

// Estimate fee
function estimateFee() {
	return Promise.resolve($.ajax({
		'url': getBackend() + '/fee',
	})).then(function (data) {
		return data
	})
}

// Get address balance
function addressBalance(address) {
	return Promise.resolve($.ajax({
		'url': 'https://explorer-us.avn.network/ext/getbalance/' + address,
	})).then(function (data) {
		return data
	})
}

// Get address history
function addressHistory(address) {
	return Promise.resolve($.ajax({
		'url': 'https://explorer-us.avn.network/ext/getaddress/' + address,
	})).then(function (data) {
		return data
	})
}

// Get TX info
function txInfo(hash) {
	return Promise.resolve($.ajax({
		'url': 'https://explorer-us.avn.network/ext/gettx/' + hash,
	})).then(function (data) {
		return data
	})
}


// Get address UTXO
function getUnspent(address, amount) {
	return Promise.resolve($.ajax({
		'url': getBackend() + '/unspent/' + address + '?amount=' + amount,
	})).then(function (data) {
		return data
	})
}

// Get transaction info
function transactionInfo(hash) {
	return Promise.resolve($.ajax({
		'url': getBackend() + '/transaction/' + hash,
	})).then(function (data) {
		return data
	})
}

// Convert satoshis to readable amount
function amountFormat(amount, invert = false) {
	var decimals = getConfig()['decimals']
	if (!invert) {
		return parseFloat((amount / Math.pow(10, decimals)).toFixed(decimals))
	} else {
		return parseInt(amount * Math.pow(10, decimals))
	}
}

// Show big error message at the top of the page :D
function showMessage(message) {
	$('#error-message').html(message)
	$('#error-message').removeClass('d-none')
	setTimeout(function () {
		$('#error-message').addClass('d-none')
	}, 3400);
}

function showQrAddress(text) {
	$('#qr-code-addres').empty()
	$('#qr-code-addres').qrcode(text)
}

/* Wallet functions */

// Check wallet balance
function walletBalance() {
	var balance = '0.00'
	$('.wallet-balance .amount').text('')
	$('.wallet-balance .ticker').text(getText('loading'))

	addressBalance(globalData.address).then(function (data) {
		if (data['error'] == "address not found.") {
			showMessage(messages.errors['balance-load-failed'])
		} else {
			globalData.balance = data;
			balance = globalData.balance;
		}

		$('.wallet-balance .amount').text(balance)
		$('.wallet-balance .ticker').text(getConfig()['ticker'])
	})
}

// Check wallet history
function walletHistory() {
	addressHistory(globalData.address).then(function (history) {
		history.last_txs.forEach(txs => {
			var type = (txs.type == 'vout') ? '<i class="fa-solid fa-arrow-right"></i> Received' : '<i class="fa-solid fa-arrow-left-long"></i> Sent'
			var info = txInfo(txs.addresses).then(function (tx) {
				var total = (tx.tx.total) * (1e-8);
				var time = tx.tx.timestamp;
				return {total, time}
			})
			info.then(e => {
				$('#wallet-history').append(
					`
					<div class="card border-light mb-3">
						<div class="card-body">
							<h5 class="card-title">${type}</h5>
							<p class="font-monospace card-text">Hash: ${txs.addresses}</p>
							<p class="card-text">Total: ${e.total} AVN</p>
							<p class="card-text">Date: ${new Date(e.time*1000).toDateString()}</p>
						</div>
					</div>
					`
				)
			});
		});
	});
}

// Avian Flight Plans
function afp() {
	const data = [
		{
			"name": "AFP #1",
			"hash": "Qmxxxxxxxxxxxxxxxxxxxxxxxxxxx"
		},
		{
			"name": "AFP #2",
			"hash": "Qmxxxxxxxxxxxxxxxxxxxxxxxxxxx"
		}
	]

	data.forEach(plan => {
		$('#wallet-afp').append(
			`
			<div class="card border-light mb-3">
				<div class="card-body">
					<h5 class="card-title">${plan.name}</h5>
					<p class="font-monospace card-text">Hash: ${plan.hash}</p>
				</div>
			</div>
			`
		)
	})
}

// Set title
function setHomeTitle() {
	if (globalData.keys != undefined) {
		setTitle(getText('address') + ' ' + globalData.address)
	} else {
		setTitle(getText('open-wallet'))
	}
}

// Check balance
function checkBalanceLoop() {
	clearTimeout(walletTimer);
	walletTimer = setTimeout(function () {
		if ($('.wallet-balance .ticker').text() != getText('loading')) {
			walletBalance()
		}
		checkBalanceLoop()
	}, 60000)
}

// Open wallet by key
function openWallet(keys) {
	globalData.address = getAddress(keys)
	var pubkey = keys.publicKey.toString('hex')
	var wif = keys.toWIF()
	var redeem = '0014' + getP2WPKHScript(keys.publicKey).hash.toString('hex')

	$('#wallet-keys-pubkey input').val(pubkey)
	$('#wallet-keys-privkey input').val(wif)
	$('#wallet-keys-script input').val(redeem)

	$('#wallet-address').html(globalData.address)
	$('#open-block').addClass('d-none')
	$('#wallet-block').removeClass('d-none')
	$('#send-fee').attr('placeholder', getText('fee') + ' (' + getText('recommended') + ' ' + globalData.rfee + ' ' + getConfig()['ticker'] + ')')
	showQrAddress(getConfig()['uri'] + globalData.address)

	// Init wallet stuffs
	walletBalance()
	walletHistory()
	afp()
	checkBalanceLoop()
	setHomeTitle()
}

function showConfirmation(amount) {
	$('#confirm-amount').text(amount + ' ' + getConfig()['ticker'])
	$('#send-modal').modal('toggle')
	$('#send-title').text(messages.title['sure'])
	$('#send-cancel').removeClass('disabled')
	$('#send-confirm').removeClass('disabled')
	$('#send-cancel').removeClass('d-none')
	$('#send-confirm').removeClass('d-none')
	$('#send-close-footer').addClass('d-none')
	$('#send-close-footer').addClass('disabled')
	$('#confirm-screen').removeClass('d-none')
	$('#status-screen').addClass('d-none')
	$('#status-screen span').html('')

	$.each($('#send-outputs .send-outputs-item'), function (key, item) {
		var address = $('[name="send-address"]', item).val().trim()
		var value = $('[name="send-ammount"]', item).val() * 1
		globalData.tx.outputs.push({
			'address': address,
			'amount': amountFormat(value, true)
		})
	})

	globalData.tx.amount = amountFormat(amount, true)
	globalData.tx.fee = amountFormat(($('#send-fee').val() != '') ? $('#send-fee').val() : globalData.rfee, true)
}

function stopStream() {
	if (stream != undefined) {
		stream.getTracks().forEach(function (track) {
			track.stop()
		})
	}
}

function startStream() {
	var canvasElement = document.getElementById('scan-canvas')
	var canvas = canvasElement.getContext('2d')
	var video = document.createElement('video')
	canvasElement.hidden = true

	$('#loading-message').text(getText('webcam-message'))
	$('#loading-message').removeClass('d-none')

	// Use facingMode: environment to attemt to get the front camera on phones
	navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (gstream) {
		stream = gstream
		video.srcObject = stream
		video.setAttribute("playsinline", true)
		video.play()
		requestAnimationFrame(tick)
	})

	function tick() {
		$('#loading-message').text(getText('webcam-loading'))
		var stop = false
		if (video.readyState === video.HAVE_ENOUGH_DATA) {
			$('#loading-message').addClass('d-none')
			canvasElement.hidden = false

			canvasElement.height = video.videoHeight
			canvasElement.width = video.videoWidth
			canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height)
			var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height)
			var code = jsQR(imageData.data, imageData.width, imageData.height, {
				inversionAttempts: "dontInvert",
			})

			if (code) {
				var address = code.data
				if (address.startsWith(getConfig()['uri'])) {
					address = address.replace(getConfig()['uri'], '')
				}

				if (validateAddress(address)) {
					if ($('#send-outputs input[name="send-address"]').last().val() != '') {
						$('#add-output').click()
					}

					$('#send-outputs input[name="send-address"]').last().val(address)
					showMessage(messages.misc.outputAdded(address))
					stop = true
				}
			}
		}

		if (!stop) {
			requestAnimationFrame(tick)
		} else {
			$('#scan-modal').modal('toggle')
			stopStream()
		}
	}
}

function showScanModal() {
	// $('#scan-canvas').addClass('d-none')
	$('#scan-modal').modal('toggle')
	startStream()
}

function sendTransaction(getSize) {
	var network = getConfig()['network']
	var keys = globalData.keys

	var decimals = getConfig()['decimals']
	var outputs = globalData.tx.outputs
	var amount = globalData.tx.amount
	var fee = globalData.tx.fee
	var address = globalData.address

	var scripts = []

	var txb = new bitcoinjs.TransactionBuilder(network)
	txb.enableRavencoinLite(true)
	txb.setVersion(2)

	var pk = keys.publicKey
	var spk = bitcoinjs.payments.p2pk({ pubkey: pk }).output

	var hashType = bitcoinjs.Transaction.SIGHASH_ALL | bitcoinjs.Transaction.SIGHASH_RAVENCOINLITE

	$('#send-cancel').addClass('disabled')
	$('#send-confirm').addClass('disabled')
	$('#confirm-screen').addClass('d-none')
	$('#status-screen').removeClass('d-none')
	$('#send-title').text(messages.title['processing'])
	$('#status-screen .extra-info').empty()
	$('#status-screen span').html(messages.tx['generating'])


	for (var i = 0, size = outputs.length; i < size; i++) {
		txb.addOutput(outputs[i].address, outputs[i].amount)
	}

	$('#status-screen span').html(messages.tx['loading-utxo'])
	getUnspent(address, amount).then(function (data) {
		var value = 0
		for (var i = 0, size = data.result.length; i < size; i++) {
			var txid = data.result[i].txid
			var index = data.result[i].index
			value += data.result[i].value

			var script = bitcoinjs.Buffer(data.result[i].script, 'hex')
			var type = getScriptType(script)

			txb.addInput(txid, index)

			scripts.push({
				'script': script,
				'type': type,
				'value': data.result[i].value
			})
			if (value >= amount + fee) {
				break;
			}
		}
		if (value >= amount) {
			try {
				var change = value - amount
				// If the change is greater than 0, send the change back to the sender
				if (change > 0) {
					txb.addOutput(address, change)
				}
				for (var i = 0, size = scripts.length; i < size; i++) {
					switch (scripts[i].type) {
						case 'legacy':
							txb.sign(i, keys, null, hashType, amount)
							break
						default:
							showMessage(messages.errors['bad-utxo'])
							break
					}
				}
			} catch (e) {
				showMessage(e.message)
			}

			var tx = txb.build()
			transactionBroadcast(tx.toHex()).then(function (data) {
				if (data.error == undefined) {
					$('#status-screen span').html(`
									<a href="${blockExplorer.tx(data.result)}" target="_blank">
										${data.result}
									</a>
								`)
					$('#send-title').text(messages.title['success'])
				} else {
					$('#status-screen span').html(messages.errors['broadcast-failed'])
					$('#send-title').text(messages.title['failed'])
					$('#status-screen .extra-info').html(`
									<div class="mt-3">
										<textarea class="form-control" readonly cols="30" rows="10">${data.error.message}</textarea>
									</div>
								`)
				}
				resetTxForm()
			})

			$('#send-cancel').addClass('d-none')
			$('#send-confirm').addClass('d-none')
			$('#send-close-footer').removeClass('d-none')
			$('#send-close-footer').removeClass('disabled')

		} else {
			showMessage(messages.errors['not-enough-funds'])
		}
	})
}

// Close wallet
function closeWallet() {
	$('#open-block').removeClass('d-none')
	$('#wallet-block').addClass('d-none')
	globalData.clear()
	logout()
	setHomeTitle()
}

function getScriptType(script) {
	var type = undefined

	if (script[0] == bitcoinjs.opcodes.OP_0 &&
		script[1] == 20) {
		type = 'bech32'
	}

	if (script[0] == bitcoinjs.opcodes.OP_HASH160 &&
		script[1] == 20) {
		type = 'segwit'
	}

	if (script[0] == bitcoinjs.opcodes.OP_DUP &&
		script[1] == bitcoinjs.opcodes.OP_HASH160 &&
		script[2] == 20) {
		type = 'legacy'
	}

	return type
}

function getP2SHScript(redeem) {
	return bitcoinjs.payments.p2sh({
		'redeem': redeem,
		'network': getConfig()['network']
	})
}

function getP2WPKHScript(pubkey) {
	return bitcoinjs.payments.p2wpkh({
		'pubkey': pubkey,
		'network': getConfig()['network']
	})
}

function getAddress(keys) {
	var network = getConfig()['network']
	var address = undefined

	if (getAddressType() == 'legacy') {
		address = bitcoinjs.payments.p2pkh({
			'pubkey': keys.publicKey,
			'network': getConfig()['network']
		}).address
	}

	return address
}

function validateAddress(address) {
	var network = getConfig()['network']

	try {
		bitcoinjs.address.fromBase58Check(address, network)
		return true
	} catch (e) {
		try {
			bitcoinjs.address.fromBech32(address, network)
			return true
		} catch (e) {
			return false
		}
	}
}

// Create new wallet
$('#footer-create').click(function () {
	var keys = bitcoinjs.ECPair.makeRandom({ 'network': getConfig()['network'] })
	var address = getAddress(keys)

	if (address != undefined) {
		$('#create-keys-address input').val(address)
		$('#create-keys-pubkey input').val(keys.publicKey.toString('hex'))
		$('#create-keys-privkey input').val(keys.toWIF())
	}
})

// Broadcast raw transaction
$('#footer-broadcast').click(function () {
	var rawtx = $('#transaction-broadcast-raw')
	transactionBroadcast(rawtx.val()).then(function (data) {
		if (data.error == undefined) {
			showMessage(`
							${messages.tx['success']}<a href="` + blockExplorer.tx(data.result) + `" target="_blank">` + data.result + `</a>
						`)
		} else {
			showMessage(messages.errors['broadcast-failed'])
		}
	})
	rawtx.val('')
})

// Reset sending form
function resetTxForm() {
	$('.send-additional-output').remove()
	$('#wallet-send input').val('')
	globalData.resetTx()
}

function initWallet() {
	// Open only if key is valid
	if (globalData.keys != undefined) {
		openWallet(globalData.keys)
	}
}

// Check if the user is logged in
function checkLogin() {
	if(checkData("privkey")) {
		globalData.keys = bitcoinjs.ECPair.fromPrivateKey(
			bitcoinjs.Buffer.from(readData("privkey"), 'hex'),
			{ 'network': getConfig()['network'] }
		)
		initWallet();
	} else if(checkData("wifkey")) {
		globalData.keys = bitcoinjs.ECPair.fromWIF(readData("wifkey"), getConfig()['network'])
		initWallet();
	}
}

// Logout and remove keys
function logout() {
	deleteData("privkey");
	deleteData("wifkey");
}

// All starts here
$(document).ready(function () {
	initLang()
	checkLogin();

	$('#wallet-version').text(walletVersion)
	$('#wallet-backend input').val(getBackend())
	$('#address-type-select select').val(getAddressType());

	displayNetworks()
	routePage()

	$('.tab-link').click(function (e) {
		var tabFamily = $(this).data('tab-family')
		var tabName = $(this).data('tab-name')

		$('#' + tabFamily + ' .tab-item').addClass('d-none')
		$('#' + tabFamily + ' .card-header .card-header-tabs .nav-link').removeClass('active')

		$('#' + tabFamily + ' [data-tab=' + tabName + ']').removeClass('d-none')
		$(this).addClass('active')

		e.preventDefault()
	})

	$(window).on('hashchange', routePage)
	if (window.location.hash) {
		$(window).trigger('hashchange')
	}

	$('#send-tx').click(function () {
		var error = false
		var txFee = ($('#send-fee').val() != '') ? $('#send-fee').val() : globalData.rfee
		var total = 0

		if ((isNaN(txFee)) || txFee <= 0) {
			showMessage(messages.errors['not-valid-fee'])
			error = true
		} else {
			if (txFee < getConfig()['fee']) {
				showMessage(messages.errors['small-fee'])
				error = true
			}
		}

		$.each($('#send-outputs .send-outputs-item'), function (key, item) {
			var address = $('[name="send-address"]', item).val().trim()
			var amount = $('[name="send-ammount"]', item).val()

			if ((isNaN(amount)) || amount <= 0) {
				showMessage(messages.errors['not-valid-amount'])
				error = true
			}

			if (validateAddress(address) == false) {
				showMessage(messages.errors['not-valid-address'])
				error = true
			}

			total += amount * 1
		})

		total += txFee * 1
		total = parseFloat(total.toFixed(getConfig()['decimals']))

		if (!error) {
			if (total <= globalData.balance) {
				showConfirmation(total)
			} else {
				//showMessage(messages.errors['not-enough-funds'])
				showMessage(total + " : " + globalData.balance)
			}
		}
	})

	// Open wallet by WIF key
	$('#open-key-form').submit(function (e) {
		var wif = $('#passphrase').val().trim()
		var wifLength = wif.length
		if ([51, 52].includes(wifLength)) {
			try {
				globalData.keys = bitcoinjs.ECPair.fromWIF(wif, getConfig()['network'])
				deleteData("privkey");
				setData("wifkey", wif);
			} catch (e) {
				showMessage(messages.errors['bad-priv-key'])
				showMessage(e.message)
			}

			$('#passphrase').val('')
			initWallet()
		} else {
			showMessage(messages.errors['bad-priv-key'])
		}

		e.preventDefault()
	})

	// Open wallet using email and password
	$("#open-regular-form").submit(function (e) {
		var email = $("#open-email").val().toLowerCase()
		var pass = $("#open-password").val()
		var passConfirm = $("#open-password-confirm").val()
		if (email.match(/[\s\w\d]+@[\s\w\d]+/g)) {
			if (pass.length >= 10) {
				if (pass == passConfirm) {
					var pass = pass
					var s = email
					s += '|' + pass + '|'
					s += s.length + '|!@' + ((pass.length * 7) + email.length) * 7
					var regchars = (pass.match(/[a-z]+/g)) ? pass.match(/[a-z]+/g).length : 1
					var regupchars = (pass.match(/[A-Z]+/g)) ? pass.match(/[A-Z]+/g).length : 1
					var regnums = (pass.match(/[0-9]+/g)) ? pass.match(/[0-9]+/g).length : 1
					s += ((regnums + regchars) + regupchars) * pass.length + '3571'
					s += (s + '' + s)

					for (i = 0; i <= 51; i++) {
						s = sha256.update(s).hex()
					}

					$('#open-email').val('')
					$('#open-password').val('')
					$('#open-password-confirm').val('')

					deleteData("wifkey");
					setData("privkey", s);

					globalData.keys = bitcoinjs.ECPair.fromPrivateKey(
						bitcoinjs.Buffer.from(s, 'hex'),
						{ 'network': getConfig()['network'] }
					)
					openWallet(globalData.keys)
				} else {
					showMessage(messages.errors['pass-not-match'])
				}
			} else {
				showMessage(messages.errors['pass-too-short'])
			}
		} else {
			showMessage(messages.errors['bad-email'])
		}

		e.preventDefault()
	})

	// Check wallet balance on balance label click
	$('.wallet-balance').click(function (e) {
		walletBalance()
		e.preventDefault()
	})

	// Confirm transaction sendign (are you sure?)
	$('#send-confirm').click(function (e) {
		sendTransaction()
		e.preventDefault()
	})

	// Toggle private key visibility
	$('.toggle-priv-key').click(function () {
		if ($(this).text() == getText('show')) {
			$(this).parent().parent().find('.keys-privkey').attr('type', 'text')
			$(this).text(getText('hide'))
		} else {
			$(this).parent().parent().find('.keys-privkey').attr('type', 'password')
			$(this).text(getText('show'))
		}
	})

	// Add transaction output
	$('#add-output').click(function (e) {
		$('#send-outputs').append(`
						<div class="send-additional-output send-outputs-item input-group mb-2">
							<input name="send-address" class="form-control" placeholder="${getText('enter-address')}" type="text">
							<input name="send-ammount" class="form-control" placeholder="${getText('amount')}" type="text">
							<div class="input-group-append">
								<button class="btn btn-outline-danger remove-additional-output" type="submit">
									<span class="entypo minus"></span>
								</button>
							</div>
						</div>
					`)
		$('.remove-additional-output').click(function (e) {
			$(this).closest('.send-additional-output').remove()
			e.preventDefault()
		})
		e.preventDefault()
	})

	// Reset send form
	$('#send-reset').click(function (e) {
		resetTxForm()
		e.preventDefault()
	})

	// Reset send form
	$('#send-qr').click(function (e) {
		showScanModal()
		e.preventDefault()
	})

	// Footer button which close wallet
	$('#footer-close').click(function (e) {
		closeWallet()
		e.preventDefault()
	})

	// Change address type
	$('#address-type-select select').on('change', function () {
		switchAddressType($(this).val())
		showMessage(messages.settings.typeSwitched($(this).val()))
		initWallet()
	})

	// Change wallet backend
	$('#wallet-backend button').click(function (e) {
		switchBackend($('#wallet-backend input').val())
	})

	// Change wallet language
	$('#wallet-language-select select').on('change', function () {
		setData('language', $('#wallet-language-select select').val(), 60)
		initLang()
		initWallet()
	})

	// Set wallet recomended fee
	estimateFee().then(function (data) {
		globalData.rfee = getConfig()['fee']
	})

	$('#scan-modal').on('hide.bs.modal', function (e) {
		stopStream()
	})
})
