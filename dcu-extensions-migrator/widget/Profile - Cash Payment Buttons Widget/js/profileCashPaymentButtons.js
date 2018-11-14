/**
 * @fileoverview Cash Payment Buttons Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'ccConstants',
        'pubsub',
        'koValidate',
        'notifier',
        'storeKoExtensions',
        'ccKoValidateRules',
        'CCi18n',
        'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/profile.checkout.controller'
    ],
    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (
        ko,
        CCConstants,
        pubsub,
        koValidate,
        notifier,
        storeKoExtensions,
        rules,
        CCi18n,
        paymentViewModel,
        cartDynamicPropertiesApp,
        hcCheckoutController) {
        "use strict";

        var VISIBLE_STATE = 'cash';

        var CARD = 'card';
        var EFT = 'eft';
        var DEPOSIT = 'deposit';
        var EASYPAY = 'easypay';

        return {
            visibleState: VISIBLE_STATE,
            cartProps: null,
            WIDGET_ID: "profileCashPaymentButtons",
            paymentVM: paymentViewModel.getInstance(),
            isViewVisible: ko.observable(false),
            cashPaymentType: ko.observable(), //ko.observable(CARD),
            cartPropsInstance: null,
            isCashPaymentEnabled: ko.observable(false),  // true = card, false = eft, deposit or easypay
            checkoutType: ko.observable(), // -1=mixed/invalid, 0=empty, 1=cash, 2=terms // MAKE THESE CONSTANTS!!!!
            cashEnabledCountries: [],
            paymentIndex: ko.observable(),
            registrationComplete: ko.observable(),
            beforeAppear: function () {
                var widget = this;
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    widget.isViewVisible(ready.show);
                    if(ready.show){
                        widget.paymentVM.paymentType(widget.cashPaymentType());
                    }
                });
            },

            /**
             * when hc.cart.dynamicproperties.app is ready
             * @param widget
             */
            onLoad: function (widget) {
                // widget.paymentVM.paymentType();
                /**
                 * Called by controller to reset this component's visibility and state
                 * in the order placement flow
                 */
                widget.reset = function () {
                    // widget.paymentVM.paymentType();
                    widget.isViewVisible(false);
                };

                /**
                 * validate widget
                 */
                widget.validate = function () {
                    var valid = (widget.paymentVM.paymentType() !== '') &&
                        (widget.paymentVM.paymentType() !== null) &&
                        (typeof(widget.paymentVM.paymentType()) !== 'undefined');
                    // console.log('profileCashPaymentButtons validate ',valid, widget.cashPaymentType());
                    return (valid)
                };

                /**
                 * Sets the paymentType state (card, terms), and then
                 * dispatches a configuration array of the view state
                 * [card, eft, deposit, easypay]
                 * [0|1, 0|1, 0|1, 0|1]
                 */
                widget.setState = function () {
                    var paymentTypeArray = [0, 0, 0, 0];
                    var isCashPayment = true;
                    switch (widget.paymentVM.paymentType()) {
                        case CARD:
                            widget.order().paymentDetails().isCardPaymentDisabled(false);
                            paymentTypeArray[0] = 1;
                            isCashPayment = false;
                            break;
                        case EFT:
                        case DEPOSIT:
                            paymentTypeArray[1] = 1;
                            paymentTypeArray[2] = 1;
                            break;
                        case EASYPAY:
                            paymentTypeArray[3] = 1;
                            break;
                        default:
                            break;
                    }
                    $.Topic('PROFILE_CHECKOUT_CASH_PAYMENT_TYPE_SELECTED').publish(paymentTypeArray);
                };

                /**
                 * Handler for the cash payment type radio button list
                 * @param widget
                 * @param event
                 * @returns {boolean}
                 */
                widget.cashPaymentTypeClick = function (widget, event) {
                    widget.cashPaymentType(event.delegateTarget.defaultValue);
                    widget.paymentVM.paymentType(event.delegateTarget.defaultValue);
                    widget.paymentVM.bankSelected(null)
                    widget.setState();
                    return true;
                };
            }
        };
    }
);
