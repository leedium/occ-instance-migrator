/**
 * @fileoverview Terms Payment Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['knockout', 'pubsub', 'navigation', 'viewModels/address', 'notifier', 'ccConstants', 'ccPasswordValidator',
        'CCi18n', 'swmRestClient', 'ccRestClient', 'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, PubSub, navigation, Address, notifier, CCConstants, CCPasswordValidator,
              CCi18n, swmRestClient, CCRestClient, paymentViewModel, cartDynamicPropertiesApp) {

        "use strict";

        var OTHER = "other";

        return {

            WIDGET_ID: "profileTermsPayment",
            paymentVM: paymentViewModel.getInstance(),
            termsBank: ko.observable(),
            errorBankShow: ko.observable(false),
            errorAccountNumberShow: ko.observable(false),
            errorAccountTypeShow: ko.observable(false),
            isViewVisible: ko.observable(false),

            beforeAppear: function (page) {
                var widget = this;

                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                    widget.cartProps = hcCartController.isMixedCart();
                    $.Topic('PROFILE_CHECKOUT_COMPONENT_LOADED').publish({
                        key: 'PROFILE_CHECKOUT_TERMS_PAYMENT_VIEW',
                        widget: widget,
                        cartProps: ko.observable(widget.cartProps),
                        validation: 'terms',
                        paymentVM: widget.paymentVM
                    });
                });

            },

            onLoad: function (widget) {
                //INTERFACE
                /**
                 * Resets the widget
                 */
                widget.reset = function (checkoutControllerObj) {
                    if (!widget.user().loggedIn() ||
                        checkoutControllerObj.cartProps.paymentIndex !== 2 ||
                        !checkoutControllerObj.registrationComplete) {
                        widget.isViewVisible(false);
                    } else {
                        widget.paymentVM.paymentType(widget.paymentVM.PAYMENT_TYPE_TERMS);
                        widget.isViewVisible(true);
                    }
                };

                widget.validate = function () {
                    //var self = this;
                    //var valid = true;
                    //var statementsAccountNumber = null;
                    //var statementsAccountType = null;
//
                    //var bankOptionSelectedValid = (widget.termsBank() !== '' && widget.termsBank() !== null && typeof(widget.termsBank()) !== 'undefined');
//
                    //self.errorBankShow(!bankOptionSelectedValid);
//
                    //valid = valid && bankOptionSelectedValid;
//
//
                    //if (widget.paymentVM.statementsAccountNumber()) {
                    //    statementsAccountNumber = widget.paymentVM.statementsAccountNumber().trim();
                    //}
//
                    //if (widget.paymentVM.statementsAccountType()) {
                    //    statementsAccountType = widget.paymentVM.statementsAccountType();
                    //}
//
                    //if (widget.isAutoCollectEnabled()) {
                    //    var isStatementsAccountValid = (statementsAccountNumber !== null && statementsAccountNumber !== '');
                    //    valid = valid && isStatementsAccountValid;
                    //    self.errorAccountNumberShow(!isStatementsAccountValid);
//
                    //    var statementsAccountTypeValid = statementsAccountType !== null && statementsAccountType !== '0';
                    //    valid = valid && statementsAccountTypeValid;
                    //    self.errorAccountTypeShow(!statementsAccountTypeValid)
                    //}
//
                    //return valid;
                    return true; //override, as widget is now no longer in use... moved to thankyou.
                };
                //END INTERFACE

                widget.termsBankClick = function () {
                    widget.paymentVM.statementsOption(widget.termsBank());
                    if (widget.termsBank() === OTHER) {
                        widget.paymentVM.statementsAccountNumber(null);
                        widget.paymentVM.statementsAccountType(null);
                    }
                    return true;
                };

                widget.isAutoCollectEnabled = ko.computed(function () {
                    return widget.termsBank() !== OTHER;
                }, widget);

                /* TESTNG PURPOSES */
                widget.updateProfile = function () {
                    // Update account
                    var endpoint = CCConstants.ENDPOINT_UPDATE_CUSTOMER;
                    var data = {
                        "customerGroup": 1
                    };
                    CCRestClient.request(endpoint, data,
                        // success
                        function (result) {
                            console.log('UPDATE customerGroup OK!');
                        },
                        // error
                        function (error) {
                            console.log('UPDATE customerGroup ERROR! ' + error);
                        }
                    );
                };
                /* TESTNG PURPOSES */
            }
        };
    }
);
