/**
 * @fileoverview Checkout Order Summary Widget.
 *
 * @author
 */
/*global $ */
/*global define */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'pubsub',
        'ccLogger',
        'notifier',
        'spinner',
        'ccConstants',
        'jquery',
        'CCi18n',
        'navigation',
        'viewModels/address',
        'ccPasswordValidator',
        'swmRestClient',
        'ccRestClient',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/profile.checkout.controller',
        'ccResourceLoader!global/hc.constants',
        'pageLayout/order'


    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (
        ko,
        pubsub,
        log,
        notifier,
        spinner,
        CCConstants,
        $,
        CCi18n,
        navigation,
        Address,
        CCPasswordValidator,
        swmRestClient,
        CCRestClient,
        cartDynamicPropertiesApp,
        paymentViewModel,
        hcCheckoutController,
        hcConstants,
        Order
    ) {

        "use strict";

        /**
         * Helper method to
         * @param key
         * @param array
         * @param isObservable
         * @returns {*}
         */
        function getDynamicPropByKey (key, array, isObservable) {
            var len = array.length;
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                var id = isObservable ? item.id() : item.id;
                if (id === key) {
                    return item;
                    break;
                }
            }
            return null;
        }


        var VISIBLE_STATE = 'cash_terms';
        var CASH = 'cash';
        var CASH_TERMS = 'cash_terms';
        var CARD = 'card';
        var TERMS = 'terms';
        var _widget;
        // var SSE_BASE_PATH = 'https://hc.leedium.com/v1/hc';
        var SSE_BASE_PATH = '/ccstorex/custom/v1/hc';


        return {
            isViewVisible: ko.observable(false),
            visibleState: VISIBLE_STATE,
            paymentVM: paymentViewModel.getInstance(),
            nextButtonCss: ko.observable(null),
            paymentState: ko.observable(),
            checkoutType: ko.observable(-1),
            buttonDisabled: ko.observable(true),
            isRegistrationComplete: ko.observable(false),
            subTotal: ko.observable(0).extend({deferred: true}),

            selectedShippingValue: ko.observable(),
            selectedShippingOption: ko.observable(),
            selectedShippingCost: ko.observable(0),
            selectedShippingName: ko.observable(),
            displayShippingOptions: ko.observable(false),
            totalCost: ko.observable(0),
            salesTax: ko.observable(0),
            secondaryCurrencyTaxAmount: ko.observable(0),
            noShippingMethods: ko.observable(false),
            shippingMethodsNewlyLoaded: ko.observable(true),
            shippingOptions: ko.observableArray(),
            errorMsg: ko.observable(),
            invalidShippingRegion: ko.observable(false),
            invalidShippingMethod: ko.observable(false),
            reloadShippingMethods: ko.observable(false),
            skipShipMethodNotification: ko.observable(false),
            persistedLocaleName: ko.observable(),
            isCartPriceUpdated: ko.observable(false),
            removeAdjacentShippingAmount: ko.observable(false),
            shippingMethodsLoaded: ko.observable(false),
            paypalAddressAltered: ko.observable(false),
            skipSpinner: ko.observable(false),
            paypalImageSrc: ko.observable("https://fpdbs.paypal.com/dynamicimageweb?cmd=_dynamic-image"),
            selectedShippingCostInSecondaryCurrency: ko.observable(0),

            // Spinner resources
            pricingIndicator: '#CC-orderSummaryLoadingModal',
            DEFAULT_SHIPPING_ERROR: "No Shipping Method Selected",
            DEFAULT_LOADING_TEXT: "Loading...'",
            pricingIndicatorOptions: {
                parent: '#CC-orderSummaryLoadingModal',
                posTop: '40px',
                posLeft: '30%'
            },

            resourcesLoaded: function (widget) {
                widget.errorMsg(widget.translate('checkoutErrorMsg'));
            },

            onLoad: function (widget) {
                /////////////////  Iovation scripts
                window.io_bbout_element_id = "txtBlackBox"; // populate ioBlackBox in form
                window.io_install_stm = false; // do not install Active X
                window.io_exclude_stm = 12; // do not run Active X
                window.io_install_flash = false; // do not install Flash
                window.io_enable_rip = true; // enable detection of Real IP
                var iovationInput = document.createElement('input');
                iovationInput.type = 'hidden';
                iovationInput.id = window.io_bbout_element_id;
                var iovationScript = document.createElement('script');
                iovationScript.type = 'text/javascript';
                iovationScript.src = 'https://ci-mpsnare.iovation.com/snare.js';
                document.body.appendChild(iovationInput);
                document.body.appendChild(iovationScript);

                /////////////////  homechoice related methods

                /**
                 * Client side request takes a request object and requests services
                 * from Homechoice SSE
                 * @param requestObj
                 */
                widget.request = function (requestObj) {
                    $.ajax({
                        method: requestObj.method,
                        dataType: 'json',
                        url: requestObj.url,
                        withCredentials: true,
                        data: JSON.stringify(requestObj.data),
                        headers: {
                            'Authorization': 'Bearer ' + CCRestClient.tokenSecret,
                            'hc-env': CCRestClient.previewMode,
                            'hc-page': widget.pageContext().page.name,
                            'Content-Type': 'application/json'
                        }
                    })
                        .done(function (res) {
                            requestObj.callbackSuccess.call(widget, res);
                        })
                        .fail(function (err, status) {
                            requestObj.callbackFailure.call(widget, err, status);
                        });
                };
                widget.reset = function () {
                    widget.isViewVisible(false);
                    widget.resetShippingOptions();
                    widget.paymentVM.isShippingBlocked(false);
                };
                widget.validate = function () {
                    if (widget.paymentState() === CASH) {
                        if (this.displayShippingOptions() && !this.cart().isSplitShipping() && !this.selectedShippingValue()) {
                            this.order().errorFlag = true;
                            $('#CC-checkoutOrderSummary-selectedShippingValue').show();
                            notifier.sendError("checkoutOrderSummary", 'Please ensure you have completed all mandatory fields and corrected any invalid entries.', true);
                            return false;
                        }
                    }
                    return true;
                };
                widget.onValidateOrder = function (validationObject) {
                    if (validationObject.valid) {
                        if (widget.paymentVM.paymentType() !== CARD) {
                            widget.handleTermsOrder();
                        } else {
                            widget.handleCardOrder();
                        }
                    } else {
                        if (widget.paymentVM.paymentType() === CARD) {
                            $.Topic('MYGATE_OVERLAY_REMOVE').publish({});
                        }
                        widget.order().enableOrderButton(true);
                    }
                };
                widget.handleCardOrder = function () {
                    var EmailProp = "Credit Card";
                    this.order().errorFlag = false;
                    notifier.clearError("checkoutOrderSummary");

                    var TempProp;
                    for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                        var hcPersonNo = widget.user().dynamicProperties()[i];
                        if (hcPersonNo.id() == "hcPersonNo") {
                            TempProp = hcPersonNo;
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
                    widget.order().paymentDetails().isCardPaymentDisabled(false);
                    widget.cart().clearAllUnpricedErrorsAndSaveCart();
                    if (this.cart().currentOrderState() == CCConstants.PENDING_PAYMENTS || this.cart().currentOrderState() == CCConstants.PENDING_PAYMENT_TEMPLATE) {
                        this.order().handlePayments();
                    }
                    else {
                        $.Topic('MYGATE_OVERLAY_BEGIN').publish({
                            copy: 'Loading...'
                        });
                        if (widget.order().order()) {
                            CCRestClient.request(CCConstants.ENDPOINT_GET_PAYMENT_GROUP,
                                null,
                                function (res) {
                                    if (res.stateAsString === CCConstants.PAYMENT_GROUP_STATE_AUTHORIZED_FAILED) {
                                        widget.order().createOrder();
                                    }
                                }, function (err) {
                                    console.log('err:', err);
                                },
                                widget.order().order().payments[0].paymentGroupId
                            )
                        } else {
                            widget.order().handlePlaceOrder();
                        }
                    }
                };
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

                        console.log(payments)

                        // Temp solution untl 	SR 3-18144108621 get resolved.
                        var hcOrderCustomizations = getDynamicPropByKey('hcOrderCustomizations', widget.cart().dynamicProperties(), true);
                        var hcOrderCustomizationsObj = JSON.parse(hcOrderCustomizations.value());
                        hcOrderCustomizationsObj['hc_paymentProps'] = payments[0];
                        hcOrderCustomizations.value(JSON.stringify(hcOrderCustomizationsObj));
                        //

                        var customerGroup = "hidedocs";
                        for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                            var element = widget.user().dynamicProperties()[i];
                            if (element.id() === "customerGroup") {
                                // if (element.value() != null) {
                                //     if (element.value() === 4) {
                                //         customerGroup = "showdocs"
                                //     }
                                // }
                                if(element.value() != undefined){
                                    if(element.value() == 4){
                                        customerGroup = "showdocs";
                                    }
                                    if(element.value() == 5){
                                        var T = $('#CC-checkoutAddressBook-scountry');
                                        if (T.length> 0){
                                            if(T.val() == "ZA"){
                                                customerGroup = "showdocs";
                                            }
                                        }
                                        else{
                                            if(widget.user().contactShippingAddress != undefined){
                                                if(widget.user().contactShippingAddress.country == "ZA")
                                                {
                                                    customerGroup = "showdocs";
                                                }
                                            }
                                        }
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
                        var TempProp;
                        for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                            var hcPersonNo = widget.user().dynamicProperties()[i];
                            if (hcPersonNo.id() == "hcPersonNo") {
                                TempProp = hcPersonNo;
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

                        /**
                         * This is a hack fix that Donal Archer found
                         * to force clear the cart when the order succeeds,
                         * as sometimes the cart does not clear properly.
                         */
                        CCRestClient.request(CCConstants.ENDPOINT_GET_ORDER,
                            null,
                            function (res) {
                                var create = false;
                                if (typeof (res) === 'undefined') {
                                    create = true;
                                } else {
                                    widget.cart().currentOrderId(res.orderId);
                                }
                                widget.cart().clearAllUnpricedErrorsAndSaveCart();
                                widget.order().paymentDetails().isCardPaymentDisabled(true);
                                widget.order().updatePayments(payments);

                                if (create) {
                                    widget.order().createOrder();
                                } else {
                                    widget.order().handlePlaceOrder()
                                }
                                widget.showDelayedSpinner(200);
                                widget.order().enableOrderButton(false);
                            }, function (err) {
                                console.log('err:', err);
                            },
                            'current')
                    }
                };
                widget.showDelayedSpinner = function (delay) {
                    setTimeout(function () {
                        $('#main > .row:nth-child(3)').append('<div id="checkoutSpinner" class=""><div class="cc-spinner-css" style="top:50%;left:44%"><span class="ie-show">Loading...</span><div class="cc-spinner-css-1"></div><div class="cc-spinner-css-2"></div><div class="cc-spinner-css-3"></div><div class="cc-spinner-css-4"></div><div class="cc-spinner-css-5"></div><div class="cc-spinner-css-6"></div><div class="cc-spinner-css-7"></div><div class="cc-spinner-css-8"></div><div class="cc-spinner-css-9"></div><div class="cc-spinner-css-10"></div><div class="cc-spinner-css-11"></div><div class="cc-spinner-css-12"></div></div></div>')
                    }, delay);
                };
                widget.setShippingFree = function () {

                };
                //   if shipping for the region is "no-ship"
                widget.paymentVM.isShippingBlocked.subscribe(function (val) {
                    widget.order().enableOrderButton(false);
                });

                widget.displayShippingOptions.subscribe(function (val) {
                    // widget.order().enableOrderButton(val);
                });

                $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).subscribe(function (data) {
                    console.log(2.6)
                    widget.order().enableOrderButton(true);
                });
                $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).subscribe(function () {
                    console.log(2.7)
                    widget.order().enableOrderButton(true);
                });
                $.Topic(pubsub.topicNames.CHECKOUT_NOT_VALID).subscribe(function () {
                    console.log(2.8)
                    widget.order().enableOrderButton(true);
                });
                $.Topic(hcConstants.PROFILE_CHECKOUT_VALIDATE_COMPLETE).subscribe(function (obj) {
                    widget.onValidateOrder(obj);
                });
                $.Topic(hcConstants.PROFILE_CHECKOUT_TRIGGER_PLACE_ORDER).subscribe(function (obj) {
                    widget.handleCreateOrder();
                });

                ///////////////// /homechoice related methods


                widget.cart().usingImprovedShippingWidgets(true);
                widget.selectedShippingValue.isData = true;
                widget.order().enableOrderButton.isData = true;
                widget.selectedShippingOption.isData = true;
                widget.errorFlag = false;
                widget.shippingMethodsNewlyLoaded.isData = true;
                widget.totalCost(widget.cart().amount());

                widget.amountToPay = ko.computed(function () {
                    if (widget.order().amountRemaining() != null) {
                        return widget.order().amountRemaining();
                    } else {
                        return widget.totalCost();
                    }
                }, widget);

                widget.clearInvalidShippingMethodError = true;

                widget.setupShippingOptions = function (obj) {
                    widget.destroySpinner();
                    notifier.clearError(widget.typeId() + '-shippingAddress');
                    notifier.clearError(widget.typeId() + '-shippingMethods');
                    notifier.clearError(widget.typeId() + '-selectedShippingMethod');
                    notifier.clearError(widget.typeId() + '-pricingError');

                    if (widget.selectedShippingOption() != undefined) {
                        widget.displayShippingOptions(true);
                        if (!(widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT ||
                            widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT_TEMPLATE)) {
                            // In case of Pending Payment orders, fetch the Shipping related info from Order
                            widget.selectedShippingCost(widget.selectedShippingOption().estimatedCostText());
                        }
                        widget.selectedShippingCostInSecondaryCurrency(widget.selectedShippingOption().secondaryCurrencyShippingCost());
                        widget.selectedShippingName(widget.translate('shippingText',
                            {displayName: ''}));
                        widget.totalCost(widget.cart().total());
                        widget.salesTax(widget.cart().tax());
                        widget.secondaryCurrencyTaxAmount(widget.cart().secondaryCurrencyTaxAmount());
                        if (widget.shippingMethodsNewlyLoaded()) {
                            widget.shippingMethodsNewlyLoaded(false);
                            widget.noShippingMethods(false);
                        }
                    } else {
                        widget.displayShippingOptions(false);
                        widget.selectedShippingCost(0);
                        widget.selectedShippingCostInSecondaryCurrency(0);
                        widget.selectedShippingName(widget.translate('shippingText', {displayName: ''}));
                        widget.totalCost(widget.cart().total());
                        widget.salesTax(widget.cart().tax());
                        widget.secondaryCurrencyTaxAmount(widget.cart().secondaryCurrencyTaxAmount());
                    }
                };

                /**
                 * Handles a change in the cart
                 */
                widget.handleUpdatedCart = function (obj) {
                    widget.isCartPriceUpdated(true);
                },

                    widget.customKeyDownPressHandler = function (obj, data, event) {
                        if ((data == widget.shippingOptions()[widget.shippingOptions().length - 1]) && event.keyCode == 40) {
                            var idLastShippingMethod = obj + widget.shippingOptions()[0].repositoryId;
                            $(idLastShippingMethod).attr('checked');
                            $(idLastShippingMethod).focus();
                            $(idLastShippingMethod).prop('checked', true);
                            widget.selectedShippingValue(widget.shippingOptions()[0].repositoryId);
                        } else if ((data == widget.shippingOptions()[0]) && event.keyCode == 38) {
                            var idLastShippingMethod = obj + widget.shippingOptions()[widget.shippingOptions().length - 1].repositoryId;
                            $(idLastShippingMethod).attr('checked');
                            $(idLastShippingMethod).focus();
                            $(idLastShippingMethod).prop('checked', true);
                            widget.selectedShippingValue(widget.shippingOptions()[widget.shippingOptions().length - 1].repositoryId);
                        } else {
                            return true;
                        }
                    };

                widget.customKeyUpPressHandler = function (data) {
                    widget.selectedShippingValue(data.repositoryId);
                };

                widget.checkIfShippingMethodExists = function (selectedShippingMethod, shippingOptions) {
                    return ko.utils.arrayFirst(shippingOptions(), function (shippingOption) {
                        return selectedShippingMethod === shippingOption.repositoryId;
                    });
                };

                widget.resetShippingOptions = function (obj) {
                    widget.displayShippingOptions(false);
                    widget.totalCost(widget.cart().total());
                    widget.selectedShippingCost(0);
                    widget.selectedShippingCostInSecondaryCurrency(0);
                    widget.salesTax(0);
                    widget.secondaryCurrencyTaxAmount(0);
                    widget.selectedShippingName(widget.translate('shippingText', {displayName: ''}));
                    widget.selectedShippingOption(null);
                    widget.selectedShippingValue(null);
                    widget.shippingmethods().shippingOptions.removeAll();
                    widget.invalidShippingRegion(false);
                    widget.invalidShippingMethod(false);
                    widget.skipShipMethodNotification(false);
                    $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_METHOD).publishWith(widget.selectedShippingOption(), [{message: "success"}]);
                };

                // handles when no shipping methods are available.
                widget.handleNoShippingMethods = function (obj) {
                    widget.noShippingMethods(true);
                    widget.resetShippingOptions();
                    widget.destroySpinner();
                };

                // check the current cart to see if there is a shipping method
                // if not it sets the default shipping method
                widget.shippingMethodsLoadedListener = function (obj) {
                    notifier.clearError(widget.typeId() + '-shippingMethods');
                    if (widget.shippingmethods().shippingOptions().length === 0) {
                        widget.handleNoShippingMethods();
                    }
                    else {
                        widget.shippingOptions(widget.shippingmethods().shippingOptions());
                        widget.shippingMethodsNewlyLoaded(true);
                        widget.skipShipMethodNotification(true);

                        // Set selected shipping option when shipping methods reload to ensure pricing call that can verify
                        // if shipping address is valid
                        widget.selectedShippingValue(null);
                        widget.removeAdjacentShippingAmount(false);
                        widget.shippingMethodsLoaded(false);
                        widget.isCartPriceUpdated(false);
                        // Check the current cart shipping option to see if it been set
                        if ((widget.cart) && (widget.cart().shippingMethod() != undefined) && (widget.cart().shippingMethod() !== '') &&
                            (widget.checkIfShippingMethodExists(widget.cart().shippingMethod(), widget.shippingOptions))) {
                            widget.selectedShippingValue(widget.cart().shippingMethod());
                            widget.destroySpinner();
                        }
                        //for web checkout error case, use the shipping method selected before going for web checkout
                        else if (widget.order().webCheckoutShippingMethodValue) {
                            //dont clear the notifier error message
                            widget.clearInvalidShippingMethodError = false;
                            widget.selectedShippingValue(widget.order().webCheckoutShippingMethodValue);
                            widget.order().webCheckoutShippingMethodValue = null;
                        }
                        // TODO - should we reset the cart shipping method
                        // Use the default shipping method from the list
                        else if (widget.shippingmethods().defaultShipping() != undefined) {
                            // the cart doesn't have a shipping method so set the default shipping method and
                            // send a message to say the selected shipping option has been updated.
                            widget.selectedShippingValue(widget.shippingmethods().defaultShipping());
                            widget.destroySpinner();
                        }
                    }
                };

                $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_UPDATED).subscribe(function (obj) {
                    if (!widget.order().isPaypalVerified() || widget.paypalAddressAltered()) {
                        widget.selectedShippingValue(null);
                        widget.cart().shippingMethod('');
                        widget.shippingmethods().shippingOptions.removeAll();
                        widget.displayShippingOptions(true);
                        $('#CC-checkoutOrderSummary-selectedShippingValue').hide();
                    }
                });

                $.Topic(pubsub.topicNames.PAYPAL_SHIPPING_ADDRESS_ALTERED).subscribe(function (obj) {
                    widget.paypalAddressAltered(true);
                });

                $.Topic(pubsub.topicNames.PAYPAL_CHECKOUT_NO_SHIPPING_METHOD).subscribe(function () {
                    widget.selectedShippingValue(null);
                    widget.cart().shippingMethod('');
                    widget.shippingmethods().shippingOptions.removeAll();
                    widget.displayShippingOptions(true);
                });

                $.Topic(pubsub.topicNames.ADD_NEW_CHECKOUT_SHIPPING_ADDRESS).subscribe(function (obj) {
                    widget.shippingMethodsLoaded(false);
                });

                $.Topic(pubsub.topicNames.ORDER_PRICING_SUCCESS).subscribe(widget.setupShippingOptions);

                $.Topic(pubsub.topicNames.ORDER_PRICING_FAILED).subscribe(function (obj) {
                    widget.destroySpinner();
                    widget.invalidShippingRegion(false);
                    widget.invalidShippingMethod(false);
                    widget.shippingMethodsLoaded(false);

                    // Handle case where selected shipping region is invalid
                    if (this && this.errorCode == CCConstants.INVALID_SHIPPING_COUNTRY_STATE) {
                        widget.invalidShippingRegion(true);
                        notifier.sendError(widget.typeId() + '-shippingAddress', this.message, true);
                    }
                    // Handle case where selected shipping method is invalid
                    else if (this && this.errorCode == CCConstants.INVALID_SHIPPING_METHOD) {
                        widget.invalidShippingMethod(true);
                        notifier.sendError(widget.typeId() + '-selectedShippingMethod', this.message, true);
                    }
                    // Handle case where tax could not be calculated
                    else if (this && this.errorCode == CCConstants.PRICING_TAX_REQUEST_ERROR) {
                        widget.resetShippingOptions();
                        notifier.sendError(widget.typeId() + '-pricingError', this.message, true);
                    }
                    // Handle other pricing errors
                    else {
                        if (this && this.message) {
                            notifier.sendError(widget.typeId() + '-pricingError', this.message, true);
                        }
                        if (this && this.errorCode == CCConstants.PRICING_USER_AUTHENTICATION_ERROR
                            && widget.order().shippingAddress() && widget.order().shippingAddress().validateForShippingMethod()) {
                            widget.shippingMethodsLoaded(true);
                        }
                        widget.resetShippingOptions();
                    }
                });
                // Detect cart changes
                $.Topic(pubsub.topicNames.CART_ADD).subscribe(
                    widget.handleUpdatedCart);
                $.Topic(pubsub.topicNames.CART_REMOVE).subscribe(
                    widget.handleUpdatedCart);
                $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY).subscribe(
                    widget.handleUpdatedCart);

                $.Topic(pubsub.topicNames.DESTROY_SHIPPING_METHODS_SPINNER).subscribe(function (obj) {
                    widget.destroySpinner();
                });

                $.Topic(pubsub.topicNames.VERIFY_SHIPPING_METHODS).subscribe(function (data) {
                    if (!(widget.selectedShippingValue() && widget.selectedShippingOption())) {
                        var shippingAddressWithProductIDs = {};
                        shippingAddressWithProductIDs[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = this[CCConstants.SHIPPING_ADDRESS_FOR_METHODS];
                        shippingAddressWithProductIDs[CCConstants.PRODUCT_IDS_FOR_SHIPPING] = widget.cart().getProductIdsForItemsInCart();
                        $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).publishWith(
                            shippingAddressWithProductIDs, [{
                                message: "success"
                            }]);
                        //$.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).publishWith( this, [{ message: "success"  }]);
                    }
                });

                $.Topic(pubsub.topicNames.CHECKOUT_RESET_SHIPPING_METHOD).subscribe(function (obj) {
                    widget.selectedShippingCost(0);
                    widget.salesTax(0);
                    widget.secondaryCurrencyTaxAmount(0);
                    widget.totalCost(widget.cart().total());
                    widget.selectedShippingName(widget.translate('shippingText', {displayName: ''}));
                    widget.selectedShippingOption(null);
                    widget.selectedShippingValue(null);
                });

                $.Topic(pubsub.topicNames.CART_UPDATED_PENDING_PAYMENT).subscribe(function (obj) {
                    if (widget.cart().orderShippingGroups() && widget.cart().orderShippingGroups().length > 0) {
                        // This widget is not for split shipping, hence considering the first ShippingGroup always
                        // For Split Shipping related widget this has to be handled dynamically as multiple shipping
                        // groups will be present
                        widget.selectedShippingCost(widget.cart().orderShippingGroups()[0].shippingMethod.cost);
                    }
                });

                widget.cart().amount.subscribe(function (newValue) {
                    widget.totalCost(widget.cart().total());
                });

                //This subscribe is used when order total is changed when cart is updated
                widget.cart().total.subscribe(function (newValue) {
                    widget.totalCost(widget.cart().total());
                    if (widget.order().shippingAddress() && widget.order().shippingAddress().validateForShippingMethod()) {
                        widget.salesTax(widget.cart().tax());
                        widget.secondaryCurrencyTaxAmount(widget.cart().secondaryCurrencyTaxAmount());
                    }
                });

                widget.destroySpinner = function () {
                    $(widget.pricingIndicator).removeClass('loadingIndicator');
                    spinner.selector = '#CC-orderSummaryLoadingModal';
                    spinner.destroy(1);
                };
                widget.createSpinner = function () {
                    $(widget.pricingIndicator).css('position', 'relative');
                    widget.pricingIndicatorOptions.loadingText = widget.translate('rePricingText', {defaultValue: this.DEFAULT_LOADING_TEXT});
                    spinner.create(widget.pricingIndicatorOptions);
                };


                // Handle changes to Selected Shipping option
                widget.selectedShippingValue.subscribe(function (newValue) {
                    if (widget.cart().items().length <= 0) {
                        widget.displayShippingOptions(false);
                        return;
                    }
                    if (newValue) {
                        if (widget.skipSpinner()) {
                            widget.skipSpinner(false);
                        } else {
                            widget.createSpinner();
                        }
                        // clears invalid shipping method error only if user selects any shipping option
                        // but not if default shipping method is selected after shipping options reload.
                        if (widget.clearInvalidShippingMethodError) {
                            notifier.clearError("OrderViewModel");
                            widget.clearInvalidShippingMethodError = false;
                        }

                        // Check to see if selected shipping option is in the list of valid shipping options
                        for (var i = 0; i < widget.shippingOptions().length; i++) {
                            if (widget.shippingOptions()[i].repositoryId === widget.selectedShippingValue()) {
                                widget.selectedShippingOption(null);
                                widget.selectedShippingOption(widget.shippingOptions()[i]);
                                // Request checkout re-pricing as shipping method has changed
                                widget.sendShippingNotification();
                                if (widget.shippingMethodsLoaded()) {
                                    widget.removeAdjacentShippingAmount(true);
                                } else {
                                    widget.shippingMethodsLoaded(true);
                                    widget.removeAdjacentShippingAmount(false);
                                }

                                // Housekeeping: reset flags/errors
                                if (widget.reloadShippingMethods()) {
                                    widget.reloadShippingMethods(false);
                                } else {
                                    notifier.clearError(widget.typeId() + '-shippingMethods');
                                }
                                break;
                            }
                        }
                        if (widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT || widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT_TEMPLATE) {
                            widget.setupShippingOptions();
                        }
                    }
                });

                // Sends shipping notification details to the subscribers along with shipping address and shipping options
                widget.sendShippingNotification = function () {
                    notifier.clearError(widget.typeId() + '-pricingError');
                    if (widget.selectedShippingOption() != undefined
                        && widget.selectedShippingOption() !== ''
                        && !widget.skipShipMethodNotification()) {
                        $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_METHOD).publishWith(widget.selectedShippingOption(), [{message: "success"}]);
                    }
                    widget.skipShipMethodNotification(false);
                };

                widget.optionsCaption = ko.computed(function () {
                    return CCi18n.t('ns.ordersummary:resources.selectShippingMethodText');
                });

                widget.optionsTextForShippingMethod = function (data) {
                    if (data) {
                        if (widget.removeAdjacentShippingAmount()) {
                            return data.displayName;
                        }
                        if (data.isDummy) {
                            return "";
                        }
                        return data.displayName + " (" + widget.cart().currency.symbol + data.estimatedCostText() + ")";
                    } else {
                        return "";
                    }
                };
                widget.shippingMethodSelected = function (data) {
                    widget.selectedShippingValue(data.repositoryId);
                };
                widget.getDropdownCaption = ko.computed(function () {
                    // In case of Pending Payment order get the value from Cart
                    if ((widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT ||
                        widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT_TEMPLATE) &&
                        widget.cart().orderShippingGroups() && widget.cart().orderShippingGroups().length > 0) {
                        return widget.cart().orderShippingGroups()[0].shippingMethod.shippingMethodDescription;
                    }
                    if (widget.selectedShippingValue()) {
                        for (var i = 0; i < widget.shippingOptions().length; i++) {
                            if (widget.shippingOptions()[i].repositoryId === widget
                                .selectedShippingValue()) {
                                return widget.shippingOptions()[i].displayName;
                            }
                        }
                    } else {
                        return CCi18n.t('ns.common:resources.selectShippingMethodText');
                    }
                });
                widget.displayShippingMethodsDropdown = function (data, event) {
                    var self = this;
                    self.removeAdjacentShippingAmount(false);
                    $('#CC-checkoutOrderSummary-selectedShippingValue').hide();
                    if (self.isCartPriceUpdated() || self.shippingmethods().shippingOptions().length == 0) {
                        self.isCartPriceUpdated(false);
                        if (self.order().shippingAddress() && self.order().shippingAddress().validateForShippingMethod()) {
                            self.createSpinner();
                            // Skip the pricing spinner when the drop down is getting clicked for the first time after address change
                            self.skipSpinner(true);
                            var shippingAddressWithProductIDs = {};
                            shippingAddressWithProductIDs[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = self.order().shippingAddress();
                            shippingAddressWithProductIDs[CCConstants.PRODUCT_IDS_FOR_SHIPPING] = self.cart().getProductIdsForItemsInCart();
                            self.cart().updateShippingAddress.bind(shippingAddressWithProductIDs)();
                        }

                        // Homechoice - this set the shippind block flag
                        $.Topic(pubsub.topicNames.SHIPPING_METHODS_LOADED).subscribe(function onShippingMethodsLoaded (data) {
                            if (widget.shippingmethods().shippingOptions().length > 0) {
                                if (widget.shippingmethods().shippingOptions()[0].taxCode == "no-ship") {
                                    // widget.paymentVM.isShippingBlocked(true);
                                    widget.paymentVM.isShippingBlocked(false);
                                } else {
                                    widget.paymentVM.isShippingBlocked(false);
                                }
                            }
                            $.Topic(pubsub.topicNames.SHIPPING_METHODS_LOADED).unsubscribe(onShippingMethodsLoaded);
                        });
                    }
                    return true;
                };

                widget.shippingOptionBlured = function (data, event) {
                    var self = this;
                    self.removeAdjacentShippingAmount(true);
                    return true;
                };

                $.Topic(pubsub.topicNames.NO_SHIPPING_METHODS).subscribe(widget.handleNoShippingMethods);
                $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_INVALID).subscribe(function (obj) {
                    widget.resetShippingOptions();
                    widget.destroySpinner();
                    widget.shippingMethodsLoaded(false);
                });

                // Handle server responses when data is missing or invalid
                $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).subscribe(function (obj) {
                    if (this.errorCode == CCConstants.INVENTORY_CONFIGURABLE_ITEM_CHECK_ERROR) {
                        if (this.errors instanceof Array) {
                            var errorCodes = [];
                            this.errors.forEach(function (error) {
                                errorCodes.push(error.errorCode);
                            });
                            if (errorCodes.indexOf(CCConstants.CREATE_ORDER_SKU_NOT_FOUND) > -1 ||
                                errorCodes.indexOf(CCConstants.CREATE_ORDER_PRODUCT_NOT_FOUND) > -1) {
                                widget.cart().loadCart();
                            }
                        }
                    }
                    else if (this.errors instanceof Array) {
                        var errorCodes = [];
                        this.errors.forEach(function (error) {
                            var info = error.moreInfo ? JSON.parse(error.moreInfo) : "";
                            if (error.errorCode == CCConstants.EXTERNAL_PRICE_CHANGED) {
                                widget.cart().setExternalPricesForItems(info);
                                errorCodes.push(error.errorCode);
                            } else if (error.errorCode == CCConstants.EXTERNAL_PRICE_PARTIAL_FAILURE_ERROR) {
                                widget.cart().setUnpricedErrorAndSaveCart(info.commerceItemId, info.message);
                            }
                        });
                        if (errorCodes.indexOf(CCConstants.EXTERNAL_PRICE_CHANGED) > -1) {
                            widget.cart().priceCartForCheckout();
                        }
                    }
                    // Enable button again
                    else if (this.errorCode == CCConstants.INVALID_SHIPPING_METHOD) {
                        widget.invalidShippingMethod(true);
                        widget.selectedShippingValue(null);
                        widget.cart().shippingMethod('');
                        // Notification sent by OrderViewModel to be cleared when valid shipping method is selected
                        widget.clearInvalidShippingMethodError = true;

                        // Reload shipping methods
                        setTimeout(function () {
                            widget.reloadShippingMethods(true);
                            widget.createSpinner();
                            var shipAddress =
                                (widget.cart().shippingAddress() != undefined &&
                                    widget.cart().shippingAddress() !== '')
                                    ? widget.cart().shippingAddress()
                                    : widget.user().shippingAddressBook()[0];
                            var shippingAddressWithProductIDs = {};
                            shippingAddressWithProductIDs[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = shipAddress;
                            shippingAddressWithProductIDs[CCConstants.PRODUCT_IDS_FOR_SHIPPING] = widget.cart().getProductIdsForItemsInCart();
                            $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS)
                                .publishWith(
                                    shippingAddressWithProductIDs,
                                    [{
                                        message: "success"
                                    }]);
                        }, 3000);
                    }
                    else if (this.errors instanceof Array) {
                        var errorCodes = [];
                        this.errors.forEach(function (error) {
                            var info = error.moreInfo ? JSON.parse(error.moreInfo) : "";
                            if (error.errorCode == CCConstants.EXTERNAL_PRICE_CHANGED) {
                                widget.cart().setExternalPricesForItems(info);
                                errorCodes.push(error.errorCode);
                            } else if (error.errorCode == CCConstants.EXTERNAL_PRICE_PARTIAL_FAILURE_ERROR) {
                                widget.cart().setUnpricedErrorAndSaveCart(info.commerceItemId, info.message);
                            }
                        });
                        if (errorCodes.indexOf(CCConstants.EXTERNAL_PRICE_CHANGED) > -1) {
                            widget.cart().priceCartForCheckout();
                        }
                    }
                    // Enable button again
                    else if (this.errorCode == CCConstants.INVALID_SHIPPING_METHOD) {
                        widget.resetShippingOptions();
                        widget.noShippingMethods(true);
                        widget.invalidShippingRegion(true);
                    } else if (this.errorCode == CCConstants.COUPON_APPLY_ERROR) {
                        widget.cart().handleCouponPricingError(this);
                    }
                    else if (this.errorCode == CCConstants.ORDER_PRICE_CHANGED) {
                        widget.cart().priceCartForCheckout();
                    }
                });

                // Function called once the shipping methods have been loaded
                $.Topic(pubsub.topicNames.SHIPPING_METHODS_LOADED).subscribe(widget.shippingMethodsLoadedListener);

                //This is invoked if the load shipping methods fails, to reset the shipping options
                //and to set the text in the place of shipping methods UI
                $.Topic(pubsub.topicNames.LOAD_SHIPPING_METHODS_FAILED).subscribe(function (data) {
                    notifier.sendError(widget.typeId() + '-shippingMethods', this.message, true);
                    widget.resetShippingOptions();
                    widget.noShippingMethods(true);
                    widget.invalidShippingRegion(true);
                });

                // If selected shipping method changed elsewhere, refresh it here
                $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_METHOD).subscribe(function (obj) {
                    // If shipping option different from the one here, refresh the local copy
                    if (this && this.repositoryId
                        && widget.shippingOptions() != undefined
                        && widget.shippingOptions().length > 0
                        && widget.checkIfShippingMethodExists(this.repositoryId, widget.shippingOptions)
                        && (widget.selectedShippingValue() == undefined
                            || widget.selectedShippingValue() !== this.repositoryId)) {
                        widget.skipShipMethodNotification(true);
                        widget.selectedShippingValue(this.repositoryId);
                    }
                });

                // To ensure the shipping method chosen during checkout with paypal is set when shopper
                // returns to place order on store
                $.Topic(pubsub.topicNames.PAYPAL_CHECKOUT_SHIPPING_METHOD_VALUE).subscribe(function () {
                    //Setting the shipping method in cart which gets updated on the shipping methods loaded listener.
                    widget.cart().shippingMethod(this);
                    widget.cart().populateShipppingMethods();
                    widget.selectedShippingValue(this);
                });

                // Listen for notifications being cleared
                $.Topic(pubsub.topicNames.NOTIFICATION_DELETE).subscribe(function () {
                    // Watch for the invalid shipping method notification being cleared
                    if (widget.invalidShippingMethod() && this.id() === widget.typeId() + '-selectedShippingMethod') {
                        // Reload shipping methods
                        widget.invalidShippingMethod(false);
                        widget.reloadShippingMethods(true);
                        widget.createSpinner();
                        var shipAddress =
                            (widget.cart().shippingAddress() != undefined &&
                                widget.cart().shippingAddress() !== '')
                                ? widget.cart().shippingAddress()
                                : widget.user().shippingAddressBook()[0];
                        var shippingAddressWithProductIDs = {};
                        shippingAddressWithProductIDs[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = shipAddress;
                        shippingAddressWithProductIDs[CCConstants.PRODUCT_IDS_FOR_SHIPPING] =
                            widget.cart().getProductIdsForItemsInCart();
                        $.Topic(pubsub.topicNames.RELOAD_SHIPPING_METHODS).publishWith(
                            shippingAddressWithProductIDs,
                            [{message: "success"}]);
                    }
                });

                widget.setupShippingOptions();

                widget.persistedLocaleName(JSON.parse(CCRestClient.getStoredValue(CCConstants.LOCAL_STORAGE_USER_CONTENT_LOCALE)));
                // If locale name is present in local storage, append it to the paypal image url
                if (widget.persistedLocaleName() && widget.persistedLocaleName()[0]) {
                    widget.paypalImageSrc(widget.paypalImageSrc() + "&locale=" + widget.persistedLocaleName()[0].name);
                }
            },

            /**
             * Callback function for use in widget stacks.
             * Triggers internal widget validation.
             * @return true if we think we are OK, false o/w.
             */
            validate: function () {
                this.order().validateCheckoutOrderSummary();
                return !this.order().errorFlag;
            },



            beforeAppear: function (page) {
                var widget = this;

                hcCheckoutController.showModule(widget, VISIBLE_STATE, function (ready) {
                    widget.isRegistrationComplete(ready.registered);
                    if (ready.paymentState === TERMS) {
                        widget.nextButtonCss('blueButton');
                        // todo: move this to a controller
                        widget.paymentVM.paymentType(TERMS);
                        //
                        widget.paymentVM.statementsAccountNumber(null);
                        widget.paymentVM.statementsAccountType(null);
                        widget.paymentState(ready.paymentState);
                        // widget.order().enableOrderButton(true);
                    } else {
                        // widget.paymentVM.paymentType(CARD);
                    }

                    widget.isViewVisible(ready.show);
                    widget.paymentState(ready.paymentState);
                });

                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                    var cartState = hcCartController.isMixedCart();
                    widget.subTotal(cartState.observable);

                    setTimeout(function(){
                        if(widget.cart().allItems().length > 0) {
                            if(widget.cart().allItems()[0].hcPaymentOption() == "cash"){
                                $('.checkout-cash-flow-important-information').show();
                                $('.checkout-terms-flow-important-information').hide();
                            }
                            else{
                                $('.checkout-cash-flow-important-information').hide();
                                $('.checkout-terms-flow-important-information').show();
                            }
                                $('.main-checkout-important-information').show();
                        }
                    }, 1000);

                }, this);

                if (widget.shippingmethods().shippingOptions().length > 0) {
                    widget.skipShipMethodNotification(true);
                    widget.shippingMethodsLoadedListener();
                    widget.setupShippingOptions();
                }
                widget.shippingMethodsLoaded(false);
                //Display shipping options in dropdown only if shipping address is valid
                if (widget.order().shippingAddress()
                    && widget.order().shippingAddress().validateForShippingMethod()) {
                    widget.displayShippingOptions(true);
                }
                widget.removeAdjacentShippingAmount(true);
                $('#CC-checkoutOrderSummary-selectedShippingValue').hide();
                widget.paypalAddressAltered(false);


                // force the click of the shipping dropdown
                widget.displayShippingMethodsDropdown();
            },

            // Click handler for the place order button
            handleCreateOrder: function (viewModel, event) {
                var widget = this;
                // Setting the errorFlag to false, as there are no errors at this point. Clearing any previous error, displayed for checkoutOrderSummary id.
                this.order().errorFlag = false;
                notifier.clearError("checkoutOrderSummary");
                this.cart().clearAllUnpricedErrorsAndSaveCart();

                //  Add Anti fraud properties to the Cart Object
                //  Place the order once the ipAdddress has been requested
                var hcOrderCustomizations = getDynamicPropByKey('hcOrderCustomizations', widget.cart().dynamicProperties(), true);
                var hcOrderCustomizationsObj = JSON.parse(hcOrderCustomizations.value());

                widget.request({
                    method: 'GET',
                    url: SSE_BASE_PATH + '/utility/ipAddress',
                    callbackSuccess: function(res){
                        hcOrderCustomizationsObj['hc_iovation'] = {
                            token: document.getElementById(window.io_bbout_element_id).value,
                            ip: res.ip
                        };
                        hcOrderCustomizations.value(JSON.stringify(hcOrderCustomizationsObj));
                        var pType = CASH_TERMS;
                        widget.order().enableOrderButton(false);
                        switch (widget.paymentVM.paymentType()) {
                            case CARD:
                                pType = CASH;
                                widget.order().validateCheckoutPaymentDetails();
                                break;
                            case TERMS:
                                pType = TERMS;
                                break;
                        }
                        $.Topic(hcConstants.PROFILE_CHECKOUT_VALIDATE).publish(pType);
                    },
                    callbackFailure: function(err){}
                });
            }
        };
    });
