
function App() {

	var self = this;

	self.extractor   = new Extractor();
	self.extractor.extract();

	self.transformer = new Transformor( { data: self.extractor.data } );
	self.transformer.transform();

	self.loader      = new Loader( { data: self.extractor.data });
	self.loader.load();

	return self;
}
new App();
