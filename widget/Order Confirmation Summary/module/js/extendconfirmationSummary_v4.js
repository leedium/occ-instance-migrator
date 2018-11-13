/**
 * @fileoverview extendconfirmationSummary_v4.js.
 *
 * @author 
 */
 define(
  //---------------------
  // DEPENDENCIES
  //---------------------
  ['knockout', 'jquery', 'pubsub', 'ccLogger', 'CCi18n', 'notifier', 'ccConstants', 'ccRestClient', 'ccResourceLoader!global/hc.cart.dynamicproperties.app', 'pageLayout/product', 'ccResourceLoader!global/hc.ui.paymentViewModel', 'pageLayout/site'],

  //-----------------------
  // MODULE DEFINITION
  //-----------------------
  function (ko, $, pubsub, log, CCi18n, CCRestClient, notifier, CCConstants, cartDynamicPropertiesApp, Product, paymentViewModel, SiteViewModel) {

    "use strict";
    return {
      termsSubTotal: ko.observable(1234),

      onLoad: function(widget) {
        console.log('extendconfirmationSummary_v4.js onLoad');
      }, 
      
      beforeAppear: function(page) {
        console.log('extendconfirmationSummary_v4.js before appear');

        var widget = this;
        
        var shoppingCart = widget.confirmation().shoppingCart;
        var termsSubTotal2 = 0;

        //console.log("w ", widget);
        //console.log("SP... ", shoppingCart);
        //console.log(widget.termsSubTotal);

        for ( var i = 0; i < shoppingCart.items.length; i++) {
          //console.log("item ", i);
          termsSubTotal2 += shoppingCart.items[i].dynamicProperties[5].value;
        }

        widget.termsSubTotal = termsSubTotal2;
        widget.termsSubTotal(termsSubTotal2);
        
        // console.log("terms sub total 1: ", widget.termsSubTotal);
        // console.log("terms sub total 2: ", termsSubTotal2);
      }

    //   getTermsSubTotal : function() {
    //     var widget = this;

    //     return termsSubTotal2;
    //   }
    };
  }
  );