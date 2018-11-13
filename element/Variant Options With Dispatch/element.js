/**
 * pdpVariantOptionsWithDispatch
 *
 */


define(
    ['jquery', 'knockout', 'pubsub', 'ccConstants', 'koValidate', 'notifier', 'CCi18n', 'storeKoExtensions', 'swmRestClient', 'spinner', 'pageLayout/product', 'ccRestClient', 'pinitjs', 'ccResourceLoader!global/hc.cart.dynamicproperties.app', 'ccResourceLoader!global/hc.ui.functions','ccResourceLoader!global/hc.ui.functions'],
    function ($, ko, pubsub, CCConstants, koValidate, notifier, CCi18n, storeKoExtensions, swmRestClient, spinner, product, ccRestClient, pinitjs, cartDynamicPropertiesApp, hcUIAppFunctions, hcUIFunctions) {

        "use strict";
        var _widget;
        var self;

        return {
            elementName: "product-variants-with-dispatch",
            NewSort:ko.observableArray([]),
            NewArray:ko.observableArray([]),
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
            },
            autoSelectRadio:function(){
                // $('.product-details-credit-options--list').each(function(){$(this).find('input').first().click()});
            },
            checkBlueTip: function () {
                if(_widget.pageContext().pageType.name === 'product'){
                    var timeout = window.requestTimeout(2000, function () {
                        var blueTip = $('.blueToolTip');
                        if (blueTip.length > 0) {
                            blueTip.tooltip();
                            window.clearRequestTimeout(timeout);
                        }
                    }, self);
                }

            },
            onLoad: function (widget) {

                self = this;
                _widget = widget;
                var tmpArray = widget.variantOptionsArray().slice(0, widget.variantOptionsArray().length - 1);
                //this.variantOptionsArray = ko.observable([]);
                this.variantMap = {};

                var tmpArray = []; // widget.variantOptionsArray().slice(0, widget.variantOptionsArray().length - 1);
                var TempSort = [];
                var sortArray = widget.product().hc_skuVariantOrder().split(',');
                if(sortArray.length > 0){
                    //"hc_type", " hc_size", " hc_pieces" - sortArray
                    //"hc_size", "hc_beddingType", "hc_piece" - variantOptionsArray
                    //Note Difference, need to do magic to make check similar
                    for (var i = 0; i < sortArray.length; i++) {
                        //magic here
                        var sOrder = sortArray[i]
                            .trim()
                            .toLowerCase()
                            .replace('hc_', '')
                            .replace('pieces', 'piece');
                        TempSort.push(sOrder);
                        for (var j = 0; j < widget.variantOptionsArray().length; j++) {
                            var sList = widget.variantOptionsArray()[j];
                            if(sList.actualOptionId.toLowerCase().indexOf(sOrder) >= 0){
                                tmpArray.push(sList);
                                break;
                            }                            
                        }
                    }
                    this.NewSort(TempSort);
                    this.NewArray(tmpArray);

                }
                //elements['product-variants-with-dispatch'].NewArray

                
                $.Topic(pubsub.topicNames.PAGE_READY).subscribe(self.checkBlueTip);
                $.Topic(pubsub.topicNames.PAGE_CONTEXT_CHANGED).subscribe(self.checkBlueTip);

                $.Topic(pubsub.topicNames.PAGE_READY).subscribe(self.autoSelect);
                $.Topic(pubsub.topicNames.PAGE_CONTEXT_CHANGED).subscribe(self.autoSelect);

                this.handleSelectChange = function (target, event) {
                    var variantIndex = parseInt(event.delegateTarget.attributes['data-index'].value);

                    // console.log('handleSelectChange',target);
                    // console.log('variantIndex',variantIndex);
                    // console.log('widget.variantOptionsArray()',widget.variantOptionsArray());
                    // console.log('self.NewArray()',self.NewArray());
                    
                    // console.log('event.delegateTarget.options.selectedIndex -1',event.delegateTarget.options.selectedIndex -1)

                    // widget.variantOptionsArray()[variantIndex].selectedIndex = event.delegateTarget.options.selectedIndex -1;
                    self.NewArray()[variantIndex].selectedIndex = event.delegateTarget.options.selectedIndex -1;

                    // console.log('handle select change',{
                    //     index: variantIndex,
                    //     selectedOptions:   self.NewArray(),
                    //     target: target
                    // });


                    $.Topic('PRODUCT_VARIANT_WITH_DISPATCH_VARIANT_SELECTED').publish({
                        index: variantIndex,
                        selectedOptions:   self.NewArray(),
                        target: target
                    });

                    return true;

                };


                $.Topic('PRODUCT_VARIANT_WITH_DISPATCH_VARIANT_SELECTED').subscribe(function(index, selectedOptions, target){
                    widget.elements, widget.elements["product-variants-with-dispatch"].autoSelectRadio();
                });

                    
                //  Clear the current variant map when the page changes.
                // $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(function (page) {
                //     console.log('Page Changed Dispatch', this, self, page, widget);
                //     if (widget.pageContext().page.displayName.indexOf('Bedding') >= 0 || widget.pageContext().page.displayName.indexOf('Tier') >= 0) {
                //         console.log('reset dispatch..');
                //         self.variantMap = {};
                //     }
                // });
            },
        };
    });
