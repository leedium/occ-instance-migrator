/**
 * @fileoverview extendcheckoutConfirmation_v7.js.
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
             /**
             * Runs when widget is instantiated
             */
             isInited: false,
             isTerms: ko.observable(true),
             isDocCollect: ko.observable(false),
             termsBank: ko.observable(''),
             termsBankClickDisabled: ko.observable(true),
             paymentVM: paymentViewModel.getInstance(),

             onLoad: function (widget) {
              //cart is now clear so now we need to check items in completed order, can't re-use old cart code.

              try {
                if (widget.cart().contextData.page.confirmation) {
                  var items = [];
                  if (widget.cart().contextData.page.confirmation.shoppingCart) {
                    items = widget.cart().contextData.page.confirmation.shoppingCart.items;

                    for (var index = 0; index < items.length; index++) {
                      var element = items[index];
                      for (var i = 0; i < element.dynamicProperties.length; i++) {
                        var dp = element.dynamicProperties[i];

                        if (dp.id == "hcTermsCharge") {
                            //cash
                            if(dp.value == null) {
                              widget.isTerms(false);
                            }
                            else { 
                            //terms, now look for user Group 4
                            for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                              var hcPersonNo =  widget.user().dynamicProperties()[i];
                              if (hcPersonNo.id() == "hcPersonNo") {
                              //won't work on ccadmin, only in ccstore.
                              if (hcPersonNo.value() != undefined) {
                                if (hcPersonNo.value() == 4) {
                                  widget.isDocCollect(true);
                                }
                              }
                              break; //Break out once found.
                            }
                          }
                        }
                        break; //Break out once found.
                      }
                    }
                    break; //no mixed, only need to check 1st product
                  }
                }
              }
            }
            catch(x){

            }

                //Override for test only
                //widget.isTerms(true);
                
                //widget.isDocCollect(true);
                
                // widget.paymentVM.isThankYou(true);
                // widget.paymentVM.isCollectDocs(false); //because not on collect page.

                // widget.SaveBankAndContinue = function () {
                //     console.log('setBank MOVE!', widget);
                //     navigation.goTo('/document-collection', false, true);
                // };

                // widget.termsBankClick = function () {
                //     console.log('setBank', widget.termsBank());
                //     widget.paymentVM.statementsOption(widget.termsBank());
                //     widget.termsBankClickDisabled(false);
                //     return true;
                // };

                
              },

              beforeAppear: function() {
              //console.log('extendcheckoutConfirmation_v7.js before appear');
              
            },

            getTermName: function (prodID, pData) {
              var terms = this.getTerm(prodID, pData.productData());
              return terms.value == 'cash' ? '(Cash)' : '(Terms)';
            },

            getTerm: function (pId, pData) {
              var product = new Product(pData);
              return cartDynamicPropertiesApp.getInstance(this).getPropsById(product.childSKUs()[0].repositoryId(), 'hcPaymentOption');
            },
          };
        }
        );