/**
 * @project homechoice.co.za
 * @file homechoice-cataloguequickorder.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 28/07/2018
 * @description Displays quick order form entry when an homechoice
 *              product code is entered.
**/

define(
    [
        'knockout',
        'CCi18n',
        'pubsub',
        'ccRestClient',
        'ccConstants',
        'pageLayout/product',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app'
    ],
    function (
        ko,
        CCi18n,
        pubsub,
        ccRestClient,
        CCConstants,
        Product,
        cartDynamicPropertiesApp
    ) {
        "use strict";

        var NOTHING_FOUND = 'NOTHING_FOUND';

        return {
            searchInput: ko.observable(''),
            resourcesLoaded: function (widget) {
            },

            onLoad: function (widget) {
                var self = this;
                widget.productData = ko.observable(false);
                widget.searchResults = ko.observable();
                widget.selectedSku = ko.observable(false);
                widget.alternateSkus = ko.observableArray([]);
                widget.selectedTerms = ko.observable();
                widget.itemQuantity = ko.observable(1);
                widget.stockData = {};
                widget.addTocCartButtonDisabled = ko.observable(false);
                widget.paymentOptionDisabled = ko.observable(false);
                widget.selectedSkuOutOfStock = ko.observable(false);
                widget.productCodeValid = ko.observable(false);
                widget.productFound = ko.observable(false);
                widget.searchInputEmpty = ko.observable(false);
                widget.searchInputPatternMismatch = ko.observable(false);

                widget.showProductCodeHelp = ko.observable(true);
                widget.skuLabel = ko.observable('loading...');

                /**
                 * Populates the terms list for each row of the sku
                 * @param skuId
                 * @returns {Array}
                 */
                widget.getTermsListBySku = function (skuId) {
                    var maxStockAvailable = widget.stockData.productSkuInventoryStatus[skuId];

                    if (maxStockAvailable < 1) {
                        widget.paymentOptionDisabled(true);
                        widget.selectedSkuOutOfStock(true);
                        $('#cc-prodDetails-addToCart')[0].innerHTML = "Out of stock";

                    }
                    else {
                        widget.paymentOptionDisabled(false);
                        widget.selectedSkuOutOfStock(false);
                        $('#cc-prodDetails-addToCart')[0].innerHTML = "Add to Basket";
                    }

                    return cartDynamicPropertiesApp.getInstance().getFormattedTermsPricingOptions(widget.productData().product, skuId);
                };

                /**
                 * Clears the search buffer
                 * @param w
                 * @param e
                 */
                widget.clear = function (w, e) {
                    widget.productData(false);
                    widget.selectedSku(false);
                    widget.searchInput('');
                    widget.selectedTerms(null);
                    widget.itemQuantity(1);
                    widget.addTocCartButtonDisabled(true);
                    widget.paymentOptionDisabled(false);
                    widget.showProductCodeHelp(true);
                    widget.searchInputPatternMismatch(false);
                    widget.searchInputEmpty(false);
                    widget.productCodeValid(false);
                    widget.productFound(false);
                    document.querySelector('#homechoiceCatalogueQuickOrderSearchInput').focus();
                };

                /**
                 * Handles search submission
                 */
                widget.handleSubmit = function () {
                    widget.alternateSkus([]);
                    widget.selectedSku(false);
                    widget.searchInputPatternMismatch(false);
                    widget.searchInputEmpty(false);
                    widget.productCodeValid(false);
                    widget.productFound(false);

                    var searchField = document.querySelector('#homechoiceCatalogueQuickOrderSearchInput');
                    var searchEmpty = searchField.validity.valueMissing;

                    if (searchEmpty) {
                        widget.searchInputEmpty(true);
                        widget.productCodeValid(false);
                    } else {
                        widget.searchInputEmpty(false);

                        if (searchField.validity.patternMismatch) {
                            widget.searchInputPatternMismatch(true);
                            widget.productCodeValid(false);
                        }
                        else {
                            widget.searchInputPatternMismatch(false);
                            widget.productCodeValid(true);
                        }
                    }

                    if (widget.productCodeValid() == false) {
                        widget.showProductCodeHelp(true);
                    }
                    else {
                        ccRestClient.request(CCConstants.ENDPOINT_SEARCH_SEARCH,
                            {
                                Ntt: widget.searchInput()
                            },
                            function (res) {

                                widget.showProductCodeHelp(false);
                                var searchResults = res.resultsList.records ? res.resultsList.records : [];
                                if (searchResults.length) {
                                    widget.searchResults(searchResults[0].records[0].attributes);
                                    ccRestClient.request(CCConstants.ENDPOINT_GET_PRODUCT_AVAILABILITY,
                                        null,
                                        function (stockRes) {
                                            widget.stockData = stockRes;
                                            ccRestClient.request(CCConstants.ENDPOINT_PRODUCTS_GET_PRODUCT,
                                                null,
                                                function (res) {
                                                    widget.productData(new Product(res));
                                                    widget.populateProductDetails();
                                                    widget.productFound(true);
                                                }, function err() {
                                                },
                                                widget.searchResults()['product.repositoryId'][0]
                                            );
                                        }, function err() {
                                        },
                                        widget.searchResults()['product.repositoryId'][0]
                                    );
                                } else {
                                    widget.productData(NOTHING_FOUND);
                                    widget.productFound(false);
                                    widget.showProductCodeHelp(true);
                                }
                            }, function err() {
                            }
                        );
                    }
                };

                /**
                 * Sets observables on the view vodem for the
                 * Product Details section
                 */
                widget.populateProductDetails = function () {
                    var selectedSkus;
                    selectedSkus =
                        widget.productData().product.childSKUs
                            .filter(function (sku) {
                                var inStock = widget.stockData[sku.repositoryId] === CCConstants.IN_STOCK;
                                if (sku.hc_orderCode === widget.searchInput()) {

                                //console.log('QuickOrder', sku);

                                widget.skuLabel((sku.hc_size == "No Size" ? "" : 'Size / ') + 'Colour');

                                widget.alternateSkus.push({
                                    skuRef: sku,
                                    // label: sku.beddingType + ' / ' + sku.hc_size + ' / ' + sku.hc_piece + 'pc' + (!inStock ? " (out of stock)" : ""),
                                    // label: sku.hc_size + ' / ' + sku.hc_piece + 'pc' + (!inStock ? " (out of stock)" : ""),
                                    // label: sku.hc_size + ' / ' + sku.hc_colour + ' ' + (!inStock ? " (out of stock)" : ""),
                                    label: (sku.hc_size == "No Size" ? "" : sku.hc_size + ' / ') + sku.hc_colour + ' ' + (!inStock ? " (out of stock)" : ""),
                                    value: sku.repositoryId//,
                                    //disabled: ko.observable(sku.quantity <= 0)
                                });
                                return true;
                                }
                                return false;
                            });
                    widget.selectedSku(selectedSkus[0]);
                    document.querySelector('#homechoiceCatalogueQuickOrderSearchInput').value = "";
                };

                /**
                 * Helper method to find a variant in the filtered list
                 * @param repositoryId
                 * @returns {*}
                 */
                widget.findVariantById = function (repositoryId) {
                    return widget.alternateSkus().reduce(function (a, b) {
                        if (b.value === repositoryId) {
                            a = [b.skuRef];
                        }
                        return a;
                    }, []);
                };

                /**
                 * Handles the change in the variant dropdown
                 * selection
                 * @param w - widget
                 * @param e - event
                 */
                widget.handleSKUVariantChange = function (w, e) {
                    var sku = widget.findVariantById(e.delegateTarget.options[e.delegateTarget.options.selectedIndex].value);

                    if (sku.length) {
                        widget.selectedSku(sku[0]);
                    }

                    $('#CC-prodDetails-quantity').val("1");
                    $('#CC-prodDetails-quantity-qtyError')[0].innerHTML = "";
                };

                /**
                 * Handles the radio button selection and enables
                 * the add to cart upon selection
                 * @param w - widget
                 * @returns {boolean}
                 */
                widget.handleRadioClick = function (w) {
                    widget.selectedTerms(w);
                    //widget.addTocCartButtonDisabled(false);
                    widget.checkStockInventory(widget);
                    return true;
                };

                widget.handleQuantityIncrease = function (w) {
                    var qty = $('#CC-prodDetails-quantity');
                    var intQty = parseInt(qty.val());
                    var newVal = 1;
                    var operation = $(this).selector;

                    if (intQty > 1) {
                        if (operation == "plus")
                            newVal = intQty + 1;
                        else
                            newVal = intQty - 1;

                        widget.itemQuantity(newVal);
                    }

                    if (intQty >= 0 && operation == "plus") {
                        newVal = intQty + 1;
                        widget.itemQuantity(newVal);
                    }

                    if (intQty > 1 && operation != "plus") {
                        newVal = intQty - 1;
                        widget.itemQuantity(newVal);
                    }

                    widget.checkStockInventory(w);

                    return true;
                };

                widget.checkStockInventory = function (w) {
                    var qty = $('#CC-prodDetails-quantity');
                    var qtyInt = parseInt(qty.val());
                    var qtyErrorLabel = $(document.getElementById('CC-prodDetails-quantity-qtyError'))[0];
                    var repositoryId = w.selectedSku().repositoryId;
                    var selectedSku = widget.findVariantById(w.selectedSku().repositoryId);
                    var maxStockAvailable = w.stockData.productSkuInventoryStatus[repositoryId];
                    var errorMsg = "You can order a maximum of " + maxStockAvailable + " for this product.";

                    if (qtyInt > maxStockAvailable) {
                        if (maxStockAvailable == 0) {
                            qtyErrorLabel.innerHTML = "";
                            widget.selectedSkuOutOfStock(true);
                        }
                        else {
                            qtyErrorLabel.innerHTML = errorMsg;
                            widget.selectedSkuOutOfStock(false);
                        }

                        widget.addTocCartButtonDisabled(true);
                    }
                    else {
                        qtyErrorLabel.innerHTML = "";
                        widget.addTocCartButtonDisabled(false);
                        widget.paymentOptionDisabled(false);
                        widget.selectedSkuOutOfStock(false);
                    }

                    if (qtyInt < 1 || qty.val() === "") {
                        widget.addTocCartButtonDisabled(true);
                    }
                },

                    /**
                     * Handles add to cart
                     */
                    widget.addToCart = function () {
                        var dynamicProps = {
                            "hcPaymentOption": {
                                "label": widget.selectedTerms().label,
                                "value": widget.selectedTerms().id
                            }
                        };
                        var selectedOptions = widget.productData().variantOptionsArray.reduce(function (a, b, i) {
                            a.push({
                                'optionName': b.optionDisplayName,
                                'optionValue': widget.selectedSku()[b.actualOptionId],
                                'optionId': b.actualOptionId,
                                'optionValueId': b.originalOptionValues().filter(function (val) {
                                    return val.key === widget.selectedSku()[b.actualOptionId];
                                })[0].value
                            });
                            return a;
                        }, []);
                        var selectedOptionsObj = { 'selectedOptions': selectedOptions };
                        var availabilityDateObj = {
                            'availabilityDate': widget.stockData.productSkuInventoryDetails.filter(function (item) {
                                return item.catRefId === widget.selectedSku().repositoryId;
                            })[0].availabilityDate
                        };
                        var stockStateObj = { 'stockState': widget.stockData[widget.selectedSku().repositoryId] };
                        var newProduct = $.extend(true, {}, widget.productData().product, selectedOptionsObj, availabilityDateObj, stockStateObj);
                        newProduct.orderQuantity = parseInt(widget.itemQuantity(), 10);
                        widget.selectedSku().primaryThumbImageURL = '/file/products/' + widget.selectedSku().repositoryId + '.jpg';
                        newProduct.childSKUs = [widget.selectedSku()];
                        widget.addTocCartButtonDisabled(true);
                        cartDynamicPropertiesApp
                            .getInstance()
                            .updatePropsById(
                                {
                                    dynamicProps: dynamicProps,
                                    itemId: newProduct.id,
                                    product: newProduct
                                },
                                self,
                                function (data) {
                                    $.Topic(pubsub.topicNames.CART_ADD_SUCCESS).subscribe(function onCartAddSuccess() {
                                        $.Topic("CART_ADD_TERMS_SUCCESS").publish(
                                            {
                                                message: "success",
                                                hash: data.hash,
                                                product: data.product
                                            }
                                        );
                                        $.Topic(pubsub.topicNames.CART_ADD_SUCCESS).unsubscribe(onCartAddSuccess);
                                    });
                                    $.Topic(pubsub.topicNames.CART_ADD).publishWith(newProduct, [
                                        {
                                            message: "success"
                                        }
                                    ]);
                                }
                            );
                        setTimeout(function () {
                            widget.addTocCartButtonDisabled(false);
                        }, 3000);
                    };
            },
            beforeAppear: function () {
                this.clear();

                $(document).ready(function () {

                    $(document).on('keydown', '#CC-prodDetails-quantity', function (e) {

                        if ($.inArray(e.keyCode, [8, 9, 27, 13, 46]) !== -1 ||
                            (e.keyCode == 65 || e.keyCode == 86 || e.keyCode == 67 || e.keyCode == 90) && (e.ctrlKey === true || e.metaKey === true) ||
                            e.keyCode >= 35 && e.keyCode <= 40) {
                            return;
                        }
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                        }
                    });

                });
            }
        };
    }
);
