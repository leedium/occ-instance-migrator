/**
 * @project homechoice.co.za
 * @file element.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 28/07/2018
 * @description Modified OOTB version to account for terms options
 *              -terms options are defined in the shared global hc.app.cart.dynamicproperties
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
        'ccResourceLoader!global/hc.cart.dynamicproperties.app'
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
        Product,
        ccRestClient,
        pinitjs,
        cartDynamicPropertiesApp
    ) {
        "use strict";

        var DISPLAY_COUNT = 10000;//override 4;

        var findValueByKey = function (arr, key) {
            return arr.filter(function (a) {
                return a.key === key;
            })[0].value;
        };

        var throttle = function (func, limit) {
            var inThrottle
            return function () {
                var args = arguments;
                var context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(function () {
                        inThrottle = false
                    }, limit);
                }
            }
        };

        var _widget;

        return {
            elementName: "product-variants-listing",
            infinateScrollList: ko.observableArray([]),
            currentDisplayCount:ko.observable(DISPLAY_COUNT),
            allItems:ko.observableArray([]),

            stockStats: ko.observableArray([]),

            customIsAddToSpaceClicked : ko.observable(false),
            customDisableAddToSpace : ko.observable(false),
            spaceOptionsArray: ko.observableArray([]),
            //variantOptionsArray: ko.observableArray([]),

            addToSpaceClick: function(widget, sku, target, d) {

    var availabilityDateObj = {'availabilityDate': widget.availabilityDate()};
    var stockStateObj = {'stockState': widget.stockState()};
    var atcButton = $(target.delegateTarget);
    notifier.clearError(widget.WIDGET_ID);
    notifier.clearSuccess(widget.WIDGET_ID);

    
    //var len = widget.variantOptionsArray().length;
    var len = widget.elements['product-variants-with-dispatch'].NewArray().length;
    //var selectedOptions = widget.variantOptionsArray().reduce(function (a, b, i) {
    var selectedOptions = widget.elements['product-variants-with-dispatch'].NewArray().reduce(function (a, b, i) {
        var selectedDropDownIndex;
        try {
            selectedDropDownIndex = parseInt(target.delegateTarget.attributes[b.actualOptionId.toLowerCase() + '-selecteddropdownindex'].value);
        } catch (e) {
            selectedDropDownIndex = 0;
        }

        var buttonRow = parseInt(target.delegateTarget.attributes['data-row-index'].value)
        var optValues = b.optionValues()
        var optValuesIndex = b.optionValues()[buttonRow];


        a.push({
            'optionName': b.optionDisplayName,
            'optionValue': sku[b.actualOptionId](),
            'optionId': b.actualOptionId,
            'optionValueId': parseInt(target.delegateTarget.attributes[b.actualOptionId.toLowerCase() + '-optionvalueid'].value)
        });
        return a;
    }, []);

    var selectedOptionsObj = {'selectedOptions': selectedOptions};

    //     //adding availabilityDate for product object to show in the edit summary
    //     //dropdown for backorder and preorder
    var availabilityDateObj = {'availabilityDate': widget.availabilityDate()};
    var stockStateObj = {'stockState': widget.stockState()};

    //     // add the credit payment pricing option here.
    var dynamicProps = {
        "hcPaymentOption": {
            "label": atcButton.data('payment-label'),
            "value": atcButton.data('payment-option'),
        }
    };

    var newProduct = $.extend(true, {}, widget.product().product, selectedOptionsObj, availabilityDateObj, stockStateObj);
    newProduct.orderQuantity = parseInt("1", 10);

    var selectedSku = widget.product().product.childSKUs.filter(function (item, i) {
        return (sku.repositoryId() === item.repositoryId);
    });

    widget.assignSkuIMage(newProduct, selectedSku[0]);
    newProduct.childSKUs = selectedSku;

    newProduct.productPrice = (newProduct.salePrice != null) ? newProduct.salePrice : newProduct.listPrice;
    $.Topic(pubsub.topicNames.SOCIAL_SPACE_ADD).publishWith( newProduct, [{message:"success"}]);

            },
            // this method  returns a map of all the options selected by the user for the product
            getSelectedSkuOptions : function(variantOptions) {
              var selectedOptions = [], listingVariantImage;
              for (var i = 0; i < variantOptions.length; i++) {
                if (!variantOptions[i].disable()) {
                  selectedOptions.push({'optionName': variantOptions[i].optionDisplayName, 'optionValue': variantOptions[i].selectedOption().key, 'optionId': variantOptions[i].actualOptionId, 'optionValueId': variantOptions[i].selectedOption().value});
                }
              }
              return selectedOptions;
            },
            openAddToWishlistDropdownSelector : function() {
                var widget = this;
                if (widget.spaceOptionsArray().length === 0) {
                    widget.getSpaces();  
                }
            },
            getSpaces : function(callback) {
              var widget = this;
              var successCB = function(result) {
                var mySpaceOptions = [];
                var joinedSpaceOptions = [];
                if (result.response.code.indexOf("200") === 0) {
                  
                  //spaces
                  var spaces = result.items;
                  spaces.forEach( function (space, index) {
                    var spaceOption = {spaceid: space.spaceId,
                                       spaceNameFull: ko.observable(space.spaceName),
                                       spaceNameFormatted : ko.computed(function(){
                                         return space.spaceName + " (" + space.creatorFirstName + " " + space.creatorLastName + ")";
                                       }, widget),
                                       creatorid: space.creatorId,
                                       accessLevel: space.accessLevel,
                                       spaceOwnerFirstName: space.creatorFirstName,
                                       spaceOwnerLastName: space.creatorLastName};
      
                    // if user created the space, add it to My Spaces, otherwise add it to Joined Spaces
                    if (space.creatorId == swmRestClient.apiuserid) {
                      mySpaceOptions.push(spaceOption);
                    }
                    else {
                      joinedSpaceOptions.push(spaceOption);
                    }
                  });
      
                  // sort each group alphabetically
                  mySpaceOptions.sort(mySpacesComparator);
                  joinedSpaceOptions.sort(joinedSpacesComparator);
      
                  widget.spaceOptionsGrpMySpacesArr(mySpaceOptions);
                  widget.spaceOptionsGrpJoinedSpacesArr(joinedSpaceOptions);
      
                  var groups = [];
                  var mySpacesGroup = {label: widget.translate('mySpacesGroupText'), children: ko.observableArray(widget.spaceOptionsGrpMySpacesArr())};
                  var joinedSpacesGroup = {label: widget.translate('joinedSpacesGroupText'), children: ko.observableArray(widget.spaceOptionsGrpJoinedSpacesArr())};
                  
                  var createOptions = [];
                  var createNewOption = {spaceid: "createnewspace", spaceNameFull: ko.observable(widget.translate('createNewSpaceOptText'))};
                  createOptions.push(createNewOption);
                  var createNewSpaceGroup = {label: "", children: ko.observableArray(createOptions)};
      
                  groups.push(mySpacesGroup);
                  groups.push(joinedSpacesGroup);
                  groups.push(createNewSpaceGroup);
                  widget.spaceOptionsArray(groups);
                  widget.mySpaces( mySpaceOptions );
      
                  if(callback){
                    callback();
                  }
                }
              };
              var errorCB = function(resultStr, status, errorThrown) {
              };
              
              swmRestClient.request('GET', '/swm/rs/v1/sites/{siteid}/spaces', '', successCB, errorCB, {});
            },
            
            CheckSKUQTY: function(skuId, w){
                $.ajax({
                   url: "/ccstoreui/v1/stockStatus/" + skuId,
                   method: "GET",
                   contentType: 'application/json',
                   dataType: 'json',
                   //data: JSON.stringify(XXX)
                   //data: bankData,
                   headers: ccRestClient.previewMode ? {
                       "Authorization": "Bearer " + ccRestClient.tokenSecret
                   } : {}
                }).done(function (val) {
                    
                    for (var index = 0; index < w.product().childSKUs().length; index++) {
                        var element = w.product().childSKUs()[index];
                        var theSku = element.repositoryId();
                        var theQ = val.productSkuInventoryStatus[theSku];
                        w.product().childSKUs()[index].quantity(theQ);
                    }

                });
            },
            autoSelect: function () {
                if(
                   $('[data-bind="element: \'product-variants-with-dispatch\'"] select').length > 0
                   &&
                   $('.pdp-variant-options-listing form').length > 0
                ){
                    setTimeout(function(){
                        $('[data-bind="element: \'product-variants-with-dispatch\'"] select').each(function(){
                            var comp2nd = false;
                            $(this).find('option').filter(function() { 
                                if ($(this).text().indexOf('Select') == -1){
                                    if(!comp2nd){
                                    comp2nd = true;
                                    return true;
                                    }
                                }
                            }).prop('selected', true).change().parent().change();
                        });
                    }, 500);
                    // $('.product-details-credit-options--list').each(function(){$(this).find('input').first().click()});
                }
                //$('.product-details-credit-options--list').each(function(){$(this).find('input').first().click()});
            },
            onLoad: function (widget) {
                var self = this;
                _widget = widget;


//Start Hack Wishlist

// $.Topic(pubsub.topicNames.SOCIAL_SPACE_ADD_SUCCESS).subscribe(function(obj) {
//     if (obj.productUpdated) {
//       widget.customDisableAddToSpace(true);
//       setTimeout(function() {widget.customDisableAddToSpace(false);}, 3000);
//     }
//     else {
//       widget.customIsAddToSpaceClicked(true);
//       widget.customDisableAddToSpace(true);
//       setTimeout(function() {widget.customIsAddToSpaceClicked(false);}, 3000);
//       setTimeout(function() {widget.customDisableAddToSpace(false);}, 3000);
//     }
//   });


//End Hack Wishlist








                //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
                //console.log('asdf', widget.product().id())
                 this.CheckSKUQTY(widget.product().id(), widget) ;
                //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')




                widget.filterOptionValues = function () {
                };
                // this.availableVariants = ko.observable([]);
                this.allItems(widget.product().childSKUs());


                //console.log('asdf', widget.product().id())
                /**
                 * Populates the terms list for each row of the sku
                 * @param skuId
                 * @returns {Array}
                 */
                this.getTermsListBySku = function (skuId) {
                    return cartDynamicPropertiesApp.getInstance().getFormattedTermsPricingOptions(widget.product().product, skuId);
                };


                /**
                 * updates the state of the add to cart button when clicke
                 * @param option
                 * @param e
                 */
                this.onPaymentOptionSelected = function (option, e) {
                    var addToCartButton = $(e.target).closest('form').find('button');
                    addToCartButton.data({
                        'payment-label': option.label,
                        'payment-option': option.id
                    });
                    addToCartButton.prop('disabled', false);
                    return true;
                };

                /**
                 *  Run the default flow to update variants
                 * @param selectedOption
                 */
                this.updateAvailableVariants = function (selectedOption) {

                    // console.log('updateAvailableVariants', selectedOption);

                    //var variantOptions = widget.variantOptionsArray();
                    var variantOptions = widget.elements['product-variants-with-dispatch'].NewArray();
                    
                    // self.availableVariants().splice(0);
                    this.selectedOptions = selectedOption.selectedOptions;
                    variantOptions.map(function (item, i) {
                        var matchingSkus = widget.getMatchingSKUs(item.optionId);
                        var optionValues = widget.updateOptionValuesFromSku(matchingSkus, selectedOption.optionId, item);
                        variantOptions[i].optionValues(optionValues);
                        widget.filtered(true);
                    });


                    // console.log('====updateAvailableVariants:', variantOptions, selectedOption)

                    self.refreshList(variantOptions, selectedOption)

                    setTimeout(function(){
                        $('.product-details-credit-options--list').each(function(){$(this).find('input').first().click()});
                    }, 1000);
                };

                /**
                 * Callback when the add-to-cart button is clicked
                 * @param widget
                 * @param sku
                 * @param target
                 * @param d
                 */
                this.handleAddToCart = function (widget, sku, target, d) {
                    var availabilityDateObj = {'availabilityDate': widget.availabilityDate()};
                    var stockStateObj = {'stockState': widget.stockState()};
                    var atcButton = $(target.delegateTarget);
                    notifier.clearError(widget.WIDGET_ID);
                    notifier.clearSuccess(widget.WIDGET_ID);

                    
                    //var len = widget.variantOptionsArray().length;
                    var len = widget.elements['product-variants-with-dispatch'].NewArray().length;
                    //var selectedOptions = widget.variantOptionsArray().reduce(function (a, b, i) {
                    var selectedOptions = widget.elements['product-variants-with-dispatch'].NewArray().reduce(function (a, b, i) {
                        var selectedDropDownIndex;
                        try {
                            selectedDropDownIndex = parseInt(target.delegateTarget.attributes[b.actualOptionId.toLowerCase() + '-selecteddropdownindex'].value);
                        } catch (e) {
                            selectedDropDownIndex = 0;
                        }

                        var buttonRow = parseInt(target.delegateTarget.attributes['data-row-index'].value)
                        var optValues = b.optionValues()
                        var optValuesIndex = b.optionValues()[buttonRow];


                        a.push({
                            'optionName': b.optionDisplayName,
                            'optionValue': sku[b.actualOptionId](),
                            'optionId': b.actualOptionId,
                            'optionValueId': parseInt(target.delegateTarget.attributes[b.actualOptionId.toLowerCase() + '-optionvalueid'].value)
                        });
                        return a;
                    }, []);

                    var selectedOptionsObj = {'selectedOptions': selectedOptions};

                    //     //adding availabilityDate for product object to show in the edit summary
                    //     //dropdown for backorder and preorder
                    var availabilityDateObj = {'availabilityDate': widget.availabilityDate()};
                    var stockStateObj = {'stockState': widget.stockState()};

                    //     // add the credit payment pricing option here.
                    var dynamicProps = {
                        "hcPaymentOption": {
                            "label": atcButton.data('payment-label'),
                            "value": atcButton.data('payment-option'),
                        }
                    };

                    var newProduct = $.extend(true, {}, widget.product().product, selectedOptionsObj, availabilityDateObj, stockStateObj);
                    newProduct.orderQuantity = parseInt("1", 10);

                    var selectedSku = widget.product().product.childSKUs.filter(function (item, i) {
                        return (sku.repositoryId() === item.repositoryId);
                    });

                    widget.assignSkuIMage(newProduct, selectedSku[0]);
                    newProduct.childSKUs = selectedSku;

                    atcButton.prop('disabled', true);
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
                        atcButton.prop('disabled', false);
                    }, 3000);
                };

                this.showMore = function (w, e) {
                    var nextBlock = self.currentDisplayCount() + DISPLAY_COUNT;
                    widget.elements['product-variants-listing'].infinateScrollList(widget.elements['product-variants-listing'].infinateScrollList().concat(self.allItems().slice(self.currentDisplayCount(), nextBlock)));
                    self.currentDisplayCount(nextBlock >= self.allItems().length ? self.allItems().length : nextBlock);
                    // console.log(self, nextBlock, widget.elements['product-variants-listing'].infinateScrollList(), self.currentDisplayCount());
                };


                this.decorateAllSkus = function (skus, selectedOptions) {
                    
                    // var len = widget.variantOptionsArray().length;
                    var len = widget.elements['product-variants-with-dispatch'].NewArray().length;

                    if (selectedOptions === null || typeof selectedOptions === 'undefined') {
                        selectedOptions = [];
                    }
                    
                    // if (selectedOptions.length < widget.variantOptionsArray().length) {
                    if (selectedOptions.length < widget.elements['product-variants-with-dispatch'].NewArray().length) {
                        // widget.variantOptionsArray().map(function (item, i) {
                            widget.elements['product-variants-with-dispatch'].NewArray().map(function (item, i) {
                            if (!selectedOptions[i]) {
                                selectedOptions[i] = {selectedIndex: 0}
                            }
                            return item;
                        });
                    }

                    return skus.map(function (sku, index) {
                        // var variantObj = widget.variantOptionsArray().reduce(function (a, b, i) {
                        var variantObj = widget.elements['product-variants-with-dispatch'].NewArray().reduce(function (a, b, i) {
                            //console.log('=======>',sku,b,b.actualOptionId);
                            a[b.actualOptionId.toLowerCase()] = sku[b.actualOptionId]();
                            try {
                                a[b.actualOptionId.toLowerCase() + '-selecteddropdownindex'] = selectedOptions[i].selectedIndex;
                                a[b.actualOptionId.toLowerCase() + '-optionvalueid'] = findValueByKey(b.optionValues(), sku[b.actualOptionId]());
                            } catch (e) {
                            }
                            ;
                            return a;
                        }, {});
                        variantObj['data-terms-ref'] = 'termsList-' + index;
                        variantObj['data-row-index'] = index;
                        sku.variantObj = variantObj;
                        return sku;
                    });
                };

                this.resetList = function() {
                    self.allItems(self.decorateAllSkus(widget.product().childSKUs(),null));

                };


                this.refreshList = function (options, selectedOptions) {
                    var rowCounter = 0;
                    var opts = options.slice(0, options.length);
                    var selectedVariantOptions = opts.filter(function (option) {
                        if (option.selectedOption() !== null && typeof(option.selectedOption()) !== 'undefined') {
                            return true;
                        }
                        return false;
                    });

                    var decorateSku = function (sku, index) {
                        var variantObj = opts.reduce(function (a, b, i) {
                            a[b.actualOptionId.toLowerCase()] = sku[b.actualOptionId]();
                            try {
                                a[b.actualOptionId.toLowerCase() + '-selecteddropdownindex'] = selectedOptions.selectedOptions[i].selectedIndex
                                a[b.actualOptionId.toLowerCase() + '-optionvalueid'] = findValueByKey(b.optionValues(), sku[b.actualOptionId]());
                            } catch (e){};
                            return a;
                        }, {});
                        variantObj['data-terms-ref'] = 'termsList-' + index;
                        variantObj['data-row-index'] = index;
                        sku.variantObj = variantObj;
                        return sku;
                    };

                    self.currentDisplayCount(DISPLAY_COUNT);
                    if (selectedOptions.selectedOptions.reduce(function (a, b) {
                        return a && (typeof(b.selectedOptionValue()) === 'undefined');
                    }, true)) {
                        self.resetList();
                        return;
                    }

                    self.allItems(widget.product().childSKUs().filter(function (sku) {
                        var VisVariants = Object.keys(sku.dynamicPropertyMapLong).length - 1;
                        if (selectedVariantOptions.length === 0) {
                            self.resetList();
                            return false;
                        }
                        if (selectedVariantOptions.length < VisVariants) {
                            return sku[selectedVariantOptions[0].actualOptionId]() === selectedVariantOptions[0].selectedOptionValue().key;
                        } else if (selectedVariantOptions.length == VisVariants) {
                            if(selectedVariantOptions.length == 2){
                                var match = selectedVariantOptions.reduce(function (a, b) {
                                    return (sku[a.actualOptionId]() === a.selectedOptionValue().key && (sku[b.actualOptionId]() === b.selectedOptionValue().key))
                                });
                            }
                            else if(selectedVariantOptions.length > 2){
                                //Breaks... try somethign new
                                // var match = selectedVariantOptions.reduce(function (a, b, c) {
                                //     return (sku[a.actualOptionId]() === a.selectedOptionValue().key && (sku[b.actualOptionId]() === b.selectedOptionValue().key) && (sku[c.actualOptionId]() === c.selectedOptionValue().key))
                                // });
                                var TempMatch=true;
                                for (var ii = 0; ii < selectedVariantOptions.length; ii++) {
                                    var ee = selectedVariantOptions[ii];
                                    if(sku[ee.actualOptionId]() != ee.selectedOptionValue().key){
                                        TempMatch=false;
                                        break;
                                    }
                                }
                                match = TempMatch;
                            }
                            return match;
                        } else {
                            return false;
                        }
                    })
                        .map(function (sku, i) {
                            //console.log('sku:', sku);
                            var decoratedSku = decorateSku(sku, rowCounter);
                            rowCounter++;
                            return decoratedSku
                        }));

                    // console.log('==self.allItems()', self.allItems());
                    widget.elements['product-variants-listing'].infinateScrollList(self.allItems().slice(0, self.currentDisplayCount()));
                    // console.log(widget.elements['product-variants-listing']);
                };

                $.Topic('PRODUCT_VARIANT_WITH_DISPATCH_VARIANT_SELECTED').subscribe(function (variantOption) {
                    // console.log('PRODUCT_VARIANT_WITH_DISPATCH_VARIANT_SELECTED', variantOption);
                    self.updateAvailableVariants(variantOption);
                });

                //  Clear the current variant map when the page changes.
                $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(throttle(function (page) {
                    // console.log('PAGE_CHANGED', widget, widget.pageContext(), page);
                    if (widget.pageContext().page.displayName.indexOf('Bedding') >= 0 || widget.pageContext().page.displayName.indexOf('Tier') >= 0) {
                        widget.populateVariantOptions(widget);
                        var inter = setInterval(function(){
                            var listingWidget = widget.elements['product-variants-listing'];
                            if(listingWidget){
                                clearInterval(inter);
                                listingWidget.currentDisplayCount(DISPLAY_COUNT);
                                listingWidget.resetList();
                                listingWidget.infinateScrollList(self.allItems().slice(0, listingWidget.currentDisplayCount()));
                            }
                        },100);
                    }
                }, 3000, false));
            },
        };
    });
