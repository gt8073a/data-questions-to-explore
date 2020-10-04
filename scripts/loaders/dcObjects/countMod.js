
var countText = function(args) {

	var self = this;
	args = args || {};

	self.init = function(args) {

		self.elementId = args.elementId;
		self.element   = $('#'+self.elementId);

		self._addChartToElement();

		self.key       = args.key || 'id'
		self.facts     = args.facts;
		self.dimension = self.facts.dimension(function(d) { return d[self.key] });
		self.group     = self.dimension.group();

		return self;

	}

        self._addChartToElement = function() {
                var self = this;
                var found = $('#' + self.elementId + ' .dc-count');
                if ( ! found || ! found.length ) {
                        self.element.append('<span class="dc-count">Showing <span class="filter-count"></span> of <span class="total-count"></span> items | <a href="javascript:dc.filterAll(); dc.renderAll();">Reset All</span>')
                }
        }

	self.reset = function() {
		dc.filterAll();
		dc.renderAll();
	}

	self.show = function() {
		self.element.removeClass('hidden');
	}

	self.hide = function() {
		self.element.addClass('hidden');
	}

	self.render = function() {
		self._renderCount();
		self.show();
	}

	self._renderCount = function() {
		var self = this;
		if ( ! self.facts._storedAll ) {
			self.facts._storedAll = self.facts.groupAll();
		}
		dc.dataCount('#' + self.elementId + ' .dc-count')
		  .dimension(self.facts)
		  .group(self.facts._storedAll);
	}

	return self.init(args);
}
