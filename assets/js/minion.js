/*!
 * Minion v0.1.0.pre
 * Developed by the PTR Team
 * Copyright 2014, the PTR Team
 * Released under the GNU GPL V3 License
 * http://git.io/minion
 */

/*! Make sure that we've got jQuery included. */
if (typeof jQuery === "undefined") {
	throw new Error("Minion.js requires jQuery.");
}


/***********!
 * Settings
 ***********/

/*! Set App variables. */
var App = {
	errorCount: 0,
	exit: false,
	Settings: {
		name: "Minion",
		version: "0.1.0.pre",
		prefix: "Minion_LS1_",
		interval: 1000,
		ZipExtractor: {
			url: "http://178.62.212.184/zip.php",
			username: "",
			password: "574380257039257432968"
		},
		Debug: {
			enabled: true,
			extraDebug: false,
			doInterval: true,
			doConnectDump: false
		},
		Connection: {
			ip: "",
			port: "",
			username: "",
			password: ""
		},
		UI: {
			language: "",
			startscreen: "",
			watchedItems: "",
			forceView: false
		}
	},
	Client: {
		version: "",
		connected: false,
		view: "",
		page: 1
	},
	Player: {
		playHere: true,
		selectedSubtitles: "",
		currentVolume: 0,
		isTrailer: null,
		isPlaying: null
	},
	Tab: {
		current: "",
		old: ""
	},
	SupportedVersions: {
		0: "0.3.5-3", // release
		1: "0.3.5", // beta
		2: "0.4.0" // dev
	},
	SubtitleLanguages: {},
	Subtitles: {},
}


/***************!
 * SHOW LOADING
 ***************/


/*! Show loading section. */
$("#default").removeClass("hidden");

/*! Load app version into loading screen. */
$(".version").text("Version " + App.Settings.version);


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
		"caller": "PTR-Minion-" + App.Settings.version,
		"callerLocation": window.location.href,
		"method": "ping",
		"params": []
	};
	console.debug("[DEBUG] Connecting to " + username + "@" + address + ":" + port + " with password: " + password + "");
	if (App.Settings.Debug.enabled && App.Settings.Debug.doConnectDump) {
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
				App.Client.version = response.result.popcornVersion;
				console.info("[INFO] PT client has version '" + App.Client.version + "'.");
				isClientSupported(App.Client.version);
				App.Client.connected = true;
			}
			else {
				console.error("[ERROR] Invalid login credentials.");
				alert("Invalid login credentials provided.");
				$(".btn-settings-close").addClass("hidden");
				$(".settings-ui").addClass("hidden");
				$(".btn-reload").addClass("hidden");
				$(".btn-reset").addClass("hidden");
				showSection("settings");
				// show small header?
				App.Client.connected = false;
			}
		},
		error: function(response, textStatus) {
			console.error("[ERROR] Couldn't connect to given address.");
			alert("Could not connect to " + address + ":" + port + ". Please check your settings and try again.");
			$(".btn-settings-close").addClass("hidden");
			$(".settings-ui").addClass("hidden");
			$(".btn-reload").addClass("hidden");
			$(".btn-reset").addClass("hidden");
			// show small header?
			showSection("settings");
			App.Client.connected = false;
		}
	});
	if (App.Client.connected) {
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
	if (!App.Client.connected) {
		console.warn("[WARNING] Can't call popcorntime API: not connected.");
		return false;
	}
	if (typeof parameters === "undefined") {
		parameters = [];
	}
	var request = {
		"id": Math.floor(Math.random() * 100000),
		"jsonrpc": "2.0",
		"caller": "PTR-Minion-" + App.Settings.version,
		"callerLocation": window.location.href,
		"method": method,
		"params": parameters
	};
	$.ajax({
		type: "POST",
		url: 'http://' + App.Settings.Connection.ip + ':' + App.Settings.Connection.port,
		data: JSON.stringify(request),
		async: false,
		beforeSend: function(xhr) {
			xhr.setRequestHeader("Authorization", window.btoa(App.Settings.Connection.username + ":" + App.Settings.Connection.password));
		},
		success: function(response, textStatus) {
			responseHandler(request, response);
		},
		error: function(response, textStatus) {
			console.error("[ERROR] Request id " + request.id + " was not successful.");
			if (App.errorCount > 10 && App.exit !== true) {
				// We most likely lost connection.
				App.exit = true;
				showSection("lostconnection");
				App.Settings.Debug.doInterval = false;
				throw new Error("Lost connection to Popcorn Time client. Stopping interval.");
				return;
			}
			App.errorCount++;
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
			if (response.result.tab != App.Tab.current) {
				setTab(response.result.tab);
			}
			App.Tab.old = App.Tab.current;
			App.Tab.current = response.result.tab;
			break;
		case 'getplaying':
				App.Player.isPlaying = response.result.playing;
				if (response.result.quality != false) {
					$(".streamer-title").text(response.result.title + " - " + response.result.quality);
					App.Player.isTrailer = false;
				}
				else {
					App.Player.isTrailer = true;
				}
				break;
		case 'getselection':
			App.Subtitles = {};
			if (App.Client.view === "player") {

			}
			else if (App.Client.view === "movie-detail") {
				if (response.result.image === "images/posterholder.png") {
					response.result.image = "assets/img/posterholder.png";
				}
				$(".movie-detail-poster").attr("src", response.result.image);
				if (typeof response.result.backdrop != "undefined") {
					$(".movie-detail-container").attr("style", "background-image: url(" + response.result.backdrop + ");");
				}
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
				App.Subtitles = response.result.subtitle;
				// check for state of player. -> ?

				$(".btn-movie-detail-quality").text(response.result.quality);

			}
			else if (App.Client.view === "shows-container-contain") {
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
				// The for loop's max is not 'response.result.num_seasons' but '100',
				// because there are loads of shows with missing seasons.
				// Note that this is just a dirty fix, not a solution.
				for (var i = 1; i <= 100 ; i++) {
					$.each(response.result.episodes, function(key, value) {
						if (value.season === i) {
							$(".episodes-list").append('<option value="' + value.season + '-' + value.episode + '"> S' + value.season + ' E' + value.episode + ' ' + value.title + '</option>');
						}
					});
				}
			}
			else {
				// Unknown
				console.warn("[WARNING] Unknown view '" + App.Client.view + "' to set media info for.");
			}
			break;
		case 'getcurrentlist':
			if (typeof response.result === "undefined" || typeof response.result.page === "undefined") {
				console.error("[ERROR] Client gave us an empty list!");
				//$(".loading-list").removeClass("hidden");
				break;
			}
			else {
				$(".loading-list").addClass("hidden");
			}
			if (response.result.page === App.Client.currentPage) { // ???
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
						if (App.Settings.UI.watchedItems == "fade" || App.Settings.UI.watchedItems == null || App.Settings.UI.watchedItems == "null" || App.Settings.UI.watchedItems == "undefined") {
							$("#main-browser .list").append('<li class="item watched" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '</span></div></li>');
						}
						else if (App.Settings.UI.watchedItems == "show") {
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
						if (App.Settings.UI.watchedItems == "fade" || App.Settings.UI.watchedItems == "" || App.Settings.UI.watchedItems == null) {
							$("#main-browser .list").append('<li class="item watched" data-index="' + key + '"><div class="item-cover" style="background-image: url(' + value.image + ');"><div class="item-overlay"></div></div><div class="item-info"><div class="item-title">' + value.title + '</div><span class="item-year pull-left">' + value.year + '</span><span class="item-rating pull-right">' + value.rating + '/10</span></div></li>');
						}
						else if (App.Settings.UI.watchedItems == "show") {
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
			App.Client.page = response.result.page;
			break;
		case 'getstreamurl':
			if (App.Player.playHere == "true" || App.Player.playHere == null) {
				$("#streamer-video").attr("src", response.result.streamUrl);
				$("#streamer-source").attr("src", response.result.streamUrl);
				if (App.Subtitles[App.Player.selectedSubtitles] != undefined) {
					console.debug("[DEBUG] Selected subtitles: " + App.Subtitles[App.Player.selectedSubtitles]);
					$("#streamer-track").attr("srclang", App.Player.selectedSubtitles);
					App.Settings.ZipExtractor.url
					$("#streamer-track").attr("src", App.Settings.ZipExtractor.url + "?key=" + App.Settings.ZipExtractor.password + "&url=" + App.Subtitles[App.Player.selectedSubtitles]);
				}
				$("#streamer-link").attr("href", "streamer.html?extractor=" + App.Settings.ZipExtractor.url + "&key=" + App.Settings.ZipExtractor.password + "&lang=" + App.Player.selectedSubtitles + "&src=" + response.result.streamUrl + "&subs=" + App.Subtitles[App.Player.selectedSubtitles]);
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
			App.Player.currentVolume = response.result.volume;
			break;
		case 'getsubtitles':
			if (App.Client.view === "movie-detail") {
				$(".movie-detail-select-subtitles").children().remove();
				$(".movie-detail-select-subtitles").append('<option value="none">Select subtitles</option>');
				$.each(response.result.subtitles, function(index, value) {
					$(".movie-detail-select-subtitles").append('<option value="' + value + '">' + App.SubtitleLanguages[value] + '</option>');
				});
			}
			else if (App.Client.view === "player") {
				console.debug(response);
				if (typeof response.result.episode !== "undefined") {
					// tv show epsiode
					// waiting for my PR to get merged.
				}
			}
			break;
		case 'getplayers':
			if (typeof response.result == "undefined" || typeof response.result.players == "undefined") {
				console.error("[ERROR] Got empty list of players.");
				noPlayers = true;
			}
			else {
				noPlayers = false;
			}
			if (App.Client.view === "movie-detail") {
				$(".select-players").children().remove();
				$(".select-players").append('<li role="presentation" class="dropdown-header">Select a device to stream to</li>');
				$(".select-players").append('<li role="presentation" data-player=""><a role="menuitem" tabindex="-1" class="change-player" href="#movdet-actions">This device <img class="player-icon" src="assets/img/player-external.png"></a></li>');
				if (noPlayers) {
					break;
				}
				$.each(response.result.players, function(index, value) {
					$(".select-players").append('<li role="presentation" data-player="' + value.id + '"><a role="menuitem" tabindex="-1" class="change-player" href="#movdet-actions">' + value.name + ' <img class="player-icon" src="assets/img/player-' + value.id + '.png"></a></li>');
				});
			}
			else if (App.Client.view === "shows-container-contain") {
				$(".select-players-episode").children().remove();
				$(".select-players-episode").append('<li role="presentation" class="dropdown-header">Select a device to stream to</li>');
				$(".select-players-episode").append('<li role="presentation" data-player=""><a role="menuitem" tabindex="-1" class="change-player-episode" href="#episode-actions">This device <img class="player-icon" src="assets/img/player-external.png"></a></li>');
				if (noPlayers) {
					break;
				}
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
			if (App.Client.view === "movie-detail") {
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
			else if (App.Client.view === "shows-container-contain") {
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
			if (App.Client.view === "movie-detail") {
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
			else if (App.Client.view === "shows-container-contain") {
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
			if (App.Client.view === "movie-detail") {
				$(".movie-detail-select-subtitles").val(request.params);
			}
			break;
		case 'setplayer':
			if (App.Client.view === "movie-detail") {
				$('[data-player]').removeClass("player-selected");
				$('[data-player="' + request.params + '"]').addClass("player-selected");
				var iconsrc = $('[data-player="' + request.params + '"] > a > img').attr("src");
				$(".btn-players-caret > .caret-icon").removeClass("caret");
				$(".btn-players-caret > .caret-icon").html('<img class="player-icon-main" src="' + iconsrc + '"> <i class="caret"></i>');
			}
			else if (App.Client.view === "shows-container-contain") {
				$('[data-player]').removeClass("player-selected-episode");
				$('[data-player="' + request.params + '"]').addClass("player-selected-episode");
				var iconsrc = $('[data-player="' + request.params + '"] > a > img').attr("src");
				$(".btn-players-episode-caret > .caret-icon").removeClass("caret");
				$(".btn-players-episode-caret > .caret-icon").html('<img class="player-icon-main" src="' + iconsrc + '"> <i class="caret"></i>');
			}
			//window.App.player = request.params;
			break;
		case 'togglequality':
			if (App.Client.view === "movie-detail") {
				var btn = $(".btn-movie-detail-quality");
				if (btn.text() === "1080p") {
					btn.text("720p");
				}
				else if (btn.text() === "720p") {
					btn.text("1080p");
				}
			}
			else if (App.Client.view === "shows-container-contain") {
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
		case 'clearsearch':
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
	if (App.Client.view !== currentview && $("#settings").is(":visible") === false) {
		console.debug("[DEBUG] View changed, new view: '" + currentview + "'.");
		// Clear list
		$("#main-browser .list").children().remove();
		if (App.Settings.UI.forceView === true && App.Settings.UI.startscreen !== "") {
			switch (App.Settings.UI.startscreen) {
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
			App.Settings.UI.forceView = false;
		}
		switch (currentview) {
			case 'main-browser':
				showSection("main-browser");
				popcorntimeAPI("getcurrentlist");
				$(".list").on("click", ".btn-more", function() {
					$(this).hide();
					popcorntimeAPI("getcurrentlist", [App.Client.page + 1]);
				});
				//popcorntimeAPI("getgenres");
				//popcorntimeAPI("getsorters");
				break;
			case 'shows-container-contain':
				showSection("shows-container");
				App.Client.view = currentview;
				popcorntimeAPI("getselection");
				popcorntimeAPI("getplayers");
				break;
			case 'movie-detail':
				showSection("movie-detail");
				App.Client.view = currentview;
				popcorntimeAPI("getplayers");
				popcorntimeAPI("getsubtitles");
				popcorntimeAPI("getselection");
				break;
			case 'player':
				popcorntimeAPI("getplaying");
				popcorntimeAPI("getsubtitles");
				App.Player.playHere = sessionStorage.getItem("playHere");
				console.debug("[DEBUG] App.Player.playHere = " + App.Player.playHere + ".");
				popcorntimeAPI("getstreamurl");
				if (App.Player.playHere == "true" || App.Player.playHere == null && App.Player.isTrailer == false) {
					if (App.Player.isPlaying) {
						popcorntimeAPI("toggleplaying");
					}
					showSection("streamer");
				}
				else {
					showSection("player");
					if (App.Player.isPlaying == false) {
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
				App.Settings.UI.forceView = true;
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
		App.Client.view = currentview;
	}
	else if (currentview === "main-browser") {
		// For the sake of the active tabs..
		if (App.Tab.current === "movies" || App.Tab.current === "shows" || App.Tab.current === "anime") {
			$(".search").removeClass("hidden");
		}
		else {
			$(".search").addClass("hidden");
		}
		// For the sake of refeshing the list.
		if (App.Tab.current === "movies" || App.Tab.current === "shows" || App.Tab.current === "anime" || App.Tab.current === "Watchlist" || App.Tab.current === "Favorites") {
			if (App.Tab.current !== App.Tab.old) {
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
	localStorage.setItem("ip", address);
	localStorage.setItem("port", port);
	localStorage.setItem("username", username);
	localStorage.setItem("password", password);
	localStorage.setItem("language", language);
	localStorage.setItem("startscreen", startscreen);
	localStorage.setItem("watcheditems", watcheditems);
	console.debug("[DEBUG] Settings were set.");
	return true;
}

/*!
 * Load Minion's settings into global variables and the settings form.
 *
 * @returns {void}
 */
function loadSettings() {
	App.Settings.Connection.ip = localStorage.getItem("ip");
	App.Settings.Connection.port = localStorage.getItem("port");
	App.Settings.Connection.username = localStorage.getItem("username");
	App.Settings.Connection.password = localStorage.getItem("password");
	App.Settings.UI.language = localStorage.getItem("language");
	App.Settings.UI.startscreen = localStorage.getItem("startscreen");
	App.Settings.UI.watchedItems = localStorage.getItem("watcheditems");
	$(".settings-address").val(App.Settings.Connection.ip);
	$(".settings-port").val(App.Settings.Connection.port);
	$(".settings-username").val(App.Settings.Connection.username);
	$(".settings-password").val(App.Settings.Connection.password);
	$(".settings-language").val(App.Settings.UI.language);
	$(".settings-startscreen").val(App.Settings.UI.startscreen);
	$(".settings-watcheditems").val(App.Settings.UI.watchedItems);
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
	$(".search-term").on("keydown", function(e) {
		if (e.value == "") {
			$(".search-remove").addClass("hidden");
		}
		else {
			$(".search-remove").removeClass("hidden");
		}
		if (e.keyCode == 13 || e.keyCode == 10) {
			e.preventDefault();
			popcorntimeAPI("filtersearch", [this.value]);
		}
	});
	$(".search-enter").on("click", function() {
		popcorntimeAPI("filtersearch", [$(".search-term").val()]);
	});
	$(".search-remove").on("click", function() {
		popcorntimeAPI("clearsearch");
		$(".search-term").val("");
		$(".search-remove").addClass("hidden");
	});
	// Local settings handlers.
	$(".btn-settings").on("click", function() {
		showSection("settings");
	});
	$(".btn-settings-close").on("click", function() {
		showSection(App.Client.view);
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
		App.Player.selectedSubtitles = this.value;
	});
	$(".select-players").on("click", ".change-player", function() {
		if ($(this).parent().attr("data-player") === "") {
			// This device is selected.
			App.Player.playHere = true;
			sessionStorage.setItem("playHere", "true");
		}
		else {
			App.Player.playHere = false;
			sessionStorage.setItem("playHere", "false");
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
			App.Player.playHere = true;
			sessionStorage.setItem("playHere", "true");
		}
		else {
			App.Player.playHere = false;
			sessionStorage.setItem("playHere", "false");
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
		popcorntimeAPI("volume", [App.Player.currentVolume + 0.1]);
	});
	$(".btn-player-down").on("click", function() {
		popcorntimeAPI("volume", [App.Player.currentVolume - 0.1]);
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
			localStorage.clear();
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
	else if (localStorage.getItem(key) !== null) {
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
	$.each(App.SupportedVersions, function(key, value) {
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
	App.SubtitleLanguages = json;
});

/*! On document ready, get started. */
$(document).ready(function() {
	console.log('  __  __ _       _             \n |  \\/  (_)     (_)            \n | \\  / |_ _ __  _  ___  _ __  \n | |\\/| | | \'_ \\| |/ _ \\| \'_ \\ \n | |  | | | | | | | (_) | | | |\n |_|  |_|_|_| |_|_|\\___/|_| |_|\n                               ');
	console.log(" Minion version " + App.Settings.version + ".");
	console.log(" Developed by the PTR Team.");
	console.log(" Copyright (c) 2014, the PTR Team.");
	console.log(" Released under the GNU GPL V3 License.");
	console.log(" http://git.io/minion");
	console.log("");
	console.info("[INFO] Document is ready, starting Minion session.");
	console.info("[INFO] Minion version " + App.Settings.version + ".");
	$(".nav-title").text("Minion v" + App.Settings.version);
	if (App.Settings.Debug.enabled) {
		console.info("[INFO] Extra debugging is enabled. Brace yourself for tons of debug messages!");
		console.log("[INFO] Debugging messages can be altered during the session by changing settings in the Object 'App.Settings.Debug'.");
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
			if (App.Client.connected) {
				setSettings(tryAddress, tryPort, tryUsername, tryPassword);
				loadSettings();
				alert("Connected to Popcorn Time client!");
				location.reload();
			}
		});
	}
	else {
		loadSettings();
		registerListeners();
		popcorntimeConnect(App.Settings.Connection.ip, App.Settings.Connection.port, App.Settings.Connection.username, App.Settings.Connection.password);
		if (App.Client.connected) {
			setInterval(function() {
				if (App.Settings.Debug.doInterval) {
					popcorntimeAPI("getviewstack");
					popcorntimeAPI("getcurrenttab");
				}
			}, App.Settings.interval);
		}
	}
});
