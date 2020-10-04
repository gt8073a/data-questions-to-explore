
var cFn    = {
		'=':  function(a,b) { return a == b },
		'!=': function(a,b) { return a != b },
		'>':  function(a,b) { return a >  b },
		'>=': function(a,b) { return a >= b },
		'<':  function(a,b) { return a <  b },
		'<=': function(a,b) { return a <= b }
	};
var comps = [];
for ( var i in cFn ) { comps.push(i) };

var filters = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {

		self.elementId = args.elementId;
		self.element   = d3.select('#'+self.elementId);

		self.facts       = args.facts;
		self._dimensions = {}; /* default groups is fine */
		self.resetFilters();

		self.occurrence = undefined;
		self.container = undefined;

		self.column_definitions = self._parse_definitions( args.column_definitions );

 		self.render();

		return self;

	}

	self._parse_definitions = function(defs) {
		defs = defs || [];
		var defLookUp = {};
		defs.forEach( function(d) { defLookUp[d.name] = d });
		return defLookUp;
	}

	self.setTimeseries = function(chart) {
		self.occurrence = chart;
	}

	self._addChartElement = function() {
		self.clear();
		self.chart = self.container = self.element
		  .append( 'div' )
		    .attr( 'class', 'explore' )
	}
	
	self.clear = function() {
		var found = d3.select('#' + self.elementId + ' form.explore');
		if ( found && found[0][0] ) {
			found.remove();
			self.chart = self.container = undefined;
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

	self._addDimension = function(key) {
		if ( self._dimensions[key] ) self._removeDimension(key);
		self._dimensions[key] = self.facts.dimension(function(d) { return d[key] });
	}

	self._removeDimension = function(key) {
		if ( ! self._dimensions[key] ) return;

		self._dimensions[key].filterAll();
		self._dimensions[key].dispose();
		delete self._dimensions[key];
	}

	self._filterFields = [ 'key', 'comp', 'value' ];
	self._isValidFilter = function(f) {
		f = f || {};
		var valid   = true,
		    missing = [];
		self._filterFields.forEach(function(k) {
			if ( typeof f[k] == 'undefined' ) { valid = false; missing.push(k) }
		})
		var msg = missing.length ? 'missing ' + missing.join(', ') : undefined;
		return { valid: valid, msg: msg };
	}

	self.addFilter = function(f) {

		f = f || {};
		var check = self._isValidFilter(f);
		if ( check.valid && self.findFilterIndex(f) != -1 ) {
			check.valid = false;
			check.msg   = 'already exists';
		}

		if ( check.valid ) {
			self.halt();
			if ( ! self.filters[f.key] ) self.filters[f.key] = [];
			self.filters[f.key].push(f);
			self._addDimension(f.key);

			self.build();
			self.occurrence.reset();

			self._buildChart();
		} else {
			console.log('not a valid filter', f, check );
		}

		return check;

	}

	self.removeFilter = function(f) {

		f = f || {};
		var check = self._isValidFilter(f);
		if ( check.valid ) {
			var index = self.findFilterIndex(f);
			if ( index == -1 ) {
				check.valid = false;
				check.msg   = 'does not exists';
			} else {

				self.halt();
				self._removeDimension(f.key);
				self.filters[f.key].splice(index,1)

				self.build();
				self._buildChart();

				self.occurrence.reset();
				self.occurrence.uncheckFilter(f.key); /* dang it, this really oughta be pub/sub */

			}
		}

		if ( ! check.valid ) console.log( 'remove failed', check );
		return check;
	}

	/* this just blows everything away */
	self.resetFilters = function() {

		self.halt();

		self.filters = self.filters || {};
		for ( var key in self.filters ) {
			self._removeDimension(key);
			self.filters[key] = [];
		}

		/* nice to have here, but really should be job of caller */
		if ( self.occurrence ) {
			self.occurrence.reset();
		}
	}

	self.halt = function() {
		for ( var key in self.filters ) {
			if ( self._dimensions[key] ) self._dimensions[key].filterAll();
		}
	}

	self.begin = function() { console.log('begin called. should be build.' ); self.build() };

	self.build = function() {
		for ( var key in self.filters ) {
			if ( self.filters[key].length == 0 ) continue;
			var thisVal = self.filters[key][0].value;
			if ( typeof thisVal == 'undefined' ) continue;

			/* passing messages kills types */
			if ( self.column_definitions[key] && self.column_definitions[key].type == 'date' ) {
				thisVal = new Date(thisVal);
			} else if ( self.column_definitions[key] && self.column_definitions[key].type == 'number' ) {
				thisVal = parseFloat(thisVal);
			}

			if ( ! cFn[self.filters[key][0].comp] ) continue;
			self._dimensions[key].filterFunction( function(d) { return cFn[self.filters[key][0].comp](d,self.filters[key][0].value) } );
		}
	}

	self.findFilterIndex = function(f) {

		f = f || {};
		var check = self._isValidFilter(f);
		if ( ! check.valid ) return -1; /* probably safe to not return the msg */

		if ( ! self.filters[f.key] ) self.filters[f.key] = [];
		for ( var i = 0; i < self.filters[f.key].length; i++ ) {
			var thisFilter = self.filters[f.key][i],
			    found      = true;
			for ( var j = 0; j > self._filterFields.length; j++ ) {
				var thisField = self._filterFields[j];
				if ( f[thisField] != thisFilter[thisField] ) {
					found = false;
					break;
				}
			}
			if ( found == true ) { return i }
		}

		return -1;
	}

	self._buildChart = function() {

		self.chart.selectAll('*').remove();

		var fields = ['key','comp','value'],
		    keys   = [];
		for ( var key in self.filters ) {
			if ( self.filters[key].length == 0 ) continue;
			keys.push(key);
		}

		keys.forEach(function(key) {

			var f = self.filters[key][0];
			var theseInputs = {};

			var form = self.chart
				.append('span')
				  .attr('class', 'remove-filter')
				.append('form');

			var changedFn = function(key) {
				if ( this.value == f[key] ) {
					cancellor.classed( 'hidden', false );
					editor.classed(    'hidden', true  );
				} else {
					cancellor.classed( 'hidden', true  );
					editor.classed(    'hidden', false );
				}
			};
			var revertedFn = function() {
				theseInputs.key.property('value', f.key);
				theseInputs.comp.property('value', f.comp);
				theseInputs.value.property('value', f.value);

				cancellor.classed('hidden',false);
				editor.classed('hidden',true);
			}

			theseInputs.key = form.append('input')
				  .attr('type', 'text')
				  .attr('size', 10)
				  .property('value', f.key)
				  .on('change', function() { changedFn.call(this,'key') })
				  .on('keyup',  function() { changedFn.call(this,'key') })

			theseInputs.comp = form.append('select')
				.on('change', function() { changedFn.call(this,'comp') })

			theseInputs.comp.selectAll('option')
				.data( comps )
				.enter()
				.append('option')
				.attr('value', function(d) { return d } )
				.text(function(d) { return d } )
				.attr('selected', function(d) { return d == f.comp ? 'selected' : null })


			theseInputs.value = form.append('input')
				.attr('type', 'text')
				.attr('size', 12)
				.property('value', f.value)
				.on('change', function() { changedFn.call(this,'value') })
				.on('keyup',  function() { changedFn.call(this,'value') })

			var cancellor = form.append('a')
				.classed('cancellor', true)
				.attr('href', 'javascript:void(0);')
				.attr('title', 'remove filter')
				.text('⊗')
				.on('click', function() { self.removeFilter(f) } )

			var editor = form.append('span')
				.classed('editor', true)
				.classed('hidden', true)

			editor.append('a')
				.classed('reset', true)
				.attr('href', 'javascript:void(0);')
				.attr('title', 'reset input')
				.text('↻')
				.on('click', revertedFn )

			editor.append('a')
				.classed('submit', true)
				.attr('href', 'javascript:void(0);')
				.attr('title', 'submit changes')
				.text('✓')
				.on('click', function() {
					/* do before removing filter */
					var newF = {
							key:   theseInputs.key[0][0].value,
							comp:  theseInputs.comp[0][0].value,
							value: theseInputs.value[0][0].value
						};
					self.removeFilter(f);
					self.addFilter( newF );
				})

		});

	}

	self.doFilter = function(filter) {
		if ( filter.add ) { self.addFilter(filter) }
		else { self.removeFilter(filter) }
	}

	return self.init(args);
}
