import angular from "angular";

describe("SecurityIndexController", () => {
	let	securityIndexController,
			controllerTest,
			$transitions,
			$timeout,
			$uibModal,
			$state,
			securityModel,
			ogTableNavigableService,
			securities,
			deregisterTransitionSuccessHook;

	// Load the modules
	beforeEach(angular.mock.module("lootMocks", "lootSecurities", mockDependenciesProvider => mockDependenciesProvider.load(["$uibModal", "$state", "securityModel", "securities"])));

	// Configure & compile the object under test
	beforeEach(inject((_controllerTest_, _$transitions_, _$timeout_, _$uibModal_, _$state_, _securityModel_, _ogTableNavigableService_, _securities_) => {
		controllerTest = _controllerTest_;
		$transitions = _$transitions_;
		$timeout = _$timeout_;
		$uibModal = _$uibModal_;
		$state = _$state_;
		securityModel = _securityModel_;
		ogTableNavigableService = _ogTableNavigableService_;
		securities = _securities_;
		deregisterTransitionSuccessHook = sinon.stub();
		sinon.stub($transitions, "onSuccess").returns(deregisterTransitionSuccessHook);
		securityIndexController = controllerTest("SecurityIndexController");
	}));

	it("should make the passed securities available to the view", () => securityIndexController.securities.should.deep.equal(securities));

	it("should return the sum of all security values, to 2 decimal places", () => securityIndexController.totalValue.should.equal(45.01));

	it("should focus the security when a security id is specified", () => {
		$state.params.id = "1";
		securityIndexController = controllerTest("SecurityIndexController", {$state});
		securityIndexController.tableActions.focusRow = sinon.stub();
		$timeout.flush();
		securityIndexController.tableActions.focusRow.should.have.been.calledWith(0);
	});

	it("should not focus the security when a security id is not specified", () =>	$timeout.verifyNoPendingTasks());

	it("should register a success transition hook", () => $transitions.onSuccess.should.have.been.calledWith({to: "root.securities.security"}, sinon.match.func));

	it("should deregister the success transition hook when the scope is destroyed", () => {
		securityIndexController.$scope.$emit("$destroy");
		deregisterTransitionSuccessHook.should.have.been.called;
	});

	it("should ensure the security is focussed when the security id state param changes", () => {
		const toParams = {id: "1"};

		sinon.stub(securityIndexController, "focusSecurity");
		$transitions.onSuccess.firstCall.args[1]({params: sinon.stub().withArgs("to").returns(toParams)});
		securityIndexController.focusSecurity.should.have.been.calledWith(Number(toParams.id));
	});

	describe("editSecurity", () => {
		let security;

		beforeEach(() => {
			sinon.stub(securityIndexController, "focusSecurity");
			security = angular.copy(securityIndexController.securities[1]);
		});

		it("should disable navigation on the table", () => {
			securityIndexController.editSecurity();
			ogTableNavigableService.enabled.should.be.false;
		});

		describe("(edit existing)", () => {
			beforeEach(() => securityIndexController.editSecurity(1));

			it("should open the edit security modal with a security", () => {
				$uibModal.open.should.have.been.called;
				securityModel.addRecent.should.have.been.calledWith(security);
				$uibModal.resolves.security.should.deep.equal(security);
			});

			it("should update the security in the list of securities when the modal is closed", () => {
				security.name = "edited security";
				$uibModal.close(security);
				securityIndexController.securities.should.include(security);
			});
		});

		describe("(add new)", () => {
			beforeEach(() => {
				security = {id: 999, name: "new security", current_holding: 0};
				securityIndexController.editSecurity();
			});

			it("should open the edit security modal without a security", () => {
				$uibModal.open.should.have.been.called;
				securityModel.addRecent.should.not.have.been.called;
				(!$uibModal.resolves.security).should.be.true;
			});

			it("should add the new security to the list of securities when the modal is closed", () => {
				$uibModal.close(security);
				securityIndexController.securities.pop().should.deep.equal(security);
			});

			it("should add the new security to the recent list", () => {
				$uibModal.close(security);
				securityModel.addRecent.should.have.been.calledWith(security);
			});
		});

		it("should resort the securities list when the modal is closed", () => {
			const securityWithNoHoldingAndHighestName = angular.copy(securityIndexController.securities[6]);

			securityIndexController.editSecurity();
			$uibModal.close(security);
			securityIndexController.securities.pop().should.deep.equal(securityWithNoHoldingAndHighestName);
		});

		it("should focus the security when the modal is closed", () => {
			securityIndexController.editSecurity();
			$uibModal.close(security);
			securityIndexController.focusSecurity.should.have.been.calledWith(security.id);
		});

		it("should not change the securities list when the modal is dismissed", () => {
			const originalSecurities = angular.copy(securityIndexController.securities);

			securityIndexController.editSecurity();
			$uibModal.dismiss();
			securityIndexController.securities.should.deep.equal(originalSecurities);
		});

		it("should enable navigation on the table when the modal is closed", () => {
			securityIndexController.editSecurity();
			$uibModal.close(security);
			ogTableNavigableService.enabled.should.be.true;
		});

		it("should enable navigation on the table when the modal is dimissed", () => {
			securityIndexController.editSecurity();
			$uibModal.dismiss();
			ogTableNavigableService.enabled.should.be.true;
		});
	});

	describe("deleteSecurity", () => {
		let security;

		beforeEach(() => (security = angular.copy(securityIndexController.securities[1])));

		it("should fetch the security", () => {
			securityIndexController.deleteSecurity(1);
			securityModel.find.should.have.been.calledWith(security.id);
		});

		it("should disable navigation on the table", () => {
			securityIndexController.deleteSecurity(1);
			ogTableNavigableService.enabled.should.be.false;
		});

		it("should show an alert if the security has transactions", () => {
			securityIndexController.deleteSecurity(2);
			$uibModal.open.should.have.been.called;
			$uibModal.resolves.alert.header.should.equal("Security has existing transactions");
		});

		it("should show the delete security modal if the security has no transactions", () => {
			securityIndexController.deleteSecurity(1);
			$uibModal.open.should.have.been.called;
			$uibModal.resolves.security.should.deep.equal(security);
		});

		it("should remove the security from the securities list when the modal is closed", () => {
			securityIndexController.deleteSecurity(1);
			$uibModal.close(security);
			securityIndexController.securities.should.not.include(security);
		});

		it("should transition to the securities list when the modal is closed", () => {
			securityIndexController.deleteSecurity(1);
			$uibModal.close(security);
			$state.go.should.have.been.calledWith("root.securities");
		});

		it("should enable navigation on the table when the modal is closed", () => {
			securityIndexController.deleteSecurity(1);
			$uibModal.close(security);
			ogTableNavigableService.enabled.should.be.true;
		});

		it("should enable navigation on the table when the modal is dimissed", () => {
			securityIndexController.deleteSecurity(1);
			$uibModal.dismiss();
			ogTableNavigableService.enabled.should.be.true;
		});
	});

	describe("toggleFavourite", () => {
		let security;

		beforeEach(() => {
			[security] = securityIndexController.securities;
		});

		it("should favourite the security", () => {
			security.favourite = false;
			securityIndexController.toggleFavourite(0);
			security.favourite.should.be.true;
		});

		it("should unfavourite the security", () => {
			security.favourite = true;
			securityIndexController.toggleFavourite(0);
			security.favourite.should.be.false;
		});

		afterEach(() => securityModel.toggleFavourite.should.have.been.called);
	});

	describe("tableActions.selectAction", () => {
		it("should transition to the security transactions list", () => {
			securityIndexController.tableActions.selectAction();
			$state.go.should.have.been.calledWith(".transactions");
		});
	});

	describe("tableActions.editAction", () => {
		it("should edit the security", () => {
			sinon.stub(securityIndexController, "editSecurity");
			securityIndexController.tableActions.editAction(1);
			securityIndexController.editSecurity.should.have.been.calledWithExactly(1);
		});
	});

	describe("tableActions.insertAction", () => {
		it("should insert a security", () => {
			sinon.stub(securityIndexController, "editSecurity");
			securityIndexController.tableActions.insertAction();
			securityIndexController.editSecurity.should.have.been.calledWithExactly();
		});
	});

	describe("tableActions.deleteAction", () => {
		it("should delete a security", () => {
			sinon.stub(securityIndexController, "deleteSecurity");
			securityIndexController.tableActions.deleteAction(1);
			securityIndexController.deleteSecurity.should.have.been.calledWithExactly(1);
		});
	});

	describe("tableActions.focusAction", () => {
		it("should focus a security when no security is currently focussed", () => {
			securityIndexController.tableActions.focusAction(1);
			$state.go.should.have.been.calledWith(".security", {id: 2});
		});

		it("should focus a security when another security is currently focussed", () => {
			$state.currentState("**.security");
			securityIndexController.tableActions.focusAction(1);
			$state.go.should.have.been.calledWith("^.security", {id: 2});
		});
	});

	describe("focusSecurity", () => {
		beforeEach(() => (securityIndexController.tableActions.focusRow = sinon.stub()));

		it("should do nothing when the specific security row could not be found", () => {
			(!securityIndexController.focusSecurity(999)).should.be.true;
			securityIndexController.tableActions.focusRow.should.not.have.been.called;
		});

		it("should focus the security row for the specified security", () => {
			const targetIndex = securityIndexController.focusSecurity(1);

			$timeout.flush();
			securityIndexController.tableActions.focusRow.should.have.been.calledWith(targetIndex);
		});

		it("should return the index of the specified security", () => {
			const targetIndex = securityIndexController.focusSecurity(1);

			targetIndex.should.equal(0);
		});
	});
});
