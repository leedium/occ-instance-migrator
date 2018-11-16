/**
 * @project homechoice.co.za
 * @file profile-placeorderbutton.js
 * @company leedium
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 11/10/2018
 * @description Exterrnal Placeorder button for checkout page
 **/


define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'jquery',
        'pubsub',
        'ccConstants',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/profile.checkout.controller',
        'ccResourceLoader!global/hc.constants'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (
        ko,
        $,
        pubsub,
        CCConstants,
        cartDynamicPropertiesApp,
        paymentViewModel,
        hcCheckoutController,
        hcConstants
    ) {

        "use strict";
        var buttonStyleState = {
            "cash": {
                disabled: false
            },
            "cash_terms": {
                disabled: false
            },
            "terms": {
                disabled: false,
                blueButton: true
            },
            "disable": {
                disabled: true
            }
        };

        function isAValue (val) {
            return (val !== '' && val !== null) && (typeof(val) !== 'undefined' || val === 'undefined');
        }

        var VISIBLE_STATE = 'cash_terms';
        var CASH = 'cash';
        var CARD = 'card';
        var TERMS = 'terms';
        var NO_CLICK_DELAY = 1000;
        var PAYMENT_EFT = 'eft';
        var PAYMENT_DEPOSIT = 'deposit';
        var PAYMENT_CARD = 'card';

        return {
            nextButtonCss: ko.observable(null),
            isViewVisible: ko.observable(false),
            visibleState: VISIBLE_STATE,
            paymentState: ko.observable(),
            checkoutState: ko.observable(),
            onLoad: function (widget) {
                widget.handleCreateOrder = function (e) {
                    widget.order().enableOrderButton(false);
                    $.Topic(hcConstants.PROFILE_CHECKOUT_TRIGGER_PLACE_ORDER).publish();
                };
                widget.reset = function () {
                    widget.isViewVisible(false);
                };
                // widget.order().enableOrderButton(true);
                widget.validate = function () {
                    return true;
                };

                $.Topic(hcConstants.PROFILE_CHECKOUT_VALIDATE_COMPLETE).subscribe(function (obj) {
                    if (!obj.valid) {
                        requestTimeout(NO_CLICK_DELAY, function () {
                            widget.order().enableOrderButton(true);
                        })
                    }
                });

                var pVM = paymentViewModel.getInstance();
                pVM.paymentType.subscribe(function (value) {
                    if (isAValue(value) &&
                        widget.checkoutState().paymentState === CASH) {
                        if (value === PAYMENT_CARD) {
                            widget.order().enableOrderButton(true);
                        } else {
                            widget.order().enableOrderButton(false);
                        }
                    }

                });
                pVM.bankSelected.subscribe(function (value) {
                    var paymentType = pVM.paymentType();
                    if ((isAValue(value) && paymentType !== PAYMENT_CARD) &&
                        widget.checkoutState().paymentState === CASH) {
                        widget.order().enableOrderButton(true);
                    }
                });
                widget.order().enableOrderButton(false);
            },

            beforeAppear: function () {
                var widget = this;
                var pVM = paymentViewModel.getInstance();
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function (ready) {
                    widget.isViewVisible(ready.show);
                    widget.checkoutState(ready);

                    console.log('PLEASE DISABLE',ready, pVM.paymentType(), isAValue(pVM.paymentType()), isAValue(pVM.bankSelected()));
                    if (
                        (isAValue(pVM.paymentType()) && isAValue(pVM.bankSelected())) ||
                        pVM.paymentType() === CARD ||
                        ready.paymentState == TERMS
                        )
                    {
                        console.log('ENABLED');
                        widget.order().enableOrderButton(true);
                    }
                    else{
                        widget.order().enableOrderButton(false);
                    }
                });
            },
        }
    }
);
