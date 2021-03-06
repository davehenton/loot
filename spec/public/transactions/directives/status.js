import angular from "angular";

describe("transactionStatus", () => {
	let	transactionStatus,
			transactionModel,
			$sce;

	// Load the modules
	beforeEach(angular.mock.module("lootMocks", "lootTransactions", mockDependenciesProvider => mockDependenciesProvider.load(["transactionModel"])));

	// Configure & compile the object under test
	beforeEach(inject((_$sce_, directiveTest, _transactionModel_) => {
		$sce = _$sce_;
		transactionStatus = directiveTest;
		transactionStatus.configure("transaction-status", "div");
		transactionStatus.scope.model = {
			account: {
				id: 123
			},
			transaction: {
				id: 456
			}
		};

		transactionModel = _transactionModel_;
	}));

	const scenarios = [
		{
			nextStatus: "Cleared",
			icon: "tag",
			tooltip: "Status: <strong class=\"unreconciled\">Unreconciled</strong><br/>Click to mark as <strong class=\"cleared\">Cleared</strong>"
		},
		{
			currentStatus: null,
			nextStatus: "Cleared",
			icon: "tag",
			tooltip: "Status: <strong class=\"unreconciled\">Unreconciled</strong><br/>Click to mark as <strong class=\"cleared\">Cleared</strong>"
		},
		{
			currentStatus: "Unreconciled",
			nextStatus: "Cleared",
			icon: "tag",
			tooltip: "Status: <strong class=\"unreconciled\">Unreconciled</strong><br/>Click to mark as <strong class=\"cleared\">Cleared</strong>"
		},
		{
			currentStatus: "Reconciled",
			nextStatus: "Unreconciled",
			icon: "lock",
			tooltip: "Status: <strong class=\"reconciled\">Reconciled</strong><br/>Click to mark as <strong class=\"unreconciled\">Unreconciled</strong>"
		},
		{
			currentStatus: "Cleared",
			nextStatus: "Reconciled",
			icon: "tag",
			tooltip: "Status: <strong class=\"cleared\">Cleared</strong><br/>Click to mark as <strong class=\"reconciled\">Reconciled</strong>"
		},
		{
			currentStatus: "anything else",
			nextStatus: "Cleared",
			icon: "tag",
			tooltip: "Status: <strong class=\"anything else\">anything else</strong><br/>Click to mark as <strong class=\"cleared\">Cleared</strong>"
		}
	];

	// Helper function in lieu of beforeEach (which we can't use for dynamically generated specs)
	function setup(scenario) {
		transactionStatus.scope.model.transaction.status = scenario.currentStatus;
		transactionStatus.compile({"transaction-status": "model"});
		transactionStatus.scope.$digest();
	}

	scenarios.forEach(scenario => {
		if (!scenario.currentStatus) {
			it(`should set the current status to 'Unreconciled' when the transaction status is ${String(scenario.currentStatus)}`, () => {
				setup(scenario);
				transactionStatus.element.isolateScope().currentStatus.should.equal("Unreconciled");
			});
		}

		it(`should set the next status to ${scenario.nextStatus} when the current status is ${String(scenario.currentStatus)}`, () => {
			setup(scenario);
			transactionStatus.element.isolateScope().nextStatus.should.equal(scenario.nextStatus);
		});

		it(`should set the icon to ${scenario.icon} when the current status is ${String(scenario.currentStatus)}`, () => {
			setup(scenario);
			transactionStatus.element.isolateScope().icon.should.equal(scenario.icon);
		});

		it(`should set the tooltip when the current status is ${String(scenario.currentStatus)}`, () => {
			setup(scenario);
			$sce.getTrustedHtml(transactionStatus.element.isolateScope().tooltip).should.equal(scenario.tooltip);
		});
	});

	describe("element", () => {
		let i;

		beforeEach(() => {
			transactionStatus.compile({"transaction-status": "model"});
			transactionStatus.scope.$digest();
			i = transactionStatus.element.find("i");
		});

		it("should display the icon for the current status", () => i.hasClass("glyphicon-tag").should.be.true);

		it("should style the element according to the current status", () => i.hasClass("unreconciled").should.be.true);

		it("should be transparent when the current status is Unreconciled", () => i.hasClass("active").should.be.false);

		it("should be opaque when the current status is not Unreconciled", () => {
			transactionStatus.scope.model.transaction.status = "Cleared";
			transactionStatus.compile({"transaction-status": "model"});
			transactionStatus.scope.$digest();
			transactionStatus.element.find("i").hasClass("active").should.be.true;
		});
	});

	describe("on click", () => {
		beforeEach(() => {
			transactionStatus.compile({"transaction-status": "model"});
			transactionStatus.scope.$digest();
		});

		it("should update the transaction status to the next status if not Unreconciled", () => {
			transactionStatus.element.isolateScope().nextStatus = "Cleared";
			transactionStatus.element.triggerHandler("click");
			transactionModel.updateStatus.should.have.been.calledWith("/accounts/123", 456, "Cleared");
		});

		it("should clear the transaction status if the next status is Unreconciled", () => {
			transactionStatus.element.isolateScope().nextStatus = "Unreconciled";
			transactionStatus.element.triggerHandler("click");
			transactionModel.updateStatus.should.have.been.calledWith("/accounts/123", 456, null);
		});

		it("should set the current status", () => {
			transactionStatus.element.isolateScope().currentStatus = "Cleared";
			transactionStatus.element.isolateScope().nextStatus = "Reconciled";
			transactionStatus.element.triggerHandler("click");
			transactionStatus.element.isolateScope().currentStatus.should.equal("Reconciled");
			transactionStatus.element.isolateScope().nextStatus.should.equal("Unreconciled");
		});
	});

	describe("on destroy", () => {
		beforeEach(() => {
			transactionStatus.compile({"transaction-status": "model"});
			transactionStatus.scope.$digest();
			sinon.stub(transactionStatus.element.isolateScope(), "clickHandler");
			transactionStatus.element.triggerHandler("$destroy");
		});

		it("should remove the click handler from the element", () => {
			transactionStatus.element.triggerHandler("click");
			transactionStatus.element.isolateScope().clickHandler.should.not.have.been.called;
		});
	});
});
