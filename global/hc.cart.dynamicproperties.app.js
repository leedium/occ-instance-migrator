/**
 * @project homechoice.co.za
 * @file hc.cart.dynamicproperties.app.js
 * @company spindrift, homechoice
 * @createdBy davidlee, donaldArcher
 * @contact david@leedium.com, donald.archer@homchoice.co.za
 * @dateCreated 28/07/2018
 * @description
 *
 * This widget centralizes the methods to sycnhronized dynamic product options,
 * via (add / remove / update) across the pages.
 *
 * For page loads Items are stored in the local storage as a stringified JSON object, and
 * represented in the model under cart().dynamicProperties[i].id = hcOrderCustomizations
 * Stored as order properties as we didn't have a dynamic line order property created at the time
 *
 * Dynamic props are also set on the sku level so that they are persistent through the normal
 * flows through the site
 *
 *  IMPORTANT
 *  Add "hcOrderCustomizations" as a custom order property via API.
 * See the readme.md
 *
 * To access the this module include this as a dependency in your widget / element
 *  define(['ccResourceLoader!global/hc.cart.dynamicproperties.app'],
 *      function(cartDynamicPropertiesApp){
 *          ...
 *          ...
 *      })
 *
 *  To obatin the instance call cartDynamicPropertiesApp.getInstance()
 *
 *  The companion global widget: cartDynamicPropertiesGlobal handles instatiating the
 *  instance with the site model.
 *
 *   * //todo:  @DONALD, please add your ATB Blocking description here...
 *
**/

define([
        'jquery',
        'knockout',
        'storageApi',
        'pubsub',
        'ccConstants',
        'spinner',
        'pageLayout/product',
        'ccRestClient',
        'ccLogger',
        'CCi18n',
        'ccNumber',
        'currencyHelper'],

    function (
        $,
        ko,
        storageApi,
        pubsub,
        ccConstants,
        spinner,
        Product,
        ccRestClient,
        ccLogger,
        CCi18n,
        ccNumber,
        currencyHelper) {

        var ORDER_TYPE = "hcOrderCustomizations";
        var STORAGE_KEY = "cartCustomizations";
        var CART_ADD_TERMS_SUCCESS = "CART_ADD_TERMS_SUCCESS";
        var CART_UPDATE_TERMS_QUANTITY = "CART_UPDATE_TERMS_QUANTITY";
        var changeCache = '';

        /**
         * Accepts the user().dynamicProperties collection, and returns
         * the value for the passed key (id).
         * @param properties
         * @param id
         * @returns {*}
         */
        var findDynamicPropertyValue = function (properties, id) {
            return properties.reduce(function (a, b) {
                return b.id() === id ? b : a;
            });
        };

        function CartDynamicPropertiesApp() {
            var self = this;
            this.model = null;
            this.inited = false;
            this.readyInited = false;
            this.cartProps = ko.observable();
            this.ShowBlocking = ko.observable(false);
            this.BlockingTitle = ko.observable('');
            this.BlockingText = ko.observable('');
            this.cartReady = ko.observable(false);

            /**
             * Run any preliminary process here
             */
            this.onLoad = function () {
                ccLogger.info('CartDynamicProperties loaded..');
                var self = this;
            };

            this.GetATB = function () {
                var _widget = this.model;
                var _site = _widget.site();
                var _tempATB = _site.extensionSiteSettings['blockingOvercommitSettings'].ATB_Val;
                var ATB_Limit = _tempATB;
                if (_widget.user().loggedIn()) {
                    ATB_Limit = _tempATB;
                    //Get Value from user profile
                    var CheckProperty = findDynamicPropertyValue(_widget.user().dynamicProperties(), "creditLimit");
                    if (CheckProperty.value() != null) {
                        ATB_Limit = CheckProperty.value();
                    }
                }
                return ATB_Limit;
            };


            /**
             * Check OverCommit Here
             */
            this.checkOverCommit = function () {
                this.ShowBlocking(false);

                var _widget = this.model;
                var _site = this.model.site();
                var _tempATB = _site.extensionSiteSettings['blockingOvercommitSettings'].ATB_Val;
                var _tempLimitTitle = _site.extensionSiteSettings['blockingOvercommitSettings'].Limit_Reached_Title;
                var _tempLimit = _site.extensionSiteSettings['blockingOvercommitSettings'].Limit_Reached_Text;
                var _tempNoFundsTitle = _site.extensionSiteSettings['blockingOvercommitSettings'].No_Funds_Title;
                var _tempNoFunds = _site.extensionSiteSettings['blockingOvercommitSettings'].No_Funds_Text;

                if (this.isMixedCart().paymentType == "terms") {
                    if (_widget.user().loggedIn()) {
                        var ATB_Limit = _tempATB;

                        //Get Value from user profile
                        var CheckProperty = findDynamicPropertyValue(_widget.user().dynamicProperties(), "creditLimit");
                        if (CheckProperty.value() != null) {
                            ATB_Limit = parseInt(CheckProperty.value());
                        }

                        //console.log('Blocking Overcommit - ATB_Limit: ', ATB_Limit);

                        if (ATB_Limit == 0) {
                            this.ShowBlocking(true);

                            var strHeading = _tempNoFundsTitle.replace("[ORDERVAL]", "R" + CartValTotal).replace("[AMOUNT]", "R" + ATB_Limit);
                            var strBody = _tempNoFunds.replace("[ORDERVAL]", "R" + CartValTotal).replace("[AMOUNT]", "R" + ATB_Limit);

                            this.BlockingTitle(strHeading);
                            this.BlockingText(strBody);
                        }
                        else {
                            var CartValTotal = 0;
                            var CartMinItem = undefined;
                            // todo:  Need to review this blocking overcommit code.
                            // todo: CartMinItem is assigned to undefined and never reassigned

                            for (var i = 0; i < _widget.cart().allItems().length; i++) {
                                var cashPrice = _widget.cart().allItems()[i].currentPrice();
                                if (cashPrice == undefined) cashPrice = _widget.cart().allItems()[i].originalPrice();

                                var qty = _widget.cart().allItems()[i].quantity();

                                CartValTotal = CartValTotal + (cashPrice * qty); //Running total

                                if (CartMinItem == undefined) CartMinItem = cashPrice; //Init
                                if (CartMinItem > cashPrice) CartMinItem = cashPrice; //Get Min Item.
                            }

                            if (ATB_Limit < CartMinItem) {
                                this.ShowBlocking(true);

                                var strHeading = _tempLimitTitle.replace("[ORDERVAL]", "R" + CartValTotal).replace("[AMOUNT]", "R" + ATB_Limit);
                                var strBody = _tempLimit.replace("[ORDERVAL]", "R" + CartValTotal).replace("[AMOUNT]", "R" + ATB_Limit);

                                this.BlockingTitle(strHeading);
                                this.BlockingText(strBody);
                            }
                        }
                    }
                }
                return {
                    showBlocking: this.ShowBlocking,
                    blockingTitle: this.BlockingTitle,
                    blockingText: this.BlockingText
                };
            };

            /**
             * Returns instance
             * @param newModel  - it is advised to pass in the model on every 1st getInstance call
             * @returns {*}
             */
            this.getInstance = function (newModel) {
                if (self.model == null && (newModel == null || typeof (newModel) === 'undefined')) {
                    throw new Error("Cart model not instantiated, please add as first parameter ie: getInstance(widget)")
                } else if (newModel !== null && typeof (newModel) !== "undefined" && this.model === null) {
                    if (!this.inited) {
                        self.model = newModel;
                        currencyHelper.currencyObject(this.model.site().currency);
                        this.init();
                    }
                }
                return this;
            };

            /**
             * Executes a callback when the cart is loaded and "ready"
             * @param model  - it is advised to pass in the model on every 1st getInstance call
             * @param readyCallback
             * @returns {*}
             */
            this.ready = function (widget, readyCallback, target) {

                function checkReady() {
                    if (self.readyInited) {
                        readyCallback.call(widget, self);
                    } else {
                        checkReady();
                    }
                }
                if (!self.readyInited) {
                    self.readyInited = true;
                    self.model = widget;
                    currencyHelper.currencyObject(self.model.site().currency);
                    $.Topic(pubsub.topicNames.CART_READY).subscribe(function onCartReady(e) {
                        self.cartReady(true);
                        readyCallback.call(target, self);
                        $.Topic(pubsub.topicNames.CART_READY).unsubscribe(onCartReady);
                    });
                    self.model.cart().loadCart();
                    // self.init();
                    checkReady();
                } else {
                    readyCallback.call(widget, self);
                }
            };

            /**
             * Returns the custom order property object
             * @param id
             * @returns {*}
             */
            this.getPropsById = function (id) {
                var itemPropArray;
                var item = self._cartDynamicPropItem();
                if (item) {
                    if (item.value()) {
                        var propItem = JSON.parse(item.value());
                        itemPropArray = propItem[id];
                        if (typeof (itemPropArray) !== 'undefined' && itemPropArray !== null) {
                            return itemPropArray;
                        }
                    }
                }
            };

            /**
             * Initializes Cart dynamic props for the first time
             */
            this.init = function () {
                if (!self.inited) {
                    self.inited = true;

                    $.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function (e) {
                        // self.publishMixedCartCheck();
                        // self.clearStorage();
                    });

                    $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(function (e) {
                        // self.clearStorage();
                    });

                    $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(function (e) {
                        // self.clearStorage();
                    });

                    $.Topic(pubsub.topicNames.CART_REMOVE).subscribe(function (e) {
                        self.publishMixedCartCheck();
                        self.removePropsFromStorage(e);
                    });
                    //Check if there is a shopping cart in the cookies, as this fixes a bug when
                    //adding item with dynamic prop for the first time.
                    if (!storageApi.getInstance().getItem('shoppingCart')) {
                        self.model.cart().clearAllUnpricedErrorsAndSaveCart();
                    }
                }

            };

            this.publishMixedCartCheck = function () {
                var payload = this.isMixedCart();
                var msgString = JSON.stringify(payload);
                if (changeCache !== msgString) {
                    changeCache = msgString;
                    $.Topic("IS_MIXED_CART").publish(payload);
                }
            };

            /**
             * Returns the dynamicProperty id by ORDER_TYPE
             */
            this._cartDynamicPropItem = function () {
                if (!self.model.cart().dynamicProperties().length) {
                    return null
                }
                return self.model.cart().dynamicProperties().filter(function (item) {
                    return item.id() === ORDER_TYPE;
                })[0];
            };

            /**
             * Gets value from dynamicProperty
             * @returns {{}}
             */
            this._getPropsFromStorage = function () {
                var itemHash = {};
                if(self._cartDynamicPropItem()){
                var propStorage = self._cartDynamicPropItem().value();
                    if (propStorage) {
                        itemHash = JSON.parse(propStorage);
                    }
                }
                return itemHash;
            };


            /**
             * Update an Item's props after a successfult cart add.propertyValue
             * @param data
             *        - itemId: unique identifier for the item (sku)
             *        - propId: propertyId
             *        - value : p
             * @param context
             * @param callback
             */
            this.updatePropsById = function (data, context, callback) {
                var self = this;
                var hash = self._getPropsFromStorage();
                var itemObj = data.dynamicProps;
                var sku = data.product.childSKUs[0].repositoryId;

                if (!hash.hasOwnProperty(data.itemId)) {
                    hash[sku] = [];
                }

                //merge the hc options with the period and price key/values
                var valueTermsSplit = data.dynamicProps.hcPaymentOption.value.split("_");

                itemObj = $.extend({}, itemObj.hcPaymentOption, {
                    period: valueTermsSplit[1],
                    price: valueTermsSplit[3]
                });
                hash[sku] = itemObj;
                //
                $.Topic(CART_ADD_TERMS_SUCCESS).subscribe(function onCartAddTermsSuccess(data) {
                    var productData = new Product(data.product);
                    self.updateCustomOrderProperties(data.hash);
                    self.updateLineItemPropsByProduct(productData, data.hash[productData.childSKUs()[0].repositoryId()]);
                    self.publishMixedCartCheck();
                    $.Topic(CART_ADD_TERMS_SUCCESS).unsubscribe(onCartAddTermsSuccess);
                });
                //
                $.Topic(CART_UPDATE_TERMS_QUANTITY).subscribe(function onCartQuantityUpdated(data) {
                    var productData = new Product(data.product);
                    self.updateCustomOrderProperties(data.hash);
                    self.updateLineItemPropsByProduct(productData, data.hash[productData.childSKUs()[0].repositoryId()]);
                    self.publishMixedCartCheck();
                    $.Topic(CART_UPDATE_TERMS_QUANTITY).unsubscribe(onCartQuantityUpdated);
                });
                //
                callback.call(context, {
                    hash: hash,
                    product: data.product
                });
            };

            /**
             * This adds the "adjacent" line item values to the product
             * We do this for "added value"
             * @param product
             * @param itemObj
             */
            this.updateLineItemPropsByProduct = function (product, itemObj) {
                var price = ko.observable(null);
                var period = ko.observable(null);
                if (itemObj.value !== "cash") {
                    price = ko.observable(parseFloat(itemObj.price));
                    period = ko.observable(itemObj.period);
                }
                var orderType = ko.observable(itemObj.value === "cash" ? "cash" : "terms");
                this.model.cart()
                    .allItems()
                    .filter(function (i) {
                        return i.catRefId === product.childSKUs()[0].repositoryId();
                    })[0]
                    .populateItemDynamicProperties({
                        "hcTermsCharge": price,
                        "hcTermsDuration": period,
                        "hcPaymentOption": orderType,
                        "hc_orderCode": product.childSKUs()[0].hc_orderCode,
                        "hc_promCode": product.childSKUs()[0].hc_promCode
                    });
                self.model.cart().markDirty();
            };

            /**
             * We do this because we need to add the custom properties for a SKU to the order
             * for items recently added to the cart The minibasket can then pick it up
             * term values from the options list
             * @param itemObj
             */
            this.updateCustomOrderProperties = function (itemObj) {
                var cartDynamicPropItem = self._cartDynamicPropItem();
                if (cartDynamicPropItem) {
                    cartDynamicPropItem.value(JSON.stringify(itemObj));
                    if (this.model.cart().allItems().length === 0) {
                        self.model.cart().clearAllUnpricedErrorsAndSaveCart();
                    }
                }
                if (this.model.cart().allItems.length > 0) {
                    self.clearStorage();
                }
            };

            /**
             * Remove value to local storage by key
             * @param data
             */
            this.removePropsFromStorage = function (data) {
                var hash = self._getPropsFromStorage();
                delete hash[data.productId];
                self.updateCustomOrderProperties(hash);
            };

            /**
             * Clears the item from the local storage
             */
            this.clearStorage = function () {
                storageApi.getInstance().removeItem(STORAGE_KEY);
            };

            /**
             * Returns a formatted list of the terms pricing options (based on sku Property keys)
             * @param productObj - optional
             * @param childSku - optional
             * @returns {Array}
             */
            this.getFormattedTermsPricingOptions = function (productObj, childSku) {

                if (typeof (childSku) === 'undefined' || childSku == null) {
                    try {
                        throw new Error('***CartDynamicPropertiesApp::getFormattedTermsPricingOptions(): Child sku parameter must exist on product, is required, and not be undefined or null.  Please insure the OCC Catalog is up to date for this item***')
                    } catch (e) {
                        ccLogger.info(e);
                        return []
                    }
                }

                var setTemplate = function (period, price) {
                    return self.model.site().extensionSiteSettings['productDetailsCreditOptionsSettings'].buttonLabel
                        .replace('__period__', period).replace('__price__', price);
                };

                var childSkuIndex = 0;
                var periodArray = self.model.site().extensionSiteSettings['hcAppCartDynamicPropertiesSettings'].periodKeys.split(',');
                var priceArray = self.model.site().extensionSiteSettings['hcAppCartDynamicPropertiesSettings'].priceKeys.split(',');

                var childSkuObj;
                if (this.model.user().loggedIn()) {
                    if (!findDynamicPropertyValue(this.model.user().dynamicProperties(), '24MonthTermOption').value()) {
                        periodArray.splice(3, 2);
                    }
                } else {
                    periodArray.splice(3, 2);
                }

                if ((typeof (productObj) === 'undefined' && productObj == null)) {
                    throw new Error('CartDynamicPropertiesApp::getFormattedTermsPricingOptions()  ****A product Id must be defined as a parameter ***');
                }

                childSkuObj = productObj.childSKUs[childSkuIndex];
                if (typeof (childSku) !== 'undefined' && childSku !== null) {
                    childSkuObj = productObj.childSKUs.reduce(function (a, item) {
                        if (item.repositoryId === childSku) {
                            return item;
                        }
                        return a;
                    });
                }

                var ret = periodArray.map(function (item, i) {
                    if (childSkuObj[item] && (childSkuObj[priceArray[i]] !== 0 && childSkuObj[priceArray[i]] != null)) {
                        return {
                            // id: item + '_' + childSkuObj[item] + '_' + priceArray[i] + '_' + childSkuObj[priceArray[i]],
                            id: 't_' + childSkuObj[item] + '_p_' + childSkuObj[priceArray[i]],
                            label: setTemplate(childSkuObj[item], currencyHelper.currencyObject().symbol + '' + childSkuObj[priceArray[i]]),
                            period: childSkuObj[item],
                            price: childSkuObj[priceArray[i]]
                        }
                    }
                });

                if (childSkuObj.listPrice !== 0 && childSkuObj.listPrice !== null) {
                    ret.unshift({
                        id: "cash",
                        label: currencyHelper.currencyObject().symbol + '' + currencyHelper.handleFractionalDigits(self.getAvailablePrice(childSkuObj, productObj), 0)
                    });
                }

                ret = ret.filter(function (a) {
                    return typeof (a) !== 'undefined';
                });
                return ret.reverse();
            };

            this.getAvailablePrice = function (childSkuObj, productObj) {
                return childSkuObj.salePrice || productObj.salePrice || childSkuObj.listPrice || productObj.listPrice;
            };

            /**
             * Checks to see if there is a mixed payment of cash and terms
             * @returns {{result: boolean, message: *}}
             */
            this.isMixedCart = function () {
                var self = this;
                var paymentType = 'empty';
                var paymentIndex = 0;
                var subTotal = 0;

                var count = self.model.cart().allItems().reduce(function (a, b) {
                    if (b.hcTermsDuration() == null) {
                        a.cash++;
                        return a;
                    }
                    a.terms++;
                    return a;
                }, {cash: 0, terms: 0});

                var result = count.cash > 0 && count.terms > 0;
                if (!result) {
                    if (count.cash > 0) {
                        paymentType = 'cash';
                        paymentIndex = 1;
                        subTotal = self.getCashSubTotal();
                    } else if (count.terms > 0) {
                        paymentType = 'terms';
                        paymentIndex = 2;
                        subTotal = self.getTermsSubTotal();
                    }
                } else {
                    if (count.cash > 0 && count.terms > 0) {
                        paymentType = 'mixed';
                        paymentIndex = -1;
                    }
                }

                var ret = {
                    result: result,
                    registrationComplete: self.registrationComplete(),
                    message: result ? self.model.site().extensionSiteSettings['hcAppCartDynamicPropertiesSettings'].mixedCartDescription : '',
                    paymentType: paymentType,
                    paymentIndex: paymentIndex,
                    termsSubTotal: subTotal,
                    subTotal: subTotal
                };
                self.cartProps($.extend({}, ret));
                ret.observable = self.cartProps;
                return ret;
            };

            /**
             * Calculates the total for the cash pricing
             * @returns {{}}
             */
            this.getCashSubTotal = function () {
                return self.model.cart().total();
            };

            /**
             * Calculates the total for the terms pricing
             * @returns {{}}
             */
            this.getTermsSubTotal = function () {
                return self.model.cart().allItems().reduce(function (a, b) {
                    return a + (parseInt(b.hcTermsCharge()) * b.quantity());
                }, 0);
            };

            /**
             * Returns Gross Monthly Income
             * todo: this will have to be updated for FATWEMM
             * @returns {boolean}
             */
            this.registrationComplete = function () {
                var income = findDynamicPropertyValue(self.model.user().dynamicProperties(), 'grossMonthlyIncome');
                return {
                    complete: income.value() > 0,
                    value: income.value()
                };
            };
        }

        return new CartDynamicPropertiesApp()
    }
);
