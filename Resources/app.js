
var app = {};	
Ti.include('const.js', 'ui.js', 'core.js', 'network.js');

app.applicationWindow = app.ui.createApplicationWindow();
app.applicationWindow.open();

// Require Internet connection
if(Ti.Network.networkType === Ti.Network.NETWORK_NONE) {
	app.ui.inform('Internet connection is required');
} else {
	app.init();	
} 



