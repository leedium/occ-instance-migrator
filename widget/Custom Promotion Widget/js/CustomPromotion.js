/**
 * @fileoverview Promotion Widget.
 *
 *
 * This widget is useful for handling promotion/coupon related functionality.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['knockout', 'ccConstants', 'pubsub', 'koValidate', 'notifier',
        'storeKoExtensions', 'ccKoValidateRules', 'CCi18n',
        'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/profile.checkout.controller'
    ],
    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, CCConstants, pubsub, koValidate, notifier,
              storeKoExtensions, rules, CCi18n, paymentViewModel, cartDynamicPropertiesApp, hcCheckoutController) {
        "use strict";
        var VISIBLE_STATE = 'cash_terms';

        return {
            visibleState:VISIBLE_STATE,
            cartProps: null,
            promoCode: ko.observable(),
            isViewVisible: ko.observable(false),
            isApplyCodeClicked: ko.observable(false),

            /**
             * beforeAppear function
             */
            beforeAppear: function () {
                var widget = this;
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    widget.isViewVisible(ready.show);
                });
            },

            /**
             * onLoad function
             */
            onLoad: function(widget) {
                widget.reset = function(){
                    widget.isViewVisible(false);
                };

                widget.validate = function() {
                    return true;
                };

                // Clear the coupon input field when successfully applied.
                $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).subscribe(function() {
                    var errorMessage = widget.cart().couponErrorMessage();
                    // do not clear the input promotion code when there is some coupon error.
                    if (!errorMessage || errorMessage === '') {
                        widget.promoCode('');
                    }
                });

                // Clears coupon input field and error message after logout
                $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).subscribe(function() {
                    widget.promoCode('');
                    widget.cart().couponErrorMessage('');
                });
            },

            /**
             * This function handles functionality of applying a coupon
             */
            handleApplyCoupon: function() {
                var widget = this;
                if (widget.cart().couponErrorMessage()) {
                    widget.cart().couponErrorMessage('');
                }

                if (widget.promoCode() && widget.promoCode().trim() !== '') {
                    // check if the coupon has already been applied.
                    if (widget.couponAlreadyApplied(widget.promoCode().trim())) {
                        widget.cart().couponErrorMessage(widget.translate(CCConstants.COUPON_APPLY_ERROR_DUPLICATE_CODE));
                    } else {
                        widget.cart().addCoupon(widget.promoCode().trim());
                    }
                    // disable Apply Code button for a specific time when clicked.
                    widget.handleEnableApplyCodeButton();
                }
            },

            /**
             * This function returns true if the couponCode is already applied.
             *
             */
            couponAlreadyApplied: function(couponCode) {
                var widget = this;
                var alreadyApplied = false;
                if (widget.cart().coupons() && widget.cart().coupons().length > 0) {
                    var couponCount = widget.cart().coupons().length;
                    for (var i = 0; i < couponCount; i++) {
                        if (widget.cart().coupons()[i].code() === couponCode) {
                            alreadyApplied = true;
                            break;
                        }
                    }
                }
                return alreadyApplied;
            },

            /**
             * This function is used to handle disable Apply Code button for
             *     a specific time when it is clicked and enable again.
             */
            handleEnableApplyCodeButton: function() {
                var widget = this;
                widget.isApplyCodeClicked(true);
                setTimeout(enableApplyCodeButton, 2000);
                function enableApplyCodeButton() {
                    widget.isApplyCodeClicked(false);
                }
            }
        };
    }
);
