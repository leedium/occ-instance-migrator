/**
 * @fileoverview Collect Documents Widget.
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

      WIDGET_ID: "profileCollDocuments",

     
      beforeAppear: function (page) {
        var widget = this;

        $.Topic('profileNavigationProgress_Init').publish({"widget": "profileCollDocuments"});

        $.Topic('profileNavigationProgress_PreInit').subscribe(function (data) {
            $.Topic('profileNavigationProgress_Init').publish({ "widget": "profileCollDocuments" });
        });
      },
      // beforeAppear() ---------------------------------------

      onLoad: function (widget) {
        var self = this;

        $.Topic('profileCollDocuments_Save').subscribe(function(data) {
          console.log('subscribe profileCollDocuments_Save');
          // Do screen validations

          // Save data

          $.Topic(data.callback).publish({'result': 'success', 'previousStep': data.previousStep, 'nextStep': data.nextStep, 'paymentType': data.paymentType});
        });

      },
      // onLoad() ---------------------------------------

    };
  }
);
