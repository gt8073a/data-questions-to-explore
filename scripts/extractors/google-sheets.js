var thisURL, dataURL;
var Extractor = function(tabs) {

	var self = this;

	self._title_container    = undefined;
	self.get_title_container = function() { self._title_container = d3.select('span.docs-title-input-label-inner'); return self._title_container };

	self.title               = undefined;
	self.get_title           = function() { self.title = self._title_container.text(); return self.title; };

	self.data                = [];
	self.get_data            = function() {

		$.ajax({
			type:     'GET',
			url:      dataURL,
			async:    false
		})
		.done(function(data) {
			/* expect data to look like [{ headers: [ 'a', 'b' , ..], rows: [{},{},..] }, ... ] */
			/* var thisData = d3.csv.parse(data); */
			var thisData = d3.tsv.parse(data);

			var headers = [];
			for ( var i in thisData[0] ) {
				headers.push(i);
			}

			var theseNewRows = [];
			for ( var i = 0; i < thisData.length; i++ ) {
				var thisRow  = thisData[i],
				    is_empty = true;
				for ( var j = 0; j < headers.length; j++ ) {
					var key = headers[j],
					    val = thisRow[key];
					if ( val != '' && val != '#N/A' ) { is_empty = false; }
				}
				if ( ! is_empty ) { theseNewRows.push( thisRow ); }
			}

			var options = self._set_column_options( headers, theseNewRows );
			self.data = [ { headers: headers, column_options: options, rows: theseNewRows } ]
			self._clean_all_tables(); /* $123 or 16%, make them numbers */
			
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			alert('Failed to load data: ' + textStatus);
		})

		return self.data;
	}


	self.extract = function() {

		self.get_title_container();
		self.get_title();
		self.get_data();
		return self.data;
	}

	self._set_column_options = function(headers,rows) {
		var column_options = [];

		var naStr       = '#N/A',
		    numberRegex = /^-?\$?[\d,]+(\.\d*)?\%?$/, /* good enough */
		    dateRegex   = /^\d+(-|\/)\d+(-|\/)\d+/;
		headers.forEach(function(h) {
			var thisType;
			for ( var i = 0; i < rows.length; i++ ) {
				if ( rows[i][h] > '' ) {
					if ( rows[i][h] == naStr ) {
						/* skip to next one */
						continue;
					} else if ( rows[i][h].match(numberRegex) ) {
						thisType = 'number';
					} else if ( rows[i][h].match(dateRegex) ) {
						thisType = 'date';
					} else {
						thisType = 'text';
					}
					break;
				}
			}
			column_options.push({type: thisType || 'text'});
		})

		return column_options;
	}

	self._clean_all_tables = function() {
		if ( ! self.data ) { return };

		/* expect data to look like [{ headers: [ 'a', 'b' , ..], rows: [{},{},..] }, ... ] */
		self.data.forEach(function(thisData) {
			var header  = thisData.headers,
			    options = thisData.column_options,
			    rows    = thisData.rows;
			self._clean_one_table( header, options, rows );
		})

	}

	self._clean_one_table = function( header, options, rows ) {

		for ( var h = 0; h < header.length; h++ ) {
			var thisColumnName = header[h];
			if ( options[h].type != 'number' ) { continue };

			rows.forEach(function(r) {
				if ( r[thisColumnName] > '' ) {
					var thisVal =  r[thisColumnName].replace(/[$,]/g, '' );
					r[thisColumnName] = thisVal;
				}
			})
		}

	}

	return self;

}

/* need for caller to pass the url, and this is how to do it */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	thisURL = message.URL;

	var matches = thisURL.match(/spreadsheets\/d\/([^/]+)\/edit/),
	    thisID  = matches[1];
	dataURL = thisURL.replace(/spreadsheets\//, 'spreadsheets/u/1/').replace(/edit#?/, '/export?format=tsv&id='+thisID+'&')

	sendResponse(true);
});
