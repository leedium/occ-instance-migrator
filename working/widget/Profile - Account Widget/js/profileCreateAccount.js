/**
 * @fileoverview Create Account Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['jquery', 'moment', 'knockout', 'pubsub', 'navigation', 'viewModels/address', 'notifier', 'ccConstants', 'ccPasswordValidator', 'CCi18n', 'swmRestClient', 'ccRestClient', 'ccResourceLoader!global/hc.ui.functions'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function ( $, moment, ko, PubSub, navigation, Address, notifier, CCConstants, CCPasswordValidator, CCi18n, swmRestClient, CCRestClient, hcUIfunctions) {

        "use strict";

        return {

            WIDGET_ID: "profileCreateAccount",

            IdentityDocumentUsed: ko.observable(null),
            IdentityDocumentUsedId: ko.observable(0),
            IdentityDocumentUsedTitle: ko.observable(null),
            pubsubData: ko.observable(null),

            idNumber: ko.observable(null),
            idNumberValidation: ko.observable(null),
            profileValidation: ko.observable(null),
            emailValidation: ko.observable(null),
            passwordValidation: ko.observable(null),
            passwordConfirmValidation: ko.observable(null),
            mobileNumberValidation: ko.observable(null),
            titleValidation: ko.observable(null),
            firstNameValidation: ko.observable(null),
            lastNameValidation: ko.observable(null),
            dobValidation: ko.observable(null),

            dobDD: ko.observable(null),
            dobMM: ko.observable(null),
            dobYYYY: ko.observable(null),
            firstName: ko.observable(null),
            lastName: ko.observable(null),
            password: ko.observable(null),
            email: ko.observable(null),
            wantsEmail: ko.observable(false),
            passwordConfirm: ko.observable(null),
            mobileNumber: ko.observable(null),
            mobileNumberExtention: ko.observable(null),

            isViewVisible: ko.observable(false),

            // TODO : Consolidate this list for Global use!!
            // TODO : Consolidate this list for Global use!!
            mobileNumberExtentionSelect: ko.observableArray([
                {id: 'ZA', text: 'South Africa'},
                {id: 'NA', text: 'Namibia'},
                {id: 'LS', text: 'Lesotho'},
                {id: 'SZ', text: 'Swaziland'},
                {id: 'BW', text: 'Botswana'},
                {id: 'ZM', text: 'Zambia'}
            ]),

            title: ko.observable(null),
            // TODO : Consolidate this list for Global use!!
            // TODO : Consolidate this list for Global use!!
            titleSelect: ko.observableArray([
                {id: 'female_Mrs', text: 'Mrs'},
                {id: 'female_Miss', text: 'Miss'},
                {id: 'female_Ms', text: 'Ms'},
                {id: 'male_Mr', text: 'Mr'}
            ]),

            beforeAppear: function (page) {
                var widget = this;
                widget.setIdentityDocumentUsed();

                $.Topic('profileNavigationProgress_Init').publish({"widget": "profileCreateAccount"});

                $.Topic('profileNavigationProgress_PreInit').subscribe(function (data) {
                    $.Topic('profileNavigationProgress_Init').publish({"widget": "profileCreateAccount"});
                });

                //Notify profileRegistrationController that this component is ready
                $.Topic('PROFILE_REGISTER_COMPONENT_LOADED').publish({
                    key: 'PROFILE_REGISTER_ACCOUNT_VIEW',
                    widget: widget
                });

            },
            // beforeAppear() ---------------------------------------

            onLoad: function (widget) {
                var self = this;

                /**
                 * REQUIRED
                 * @param value
                 */
                widget.reset = function() {
                    widget.IdentityDocumentUsed(null);
                    widget.IdentityDocumentUsedId(0);
                    widget.IdentityDocumentUsedTitle(null);
                    widget.pubsubData(null);

                    widget.idNumber(null);
                    widget.idNumberValidation(null);
                    widget.profileValidation(null);
                    widget.emailValidation(null);
                    widget.passwordValidation(null);
                    widget.passwordConfirmValidation(null);
                    widget.mobileNumberValidation(null);
                    widget.titleValidation(null);
                    widget.firstNameValidation(null);
                    widget.lastNameValidation(null);
                    widget.dobValidation(null);

                    widget.dobDD(null);
                    widget.dobMM(null);
                    widget.dobYYYY(null);
                    widget.firstName(null);
                    widget.lastName(null);
                    widget.password(null);
                    widget.email(null);
                    widget.wantsEmail(false);
                    widget.passwordConfirm(null);
                    widget.mobileNumber(null);
                    widget.mobileNumberExtention(null);

                    widget.isViewVisible(false);
                };


                widget.formSubmit = function (evt) {
                    console.log('form submit');
                    widget.validateForm();
                };

                widget.validateForm = function () {
                    // widget.pubsubData(data);

                    // Do screen validations
                    var valid = widget.doScreenValidations();

                    console.log('subscribe profileCreateAccount_Save', valid);

                    // Save data
                    if (valid) {
                        widget.createProfile();
                    }
                    else {
                        widget.returnControl(false);
                    }
                };

                // events
                widget.idType_Change = function (obj, event) {
                    if (event.originalEvent) {
                        // user changed
                        widget.setIdentityDocumentUsed();

                    } else {
                        // programatically changed
                    }
                };

                widget.checkKeyPress = function (data, event) {
                    hcUIfunctions.followTabKeyPress(event, event.currentTarget);
                };

                widget.togglePasswordView = function (data, event) {
                    var open = 'glyphicon-eye-open';
                    var close = 'glyphicon-eye-close';

                    var id = $(event.currentTarget).attr("passwordCtrl");
                    var ctrl = $('#' + id)[0];

                    if (ctrl.type === "password") {
                        ctrl.type = "text";
                        event.currentTarget.classList.remove(open);
                        event.currentTarget.className += ' ' + close;
                    }
                    else {
                        ctrl.type = "password";
                        event.currentTarget.classList.remove(close);
                        event.currentTarget.className += ' ' + open;
                    }
                };

                // this will change to a computed field, once idType gets bound to an observable
                widget.setIdentityDocumentUsed = function () {
                    this.IdentityDocumentUsed($("#idType option:selected").text());
                    this.IdentityDocumentUsedTitle($("#idType option:selected").text() + ' Number');
                    this.IdentityDocumentUsedId($("#idType").val());
                };

                // this will change once idType gets bound to an observable
                widget.isSAIdTypeUsed = ko.computed(function () {
                    return this.IdentityDocumentUsedId() === '0';
                }, widget);

                widget.dob = ko.computed(function () {
                    return widget.dobDD() + '-' + widget.dobMM() + '-' + widget.dobYYYY();
                }, widget);

                // Sceen validations
                widget.doScreenValidations = function () {
                    widget.clearScreenValidations();
                    var result = true;

                    // Mobile
                    if (!widget.title() || widget.title() === '') {
                        widget.titleValidation('Please select a value');
                        result = false;
                    }

                    // Firstname
                    if (!widget.firstName() || widget.firstName() === '') {
                        widget.firstNameValidation('This is a required field');
                        result = false;
                    }

                    // Lastname
                    if (!widget.lastName() || widget.lastName() === '') {
                        widget.lastNameValidation('This is a required field');
                        result = false;
                    }

                    // Mobile
                    if (!widget.mobileNumber() || widget.mobileNumber() === '') {
                        widget.mobileNumberValidation('This is a required field');
                        result = false;
                    }

                    // ID number
                    if (!widget.idNumber() || widget.idNumber() === '') {
                        widget.idNumberValidation('This is a required field');
                        result = false;
                    }
                    else {
                        if (widget.isSAIdTypeUsed() && !hcUIfunctions.validateSAID(widget.idNumber())) {
                            widget.idNumberValidation('This is not a valid SA Id number');
                            result = false;
                        }
                    }

                    // Date of birth
                    if (!widget.isSAIdTypeUsed()) {
                        if ((!widget.dobDD() || widget.dobDD() === '') ||
                            (!widget.dobMM() || widget.dobMM() === '') ||
                            (!widget.dobYYYY() || widget.dobYYYY() === '')) {
                            widget.dobValidation('These are required fields');
                            result = false;
                        }
                        else {
                            // validate entered data
                            if (!moment(widget.dob(), 'DD-MM-YYYY').isValid()) {
                                widget.dobValidation('Please enter a valid date (dd-mm-yyyy)');
                                result = false;
                            }
                        }
                    }

                    // Email
                    if (!widget.email() || widget.email() === '') {
                        widget.emailValidation('This is a required field');
                        result = false;
                    }

                    // Password
                    if (!widget.password() || widget.password() === '') {
                        widget.passwordValidation('This is a required field');
                        result = false;
                    } else {
                        // Compare
                        if (widget.password() !== widget.passwordConfirm()) {
                            widget.passwordValidation('Your entered passwords do not match');
                            result = false;
                        }
                    }

                    // Password confirmation
                    if (!widget.passwordConfirm() || widget.passwordConfirm() === '') {
                        widget.passwordConfirmValidation('This is a required field');
                        result = false;
                    }

                    return result;
                };

                widget.hasScreenValidations = ko.computed(function () {
                    return widget.idNumberValidation() ||
                        widget.dobValidation() ||
                        widget.emailValidation() ||
                        widget.passwordValidation() ||
                        widget.passwordConfirmValidation() ||
                        widget.firstNameValidation() ||
                        widget.lastNameValidation() ||
                        widget.mobileNumberValidation() ||
                        widget.titleValidation() ||
                        widget.profileValidation();
                }, widget);

                widget.clearScreenValidations = function () {
                    widget.idNumberValidation(null);
                    widget.dobValidation(null);
                    widget.passwordValidation(null);
                    widget.passwordConfirmValidation(null);
                    widget.emailValidation(null);
                    widget.firstNameValidation(null);
                    widget.lastNameValidation(null);
                    widget.mobileNumberValidation(null);
                    widget.titleValidation(null);
                    widget.profileValidation(null);
                };

                widget.createProfile = function () {
                    // Create account
                    $.Topic('PROFILE_REGISTER_SPINNER_SHOW').publish();

                    var endpoint = CCConstants.ENDPOINT_CREATE_PROFILE;
                    var user_gender = widget.title().split('_')[0];
                    var user_title = widget.title().split('_')[1];

                    var data = {
                        "firstName": widget.firstName(),
                        "lastName": widget.lastName(),
                        "password": widget.password(),
                        "receiveEmail": widget.wantsEmail() ? "yes" : "no",
                        "dateOfBirth": widget.dob(),
                        "email": widget.email(),
                        "shippingAddresses": [],
                        "roles": [{"function": "buyer"}],
                        "gender": user_gender,
                        "title": user_title,
                        "active": true,
                        "documentNumber": widget.idNumber(),
                        "documentType": widget.IdentityDocumentUsed(),
                        "mobileTelephoneCountry": widget.mobileNumberExtention(),
                        "mobileTelephoneNumber": widget.mobileNumber()
                    };

                    CCRestClient.request(endpoint, data,
                        // success
                        function (result) {
                            // Proceed to log the user in
                            console.log('client ' + data.id + ' created');
                            widget.user().login(widget.email());
                            widget.user().password(widget.password());

                            if (widget.user().validateLogin()) {

                                $.Topic(PubSub.topicNames.USER_LOGIN_FAILURE).subscribe(function subscribeLoginFail(e) {
                                    widget.profileValidation('OH NO!! An error occured while signing you in.');
                                    widget.returnControl(false);
                                    $.Topic(PubSub.topicNames.USER_LOGIN_FAILURE).unsubscribe(subscribeLoginFail);
                                });

                                $.Topic(PubSub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function subscribeLoginSuccess(e) {
                                    $.Topic(PubSub.topicNames.USER_LOGIN_SUCCESSFUL).unsubscribe(subscribeLoginSuccess);


                                    $.Topic('PROFILE_REGISTER_LOAD_VIEW').publish({
                                        from: 'PROFILE_REGISTER_ACCOUNT_VIEW',
                                        to: 'PROFILE_REGISTER_EMPLOYMENT_VIEW'
                                    });


                                    console.log('subscribe account ' + PubSub.topicNames.USER_LOGIN_SUCCESSFUL);
                                });


                                $.Topic(PubSub.topicNames.USER_LOGIN_SUBMIT).publishWith(widget.user(), [{message: "success"}]);
                            }
                            else {
                                // TODO : WHAT DO WE DO HERE?
                                // TODO : WHAT DO WE DO HERE?
                                // TODO : WHAT DO WE DO HERE?
                                widget.profileValidation('OH NO!! An error occured while signing you in.');
                                widget.returnControl(false);
                            }
                        },
                        // error
                        function (error) {
                            $.Topic('PROFILE_REGISTER_SPINNER_HIDE').publish();


                            if (error.errorCode === '22005' ||
                                error.errorCode === '92103') {
                                // password issues
                                widget.passwordValidation(error.message)
                            }
                            else if (error.errorCode === '22003' ||
                                error.errorCode === '22006' ||
                                error.errorCode === '23006') {
                                // username issues
                                widget.emailValidation(error.message)
                            }
                            else {
                                widget.profileValidation(error.message);
                            }

                            console.log('error:', error);

                            widget.returnControl(false);
                        }
                    );
                };

                widget.returnControl = function (res) {
                    // var data = widget.pubsubData();
                    // var result = res ? 'success' : 'error';
                    // $.Topic(data.callback).publish({
                    //     'result': result,
                    //     'previousStep': data.previousStep,
                    //     'nextStep': data.nextStep
                    // });
                    console.log('returnControl', res);
                };

                // Subscriptions
                $.Topic('profileCreateAccount_Save').subscribe(function (data) {
                    widget.pubsubData(data);
                    console.log('subscribe profileCreateAccount_Save');
                    // Do screen validations
                    var res = widget.doScreenValidations();

                    // Save data
                    if (res) {
                        widget.createProfile();
                    }
                    else {
                        widget.returnControl(false);
                    }
                });

                // $.Topic(PubSub.topicNames.USER_LOGIN_FAILURE).subscribe(function (e) {
                //     // TODO : WHAT DO WE DO HERE?
                //     // TODO : WHAT DO WE DO HERE?
                //     // TODO : WHAT DO WE DO HERE?
                //     widget.profileValidation('OH NO!! An error occured while signing you in.');
                //     widget.returnControl(false);
                // });
                //
                // $.Topic(PubSub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function (e) {
                //     console.log('subscribe account ' + PubSub.topicNames.USER_LOGIN_SUCCESSFUL);
                //     window.location.href = "/register";
                //
                //     // caters for user creating an account on this widget, or
                //     // user logs in from the top-toolbar. So need to return control
                //     // back to registration buttons.
                //     //widget.returnControl(true);
                // });
            }
            // onLoad() ---------------------------------------

        };
    }
);
