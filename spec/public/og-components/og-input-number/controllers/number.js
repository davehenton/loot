(function() {
	"use strict";

	/*jshint expr: true */

	describe("ogInputNumberController", function() {
		// The object under test
		var ogInputNumberController;

		// Dependencies
		var controllerTest;

		// Load the modules
		beforeEach(module("lootMocks", "ogComponents"));

		// Configure & compile the object under test
		beforeEach(inject(function(_controllerTest_) {
			controllerTest = _controllerTest_;
			ogInputNumberController = controllerTest("ogInputNumberController");
		}));

		describe("formattedToRaw", function() {
			it("should return 0 if the value is blank", function() {
				ogInputNumberController.formattedToRaw("").should.equal(0);
			});

			it("should return 0 if the value contains no numerics", function() {
				ogInputNumberController.formattedToRaw("-abcd.e").should.equal(0);
			});

			it("should strip any non-numerics (except periods & dashes) and return the remaining number", function() {
				ogInputNumberController.formattedToRaw("-1a2b3c4d.e5f").should.equal(-1234.5);
			});
		});

		it("should expose the formattedToRaw function on the controller instance", function() {
			ogInputNumberController.formattedToRaw.should.deep.equal(ogInputNumberController.ogInputNumberController.formattedToRaw);
		});

		describe("rawToFormatted", function() {
			it("should return the passed value unchanged", function() {
				var value = "test value";
				ogInputNumberController.ogInputNumberController.rawToFormatted(value).should.equal(value);
			});
		});
	});
})();