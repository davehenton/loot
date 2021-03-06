export default class CategoryModelMockProvider {
	constructor(categoryMockProvider, categoriesMockProvider, $qMockProvider) {
		// Success/error = options for the stub promises
		const	success = {
						args: {id: 1},
						response: {data: categoryMockProvider.$get()}
					},
					error = {
						args: {id: -1}
					},
					$q = $qMockProvider.$get();

		// Mock categoryModel object
		this.categoryModel = {
			path(id) {
				return `/categories/${id}`;
			},
			recent: "recent categories list",
			all: $q.promisify({
				response: categoriesMockProvider.$get()
			}),
			allWithChildren: sinon.stub().returns(categoriesMockProvider.$get()),
			find(id) {
				let category;

				// Get the matching category
				if (id < 10) {
					category = categoriesMockProvider.$get()[id - 1];
				} else {
					const parentId = (id / 10) - 1,
								childId = id % 10;

					category = categoriesMockProvider.$get()[parentId].children[childId];
				}

				// Return a promise-like object that resolves with the category
				return $q.promisify({response: category})();
			},
			save: $q.promisify(success, error),
			destroy: $q.promisify(success, error),
			toggleFavourite(category) {
				return $q.promisify({response: !category.favourite})();
			},
			flush: sinon.stub(),
			addRecent: sinon.stub()
		};

		// Spy on find() and toggleFavourite()
		sinon.spy(this.categoryModel, "find");
		sinon.spy(this.categoryModel, "toggleFavourite");
	}

	$get() {
		// Return the mock categoryModel object
		return this.categoryModel;
	}
}

CategoryModelMockProvider.$inject = ["categoryMockProvider", "categoriesMockProvider", "$qMockProvider"];