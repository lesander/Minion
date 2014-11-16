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


/***********!
 * Settings
 ***********/


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
		"debug": {
			"doInterval": true,
			"doConnectDump": false,
		},
		"zipExtractor": "http://178.62.212.184/zip.php"
	},
	"connected": false,
	"view": "",
	"tab": {
		"current": "",
		"old": ""
	},
	"langcodes": {},
	"debug": true,
	"playHere": true,
	"selectedSubtitles": "",
	"subtitles": {},
	"errorCount": 0,
	"exit": false,
	//"pagecount": 1, // 0 or 1?
	//"nextpage": "",
	"page": 1,
	"clientVersion": "",
	"supportedversions": {
		0: "0.3.5",
		1: "733.0.11.0.0",
		2: "0.3.5-2"
	}
};

/***************!
 * SHOW LOADING
 ***************/


/*! Show loading section. */
$("#default").removeClass("hidden");

/*! Load app version into loading screen. */
$(".version").text("Version " + App.version);


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
		"id": Math.floor(Math.random() * 100000),
		"jsonrpc": "2.0",
		"caller": "PTR-Minion-" + window.App.version,
		"callerLocation": window.location.href,
		"method": "ping",
		"params": []
	};
	console.debug("[DEBUG] Connecting to " + username + "@" + address + ":" + port + " with password: " + password + "");
	if (window.App.debug && window.App.settings.debug.doConnectDump) {
		console.debug('[EXTRA-DEBUG] Request ' + request.id + ' dump:');
		console.debug(request);
	}
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
				window.App.clientVersion = response.result.popcornVersion;
				console.info("[INFO] PT client has version '" + window.App.clientVersion + "'.");
				isClientSupported(window.App.clientVersion);
				window.App.connected = true;
			}
			else {
				console.error("[ERROR] Invalid login credentials.");
				alert("Invalid login credentials provided.");
				$(".btn-settings-close").addClass("hidden");
				//$(".settings-about").addClass("hidden");
				$(".settings-dev").addClass("hidden");
				showSection("settings");
				// show small header?
				window.App.connected = false;
			}
		},
		error: function(response, textStatus) {
			console.error("[ERROR] Couldn't connect to given address.");
			alert("Could not connect to " + address + ":" + port + ". Please check your settings and try again.");
			$(".btn-settings-close").addClass("hidden");
			//$(".settings-about").addClass("hidden");
			$(".settings-dev").addClass("hidden");
			// show small header?
			showSection("settings");
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
		"id": Math.floor(Math.random() * 100000),
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
			if (window.App.errorCount > 10 && window.App.exit !== true) {
				// We most likely lost connection.
				window.App.exit = true;
				showSection("lostconnection");
				throw new Error("Lost connection to Popcorn Time client.");
				return;
			}
			window.App.errorCount = window.App.errorCount + 1;
			console.log(textStatus);
			console.log(response);
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
	switch (request.method) {
		case 'getviewstack':
			$("#menu").removeClass("hidden");
			viewstackHandler(response);
			break;
		case 'getcurrenttab':
			//console.log(response.result.tab + ' vs ' + window.App.tab.current)
			//if (response.result.tab !== window.App.tab.current) {
			setTab(response.result.tab);
			window.App.tab.old = window.App.tab.current;
			window.App.tab.current = response.result.tab;
			//}
			break;
		case 'getplaying':

			break;
		case 'getselection':
			window.App.subtitles = {};
			if (window.App.view === "player") {

			}
			else if (window.App.view === "movie-detail") {
				$(".movie-detail-poster").attr("src", response.result.image);
				$(".movie-detail-container").attr("style", "background-image: url(" + response.result.backdrop + ");");
				$(".movie-detail-title").html("" + response.result.title + "");
				$(".movie-detail-year").html("" + response.result.year + "");
				$(".movie-detail-rating").html("" + response.result.rating + "/10");
				$(".movie-detail-synopsis").html("<p>" + response.result.synopsis + "</p>");
				$(".expand").removeClass("hidden");
				$(".movie-detail").addClass("minimised");
				$(".btn-movie-detail-favourite").removeClass("added");
				$(".btn-movie-detail-favourite").find("i").removeClass("red");
				$(".btn-movie-detail-favourite span").html('Bookmark');
				$(".btn-movie-detail-watched").removeClass("watched-icon");
				$(".btn-movie-detail-watched").find("i").removeClass("none watched-icon");
				$(".btn-movie-detail-watched span").html('Mark watched');
				$(".movie-detail-genre").html("" + response.result.genre + "");
				$(".movie-detail-runtime").html("" + response.result.runtime + " min");
				$(".movie-detail-imdb").html('<a href="http://imdb.com/title/' + response.result.imdb_id + '/" target="_blank"><img src="assets/img/imdb.png"></a>');

				if (response.result.bookmarked) {
					$(".btn-movie-detail-favourite").find("i").toggleClass("none red"); // !
					$(".btn-movie-detail-favourite").addClass("added");
					$(".btn-movie-detail-favourite span").html('Bookmarked');
				}
				if (response.result.watched) {
					// toggle as watched
					$(".btn-movie-detail-watched").find("i").toggleClass("none watched-icon");
					$(".btn-movie-detail-watched").addClass("watched-icon");
					$(".btn-movie-detail-watched span").html('Watched');
				}
				// check for state of subtitles. -> getselectedsubtitles?
				// store subtitle zips in array.
				window.App.subtitles = response.result.subtitle;
				// check for state of player. -> ?

				$(".btn-movie-detail-quality").text(response.result.quality);

			}
			else if (window.App.view === "shows-container-contain") {
				// ...
			}
			else {
				// Unknown
				console.warn("[WARNING] Unknown view '" + window.App.view + "' to set media info for.");
			}
			break;
		case 'getcurrentlist':
			if (typeof response.result === "undefined" || typeof response.result.page === "undefined") {
				console.error("[ERROR] Client gave us an empty list!");
				$(".loading-list").removeClass("hidden");
				break;
			}
			else {
				$(".loading-list").addClass("hidden");
			}
			if (response.result.page === window.App.currentpage) {
				$("#main-browser .list").children().remove();
			}
			if (response.result.type === "movie") {
				$.each(response.result.list, function(key, value) {
					if (response.result.list[key].watched) {
						$("#main-browser .list").append('<li class="item watched" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
					}
					else {
						$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
					}
				});
			}
			else if (response.result.type === "show") {
				$.each(response.result.list, function(key, value) {
					$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.images.poster + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><!--//<span class="item-rating pull-right">' + value.rating + '/10</span>//--></div></li>');
				});
			}
			else if (response.result.type === "anime") {
				// todo.
			}
			else if (response.result.type === "bookmarkedmovie") {
				// can be both movies, shows and anime.
				$.each(response.result.list, function(key, value) {
					$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
				});
			}
			else {
				// Unknown type.
			}
			$("#main-browser .list").append('<li class="item"><a class="btn-more btn btn-primary btn-minion">Load More..</a></li>');
			window.App.page = response.result.page;
			//$.each(response.result.list, function(key, value) {
			//response.result.list.image
			//response.result.list.title
			//response.result.list.rating
			//response.result.list.year
			//response.result.list.watched -> update on click of watch
			//response.result.list.bookmarked -> update on click of bookmark
			/*
			<li class="item>
				<div class="item-cover" style="background-image: url(' + value.image + ');">
					<div class="item-overlay"></div>
				</div>
				<div class="item-info">
					<div class="item-title">' + value.title + '</div>
					<span class="item-year pull-left">' + value.year + '</span>
					<span class="item-rating pull-right">' + value.rating + '/10</span>
				</div>
			</li>
			*/
			//});
			break;
		case 'getstreamurl':
			$("#streamer-video").attr("src", response.result.streamUrl);
			$("#streamer-source").attr("src", response.result.streamUrl);
			$("#streamer-video > a").attr("href", response.result.streamUrl);
			if (window.App.subtitles[window.App.selectedSubtitles] != "undefined") {
				console.debug("[DEBUG] Selected subtitles: " + window.App.subtitles[window.App.selectedSubtitles]);
				$("#streamer-track").attr("srclang", window.App.selectedSubtitles);
				$("#streamer-track").attr("src", App.settings.zipExtractor + "?key=574380257039257432968&url=" + window.App.subtitles[window.App.selectedSubtitles]);
			}
			break;
		case 'toggleplaying':

			break;
		case 'volume':

			break;
		case 'getsubtitles':
			if (window.App.view === "movie-detail") {
				$(".movie-detail-select-subtitles").children().remove();
				$(".movie-detail-select-subtitles").append('<option value="none">Select subtitles</option>');
				$.each(response.result.subtitles, function(index, value) {
					$(".movie-detail-select-subtitles").append('<option value="' + value + '">' + window.App.langcodes[value] + '</option>');
				});
			}
			else if (window.App.view === "player") {
				// ...
			}
			break;
		case 'getplayers':
			if (window.App.view === "movie-detail") {
				$(".select-players").children().remove();
				$(".select-players").append('<li role="presentation" class="dropdown-header">Select a device to stream to</li>');
				$(".select-players").append('<li role="presentation" data-player=""><a role="menuitem" tabindex="-1" class="change-player" href="#movdet-actions">This device <img class="player-icon" src="assets/img/player-external.png"></a></li>');
				$.each(response.result.players, function(index, value) {
					$(".select-players").append('<li role="presentation" data-player="' + value.id + '"><a role="menuitem" tabindex="-1" class="change-player" href="#movdet-actions">' + value.name + ' <img class="player-icon" src="assets/img/player-' + value.id + '.png"></a></li>');
				});
			}
			break;
		case 'getgenres':

			break;
		case 'getsorters':

			break;
		case 'clearsearch':

			break;
		case 'togglefavourite':
			if (window.App.view === "movie-detail") {
				var btn = $(".btn-movie-detail-favourite");
				$(btn).find("i").toggleClass("none red");
				if ($(btn).hasClass("added")) {
					$(btn).removeClass("added");
					$(".btn-movie-detail-favourite span").html('Bookmark');
				}
				else {
					$(btn).addClass("added");
					$(".btn-movie-detail-favourite span").html('Bookmarked');
				}
			}
			break;
		case 'togglewatched':
			if (window.App.view === "movie-detail") {
				var btn = $(".btn-movie-detail-watched");
				$(btn).find("i").toggleClass("none watched-icon");
				if ($(btn).hasClass("watched-icon")) {
					$(btn).removeClass("watched-icon");
					$(".btn-movie-detail-watched span").html('Mark watched');
				}
				else {
					$(btn).addClass("added");
					$(".btn-movie-detail-watched span").html('Watched');
				}
			}
			break;
		case 'setsubtitle':
			if (window.App.view === "movie-detail") {
				$(".movie-detail-select-subtitles").val(request.params);
			}
			break;
		case 'setplayer':
			if (window.App.view === "movie-detail") {
				$('[data-player]').removeClass("player-selected");
				$('[data-player="' + request.params + '"]').addClass("player-selected");
				var iconsrc = $('[data-player="' + request.params + '"] > a > img').attr("src");
				$(".btn-players-caret > .caret-icon").removeClass("caret");
				$(".btn-players-caret > .caret-icon").html('<img class="player-icon-main" src="' + iconsrc + '"> <i class="caret"></i>');
			}
			//window.App.player = request.params;
			break;
		case 'togglequality':
			if (window.App.view === "movie-detail") {
				var btn = $(".btn-movie-detail-quality");
				if (btn.text() === "1080p") {
					btn.text("720p");
				}
				else if (btn.text() === "720p") {
					btn.text("1080p");
				}
			}
			break;
		case 'up':
		case 'down':
		case 'left':
		case 'right':
		case 'enter':
		case 'movieslist':
		case 'showslist':
		case 'animelist':
		case 'showwatchlist':
		case 'showfavourites':
		case 'showabout':
		case 'showsettings':
		case 'previousseason':
		case 'nextseason':
		case 'back':
		case 'seek':
		case 'filtergenre':
		case 'filtersorter':
		case 'filtersearch':
		case 'ping':
		case 'watchtrailer':
			// Nothing to do with these requests (yet).
			console.info("[INFO] Method '" + request.method + "' has no handler.");
			break;
		default:
			// Unknown method.
			console.warn("[WARNING] Unknown method '" + request.method + "'.");
	}
}

/*!
 * Viewstack handler.
 *
 * @returns {void}
 */
function viewstackHandler(response) {
	currentview = response.result.viewstack[response.result.viewstack.length - 1];
	if (window.App.view !== currentview && $("#settings").is(":visible") === false) {
		console.debug("[DEBUG] View changed, new view: '" + currentview + "'.");
		// Remove backdrop background if view=movie-detail
		// Clear list
		$("#main-browser .list").children().remove();

		switch (currentview) {
			case 'main-browser':
				showSection("main-browser");
				popcorntimeAPI("getcurrentlist");
				// herp
				$(".list").on("click", ".btn-more", function() {
					$(this).hide();
					popcorntimeAPI("getcurrentlist", [window.App.page + 1]);
				});
				//popcorntimeAPI("getgenres");
				//popcorntimeAPI("getsorters");
				break;
			case 'shows-container-contain':
				showSection("shows-container");
				window.App.view = currentview;
				popcorntimeAPI("getselection");
				popcorntimeAPI("getplayers");
				break;
			case 'movie-detail':
				showSection("movie-detail");
				window.App.view = currentview;
				popcorntimeAPI("getplayers");
				popcorntimeAPI("getsubtitles");
				popcorntimeAPI("getselection");
				break;
			case 'player':
				popcorntimeAPI("getplaying");
				popcorntimeAPI("getsubtitles");
				console.debug("[DEBUG] App.playHere = " + window.App.playHere + ".");
				if (window.App.playHere) {
					popcorntimeAPI("getstreamurl");
					popcorntimeAPI("toggleplaying");
					showSection("streamer");
				}
				else {
					showSection("player");
				}
				break;
			case 'settings-container-contain':
				showSection("");
				break;
			case 'about':
				showSection("about");
				break;
			case 'init-container':
				showSection("loading");
				break;
			case 'app-overlay':
				showSection("downloading");
				break;
			case 'keyboard':
				showSection("");
				break;
			default:
				// View changed to unknown.
		}
		window.App.view = currentview;
	}
	else if (currentview === "main-browser") {
		// For the sake of the active tabs..
		if (window.App.tab.current === "movies" || window.App.tab.current === "shows" || window.App.tab.current === "anime") {
			$(".subsection-search-filter").removeClass("hidden");
		}
		else {
			$(".subsection-search-filter").addClass("hidden");
		}
		// For the sake of refeshing the list.
		if (window.App.tab.current === "movies" || window.App.tab.current === "shows" || window.App.tab.current === "anime" || window.App.tab.current === "Watchlist" || window.App.tab.current === "Favorites") {
			if (window.App.tab.current !== window.App.tab.old) {
				// Clear the list.
				$("#main-browser .list").children().remove();
				// Update the list.
				popcorntimeAPI("getcurrentlist");
				// herp
				// Filters can differ per section.
				popcorntimeAPI("getgenres");
				popcorntimeAPI("getsorters");
			}
		}
	}
	else if (currentview === "shows-container-contain") {
		// For the sake of getting episode information (?).
	}
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
	if (section === "") {
		console.warn("[WARNING] Empty argument given for showSection.");
		return false;
	}
	console.debug("[DEBUG] Switching to section '" + section + "'.");
	$(".section").addClass("hidden");
	$("#" + section).hide();
	$("#" + section).removeClass("hidden");
	$("#" + section).fadeIn("slow");
	return true;
}

/*!
 * Detect if all required localStorage is present.
 *
 * @returns {bool}
 */
function hasRequiredStorage() {
	if (localStorageExists("ip") && localStorageExists("port") && localStorageExists("username") && localStorageExists("password")) {
		return true;
	}
	else {
		return false;
	}
}

/*!
 * Register all required listeners.
 *
 * @returns {bool}
 */
function registerListeners() {
	// Menu click handlers.
	$(".btn-movies").on("click", function() {
		popcorntimeAPI("movieslist");
	});
	$(".btn-shows").on("click", function() {
		popcorntimeAPI("showslist");
	});
	$(".btn-anime").on("click", function() {
		popcorntimeAPI("animelist");
	});
	$(".btn-inbox").on("click", function() {
		popcorntimeAPI("showwatchlist");
	});
	$(".btn-favourites").on("click", function() {
		popcorntimeAPI("showfavourites");
	});
	// Local settings handlers.
	$(".btn-settings").on("click", function() {
		showSection("settings");
	});
	$(".btn-settings-close").on("click", function() {
		showSection(App.view);
	});
	// Item click handler.
	$(".list").on("click", ".item", function() {
		popcorntimeAPI("setselection", [parseInt($(this).attr("data-index"))]); // doesnt always seem to work with 733DEV
		popcorntimeAPI("enter");
	});
	// Movie detail handlers.
	$(".expand").on("click", function() {
		$(".movie-detail-synopsis").removeClass("minimised");
		$(this).addClass("hidden");
	})
	$(".btn-movie-detail-favourite").on("click", function() {
		popcorntimeAPI("togglefavourite");
	});
	$(".btn-movie-detail-watched").on("click", function() {
		popcorntimeAPI("togglewatched");
	});
	$(".movie-detail-select-subtitles").on("change", function() {
		popcorntimeAPI("setsubtitle", [this.value]);
		$(".movie-detail-select-subtitles > option > span").remove();
		$('option[value="' + this.value + '"]').prepend("<span>Selected: </span>");
		App.selectedSubtitles = this.value;
	});
	$(".select-players").on("click", ".change-player", function() {
		if ($(this).parent().attr("data-player") === "") {
			// This device is selected.
			window.App.playHere = true;
		}
		else {
			window.App.playHere = false;
		}
		popcorntimeAPI("setplayer", [$(this).parent().attr("data-player")]);
	});
	$(".btn-trailer").on("click", function() {
		popcorntimeAPI("watchtrailer");
	});
	$(".btn-movie-detail-quality").on("click", function() {
		popcorntimeAPI("togglequality");
	});
	$(".btn-watch").on("click", function() {
		popcorntimeAPI("enter");
	});
	// Back button.
	$(".btn-back").on("click", function() {
		popcorntimeAPI("back");
	});
	// Stop stream button.
	$(".btn-stop-stream").on("click", function() {
		$("#streamer-video").get(0).pause();
	});
	// Save settings handler.
	$(".btn-save").on("click", function() {
		setSettings($(".settings-address").val(), $(".settings-port").val(), $(".settings-username").val(), $(".settings-password").val());
		loadSettings();
		alert("Settings saved!");
		location.reload();
	});
	// Reset button handler.
	$(".btn-reset").on("click", function() {
		if (window.confirm("Are you sure you want to reset the App's settings?")) {
			console.info("[INFO] Resetting localStorage..");
			window.localStorage.clear();
			location.reload();
		}
	});
}

/*!
 * Set the current tab.
 *
 * @returns {void}
 */
function setTab(tab) {
	$(".btn-movies").removeClass("active");
	$(".btn-shows").removeClass("active");
	$(".btn-anime").removeClass("active");
	$(".btn-favourites-icon").removeClass("red");
	$(".btn-inbox-icon").removeClass("icon-active");
	if (tab === "movies" || tab === "shows" || tab === "anime" || tab === "Favorites" || tab === "Watchlist") {
		if (tab === "Favorites") {
			$(".btn-favourites-icon").addClass("red");
		}
		else if (tab === "Watchlist") {
			$(".btn-inbox-icon").addClass("icon-active");
		}
		else {
			$(".btn-" + tab).addClass("active");
		}
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

/*!
 * Check if the client version is supported by Minion.
 *
 * @param {str} version PT client version.
 * @returns {bool}
 * @private
 */
function isClientSupported(version) {
	found = null;
	$.each(App.supportedversions, function(key, value) {
		if (value === version) {
			found = true;
		}
	});
	if (found === true) {
		console.info("[INFO] Client version is supported.");
		return true;
	}
	else {
		console.warn("[WARNING] Client version is not supported.");
		alert("Your Popcorn Time client version '" + version + "' is not supported. Please update your client. Minion might not work correctly on outdated versions.");
		return false;
	}
}


/************!
 * BOOTSTRAP
 ************/


/*! Load language codes json file. */
$.getJSON("assets/js/langcodes.json", function(json) {
	window.App.langcodes = json;
});

/*! On document ready, get started. */
$(document).ready(function() {
	console.log('  __  __ _       _             \n |  \\/  (_)     (_)            \n | \\  / |_ _ __  _  ___  _ __  \n | |\\/| | | \'_ \\| |/ _ \\| \'_ \\ \n | |  | | | | | | | (_) | | | |\n |_|  |_|_|_| |_|_|\\___/|_| |_|\n                               ');
	console.log(" Minion version " + App.version + ".");
	console.log(" Developed by the PTR Team.");
	console.log(" Copyright (c) 2014, the PTR Team.");
	console.log(" Released under the GNU GPL V3 License.");
	console.log(" http://git.io/minion");
	console.log("");
	console.info("[INFO] Document is ready, starting Minion session.");
	console.info("[INFO] Minion version " + App.version + ".");
	$(".nav-title").html("Minion v" + App.version);
	if (App.debug) {
		console.info("[INFO] Extra debugging is enabled. Brace yourself for tons of debug messages!");
		console.log("[INFO] Debugging messages can be altered during the session by changing settings in the Objects 'App.debug' and 'App.settings.debug'.");
	}
	if (!hasRequiredStorage()) {
		console.info("[INFO] Could not find all required localStorage.");
		console.info("[INFO] Assuming that this is the first session, showing welcome section.");
		showSection("settings");
		$(".welcome").removeClass("hidden");
		//$(".settings-about").addClass("hidden");
		$(".settings-dev").addClass("hidden");
		$(".btn-settings-close").addClass("hidden");
		$(".btn-save").on("click", function() {
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
				if (App.settings.debug.doInterval) {
					popcorntimeAPI("getviewstack");
					popcorntimeAPI("getcurrenttab");
				}
			}, App.settings.interval);
		}
	}
});
