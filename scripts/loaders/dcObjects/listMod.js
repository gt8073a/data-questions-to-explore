
var listMod = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {

		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);

		self.facts     = args.facts;

		self.container = undefined;

		self.render();

		return self;

	}

        self._clear_html = function() {
                var found = d3.select('#' + self.elementId + ' div.explore');
                if ( found && found[0][0] ) found.remove();
        }

        self.clear = function() {
                if ( self.container ) self.container.remove();
		self.container = undefined;
                self._clear_html();
        }

	self._addChartElement = function() {
		self._clear_html();
		self.container = self.element
		  .append( 'div' )
		    .attr( 'class', 'explore' )
	}
	
	self.show = function() {
		self.element.classed('hidden',false);
	}

	self.hide = function() {
		self.element.classed('hidden',true);
	}

	self.render = function() {
		self.show();
		self._addChartElement();
		self._buildChart();
	}

	self._buildChart = function() {

		self.chart = self.container.append('ul')

		self.chart.selectAll('li')
			.data(self.facts)
			.enter()
			  .append('li')
			  .text(function(d) { return d; } )

	}

	return self.init(args);
}
