define(
	['jquery', 'knockout', 'notifier', 'ccRestClient', 'pubsub'],

	function ($, ko, notifier, CCRestClient, pubsub) {
	    'use strict';

	    var SOME_CONSTANT = 1024;
	    var _widget;
	    var NAMES_MIN_LENGTH = 3;
	    var cellphoneMaxLength = 10;

	    var privateMethod = function () {
	    };


	    return {
	        // Validation flags
	        textInput: ko.observable(),
	        mobileNumberInvalid: ko.observable(false),
	        mobileNumberInvalidLength: ko.observable(false),
	        callBackOptionInvalid: ko.observable(false),
	        callBackOption: ko.observable(''),
	        FirstNameInvalid: ko.observable(false),
	        FirstNameInvalidLength: ko.observable(false),
	        SurnameInvalid: ko.observable(false),
	        SurnameInvalidLength: ko.observable(false),
	        mobileNumberCode: ko.observable(1),
	        mobileNumberExample: ko.observable(null),
	        cellphoneNumberCode: ko.observable(1),
	        cellphoneNumberExample: ko.observable(null),
	        cellphoneNumberMissing: ko.observable(false),
	        cellphoneNumberInvalidLength: ko.observable(false),
	        EmailAddressInvalid: ko.observable(false),
	        HCAccountInvalid: ko.observable(false),
	        HCAccountInvalidLength: ko.observable(false),
	        HCQuestionInvalid: ko.observable(false),
	        HCAccountNo: ko.observable(''),
	        Surname: ko.observable(''),
	        firstName: ko.observable(''),
	        cellphoneNumber: ko.observable(''),
	        mobileNumber: ko.observable(''),
	        EmailAddress: ko.observable(''),
	        Question: ko.observable(''),
	        isContactPhone: ko.observable(true),
	        isContactPhoneThankYou: ko.observable(false),
	        isContactEmailThankYou: ko.observable(false),



	        doSomethingWithInput: function () {
	        },
	        beforeAppear: function () {

	            $(document).ready(function () {
	                $("#mobileCodeChange").trigger('change');
	                $(document).on('keypress', '#mobileNumber, #cellphoneNumber, #HCAccountNo', function (evt) {
	                    // Only allow numbers to be entered
	                    evt = evt ? evt : window.event;
	                    var charCode = evt.which ? evt.which : evt.keyCode;
	                    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
	                        return false;
	                    }
	                    return true;
	                });

	                //$(document).on('keypress', '#firstName, #Surname', function (evt) {
	                //    //var inputValue = event.which;
	                //    event = (event) ? event : window.event;
	                //    var charCode = (event.which) ? event.which : event.keyCode;
	                //    console.log(charCode);
	                //    // allow letters and whitespaces only.
	                //    if (!(charCode >= 65 && charCode <= 123) && (charCode != 32 && charCode != 0 && charCode != 8 && charCode != 9)) {
	                //        // event.preventDefault();
	                //        return false;
	                //    }
	                //    return true;
	                //});

	                $(document).on('keydown', '#firstName, #Surname', function (e) {
	                    if ($.inArray(e.keyCode, [8, 9, 27, 13, 32, 46]) !== -1 ||
                            (e.keyCode == 65 || e.keyCode == 86 || e.keyCode == 67 || e.keyCode == 90) && (e.ctrlKey === true || e.metaKey === true) ||
                            e.keyCode >= 35 && e.keyCode <= 40) {
	                        return;
	                    }

	                    // Ensure that it is a letter and stop the keypress
	                    if (e.keyCode < 65 || e.keyCode > 90) {
	                        e.preventDefault();
	                    }
	                });

	            });
	        },

	        onRender: function (element, context) {
	            
	        },

	        onLoad: function (widget) {
	            _widget = widget;

	            

	            $.Topic(pubsub.topicNames.PAGE_READY).subscribe(function onCartReady() {
	                _widget.textInput(null);
	                _widget.mobileNumberInvalid(false);
	                _widget.mobileNumberInvalidLength(false);
	                _widget.callBackOptionInvalid(false);
	                _widget.callBackOption('');
	                _widget.FirstNameInvalid(false);
	                _widget.FirstNameInvalidLength(false);
	                _widget.SurnameInvalid(false);
	                _widget.SurnameInvalidLength(false);
	                _widget.mobileNumberCode(1);
	                _widget.mobileNumberExample(null);
	                _widget.cellphoneNumberCode(1);
	                _widget.cellphoneNumberExample(null);
	                _widget.cellphoneNumberMissing(false);
	                _widget.cellphoneNumberInvalidLength(false);
	                _widget.EmailAddressInvalid(false);
	                _widget.HCAccountInvalid(false);
	                _widget.HCAccountInvalidLength(false);
	                _widget.HCQuestionInvalid(false);
	                _widget.HCAccountNo('');
	                _widget.Surname('');
	                _widget.firstName('');
	                _widget.cellphoneNumber('');
	                _widget.mobileNumber('');
	                _widget.EmailAddress('');
	                _widget.Question('');
	                _widget.isContactPhone(true);
	                _widget.isContactPhoneThankYou(false);
	                _widget.isContactEmailThankYou(false);

	            });
	            
	            _widget.callBackOption.subscribe(function () {
	                widget.callBackOptionInvalid(false);
	            });



	            // Call back option selection change
	            //widget.callBackOptionChange = function (selectedVal) {
	            //    widget.callBackOptionInvalid(false);
	            //    widget.callBackOption(''),

	            //    function isCallbackOptionMissing() {
	            //        (widget.callBackOption() === null || widget.callBackOption() === "") ? widget.callBackOptionInvalid(true) : widget.callBackOptionInvalid(false);
	            //    }

	            //    isCallbackOptionMissing();

	            //    widget.callBackOption(selectedVal);
	            //};

	            // Cellphone number validations
	            widget.validateMobileNumber = function (widget, event) {
	                widget.mobileNumberInvalid(false);
	                widget.mobileNumberInvalidLength(false);

	                function ismobileNumberNumberMissing() {
	                    (widget.mobileNumber() === null || widget.mobileNumber() === "") ? widget.mobileNumberInvalid(true) : widget.mobileNumberInvalid(false);
	                }

	                function ismobileNumberInvalidLength() {
	                    (widget.mobileNumber().length < cellphoneMaxLength) ? widget.mobileNumberInvalidLength(true) : widget.mobileNumberInvalidLength(false);
	                }

	                ismobileNumberNumberMissing();

	                if (!widget.mobileNumberInvalid()) {
	                    ismobileNumberInvalidLength();
	                }
	            };

	            // Cellphone number code selection change
	            widget.mobileCodeChange = function (obj, event) {
	                var selectedIndex = event.delegateTarget.options.selectedIndex;
	                var selectedIndexValue = event.delegateTarget.options[selectedIndex].value;
	                var mobileNumber = document.getElementById("mobileNumber");
	                var mobilePattern = "";
	                var exampleMsg = "(e.g. ";
	                var maxLength = "";

	                if (selectedIndexValue == null || selectedIndexValue == undefined)
	                    selectedIndexValue = 1;

	                switch (selectedIndexValue) {
	                    case "1":
	                        mobilePattern = new RegExp("^[0-9]{9}$|^(0)([0-9]{9})$");
	                        maxLength = 10;
	                        exampleMsg += "0812345678";
	                        break;
	                    case "2":
	                    case "3":
	                    case "8":
	                        mobilePattern = new RegExp("^[0-9]{8}$");
	                        maxLength = 8;
	                        exampleMsg += "71123456";
	                        break;
	                    case "4":
	                        mobilePattern = new RegExp("^[0-9]{9,10}$");
	                        maxLength = 8;
	                        exampleMsg += "0811234567";
	                        break;
	                    case "14":
	                        mobilePattern = new RegExp("^[0-9]{9}$");
	                        maxLength = 9;
	                        exampleMsg += "951234567";
	                        break;
	                    default:
	                        mobilePattern = new RegExp("^[0-9]{9}$|^(0)([0-9]{9})$");
	                        maxLength = 10;
	                        exampleMsg += "0812345678";
	                }

	                mobileNumber.setAttribute("pattern", mobilePattern.source); 
	                mobileNumber.setAttribute("maxlength", maxLength);
	                widget.mobileNumberExample(exampleMsg + ")");
	                cellphoneMaxLength = maxLength;

	            };


	            // First name validations
	            widget.validateFirstName = function (widget, event) {
	                widget.FirstNameInvalid(false);
	                widget.FirstNameInvalidLength(false);

	                function isFirstNameMissing() {
	                    (widget.firstName() === null || widget.firstName() === "") ? widget.FirstNameInvalid(true) : widget.FirstNameInvalid(false);
	                }

	                function isFirstNameInvalidLength() {
	                    (widget.firstName().length < NAMES_MIN_LENGTH) ? widget.FirstNameInvalidLength(true) : widget.FirstNameInvalidLength(false);
	                }

	                isFirstNameMissing();

	                if (!widget.FirstNameInvalid()) {
	                    isFirstNameInvalidLength();
	                }
	            };


	            // Surname validations
	            widget.validateSurname = function (widget, event) {
	                widget.SurnameInvalid(false);
	                widget.SurnameInvalidLength(false);

	                function isSurnameMissing() {
	                    (widget.Surname() === null || widget.Surname() === "") ? widget.SurnameInvalid(true) : widget.SurnameInvalid(false);
	                }

	                function isSurnameInvalidLength() {
	                    (widget.Surname().length < NAMES_MIN_LENGTH) ? widget.SurnameInvalidLength(true) : widget.SurnameInvalidLength(false);
	                }

	                isSurnameMissing();

	                if (!widget.SurnameInvalid()) {
	                    isSurnameInvalidLength();
	                }
	            };

	            // Cellphone number code selection change
	            widget.cellphoneCodeChange = function (obj, event) {
	                var selectedIndex = event.delegateTarget.options.selectedIndex;
	                var selectedIndexValue = event.delegateTarget.options[selectedIndex].value;
	                var cellphoneNumber = document.getElementById("cellphoneNumber");
	                var mobilePattern = "";
	                var exampleMsg = "(e.g. ";
	                var maxLength = "";

	                switch (selectedIndexValue) {
	                    case "1":
	                        mobilePattern = new RegExp("^[0-9]{9}$|^(0)([0-9]{9})$");
	                        maxLength = 10;
	                        exampleMsg += "0812345678";
	                        break;
	                    case "2":
	                    case "3":
	                    case "8":
	                        mobilePattern = new RegExp("^[0-9]{8}$");
	                        maxLength = 8;
	                        exampleMsg += "71123456";
	                        break;
	                    case "4":
	                        mobilePattern = new RegExp("^[0-9]{9,10}$");
	                        maxLength = 8;
	                        exampleMsg += "0811234567";
	                        break;
	                    case "14":
	                        mobilePattern = new RegExp("^[0-9]{9}$");
	                        maxLength = 9;
	                        exampleMsg += "951234567";
	                        break;
	                    default:
	                        mobilePattern = new RegExp("^[0-9]{9}$|^(0)([0-9]{9})$");
	                        maxLength = 10;
	                        exampleMsg += "0812345678";
	                }

	                cellphoneNumber.setAttribute("pattern", mobilePattern.source); ///tale a loooooooook!
	                cellphoneNumber.setAttribute("maxlength", maxLength);
	                widget.cellphoneNumberExample(exampleMsg + ")");
	                cellphoneMaxLength = maxLength;

	            };

	            // Cellphone number validations
	            widget.validateCellphoneNumber = function (widget, event) {
	                widget.cellphoneNumberMissing(false);
	                widget.cellphoneNumberInvalidLength(false);

	                function isCellphoneNumberMissing() {
	                    (widget.cellphoneNumber() === null || widget.cellphoneNumber() === "") ? widget.cellphoneNumberMissing(true) : widget.cellphoneNumberMissing(false);
	                }

	                function isCellphoneNumberInvalidLength() {
	                    (widget.cellphoneNumber().length < cellphoneMaxLength) ? widget.cellphoneNumberInvalidLength(true) : widget.cellphoneNumberInvalidLength(false);
	                }

	                isCellphoneNumberMissing();

	                if (!widget.cellphoneNumberMissing()) {
	                    isCellphoneNumberInvalidLength();
	                }
	            };

	            // Email address validations
	            widget.validateEmailAddress = function (widget, event) {
	                widget.EmailAddressInvalid(false);

	                function isEmailAddressMissing() {
	                    (widget.EmailAddress() === null || widget.EmailAddress() === "" || $('#EmailAddress')[0].validity.typeMismatch) ? widget.EmailAddressInvalid(true) : widget.EmailAddressInvalid(false);
	                }

	                isEmailAddressMissing();
	            };

	            // HC Account validations
	            widget.validateHCAccountNumber = function (widget, event) {
	                widget.HCAccountInvalid(false);

	                function isHCAccountNoMissing() {
	                    (widget.HCAccountNo() === null || widget.HCAccountNo() === "") ? widget.HCAccountInvalid(true) : widget.HCAccountInvalid(false);
	                }

	                function isHCAccountNoInvalidLength() {
	                    (widget.HCAccountNo().length < 9) ? widget.HCAccountInvalidLength(true) : widget.HCAccountInvalidLength(false);
	                }

	                isHCAccountNoMissing();

	                if (!widget.HCAccountInvalid()) {
	                    isHCAccountNoInvalidLength();
	                }
	            };

	        },

	        formSubmit: function (obj, event) {
	            var valid = false;
	            //Validation goes here
	            //valid = true;

	            _widget.callBackOptionInvalid(false);
	            if (_widget.callBackOption() == '')
	                _widget.callBackOptionInvalid(true);


	            if (_widget.mobileNumber() === null || _widget.mobileNumber() === "") {
	                _widget.mobileNumberInvalid(true);
	            } else {
	                _widget.mobileNumberInvalid(false);
	            }
	           
	            valid = !_widget.mobileNumberInvalid() &&
	                    !_widget.callBackOptionInvalid();

	            if (valid) {
	                _widget.isContactPhoneThankYou(true);
					window.scrollTo(0, 0);
					_widget.submitCallMeback();  //  sort data 
	            }

	            else {
	                notifier.sendError(_widget.WIDGET_ID, "The Call Us Back form has errors, please review and resubmit", true);
				}
				
	        },

	        formSubmitEmail: function (obj, event) {
	            var valid = false;
	            //Validation goes here
	            //valid = true;

	            if (_widget.firstName() === null || _widget.firstName() === "") {
	                _widget.FirstNameInvalid(true);
	            } else {
	                _widget.FirstNameInvalid(false);
	            }

	            if (_widget.Surname() === null || _widget.Surname() === "") {
	                _widget.SurnameInvalid(true);
	            } else {
	                _widget.SurnameInvalid(false);
	            }

	            if (_widget.cellphoneNumber() === null || _widget.cellphoneNumber() === "") {
	                _widget.cellphoneNumberMissing(true);
	            } else {
	                _widget.cellphoneNumberMissing(false);
	            }

	            if (_widget.EmailAddress() === null || _widget.EmailAddress() === "") {
	                _widget.EmailAddressInvalid(true);
	            } else {
	                _widget.EmailAddressInvalid(false);
	            }

	            if (_widget.HCAccountNo() === null || _widget.HCAccountNo() === "") {
	                _widget.HCAccountInvalid(true);
	            } else {
	                _widget.HCAccountInvalid(false);
	            }



	            valid = !_widget.FirstNameInvalid() &&
	                    !_widget.SurnameInvalid() &&
	                    !_widget.cellphoneNumberMissing() &&
	                    !_widget.EmailAddressInvalid() &&
	                    !_widget.HCAccountInvalid();

	            if (valid) {
	                _widget.isContactEmailThankYou(true);
	                window.scrollTo(0, 0);
	            }
	            else {
	                notifier.sendError(_widget.WIDGET_ID, "The Email Us Back form has errors, please review and resubmit", true);
	            }
	        },

	        changeCallMeBackEmail: function () {
	            _widget.isContactPhone(false);
	            window.scrollTo(0, 0);
	            
	            $('.callmebacklady img').addClass('hidden');
	            $("#cellphoneNumberCode").trigger('change');
	            
	        },
	        changeCallMeBackPhone: function () {
	            _widget.isContactPhone(true);
	            window.scrollTo(0, 0);

	            $('.callmebacklady img').removeClass('hidden');
	            
	            
	            
			},
			
			submitCallMeback: function()
			{
				var CC; 
				if(_widget.callBackOption() == "Order") {
					CC = '7387'; 				
				} else 				{
					CC = '7406'; 
				}

				var dataObject = 	{
					"CC": CC,
					"SRC": "SMSPortal",
					"Phonenumber": _widget.mobileNumber(),
					"IncomingData": "1"
				}
				console.log('ajax init', JSON.stringify(dataObject)); 

				$.ajax({
					type: 'POST',
					contentType: "application/json",
					dataType: 'json',
					url: "/ccstorex/custom/v1/hc/callmeback/phoneme",
					data: JSON.stringify(dataObject),
					headers: {
						'hc-env': CCRestClient.previewMode,
						"Authorization": "Bearer " + CCRestClient.tokenSecret
					},
					success: function (data) {
						// show thankyou panel. 
						console.log('ajax sucess', data); 
					},
					error: function (x) {
						// add error panel
						console.log('ajax error', x); 
					}
				});
			}

	    }
	}
);
