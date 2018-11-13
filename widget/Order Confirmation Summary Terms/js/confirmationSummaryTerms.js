var _termsSubTotal;

define(

  // -------------------------------------------------------------------
  // DEPENDENCIES
  // -------------------------------------------------------------------
  [ 'knockout', 'CCi18n', 'ccConstants', 'ccResourceLoader!global/hc.cart.dynamicproperties.app', 'pageLayout/product', 'ccResourceLoader!global/hc.ui.paymentViewModel', 'pageLayout/site' ],

  // -------------------------------------------------------------------
  // MODULE DEFINITION
  // -------------------------------------------------------------------
  function(ko, CCi18n, ccConstants, cartDynamicPropertiesApp, Product, paymentViewModel, SiteViewModel) {

    "use strict";
    var _widget;

    return {
      claimedCouponMultiPromotions: ko.observableArray([]),
      implicitPromotionList: ko.observableArray([]),
      newPromotion: function(promotionDesc, promotionId, promotionLevel, totalAdjustment, promotionApplied) {
        var blankPromotion = new Object();
        blankPromotion.promotionDesc = promotionDesc?promotionDesc:'';
        blankPromotion.promotionId = promotionId?promotionId:'';
        blankPromotion.promotionLevel = promotionLevel?promotionLevel:'';
        blankPromotion.totalAdjustment = totalAdjustment?totalAdjustment:'0';
        blankPromotion.promotionApplied = promotionApplied?promotionApplied:false;
        return ko.mapping.fromJS(blankPromotion);
      },
      addToClaimedCouponMultiPromotions: function(coupon,widget) {
        var couponFound = false;
        for(var j = 0; j<widget.claimedCouponMultiPromotions().length; j++) {
          if(coupon.coupon == widget.claimedCouponMultiPromotions()[j].couponCode()) {
            widget.claimedCouponMultiPromotions()[j].promotions.push(widget.newPromotion(coupon.promotionDesc, coupon.promotionId, coupon.promotionLevel, coupon.totalAdjustment, true));
            couponFound = true;
            break;
          }
        }
        if(!couponFound) {
          var newCoupon = new Object()
          var promotionList = [];
          promotionList.push(widget.newPromotion(coupon.promotionDesc, coupon.promotionId, coupon.promotionLevel, coupon.totalAdjustment, true));
          newCoupon.couponCode = coupon.coupon;
          newCoupon.staus = ccConstants.COUPON_STATUS_CLAIMED;
          newCoupon.promotions = promotionList;
          widget.claimedCouponMultiPromotions.push(ko.mapping.fromJS(newCoupon));
        }
      },
      addToImplictDiscountList: function(coupon,widget) {
        widget.implicitPromotionList.push(widget.newPromotion(coupon.promotionDesc, coupon.promotionId, coupon.promotionLevel, coupon.totalAdjustment, true));
      },
      populatePromotions: function(coupons,widget) {
        if(coupons) {
          for(var i=0; i<coupons.length; i++) {
            if(coupons[i].hasOwnProperty("coupon")) {
              widget.addToClaimedCouponMultiPromotions(coupons[i],widget);
            } else {
              widget.addToImplictDiscountList(coupons[i],widget);
            }
          }
        }
      },
      onLoad : function(widget) {
        _widget = widget;
        widget.isGiftCardUsed = ko.computed(
          function() {
            var payments = widget.confirmation().payments;
            if (typeof(payments) != 'undefined' && payments != null){
              for ( var i = 0; i < payments.length; i++) {
                if (payments[i].paymentMethod == ccConstants.GIFT_CARD_PAYMENT_TYPE) {
                  return true;
                }
              }
            }
            
            return false;
          }, widget);

        widget.totalAmount = ko.computed(
          function() {
            var payments = widget.confirmation().payments;
            if (typeof(payments) != 'undefined' && payments != null){
              for ( var i = 0; i < payments.length; i++) {
                if (payments[i].isAmountRemaining
                    && payments[i].paymentMethod != ccConstants.GIFT_CARD_PAYMENT_TYPE) {
                  return payments[i].amount;
                }
              }
            }
            return 0;
          }, widget);
          
          widget.subTotalTerms = ko.computed(
              function() {
            	var shoppingCart = widget.confirmation().shoppingCart;
            	var termsSubTotal = 0;
            	
            	for ( var i = 0; i < shoppingCart.items.length; i++) {

                for (var k in shoppingCart.items[i].dynamicProperties){
                  //alert("Key is " + k + ", value is" + shoppingCart.items[i].dynamicProperties[k]);
                  if (shoppingCart.items[i].dynamicProperties[k].id == "hcTermsCharge") {
                    termsSubTotal += shoppingCart.items[i].dynamicProperties[k].value * shoppingCart.items[i].quantity;
                  }
                }
            	}
            	
            	return termsSubTotal;
              }, widget);
              
              
        widget.getPaymentType = ko.computed(
          function() {
        	var shoppingCart = widget.confirmation().shoppingCart;
        	var paymentType = shoppingCart.items[0].dynamicProperties[0].value;
        	
        	return paymentType;
          }, widget);
          
      },

      beforeAppear: function (page) {
        var widget = this;
        widget.claimedCouponMultiPromotions.splice(0);
        widget.implicitPromotionList.splice(0);
        widget.populatePromotions(widget.confirmation().discountInfo.orderDiscountDescList,widget);
      },
    };
  });
