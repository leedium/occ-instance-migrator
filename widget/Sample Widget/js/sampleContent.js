define (
	// Dependencies
	['knockout'],

	// Module definition
	function (ko) {
		"use strict";

		return {
			isMorning : ko.observable(false),
			onLoad: function(widget) {
			},
			beforeAppear: function(page) {
				var date = new Date();
				if (date.getHours() < 12) {
					this.isMorning(true);
				}
			}
		};
	}
	);