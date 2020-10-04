
var occurrenceChart = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {

		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);

		self._addChartToElement();
		self.chart     = dc.compositeChart( '#'+self.elementId+' .dc-chart', 'occurrence' );

		self.key       = args.key      || 'price';
		self.comp_key  = args.comp_key || self.key;
		self.group_key = args.group;

		self.column_definitions = self._parse_definitions( args.column_definitions );

		self.height = args.height || 300;
		self.width  = args.width  || 400;

		self.colorLookUp = self._buildColorDomain();

		self.facts     = args.facts;
		self.dimension = self.facts.dimension(function(d) { return [ d[self.comp_key], d[self.key], d[self.group_key], d ] }); /* ha! [3] is for tooltips */
		self.group     = self.dimension.group();

		self.xDomain   = self._calculate_domain(self.comp_key);
		self.yDomain   = self._calculate_domain(self.key);

		self.yPadding  = self._calculate_padding(self.key);
		self.xPadding  = self._calculate_padding(self.comp_key);

		self.filters = args.filters || {};

		self._showing_tooltip = false;
		self._clear_tips(0);

		self.tipClick = args.tipClick || function() { /* noop */ };

		/* don't update full, that data will never change, in theory... */
		try {
			self.fullRegression   = self._createRegression( 'jj full');
			self.filterRegression = self._createRegression( 'jj filter');
		} catch(e) {
			alert('can not create a regression: ' + e);
		}

		return self;

	}

	self._parse_definitions = function(defs) {
		defs = defs || [];
		var defLookUp = {};
		defs.forEach( function(d) { defLookUp[d.name] = d });
		return defLookUp;
	}

	/* move these up to loader.js? pass in stats? */
	self._calculate_midpoint  = function(key) {

		var midpoint;
		var thisDimensions = self.facts.dimension(function(d) { if ( d[key] != undefined ) return d[key] }),
		    thisGroup      = thisDimensions.group();

		var thisType = self.column_definitions[key] ? self.column_definitions[key].type : 'text';
		if ( thisType == 'date' ) {

			var dateArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a.getTime() - b.getTime() });
			midpoint  = new Date( ( dateArray[dateArray.length - 1].getTime() + dateArray[0].getTime() ) / 2 );

		} else if ( thisType == 'number' ) {

			var valArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a - b } );
			midpoint = ( valArray[valArray.length - 1] + valArray[0] ) / 2;

		} else if ( thisType == 'text' ) {
			var valArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort(),
			    index    = Math.floor( valArray.length / 2 );
			midpoint = valArray[index];
		} else {
			console.log( 'can not determine type for domain of key ' + key );
		}

		thisDimensions.dispose(); /* manual clean up */

		return midpoint;
	}

	self._calculate_domain = function(key) {

		var thisDomain;

		var thisDimensions = self.facts.dimension(function(d) { if ( d[key] != undefined ) return d[key] }),
		    thisGroup      = thisDimensions.group();

		var thisType = self.column_definitions[key] ? self.column_definitions[key].type : 'text';
		if ( thisType == 'date' ) {

			var dateArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a.getTime() - b.getTime() }),
			    dateMin   = new Date(dateArray[0]),
			    dateMax   = new Date(dateArray[dateArray.length - 1]);

			dateMin.setDate(dateMin.getDate() - 2);
			dateMax.setDate(dateMax.getDate() + 2);

			thisDomain = d3.time.scale().domain([ dateMin, dateMax ]);

		} else if ( thisType == 'number' ) {

			var valArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a - b } ),
			    valMin   = valArray[0],
			    valMax   = valArray[valArray.length - 1];

			valMin = valMin - Math.ceil( Math.abs(valMax - valMin) * 0.03 );
			valMax = valMax + Math.ceil( Math.abs(valMax - valMin) * 0.03 );

			thisDomain =  d3.scale.linear().domain([ valMin,valMax ]);

		} else if ( thisType == 'text' ) {
			var valArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort();
			thisDomain =  d3.scale.ordinal().domain( valArray );
		} else {
			console.log( 'can not determine type for domain of key ' + key );
		}

		thisDimensions.dispose(); /* manual clean up */

		return thisDomain;

	}

	self._calculate_padding = function(key) {
		var thisDimensions = self.facts.dimension(function(d) { if ( d[key] != undefined ) return d[key] }),
		    thisGroup      = thisDimensions.group(),
		    valArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a - b } ),
		    valMin   = valArray[0],
		    valMax   = valArray[valArray.length - 1],
		    valDiff  = Math.max( 1, Math.ceil( Math.abs(valMax - valMin) * 0.03 ) );

		thisDimensions.dispose(); /* manual clean up */
		return valDiff;
	}

	self._createRegression = function( respectFilters ) {

		var thisRegression;
		var thisType = self.column_definitions[self.comp_key] ? self.column_definitions[self.comp_key].type : 'text';
		if ( thisType == 'date' || thisType == 'number' ) {
			thisRegression = new _trendChart({

name: respectFilters || 'unknown regression',

				facts:              self.facts,
				column_definitions: self.column_definitions,
				xKey:               self.comp_key,
				yKey:               self.key
			});
		} else {
			/* this belongs in the trendchart */
			throw 'Categorical Data can not have a regression'
		}
		return thisRegression;
	}

	self._clear_html = function() {
		var found = d3.select('#' + self.elementId + ' .dc-chart');
		if ( found && found[0][0] ) found.remove();
	}

	self.clear = function() {
		if ( self.container ) self.container.remove();
		self.container = undefined;
		if ( self.dimension ) self.dimension.dispose();
		self._clear_html();
	}

	self._addChartToElement = function() {

		self._clear_html();
		self.container = self.element
		  .append( 'div' )
		    .attr( 'class', 'dc-chart' )

		/* d3 likes to add zoom handlers all the time, so we'll keep removing them */
		self.container.on('mouseup', function() {
				self.container
				    .on("mousedown.zoom", null)
				    .on("mousewheel.zoom", null)
				    .on("mousemove.zoom", null)
				    .on("DOMMouseScroll.zoom", null)
				    .on("touchstart.zoom", null)
				    .on("touchmove.zoom", null)
				    .on("touchend.zoom", null);
				} );

	}

	self.reset = function() {
		self.chart.filterAll();
		if ( self.filterRegression ) self.filterRegression.render();
		self.chart.render();
	}

	self.show = function() {
		self.element.classed('hidden', false);
	}

	self.hide = function() {
		self.element.classed('hidden', true);
	}

	self.render = function() {
		self._buildChart();
		self.show();
		self.reset();
	}

	self.uncheckFilter = function(key) {
		d3.select('input[type=checkbox].filter-selector#' + key + ':checked').property('checked',false)
	}

	/* for some reason these tips hang around */
	self._clear_tips = function(min) {
		min = min || 0;
		var foundTips = d3.selectAll('.d3-tip');
		if ( foundTips && foundTips[0] && foundTips[0].length > min ) {
			for ( var t = 0; t < foundTips[0].length - min; t++ ) {
				foundTips[0][t].remove();
			}
		}
	}

	self.colorDomain = ['lower outlier', 'q1', 'q2', 'q3', 'q4', 'upper outlier'];
	self.colorRange  = [ '#cccccc', '#9ecae1', '#6baed6', '#3182bd', '#08519c', '#cccccc' ];
	self._buildColorDomain = function() {
		var colorLookUp = {};
		for ( var i = 0; i < self.colorDomain.length; i++ ) {
			var thisD = self.colorDomain[i],
			    thisR = self.colorRange[i];
			colorLookUp[thisD] = thisR;
		}
		return colorLookUp;
	}

	self._buildTip = function() {

		/* build tip - this should be moved to own mod, but it's messy due to placement. do later */
		var thisMidpoint = self._calculate_midpoint(self.comp_key);
		var liveFilters  = self.filters || {};

		self.tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset(function(d) {    return [0, d.key[0] >= thisMidpoint ? -10 : 10 ] })
			.direction(function(d) { return     d.key[0] >= thisMidpoint ? 'w' : 'e'; })
			.html(function(d) {

				var pieces    = [],
				    row       = d.key[3]                   || {},
				    thisQ     = d.key[2]                   || '',
				    thisColor = self.colorLookUp[d.key[2]] || 'white';

				pieces.push( '<form>' );

				var selected = liveFilters[self.comp_key] && liveFilters[self.comp_key].length ? 'checked' : '';
				pieces.push( '<div class="x-axis"><input type="checkbox" ' + selected + ' class="filter-selector" id="' + self.comp_key + '" key="' + self.comp_key + '" comp="=" value="' + row[self.comp_key] + '"> <label for="' + self.comp_key + '">(x-axis) ' + self.comp_key + ': ' + row[self.comp_key] + '</div>' );

				selected = liveFilters[self.key] && liveFilters[self.key].length ? 'checked' : '';
				pieces.push( '<div class="y-axis"><input type="checkbox" class="filter-selector" ' + selected + ' id="' + self.key + '" key="' + self.key + '" comp="=" value="' + row[self.key] + '"> <label for="' + self.key + '">(y-axis) ' + self.key      + ': ' + row[self.key]      + ' <span style="color:' + thisColor + '">(' + thisQ + ')</span></div>' );
				pieces.push( '<hr>' );

				for ( var key in row ) {
					if ( key == self.key ) continue;
					if ( key == self.comp_key ) continue;
					if ( key.match(/^_/) ) continue;
					selected = liveFilters[key] && liveFilters[key].length ? 'checked' : '';
					pieces.push( '<div class="other-values"><input type="checkbox" class="filter-selector" ' + selected + ' id="' + key + '" key="' + key + '" comp="=" value="' + row[key] + '"> <label for="' + key + '">' + key + ': ' + row[key] + '</label></div>' )
				}
				pieces.push( '</form>' );

				pieces.push( '<div class="close-tip"><a href="javascript:void(0);" id="close-link">close ⊗</a></div>' );

				var html = pieces.join("\n");
				return html;
			});
	}

	self.filtersUpdated = function() {
	}

	self._buildChart = function() {

		var compose = [];
		if ( self.fullRegression ) {
			compose.push(
				dc.lineChart(self.chart)
				  .colors('pink')
				  .group( self.fullRegression.group, 'Full Dataset Regression')
				  .dimension(self.dimension)
			)
		}

		if ( self.filterRegression ) {
			compose.push(
				dc.lineChart(self.chart)
				  .colors('red')
				  .group( self.filterRegression.group, 'Filtered Dataset Regression')
				  .dashStyle([2,2])
				  .dimension(self.dimension)
			)
		}

		compose.push(
			dc.scatterPlot(self.chart)
			  .group( self.group, 'Context' )
			  .dimension(self.dimension)
			  .keyAccessor(function(d) { return d.key[0] })
			  .valueAccessor(function(d) { return d.key[1]})
			  .colorAccessor(function(d) { return d.key[2] } )
			  .colors(d3.scale.ordinal().domain(self.colorDomain).range(self.colorRange))
		);

		self.chart
		  .width(self.width)
		  .height(self.height)
		  .margins({top: 10, left: 60, right: 10, bottom: 30})
		  .y( self.yDomain )
		  .x( self.xDomain )
		  .yAxisPadding(self.yPadding)
		  .xAxisPadding(10)
		  .brushOn(false)
		  .transitionDuration(1000)
		  .compose( compose )

		var thisType = self.column_definitions[self.comp_key] ? self.column_definitions[self.comp_key].type : 'text';
		if ( thisType == 'text' ) {
			self.chart
			  .xUnits(dc.units.ordinal)
			  ._rangeBandPadding(1)
		 }

		self.chart
		  .xAxis()
		  .ticks( 4 );

		self.chart
		  .yAxis()
		  .ticks(4)
		  .tickFormat(d3.format('d'));

		self._buildTip();
		self.chart
		  .on('renderlet.occurrenceTooltip', function(c) {
			self._clear_tips(0); 
			c.selectAll('g.chart-body path.symbol').call(self.tip)
			  .on('mouseover', function(d) { if ( ! self._showing_tooltip ) self.tip.show(d) } )
			  .on('mouseout',  function(d) { if ( ! self._showing_tooltip ) self.tip.hide(d) } )
			  .on('click',     function(d) {

							/* close tip by clicking same point */
							if ( self._showing_tooltip && self._showing_tooltip == d ) {
								self._showing_tooltip = false;
								return;
							}

							/* or show it */
							self._showing_tooltip = d;
							self.tip.hide(d);
							self.tip.show(d); /* btw, you have to show it before you can select() it, trust me */

							/* close the tool tip */
							var top    = d3.select('.d3-tip'),
							    closer = top.select('div.close-tip'),
							    link   = closer.select('a#close-link');

							link.on('click', function() {
								self._showing_tooltip = false;
								self.tip.hide(d);
							})

							var checkbox = top.selectAll('input[type=checkbox].filter-selector');
							checkbox.on('click', function() {
								var filter = { key: this.id, comp: '=', value: this.value, add: this.checked };
								self.tipClick(filter);
							})


							
						} )
			
		  })
	}

	return self.init(args);
}
