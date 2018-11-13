define(
	['jquery', 'knockout'],

	function($,ko) {
		'use strict';

		var SOME_CONSTANT = 1024;
		var privateMethod = function () {

		};
		return {
			textInput: ko.observable(),
			doSomethingWithInput: function () {
			}
		}
	}
);