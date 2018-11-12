/**
 * @fileoverview Checkout Buttons Widget.
 * THIS WIDGET IS DEPRECIATED (DO NOT USE)
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'ccResourceLoader!global/hc.ui.functions',
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
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/profile.checkout.controller',
        'pageLayout/order'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (
        hcUIfuncions,
        ko,
        pubsub,
        navigation,
        Address,
        notifier,
        CCConstants,
        CCPasswordValidator,
        CCi18n,
        swmRestClient,
        CCRestClient,
        cartDynamicPropertiesApp,
        paymentViewModel,
        hcCheckoutController,
        Order
    ) {
        "use strict";

        var VISIBLE_STATE = 'cash_terms';
        var CASH = 'cash';
        var CASH_TERMS = 'cash_terms';
        var CARD = 'card';
        var TERMS = 'terms';
        var _widget;

        return {
            visibleState: VISIBLE_STATE,
            WIDGET_ID: "profileCheckoutButtons",
            isViewVisible: ko.observable(false),
            paymentVM: paymentViewModel.getInstance(),
            nextButton: ko.observable('Continue'),
            nextButtonCss: ko.observable(null),
            checkoutType: ko.observable(-1),
            isCheckoutCardValid: ko.observable(true),
            isRegistrationComplete: ko.observable(false),
            cartData: ko.observable(''),
            buttonDisabled: ko.observable(true),
            isCashPaymentBackup: ko.observable(''),
            isPayingByCashBackup: ko.observable(''),

            /**
             * Executes on page change forces the widgets to appear in DOM
             */
            beforeAppear: function () {
                var widget = this;
                var state = hcCheckoutController.showModule(widget, VISIBLE_STATE);
                widget.isRegistrationComplete(state.registered);
                if (state.paymentState === TERMS) {
                    widget.nextButtonCss('blueButton');
                    widget.paymentVM.paymentType(widget.paymentVM.PAYMENT_TYPE_TERMS);
                    widget.paymentVM.statementsAccountNumber(null);
                    widget.paymentVM.statementsAccountType(null);
                }
                widget.isViewVisible(state.show);
            },

            /**
             * Executes when widget gets instantiated with model
             * @param widget
             */
            onLoad: function (widget) {
                _widget = widget;
                /**
                 * Resets component when navigation away
                 * @param cartProps
                 */
                widget.reset = function () {
                    widget.buttonDisabled(false);
                    widget.isCheckoutCardValid(true);
                    widget.nextButtonCss(null);
                    widget.isViewVisible(false);
                    widget.paymentVM.paymentType()
                    widget.isRegistrationComplete(false);
                };

                //   if shipping for the region is "no-ship"
                widget.paymentVM.isShippingBlocked.subscribe(function(val){
                    console.log('isShippingBlocked',val)
                });

                /**
                 * Callback when the place order/next steps button is clicked
                 * @param _widget
                 */
                widget.nextButtonClick = function () {
                    var pType = CASH_TERMS;
                    widget.disableButton();
                    switch (widget.paymentVM.paymentType()) {
                        case CARD:
                            pType = CASH;
                            widget.order().validateCheckoutPaymentDetails();
                            break;
                        case TERMS:
                            pType = TERMS;
                            break;
                    }
                    $.Topic('PROFILE_CHECKOUT_VALIDATE').publish(pType);
                };

                /**
                 * Stub for the controller
                 * @returns {boolean}
                 */
                widget.validate = function () {
                    return true;
                };

                /**
                 * Callback returns
                 * @param validationObject
                 */
                widget.onValidateOrder = function (validationObject) {
                    if (validationObject.valid) {
                        if (widget.paymentVM.paymentType() !== 'card') {
                            widget.handleTermsOrder();
                        } else {
                            widget.handleCardOrder();
                        }
                    } else {
                        widget.enableButton();
                    }
                };

                /**
                 * Handles the cash, credit, debit, etf deposit, order flow
                 */
                widget.handleCardOrder = function () {
                    var EmailProp = "Credit Card";
                    this.order().errorFlag = false;
                    notifier.clearError("checkoutOrderSummary");
                    //widget.cart().dynamicProperties()[0].value(EmailProp);
                    for (var i = 0; i < widget.cart().dynamicProperties().length; i++) {
                        var hcPersonNo = widget.cart().dynamicProperties()[i];
                        if (hcPersonNo.id() == "hcPersonNo") {
                            widget.cart().dynamicProperties()[i].value(EmailProp);
                        }
                    }
                    widget.order().paymentDetails().isCardPaymentDisabled(false);
                    widget.cart().clearAllUnpricedErrorsAndSaveCart();
                    if (this.cart().currentOrderState() == CCConstants.PENDING_PAYMENTS || this.cart().currentOrderState() == CCConstants.PENDING_PAYMENT_TEMPLATE) {
                        console.log('...IS PAYMENT PENDING');
                        this.order().handlePayments();
                    }
                    else {
                        $.Topic('MYGATE_OVERLAY_BEGIN').publish({
                            copy: 'Loading...'
                        });

                        // CCRestClient.request(CCConstants.ENDPOINT_GET_ORDER,
                        //     null,
                        //     function (res) {
                        //         var create = false;
                        //         if (typeof (res) === 'undefined') {
                        //             create = true;
                        //         } else {
                        //             widget.cart().currentOrderId(res.orderId);
                        //         }
                        //         if (create) {
                        //             widget.order().handlePlaceOrder()
                        //         } else {
                        //             widget.order().createOrder();
                        //         }
                        //         widget.showDelayedSpinner(200);
                        //     }, function (err) {
                        //         console.log('err:', err);
                        //     },
                        //     'current')


                        if (widget.order().order()) {
                            CCRestClient.request(CCConstants.ENDPOINT_GET_PAYMENT_GROUP,
                                null,
                                function (res) {
                                    console.log('ENDPOINT_GET_PAYMENT_GROUP_STATUS:',res)
                                    if(res.stateAsString === CCConstants.PAYMENT_GROUP_STATE_AUTHORIZED_FAILED){
                                        widget.order().createOrder();
                                    }
                                }, function (err) {
                                    console.log('err:', err);
                                },
                                widget.order().order().payments[0].paymentGroupId
                            )
                        }else{
                            widget.order().handlePlaceOrder();
                        };


                        // widget.order().updatePayments([]);
                        // if(widget.order().)
                        // widget.order().handlePlaceOrder();
                    }
                };

                /**
                 * Handles the terms order flow
                 */
                widget.handleTermsOrder = function () {
                    if (widget.pageContext().pageType.name === "checkout") {
                        var payments = [{
                            "type": "generic",
                            "customProperties": {
                                "paymentType": widget.paymentVM.paymentType(),
                                "bankSelected": widget.paymentVM.bankSelected(),
                                "statementsOption": widget.paymentVM.statementsOption(),
                                "statementsAccountNumber": widget.paymentVM.statementsAccountNumber(),
                                "statementsAccountType": widget.paymentVM.statementsAccountType()
                            }
                        }];
                        var customerGroup = "hidedocs";
                        for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                            var element = widget.user().dynamicProperties()[i];
                            if (element.id() === "customerGroup") {
                                if (element.value() != null) {
                                    if (element.value() === 4) {
                                        customerGroup = "showdocs"
                                    }
                                }
                                break;
                            }
                        }
                        var EmailProp = widget.paymentVM.paymentType() + " <br /> " +
                            widget.paymentVM.bankSelected();
                        if (widget.paymentVM.paymentType() == TERMS) {
                            var TermsTotal = 0;
                            for (var i = 0; i < widget.cart().allItems().length; i++) {
                                var element = widget.cart().allItems()[i];
                                TermsTotal += element.hcTermsCharge() * element.quantity();
                            }
                            EmailProp = "terms|" + TermsTotal;
                        }
                        EmailProp = EmailProp + "|" + customerGroup;
                        for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                            var hcPersonNo = widget.user().dynamicProperties()[i];
                            if (hcPersonNo.id() == "hcPersonNo") {
                                if (hcPersonNo.value() == undefined) {
                                    EmailProp = EmailProp + "|Contact us for your reference";
                                } else {
                                    EmailProp = EmailProp + "|" + hcPersonNo.value();
                                }
                                break;
                            }
                        }
                        //widget.cart().dynamicProperties()[0].value(EmailProp);
                        for (var i = 0; i < widget.cart().dynamicProperties().length; i++) {
                            var hcPersonNo = widget.cart().dynamicProperties()[i];
                            if (hcPersonNo.id() == "hcPersonNo") {
                                widget.cart().dynamicProperties()[i].value(EmailProp);
                            }
                        }


                        // CCRestClient.request(CCConstants.ENDPOINT_GET_ORDER,
                        //     null,
                        //     function (res) {
                        //         var create = false;
                        //         if (typeof (res) === 'undefined') {
                        //             create = true;
                        //         } else {
                        //             widget.cart().currentOrderId(res.orderId);
                        //         }
                        //         widget.cart().clearAllUnpricedErrorsAndSaveCart();
                        //         widget.order().paymentDetails().isCardPaymentDisabled(true);
                        //         widget.order().updatePayments(payments);
                        //
                        //         if (create) {
                        //             widget.order().createOrder();
                        //         } else {
                        //             widget.order().handlePlaceOrder()
                        //         }
                        //         widget.showDelayedSpinner(200);
                        //     }, function (err) {
                        //         console.log('err:', err);
                        //     },
                        //     'current')
                        widget.cart().clearAllUnpricedErrorsAndSaveCart();
                        widget.order().paymentDetails().isCardPaymentDisabled(true);
                        widget.order().updatePayments(payments);
                        widget.order().handlePlaceOrder();
                    }
                };

                //  hack for spinner disappearing on terms payment (not pretty but works)
                widget.showDelayedSpinner = function (delay) {
                    setTimeout(function () {
                        $('#main > .row:nth-child(3)').append('<div id="checkoutSpinner" class=""><div class="cc-spinner-css" style="top:50%;left:44%"><span class="ie-show">Loading...</span><div class="cc-spinner-css-1"></div><div class="cc-spinner-css-2"></div><div class="cc-spinner-css-3"></div><div class="cc-spinner-css-4"></div><div class="cc-spinner-css-5"></div><div class="cc-spinner-css-6"></div><div class="cc-spinner-css-7"></div><div class="cc-spinner-css-8"></div><div class="cc-spinner-css-9"></div><div class="cc-spinner-css-10"></div><div class="cc-spinner-css-11"></div><div class="cc-spinner-css-12"></div></div></div>')
                    }, delay);
                };

                /**
                 * Disables button on click
                 * Will renable if fields are invalid
                 */
                widget.disableButton = function () {
                    widget.buttonDisabled(true);
                };

                /**
                 * Enables button on click
                 * Will renable if fields are invalid
                 */
                widget.enableButton = function () {
                    widget.buttonDisabled(false);
                };

                $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).subscribe(function (data) {
                    widget.enableButton();
                });

                $.Topic('PROFILE_CHECKOUT_VALIDATE_COMPLETE').subscribe(function (obj) {
                    widget.onValidateOrder(obj);
                });

                $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).subscribe(function () {
                    widget.enableButton()
                });
                $.Topic(pubsub.topicNames.CHECKOUT_NOT_VALID).subscribe(function () {
                    widget.enableButton();
                });
            }
        };
    }
);
