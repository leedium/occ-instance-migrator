define(
	['jquery', 'knockout'],

	function($,ko) {
		'use strict';

		var SOME_CONSTANT = 1024;
		var _widget;
		var privateMethod = function () {
		};
		return {
		    textInput: ko.observable(),
		    mobileNumberInvalid: ko.observable(false),
		    mobileNumberInvalidRegex: ko.observable(false),
		    callBackOptionInvalid: ko.observable(false),
		    FirstNameInvalid: ko.observable(false),
		    SurnameInvalid: ko.observable(false),
		    mobileEmailNumberInvalid: ko.observable(false),
		    mobileEmailNumberInvalidRegex: ko.observable(false),
		    EmailAddressInvalid: ko.observable(false),
		    HCAccountInvalid: ko.observable(false),
		    HCQuestionInvalid: ko.observable(false),

		    HCAccountNo: ko.observable(''),
		    Surname: ko.observable(''),            
		    firstName: ko.observable(''),
		    EmailAddress: ko.observable(''),
		    Question: ko.observable(''),

		    isContactPhone: ko.observable(true),
		    isContactPhoneThankYou: ko.observable(false),
		    isContactEmailThankYou: ko.observable(false),
		    


			doSomethingWithInput: function () {
			},

			onLoad: function (widget) {
			    _widget = widget;
			},
            
			formSubmit: function (obj, event) {
			    var valid = false;
			    //Validation goes here
			    valid = true;
                
			    if (valid) {
			        _widget.isContactPhoneThankYou(true);
			        window.scrollTo(0, 0);
			    }
			},

			formSubmitEmail: function (obj, event) {
			    var valid = false;
			    //Validation goes here
			    valid = true;

			    if (valid) {
			        _widget.isContactEmailThankYou(true);
			        window.scrollTo(0, 0);
			    }
			},

		    


			changeCallMeBackEmail: function () {
			    _widget.isContactPhone(false);
			    window.scrollTo(0, 0);
			},
			changeCallMeBackPhone: function () {
		        _widget.isContactPhone(true);
		        window.scrollTo(0, 0);
			}

		}
	}
);
