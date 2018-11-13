/**
 * @project homechoice
 * @file element.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 28/07/2018
 * @description Option selection for terms that appear on PDP
 *              - terms options are defined in the shared global hc.app.cart.dynamicproperties
 **/

define(
    [
        'knockout',
        'pubsub',
        'ccConstants',
        'koValidate',
        'notifier',
        'CCi18n',
        'storeKoExtensions',
        'swmRestClient',
        'spinner',
        'pageLayout/product',
        'ccRestClient',
        'pinitjs',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/hc.ui.functions'
    ],
    function (
        ko,
        pubsub,
        CCConstants,
        koValidate,
        notifier,
        CCi18n,
        storeKoExtensions,
        swmRestClient,
        spinner,
        product,
        ccRestClient,
        pinitjs,
        cartDynamicPropertiesApp,
        hcUIfunctions
    ) {
        "use strict";

        var _widget;
        var selectObj;

        return {
            elementName: "productDetailsCreditOptions",
            paymentOptionList: ko.observableArray([]).extend({deferred: true}),
            paymentOption: ko.observable(''),
            paymentOptionLabel: ko.observable(''),
            currentSKURepoId: null,
            hasItemSelected: ko.observable(false),
            sizeSelected: ko.observable(true),

            handleSelectChange: function (e) {
                if (e.target.id === "CC-prodDetails-sku-HomeChoiceDefaultProduct_size" && e.target.selectedIndex <= 0) {
                    this.sizeSelected(false);
                    return true;
                }
                this.sizeSelected(true);
                return true;
            },

            onLoad: function (widget) {
                var self = this;
                _widget = widget;

                // console.log('productDetailsCreditOptions::widget', widget);
                // console.log('productDetailsCreditOptions::this', this);

                //Reset currentSKURepoId so list will appear with new product;
                $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(function (e) {
                    if (widget.pageContext().pageType.name === "product") {
                        // console.log('productDetailsCreditOptions::PAGE_CHANGED',widget.pageContext().pageType)
                        self.currentSKURepoId = null;
                        self.paymentOptionList([]);
                        self.hasItemSelected(false);
                        self.paymentOption('');
                        self.paymentOptionLabel('');
                        selectObj = $('#CC-prodDetails-sku-HomeChoiceDefaultProduct_size');
                        /**
                         * This is a quasi "hack" to address the default value being selected for size
                         * Checks the change event for 0 index ('select size')
                         * then sets visibility observable (sizeSelected) to toggle
                         * conditional visibility
                         */

                        if (selectObj.length && !selectObj.closest('.hc-variant--container').hasClass('hc-variant-exception-hidden')) {
                            selectObj.on('change', self.handleSelectChange.bind(self));
                        } else {
                            self.sizeSelected(true);
                        }
                    } else {
                        if (selectObj.length) {
                            selectObj.off('change', self.handleSelectChange.bind(self))
                        }
                    }
                });

                $.Topic(pubsub.topicNames.SKU_SELECTED).subscribe(hcUIfunctions.debounce(function (e, m) {
                    if (m.repositoryId !== self.currentSKURepoId) {
                        self.sizeSelected(true);
                        self.hasItemSelected(false);
                        self.paymentOption('');
                        self.paymentOptionLabel('');
                        self.currentSKURepoId = m.repositoryId;
                        self.updateOptionsList(m.repositoryId);
                    }
                }, 100, true));

                $.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(hcUIfunctions.debounce(function (e, m) {
                    self.paymentOptionList([]);
                    window.requestTimeout(200, function () {
                        self.updateOptionsList(self.currentSKURepoId);
                    }, self)

                }, 500, true));

                $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(hcUIfunctions.debounce(function (e, m) {
                    self.updateOptionsList();
                }, 500, true));
                self.updateOptionsList();
            },

            /**
             * Updates the option list via the default selectedSku() or forced using the parameter
             * @param repositoryId
             */
            updateOptionsList: function (repositoryId) {
                var self = this;
                var pCounter = 0;
                function checkUpdate(counter) {
                    if (_widget.selectedSku() != null || counter > 2 || repositoryId) {
                        var repoId = repositoryId || (_widget.selectedSku() != null ? _widget.selectedSku().repositoryId : null);
                        self.paymentOptionList(cartDynamicPropertiesApp.getInstance().getFormattedTermsPricingOptions(_widget.product().product, repoId));
                    } else {
                        checkUpdate(pCounter++);
                    }
                }
                checkUpdate(pCounter);
            },

            /**
             * Referenced from template
             * @param e
             * @returns {boolean}
             */
            onPaymentItemSelected: function(e) {
                if(!this.elements['productDetailsCreditOptions'].hasItemSelected()){
                    this.elements['productDetailsCreditOptions'].hasItemSelected(true);
                }
                this.elements['productDetailsCreditOptions'].paymentOptionLabel(e.label);
                return true
            }
        };
    });
