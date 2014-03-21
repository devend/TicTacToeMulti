
(function() {

	app.ui = {};
	app.ui.mainWindow = null;
	app.ui.lblInfo = null;
	app.ui.board = null;
	app.ui.fields = [];
	app.ios = Ti.Platform.version;

	app.ui.createApplicationWindow = function() {
		this.mainWindow = Titanium.UI.createWindow({ navBarHidden:true });

		createEmptyBoard();
		createInfoPanel();
		createLocalPlayerInfo();
		createRemotePlayerInfo();
		createNewGameButton();

		return this.mainWindow;
	};

	function createEmptyBoard() {
		// Create the base. The only visible part of the base in the final board are the lines.
		app.ui.board = Ti.UI.createView({
			backgroundColor:'#888',
			top:app.ios < 7 ? '40dp' : '60dp',
			left:'0dp',
			width:'319dp',
			height:'319dp',
			layout:'horizontal'
		});
		
		// Create nine square fields.
		for (var i=0, x=0, y=0; i<9; i++) {
			if(i % 3 === 0) { 					// The creation of the x and y coords are not 
				x = 0;							// necessary. They were created to see if the
				y = i > 0 ? y + 1 : y;			// fields were placed correctly on the board
			} else {							// while building up the game.
				x++;
			}
			app.ui.fields[i] = createField(x, y, i);
		}

		// Add the nine square fields to the board.
		for (var i=0; i<9; i++) {
			app.ui.board.add(app.ui.fields[i]);
		}
		
		// Add the board to the window.
		app.ui.mainWindow.add(app.ui.board);
	}

	function createField(x, y, pos) {
		
		var field = Ti.UI.createView({
			top:'1dp',
			left:'1dp',
			width:'105dp',
			height:'105dp',
			backgroundColor:'#222',
			backgroundImage:null,
			x:x,
			y:y,
			pos:pos,
			symbol:null
		});
		field.addEventListener('click', app.onFieldClick);
		return field;
	}
	
	function createNewGameButton() {
		app.ui.newGame = Ti.UI.createView({
			top:app.ios < 7 ? '375dp' : '395dp',
			left:'0dp',
			width:'319dp',
			height:'35dp',
			backgroundColor:'#fa5f4e'
		});
		var label = Ti.UI.createLabel({
			text:'New Game',
			color:'#fff',
			font:{fontSize:'18sp'},
			width:'auto',
			height:'auto'
		});
		app.ui.newGame.add(label);
		app.ui.newGame.addEventListener('click', app.onNewGameClick);
		app.ui.mainWindow.add(app.ui.newGame);
	}
	
	function createInfoPanel() {
		app.ui.lblInfo = Ti.UI.createLabel({
			color:'#fa5f4e',
			font:{fontSize:'18sp'},
			text:'Welcome to Tic Tac Toe',
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
			top:app.ios < 7 ? '8dp' : '28dp',
			left:'20dp',
			width:'auto',
			height:'auto'
		});
		app.ui.mainWindow.add(app.ui.lblInfo);
	}
	
	function createLocalPlayerInfo() {
		var label = Ti.UI.createLabel({
			color:'#aaa',
			font:{fontSize:'18sp'},
			text:'You:',
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
			top:app.ios < 7 ? '420dp' : '440dp',
			left:'20dp',
			width:'auto',
			height:'auto'
		});
		app.ui.lblSymbolYou = Ti.UI.createLabel({
			color:'#cccccc',
			font:{fontSize:'18sp'},
			text:'-',
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
			top:app.ios < 7 ? '420dp' : '440dp',
			left:'70dp',
			width:'auto',
			height:'auto'
		});
		app.ui.mainWindow.add(label);
		app.ui.mainWindow.add(app.ui.lblSymbolYou);
	}
	
	function createRemotePlayerInfo() {
		var label = Ti.UI.createLabel({
			color:'#aaa',
			font:{fontSize:'18sp'},
			text:'Remote:',
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
			top:app.ios < 7 ? '420dp' : '440dp',
			right:'45dp',
			width:'auto',
			height:'auto'
		});
		app.ui.lblSymbolRemote = Ti.UI.createLabel({
			color:'#cccccc',
			font:{fontSize:'18sp'},
			text:'-',
			textAlign:Ti.UI.TEXT_ALIGNMENT_LEFT,
			top:app.ios < 7 ? '420dp' : '440dp',
			right:'20dp',
			width:'auto',
			height:'auto'
		});
		app.ui.mainWindow.add(label);
		app.ui.mainWindow.add(app.ui.lblSymbolRemote);
	}
	
	app.ui.setInfo = function(info) {
		app.ui.lblInfo.text = info;
	};
	
	app.ui.setLocalPlayerSymbol = function(symbol) {
		app.ui.lblSymbolYou.text = symbol;
	};
	
	app.ui.setRemotePlayerSymbol = function(symbol) {
		app.ui.lblSymbolRemote.text = symbol;
	};
	
	app.ui.clearFields = function() {
		for(var i=0, length=this.fields.length; i<length; i++) {
			this.fields[i].backgroundImage = null;
			this.fields[i].symbol = null;
		}		
	};
	
	app.ui.setFieldSymbols = function() {
		for(var i=0, length=app.board.length; i<length; i++) {
			if(app.board[i] === app.playerId) {
				// Set the symbol for the local player
				app.ui.fields[i].backgroundImage = app.localSymbol == 'X' ? IMAGE_X : IMAGE_O;
			} else if(app.board[i] > 0) {
				// Set the symbol for the remote player
				app.ui.fields[i].backgroundImage = app.remoteSymbol == 'X' ? IMAGE_X : IMAGE_O;
			}
		}
	};
	
	app.ui.setBackgroundImage = function(source, image) {
		source.backgroundImage = image;
	};
	
	app.ui.flashField = function(field, color) {
		field.animate({
			backgroundColor:color,
			duration:50
		}, function() {
			field.animate({
				backgroundColor:'#222',
				duration:130
			});
		});
	};
	
	app.ui.flashLines = function(color) {
		this.board.animate({
			backgroundColor:color,
			duration:50
		}, function() {
			app.ui.board.animate({
				backgroundColor:'#888',
				duration:170,
				repeat:2
			});
		});
	};
	
	app.ui.flashNewGameButton = function() {
		this.newGame.animate({
			backgroundColor:'#b14337',
			duration:40
		}, function() {
			app.ui.newGame.animate({
				backgroundColor:'#fa5f4e',
				duration:110
			});
		});	
	};
	
	app.ui.inform = function(msg) {
		var alert = Titanium.UI.createAlertDialog({
		    title:'Information',
		    message:msg
		});
		alert.show();
	};
	
	app.ui.confirmNewGame = function() {
		var newGameDialog = Titanium.UI.createAlertDialog({
	    	title:'New game',
	    	message:'Do you want to start a new game?',
	    	cancel:1,
	    	buttonNames:['OK','Cancel']
		});
	 
		newGameDialog.addEventListener('click',function(e){
	    	if(e.index === 0) {
				if(app.gameId > 0 && app.player2 !== 0) {
					// Set the QUIT status in the database for the current GAME_ID.
					app.status = QUIT;
					app.syncState();
				}
	    		// The user has confirmed to start a new game - proceed and start a new game.
	    		app.initNewGame();
	    	}
		});
		
		newGameDialog.show();
	};

})(); 