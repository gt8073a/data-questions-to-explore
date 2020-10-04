var thisURL, dataURL;
var Extractor = function(tabs) {

	var self = this;

	self._title_container    = undefined;
	self.get_title_container = function() { alert('in an abstract extractor, can not get title container')};

	self.title               = undefined;
	self.get_title           = function() { alert('in an abstract extractor, can not get title')};

	self.data                = [];
	self.get_data            = function() { alert('in an abstract extractor, can not get data') };

	self.extract = function() {

		self.get_title_container();
		self.get_title();
		self.get_data();
		return self.data;
	}

	return self;

}
