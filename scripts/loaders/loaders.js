
var _loaderParent = function() {}

/* each function should be proto'd individually, that's a todo */
_loaderParent.prototype.init = function( args ) {

	var self = this;
	args = args || {};

	if ( ! args.data ) throw 'No Data';
	self.data = args.data;
	
	self._data_index        = 0;
	self.selected_data      = undefined;
	self.select_table       = function(index) {
					self._data_index = index;
					self.selected_data = self.data[self._data_index];
				}

	/* this is the what holds the modal */
	self._top_container     = undefined;
	if ( ! self.get_top_container ) {
		self.get_top_container  = function() {
                                                        /* explore page, saved dashboard */
                                                        self._top_container = d3.select('#popdown-dialog');
                                                        if ( ! self._top_container ) throw 'Can not parse page, unable to find top <div>';
                                                        return self._top_container;
                                                }
	}

	self.charts                = {  };
	self._extension_ids        = { chart: '_extensionX' };
	self._extension_classes    = { chart: '_extension' };
	self._extension_containers = { chart: undefined  };
	self._extension_titles     = { };
	self._extension_asks       = { };

	/* this is the hidden-until-get-to-it */
        self.hide_chart_container = function() { self._extension_containers.chart.classed('hidden',true); }
        self.show_chart_container = function() { self._extension_containers.chart.classed('hidden',false); }

	/* MESS */
	/* order is important */
	var spaces= [
		{ name: 'header',     parent: 'chart' },  /* <--- make sure i am first! */

		{ name: 'goal',       parent: 'chart',   'placeholder': [ 'I want to compare orders and regions so that I can identify underperforming products.', 'I want to witness the effect day has on sales so that I can optimize my email blasts.', 'I want to identify common customer behaviors so that I can show them in my demo.'], title: [ 'What outcome is this knowledge helping you achieve?', 'What are you trying to accomplish, and how does this data get you there?', 'What is your objective with this info?' ] },

		{ name: 'body',       parent: 'chart', class: 'hidden' },
		{ name: 'nav',        parent: 'body',   title: 'Step 1. Pick a Measure:', ask: ['Only numeric fields can be selected', 'Date fields are good for seeing trends', 'High cardinality textx fields are hard to read', 'A cardinality of 1 is not really useful', 'Cardinality under 10 is good grouping'] },
		{ name: 'content',    parent: 'body' },
		{ name: 'boxplot',    parent: 'content', title: 'Step 2. Understand its Distribution:', ask: ["What's the median, and where did you think it should be?", 'Are top and bottom quartiles what you expected?', 'Are the outliers evenly distributed?', 'Are each quartile the same size?', 'Is the median close to a min or max value?'] },
		{ name: 'context',    parent: 'content', title: 'Step 3. Compare it to other fields for Context:',      ask: ['Do you see nodes, gaps or banding? Is it reasonable?', 'Are things improving over time?', 'Are certain groups "better" than others?'] },
		{ name: 'timeseries', parent: 'context' },
		{ name: 'dropdown',   parent: 'context' },
		{ name: 'filters',    parent: 'content', title: 'Step 4. Filter results for deeper Inspection:', ask: [ 'Do a majority of outliers exist for a specific field?', 'Are any groups solely contained within a specific quartile?'] },
		{ name: 'requestions', parent: 'content', title: 'Re-Questioned:' },
		{ name: 'outliers',   parent: 'body',   title: 'Outliers:',     ask: ['What is the cause of each outlier?', 'Does a specific tech issue explain multiple outliers?', 'Do business models account for these outliers?', 'Is the outlier incorrectly entered or measured data? You can drop those.'] },
		{ name: 'last-questions', parent: 'body', title: 'Re-Questioned Again:' },

		{ name: 'footer',     parent: 'chart' }   /* <--- make sure i am last! */
	];

	self._append_single_container    = function(args) {
		var thisCont = args.container
			  .append( 'div' )
			    .attr( 'class', args.class )
			    .attr( 'id', args.id );
		return thisCont;
	}
	self.create_framework  = function() {

		/* top level */
		var found = d3.select('#' + self._extension_ids.chart);
		if ( found && found[0][0] ) found.remove();

		self._extension_containers.chart = self._append_single_container({
							container: self.get_top_container(),
							class:     self._extension_classes.chart,
							id:        self._extension_ids.chart
						});

		if ( self.add_security_policy ) {
			 self.add_security_policy(self._extension_containers.chart);
		}

		/* each internal space */
		spaces.forEach(function(row) {
			var c = row.name,
			    p = row.parent;
			self._extension_ids[c]        = self._extension_ids.chart + '_' + c;
			self._extension_classes[c]    = '_' + c;

			if ( row.class ) self._extension_classes[c] = self._extension_classes[c] + ' ' + row.class;

			self._extension_containers[c] = self._append_single_container({
									container: self._extension_containers[p],
									class:     self._extension_classes[c],
									id:        self._extension_ids[c]
								});

			if ( row.title ) {

				var msg = row.title;
				if ( typeof msg == 'object' ) {
					var len = msg.length,
					    rnd = Math.floor(Math.random() * len);
					msg = msg[rnd];
				}

				self._extension_titles[c] = self._append_single_container({ 
									container: self._extension_containers[c],
									class:     '_extension_section_title'
								});
				self._extension_titles[c]
				  .append('span')
				  .html(msg);

				if ( c == 'goal' ) {
					var glasses = self._extension_titles[c].append('a');
					glasses.attr('href', 'http://www.unofficialgoogledatascience.com/2016/10/practical-advice-for-analysis-of-large.html')
					       .attr('title', 'why answer?')
					       .attr('class', 'show-data')
					       .attr('target', '_blank')
					       .html('&#128083;')
				}
			}

			if ( row.ask ) {

				var msg = row.ask;
				if ( typeof msg == 'object' ) {
					var len = msg.length,
					    rnd = Math.floor(Math.random() * len);
					msg = msg[rnd];
				}

				self._extension_asks[c] = self._append_single_container({ 
									container: self._extension_containers[c],
									class:     '_extension_section_ask'
								});
				self._extension_asks[c].html(msg);

			}

			if ( row.placeholder ) {

				var msg = row.placeholder;
				if ( typeof msg == 'object' ) {
					var len = msg.length,
					    rnd = Math.floor(Math.random() * len);
					msg = msg[rnd];
				}

				if ( ! self._extension_asks[c] ) {
					self._extension_asks[c] = self._append_single_container({ 
									container: self._extension_containers[c],
									class:     '_extension_section_ask'
								});
					self._extension_titles[c].classed('no-ask', true)
				}
				var form = self._extension_asks[c].append('form')

				var thisGoal = form.append('input')
					  .attr('type', 'text')
					  .attr('placeholder', 'eg. ' + msg )
					  .attr('size', '120')
					  .attr('id', 'the-goal')
					  .on('keydown', function() { if ( d3.event.which == 13 ) d3.event.preventDefault(); return false; })
					  .on('keyup', function() {
								var req   = self.charts.requestions.container.select('ul li:first-child'),
								    last  = self.charts['last-questions'].container.select('ul li:first-child'),
								    value = this.value || '-- no goal entered, what are you trying to do? --';
								req.text(value);
								last.text(value);
							})
				document.getElementById('the-goal').focus();
				document.getElementById('the-goal').select();

				/* use below in click with no goal */
				var thisBG = thisGoal.style('background'),
				    thisC  = thisGoal.style('color'),
				    thisB  = thisGoal.style('border-color');

				var thisLink = form.append('a');
				thisLink.attr('href', 'javascript:void(0);')
					.attr('title', 'show data')
					.attr('class', 'show-data')
					.html('&#9660; get to it')
					.on('click', function() {
						if ( thisGoal[0][0].value == '' ) {

							/* blink the empty goal */
							thisGoal.transition()
							  .duration(100)
							  .delay(100)
							    .style('background', 'lightgrey')
							    .style('color', 'white')
							    .style('border-color', 'darkgrey')
							  .each('end', function() {

								thisGoal.transition()
								  .duration(100)
								  .delay(100)
								    .style('background', thisBG)
								    .style('color', thisC)
								    .style('border-color', thisB)
							  })

						}
						self._extension_containers.body.classed('hidden', false);

						/* fade the link out */
						thisLink.transition()
							.delay(500)
							.duration(1000)
							.style('opacity', 0)
							.each('end', function() { thisLink.classed('hidden', true); thisLink.style('opacity',1) } )

					});

			}

		});

		self.populate_header();

	}

	self._populate_header_text  = function() {
		var hText = self._extension_containers.header.append('div');
		    hText.text('Data and Answers');

		hText.append('span')
			.attr('class', 'link')
			.text('⊗ close')
			.on('click', function(d) { d3.event.stopPropagation(); self.revert(); })
	}

	self._populate_header_index_selector = function() {

		var table_indexes = [];
		for ( var i = 0; i < self.data.length; i++ ) { table_indexes.push( { name: 'Table ' + (i + 1), value: i } ) };
		if ( table_indexes.length == 1 ) return; /* meh, check t_i and not s.d.length so i can test code.. */

		var thisFn   = function(d) {
					self.select_table(parseInt(this._selected));
					self._show_data();
				};

		try {
			self.charts.header_dropdown = new dropDown( { elementId: self._extension_ids.header, facts: table_indexes, selected: self._data_index, action: thisFn } );
		} catch(e) {
			alert('can not render index dropdown: ' + e );
		}

	}

	self.populate_header = function() {

		if ( self._header_created ) return;

		self._populate_header_text();
		self._populate_header_index_selector();
		self._header_created = true;
	}

	self.revert = function() {
		$.fn.close_popdown();
		if ( self.after_close) { self.after_close() };
	}

	/* this needs to be moved to a mod.js */
	self._get_real_columns = function() {
		var thisData = [];
		for ( var i = 0; i < self.selected_data.column_options.length; i++ ) {
			var col  = self.selected_data.headers[i],
			    card = self.selected_data.stats.cardinality[col],
			    type = self.selected_data.column_options[i].type;

			thisData.push( { name: col, cardinality: card, type: type } );
		}
		return thisData;
	}

	self.populate_nav = function() {

                if ( self.charts.nav ) { self.charts.nav.clear(); }

		var thisData = self._get_real_columns(),
		    thisFn   = function(d) {
					self.populate_boxplot(this.value)
				};
                try {
                        self.charts.nav = new navFields( { elementId: self._extension_ids.nav, facts: thisData, action: thisFn } );
                } catch(e) {
                        alert('can not render nav: ' + e );
                }

	}

	self._get_first_column_by_type = function( type ) {
		return self._get_nth_column_by_type( type, 1 );
	}
	self._get_nth_column_by_type = function( type, cnt ) {

		type = type || 'number';
		cnt  = cnt  || 1;

		var col;
		for ( var i = 0; i < self.selected_data.column_options.length; i++ ) {
			if ( self.selected_data.column_options[i].type == type ) {
				col = self.selected_data.headers[i];
				cnt = cnt - 1;
				if ( cnt <= 0 ) { break };
			}
		}
		return col;
	}

	self.init_data = function() {
		self.facts = crossfilter(self.selected_data.rows);
	}

	self.populate_boxplot = function(key) {

		if ( self.charts.boxplot ) { self.charts.boxplot.clear() }

		try {
			self.charts.filters.halt();
			self.charts.boxplot = new boxChart( { elementId: self._extension_ids.boxplot, facts: self.facts, key: key } );
			self.charts.boxplot.render();
			self.charts.filters.build();
		} catch(e) {
			alert('can not render boxplot: ' + e );
		}

		self.populate_timeseries(key);
		self.populate_outliers(key);
		self.populate_requestions();
		self.populate_lastquestions();

	}

	/* scatter plot context */
	self.populate_timeseries = function(key,comp_key,no_stickies) {

		if ( self.charts.timeseries ) { self.charts.timeseries.clear() }

		self._occurrence_key       = key      || self._occurrence_key;
		self._occurrence_comp_key  = comp_key || self._occurrence_comp_key  || self._get_first_column_by_type( 'date') || self._get_nth_column_by_type( 'number', 2 ) || key; 
		self._occurrence_group_key = '_' + key + '_quartile';

		try {
			self.charts.filters.halt();
			self.charts.timeseries = new occurrenceChart( {
							elementId:  self._extension_ids.timeseries,
							facts:      self.facts,
							column_definitions: self._get_real_columns(),
							key:        self._occurrence_key,
							comp_key:   self._occurrence_comp_key,
							group:      self._occurrence_group_key,
							tipClick:   self.charts.filters.doFilter,
							filters:    self.charts.filters.filters
						} );
			self.charts.filters.setTimeseries(self.charts.timeseries);
			self.charts.filters.build();
			self.charts.timeseries.render();

		} catch(e) {
			alert('can not render compare chart: ' + e );
		}

		/* only do these things the first pass through */
		if ( ! no_stickies ) {
			self.populate_occurrence_xaxis();
		}

	}

	self.populate_occurrence_xaxis = function(selected) {

		if ( self.charts.dropdown ) { return };

		self._occurrence_comp_key  = selected || self._occurrence_comp_key  || self._get_first_column_by_type( 'date') || self._get_first_column_by_type( 'text' );
		var thisData = self._get_real_columns(),
		    thisFn   = function(d) {
					self._occurrence_comp_key = this.chart.node().value;
					self.charts.filters.halt();
					self.populate_timeseries(self._occurrence_key, self._occurrence_comp_key, false);
					self.charts.filters.build();
				};
		try {
			self.charts.dropdown = new dropDown( { elementId: self._extension_ids.dropdown, facts: thisData, selected: self._occurrence_comp_key, action: thisFn } );
		} catch(e) {
			alert('can not render dropdown: ' + e );
		}

	}

	/* filters, not a singleton, just app sticky */
	self.populate_filters = function() {

		if ( self.charts.filters ) { return; }
		try {
			self.charts.filters = new filters( {
							elementId:          self._extension_ids.filters,
							facts:              self.facts,
							column_definitions: self._get_real_columns()
						} );
		} catch(e) {
			alert('can not render filters: ' + e );
		}

	}

	self.populate_requestions = function() {

		if ( self.charts.requestions ) { return; }

		var msgs = [ '-- no goal entered, what are you trying to do? --' ];
		var sections = [
				{ name: 'boxplot', prefix: 'Distribution:' }, 
				{ name: 'context', prefix: 'Context:' }, 
				{ name: 'filters', prefix: 'Filtering:' }, 
			];
		sections.forEach(function(s) {
			var thisKey = s.name,
			    askContainer = self._extension_asks[thisKey][0][0],
			    html         = askContainer.innerHTML,
			    thisMsg      = (s.prefix ? (s.prefix + ' ') : '' ) + html;
			
			msgs.push(thisMsg);
		});

		try {
			self.charts.requestions = new listMod({
							elementId:          self._extension_ids.requestions,
							facts:              msgs
				});
		} catch(e) {
			alert('can not build re-questions: ' + e );
		}
	}

	self.populate_lastquestions = function() {

		if ( self.charts['last-questions'] ) { return; }

		var msgs = [ '-- no goal entered, what are you trying to do? --' ];
		var sections = [
				{ name: 'boxplot',  prefix: 'Distribution:' }, 
				{ name: 'context',  prefix: 'Context:'      }, 
				{ name: 'filters',  prefix: 'Filtering:'    }, 
				{ name: 'outliers', prefix: 'Outliers:'     }
			];
		sections.forEach(function(s) {
			var thisKey = s.name,
			    askContainer = self._extension_asks[thisKey][0][0],
			    html         = askContainer.innerHTML,
			    thisMsg      = (s.prefix ? (s.prefix + ' ') : '' ) + html;
			
			msgs.push(thisMsg);
		});

		try {
			self.charts['last-questions'] = new listMod({
							elementId:          self._extension_ids['last-questions'],
							facts:              msgs
				});
		} catch(e) {
			alert('can not build last questions: ' + e );
		}
	}

	self.populate_outliers = function(key) {

		if ( self.charts.outliers ) { self.charts.outliers.clear() }

		var quartile_key = '_' + key + '_quartile';
		try {

			var outliers = [];
			self.selected_data.rows.forEach(function(row) {
				if ( row[quartile_key].match(/outlier$/) ) {
					outliers.push(row);
				}
			})
			self.outlierFacts = crossfilter(outliers);

			var colNames = [],
			    allCols  = self._get_real_columns() || [];
			allCols.forEach(function(c) { colNames.push(c.name) } );
			self.charts.outliers = new dataTable( { elementId: self._extension_ids.outliers, facts: self.outlierFacts, key: key, columns: colNames } );

		} catch(e) {
			alert('can not render outlier table: ' + e );
		}

		self.charts.outliers.render();
		dc.renderAll('outliers');

	}

	self.load_styles = function() {

		var styles = [
			'styles/vendor/dc.min.css',
			'styles/vendor/d3-tip.css',
			'styles/framework.css'
		];

		styles.forEach( function(s) {
			var thisURL = chrome.extension.getURL(s);

			var found = document.querySelector('link[rel*=style][href="' + thisURL + '"]');
			if ( found ) return;

			d3.select('head')
				  .append( 'link' )
				    .attr( 'rel',  'stylesheet' )
				    .attr( 'type', 'text/css' )
				    .attr( 'href', thisURL );
		})

		return true;

	}

	self.load = function() {

		self.load_styles();

		$.fn.show_popdown(
			function() {
				self.get_top_container();

				if ( self.before_init ) { self.before_init() };

				self.create_framework();

				self.populate_header();

				self.select_table(self._data_index);
				self._show_data();
			},
			{
				'min-height': '100px',
				width:  '1200px'
			}
		);
	}

	self._show_data = function() {

		self.init_data();
		self.populate_filters();
		self.populate_nav();

		/* do the actual click */
		var first_number = self._get_first_column_by_type( 'number' );
		if ( first_number ) {
			document.getElementById('_extension_nav '+first_number).click();
		}
	}

}


