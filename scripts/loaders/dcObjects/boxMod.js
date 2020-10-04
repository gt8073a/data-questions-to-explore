
var boxChart = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {


		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);

		self._addChartToElement();
		self.chart = dc.boxPlot( '#'+self.elementId+' .dc-chart', 'boxplot' );

		self.height = args.height || 300;
		self.width  = args.width  || 300;

		self.key       = args.key || 'value'
		self.facts     = args.facts;
		self.dimension = self.facts.dimension(function(d) { return self.key });
		self.group     = self.dimension.group().reduce(
					function( p, d ) {
						p.push( d[self.key] );
						return p;
					},
					function( p, d ) {
						p.splice( p.indexOf( d[self.key] ), 1);
						return p;
					},
					function() {
						return [];
					}
				);

		self.domain  = self._calculate_domain(self.key);
		self.padding = self._calculate_padding(self.key);

		return self;

	}


        self._calculate_domain = function(key) {

                var thisDimensions = self.facts.dimension(function(d) { if ( d[key] != undefined ) return d[key] }),
                    thisGroup      = thisDimensions.group(),
		    valArray       = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a - b } ),
		    valMin         = valArray[0],
		    valMax         = valArray[valArray.length - 1];

		valMin = Math.min( 0, valMin - Math.ceil( Math.abs(valMax - valMin) * 0.03 ) );
		valMax = valMax + Math.ceil( Math.abs(valMax - valMin) * 0.03 );

		thisDimensions.dispose();  /* manual clean up */

		return d3.scale.linear().domain([ valMin,valMax ]);

	}

	self._calculate_padding = function(key) {
		var thisDimensions = self.facts.dimension(function(d) { if ( d[key] != undefined ) return d[key] }),
		    thisGroup      = thisDimensions.group(),
		    valArray = thisGroup.all().filter(function(d) { return d.key != undefined}).map(function(d) {return d.key }).sort( function(a,b) { return a - b } ),
		    valMin   = valArray[0],
		    valMax   = valArray[valArray.length - 1],
		    valDiff  = Math.max( 1, Math.ceil( Math.abs(valMax - valMin) * 0.03 ) );

		thisDimensions.dispose();  /* manual clean up */

		return valDiff;
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
	}

	self.show = function() {
		self.element.classed('hidden',false);
	}

	self.hide = function() {
		self.element.classed('hidden',true);
	}

	self.render = function() {
		self._buildChart();
		self.show();
		try {self.chart.render() } catch(e) { alert('Can not render() chart: ' + e) }
	}

	self._buildChart = function() {

		self.chart
		  .width(self.width)
		  .height(self.height)
		  .margins({top: 10, right: 50, bottom: 30, left: 50})
		  .brushOn(false)
		  .dimension(self.dimension)
		  .group(self.group)
		  .elasticX(true)
		  .elasticY(true)
		  .yAxisPadding(self.padding)

		self.chart
		  .yAxis()
		  .ticks(4)
		  .tickFormat(d3.format('d'));

	}

	return self.init(args);
}
