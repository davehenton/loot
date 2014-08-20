(function () {
	"use strict";

	// Declare the lootMocks module and it's dependencies
	var mod = angular.module("lootMocks", [
		"ogAngularMocks",
		"ogComponentsMocks",
		"accountsMocks",
		"authenticationMocks",
		"categoriesMocks",
		"payeesMocks",
		"schedulesMocks",
		"securitiesMocks",
		"transactionsMocks"
	]);

	// Declare the mockDependencies provider
	mod.provider("mockDependencies", function($provide, $injector) {
		var provider = this;

		// Replaces a given set of dependencies with mock versions
		provider.load = function(dependencies) {
			// Process each dependency
			angular.forEach(dependencies, function(dependency) {
				// Replace the original with the mock version
				$provide.value(dependency, $injector.invoke($injector.get(dependency + "MockProvider").$get));
			});
		};

		provider.$get = function() {
			return provider;
		};
	});

	// Declare the directiveTest helper
	mod.factory("directiveTest", ["$rootScope", "$compile",
		function($rootScope, $compile) {
			var helper = {};

			// Configures the name of the directive and the element tag (and optionally, any contents)
			helper.configure = function(directive, tagName, content) {
				helper.directive = directive;
				helper.tagName = tagName;
				helper.content = content || "";

				switch (tagName) {
					case "tr":
					case "td":
					case "th":
					case "thead":
					case "tbody":
					case "tfoot":
						helper.container = "table";
						break;

					default:
						helper.container = "div";
				}

				// Create a new scope
				helper.scope = $rootScope.$new();
			};

			// Compiles the directive and returns an array containing
			// - the DOM element into which the directive was compiled
			// - the scope object that it was compiled with
			helper.compile = function(options) {
				var directive;

				options = options || {};

				// Configure the directive with any passed options
				directive = helper.directive + (options.hasOwnProperty(helper.directive) ? "=\"" + options[helper.directive] + "\"" : "");
				directive = Object.keys(options).reduce(function(memo, option) {
					if (option !== helper.directive) {
						memo += " " + option + "=\"" + options[option] + "\"";
					}
					return memo;
				}, directive);

				// Compile the directive into the specified element tag using the new scope, and return the element
				helper.element = $compile("<" + helper.container + "><" + helper.tagName + " ng-model=\"model\" " + directive + ">" + helper.content + "</" + helper.tagName + "></" + helper.container + ">")(helper.scope).find(helper.tagName);
			};

			return helper;
		}
	]);

	// Declare the controllerTest helper
	mod.factory("controllerTest", ["$rootScope", "$controller",
		function($rootScope, $controller) {
			// Loads the controller and returns a scope object
			return function(controller) {
				// Create a new scope
				var scope = $rootScope.$new();

				// Load the controller
				$controller(controller, {
					$scope: scope
				});

				return scope;
			};
		}
	]);
})();
