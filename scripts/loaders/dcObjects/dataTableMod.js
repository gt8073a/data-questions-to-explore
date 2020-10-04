var dataTable = function(args) {

        args = args || {};

        var self = this;

        self.init = function(args) {

		var self = this;

		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);


		self._addChartToElement();
		self.chartElementId = '#'+self.elementId+' .dc-chart';
		self.chart = dc.dataTable( self.chartElementId, 'outliers' );

		self.key     = args.key     || 'id';
		self.sortKey = args.sortKey || self.key;

		self.facts     = args.facts;

		self.dimension = self.facts.dimension(function(d) { return d[self.key] });
		self.group     = self.dimension.group();

		self.columns = args.columns || [ 'id' ];

		return self;

        }

        self._clear_html = function() {
                var found = d3.select('#' + self.elementId + ' .dc-chart');
                if ( found && found[0][0] ) found.remove();
        }

	self.clear = function() {
		if ( self.container ) self.container.remove();
		if ( self.dimension ) self.dimension.dispose();
		self._clear_html();
	}

        self._addChartToElement = function() {
		self._clear_html();
                self.container = self.element
                  .append( 'table' )
                    .attr( 'class', 'dc-chart' )
		    .attr( 'id',    'datatable')
        }

	self.reset = function() {
		self.chart.filterAll();
	}

	self.show = function() {
		self.element.classed('hidden', false);
	}

	self.hide = function() {
		self.element.classed('hidden', true);
	}

	self.render = function() {
		this._renderTable();
		this.show();
		this.chart.render();
	}

	self._renderTable = function() {

		var self = this;

		self.chart
		  .width('100%')
		  .dimension( self.dimension )
		  .group(function (d) { return '' })
		  .sortBy(function(d) { return d[self.sortKey] })
		  .order(d3.ascending)
		  .columns(self.columns)
		  .size( self.dimension.top(Number.POSITIVE_INFINITY).length )

	}

	return self.init(args);

}
