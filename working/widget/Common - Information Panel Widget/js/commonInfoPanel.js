/**
 * @fileoverview Information Panel Widget.
 * 
 */
define(
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'navigation', 'notifier', 'ccConstants', 'ccPasswordValidator', 'CCi18n', 'swmRestClient', 'ccRestClient'],
    
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, PubSub, navigation, notifier, CCConstants, CCPasswordValidator, CCi18n, swmRestClient, CCRestClient) {
  
    "use strict";
        
    return {
      
      WIDGET_ID: "commonInfoPanel",
      panelHeading: ko.observable('Lorem ipsum'),
      panelDescription: ko.observable('Lorem ipsum'),
      registerButtonVisible: ko.observable(false),
      shoppingButtonVisible: ko.observable(false),
      cartButtonVisible: ko.observable(false),

      beforeAppear: function (page) {
        var widget = this;

        $.Topic('profileNavigationProgress_Init').publish({"widget": "commonInfoPanel"});

        $.Topic('profileNavigationProgress_PreInit').subscribe(function (data) {
            $.Topic('profileNavigationProgress_Init').publish({ "widget": "commonInfoPanel" });
        });
        
         $.Topic('PROFILE_CHECKOUT_COMPONENT_LOADED').publish({
                key:'PROFILE_CHECKOUT_INFOPANEL_VIEW',
                widget:widget
          });
        
      },
      // beforeAppear() ---------------------------------------
      
      onLoad: function(widget) {
        var self = this;
        
        //INTERFACE
        widget.reset = function(){}
       
        widget.setButtonVisibility = function (button) {
          
          this.registerButtonVisible(false);
          this.cartButtonVisible(false);
          this.shoppingButtonVisible(false);

          switch(button) {
            case 'register':
              this.registerButtonVisible(true);
              break;
            case 'cart':
              this.cartButtonVisible(true);
              break;
            case 'shopping':
              this.shoppingButtonVisible(true);
              break;
            default:
              break;
          }
        };

        $.Topic('commonInfoPanel_SetPanel').subscribe(function (data) {
          console.log('commonInfoPanel_SetPanel');
          if (data) {
            widget.panelHeading(data.heading);
            widget.panelDescription(data.description);

            if (data.primaryButton) {
              widget.setButtonVisibility(data.primaryButton);
            }

            if (data.secondaryButton) {
              widget.setButtonVisibility(data.secondaryButton);
            }

            $('#CC-commonInfoPanel').hide();
            if (data.showPanel) {
              $('#CC-commonInfoPanel').show();
            }
          }
        });

      }
	// onLoad() ---------------------------------------

    };
  }
);
