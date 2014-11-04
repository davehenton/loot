(function() {
	"use strict";

	// Reopen the module
	var mod = angular.module("schedules");

	// Declare the Schedule Index controller
	mod.controller("scheduleIndexController", ["$scope", "$modal", "$timeout", "$state", "scheduleModel", "transactionModel", "schedules",
		function($scope, $modal, $timeout, $state, scheduleModel, transactionModel, schedules) {
			// Store the schedules on the scope
			$scope.schedules = schedules;

			$scope.editSchedule = function(index) {
				// Disable navigation on the table
				$scope.navigationDisabled = true;

				// Show the modal
				$modal.open({
					templateUrl: "schedules/views/edit.html",
					controller: "scheduleEditController",
					backdrop: "static",
					size: "lg",
					resolve: {
						schedule: function() {
							// If we didn't get an index, we're adding a new schedule so just return null
							if (isNaN(index)) {
								return null;
							}

							// If the selected schedule is a Split/Loan Repayment/Payslip; fetch the subtransactions first
							switch ($scope.schedules[index].transaction_type) {
								case "Split":
								case "LoanRepayment":
								case "Payslip":
									$scope.schedules[index].subtransactions = [];
									return transactionModel.findSubtransactions($scope.schedules[index].id).then(function(subtransactions) {
										$scope.schedules[index].subtransactions = subtransactions;
										return $scope.schedules[index];
									});
								default:
									return $scope.schedules[index];
							}
						}
					}
				}).result.then(function(schedule) {
					if (isNaN(index)) {
						// Add new schedule to the end of the array
						$scope.schedules.push(schedule.data);
					} else {
						// Update the existing schedule in the array
						$scope.schedules[index] = schedule.data;
					}

					// Resort the array
					$scope.schedules.sort(byNextDueDateAndId);

					// If we entered or skipped a transaction, refocus the schedule now at the original index,
					// otherwise refocus the schedule that was edited
					$scope.focusSchedule(schedule.skipped ? $scope.schedules[index].id : schedule.data.id);
				}).finally(function() {
					// Enable navigation on the table
					$scope.navigationDisabled = false;
				});
			};

			$scope.deleteSchedule = function(index) {
				// Disable navigation on the table
				$scope.navigationDisabled = true;

				// Show the modal
				$modal.open({
					templateUrl: "schedules/views/delete.html",
					controller: "scheduleDeleteController",
					backdrop: "static",
					resolve: {
						schedule: function() {
							return $scope.schedules[index];
						}
					}
				}).result.then(function() {
					$scope.schedules.splice(index, 1);
					$state.go("root.schedules");
				}).finally(function() {
					// Enable navigation on the table
					$scope.navigationDisabled = false;
				});
			};

			// Action handlers for navigable table
			$scope.tableActions = {
				navigationEnabled: function() {
					return !($scope.navigationDisabled || $scope.navigationGloballyDisabled);
				},
				selectAction: $scope.editSchedule,
				editAction: $scope.editSchedule,
				insertAction: function() {
					// Same as select action, but don't pass any arguments
					$scope.editSchedule();
				},
				deleteAction: $scope.deleteSchedule,
				focusAction: function(index) {
					$state.go(($state.includes("**.schedule") ? "^" : "") + ".schedule", {
						id: $scope.schedules[index].id
					});
				}
			};

			// Today's date (for checking if a schedule is overdue
			$scope.today = moment().startOf("day").toDate();

			// Finds a specific schedule and focusses that row in the table
			$scope.focusSchedule = function(scheduleIdToFocus) {
				var targetIndex;

				// Find the schedule by it's id
				angular.forEach($scope.schedules, function(schedule, index) {
					if (isNaN(targetIndex) && schedule.id === scheduleIdToFocus) {
						targetIndex = index;
					}
				});

				// If found, focus the row
				if (!isNaN(targetIndex)) {
					$timeout(function() {
						$scope.tableActions.focusRow(targetIndex);
					}, 50);
				}

				return targetIndex;
			};

			// Helper function to sort by next due date, then by transaction id
			var byNextDueDateAndId = function(a, b) {
				var x, y;

				if (moment(a.next_due_date).isSame(b.next_due_date)) {
					x = a.id;
					y = b.id;
				} else {
					x = a.next_due_date;
					y = b.next_due_date;
				}

				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			};

			// Shows/hides subtransactions
			$scope.toggleSubtransactions = function($event, schedule) {
				// Toggle the show flag
				schedule.showSubtransactions = !schedule.showSubtransactions;

				// If we're showing
				if (schedule.showSubtransactions) {
					// Show the loading indicator
					schedule.loadingSubtransactions = true;

					// Clear the array?
					schedule.subtransactions = [];

					// Resolve the subtransactions
					transactionModel.findSubtransactions(schedule.id).then(function(subtransactions) {
						schedule.subtransactions = subtransactions;

						// Hide the loading indicator
						schedule.loadingSubtransactions = false;
					});
				}

				$event.cancelBubble = true;
			};

			// Listen for state change events, and when the schedule id changes, ensure the row is focussed
			$scope.stateChangeSuccessHandler = function(event, toState, toParams, fromState, fromParams) {
				if (toParams.id && (toState.name !== fromState.name || toParams.id !== fromParams.id)) {
					$scope.focusSchedule(Number(toParams.id));
				}
			};

			// Handler is wrapped in a function to aid with unit testing
			$scope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
				$scope.stateChangeSuccessHandler(event, toState, toParams, fromState, fromParams);
			});
		}
	]);
})();
