/**
 * This version acts as a proxy to the parents handleAddToCart
 * need to add the credit payment selection choice and any other "stuff"
 */



define(
    ['knockout', 'pubsub', 'ccConstants', 'koValidate', 'notifier', 'CCi18n', 'storeKoExtensions', 'swmRestClient', 'spinner', 'pageLayout/product', 'ccRestClient', 'pinitjs', 'storageApi', 'ccResourceLoader!global/hc.cart.dynamicproperties.app'],
    function (ko, pubsub, CCConstants, koValidate, notifier, CCi18n, storeKoExtensions, swmRestClient, spinner, Product, ccRestClient, pinitjs, storageApi, cartDynamicPropertiesApp) {

        "use strict";
        /**
         * Returns a function, that, as long as it continues to be invoked, will not
         be triggered. The function will be called after it stops being called for
         N milliseconds. If `immediate` is passed, trigger the function on the
         leading edge, instead of the trailing.
         * @param func
         * @param wait
         * @param immediate
         * @returns {Function}
         */
        var debounce = function (func, wait, immediate) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };

        function deferCallback(e) {
            var n = $.Deferred();
            var r = $.Topic(pubsub.topicNames[e]).subscribe(function () {
                n.resolve()
            });

            return $.when(n).then(function () {
                $.Topic(tpubsub.topicNames[e]).unsubscribe(r);
            }), n.promise();
        }

        var _widget;

        return {
            elementName: "productDetailsAddToCartWithOptions",
            buttonEnabled: ko.observable(false),
            onLoad: function (widget) {
                _widget = widget;
                var self = this;

                /**
                 * This is an override for the parent widget version
                 * and includes the validation for the options selections
                 * @returns {*|boolean}
                 */
                widget.validateAddToCart = function () {
                    var AddToCartButtonFlag = _widget.allOptionsSelected() && _widget.stockStatus() && _widget.quantityIsValid() && (_widget.listPrice() != null);
                    // Requirement for configurable items. Do not allow item to be added to cart.
                    if ((_widget.variantOptionsArray().length > 0) && _widget.selectedSku()) {
                        AddToCartButtonFlag = AddToCartButtonFlag
                            && !_widget.selectedSku().configurable;
                    }
                    else {
                        // Check if the product is configurable. Since the product has only
                        // one sku,
                        // it should have the SKU as configurable.
                        // it should have the SKU as configurable.
                        AddToCartButtonFlag = AddToCartButtonFlag
                            && !_widget.product().isConfigurable();
                    }
                    if (!AddToCartButtonFlag) {
                        $('#cc-prodDetailsAddToCart').attr("aria-disabled", "true");
                    }

                    // console.log('enabled:',_widget.allOptionsSelected(),  _widget.stockStatus(), _widget.elements['productDetailsCreditOptions'].hasItemSelected());

                    var result = AddToCartButtonFlag && _widget.elements['productDetailsCreditOptions'].hasItemSelected();
                    self.buttonEnabled(result);
                    return result;
                };

                $.Topic('CREDIT_OPTION_SELECTED').subscribe(function(e){
                    // console.log('CREDIT_OPTION_SELECTED',widget);
                    widget.elements['productDetailsCreditOptions'].hasItemSelected(true);
                    widget.validateAddToCart();
                });
            },

            // Sends a message to the cart to add this product
            handleAddToCart: function (e) {
                var self = this;
                notifier.clearError(this.WIDGET_ID);
                var variantOptions = this.variantOptionsArray();
                notifier.clearSuccess(this.WIDGET_ID);

                //get the selected options, if all the options are selected.
                var selectedOptions = this.getSelectedSkuOptions(variantOptions);

                var selectedOptionsObj = {'selectedOptions': selectedOptions};

                //adding availabilityDate for product object to show in the edit summary
                //dropdown for backorder and preorder
                var availabilityDateObj = {'availabilityDate': this.availabilityDate()};
                var stockStateObj = {'stockState': this.stockState()};

                // add the credit payment pricing option here.
                var dynamicProps = {
                    "hcPaymentOption": {
                        "label": _widget.elements['productDetailsCreditOptions'].paymentOptionLabel(),
                        "value": _widget.elements['productDetailsCreditOptions'].paymentOption()
                    }
                };

                var newProduct = $.extend(true, {}, this.product().product, selectedOptionsObj, availabilityDateObj, stockStateObj);

                if (this.selectedSku() && !this.selectedSku().primaryThumbImageURL) {
                    this.assignSkuIMage(newProduct, this.selectedSku());
                }
                if (this.variantOptionsArray().length > 0) {
                    //assign only the selected sku as child skus
                    newProduct.childSKUs = [this.selectedSku()];
                }

                newProduct.orderQuantity = parseInt(this.itemQuantity(), 10);

                this.cartDynamicPropertiesApp = cartDynamicPropertiesApp
                    .getInstance()
                    .updatePropsById(
                        {
                            dynamicProps: dynamicProps,
                            itemId: newProduct.id,
                            product: newProduct
                        },
                        self,
                        function(data){
                            $.Topic(pubsub.topicNames.CART_ADD_SUCCESS).subscribe(function onCartAddSuccess(){
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


                this.isAddToCartClicked(true);

                setTimeout(enableAddToCartButton, 3000);

                function enableAddToCartButton() {
                    self.isAddToCartClicked(false);
                }

                if (self.isInDialog()) {
                    $(".modal").modal("hide");
                }
            }
        };
    });
