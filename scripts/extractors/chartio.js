var Extractor = function() {

	var self = this;

	self._title_container    = undefined;
	self.get_title_container = function() { self._title_container = d3.select('div.dashboard .dashboard-title h1 span'); return self._title_container };

	self.title               = undefined;
	self.get_title           = function() { self.title = self._title_container.text(); return self.title; };
	

	/* todo: this only works on a dashboard, not on explore tab */
	self._data_container         = undefined;
	self.get_all_data_container  = function() { self._data_container = d3.selectAll('desc.metadata'); return self._data_container; }; 

	self.data                = [];
	self.get_data            = function() {

						/* filters looks like <desc class="metadata">{"values": [1,2,3]}</desc> */
						/* grab the first guy that passes the muster */
						var thisMetaData = self.get_all_data_container()[0];
						for ( var all = 0; all < thisMetaData.length; all++ ) {
							try {
								var thisHTML = thisMetaData[all].innerHTML,
								    thisData = JSON.parse(thisHTML);

								var thisHead = thisData.headers || [],
								    headSize = thisHead.length,
								    thisRows = thisData.rows || [],
								    rowsSize = thisRows.length;

								if ( ! rowsSize ) continue;

								/* destructively replace [[],[],..] with [{}, {}, .. ] */
								/* maybe this should be a transformer? */
								var theseNewRows = [];
								for ( var i = 0; i < rowsSize; i++ ) {
									var thisRow  = thisRows[i],
									    newRow   = {},
									    is_empty = true;
									for ( var j = 0; j < headSize; j++ ) {
										var key = thisHead[j],
										    val = thisRow[j];
										if ( val != '' ) { is_empty = false; }
										newRow[key] = val;
									}
									if ( ! is_empty ) { theseNewRows.push( newRow ); }
								}
								thisData.rows = theseNewRows;
								self.data.push(thisData);

							} catch(e) {
								alert(e);
							}
							// if ( self.data ) break;
						}
						return self.data;
					};

	self.extract = function() {

		self.get_title_container();
		self.get_title;

		// self.get_data_container();
		self.get_data();
		return self.data;

	}

	return self;

}


/*
  Notes:

  having problems with dates showing up as strings in postgres? try date_tunc('second',field) as field

 */
