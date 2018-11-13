/**
 * @fileoverview Capture Employment Details.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'jquery',
        'knockout',
        'pubsub',
        'navigation',
        'viewModels/address',
        'notifier',
        'ccConstants',
        'ccPasswordValidator',
        'CCi18n',
        'swmRestClient',
        'ccRestClient',
        'koValidate',
        'spinner',
        'ccResourceLoader!global/profile.registration.controller',
        'ccResourceLoader!global/hc.constants'

    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (
        $,
        ko,
        PubSub,
        navigation,
        Address,
        notifier,
        CCConstants,
        CCPasswordValidator,
        CCi18n,
        swmRestClient,
        CCRestClient,
        koValidate,
        spinner,
        profileRegisterController,
        constants
    ) {
        "use strict";
        var REGISTRATION_STATE = 'REGISTRATION_EMPLOYMENT_DETAILS_STATE';
        var NOTIFIER_ID = 'globalProfileupdateController';

        var PERM_EMPLOYED = 1;
        var SELF_EMPLOYED = 2;
        var PENSION = 3;

        var INCOME_TEST = 100000;
        var APPROVED_CLASS = 'approved';
        var visibilityMatrix = [
            [true, true], //start
            [true, true], //perm
            [false, true], //self
            [false, false] //pension
        ];
        return {
            WIDGET_ID: "profileEmploymentDetails",

            inputVisibility: ko.observableArray([true, true]),
            employmentStatus: ko.observable(1),
            employmentStatusText: ko.observable(null),
            workName: ko.observable(null),
            workPhone: ko.observable(null),
            grossMonthlyIncome: ko.observable(null),
            netMonthlyIncome: ko.observable(null),
            additionalMonthlyIncome: ko.observable(null),
            totalLivingExpenses: ko.observable(null),

            //validation flags
            workNameInvalid: ko.observable(false),
            workPhoneInvalid: ko.observable(false),
            employmentInvalid: ko.observable(false),
            grossIncomeInvalid: ko.observable(false),
            netIncomeInvalid: ko.observable(false),
            additionalMonthlyIncomeInvalid: ko.observable(false),
            livingExpenseInvalid: ko.observable(false),
            formValid: ko.observable(false),

            grossMonthlyIncomeLessThanZero: ko.observable(false),
            netIncomeLessThanZero: ko.observable(false),
            netIncomeExceedgrossIncome: ko.observable(false),
            livingExpenseLessThanZero: ko.observable(false),
            livingExpenseExceedNetIncome: ko.observable(false),

            isViewVisible: ko.observable(false),
            submitButtonDisabled: ko.observable(false),
            beforeAppear: function () {
                var widget = this;
                widget.setUserState(1);
                widget.netIncomeInvalid(false);
                profileRegisterController.showModule(widget, REGISTRATION_STATE, function (registerObj) {
                    widget.isViewVisible(registerObj.show);
                });
                //  testing
                // widget.employmentStatus(1);
                // widget.workName('LEEDIUM');
                // widget.workPhone('+31 1234567890');
                // widget.grossMonthlyIncome(2000);
                // widget.netMonthlyIncome(1500);
                // widget.additionalMonthlyIncome(200);
                // widget.totalLivingExpenses(400);

                $(document).ready(function () {

                    $(document).on('keypress', '#workPhone, #grossMonthlyIncome, #netMonthlyIncome, #additionalMonthlyIncome, #totalLivingExpenses', function (evt) {
                        // Only allow numbers to be entered
                        evt = evt ? evt : window.event;
                        var charCode = evt.which ? evt.which : evt.keyCode;
                        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                            return false;
                        }
                        return true;
                    });

                });
            },

            onLoad: function (widget) {
                $.Topic(constants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL).subscribe(function () {
                    widget.validateForm();
                });

                widget.reset = function (value) {
                    widget.inputVisibility([true, true]);
                    widget.employmentStatus(0);
                    widget.employmentStatusText(null);
                    widget.workName(null);
                    widget.workPhone(null);
                    widget.grossMonthlyIncome(null);
                    widget.netMonthlyIncome(null);
                    widget.additionalMonthlyIncome(null);
                    widget.totalLivingExpenses(null);

                    //validation flags
                    widget.workNameInvalid(false);
                    widget.workPhoneInvalid(false);
                    widget.employmentInvalid(false);
                    widget.grossIncomeInvalid(false);
                    widget.netIncomeInvalid(false);
                    widget.additionalMonthlyIncomeInvalid(false);
                    widget.livingExpenseInvalid(false);
                    widget.formValid(false);
                    widget.isViewVisible(false);


                    //
                    widget.grossMonthlyIncomeLessThanZero(false); //Bul to update / Set rules
                    widget.netIncomeLessThanZero(false); //Bul to update / Set rules
                    widget.netIncomeExceedgrossIncome(false); //Bul to update / Set rules
                    widget.livingExpenseLessThanZero(false); //Bul to update / Set rules
                    widget.livingExpenseExceedNetIncome(false); //Bul to update / Set rules

                };

                //INTERFACES
                widget.updateProfile = function () {
                    var data = {
                        "employmentCompanyName": widget.workName(),
                        "employmentContactNumber": widget.workPhone(),
                        "employmentStatus": widget.employmentStatus(),
                        "netIncome": widget.netMonthlyIncome(),
                        "extraIncome": widget.additionalMonthlyIncome(),
                        "grossMonthlyIncome": widget.grossMonthlyIncome(),
                        "totalExpenses": widget.totalLivingExpenses()
                    };
                    $.Topic(constants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST).publish({
                        widget: widget,
                        data: data
                    });
                };

                /**
                 * Validates Gross/Net Income values.
                 * @param widget
                 * @param event
                 * @returns {boolean}
                 */
                widget.validateIncomeValue = function (widget, event) {
                    var target = $(event.target);
                    var netIncome = null;
                    var grossIncome = null;
                    var returnVal = false;

                    function validateIncome(net, gross) {
                        if (net && gross) {
                            widget.netIncomeInvalid(false);
                            widget.grossIncomeInvalid(false);
                            widget.grossMonthlyIncomeLessThanZero(false);
                            widget.netIncomeLessThanZero(false);
                            widget.netIncomeExceedgrossIncome(false);

                            var netVal = parseFloat(net.val());
                            var grossVal = parseFloat(gross.val());
                            if (isNaN(grossVal)) {
                                widget.grossIncomeInvalid(true);
                            }
                            if (grossVal < 1) {
                                widget.grossMonthlyIncomeLessThanZero(true);
                            }
                            if (netVal < 1) {
                                widget.netIncomeLessThanZero(true);
                            }

                            if (netVal > grossVal) {
                                widget.netIncomeExceedgrossIncome(true);
                            }

                            if ((netVal > 0 && isNaN(grossVal)) || isNaN(netVal)) {
                                widget.netIncomeInvalid(true);
                            }
                        }
                    }

                    if (target[0].id === "grossMonthlyIncome") {
                        netIncome = $('#netMonthlyIncome');
                        grossIncome = target;
                    } else if (target[0].id === "netMonthlyIncome") {
                        grossIncome = $('#grossMonthlyIncome');
                        netIncome = target;
                    }

                    if (event.keyCode >= 48 && event.keyCode <= 57) {
                        if (!target.hasClass(APPROVED_CLASS) && event.delegateTarget.valueAsNumber >= INCOME_TEST) {
                            var answer = confirm('Income stated of ' + event.delegateTarget.valueAsNumber + ' is quite high.\n Would you like to proceed?');
                            if (answer) {
                                target.addClass(APPROVED_CLASS);
                                returnVal = true;
                            } else {
                                target[0].value = target[0].value.substring(0, 5);
                                returnVal = false;
                            }
                        } else if (target.hasClass(APPROVED_CLASS) && event.delegateTarget.valueAsNumber < INCOME_TEST) {
                            target.removeClass(APPROVED_CLASS);
                            returnVal = true;
                        }
                    }
                    validateIncome(netIncome, grossIncome);
                    return returnVal;
                };

                widget.validateExpensesValue = function (widget, event) {
                    var target = $(event.target);
                    var livingExpenses = null;
                    var netIncome = null;
                    var returnVal = true;

                    function validateExpenses(expenses, net) {
                        if (livingExpenses && net) {
                            widget.netIncomeInvalid(false);
                            widget.livingExpenseInvalid(false);
                            widget.livingExpenseLessThanZero(false);
                            widget.livingExpenseExceedNetIncome(false);

                            var expensesVal = parseFloat(expenses.val());
                            var netVal = parseFloat(net.val());

                            if (isNaN(expensesVal)) {
                                widget.livingExpenseInvalid(true);
                            }
                            if (expensesVal < 1) {
                                widget.livingExpenseLessThanZero(true);
                            }

                            if (expensesVal > netVal) {
                                widget.livingExpenseExceedNetIncome(true);
                            }
                        }
                    }

                    if (target[0].id === "totalLivingExpenses") {
                        livingExpenses = $('#totalLivingExpenses');
                        netIncome = $('#netMonthlyIncome');
                        //livingExpenses = target;
                    }

                    validateExpenses(livingExpenses, netIncome);
                    return returnVal;
                };

                widget.setUserState = function (userIndex) {
                    if (userIndex === 0) {
                        widget.employmentInvalid(true);
                    } else {
                        widget.employmentInvalid(false);
                    }
                    widget.inputVisibility(visibilityMatrix[userIndex]);
                    switch (userIndex) {
                        case PERM_EMPLOYED:
                            break;
                        case SELF_EMPLOYED:
                            widget.workName(null);

                            break;
                        case PENSION:
                            widget.workName(null);
                            widget.workPhone(null);
                            break;
                    }
                    //commented out when converting to radio buttons
                    //widget.employmentStatus(userIndex);
                };

                //commented out when converting to radio buttons
                widget.employmentStatusChange = function (obj, event) {
                    //var selectedIndex = event.delegateTarget.options.selectedIndex;
                    //widget.setUserState(selectedIndex)
                };
                widget.employmentStatusChange2 = function (selectedIndex, selectedVal) {
                    widget.employmentStatus(selectedVal);
                    widget.setUserState(selectedIndex);
                };

                widget.validateForm = function () {
                    var formValid = true;
                    widget.submitButtonDisabled(formValid);

                    if (widget.employmentStatus() === 0) {
                        widget.employmentInvalid(true);
                    } else {
                        widget.employmentInvalid(false);
                    }

                    if (widget.workName() === null) {
                        widget.workNameInvalid(true);
                    } else {
                        widget.workNameInvalid(false);
                    }

                    if (widget.workPhone() === null || $('#workPhone')[0].validity.patternMismatch) {
                        widget.workPhoneInvalid(true);
                    } else {
                        widget.workPhoneInvalid(false);
                    }

                    if (widget.grossMonthlyIncome() === null || $('#grossMonthlyIncome')[0].validity.patternMismatch) {
                        widget.grossIncomeInvalid(true);
                    } else {
                        widget.grossIncomeInvalid(false);
                    }

                    if (widget.grossMonthlyIncome() < 1 && widget.grossMonthlyIncome() !== null) {
                        widget.grossMonthlyIncomeLessThanZero(true);
                    } else {
                        widget.grossMonthlyIncomeLessThanZero(false);
                    }

                    if (widget.netMonthlyIncome() === null || $('#netMonthlyIncome')[0].validity.patternMismatch) {
                        widget.netIncomeInvalid(true);
                    } else {
                        widget.netIncomeInvalid(false);
                    }

                    if (widget.netMonthlyIncome() < 1 && widget.netMonthlyIncome() !== null) {
                        widget.netIncomeLessThanZero(true);
                    }

                    if (parseInt(widget.netMonthlyIncome()) > parseInt(widget.grossMonthlyIncome())) {
                        widget.netIncomeExceedgrossIncome(true);
                    }
                    else {
                        widget.netIncomeExceedgrossIncome(false);
                    }

                    // if (widget.grossMonthlyIncome() < 0 || widget.grossMonthlyIncome() === null) {
                    //     widget.grossIncomeInvalid(true);
                    // } else {
                    //     widget.netIncomeInvalid(false);
                    // }

                    if (widget.totalLivingExpenses() > widget.netMonthlyIncome()) {
                        widget.livingExpenseExceedNetIncome(true);
                    }
                    else {
                        widget.livingExpenseExceedNetIncome(false);
                    }

                    if (widget.additionalMonthlyIncome() === "" || widget.additionalMonthlyIncome() === null) {
                        widget.additionalMonthlyIncome(0);
                        widget.additionalMonthlyIncomeInvalid(false);
                    }

                    //if (widget.additionalMonthlyIncome() < 0 || widget.additionalMonthlyIncome() === null) {
                    //    widget.additionalMonthlyIncomeInvalid(true);
                    //} else {
                    //    widget.additionalMonthlyIncomeInvalid(false);
                    //}

                    if (widget.totalLivingExpenses() < 0 || widget.totalLivingExpenses() === null || $('#totalLivingExpenses')[0].validity.patternMismatch) {
                        widget.livingExpenseInvalid(true);
                    } else {
                        widget.livingExpenseInvalid(false);
                    }

                    if (parseInt(widget.totalLivingExpenses()) > parseInt(widget.netMonthlyIncome())) {
                        widget.livingExpenseExceedNetIncome(true);
                    }
                    else {
                        widget.livingExpenseExceedNetIncome(false);
                    }

                    formValid = formValid && !widget.employmentInvalid();
                    switch (widget.employmentStatus()) {
                        case PERM_EMPLOYED:
                            formValid = formValid &&
                                !widget.workNameInvalid() &&
                                !widget.workPhoneInvalid();
                            break;

                        case SELF_EMPLOYED:
                            formValid = formValid &&
                                !widget.workPhoneInvalid();
                            break;
                    }

                    formValid = formValid &&
                        (!widget.grossIncomeInvalid() &&
                        !widget.netIncomeInvalid() &&
                        !widget.additionalMonthlyIncomeInvalid() &&
                        !widget.livingExpenseInvalid() &&
                        !widget.livingExpenseExceedNetIncome() &&
                        !widget.grossMonthlyIncomeLessThanZero() &&
                        !widget.netIncomeLessThanZero() &&
                        !widget.netIncomeExceedgrossIncome() &&
                        !widget.livingExpenseLessThanZero() &&
                        !widget.livingExpenseExceedNetIncome());

                    widget.formValid(formValid);
                    widget.submitButtonDisabled(formValid);

                    return formValid;
                };

                widget.formSubmit = function (obj, event) {
                    if (widget.validateForm()) {
                        widget.updateProfile();
                    } else {
                        notifier.sendError(NOTIFIER_ID, 'Affordability page is incomplete, please review and resubmit.', true);
                    }
                };
            }
        };
    }
);
