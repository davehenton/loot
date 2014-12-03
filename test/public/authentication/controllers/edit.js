(function() {
	"use strict";

	/*jshint expr: true */

	describe("authenticationEditController", function() {
		// The object under test
		var authenticationEditController;

		// Dependencies
		var $modalInstance,
				authenticationModel;

		// Load the modules
		beforeEach(module("lootMocks", "authentication", function(mockDependenciesProvider) {
			mockDependenciesProvider.load(["$modalInstance", "authenticationModel"]);
		}));

		// Configure & compile the object under test
		beforeEach(inject(function(controllerTest, _$modalInstance_, _authenticationModel_) {
			$modalInstance = _$modalInstance_;
			authenticationModel = _authenticationModel_;
			authenticationEditController = controllerTest("authenticationEditController");
		}));

		it("should set an empty authentication object on the $scope", function() {
			authenticationEditController.authentication.should.be.an.Object;
			authenticationEditController.authentication.should.be.empty;
		});

		describe("login", function() {
			beforeEach(function() {
				authenticationEditController.authentication.userName = "gooduser";
				authenticationEditController.authentication.password = "goodpassword";
			});

			it("should reset any previous error messages", function() {
				authenticationEditController.errorMessage = "error message";
				authenticationEditController.login();
				(null === authenticationEditController.errorMessage).should.be.true;
			});

			it("should attempt to login with the username & password", function() {
				authenticationEditController.login();
				authenticationModel.login.should.have.been.calledWith("gooduser", "goodpassword");
			});

			it("should close the modal when login successful", function() {
				authenticationEditController.login();
				$modalInstance.close.should.have.been.called;
			});

			it("should display an error message when login unsuccessful", function() {
				authenticationEditController.authentication.userName = "baduser";
				authenticationEditController.authentication.password = "badpassword";
				authenticationEditController.login();
				authenticationEditController.errorMessage.should.equal("unsuccessful");
			});
		});

		describe("cancel", function() {
			it("should dismiss the modal", function() {
				authenticationEditController.cancel();
				$modalInstance.dismiss.should.have.been.called;
			});
		});
	});
})();
