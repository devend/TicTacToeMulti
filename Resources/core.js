
(function(){
	
	// App state
	app.moves = 0;
	app.poll = false;
	app.playerId = -1;
	
	// Game state
	app.gameId = -1;
	app.player1 = 0;
	app.player2 = 0;
	app.currentPlayer = 0;
	app.board = [0,0,0,0,0,0,0,0,0];
	app.status = UNDEF;
	app.winner = 0;
	
	// Controls the local player's ability to click on the board
	app.local = false; 
	
	app.init = function() {
		app.status = UNDEF;
		
		if(Ti.App.Properties.hasProperty(PLAYER_ID)) {
			app.playerId = Ti.App.Properties.getInt(PLAYER_ID, -1);
			if(app.playerId < 1) {
				app.network.getPlayerId();
			} else {
				app.gameId = Ti.App.Properties.getInt(GAME_ID, -1);
				app.network.getGame();	
			}
		} else {
			app.network.getPlayerId();
		}
		
		// Call the poll client repeatedly with the interval specified by POLL_INTERVAL  
		setInterval(app.pollClient, POLL_INTERVAL);
	};
	
	app.pollClient = function() {
		// Will get a game state from the server to update the ongoing game when these conditions are true:
		// 1)  game.status == ONGOING
		// 2)  it is the remote player's turn
		if(app.poll) {
			app.network.getGame();
		}
	};
	
	app.initNewGame = function() {
		
		if(app.status == ONGOING) {
			app.status = QUIT;
			app.syncState();
		}
		
		// Set initial game values
		app.ui.clearFields();
		clearBoard();
		app.moves = 0;
		app.local = false;
		app.gameId = -1;
		app.player1 = 0;
		app.player2 = 0;
		app.currentPlayer = 0;
		app.winner = 0;
		Ti.App.Properties.removeProperty(GAME_ID);
		app.status = UNDEF;
		app.poll = false;
		
		// Inform that the app communicate with the server
		app.ui.setInfo('Contacting game server');
		
		// Get a new game from the server
		app.network.getGame();
	};
	
	function clearBoard() {
		app.board = [0,0,0,0,0,0,0,0,0];
	}
	
	app.setPlayerId = function(id) {
		Ti.App.Properties.setInt(PLAYER_ID, id);
		app.playerId = id;
		app.network.getGame();
	};
	
	app.onNewGameClick = function(e) {
		app.ui.flashNewGameButton();
		
		if(app.status == ONGOING) {		
			// In case of an ongoing game - let the user confirm the start of a new game (by clicking OK).
			app.ui.confirmNewGame();	
		} else {
			app.initNewGame();
		}
	};
	
	app.getGameRequestObject = function() {
		var req = {};
		req.playerId = app.playerId;
		req.gameId = app.gameId;
		return req;
	};
	
	app.invalidateGame = function(state) {		 
		// Sync the local game to match the state object returned from the server.
		app.status = ONGOING;
		app.gameId = state.gameId;
		app.player1 = state.player1;
		app.player2 = state.player2;
		app.currentPlayer = state.currentPlayer;
		app.board = [state.b0, state.b1, state.b2, state.b3, state.b4, state.b5, state.b6, state.b7, state.b8];
		app.winner = state.winner;
		
		// app.player1 always has symbol O. Find out if it is the local player or  
		// the remote player who is player1 and set the symbols accordingly.
		if(app.playerId == state.player1) {
			app.ui.setLocalPlayerSymbol('O');
			app.ui.setRemotePlayerSymbol('X');
			app.localSymbol = 'O';
			app.remoteSymbol = 'X';
		} else {
			app.ui.setLocalPlayerSymbol('X');
			app.ui.setRemotePlayerSymbol('O');
			app.localSymbol = 'X';
			app.remoteSymbol = 'O';
		}
		
		if(state.player2 === 0) {
			// This is a new game that not has a second player yet.
			Ti.App.Properties.setInt(GAME_ID, state.gameId);
		}
		
		if(state.currentPlayer == app.playerId) {
			// Make it possible for the local player to click on the board.
			app.local = true;
		} else {
			app.local = false;	
		}
		
		// Set the fields in the board to the current values.
		app.ui.setFieldSymbols();
		
		// Count the non zero fields and set the value to app.moves
		app.moves = calcMoves();
		
		// Check the current game status and get a status/info message to show. May change the app.status.
		checkGameStatus();
		
		if(app.status == ONGOING && app.local == false) {
			// Enable polling the game server
			app.poll = true;
		} else {
			// Disable polling the game server
			app.poll = false;
		}
	};
	
	function calcMoves() {
		var moves = 0;
		for(var i=0, length=app.board.length; i<length; i++) {
			if(app.board[i] !== 0) {
				moves++;
			}
		}
		return moves;
	}
	
	app.onFieldClick = function(e) {
		if(!app.local)
			return;
		
		if(app.board[e.source.pos] === 0) {
			app.board[e.source.pos] = app.playerId;
			app.ui.setBackgroundImage(e.source, app.localSymbol == 'X' ? IMAGE_X : IMAGE_O);
			app.local = false;
			app.poll = true;
			app.moves = calcMoves();
			checkGameStatus();
			
			// Switch the current player to be the other player
			app.currentPlayer = app.playerId == app.player1 ? app.player2 : app.player1;
			app.syncState();
		} else {
			// Flash the field in red color to make it clear that it was already set and thus is not an allowed move.
			app.ui.flashField(e.source, 'red');
		} 
	};
	
	app.syncState = function() {
		// Create a state object and update the game state on the server.
		var state = {};	
		state.gameId = app.gameId;
		state.player1 = app.player1;
		state.player2 = app.player2;
		state.currentPlayer = app.currentPlayer;
		state.b0 = app.board[0];
		state.b1 = app.board[1];
		state.b2 = app.board[2];
		state.b3 = app.board[3];
		state.b4 = app.board[4];
		state.b5 = app.board[5];
		state.b6 = app.board[6];
		state.b7 = app.board[7];
		state.b8 = app.board[8];
		state.status = app.status;
		state.winner = app.winner;
		
		app.network.updateState(state); 
	};
	
	function checkGameStatus() {		
		var winnerId = checkForWinner();
		if(winnerId == app.playerId) {
			// Local player is the winner
			app.ui.setInfo('Game over - winner:  ' + app.localSymbol);
			app.ui.flashLines('#fccf32');
			app.local = false;
			app.status = VICTORY;
			app.winner = app.playerId;
		} else if(winnerId > 0) {
			// Remote player is the winner
			app.ui.setInfo('Game over - winner:  ' + app.remoteSymbol);
			app.ui.flashLines('#fccf32');
			app.local = false;
			app.status = VICTORY;
			app.winner = app.playerId == app.player1 ? app.player2 : app.player1;
		} else if(app.status == QUIT) {
			// A player has quit the game
			app.ui.setInfo('Game over: player quit');
			app.local = false;
		} else if(app.moves == 9) {
			app.ui.setInfo('Game over: Draw');
			app.local = false;
			app.status = DRAW;
		} else {
			app.ui.setInfo(app.local ? YOUR_TURN : REMOTE_TURN);
		}
	}
	
	function checkForWinner() {
		var board = app.board;
		
		// Check all horizontal rows.
		for(var i=0; i<9; i+=3) {
			if(board[i] === board[i+1] && board[i+1] === board[i+2] && board[i] !== 0) {
				return board[i];
			}
		}
		
		// Check all vertical columns.
		for(var i=0; i<3; i++) {
			if(board[i] === board[i+3] && board[i+3] === board[i+6] && board[i] !== 0) {
				return board[i];
			}
		}
		
		// Check the diagonals
		if(board[0] === board[4] && board[4] === board[8] && board[0] !== 0)
			return board[0];
		else if(board[2] === board[4] && board[4] === board[6] && board[2] !== 0)
			return board[2];
		
		return 0;
	}
	
})();
