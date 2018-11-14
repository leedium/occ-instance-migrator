/**
 * @fileoverview Checkout Summary Widget.
 *
 */
/*global $ */
/*global define */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'jquery',
        'pubsub',
        'ccLogger',
        'CCi18n',
        'notifier',
        'ccRestClient',
        'ccConstants',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'pageLayout/product',
        'ccResourceLoader!global/profile.checkout.controller'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, $, pubsub, log, CCi18n, notifier, CCRestClient, CCConstants, cartDynamicPropertiesApp, Product, hcCheckoutController) {
        "use strict";
        var VISIBLE_STATE = 'cash_terms';
        var _widget;
        var moduleObj = {
            visibleState:VISIBLE_STATE,
            cartProps: null,
            isViewVisible: ko.observable(false),
            VarientOptionHide: ko.observable(null),
            elementName: "checkoutSummary",
            beforeAppear: function () {
                var widget = this;
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    widget.isViewVisible(ready.show);
                });

                //console.log('new thing here', widget.cart().items());

                var hcPersonNo = 0;
                var AccountType = 0;
                for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                    var hcPersondynamicProperties = widget.user().dynamicProperties()[i];
                    if (hcPersondynamicProperties.id() == "hcPersonNo") {
                        if (hcPersondynamicProperties.value() == undefined) {
                            hcPersonNo = 0;
                        } else {
                            hcPersonNo = hcPersondynamicProperties.value();
                        }
                    }
                    if (hcPersondynamicProperties.id() === "customerGroup") {
                        if (hcPersondynamicProperties.value() != null) {
                            AccountType = hcPersondynamicProperties.value();
                        }
                    }

                    if(hcPersonNo != 0 &&  AccountType != 0){
                        break;
                    }
                }




                
                    var OrderLines = [];
    
                    for (var i = 0; i < widget.cart().items().length; i++) {
                        var item = widget.cart().items()[i];
    
                        OrderLines.push(
                            { 
                                "PersonNo": hcPersonNo, 
                                "AccountType": AccountType, 
                                "Prom": item.hc_promCode(),
                                "ItemNo": item.catRefId,
                                "OrdCode": item.hc_orderCode(),
                                "Amount": item.itemTotal(),
                                "Quantity": item.quantity()
                            }
                        );
    
                    }
                    var RequestModel = {
                        "OrderLines" : OrderLines
                    }

                    $.ajax({
                        url: "/ccstorex/custom/v1/hc/utility/qualifyingOffer",
                        method: "POST",
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify(RequestModel),
                        headers: {
                            'hc-env': CCRestClient.previewMode,
                            "Authorization": "Bearer " + CCRestClient.tokenSecret
                        }
                    }).done(function (val) {
                        $('.CheckoutOffer').html('').hide();
                        
            var strOffer = "";
            for (var i = 0; i < val.QualifyingOffers.length; i++) {
                var QualifyingOffers = val.QualifyingOffers[i];
    
                strOffer = '<div>' + QualifyingOffers.OfferDescrip + '</div>'
    
                $('.CheckoutOffer').html($('.CheckoutOffer').html() + strOffer).show();
            }


                    });




//Here is the SSE info

// Endpoing : v1/hc/utility/qualifyingOffer

// Request Model :
// {
// "OrderLines": [

// { "PersonNo": 0, "AccountType": 0, "Prom": "string", "ItemNo": 0, "OrdCode": "string", "Amount": 0, "Quantity": 0 }
// ]
// }

// Response Model :
// {
// "QualifyingOffers": [

// { "offerno": 0, "OfferDescrip": "string", "offerlevel": "string", "OfferValue": 0, "ItemNo": 0, "ItemDescrip": "string", "OfferReward": 0 }
// ]
// }


            },
            onLoad: function (widget) {
                _widget = widget;
                var NoOfferArr = _widget.site().extensionSiteSettings.pdpVariantOptionsSettings.exceptionValues.toLowerCase().split(',');
                widget.VarientOptionHide(NoOfferArr);
                widget.validate = function() {
                    return true;
                };

                widget.reset = function () {
                    widget.isViewVisible(false);
                };
                widget.noOfItemsToDisplay(parseInt(widget.noOfItemsToDisplay()));
                widget.isCartEditable = function () {
                    if (widget.cart().currentOrderId() && ((widget.cart().currentOrderState() == CCConstants.QUOTED_STATES) || (widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT) || (widget.cart().currentOrderState() == CCConstants.PENDING_PAYMENT_TEMPLATE))) {
                        return false;
                    }
                    return true;
                };

            },
            getTermName: function (prodID, pData) {
                var terms = this.getTerm(prodID, pData.productData());
                return terms.value === 'cash' ? '(Cash)' : '(Terms)';
            },

            getTerm: function (pId, pData) {
                var product = new Product(pData);
                return cartDynamicPropertiesApp.getInstance().getPropsById(product.childSKUs()[0].repositoryId(), 'hcPaymentOption');
            },
            CheckProductOffer: function (PO) {
                var NoOfferArr = _widget.site().extensionSiteSettings.pdpProductOfferSettings.POexceptionValues.toLowerCase().split(',');
                if (PO == null) return null;
                var CurrentOffer = PO.toString().toLowerCase();
                var checkOffer = false;
                NoOfferArr.forEach(function (entry) {
                    if (entry === CurrentOffer) {
                        PO = null;
                    }
                });
                return PO;
            }
        };
        return moduleObj;
    }
);
