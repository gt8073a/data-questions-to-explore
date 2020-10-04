
var dropDown = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {

		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);

		self.facts     = args.facts;
		self.action    = args.action || function() { /* noop */ };
		self._selected = args.selected;

		self.container = undefined;

		self.render();

		return self;

	}

        self._clear_html = function() {
                var found = d3.select('#' + self.elementId + ' form.explore');
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
		  .append( 'form' )
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

                var selector = self.container
				.append('select')
				.on('change', function(d) { self._selected = selector.node().value; self.action(d) })

                selector.selectAll('option')
			.data( self.facts )
			.enter()
			.append('option')
			.text(function(d) { return d.name } )
			.attr('selected', function(d) { return self._selected && d.name == self._selected ? 'selected' : null })
			.attr('value',    function(d) { return typeof d.value != 'undefined' ? d.value : d.name })

		self.chart = selector;
	}

	return self.init(args);
}
