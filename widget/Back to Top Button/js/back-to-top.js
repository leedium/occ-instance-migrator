define (['knockout', 'jquery'],
	function (ko, $) {
		"use strict";

		return {
			onLoad: function(widget) {
			},

			beforeAppear: function(page) {
				$('#back-to-top').click(function() {
					$('body,html').animate({
						scrollTop : 0
					}, 2000);
				});
			}
		};
	}
);