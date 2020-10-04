
var navFields = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {

		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);

		self.facts     = args.facts;
		self.action    = args.action || function() { /* noop */ };

		self.form = undefined;

		self.render();

		return self;

	}

	self._addChartElement = function() {
		self.clear();
		self.form = self.element
		  .append( 'form' )
		    .attr( 'class', 'explore' )
	}
	
	self.clear = function() {
		var found = d3.select('#' + self.elementId + ' form.explore');
		if ( found && found[0][0] ) {
			found.remove();
			self.form = undefined;
		}
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

		var appender = self.form.selectAll('div')
			.data( self.facts )
			.enter()
			.append('div')
			  .attr('class', '_extension_radio_div')

		appender
			.append('input')
			  .attr('class', '_extension_nav_radio')
			  .attr('type', 'radio')
			  .attr('name', '_extension_column')
			  .attr('id', function(d) { return '_extension_nav ' + d.name })
			  .attr('value', function(d) { return d.name })
			  .attr('disabled', function(d) { return d.type == 'number' ? null : true })
			  .on('click', self.action );

		appender
			.append('label')
			  .attr('for', function(d) { return '_extension_nav ' + d.name })
			  .attr('class', function(d) { return '_extension_nav_label ' + (d.type == 'number' ? 'numeric' : 'disabled') })
			  .text(function(d) { return d.name + ' (' + d.type + ') : ' + d.cardinality });

		self.chart = appender;
	}

	return self.init(args);
}
