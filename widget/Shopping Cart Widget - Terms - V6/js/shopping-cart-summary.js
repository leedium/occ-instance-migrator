/**
 * @fileoverview Shopping Cart Summary Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['ccRestClient','knockout', 'pubsub', 'viewModels/giftProductListingViewModel', 'ccConstants', 'notifier',
        'CCi18n', 'jquery', 'viewModels/integrationViewModel', 'ccResourceLoader!global/hc.cart.dynamicproperties.app', 'pageLayout/product', 'spinner'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (CCRestClient, ko, pubsub, giftProductListingViewModel, CCConstants, notifier, CCi18n, $, integrationViewModel, cartDynamicPropertiesApp, Product, spinner) {

        "use strict";

        //private methods
        var _showSpinner = function () {
            spinner.create({
                parent: 'body',
                selector: '#main'
            });
        };

        var _hideSpinner = function () {
            spinner.destroy(null, 'body', '#main');
        };


        var DD_LOCKED_CLASS = 'cart-page--select__locked';
        var _widget = null;

        var moduleObj = {
            showOverCommit: ko.observable(false),

            hcCartReady: ko.observable(false),
            userReady: ko.observable(true),
            // This will hold the data displayed in gift selection modal
            currentGiftChoice: ko.observable(),
            selectedGiftSku: ko.observable(),
            // subTotal: ko.observable().extend({ deferred: true }),
            cartItem: {},
            lineItemValidInputArray:[],
            dropdownEnabledArray: ko.observableArray([]),
            validCartItems:{},

            refreshDropdownEnabled: function() {
                var self = this;
                this.cart().allItems().map(function(item,index){
                    self.dropdownEnabledArray()[index] = self.dropdownEnabledArray()[index] || false;
                });
            },

            // Sends a message to the cart to remove this product
            handleRemoveFromCart: function (obj) {
                $.Topic(pubsub.topicNames.CART_REMOVE).publishWith(
                    this.productData(), [{"message": "success", "commerceItemId": this.commerceItemId}]);
                _widget.removeProductFromAllValidationHash(this.catRefId);

                

            },
            focusOnField: function (data) {
                var field = data.source;
                field.focus();
            },


            removeProductFromAllValidationHash: function(skuId){
                delete _widget.validCartItems[skuId];
                _widget.refreshDropdownEnabled();
                _widget.allItemsValid();
            },

            validateInput: function(data, event) {
                var self = this;
                var value = event.target.value;
                var valid = false;
                var select = $(document.getElementById('select'+data.catRefId));

                if(!isNaN(value)) {
                    if(value === "0" || parseInt(value) <= 0){
                        valid = false;
                    }else{
                        if((parseInt(value) <= data.updatableQuantity.rules()[2].params.orderableQuantity)){
                            valid = true;
                        }else{
                            valid = false;
                        }
                    }
                }
                self.validCartItems[data.catRefId] = valid;
                if(!valid){
                    select.addClass(DD_LOCKED_CLASS);
                }else {
                    select.removeClass(DD_LOCKED_CLASS);
                }
                self.allItemsValid();
            },

            allItemsValid: function() {
                var self = this;
                var allValid = true;
                for (var item in self.validCartItems){
                    if(!self.validCartItems[item]){
                        allValid = false;
                        break;
                    }
                }
                $.Topic('CART_PAGE_INPUT_VALID').publish({
                    valid: allValid
                });
            },


            updateQuantityTerms: function (prodData) {


                $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY_SUCCESS).subscribe(
                    function onCartUpdateQuantitySuccess() {
                        _widget.DoCheckOffer();
                        $.Topic("CART_UPDATE_TERMS_QUANTITY").publish(
                            {
                                hash: prodData.hash,
                                product: prodData.product
                            }
                        );
                        $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY_SUCCESS).unsubscribe(onCartUpdateQuantitySuccess)
                    });
                $.Topic(pubsub.topicNames.CART_UPDATE_QUANTITY).publishWith(
                    prodData.product, [
                        {
                            "message": "success",
                            "commerceItemId": prodData.commerceItemId,
                            product: prodData.product
                        }
                    ]);
            },

            quantityFocus: function (data, event) {
                var field = $('#' + event.target.id);
                var button = field.siblings("p").children("button");
                button.fadeIn();

            },

            getGiftChoices: function () {
                giftProductListingViewModel.prototype.getGiftProductChoices(this);
            },

            changeGiftChoice: function (widget) {
                widget.cartItem = {
                    "catRefId": this.catRefId,
                    "productId": this.productId,
                    "quantity": this.quantity()
                };

                // This data is needed to add giftWithPurchaseSelections for the new item which is selected.
                var giftData = {};
                giftData.giftWithPurchaseIdentifier = this.giftData[0].giftWithPurchaseIdentifier;
                giftData.promotionId = this.giftData[0].promotionId;
                giftData.giftWithPurchaseQuantity = this.giftData[0].giftWithPurchaseQuantity;
                widget.currentGiftChoice(giftData);

                // While changing the gift, add giftWithPurchaseSelections info to the product being modified
                widget.addGiftWithPurchaseSelectionsToItem(this);

                var getGiftChoiceData = {};
                getGiftChoiceData.giftWithPurchaseType = this.giftData[0].giftWithPurchaseType;
                getGiftChoiceData.giftWithPurchaseDetail = this.giftData[0].giftWithPurchaseDetail;
                getGiftChoiceData.id = null;
                giftProductListingViewModel.prototype.getGiftProductChoices(getGiftChoiceData);
            },

            // Adds giftWithPurchaseSelections information to the cart item
            addGiftWithPurchaseSelectionsToItem: function (item) {
                var giftWithPurchaseSelections = [];
                var data = {};
                data.giftWithPurchaseIdentifier = item.giftData[0].giftWithPurchaseIdentifier;
                data.promotionId = item.giftData[0].promotionId;
                data.giftWithPurchaseQuantity = item.giftData[0].giftWithPurchaseQuantity;
                data.catRefId = item.catRefId;
                data.productId = item.productId;
                giftWithPurchaseSelections.push(data);
                item.giftWithPurchaseSelections = giftWithPurchaseSelections;
            },

            handleGiftAddToCart: function () {
                // 'this' is widget view model

                var variantOptions = this.currentGiftChoice().giftChoice.variantOptionsArray;
                //get the selected options, if all the options are selected.
                var selectedOptions = this.getSelectedSkuOptions(variantOptions);
                var selectedOptionsObj = {'selectedOptions': selectedOptions};
                var newProduct = $.extend(true, {}, this.currentGiftChoice().giftChoice.product, selectedOptionsObj);
                if (variantOptions.length > 0) {
                    //assign only the selected sku as child skus
                    newProduct.childSKUs = [this.selectedGiftSku()];
                }

                //If the gift being added is already present in the cart, do not trigger pricing
                if (this.cartItem && this.cartItem.catRefId && this.cartItem.productId) {
                    var item = this.cart().getCartItem(this.cartItem.productId, this.cartItem.catRefId);
                    if (item !== null && item.giftWithPurchaseCommerceItemMarkers.length && newProduct.id == this.cartItem.productId
                        && newProduct.childSKUs[0].repositoryId == this.cartItem.catRefId) {
                        this.cartItem = {};
                        this.hideGiftSelectionModal();
                        return;
                    }
                }

                // add gwp selections in the request
                newProduct.giftProductData = {
                    "giftWithPurchaseIdentifier": this.currentGiftChoice().giftWithPurchaseIdentifier,
                    "promotionId": this.currentGiftChoice().promotionId,
                    "giftWithPurchaseQuantity": (this.currentGiftChoice().giftWithPurchaseQuantityAvailableForSelection ?
                        this.currentGiftChoice().giftWithPurchaseQuantityAvailableForSelection : this.currentGiftChoice().giftWithPurchaseQuantity)
                };
                newProduct.orderQuantity = newProduct.giftProductData.giftWithPurchaseQuantity;

                // Triggers price call
                this.cart().addItem(newProduct);
                this.cartItem = {};
                this.hideGiftSelectionModal();
            },

            // hide gift selection modal
            hideGiftSelectionModal: function () {
                $('#CC-giftSelectionpane').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            },

            // this method  returns a map of all the options selected by the user for the product
            getSelectedSkuOptions: function (variantOptions) {
                var selectedOptions = [];
                for (var i = 0; i < variantOptions.length; i++) {
                    if (!variantOptions[i].disable()) {
                        selectedOptions.push({
                            'optionName': variantOptions[i].optionDisplayName,
                            'optionValue': variantOptions[i].selectedOption().key,
                            'optionId': variantOptions[i].actualOptionId,
                            'optionValueId': variantOptions[i].selectedOption().value
                        });
                    }
                }
                return selectedOptions;
            },

            // Checks if all variant values are selected
            allOptionsSelected: function () {
                var allOptionsSelected = true;
                if (!this.currentGiftChoice() || !this.currentGiftChoice().giftChoice) {
                    allOptionsSelected = false;
                } else if (this.currentGiftChoice().giftChoice.variantOptionsArray.length > 0) {
                    var variantOptions = this.currentGiftChoice().giftChoice.variantOptionsArray;
                    for (var i = 0; i < variantOptions.length; i++) {
                        if (!variantOptions[i].selectedOption.isValid() && !variantOptions[i].disable()) {
                            allOptionsSelected = false;
                            this.selectedGiftSku(null);
                            break;
                        }
                    }

                    if (allOptionsSelected) {
                        // get the selected sku based on the options selected by the user
                        var selectedSKUObj = this.getSelectedSku(variantOptions);
                        if (selectedSKUObj === null) {
                            return false;
                        }
                        this.selectedGiftSku(selectedSKUObj);
                    }
                    this.refreshSkuStockStatus(this.selectedGiftSku());
                }

                return allOptionsSelected;
            },

            //refreshes the stockstatus based on the variant options selected
            refreshSkuStockStatus: function (selectedSKUObj) {
                var key;
                var product = this.currentGiftChoice().giftChoice;
                if (selectedSKUObj === null) {
                    key = 'stockStatus';
                } else {
                    key = selectedSKUObj.repositoryId;
                }
                var stockStatusMap = product.stockStatus();
                for (var i in stockStatusMap) {
                    if (i == key) {
                        if (stockStatusMap[key] == CCConstants.IN_STOCK) {
                            product.inStock(true);
                        } else {
                            product.inStock(false);
                        }
                        return;
                    }
                }
            },

            //this method returns the selected sku in the product, Based on the options selected
            getSelectedSku: function (variantOptions) {
                var childSkus = this.currentGiftChoice().giftChoice.product.childSKUs;
                var selectedSKUObj = {};
                for (var i = 0; i < childSkus.length; i++) {
                    selectedSKUObj = childSkus[i];
                    for (var j = 0; j < variantOptions.length; j++) {
                        if (!variantOptions[j].disable() && childSkus[i].dynamicPropertyMapLong[variantOptions[j].optionId] != variantOptions[j].selectedOption().value) {
                            selectedSKUObj = null;
                            break;
                        }
                    }
                    if (selectedSKUObj !== null) {
                        return selectedSKUObj;
                    }
                }
                return null;
            },

            DoCheckOffer: function(){
var widget = _widget;
                    //console.log('new thing here ~~~~~~');

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
                    $('.CheckoutOffer2').html('').hide();
                    
        var strOffer = "";
        for (var i = 0; i < val.QualifyingOffers.length; i++) {
            var QualifyingOffers = val.QualifyingOffers[i];

            strOffer = '<div>' + QualifyingOffers.OfferDescrip + '</div>'

            $('.CheckoutOffer2').html($('.CheckoutOffer2').html() + strOffer).show();
        }

$(document).ready(function(){
    $(document).on('input', '.product-details-credit-options--list input', function(){
        if($(this).next().html().indexOf('Card') >= 0){
            $('.offerCashDisc').hide();
        }else{
            $('.offerCashDisc').show();
        }
    })
});


    });


            },

            beforeAppear: function() {
                _showSpinner();
                var widget = this;
                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                    var checkInterval = setInterval(function () {
                        if(typeof(widget.termsChange) != 'undefined'){
                            clearInterval(checkInterval);
                            widget.refreshDropdownEnabled();
                            if (widget.pageContext().pageType.name === "cart") {
                                widget.validCartItems = {};
                                widget.allItemsValid();
                            }
                            _hideSpinner();
                            widget.hcCartReady(true);
                        }
                    }, 10);
                });


                _widget.DoCheckOffer();

        
            },

            onLoad: function (widget) {
                var self = this;
                _widget = widget;


                $.Topic(pubsub.topicNames.CART_REMOVE_SUCCESS).subscribe(
                function() {
                    _widget.DoCheckOffer();
                }); 

                $.Topic('CART_PAGE_BLOCKING_OVERCOMMIT').subscribe(function (item) {
                    _widget.showOverCommit(item.blocked);
                });

                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                    $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).subscribe(function (e) {
                        if (widget.pageContext().pageType.name === "cart") {
                            self.validCartItems = {};
                            self.allItemsValid();
                        }
                    });

                    $.Topic(pubsub.topicNames.GET_GIFT_CHOICES_SUCCESSFUL).subscribe(function () {
                        // Currently only one product is returned as a gift
                        var product = this[0].products[0];
                        var placeHolderItemId = this[1];
                        if (placeHolderItemId !== null) {
                            for (var i = 0; i < widget.cart().placeHolderItems().length; i++) {
                                if (placeHolderItemId == widget.cart().placeHolderItems()[i].id) {
                                    widget.cart().placeHolderItems()[i].giftChoice = product;
                                    widget.cart().placeHolderItems()[i].giftChoice.itemTotal = 0;
                                    widget.currentGiftChoice(widget.cart().placeHolderItems()[i]);
                                    break;
                                }
                            }
                        } else { // A request was made by shopper to change the gift choice
                            product.itemTotal = 0;
                            var giftData = widget.currentGiftChoice();
                            giftData.giftChoice = product;
                            widget.currentGiftChoice(giftData);
                        }

                        // Get stock status of the product
                        product.stockStatus.subscribe(function (newValue) {
                            if (product.stockStatus().stockStatus === CCConstants.IN_STOCK) {
                                product.inStock(true);
                            } else {
                                product.inStock(false);
                                widget.hideGiftSelectionModal();
                                notifier.sendError('shoppingCartSummary', CCi18n.t('ns.shoppingcartsummary:resources.gwpItemNotAvailable'), true);
                            }
                            product.showStockStatus(true);
                        });
                        var firstchildSKU = product.childSKUs()[0];
                        if (firstchildSKU) {
                            var skuId = firstchildSKU.repositoryId();
                            if (product.variantOptionsArray.length > 0) {
                                skuId = '';
                            }
                            product.showStockStatus(false);
                            var catalogId = null;
                            if (widget.user().catalog) {
                                catalogId = widget.user().catalog.repositoryId;
                            }
                            product.getAvailability(product.id(), skuId, catalogId);
                        } else {
                            product.showStockStatus(true);
                            product.inStock(false);
                        }
                    });

                    // Need to remove giftWithPurchaseSelections from cart items if pricing was not triggered
                    $(document).on('hidden.bs.modal', '#CC-giftSelectionpane', function () {
                        ko.utils.arrayForEach(widget.cart().items(), function (item) {
                            if (item.giftWithPurchaseSelections) {
                                delete item.giftWithPurchaseSelections;
                            }
                        });
                    });

                    // <select> tag in bootstrap modal, changes the modal's position. So always displaying the modal on the top of the browser.
                    if (navigator.userAgent.toLowerCase().indexOf('safari') > -1 && navigator.userAgent.toLowerCase().indexOf('chrome') == -1) {
                        $(document).on('show.bs.modal', '#CC-giftSelectionpane', function () {
                            $('body').scrollTop(0);
                        });
                        $(document).on('shown.bs.modal', '#CC-giftSelectionpane', function () {
                            $('#CC-giftSelectionpane').find('select').blur(function () {
                                $('body').scrollTop(0);
                            });
                        });
                    }
                    //calculate the total

                    widget.handlePlaceHolderRemove = function () {
                        widget.cart().removePlaceHolderFromCart(this);
                    };

                    $.Topic(pubsub.topicNames.GIFT_CHOICES_NOT_AVAILABLE).subscribe(function () {
                        widget.hideGiftSelectionModal();
                        notifier.sendError('shoppingCartSummary', CCi18n.t('ns.shoppingcartsummary:resources.gwpItemNotAvailable'), true);
                    });

                    $.Topic(pubsub.topicNames.CART_ADD_SUCCESS_CPQ).subscribe(self.handleClose);


                    widget.getTerm = function (id, productData) {
                        var term = hcCartController.getPropsById(productData.childSKUs[0].repositoryId, 'hcPaymentOption');
                        return term;
                    };

                    widget.getTermDDL = function (id, productData) {
                        var term = hcCartController.getPropsById(productData.childSKUs[0].repositoryId, 'hcPaymentOption');
                        return term;
                    };

                    widget.getTermsForOptionDropdown = function (product) {
                        var options = hcCartController.getFormattedTermsPricingOptions(product.productData(), product.catRefId);
                        return options;

                    };

                    widget.termsChange = function (productData, event, s, p, ps) {
                        var self = this;
                        var target = $(event.currentTarget);
                        var targetContainer = target.closest('.CartCashTermsHolder').addClass('updating');
                        var dynamicProps = {
                            "hcPaymentOption": {
                                "label": event.currentTarget.options[event.currentTarget.selectedIndex].label,
                                "value": event.currentTarget.value
                            }
                        };
                        hcCartController.updatePropsById(
                            {
                                dynamicProps: dynamicProps,
                                product: productData
                            }
                            , self
                            , function (prodData) {
                                $.Topic(pubsub.topicNames.CART_PRICE_COMPLETE).subscribe(function subscribedToPriceComplete() {
                                    targetContainer.removeClass('updating');
                                    target.prop("disabled", false);
                                    $.Topic(pubsub.topicNames.CART_PRICE_COMPLETE).unsubscribe(subscribedToPriceComplete);

                                });
                                self.updateQuantityTerms(prodData);
                            }
                        );
                        target.prop("disabled", true);
                        event.preventDefault();
                        return false;
                    };

                    widget.updateQuantity =  function (data, event, id) {
                        if ('click' === event.type || ('keypress' === event.type && event.keyCode === 13)) {
                            if (data.updatableQuantity && data.updatableQuantity.isValid()) {
                                var lineItemSelect = document.getElementById('select' + data.productData().childSKUs[0].repositoryId);
                                var selectedIndex = lineItemSelect.options[lineItemSelect.selectedIndex];
                                var dynamicProps = {
                                    "hcPaymentOption": {
                                        "label": selectedIndex.innerHTML,
                                        "value": selectedIndex.value
                                    }
                                };

                                hcCartController.updatePropsById(
                                    {
                                        dynamicProps: dynamicProps,
                                        product: data.productData()
                                    },
                                    self,
                                    self.updateQuantityTerms
                                );

                                var button = $('#' + id);
                                button.focus();
                                button.fadeOut();

                                //update allValid cache here
                                if(data.updatableQuantity() === "0"){
                                    widget.removeProductFromAllValidationHash(data.catRefId);
                                }
                            }
                        } else {
                            this.quantityFocus(data, event);
                        }

                        return true;
                    };


                    widget.isNotTerm = function (id, product) {
                        if (widget.getTerm(id, product.productData()).value == 'cash') return true;
                        return false;
                    };


                });
            },

            getPriceTerms: function (origAmount, QTY, terms) {
                if (terms) {
                    if (terms.label != 'Cash') {
                        var termsArr = terms.label.split(' ');
                        origAmount = termsArr[1] * QTY;
                    }
                }
                return origAmount;
            },



            // Returns the reconfiguration frame document.
            getReconfigurationFrameDocument: function () {
                var iframe = document.getElementById("cc-cpqReconfiguration-frame");
                if (iframe) {
                    return iframe.contentDocument || iframe.contentWindow.document;
                }
            },

            // Returns the reconfiguration form.
            getReconfigurationForm: function () {
                var iframeDocument = this.getReconfigurationFrameDocument();
                if (iframeDocument) {
                    return iframeDocument.getElementById("reconfiguration_form");
                }
            },

            // Reloads the reconfiguration frame.
            reloadReconfigurationFrame: function () {
                var iframe = document.getElementById("cc-cpqReconfiguration-frame");
                if (iframe) {
                    iframe.src = iframe.src;
                }
            },

            // Handle the reconfigure button click on a line item
            handleReconfigure: function (widget) {
                // Handle opening the reconfiguration i-frame here
                var self = this;
                integrationViewModel.getInstance().iFrameId = "cc-cpqReconfiguration-frame";
                var reconfigurationDetails = new Object();
                reconfigurationDetails.configuratorId = self.configuratorId;
                reconfigurationDetails.locale = widget.locale();
                reconfigurationDetails.currency = widget.site()
                    .selectedPriceListGroup().currency.currencyCode;

                // Injecting the reconfiguration form values
                var keys = Object.keys(reconfigurationDetails);
                var frameDocument = widget.getReconfigurationFrameDocument();
                if (frameDocument) {
                    for (var i = 0; i < keys.length; i++) {
                        var element = frameDocument.getElementById(keys[i]);
                        if (element) {
                            element.value = reconfigurationDetails[keys[i]];
                        }
                    }
                }
                widget.getReconfigurationForm().action = widget.site().extensionSiteSettings.CPQConfigurationSettings.ReConfigurationURL;
                widget.getReconfigurationForm().submit();
                var cpqModalPane = $('#cc-re-cpqmodalpane');
                cpqModalPane.modal({
                    backdrop: 'static',
                    keyboard: false
                });
                cpqModalPane.modal('show');
                cpqModalPane.on('hidden.bs.modal', function () {
                    widget.reloadReconfigurationFrame();
                });
            },

            handleClose: function () {
                // Close the reconfiguration modal.
                $('#cc-re-cpqmodalpane').modal('hide');
            }
        };

        return moduleObj;
    }
);
