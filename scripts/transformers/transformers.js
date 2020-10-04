
/* all transformation as truly transformative. they destroy. */
var Transformor = function( args ) {

	var self = this;
	args = args || {};

	/* expect data to look like [{ headers: [ 'a', 'b' , ..], rows: [{},{},..] }, ... ] */
	if ( ! args.data ) throw 'No Data';
	self.data = args.data;

	/* don't lose the ogs */
	self.store_headers = function() {

		/* todo: check timestamps / intervals.. */
		var actions = {
			'text':   function(t) { return t },
			'date':   function(d) { return new Date(d) },
			'number': function(n) { return parseFloat(n) }
		}

		self.data.forEach(function(d) {
			d.original_headers = [];
			for ( var i = 0; i < d.headers.length; i++ ) {
				var thisCol  = d.headers[i],
				    thisType = d.column_options[i].type,
				    thisHead = { name: thisCol, type: thisType, fn: actions[thisType] };

				d.original_headers[i] = thisHead;
			}
		})

	}

	self.get_stats = function() {

		self.data.forEach(function(d) {

			/* keep some stats for each column */
			d.stats = {};
			[ 'cardinality', 'min', 'max', 'mean', 'median'].forEach(function(stat) {
				d.stats[stat] = {};
			});
			d.stats.records = d.rows.length;

			for ( var col = 0; col < d.original_headers.length; col++ ) {

				var thisHead = d.original_headers[col],
				    thisType = thisHead.type,
				    thisCol  = thisHead.name,
				    thisFn   = thisHead.fn;

				var summary = self.getColumnSummary( thisCol, d.rows, thisFn ),
				    rows    = summary[0];

				d.stats.cardinality[thisCol] = summary[1];
				d.stats.min[thisCol]         = summary[2];
				d.stats.max[thisCol]         = summary[3];

				/* add percents / quartiles to rows themselves */
				var quartiles = self.calcQuartiles(rows);

				var newCol = '_' + thisCol + '_quartile';
				d.headers.push(newCol);
				self.pushQuartileOnToRows( quartiles, thisCol, newCol, d.rows );
				d.stats.median[thisCol] = quartiles[2];

			}

		});
	}

	self.getColumnSummary = function( pos, rows, fn ) {

		var seen   = {},
		    values = [];
		rows.forEach(function(row) {

			var thisVal = row[pos];
			if ( ! seen[thisVal] ) { seen[thisVal] = 0; }
			seen[thisVal]++;	/* cardinality */

			row[pos] = fn(row[pos]); /* transform */
			values.push( row[pos] ); /* ranks, percentiles, etc */

		})

		if ( typeof values[0] == 'string' ) {
			values.sort();
		} else if ( typeof values[0] == 'object' && typeof values[0].getTime === 'function' ) {
			values.sort(function(a,b) { return a.getTime() - b.getTime() });
		} else {
			values.sort(function(a,b) { return a-b });
		}

		var cardinality = 0;
		for ( var i in seen ) { cardinality++ };

		var min = values[0],
		    max = values[ values.length - 1 ];

		return [ values, cardinality, min, max ];
	}

	self.calcQuartiles = function( sorted ) {
		var breaks = self._calcTiles( sorted, 4 );
		var min = breaks[0],
		    max = breaks[ breaks.length - 1 ],
		    iqr = max - min,
		    xb  = max + iqr * 1.5,
		    nb  = min - iqr * 1.5;

		breaks.unshift(nb);
		breaks.push(xb);
		return breaks;
	}

	self.calcPercentiles = function( sorted ) {
		return self._calcTiles( sorted, 100 );
	}

	/* see http://stackoverflow.com/questions/20811131/javascript-remove-outlier-from-an-array */
	/* assumes sorted */
	self._calcTiles = function( sorted, cnt ) {

		var breaks = [];
		for ( var i = 1; i < cnt; i++ ) {
			var thisVal = sorted[Math.round( i * sorted.length / cnt )];
			breaks.push( thisVal );
		}
		return breaks;
	}

	self.pushQuartileOnToRows = function( quartiles, srcCol, newCol, rows ) {
		rows.forEach(function(r) {
			var thisQ = '???';
			     if ( r[srcCol] <  quartiles[0] ) { thisQ = 'lower outlier' }
			else if ( r[srcCol] <  quartiles[1] ) { thisQ = 'q1' }
			else if ( r[srcCol] <  quartiles[2] ) { thisQ = 'q2' }
			else if ( r[srcCol] <  quartiles[3] ) { thisQ = 'q3' }
			else if ( r[srcCol] <= quartiles[4] ) { thisQ = 'q4' }
			else                                  { thisQ = 'upper outlier' }

			r[newCol] = thisQ;

		})

	}

	self.transform = function() {
		// alert('transform start');
	}

	self.init = function() {

		self.store_headers();
		self.get_stats();

	}
	
	self.init();
	return self;
}
