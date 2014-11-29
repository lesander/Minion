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
		"ui": {
			"language": "",
			"startscreen": "",
			"watcheditems": ""
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
	"currentVolume": 0,
	"page": 1,
	"forceView": false,
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
				throw new Error("Lost connection to Popcorn Time client. Stopping interval.");
				window.App.settings.debug.doInterval = false;
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
			if (response.result.tab != window.App.tab.current) {
				setTab(response.result.tab);
				window.App.tab.old = window.App.tab.current;
				window.App.tab.current = response.result.tab;
			}
			break;
		case 'getplaying':
				window.App.isPlaying = response.result.playing;
				$(".streamer-title").text(response.result.title + " - " + response.result.quality);
			break;
		case 'getselection':
			window.App.subtitles = {};
			if (window.App.view === "player") {

			}
			else if (window.App.view === "movie-detail") {
				if (response.result.image === "images/posterholder.png") {
					response.result.image = "assets/img/posterholder.png";
				}
				$(".movie-detail-poster").attr("src", response.result.image);
				$(".movie-detail-container").attr("style", "background-image: url(" + response.result.backdrop + ");");
				$(".movie-detail-title").text("" + response.result.title + "");
				$(".movie-detail-year").text("" + response.result.year + "");
				$(".movie-detail-rating").text("" + response.result.rating + "/10");
				$(".movie-detail-synopsis").html("<p>" + response.result.synopsis + "</p>");
				$(".expand").removeClass("hidden");
				$(".movie-detail").addClass("minimised");
				$(".btn-movie-detail-favourite").removeClass("added");
				$(".btn-movie-detail-favourite").find("i").removeClass("red");
				$(".btn-movie-detail-favourite span").text('Bookmark');
				$(".btn-movie-detail-watched").removeClass("watched-icon");
				$(".btn-movie-detail-watched").find("i").removeClass("none watched-icon");
				$(".btn-movie-detail-watched span").text('Mark watched');
				$(".movie-detail-genre").text("" + response.result.genre + "");
				$(".movie-detail-runtime").text("" + response.result.runtime + " min");
				$(".movie-detail-imdb").html('<a href="http://imdb.com/title/' + response.result.imdb_id + '/" target="_blank"><img src="assets/img/imdb.png"></a>');

				if (response.result.bookmarked) {
					$(".btn-movie-detail-favourite").find("i").toggleClass("none red"); // !
					$(".btn-movie-detail-favourite").addClass("added");
					$(".btn-movie-detail-favourite span").text('Bookmarked');
				}
				if (response.result.watched) {
					// toggle as watched
					$(".btn-movie-detail-watched").find("i").toggleClass("none watched-icon");
					$(".btn-movie-detail-watched").addClass("watched-icon");
					$(".btn-movie-detail-watched span").text('Watched');
				}
				// check for state of subtitles. -> getselectedsubtitles?
				// store subtitle zips in array.
				window.App.subtitles = response.result.subtitle;
				// check for state of player. -> ?

				$(".btn-movie-detail-quality").text(response.result.quality);

			}
			else if (window.App.view === "shows-container-contain") {
				// show info of show.
				$(".show-detail-title").text(response.result.title);
				$(".show-detail-year").text(response.result.year + " - " + response.result.status);
				$(".show-detail-seasons").text(response.result.num_seasons + " Seasons");
				$(".show-detail-runtime").text(response.result.runtime + " min");
				$(".show-detail-synopsis").html("<p>" + response.result.synopsis + "</p>");
				$(".show-detail-genre").text(response.result.genres[0]);
				$(".show-detail-rating").text([response.result.rating.percentage/10] + "/10");
				$(".show-detail-poster").attr("src", response.result.images.poster);
				$(".show-detail-imdb").html('<a href="http://imdb.com/title/' + response.result.imdb_id + '/" target="_blank"><img src="assets/img/imdb.png"></a>');
				$(".show-detail-container").attr("style", "background-image: url(" + response.result.images.fanart + ");");
				if (response.result.bookmarked) {
					$(".btn-show-detail-favourite").find("i").toggleClass("none red");
					$(".btn-show-detail-favourite").addClass("added");
					$(".btn-show-detail-favourite span").text('Bookmarked');
				}
				// show info of selected episode.
				$(".episode-detail-title").text(response.result.selectedEpisode.title);
				$(".episode-detail-season").text("Season " + response.result.selectedEpisode.season + ", ");
				$(".episode-detail-episode").text("Episode " + response.result.selectedEpisode.episode);
				$(".episode-detail-synopsis").text(response.result.selectedEpisode.overview);
				if (typeof response.result.selectedEpisode.torrents["720p"] !== "undefined") {
					$(".btn-episode-detail-quality").text("720p");
				}
				else {
					$(".btn-episode-detail-quality").text("480p");
				}
				if (response.result.selectedEpisode.watched.watched == true) { // weird object?
					// PT always returns false.
					$(".btn-episode-detail-watched").find("i").removeClass("grey");
					$(".btn-episode-detail-watched").find("i").addClass("white");
					$(".btn-episode-detail-watched span").text("Watched");
				}
				// generate list of available episodes.
				$(".episodes-list").children().remove();
				$(".episodes-list").append('<option value="">Select Episode</option>');
				for (var i = 1; i <= response.result.num_seasons; i++) {
					$.each(response.result.episodes, function(key, value) {
						if (value.season === i) {
							$(".episodes-list").append('<option value="' + value.season + '-' + value.episode + '"> S' + value.season + ' E' + value.episode + ' ' + value.title + '</option>');
						}
					});
				}
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
					if (typeof value.image == "undefined") {
						value.image = value.images.poster; // For the sake of anime tv series posters.
					}
					else if (value.image === "images/posterholder.png") {
						value.image = "assets/img/posterholder.png";
					}
					if (typeof value.year == "undefined") {
						value.year = "";
					}
					if (typeof value.rating == "undefined") {
						value.rating = "";
					}
					else {
						value.rating = value.rating + "/10";
					}
					if (response.result.list[key].watched) {
						if (window.App.settings.ui.watcheditems == "fade" || window.App.settings.ui.watcheditems == "") {
							$("#main-browser .list").append('<li class="item watched" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '</span></div></li>');
						}
						else if (window.App.settings.ui.watcheditems == "show") {
							$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '</span></div></li>');
						}
					}
					else {
						$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '</span></div></li>');
					}
				});
			}
			else if (response.result.type === "show") {
				$.each(response.result.list, function(key, value) {
					if (value.images.poster === "images/posterholder.png") {
						value.images.poster = "assets/img/posterholder.png";
					}
					$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.images.poster + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><!--//<span class="item-rating pull-right">' + value.rating + '/10</span>//--></div></li>');
				});
			}
			else if (response.result.type === "anime") {
				// PT never gives type=anime, it gives type=movie instead..
			}
			else if (response.result.type === "bookmarkedmovie") {
				// can be movies, shows and anime mixed together.
				console.debug(response.result.list);
				$.each(response.result.list, function(key, value) {
					if (typeof value.rating === "object") {
						value.rating = [value.rating.percentage/10];
					}
					if (response.result.list[key].watched) {
						if (window.App.settings.ui.watcheditems == "fade" || window.App.settings.ui.watcheditems == "") {
							$("#main-browser .list").append('<li class="item watched" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
						}
						else if (window.App.settings.ui.watcheditems == "show") {
							$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
						}
					}
					else {
						$("#main-browser .list").append('<li class="item" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
					}
				});
			}
			else {
				// Unknown type.
			}
			$("#main-browser .list").append('<li class="item"><a class="btn-more btn btn-primary btn-minion">Load More..</a></li>');
			window.App.page = response.result.page;
			break;
		case 'getstreamurl':
			if (window.App.playHere == "true") {
				$("#streamer-video").attr("src", response.result.streamUrl);
				$("#streamer-source").attr("src", response.result.streamUrl);
				if (window.App.subtitles[window.App.selectedSubtitles] !== undefined) {
					console.debug("[DEBUG] Selected subtitles: " + window.App.subtitles[window.App.selectedSubtitles]);
					$("#streamer-track").attr("srclang", window.App.selectedSubtitles);
					$("#streamer-track").attr("src", window.App.settings.zipExtractor + "?key=574380257039257432968&url=" + window.App.subtitles[window.App.selectedSubtitles]);
				}
				$("#streamer-link").attr("href", "streamer.html?extractor=" + window.App.settings.zipExtractor + "&lang=" + window.App.selectedSubtitles + "&src=" + response.result.streamUrl + "&subs=" + window.App.subtitles[window.App.selectedSubtitles]);
				$("#streamer-link").on("click", function() {
					$("#streamer-video").get(0).pause();
				});
			}
			else {
				// ... do stuff with the stream here button
			}
			break;
		case 'toggleplaying':
			$(".btn-player-pause").toggleClass("fa-play fa-pause");
			break;
		case 'volume':
			window.App.currentVolume = response.result.volume;
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
				console.debug(response);
				if (typeof response.result.episode !== "undefined") {
					// tv show epsiode
					// waiting for my PR to get merged.
				}
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
			else if (window.App.view === "shows-container-contain") {
				$(".select-players-episode").children().remove();
				$(".select-players-episode").append('<li role="presentation" class="dropdown-header">Select a device to stream to</li>');
				$(".select-players-episode").append('<li role="presentation" data-player=""><a role="menuitem" tabindex="-1" class="change-player-episode" href="#episode-actions">This device <img class="player-icon" src="assets/img/player-external.png"></a></li>');
				$.each(response.result.players, function(index, value) {
					$(".select-players-episode").append('<li role="presentation" data-player="' + value.id + '"><a role="menuitem" tabindex="-1" class="change-player-episode" href="#episode-actions">' + value.name + ' <img class="player-icon" src="assets/img/player-' + value.id + '.png"></a></li>');
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
					$(".btn-movie-detail-favourite span").text("Bookmark");
				}
				else {
					$(btn).addClass("added");
					$(".btn-movie-detail-favourite span").text("Bookmarked");
				}
			}
			else if (window.App.view === "shows-container-contain") {
				var btn = $(".btn-show-detail-favourite");
				$(btn).find("i").toggleClass("non red");
				if ($(btn).hasClass("added")) {
					$(btn).removeClass("added");
					$(".btn-show-detail-favourite span").text("Bookmark");
				}
				else {
					$(btn).addClass("added");
					$(".btn-show-detail-favourite span").text("Bookmarked");
				}
			}
			break;
		case 'togglewatched':
			if (window.App.view === "movie-detail") {
				var btn = $(".btn-movie-detail-watched");
				$(btn).find("i").toggleClass("none watched-icon");
				if ($(btn).hasClass("watched-icon")) {
					$(btn).removeClass("watched-icon");
					$(".btn-movie-detail-watched span").text('Mark watched');
				}
				else {
					$(btn).addClass("added");
					$(".btn-movie-detail-watched span").text('Watched');
				}
			}
			else if (window.App.view === "shows-container-contain") {
				var btn = $(".btn-episode-detail-watched");
				$(btn).find("i").toggleClass("grey white");
				if ($(btn).find("i").hasClass("grey")) {
					$(".btn-episode-detail-watched span").text('Mark watched');
				}
				else {
					$(".btn-episode-detail-watched span").text('Watched');
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
			else if (window.App.view === "shows-container-contain") {
				$('[data-player]').removeClass("player-selected-episode");
				$('[data-player="' + request.params + '"]').addClass("player-selected-episode");
				var iconsrc = $('[data-player="' + request.params + '"] > a > img').attr("src");
				$(".btn-players-episode-caret > .caret-icon").removeClass("caret");
				$(".btn-players-episode-caret > .caret-icon").html('<img class="player-icon-main" src="' + iconsrc + '"> <i class="caret"></i>');
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
			else if (window.App.view === "shows-container-contain") {
				var btn = $(".btn-episode-detail-quality");
				if (btn.text() === "720p") {
					btn.text("480p");
				}
				else if (btn.text() === "480p") {
					btn.text("720p");
				}
			}
			break;
		case 'selectepisode':
			popcorntimeAPI("getselection");
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
		case 'setselection':
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
		// Clear list
		$("#main-browser .list").children().remove();
		if (window.App.forceView === true && window.App.settings.ui.startscreen !== "") {
			switch (window.App.settings.ui.startscreen) {
				case "shows":
					popcorntimeAPI("showslist");
					break;
				case "movies":
					popcorntimeAPI("movieslist");
					break;
				case "":
					// let PT handle the view.
					break;
				case "anime":
					popcorntimeAPI("animelist");
					break;
				case "watchlist":
					popcorntimeAPI("showwatchlist");
					break;
				case "favourites":
					popcorntimeAPI("showfavourites");
					break;
				default:
					// unknown setting.
			}
			window.App.forceView = false;
		}
		switch (currentview) {
			case 'main-browser':
				showSection("main-browser");
				popcorntimeAPI("getcurrentlist");
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
				window.App.playHere = window.sessionStorage.getItem("playHere");
				console.debug("[DEBUG] App.playHere = " + window.App.playHere + ".");
				popcorntimeAPI("getstreamurl");
				if (window.App.playHere == "true") {
					if (window.App.isPlaying) {
						popcorntimeAPI("toggleplaying");
					}
					showSection("streamer");
				}
				else {
					showSection("player");
					if (window.App.isPlaying == false) {
						$(".btn-player-pause").removeClass("fa fa-pause");
						$(".btn-player-pause").addClass("fa fa-play")
					}
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
				window.App.forceView = true;
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
function setSettings(address, port, username, password, language, startscreen, watcheditems) {
	window.localStorage.setItem("ip", address);
	window.localStorage.setItem("port", port);
	window.localStorage.setItem("username", username);
	window.localStorage.setItem("password", password);
	window.localStorage.setItem("language", language);
	window.localStorage.setItem("startscreen", startscreen);
	window.localStorage.setItem("watcheditems", watcheditems);
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
	window.App.settings.ui.language = window.localStorage.getItem("language");
	window.App.settings.ui.startscreen = window.localStorage.getItem("startscreen");
	window.App.settings.ui.watcheditems = window.localStorage.getItem("watcheditems");
	$(".settings-address").val(window.App.settings.connection.ip);
	$(".settings-port").val(window.App.settings.connection.port);
	$(".settings-username").val(window.App.settings.connection.username);
	$(".settings-password").val(window.App.settings.connection.password);
	$(".settings-language").val(window.App.settings.ui.language);
	$(".settings-startscreen").val(window.App.settings.ui.startscreen);
	$(".settings-watcheditems").val(window.App.settings.ui.watcheditems);
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
			window.sessionStorage.setItem("playHere", "true");
		}
		else {
			window.App.playHere = false;
			window.sessionStorage.setItem("playHere", "false");
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
	// TV Show button handlers.
	$(".btn-watch-episode").on("click", function() {
		popcorntimeAPI("enter");
	});
	$(".episodes-list").on("change", function() {
		var data = $(this).val();
		var dataArray = data.split('-');
		popcorntimeAPI("selectepisode", [dataArray[0], dataArray[1]]);
		// update view?
	});
	$(".btn-show-detail-favourite").on("click", function() {
		popcorntimeAPI("togglefavourite");
	});
	$(".btn-episode-detail-quality").on("click", function() {
		popcorntimeAPI("togglequality");
	});
	$(".select-players-episode").on("click", ".change-player-episode", function() {
		if ($(this).parent().attr("data-player") === "") {
			window.App.playHere = true;
			window.sessionStorage.setItem("playHere", "true");
		}
		else {
			window.App.playHere = false;
			window.sessionStorage.setItem("playHere", "false");
		}
		popcorntimeAPI("setplayer", [$(this).parent().attr("data-player")]);
	});
	$(".btn-episode-detail-watched").on("click", function() {
		popcorntimeAPI("togglewatched");
	});
	// Back button.
	$(".btn-back").on("click", function() {
		popcorntimeAPI("back");
	});
	// Stop stream button.
	$(".btn-stop-stream").on("click", function() {
		$("#streamer-video").get(0).pause();
	});
	// Player handlers.
	$(".btn-player-pause").on("click", function() {
		popcorntimeAPI("toggleplaying");
	});
	$(".btn-player-up").on("click", function() {
		popcorntimeAPI("volume", [window.App.currentVolume + 0.1]);
	});
	$(".btn-player-down").on("click", function() {
		popcorntimeAPI("volume", [window.App.currentVolume - 0.1]);
	});
	$(".btn-player-left").on("click", function() {
		popcorntimeAPI("seek", [-10]);
	});
	$(".btn-player-right").on("click", function() {
		popcorntimeAPI("seek", [10]);
	});
	// Save settings handler.
	$(".btn-save").on("click", function() {
		setSettings($(".settings-address").val(), $(".settings-port").val(), $(".settings-username").val(), $(".settings-password").val(), $(".settings-language").val(), $(".settings-startscreen").val(), $(".settings-watcheditems").val());
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
	$(".nav-title").text("Minion v" + App.version);
	if (App.debug) {
		console.info("[INFO] Extra debugging is enabled. Brace yourself for tons of debug messages!");
		console.log("[INFO] Debugging messages can be altered during the session by changing settings in the Objects 'App.debug' and 'App.settings.debug'.");
	}
	if (!hasRequiredStorage()) {
		console.info("[INFO] Could not find all required localStorage.");
		console.info("[INFO] Assuming that this is the first session, showing welcome section.");
		showSection("settings");
		$(".welcome").removeClass("hidden");
		$(".settings-ui").addClass("hidden");
		$(".btn-reload").addClass("hidden");
		$(".btn-reset").addClass("hidden");
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
