/**
 * @fileoverview Bank Payment Widget.
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
        var CASH = 'cash';
        var CARD = 'card';
        var TERMS = 'terms';
        var PAYMENT_EFT = 'eft';
        var PAYMENT_DEPOSIT = 'deposit';


        return {
            WIDGET_ID: "profileBankPayment",
            visibleState: VISIBLE_STATE,
            cartProps: null,
            isEasyPayVisible: ko.observable(false),
            isBankVisible: ko.observable(false),
            isViewVisible: ko.observable(false),
            paymentVM: paymentViewModel.getInstance(),
            bankSelected: ko.observable(null),
            EFT_ABSA_ID: ko.observable('bank_absa'),
            EFT_FNB_ID: ko.observable('bank_fnb'),
            EFT_NEDBANK_ID: ko.observable('bank_nedbank'),
            EFT_STANDARD_BANK_ID: ko.observable('bank_standard'),
            EFT_OTHER_ID: ko.observable('bank_other'),
            errorShow: ko.observable(false),
            checkoutState:ko.observable(),
            beforeAppear: function () {
                var widget = this;
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    widget.checkoutState(ready);
                    widget.isViewVisible(ready.show);
                    if (widget.paymentVM.paymentType() === PAYMENT_DEPOSIT || widget.paymentVM.paymentType() === PAYMENT_EFT) {
                        widget.isBankVisible(true);
                    }

                });
            },
            onLoad: function (widget) {

                widget.reset = function () {
                    // widget.bankSelected(null);
                    // widget.paymentVM.bankSelected(null);
                    widget.isViewVisible(false);
                    if (widget.paymentVM.paymentType() === PAYMENT_DEPOSIT || widget.paymentVM.paymentType() === PAYMENT_EFT) {
                        // widget.isBankVisible(false);
                        // widget.isEasyPayVisible(false);
                        console.log(1);
                        widget.isBankVisible(true);
                    }else {
                        // widget.isBankVisible(false);
                        // widget.isEasyPayVisible(false);
                        console.log(2);
                        widget.isBankVisible(false);
                    }


                };
                widget.validate = function () {
                    var result = false;
                    if (widget.paymentVM.paymentType() === PAYMENT_DEPOSIT || widget.paymentVM.paymentType() === PAYMENT_EFT) {
                        if(widget.bankSelected() !== null && typeof (widget.bankSelected()) !== 'undefined'){
                            result = true;
                         }
                    }

                    //  Override for non EFT / DEPOSIT Cash payments
                    // console.log('Bank Payment:',widget.paymentVM.paymentType())
                    if(widget.paymentVM.paymentType() == TERMS || widget.paymentVM.paymentType() === CARD){
                        result = true;
                    }
                    widget.errorShow(!result);
                    return result;
                };
                widget.onCashPaymentSelected = function (viewArray) {
                    widget.bankSelected(null);
                    widget.isBankVisible(viewArray[1] === 1 || viewArray[2] === 1);
                    widget.isEasyPayVisible(viewArray[3] === 1);
                };
                $.Topic('PROFILE_CHECKOUT_CASH_PAYMENT_TYPE_SELECTED').subscribe(function (subViewVisible) {
                    widget.onCashPaymentSelected(subViewVisible);
                });
                widget.bankClick = function (w,evt) {
                    widget.bankSelected(evt.target.value);
                    widget.paymentVM.bankSelected(evt.target.value);
                    widget.validate();
                    return true;
                };
                widget.isEFT = ko.computed(function () {
                    return widget.paymentVM.paymentType() === "eft";
                }, widget);


                widget.isFNB = ko.computed(function () {
                    return widget.bankSelected() === widget.EFT_FNB_ID();
                }, widget);

                widget.isNEDBANK = ko.computed(function () {
                    return widget.bankSelected() === widget.EFT_NEDBANK_ID();
                }, widget);

                widget.isABSA = ko.computed(function () {
                    return widget.bankSelected() === widget.EFT_ABSA_ID();
                }, widget);

                widget.isStandardBank = ko.computed(function () {
                    return widget.bankSelected() === widget.EFT_STANDARD_BANK_ID();
                }, widget);

                widget.isOther = ko.computed(function () {
                    return widget.bankSelected() === widget.EFT_OTHER_ID();
                }, widget);
            }
        };
    }
);
