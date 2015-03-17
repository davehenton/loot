(function() {
	"use strict";

	/**
	 * Registration
	 */
	angular
		.module("lootTransactions")
		.controller("TransactionEditController", Controller);

	/**
	 * Dependencies
	 */
	Controller.$inject = ["$scope", "$modalInstance", "$q", "$timeout", "filterFilter", "limitToFilter", "currencyFilter", "payeeModel", "securityModel", "categoryModel", "accountModel", "transactionModel", "transaction"];

	/**
	 * Implementation
	 */
	function Controller($scope, $modalInstance, $q, $timeout, filterFilter, limitToFilter, currencyFilter, payeeModel, securityModel, categoryModel, accountModel, transactionModel, transaction) {
		var vm = this;

		/**
		 * Interface
		 */
		vm.transaction = angular.extend({}, transaction);
		vm.mode = transaction.id ? "Edit" : "Add";
		vm.loadingLastTransaction = false;
		vm.totalAllocated = undefined;
		vm.payees = payees;
		vm.securities = securities;
		vm.categories = categories;
		vm.investmentCategories = investmentCategories;
		vm.isString = isString;
		vm.payeeSelected = payeeSelected;
		vm.securitySelected = securitySelected;
		vm.getSubtransactions = getSubtransactions;
		vm.useLastTransaction = useLastTransaction;
		vm.categorySelected = categorySelected;
		vm.investmentCategorySelected = investmentCategorySelected;
		vm.memoFromSubtransactions = memoFromSubtransactions;
		vm.accounts = accounts;
		vm.primaryAccountSelected = primaryAccountSelected;
		vm.addSubtransaction = addSubtransaction;
		vm.deleteSubtransaction = deleteSubtransaction;
		vm.addUnallocatedAmount = addUnallocatedAmount;
		vm.updateInvestmentDetails = updateInvestmentDetails;
		vm.invalidateCaches = invalidateCaches;
		vm.updateLruCaches = updateLruCaches;
		vm.save = save;
		vm.cancel = cancel;
		vm.errorMessage = null;

		/**
		 * Implementation
		 */

		// Prefetch the payees list so that the cache is populated
		payeeModel.all();

		// List of payees for the typeahead
		function payees(filter, limit) {
			return payeeModel.all().then(function(payees) {
				return limitToFilter(filterFilter(payees, {name: filter}), limit);
			});
		}

		// List of securities for the typeahead
		function securities(filter, limit) {
			return securityModel.all().then(function(securities) {
				return limitToFilter(filterFilter(securities, {name: filter}), limit);
			});
		}

		// List of categories for the typeahead
		function categories(filter, limit, parent, includeSplits) {
			// If a parent was specified but it doesn't have an id, return an empty array
			if (parent && isNaN(parent.id)) {
				return [];
			}
			
			// If the parent was specified, pass the parent's id
			var parentId = parent ? parent.id : null;

			return categoryModel.all(parentId).then(function(categories) {
				// For the category dropdown, include psuedo-categories that change the transaction type
				if (!parent) {
					if (includeSplits) {
						categories = [
							{ id: "SplitTo", name: "Split To" },
							{ id: "SplitFrom", name: "Split From" },
							{ id: "Payslip", name: "Payslip" },
							{ id: "LoanRepayment", name: "Loan Repayment" }
						].concat(categories);
					}

					categories = [
						{ id: "TransferTo", name: "Transfer To" },
						{ id: "TransferFrom", name: "Transfer From" }
					].concat(categories);
				}

				return limitToFilter(filterFilter(categories, {name: filter}), limit);
			});
		}

		// List of investment categories for the typeahead
		function investmentCategories(filter, limit) {
			var categories = [
				{ id: "Buy", name: "Buy" },
				{ id: "Sell", name: "Sell" },
				{ id: "DividendTo", name: "Dividend To" },
				{ id: "AddShares", name: "Add Shares" },
				{ id: "RemoveShares", name: "Remove Shares" },
				{ id: "TransferTo", name: "Transfer To" },
				{ id: "TransferFrom", name: "Transfer From" }
			];

			return limitToFilter(filterFilter(categories, {name: filter}), limit);
		}

		// Returns true if the passed value is typeof string (and is not empty)
		function isString(object) {
			return (typeof object === "string") && object.length > 0;
		}

		// Handler for payee changes
		function payeeSelected() {
			// If we're adding a new transaction and an existing payee is selected
			if (!vm.transaction.id && typeof vm.transaction.payee === "object") {
				// Show the loading indicator
				vm.loadingLastTransaction = true;

				// Get the previous transaction for the payee
				payeeModel.findLastTransaction(vm.transaction.payee.id, vm.transaction.primary_account.account_type).then(vm.getSubtransactions).then(vm.useLastTransaction).then(function() {
					// Hide the loading indicator
					vm.loadingLastTransaction = false;
				});
			}
		}

		// Handler for security changes
		function securitySelected() {
			// If we're adding a new transaction and an existing security is selected
			if (!vm.transaction.id && typeof vm.transaction.security === "object") {
				// Show the loading indicator
				vm.loadingLastTransaction = true;

				// Get the previous transaction for the security
				securityModel.findLastTransaction(vm.transaction.security.id, vm.transaction.primary_account.account_type).then(vm.getSubtransactions).then(vm.useLastTransaction).then(function() {
					// Hide the loading indicator
					vm.loadingLastTransaction = false;
				});
			}
		}

		// Fetches the subtransactions for a transaction
		function getSubtransactions(transaction) {
			// If the last transaction was a Split/Loan Repayment/Payslip; fetch the subtransactions
			switch (transaction.transaction_type) {
				case "Split":
				case "LoanRepayment":
				case "Payslip":
					transaction.subtransactions = [];
					return transactionModel.findSubtransactions(transaction.id).then(function(subtransactions) {
						// Strip the subtransaction ids
						transaction.subtransactions = subtransactions.map(function(subtransaction) {
							subtransaction.id = null;
							return subtransaction;
						});
						
						return transaction;
					});
				default:
					return transaction;
			}
		}

		// Merges the details of a previous transaction into the current one
		function useLastTransaction(transaction) {
			// Strip the id, transaction date, primary account, status & flag
			delete transaction.id;
			delete transaction.transaction_date;
			delete transaction.primary_account;
			delete transaction.status;
			delete transaction.related_status;
			delete transaction.flag;

			// Merge the last transaction details into the transaction on the scope
			vm.transaction = angular.extend(vm.transaction, transaction);

			// If the amount field already has focus, re-trigger the focus event handler to format/select the new value
			var amount = $("#amount");
			if (amount.get(0) === document.activeElement) {
				$timeout(function() {
					amount.triggerHandler("focus");
				}, 0);
			}
		}

		// Handler for category changes
		// (index) is the subtransaction index, or null for the main transaction
		function categorySelected(index) {
			var	transaction = isNaN(index) ? vm.transaction : vm.transaction.subtransactions[index],
					type,
					direction,
					parentId;

			// Check the category selection
			if (typeof transaction.category === "object") {
				if (isNaN(index)) {
					switch (transaction.category.id) {
						case "TransferTo":
							type = "Transfer";
							direction = "outflow";
							break;

						case "TransferFrom":
							type = "Transfer";
							direction = "inflow";
							break;

						case "SplitTo":
							type = "Split";
							direction = "outflow";
							break;

						case "SplitFrom":
							type = "Split";
							direction = "inflow";
							break;

						case "Payslip":
							type = "Payslip";
							direction = "inflow";
							break;

						case "LoanRepayment":
							type = "LoanRepayment";
							direction = "outflow";
							break;

						default:
							type = "Basic";
							direction = transaction.category.direction;
							break;
					}

					// If we have switched to a Split, Payslip or Loan Repayment and there are currently no subtransactions,
					// create some stubs, copying the current transaction details into the first entry
					switch (type) {
						case "Split":
						case "Payslip":
						case "LoanRepayment":
							if (!transaction.subtransactions) {
								transaction.subtransactions = [
									{
										memo: transaction.memo,
										amount: transaction.amount
									},
									{},
									{},
									{}
								];
							}
							break;
					}
				} else {
					switch (transaction.category.id) {
						case "TransferTo":
							type = "Subtransfer";
							direction = "outflow";
							break;

						case "TransferFrom":
							type = "Subtransfer";
							direction = "inflow";
							break;

						default:
							type = "Sub";
							direction = transaction.category.direction;
							break;
					}
				}

				parentId = transaction.category.id;
			}

			// Update the transaction type & direction
			transaction.transaction_type = type || (isNaN(index) ? "Basic" : "Sub");
			transaction.direction = direction || "outflow";

			// Make sure the subcategory is still valid
			if (transaction.subcategory && transaction.subcategory.parent_id !== parentId) {
				transaction.subcategory = null;
			}
		}

		// Handler for investment category changes
		function investmentCategorySelected() {
			var	type,
					direction;

			// Check the category selection
			if (typeof vm.transaction.category === "object") {
				switch (vm.transaction.category.id) {
					case "TransferTo":
						type = "SecurityTransfer";
						direction = "outflow";
						break;

					case "TransferFrom":
						type = "SecurityTransfer";
						direction = "inflow";
						break;

					case "RemoveShares":
						type = "SecurityHolding";
						direction = "outflow";
						break;

					case "AddShares":
						type = "SecurityHolding";
						direction = "inflow";
						break;

					case "Sell":
						type = "SecurityInvestment";
						direction = "outflow";
						break;

					case "Buy":
						type = "SecurityInvestment";
						direction = "inflow";
						break;

					case "DividendTo":
						type = "Dividend";
						direction = "outflow";
						break;
				}

				// Update the transaction type & direction
				vm.transaction.transaction_type = type;
				vm.transaction.direction = direction;
			}
		}

		// Watch the subtransactions array and recalculate the total allocated
		$scope.$watch(function() {
			return vm.transaction.subtransactions;
		}, function() {
			if (vm.transaction.subtransactions) {
				vm.totalAllocated = vm.transaction.subtransactions.reduce(function(total, subtransaction) {
					return total + (Number(subtransaction.amount * (subtransaction.direction === vm.transaction.direction ? 1 : -1)) || 0);
				}, 0);

				// If we're adding a new transaction, join the subtransaction memos and update the parent memo
				if (!vm.transaction.id) {
					vm.memoFromSubtransactions();
				}
			}
		}, true);

		// Joins the subtransaction memos and updates the parent memo
		function memoFromSubtransactions() {
			vm.transaction.memo = vm.transaction.subtransactions.reduce(function(memo, subtransaction) {
				return memo + (subtransaction.memo ? ("" !== memo ? "; ": "") + subtransaction.memo : "");
			}, "");
		}

		// List of accounts for the typeahead
		function accounts(filter, limit) {
			return accountModel.all().then(function(accounts) {
				var accountFilter = {
					name: filter,
					account_type: "!investment"		// exclude investment accounts by default
				};

				// Filter the current account from the results (can't transfer to self)
				if (vm.transaction.primary_account) {
					accounts = filterFilter(accounts, {name: "!" + vm.transaction.primary_account.name});
				}

				// For security transfers, only include investment accounts
				if ("SecurityTransfer" === vm.transaction.transaction_type) {
					accountFilter.account_type = "investment";
				}

				return limitToFilter(filterFilter(accounts, accountFilter), limit);
			});
		}

		// Handler for primary account changes
		function primaryAccountSelected() {
			if (vm.transaction.account && vm.transaction.primary_account.id === vm.transaction.account.id) {
				// Primary account and transfer account can't be the same, so clear the transfer account
				vm.transaction.account = null;
			}
		}

		// Add a new subtransaction
		function addSubtransaction() {
			vm.transaction.subtransactions.push({});
		}

		// Deletes a subtransaction
		function deleteSubtransaction(index) {
			vm.transaction.subtransactions.splice(index, 1);
		}

		// Adds any unallocated amount to the specified subtransaction
		function addUnallocatedAmount(index) {
			vm.transaction.subtransactions[index].amount = (Number(vm.transaction.subtransactions[index].amount) || 0) + (vm.transaction.amount - vm.totalAllocated);
		}

		// Updates the transaction amount and memo when the quantity, price or commission change
		function updateInvestmentDetails() {
			if ("SecurityInvestment" === vm.transaction.transaction_type) {
				// Base amount is the quantity multiplied by the price
				vm.transaction.amount = (vm.transaction.quantity || 0) * (vm.transaction.price || 0);

				// For a purchase, commission is added to the cost; for a sale, commission is subtracted from the proceeds
				if ("inflow" === vm.transaction.direction) {
					vm.transaction.amount += (vm.transaction.commission || 0);
				} else {
					vm.transaction.amount -= (vm.transaction.commission || 0);
				}
			}

			// If we're adding a new buy or sell transaction, update the memo with the details
			if (!vm.transaction.id && "SecurityInvestment" === vm.transaction.transaction_type) {
				var	quantity = vm.transaction.quantity > 0 ? vm.transaction.quantity : "",
						price = vm.transaction.price > 0 ? " @ " + currencyFilter(vm.transaction.price) : "",
						commission = vm.transaction.commission > 0 ? " (" + ("inflow" === vm.transaction.direction ? "plus" : "less") + " " + currencyFilter(vm.transaction.commission) + " commission)" : "";

				vm.transaction.memo = quantity + price + commission;
			}
		}

		// Helper function to invalidate the $http caches after saving a transaction
		function invalidateCaches(savedTransaction) {
			// Create a deferred so that we return a promise
			var q = $q.defer(),
					resolve = true,
					originalValue,
					savedValue,
					models = {
						"primary_account": accountModel,
						"payee": payeeModel,
						"category": categoryModel,
						"subcategory": categoryModel,
						"account": accountModel,
						"security": securityModel
					};

			// Compare each facet of the saved transaction with the original values
			// For any that have changed, invalidate the original from the $http cache
			angular.forEach(Object.keys(models), function(key) {
				originalValue = transaction[key] && transaction[key].id || undefined;
				savedValue = savedTransaction[key] && savedTransaction[key].id || undefined;

				if (originalValue && originalValue !== savedValue) {
					models[key].flush(originalValue);
				}
			});

			// For subtransactions, we can't be sure if the values have changed or not (as the ordering may have changed)
			// so just invalidate any categories or accounts
			switch (transaction.transaction_type) {
				case "Split":
				case "LoanRepayment":
				case "Payslip":
					// Delay resolving the promise
					resolve = false;

					transactionModel.findSubtransactions(transaction.id).then(function(subtransactions) {
						angular.forEach(subtransactions, function(subtransaction) {
							if (subtransaction.category && subtransaction.category.id) {
								categoryModel.flush(subtransaction.category.id);
							}

							if (subtransaction.subcategory && subtransaction.subcategory.id) {
								categoryModel.flush(subtransaction.subcategory.id);
							}

							if (subtransaction.account && subtransaction.account.id) {
								accountModel.flush(subtransaction.account.id);
							}
						});

						// Resolve the promise
						q.resolve(savedTransaction);
					});
					break;
			}

			// Resolve the promise (unless explicitly delayed)
			if (resolve) {
				q.resolve(savedTransaction);
			}

			// Return the promise
			return q.promise;
		}

		// Helper function to update the LRU caches after saving a transaction
		function updateLruCaches(transaction) {
			// Create a deferred so that we return a promise
			var q = $q.defer(),
					resolve = true;

			// Add the primary account to the LRU cache
			accountModel.addRecent(transaction.primary_account);

			// Add the payee or security to the LRU cache
			if ("investment" !== transaction.primary_account.account_type) {
				payeeModel.addRecent(transaction.payee);
			} else {
				securityModel.addRecent(transaction.security);
			}

			switch (transaction.transaction_type) {
				case "Basic":
					// Add the category and subcategory to the LRU cache
					categoryModel.addRecent(transaction.category);
					if (transaction.subcategory) {
						categoryModel.addRecent(transaction.subcategory);
					}
					break;

				case "Transfer":
				case "SecurityTransfer":
				case "SecurityInvestment":
				case "Dividend":
					// Add the account to the LRU cache
					accountModel.addRecent(transaction.account);
					break;

				case "Split":
				case "LoanRepayment":
				case "Payslip":
					// Delay resolving the promise
					resolve = false;

					transactionModel.findSubtransactions(transaction.id).then(function(subtransactions) {
						angular.forEach(subtransactions, function(subtransaction) {
							if ("Transfer" === subtransaction.transaction_type) {
								// Add the account to the LRU cache
								accountModel.addRecent(subtransaction.account);
							} else {
								// Add the category and subcategory to the LRU cache
								categoryModel.addRecent(subtransaction.category);
								if (subtransaction.subcategory) {
									categoryModel.addRecent(subtransaction.subcategory);
								}
							}
						});

						// Resolve the promise
						q.resolve(transaction);
					});
					break;
			}

			// Resolve the promise (unless explicitly delayed)
			if (resolve) {
				q.resolve(transaction);
			}

			// Return the promise
			return q.promise;
		}

		// Save and close the modal
		function save() {
			vm.errorMessage = null;
			transactionModel.save(vm.transaction).then(vm.invalidateCaches).then(vm.updateLruCaches).then(function(transaction) {
				// Close the modal
				$modalInstance.close(transaction);
			}).catch(function(error) {
				vm.errorMessage = error.data;
			});
		}

		// Dismiss the modal without saving
		function cancel() {
			$modalInstance.dismiss();
		}
	}
})();