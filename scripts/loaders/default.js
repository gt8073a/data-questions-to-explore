
var Loader = function( args ) {

	var self = this;
	args = args || {};

	self.init(args);
	return self;
}

Loader.prototype = Object.create( _loaderParent.prototype );

