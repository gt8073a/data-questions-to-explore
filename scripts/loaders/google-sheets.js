var Loader = function( args ) {

        var self = this;
        args = args || {};

	self.before_init = function() {
				d3.select('html').style('overflow', 'scroll');
			}

	self.after_close = function() {
				d3.select('html').style('overflow', 'hidden');
			}

	self.add_security_policy = function( ) {
		var policy = d3.select('head').append( 'meta' );
		policy.attr('http-equiv', 'Content-Security-Policy')
		      .attr('content', "default-src *; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://docs.google.com; object-src 'self'")
		      /* .attr('content', "default-src *; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://docs.google.com") */
	}

        self.init(args);
        return self;
}

Loader.prototype = Object.create( _loaderParent.prototype );
