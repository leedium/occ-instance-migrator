/**
 * @fileoverview Information Panel Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'ccResourceLoader!global/profile.checkout.controller',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, hcCheckoutController, cartDynamicPropertiesApp) {
        "use strict";
        var VISIBLE_STATE = 'cash_terms';
        return {
            WIDGET_ID: "checkoutInfoPanel",
            visibleState: VISIBLE_STATE,
            cartProps: null,
            isViewVisible: ko.observable(false),
            paymentType: ko.observable(false),
            paymentState: ko.observable(false),
            message: ko.observable(false),
            registrationComplete: ko.observable(false),

            /**
             * Checks controller to determine visibility
             */
            beforeAppear: function () {
                var widget = this;
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    widget.paymentState(ready.paymentState);
                    widget.registrationComplete(ready.registered);
                    if (!widget.user().loggedIn() || (!ready.registered && ready.paymentState !== 'cash') || ready.paymentState === 'empty' || (widget.cart().allItems().length === 0)) {
                        widget.isViewVisible(true);
                    }
                });
            },

            /**
             * Define view level function on the model
             * @param widget
             */
            onLoad: function (widget) {
                widget.reset = function () {
                    widget.isViewVisible(false);
                };
                widget.validate = function(){
                    return true;
                }
            }
        };
    }
);
