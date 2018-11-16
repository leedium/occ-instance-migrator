/**
 * @fileoverview Order Summary Widget.
 * Calculates Shipping Cost and Order Total, given selected Shipping
 * Option.
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['knockout', 'pubsub', 'notifier', 'CCi18n', 'ccConstants', 'ccLogger', 'spinner', 'ccRestClient', 'ccResourceLoader!global/hc.cart.dynamicproperties.app'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, pubsub, notifier, CCi18n, CCConstants, logger, spinner, CCRestClient, cartDynamicPropertiesApp) {

        "use strict";
        var _widget;
        return {
            //Homechoice observables
            shipping: ko.observable(0),
            AssemblyFee: ko.observable(0),
            subTotal: ko.observable(''),
            paymentType: ko.observable(''),
            cartMessage: ko.observable(''),
            includeShipping: ko.observable(false),
            includeTax: ko.observable(false),
            hasShippingInfo: ko.observable(false),
            hasTaxInfo: ko.observable(false),
            shippingOptions: ko.observableArray(),
            selectedShippingOption: ko.observable(),
            pricingAvailable: ko.observable(false),
            persistedLocaleName: ko.observable(),
            paypalImageSrc: ko.observable("https://fpdbs.paypal.com/dynamicimageweb?cmd=_dynamic-image"),
            checkoutValid: ko.observable(true),
            blockingOvercommitValid: ko.observable(true),
            buttonEnabled: ko.observable(true),

            // Stuff used by the spinner
            pricingIndicator: '#CC-orderSummaryLoadingModal',
            DEFAULT_LOADING_TEXT: "Loading...'",
            pricingIndicatorOptions: {
                parent: '#CC-orderSummaryLoadingModal',
                posTop: '10%',
                posLeft: '30%'
            },

            /**
             * Called when resources have been loaded
             */
            resourcesLoaded: function (widget) {

                // Create observable to mark the resources loaded, if it's not already there
                if (typeof widget.orderSummaryResourcesLoaded == 'undefined') {
                    widget.orderSummaryResourcesLoaded = ko.observable(false);
                }

                // Notify the computeds relying on resources
                widget.orderSummaryResourcesLoaded(true);
            },

            /**
             * validate the cart items stock status as per the quantity. base on the
             * stock status of cart items redirect to checkout or cart
             */
            handleValidateCart: function (data, event) {
                var widget = this;
                if (data.cart().items().length > 0) {
                    data.cart().validatePrice = true;
                    data.cart().skipPriceChange(true);
                    $.Topic(pubsub.topicNames.LOAD_CHECKOUT).publishWith(data.cart(), [{message: "success"}]);
                    return false;
                }
                return true;
            },


            /**
             * Called when widget first loaded
             */
            onLoad: function (widget) {
                //Homechoice - modification
                var self = this;

                _widget = widget;


                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                    $.Topic(pubsub.topicNames.CART_UPDATED).subscribe(function () {
                        _widget.onMixedCartUpdate(hcCartController.isMixedCart());

                    });
                });

                $.Topic('IS_MIXED_CART').subscribe(function (data) {
                    console.log('IS_MIXED_CART',data)
                    _widget.onMixedCartUpdate(data);
                });


                $.Topic('CART_PAGE_BLOCKING_OVERCOMMIT').subscribe(function (data) {
                    widget.blockingOvercommitValid(data.blocked);
                    widget.buttonEnabled(!widget.blockingOvercommitValid() && widget.checkoutValid());
                });

                $.Topic('CART_PAGE_INPUT_VALID').subscribe(function (data) {
                    widget.checkoutValid(data.valid);
                    widget.buttonEnabled(!widget.blockingOvercommitValid() && widget.checkoutValid());
                });

                $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).subscribe(function () {
                    self.checkoutValid(true);
                    widget.buttonEnabled(!widget.blockingOvercommitValid() && widget.checkoutValid());
                });

                $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).subscribe(function () {
                    //$(document).ready(function () {
                        $('.discount-line-item--remove a').click(function () {
                            console.log('prep clear');
                            $('#CC-promotionDetails-promoCode').val('');

                            $.Topic("Coupon_Removed").publish([{ message: "success" }]);

                        });
                    //});
                });

                //End homechoice additions

                // Create observable to mark the resources loaded, if it's not already there
                if (typeof widget.orderSummaryResourcesLoaded == 'undefined') {
                    widget.orderSummaryResourcesLoaded = ko.observable(false);
                }

                // Generate the shipping label so that includes the name of the selected shipping option
                widget.shippingLabel = ko.computed(function () {
                    if (widget.orderSummaryResourcesLoaded()) {
                        if (widget.hasShippingInfo() &&
                            widget.selectedShippingOption() != undefined &&
                            widget.selectedShippingOption().name != undefined) {
                            return widget.translate('shippingText', {
                                displayName: widget.selectedShippingOption().displayName
                            });
                        }
                        else {
                            return widget.translate('shippingText', {
                                displayName: ''
                            });
                        }
                    }
                    else {
                        return '';
                    }
                }, widget);

                // These are not configuration options
                widget.selectedShippingOption.isData = true;

                // Initialise options for showing shipping and tax information
                widget.includeShipping(false);
                widget.hasShippingInfo(false);
                widget.includeTax(false);
                widget.hasTaxInfo(false);

                /**
                 * Sets up shipping and sales tax observable fields.
                 */
                widget.setupShippingAndTax = function (isPricingComplete) {
                    // If no items in cart, don's show shipping and sales tax costs
                    if (widget.cart().items().length <= 0) {
                        widget.includeShipping(false);
                        widget.hasShippingInfo(false);
                        widget.includeTax(false);
                        widget.hasTaxInfo(false);
                    }
                    // // No shipping and tax amount available if shipping method has not been selected
                    // else if (widget.selectedShippingOption() == undefined) {
                    //     widget.includeShipping(true);
                    //     widget.hasShippingInfo(false);
                    //     widget.includeTax(true);
                    //     widget.hasTaxInfo(false);
                    // }
                    // Work out shipping and tax amounts
                    else {
                        widget.includeShipping(true);
                        widget.hasShippingInfo(isPricingComplete);
                        widget.includeTax(true);
                        widget.hasTaxInfo(isPricingComplete);
                    }
                    if(widget.cart().shippingSurcharge()){
                        widget.AssemblyFee(widget.cart().shippingSurcharge())
                    }


                var itemz = [];
                try{
                for (var i = 0; i < widget.cart().items().length; i++) {
                    var element = widget.cart().items()[i];
                    itemz.push({
                        'amount':element.currentPrice(),
                        'product':{
                            'length' : '',
                            'width' : '',
                            'weight' : '',
                            'shippingSurcharge'  : '',
                            'id'  : '',
                            'taxCode' : '',
                            'height'  : ''
                        },
                        'quantity':element.quantity,
                        'rawTotalPrice':element.currentPrice(),
                        'discount':'0',
                        'catalogRefId': element.catRefId
                    })
                }
            }catch(x){}
                

                    var dRequest = {
                        'orderDiscount': 0,
                        'rawOrderTotal': widget.cart().subTotal,
                        'orderTotal': widget.cart().total,
                        'currencyCode': "ZAR",
                        'items': itemz,
                        'address': widget.user().contactShippingAddress,
                        'locale': {
                            "language": "en",
                            "displayName": "English (United States)",
                            "country": "US"
                        },
                        'priceListGroup': dRequest
                    };


                    var dWrapper = JSON.stringify({
                        'request': dRequest
                    });

                    $.ajax({
                        type: 'POST',
                        contentType: "application/json",
                        dataType: 'json',
                        //url: "https://dev-api.homechoice.co.za/hc/whk/oracle/api/v1.0/HCShippingCalculator/CalculateCashDeliveryFee",
                        url: "/ccstorex/custom/v1/hc/utility/calculateCashDeliveryFee",
                        data: dWrapper,
                        headers: {
                            'hc-env': CCRestClient.previewMode,
                            "Authorization": "Bearer " + CCRestClient.tokenSecret
                        },
                        success: function (data) {
                            _widget.shipping(parseInt(data.shippingMethods[0].shippingTotal));
                        },
                        error: function (x) {
                            console.log('calculateCashDeliveryFee Error', x);
                            _widget.shipping(0);
                        }
                    });

                };

                /**
                 * Resets the shipping and sales tax observable fields.
                 */
                widget.resetShippingAndTax = function (obj) {
                    widget.selectedShippingOption(null);
                    if (widget.cart().items().length > 0) {
                        widget.includeShipping(true);
                        widget.includeTax(true);
                    }
                    else {
                        widget.includeShipping(false);
                        widget.includeTax(false);
                    }
                    widget.hasShippingInfo(false);
                    widget.hasTaxInfo(false);
                };

                /**
                 * Handle  cart pricing success/failure events
                 */
                $.Topic(pubsub.topicNames.ORDER_PRICING_SUCCESS).subscribe(function (obj) {
                    widget.pricingAvailable(true);
                    widget.destroySpinner();
                    widget.setupShippingAndTax(true);
                });

                $.Topic(pubsub.topicNames.ORDER_PRICING_FAILED).subscribe(function (obj) {
                    widget.pricingAvailable(false);
                    widget.destroySpinner();
                    if (this && this.errorCode == CCConstants.INVALID_SHIPPING_METHOD) {
                        widget.hasShippingInfo(false);
                        widget.hasTaxInfo(false);
                    }
                    else if (this && this.errorCode == CCConstants.PRICING_TAX_REQUEST_ERROR) {
                        widget.hasShippingInfo(false);
                        widget.hasTaxInfo(false);
                    }
                    else {
                        widget.resetShippingAndTax();
                    }
                });

                // Handle shipping method load success/failure events
                $.Topic(pubsub.topicNames.SHIPPING_METHODS_LOADED).subscribe(function (obj) {
                    // Handle case where no shipping methods have been loaded
                    if (widget.shippingmethods().shippingOptions().length === 0) {
                        widget.resetShippingAndTax();
                    }
                    else {
                        // TODO - According to Nev this will cause issues with the observable model
                        // as we're assigning a new array to the observable array.
                        // May have to iterate through widget.shippingmethods().shippingOptions()
                        // and push these onto widget.shippingOptions.
                        // However if we make our own copies then this complicates pricing updates
                        // as our copy won't have the updated pricing
                        widget.shippingOptions(widget.shippingmethods().shippingOptions());

                        // Make sure that if we have a currently selected option then re-price using that option
                        if (widget.selectedShippingOption() != undefined &&
                            widget.selectedShippingOption() != '') {
                            var foundShippingOption = false;
                            for (var i = 0; i < widget.shippingOptions().length; i++) {
                                if (widget.selectedShippingOption().repositoryId === widget.shippingOptions()[i].repositoryId) {
                                    widget.selectedShippingOption(widget.shippingOptions()[i]);
                                    foundShippingOption = true;
                                    break;
                                }
                            }
                            if (!foundShippingOption && widget.cart().shippingMethod()) {
                                widget.selectedShippingOption(null);
                            }
                        }

                        // Refresh shipping and tax observables
                        widget.setupShippingAndTax(widget.pricingAvailable());
                    }
                });

                $.Topic(pubsub.topicNames.LOAD_SHIPPING_METHODS_FAILED).subscribe(function (obj) {
                    widget.shippingOptions.removeAll();
                    widget.resetShippingAndTax();
                });

                $.Topic(pubsub.topicNames.NO_SHIPPING_METHODS).subscribe(function (obj) {
                    widget.shippingOptions.removeAll();
                    widget.resetShippingAndTax();
                });


                // Handle case of re-pricing for a selected shipping option.
                $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_METHOD).subscribe(function (obj) {
                    // Create spinner for re-pricing
                    if (widget.cart() != undefined
                        && widget.cart().items() != undefined
                        && widget.cart().items().length > 0) {

                        if (this && this.repositoryId && widget.cart().shippingMethod()) {
                            widget.createSpinner();
                        }

                        // The selected shipping option must be in our list of shipping options
                        if (this && this.repositoryId && widget.shippingOptions() != undefined) {
                            var foundOption = false;
                            for (var i = 0; i < widget.shippingOptions().length; i++) {
                                if (this.repositoryId === widget.shippingOptions()[i].repositoryId) {
                                    widget.selectedShippingOption(widget.shippingOptions()[i]);
                                    foundOption = true;
                                    break;
                                }
                            }

                            if (!foundOption || !widget.cart().shippingMethod()) {
                                widget.destroySpinner();
                                widget.selectedShippingOption(null);
                            }
                        }
                        // Refresh display options
                        widget.setupShippingAndTax(widget.pricingAvailable());
                    }
                });

                // Handle case when shipping method is reset
                $.Topic(pubsub.topicNames.CHECKOUT_RESET_SHIPPING_METHOD).subscribe(function (obj) {
                    widget.selectedShippingOption(null);
                    widget.setupShippingAndTax(false);
                });

                // Reset shipping and tax if shipping address is invalid
                $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_INVALID).subscribe(function (obj) {
                    widget.shippingOptions.removeAll();
                    widget.resetShippingAndTax();
                });

                $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY).subscribe(function (obj) {
                    if (widget.selectedShippingOption()) {
                        widget.createSpinner();
                    }
                });

                // Subscribe to changes in the total cost
                widget.cart().amount.subscribe(function (newValue) {
                    // Refresh shipping, tax and total costs
                    widget.setupShippingAndTax(false);
                });

                // Functions to create and destroy the spinner
                widget.destroySpinner = function () {
                    $(widget.pricingIndicator).removeClass('loadingIndicator');
                    spinner.destroyWithoutDelay($(widget.pricingIndicator));
                };
                widget.createSpinner = function () {
                    $(widget.pricingIndicator).css('position', 'relative');
                    widget.pricingIndicatorOptions.loadingText = widget.translate('rePricingText', {defaultValue: this.DEFAULT_LOADING_TEXT});
                    spinner.create(widget.pricingIndicatorOptions);
                };

                // Set up initial shipping and tax observables
                widget.setupShippingAndTax(false);
                widget.destroySpinner();

                widget.persistedLocaleName(JSON.parse(CCRestClient.getStoredValue(CCConstants.LOCAL_STORAGE_USER_CONTENT_LOCALE)));
                // If locale name is present in local storage, append it to the paypal image url
                if (widget.persistedLocaleName() && widget.persistedLocaleName()[0]) {
                    widget.paypalImageSrc(widget.paypalImageSrc() + "&locale=" + widget.persistedLocaleName()[0].name);
                }



                widget.onMixedCartUpdate = function (cartSummaryObject) {
                    widget.paymentType(cartSummaryObject.paymentType);
                    if (cartSummaryObject.paymentType === 'terms') {
                        widget.subTotal(cartSummaryObject.subTotal);
                    }
                    widget.cartMessage(cartSummaryObject.message);
                };

            }, // end of onLoad


            /**
             * Called each time the page appears
             */
            beforeAppear: function (page) {
                var widget = this;

                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                     widget.onMixedCartUpdate(hcCartController.isMixedCart());
                // var pricingAvailable = true;

                // Set up observables for this widget

                 });

                widget.setupShippingAndTax(true);

                // Work out available and selected shipping options
                //alert(1);
                //widget.shippingOptions(widget.shippingmethods().shippingOptions());
                //console.log('widget.shippingOptions', widget.shippingOptions());
                //console.log('widget.cart().shippingMethod()', widget.cart().shippingMethod());
                //console.log('widget.cart().shippingMethod()', widget.cart().shippingMethod);
                //console.log('widget.cart().shipping()', widget.cart().shipping());
                // var pricingAvailable = false;
                //if (widget.cart().shippingMethod() != undefined && widget.cart().shippingMethod() != '') {
                //    for (var i = 0; i < widget.shippingOptions().length; i++) {
                //        if (widget.cart().shippingMethod() === widget.shippingOptions()[i].repositoryId) {
                //            widget.selectedShippingOption(widget.shippingOptions()[i]);
                //            // Ensure we have  pricing
                //            if (widget.cart().shipping() > 0)
                //                pricingAvailable = true;
                //            break;
                //        }
                //    }
                //}
                //console.log('findAddress??', widget)
            }
        }
    }
);
