
(function() {
	
	app.network = {};
	
	app.network.getPlayerId = function() {
		var xhr = Ti.Network.createHTTPClient({
		    onload: function(e) {
		    	try {
		    		var response = JSON.parse(xhr.responseText);
		    		app.setPlayerId(response.id);
		    	} catch(e) {

		    	}
		    },
		    onerror: function(e) {
				setTimeout(function() {
					// Make sure to get a player id in case of connection error etc
					app.network.getPlayerId;
				}, TEN_SEC);
		    },
		    timeout:REQ_TIMEOUT
		});
		xhr.open('POST', URI_GET_PLAYER_ID);
		xhr.send();
	};	
	
	app.network.getGame = function() {
		var request = app.getGameRequestObject();
		var xhr = Ti.Network.createHTTPClient({
		    onload: function(e) {
		    	try {
		    		var state = JSON.parse(xhr.responseText);
		    		app.invalidateGame(state);
		    	} catch(ex) {

		    	}
		    },
		    onerror: function(e) {

		    },
		    timeout:REQ_TIMEOUT
		});
		xhr.open('POST', URI_GET_GAME);
		xhr.send(request);
	};
	
	app.network.updateState = function(state) {
		var xhr = Ti.Network.createHTTPClient({
		    onload: function(e) {
		    	try {
		    		var response = JSON.parse(xhr.responseText);
		    		if(response.msg == 'FAIL') {
		    			// Make sure the state will be updated on the server, continue and try to sync.
		    			setTimeout(function() {	
							app.syncState();
						}, TEN_SEC);
		    		}
		    	} catch(ex) {
		    		// Make sure the state will be updated on the server, continue and try to sync.
	    			setTimeout(function() {
						app.syncState();
					}, TEN_SEC);
		    	}
		    },
		    onerror: function(e) {
				// Make sure the state will be updated on the server, continue and try to sync.
    			setTimeout(function() {	
					app.syncState();
				}, TEN_SEC);
		    },
		    timeout:REQ_TIMEOUT
		});
		xhr.open('POST', URI_UPDATE_STATE);
		xhr.send(state);
	};
	
})();
