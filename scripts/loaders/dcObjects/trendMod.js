var _trendChart = function(args) {

	/* this has no render method, it is meant to be rendered by the caller */
        var self = this;
        args = args || {};

        self.init = function(args) {

		[ 'name', 'facts', 'column_definitions', 'xKey', 'yKey' ].forEach(function(k) {
			self[k] = args[k];
		});

		/* argggg! you can not multiple 32 times january 5th, 1993 */
		self._xType = self.column_definitions[self.xKey] ? self.column_definitions[self.xKey].type : 'text';
		self._xFn   = self._xType == 'date' ? function(d) { return d.getTime() } : function(d) { return d };

		self.dimension = self.facts.dimension(function(d) { var t = d[self.xKey]; /* console.log( d, t ); */ return t });
		self._calculateGroup();

		return self;

	}

	self._calculateGroup = function() {

		var equation         = self._calculateEquation();
		    self.slope       = equation.slope;
		    self.intercept   = equation.intercept;
		    self.correlation = equation.rsq;
		    self.title       = 'r = ' + self.correlation + ' , Y = ' + self.slope + ' * X + ' + self.intercept;

		self.fn = function(d) { var t = self.slope * self._xFn(d[self.xKey]) + self.intercept; /* console.log( d[self.xKey], t, self.title ); */ return t };

		self.group = self.dimension.group().reduce(
		    function (p, v) {
			if ( typeof p != 'object' ) return p;
			if ( p && ! p[self.xKey] ) p[self.xKey] = self.fn(v);
			return p[self.xKey];
		    },
		    function(p,v) { return p },
		    function () { return {} }
		);

	}

	self._calculateEquation = function() {

		var sum = { x: 0, y: 0, xx: 0, xy: 0, yy: 0 },
		    len = 0,
		    dFn = function(d) {

				/* what about dates? */
				/* NOTE: typeof NaN = 'number' */
				if ( typeof d[self.xKey] != 'number' || isNaN(d[self.xKey]) || typeof d[self.yKey] != 'number' || isNaN(d[self.yKey]) ) {
					return false;
				}

				len++;

				var x = self._xFn(d[self.xKey]),
				    y =           d[self.yKey];

				sum.x  += x;
				sum.xx += (x*x);
				sum.xy += (x*y);
				sum.yy += (y*y);
				sum.y  += y;

				return true;
		          };

		// self.dimension.groupAll().reduceSum(dFn).value();
		var ga = self.dimension.groupAll().reduceSum(dFn);
		    ga.value();
		    ga.dispose();

		var thisEquation = { slope: undefined, intercept: undefined, rsq: undefined };
		if ( len > 0 ) {
			thisEquation.slope     = Math.round( 100 * ( len * sum.xy - sum.x * sum.y ) / ( len * sum.xx - sum.x * sum.x ) ) / 100;
			thisEquation.intercept = Math.round( 100 * ( sum.y - thisEquation.slope * sum.x ) / len ) / 100;
			thisEquation.rsq       = Math.round( 100 * Math.pow(( len * sum.xy - sum.x * sum.y ) / Math.sqrt(( len * sum.xx - sum.x * sum.x ) * ( len * sum.yy - sum.y * sum.y ) ), 2 ) ) / 100;
		}

console.log( self.name, thisEquation );
		return thisEquation;

	}

	/* we don't really "render" a chart, we render data. caller is expected to compose using this dimension and group */
	self.render = function() {
		self._calculateGroup();
	}

	self.init(args);
}
