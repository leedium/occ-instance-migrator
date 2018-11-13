/**
 * @fileoverview Order Confirmation Widget.
 * 
 */
define(
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'navigation', 'viewModels/address', 'notifier', 'ccConstants', 'ccPasswordValidator', 'CCi18n', 'swmRestClient', 'ccRestClient'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, PubSub, navigation, Address, notifier, CCConstants, CCPasswordValidator, CCi18n, swmRestClient, CCRestClient) {

    "use strict";

    return {

      WIDGET_ID: "profileOrderConfirmation",

     
      beforeAppear: function (page) {
        // Every time the user goes to the profile page,
        // it should fetch the data again and refresh it.
        var widget = this;
     
        $.Topic('profileNavigationProgress_Init').publish({"widget": "profileOrderConfirmation"});

        $.Topic('profileNavigationProgress_PreInit').subscribe(function (data) {
            $.Topic('profileNavigationProgress_Init').publish({ "widget": "profileOrderConfirmation" });
        });
        // beforeAppear() ---------------------------------------
      },

      onLoad: function (widget) {
        var self = this;

     
        // onLoad() ---------------------------------------
      },


    };
  }
);
