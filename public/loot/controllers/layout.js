(function() {
	"use strict";

	// Reopen the module
	var mod = angular.module("loot");

	// Declare the Layout controller
	mod.controller("layoutController", ["$scope", "$state", "$modal", "$uiViewScroll", "authenticationModel", "accountModel", "payeeModel", "categoryModel", "securityModel", "authenticated",
		function($scope, $state, $modal, $uiViewScroll, authenticationModel, accountModel, payeeModel, categoryModel, securityModel, authenticated) {
			// Make the authentication status available on the scope
			$scope.authenticated = authenticated;

			// Login
			$scope.login = function() {
				$modal.open({
					templateUrl: "authentication/views/edit.html",
					controller: "authenticationEditController",
					backdrop: "static",
					size: "sm"
				}).result.then(function() {
					$state.reload();
				});
			};

			// Logout
			$scope.logout = function() {
				authenticationModel.logout();
				$state.reload();
			};

			// Search
			$scope.search = function() {
				$state.go("root.transactions", {
					query: $scope.$root.query
				});
			};

			// Globally disable/enable any table key-bindings
			$scope.toggleNavigationGloballyDisabled = function(state) {
				$scope.navigationGloballyDisabled = state;
			};

			// Recently accessed lists
			$scope.recentlyAccessedAccounts = function() {
				return accountModel.recent;
			};

			$scope.recentlyAccessedPayees = function() {
				return payeeModel.recent;
			};

			$scope.recentlyAccessedCategories = function() {
				return categoryModel.recent;
			};

			$scope.recentlyAccessedSecurities = function() {
				return securityModel.recent;
			};

			// Scrolling
			$scope.scrollTo = function(anchor) {
				$uiViewScroll($("#" + anchor));
			};
		}
	]);
})();
