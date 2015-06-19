describe("SecurityDeleteController", () => {
	let	securityDeleteController,
			$modalInstance,
			securityModel,
			security;

	// Load the modules
	beforeEach(module("lootMocks", "lootSecurities", mockDependenciesProvider => mockDependenciesProvider.load(["$modalInstance", "securityModel", "security"])));

	// Configure & compile the object under test
	beforeEach(inject((controllerTest, _$modalInstance_, _securityModel_, _security_) => {
		$modalInstance = _$modalInstance_;
		securityModel = _securityModel_;
		security = _security_;
		securityDeleteController = controllerTest("SecurityDeleteController");
	}));

	it("should make the passed security available to the view", () => securityDeleteController.security.should.deep.equal(security));

	describe("deleteSecurity", () => {
		it("should reset any previous error messages", () => {
			securityDeleteController.errorMessage = "error message";
			securityDeleteController.deleteSecurity();
			(null === securityDeleteController.errorMessage).should.be.true;
		});

		it("should delete the security", () => {
			securityDeleteController.deleteSecurity();
			securityModel.destroy.should.have.been.calledWith(security);
		});

		it("should close the modal when the security delete is successful", () => {
			securityDeleteController.deleteSecurity();
			$modalInstance.close.should.have.been.called;
		});

		it("should display an error message when the security delete is unsuccessful", () => {
			securityDeleteController.security.id = -1;
			securityDeleteController.deleteSecurity();
			securityDeleteController.errorMessage.should.equal("unsuccessful");
		});
	});

	describe("cancel", () => {
		it("should dismiss the modal", () => {
			securityDeleteController.cancel();
			$modalInstance.dismiss.should.have.been.called;
		});
	});
});
