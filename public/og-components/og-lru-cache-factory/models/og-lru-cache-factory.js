(function() {
	"use strict";

	// Reopen the module
	var mod = angular.module('ogComponents');

	// Declare the ogLruCache model
	mod.factory('ogLruCacheFactory', [
		function() {
			// Cache object
			var	LruCache = function(capacity, data) {
				this.capacity = capacity;
				this.head = data.head || null;
				this.tail = data.tail || null;
				this.items = data.items || {};

				// Check if the cache has exceeded it's capacity
				this.checkCapacity();
			};

			// Put an item into the cache
			LruCache.prototype.put = function(item) {
				var	oldHead = this.items[this.head],
						newHead;

				// Only update if the item is not already the current head
				if (item.id !== this.head) {
					// Check if the item already exists
					if (this.items.hasOwnProperty(item.id)) {
						// New head is the existing item
						newHead = this.items[item.id];
						
						// Unlink the existing item from the list
						if (item.id !== this.tail) {
							this.items[newHead.older].newer = newHead.newer;
						} else {
							this.tail = newHead.newer;
						}
						this.items[newHead.newer].older = newHead.older;

						// Link the old head to the new head
						oldHead.newer = item.id;
						newHead.older = this.head;
						newHead.newer = null;

						// Update the header pointer
						this.head = item.id;
					} else {
						newHead = {
							id: item.id,
							name: item.name
						};
						
						// Link the old head to the new head
						if (oldHead) {
							oldHead.newer = item.id;
							newHead.older = this.head;
						} else {
							// This must be the first item in the cache, so must be both head and tail
							this.tail = item.id;
						}

						// Add the new item to the cache
						this.items[item.id] = newHead;

						// Update the head pointer
						this.head = item.id;

						// Check if the cache has exceeded it's capacity
						this.checkCapacity();
					}
				}

				// Return the list of cached items in order (MRU)
				return this.list();
			};

			// Check if the cache has exceeded it's capacity
			LruCache.prototype.checkCapacity = function() {
				if (Object.keys(this.items).length > this.capacity) {
					var	oldTail = this.items[this.tail],
							newTail;
					
					// Update the tail pointer
					this.tail = oldTail.newer;

					// Delete the old tail
					newTail = this.items[oldTail.newer];
					delete this.items[newTail.older];
					
					// Unlink the old tail from the list
					newTail.older = null;
				}
			};

			// List the cached items in order (MRU)
			LruCache.prototype.list = function() {
				var list = [],
						item = this.items[this.head],
						iterations = 0;

				while (item) {
					iterations++;

					// Safety check
					if (iterations > this.capacity) {
						// Something is wrong, we've iterated more times than the cache capacity allows
						throw new Error("Possible infinite loop in LRU cache. Head: " + this.head + ", Tail: " + this.tail + ", Item: " + JSON.stringify(item), "Items: " + JSON.stringify(this.items));
					}

					list.push({
						id: item.id,
						name: item.name
					});

					item = this.items[item.older];
				}

				return list;
			};

			// Dump the cache internals (for persisting to storage)
			LruCache.prototype.dump = function() {
				return {
					head: this.head,
					tail: this.tail,
					items: this.items
				};
			};

			// Factory function
			return function(capacity, data) {
				// Return a new LruCache object with the specified capacity
				return new LruCache(capacity, data);
			};
		}
	]);
})();
