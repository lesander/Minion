/*!
 * Minion v0.1.0.pre
 * Developed by the PTR Team
 * Copyright 2014, the PTR Team
 * Released under the GNU GPL V3 License
 * http://git.io/minion
 */

/*! Make sure that we've got jQuery included. */
if (typeof jQuery === "undefined") {
	throw new Error("Popcorn Time Remote requires jQuery.");
}

/*! Show loading section. */
$("#default").removeClass("hidden");


/************!
 * FUNCTIONS
 ************/

/*!
 * Connect to PT client.
 *
 * @returns {bool}
 */
function popcorntimeConnect(address, port, username, password) {
  var request = {
		"id": Math.floor( Math.random() * 100000 ),
		"jsonrpc": "2.0",
		"caller": "PTR-Minion-" + window.App.version,
		"callerLocation": window.location.href,
		"method": "ping",
		"params": []
	};
	console.debug("[DEBUG] Connecting to " + username + "@" + address + ":" + port + " with password: " + password + "");
	$.ajax({
		type: "POST",
		url: 'http://' + address + ':' + port + '',
		data: JSON.stringify(request),
		async: false,
		beforeSend: function(xhr) {
			xhr.setRequestHeader("Authorization", window.btoa(username + ":" + password));
		},
		success: function(response, textStatus) {
			if (typeof response.error === "undefined") {
				console.info("[INFO] Connection established.");
				console.info("[INFO] PT client has version '" + response.result.popcornVersion + "'.");
				window.App.clientVersion = response.result.popcornVersion;
				window.App.connected = true;
			}
			else {
				console.error("[ERROR] Invalid login credentials.");
				alert("Invalid login credentials provided.");
				// First time stuff?
				window.App.connected = false;
			}
		},
		error: function(response, textStatus) {
			console.error("[ERROR] Couldn't connect to given address.");
			alert("Could not connect to " + address + ":" + port + ". Please check your settings and try again.");
			// First time stuff?
			window.App.connected = false;
		}
	});
	if (window.App.connected) {
		return true;
	}
	else {
		return false;
	}
}

/*!
 * Send a request to the PT API with given arguments.
 *
 * @returns {false/null}
 */
function popcorntimeAPI(method, parameters) {
  if (!window.App.connected) {
		console.warn("[WARNING] Can't call popcorntime API: not connected.");
		return false;
	}
	if (typeof parameters === "undefined") {
		parameters = [];
	}
	var request = {
		"id": Math.floor( Math.random() * 100000 ),
		"jsonrpc": "2.0",
		"caller": "PTR-Minion-" + window.App.version,
		"callerLocation": window.location.href,
		"method": method,
		"params": parameters
	};
	$.ajax({
		type: "POST",
		url: 'http://' + window.App.settings.connection.ip + ':' + window.App.settings.connection.port,
		data: JSON.stringify(request),
		async: false,
		beforeSend: function(xhr) {
			xhr.setRequestHeader("Authorization", window.btoa(window.App.settings.connection.username + ":" + window.App.settings.connection.password));
		},
		success: function(response, textStatus) {
			responseHandler(request, response);
		},
		error: function(response, textStatus) {
			console.error("[ERROR] Request id " + request.id + " was not successful.");
		}
	});
	return null;
}

/*!
 * Determine what to do with given PT API response.
 *
 * @returns {bool}
 */
function responseHandler(request, response) {
	console.debug("[DEBUG] ResponseHandler ..");
	console.debug(request);
  console.debug(response);
	console.debug("[DEBUG] ..");
}

/*!
 * Set settings from given arguments.
 *
 * @returns {void}
 */
function setSettings(address, port, username, password) {
	window.localStorage.setItem("ip", address);
	window.localStorage.setItem("port", port);
	window.localStorage.setItem("username", username);
	window.localStorage.setItem("password", password);
	console.debug("[DEBUG] Settings were set.");
	return true;
}

/*!
 * Load Minion's settings into global variables and the settings form.
 *
 * @returns {void}
 */
function loadSettings() {
  window.App.settings.connection.ip = window.localStorage.getItem("ip");
	window.App.settings.connection.port = window.localStorage.getItem("port");
	window.App.settings.connection.username = window.localStorage.getItem("username");
	window.App.settings.connection.password = window.localStorage.getItem("password");
	$(".settings-address").val(window.App.settings.connection.ip);
	$(".settings-port").val(window.App.settings.connection.port);
	$(".settings-username").val(window.App.settings.connection.username);
	$(".settings-password").val(window.App.settings.connection.password);
	console.debug("[DEBUG] Settings were reloaded.");
}

/*!
 * Show given section and hide all other sections.
 *
 * @returns {bool}
 */
function showSection(section) {
  
}

/*!
 * Detect if all required localStorage is present.
 *
 * @returns {bool}
 */
function hasRequiredStorage() {
  if ( localStorageExists("ip") && localStorageExists("port") && localStorageExists("username") && localStorageExists("password") ) {
    return true;
  }
  else {
    return false;
  }
}


/************!
 * PRIVATE FUNCTIONS
 ************/


/*!
 * Check if given localStorage item is set.
 *
 * @returns {bool}
 * @private
 */
function localStorageExists(key) {
  if (key === null) {
    console.warn("[WARNING] localStorageExists got empty 'key' parameter.");
    return false;
  }
  else if (window.localStorage.getItem(key) !== null) {
		return true;
	}
	else {
		return false;
	}
}


/************!
 * BOOTSTRAP
 ************/


/*! Set App variables. */
var App = {
  "version": "0.1.0.pre",
  "settings": {
    "connection": {
      "ip": "",
      "port": "",
      "username": "",
      "password": ""
    },
    "interval": 1000,
  },
  "connected": false,
  "view": "",
  "currenttab": "",
  "clientVersion": "",
  "supportedversions": {
    0: "0.3.5",
    1: "733.0.11.0.0"
  }
};

/*! On document ready, get started. */
$(document).ready(function() {
  console.info("[INFO] Document is ready, starting Minion session.");
  console.info("[INFO] Minion version " + App.version + ".");
  if (!hasRequiredStorage()) {
    console.info("[INFO] Could not find all required localStorage.");
    console.info("[INFO] Assuming that this is the first session, showing welcome section.");
		showSection("settings");
		$("#welcome").removeClass("hidden");
		$(".btn-save").on("click", function(){
			var tryAddress = $(".settings-address").val();
			var tryPort = $(".settings-port").val();
			var tryUsername = $(".settings-username").val();
			var tryPassword = $(".settings-password").val();
			popcorntimeConnect(tryAddress, tryPort, tryUsername, tryPassword);
			if (App.connected) {
				alert("Connected to Popcorn Time client!");
				setSettings(tryAddress, tryPort, tryUsername, tryPassword);
				loadSettings();
				location.reload();
			}
		});
  }
  else {
    loadSettings();
    registerListeners();
		popcorntimeConnect(App.settings.connection.ip, App.settings.connection.port, App.settings.connection.username, App.settings.connection.password);
		if (App.connected) {
			setInterval(function() {
				popcorntimeAPI("listennotifications");
			}, App.settings.interval);
		}
  }
});
