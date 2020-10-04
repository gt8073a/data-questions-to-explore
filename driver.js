chrome.browserAction.onClicked.addListener(function(tab) {

	chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {

		/* third party vendor scripts */
		var vendors = [
				'jquery-3.0.0.min.js',
				'd3.min.js', 
				'd3-tip.js',
				'crossfilter.min.js',
				'dc.min.js',
				'jquery.popdown.modified.js'
			];
		vendors.forEach(function(v) {
			chrome.tabs.executeScript(tab.id, {file: 'scripts/vendor/' + v});
		});

		/* extract data */
		var _extractorFile = 'default.js',
		    _loaderFile    = 'default.js';
		if ( tab.url.match(/^https\:\/\/docs\.google\.com\/spreadsheets\//)) {
			_extractorFile = _loaderFile = 'google-sheets.js';
		} else if ( tab.url.match(/^https\:\/\/chartio\.com\//) ) {
			_extractorFile = 'chartio.js'
		}
		var relExtractorFile = 'scripts/extractors/' + _extractorFile,
		    relLoaderFile    = 'scripts/loaders/' + _loaderFile;


		chrome.tabs.executeScript( tab.id, {file: relExtractorFile}, function(){
			chrome.tabs.sendMessage(tab.id, { URL: tab.url }, function() {

				/* tranformer, more than meets the eye */
				chrome.tabs.executeScript( tab.id, {file: 'scripts/transformers/transformers.js'});

				/* loaders */
				chrome.tabs.executeScript( tab.id, {file: 'scripts/loaders/loaders.js'});
				chrome.tabs.executeScript( tab.id, {file: relLoaderFile});

				var dcObjects = [
						'navMod.js',
						'dropMod.js',
						'dataTableMod.js',
						'boxMod.js',
						'countMod.js',
						'occurrenceMod.js',
						'filterMod.js',
						'listMod.js',
						'trendMod.js'
					];
				dcObjects.forEach(function(o) {
					chrome.tabs.executeScript( tab.id, {file: 'scripts/loaders/dcObjects/' + o});
				});

				/* everything is loaded, let's app it up */
				chrome.tabs.executeScript( tab.id, {file: 'scripts/app.js'});

			})
		});

		return true;
	});

});

