/**
 * @fileoverview Promotion Widget.
 *
 *
 * This widget is useful for handling promotion/coupon related functionality.
 *
 */
define(

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'ccConstants', 'koValidate', 'ccKoValidateRules', 'CCi18n', 'ccResourceLoader!global/hc.cart.dynamicproperties.app',
      'ccResourceLoader!global/profile.checkout.controller'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function(ko, pubsub, CCConstants, koValidate, rules, CCi18n, cartDynamicPropertiesApp, hcCheckoutController) {

    "use strict";
      var VISIBLE_STATE = 'cash_terms';

    return {
      visibleState:VISIBLE_STATE,
      cartProps: null,
      promoCode: ko.observable(),
      isViewVisible: ko.observable(false),
      isApplyCodeClicked: ko.observable(false),
      isUserLoggedIn: ko.observable(false),
      applyButtonClicked: ko.observable(false),
      couponSuccessfullyApplied: ko.observable(false),
      emptyCoupon: ko.observable(false),

      /**
      * beforeAppear function
      */
      beforeAppear: function () {
        var widget = this;
        widget.promoCode('');
        widget.promoCode.extend({ validatable: true });
        widget.promoCode.isModified(false);
        widget.cart().couponErrorMessage('');
          hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
              widget.isViewVisible(ready.show);
          });
      },

      /**
      * onLoad function
      */
      onLoad: function(widget) {
        widget.reset = function(){
            widget.isViewVisible(false);
        };

        widget.validate = function() {
            return true;
        };


        $.Topic("Coupon_Removed").subscribe(function () {
            widget.couponSuccessfullyApplied(false);
        });



        // Clear the coupon input field when successfully applied.
        $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).subscribe(function() {
            var errorMessage = widget.cart().couponErrorMessage();

          // do not clear the input promotion code when there is some coupon error.
          if (!errorMessage || errorMessage === '') {
            // widget.promoCode('');

            // if ($('#CC-promotionDetails-promoCode').val() !== '') {
            //     $('#CC-promotionDetails-promoCode').attr('readonly', 'readonly');
            //     $('#CC-promotion-applyCode').attr('disabled', 'disabled');
            // }
            // else {
            //     $('#CC-promotionDetails-promoCode').removeAttr('readonly');
            //     $('#CC-promotion-applyCode').removeAttr('disabled');
              // }
              if (widget.cart().coupons().length == 0) {
                  widget.couponSuccessfullyApplied(false);
              } else {
                  widget.couponSuccessfullyApplied(true);
              }

          }
        });

        // Clears coupon input field and error message after logout
        $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).subscribe(function() {
          widget.promoCode('');
          widget.cart().couponErrorMessage('');
        });
      },

      /**
      * This function handles functionality of applying a coupon
      */
      handleApplyCoupon: function() {
        var widget = this;
        var userLoggedIn = widget.user().loggedInUserName() && (widget.user().loggedIn() || widget.user().isUserSessionExpired());
        widget.applyButtonClicked(true);
        widget.couponSuccessfullyApplied(false);

        if (widget.cart().couponErrorMessage()) {
          widget.cart().couponErrorMessage('');

        }

        if (!userLoggedIn) {
            // widget.applyButtonClicked(true);
            widget.isUserLoggedIn(false);
        }
        else {
            widget.isUserLoggedIn(true);

            if ($('#CC-promotionDetails-promoCode').val() === '') {
                widget.emptyCoupon(true);
            }
            else {
                widget.emptyCoupon(false);
                if (widget.promoCode() && widget.promoCode().trim() !== '') {
                  // check if the coupon has already been applied.
                  if (widget.couponAlreadyApplied(widget.promoCode().trim())) {
                    widget.cart().couponErrorMessage(widget.translate(CCConstants.COUPON_APPLY_ERROR_DUPLICATE_CODE));
                  } else {
                    widget.cart().addCoupon(widget.promoCode().trim());
                    //widget.couponSuccessfullyApplied(true);
                    // disable Apply Code button for a specific time when clicked.
                    // widget.handleEnableApplyCodeButton();
                  }
                }
            }

        }
      },

      /**
      * This function returns true if the couponCode is already applied.
      *
      */
      couponAlreadyApplied: function(couponCode) {
        var widget = this;
        var alreadyApplied = false;
        if (widget.cart().coupons() && widget.cart().coupons().length > 0) {
          var couponCount = widget.cart().coupons().length;
          for (var i = 0; i < couponCount; i++) {
            if (widget.cart().coupons()[i].code() == couponCode) {
              alreadyApplied = true;
              break;
            }
          }
        }
        return alreadyApplied;
      },

      /**
      * This function is used to handle disable Apply Code button for
      *     a specific time when it is clicked and enable again.
      */
      handleEnableApplyCodeButton: function() {
        var widget = this;
        widget.isApplyCodeClicked(true);
        setTimeout(enableApplyCodeButton, 2000);

        function enableApplyCodeButton() {
          widget.isApplyCodeClicked(false);
        }
      }
    };
  }
);

// /**
//  * @fileoverview Promotion Widget.
//  *
//  *
//  * This widget is useful for handling promotion/coupon related functionality.
//  *
//  */
// define(

//   //-------------------------------------------------------------------
//   // DEPENDENCIES
//   //-------------------------------------------------------------------
//   ['knockout', 'pubsub', 'ccConstants', 'koValidate', 'ccKoValidateRules', 'CCi18n'],

//   //-------------------------------------------------------------------
//   // MODULE DEFINITION
//   //-------------------------------------------------------------------
//   function(ko, pubsub, CCConstants, koValidate, rules, CCi18n) {

//     "use strict";

//     return {
//       promoCode: ko.observable(),
//       isApplyCodeClicked: ko.observable(false),

//       /**
//       * beforeAppear function
//       */
//       beforeAppear: function (page) {
//         var widget = this;
//         widget.promoCode('');
//         widget.promoCode.extend({ validatable: true });
//         widget.promoCode.isModified(false);
//         widget.cart().couponErrorMessage('');
//       },

//       /**
//       * onLoad function
//       */
//       onLoad: function(widget) {
//         // Clear the coupon input field when successfully applied.
//         $.Topic(pubsub.topicNames.COUPON_ADD_CLEAR_INPUT).subscribe(function() {
//           var errorMessage = widget.cart().couponErrorMessage();
//           // do not clear the input promotion code when there is some coupon error.
//           if (!errorMessage || errorMessage == '') {
//             widget.promoCode('');
//           }
//         });

//         // Clears coupon input field and error message after logout
//         $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).subscribe(function() {
//           widget.promoCode('');
//           widget.cart().couponErrorMessage('');
//         });
//       },

//       /**
//       * This function handles functionality of applying a coupon
//       */
//       handleApplyCoupon: function() {
//         var widget = this;
//         if (widget.cart().couponErrorMessage()) {
//           widget.cart().couponErrorMessage('');
//         }

//         if (widget.promoCode() && widget.promoCode().trim() !== '') {
//           // check if the coupon has already been applied.
//           if (widget.couponAlreadyApplied(widget.promoCode().trim())) {
//             widget.cart().couponErrorMessage(widget.translate(CCConstants.COUPON_APPLY_ERROR_DUPLICATE_CODE));
//           } else {
//             widget.cart().addCoupon(widget.promoCode().trim());
//           }
//           // disable Apply Code button for a specific time when clicked.
//           widget.handleEnableApplyCodeButton();
//         }
//       },

//       /**
//       * This function returns true if the couponCode is already applied.
//       *
//       */
//       couponAlreadyApplied: function(couponCode) {
//         var widget = this;
//         var alreadyApplied = false;
//         if (widget.cart().coupons() && widget.cart().coupons().length > 0) {
//           var couponCount = widget.cart().coupons().length;
//           for (var i = 0; i < couponCount; i++) {
//             if (widget.cart().coupons()[i].code() == couponCode) {
//               alreadyApplied = true;
//               break;
//             }
//           }
//         }
//         return alreadyApplied;
//       },

//       /**
//       * This function is used to handle disable Apply Code button for
//       *     a specific time when it is clicked and enable again.
//       */
//       handleEnableApplyCodeButton: function() {
//         var widget = this;
//         widget.isApplyCodeClicked(true);
//         setTimeout(enableApplyCodeButton, 2000);
//         function enableApplyCodeButton() {
//           widget.isApplyCodeClicked(false);
//         };
//       }
//     };
//   }
// );

