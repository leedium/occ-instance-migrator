/**
 * @fileoverview extendquickOrder_v1.js.
 *
 * @author 
 */
define(
  //---------------------
  // DEPENDENCIES
  //---------------------
  ['jquery', 'knockout', 'pubsub', 'notifications', 'notifier', 'CCi18n', 'ccConstants', 'placeholderPatch', 'navigation', 'pageLayout/product',
    'ccRestClient', 'pageLayout/site', 'bstypeahead'
  ],

  //-----------------------
  // MODULE DEFINITION
  //-----------------------
   function($, ko, pubsub, notifications, notifier, CCi18n, CCConstants, placeholder, navigation, ProductViewModel, ccRestClient, SiteViewModel) {
    "use strict"; 
    
    var _widget;
    
    return {
    
      onLoad: function(widget) {
        _widget = widget;
          
        widget.popupId = "#region-popupStackSectionTwo";
       
       console.log($('#quickOrderHeader #addToCartButton'), widget)
       
         widget.addToCartPartDeux = function() {
                notifier.clearError("quickOrderWidget");
                var newProduct = [];
                
                for (var items = 0; items < widget.rowsToAddToCart().length; items++) {
                    widget.rowsToAddToCart()[items].errorMessage("");
                    if (!widget.rowsToAddToCart()[items].productQuantity.isValid()) {
                        notifier.sendError("quickOrderWidget", widget.translate('invalidInputs'), true);
                        return;
                    } else if (widget.rowsToAddToCart()[items].productDisplay() == "") {
                        continue;
                    } else if(widget.rowsToAddToCart()[items].productDisplay() !== widget.rowsToAddToCart()[items].productName() + '    ' + widget.rowsToAddToCart()[items].catRefId){
                        widget.rowsToAddToCart()[items].catRefId= widget.rowsToAddToCart()[items].productDisplay();
                        widget.skuList()[items]= widget.rowsToAddToCart()[items].productDisplay();
                        newProduct.push({
                            "orderQuantity": widget.rowsToAddToCart()[items].productQuantity(),
                            "catRefId": widget.rowsToAddToCart()[items].catRefId,
                        });
                    } else {
                        newProduct.push({
                            "orderQuantity": widget.rowsToAddToCart()[items].productQuantity(),
                            "catRefId": widget.rowsToAddToCart()[items].catRefId,
                            "newProdRef": widget.rowsToAddToCart()[items].newProdRef
                        });
                    }
                };
                if (newProduct.length >= 1) {
                    widget.cart().mergeCart(true);
                    var success = function(data) {
                        widget.isDirty(false);
                        for (var i = 0; i < data.length; i++) {
                            var index = widget.skuList.indexOf(data[i].catalogRefId);
                            widget.rowsToAddToCart.splice(index, 1);
                            widget.skuList.splice(index, 1);
                            widget.createNewRow();
                        }
                    };
                    var error = function(errorBlock) {
                        widget.isDirty(false);
                        var errMessages = "";
                        var displayName;
                        for (var k = 0; k < errorBlock.length; k++) {
                            errMessages = errMessages + "\r\n" + errorBlock[k].errorMessage;
                            if (errorBlock[k].catRefId) {
                                var listOfSkus = errorBlock[k].catRefId.split(",");
                                for (var e = 0; e < listOfSkus.length; e++) {
                                    var index = widget.skuList.indexOf(listOfSkus[e]);
                                    if (index > -1) {
                                        if (errorBlock[k].errorCode === "28129") {
                                            widget.rowsToAddToCart()[index].errorMessage(CCi18n.t('ns.quickOrder:resources.noLongerForSaleText'));
                                        } else if (errorBlock[k].errorCode === "2003") {
                                            widget.rowsToAddToCart()[index].errorMessage(CCi18n.t('ns.quickOrder:resources.outOfStockText'));
                                        } else if (errorBlock[k].errorCode === "28360") {
                                            widget.rowsToAddToCart()[index].errorMessage(CCi18n.t('ns.quickOrder:resources.configurableItemText'));
                                        }

                                    }
                                }
                            }
                        }
                        notifier.sendError("quickOrder", errMessages, true);
                    };
                    
                    $.Topic(pubsub.topicNames.CART_UPDATED).subscribe(function onCartSuccess(){
                        $.Topic(pubsub.topicNames.CART_UPDATED).unsubscribe(onCartSuccess);
                        setTimeout(function(){
                            $('#CC-header-cart-total').trigger('click'); 
                        }, 300);
                    })
                    widget.cart().addItemsToCart(newProduct, success, error,true);
                }
            }
            
        $('#region-popupStackSectionOne').on('click',' #addToCartButton', function(e) {
             e.preventDefault();
             widget.addToCartPartDeux();
           });    
        
        $('#region-popupStackSectionTwo').on('click', ".quick-order--add-to-list", function(e){
            e.preventDefault();
            var a = $(this);
            var $prodDeets = a.closest('#cc-product-details');
            var productDetails = ko.dataFor($prodDeets[0]);
            var newProd = productDetails.product().product;
            newProd.childSKUs = [productDetails.selectedSku()];
            widget.addToRow(newProd);
        });
      }, 
      
      beforeAppear: function(p,w) {
          
      },
    };
  }
);