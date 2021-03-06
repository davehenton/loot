export default class OgLruCacheFactoryMockProvider {
	constructor() {
		// Mock LruCache object
		this.ogLruCache = {
			list: sinon.stub().returns("recent list"),
			put: sinon.stub().returns("updated list"),
			remove: sinon.stub().returns("updated list"),
			dump: sinon.stub().returns({})
		};
	}

	$get() {
		// Return the mock LruCache object
		return () => this.ogLruCache;
	}
}

OgLruCacheFactoryMockProvider.$inject = [];