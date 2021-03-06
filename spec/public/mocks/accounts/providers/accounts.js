export default class AccountsMockProvider {
	constructor() {
		// Mock accounts object
		this.accounts = [
			{id: 1, name: "aa", account_type: "bank", opening_balance: 100, status: "open"},
			{id: 2, name: "bb", account_type: "investment"},
			{id: 3, name: "cc", num_transactions: 1},
			{id: 4, name: "ba", account_type: "asset"},
			{id: 5, name: "ab", account_type: "asset"},
			{id: 6, name: "bc", account_type: "investment"},
			{id: 7, name: "ca"},
			{id: 8, name: "cb", account_type: "asset"},
			{id: 9, name: "ac"}
		];
	}

	$get() {
		// Return the mock accounts object
		return this.accounts;
	}
}

AccountsMockProvider.$inject = [];