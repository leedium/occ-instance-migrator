define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['knockout', 'pubsub', 'notifications', 'CCi18n', 'ccConstants', 'navigation',
        'jquery', 'ccResourceLoader!global/hc.cart.dynamicproperties.app', 'ccResourceLoader!global/hc.constants'],

    // -------------------------------------------------------------------
    // MODULE DEFINITION
    // -------------------------------------------------------------------
    function (ko, pubsub, notifications, CCi18n, CCConstants, navigation,
              $, cartDynamicPropertiesApp, hcConstants) {
        "use strict";

        var elementName = "hcHeaderWelcome";

        // ---------------------------------------------------------------- //
        // findDynamicPropertyValue
        // Accepts the user().dynamicProperties collection, and returns
        // the value for the passed key (id).
        // ---------------------------------------------------------------- //
        var findDynamicPropertyValue = function (properties, id, isObject) {
            return properties.reduce(function (a, b) {
                if (isObject) {
                    return b.id === id ? b : a;
                } else {
                    return b.id() === id ? b : a;
                }
            });
        };
        var moduleObj = {
            ATB_Limit: ko.observable(''),
            elementName: elementName,
            onLoad: function (widget) {
                var self = this;
                var atbAmount;
                widget.setAtbAmount = function (atbAmount) {
                    if (atbAmount === null) { 
                        atbAmount = widget.site().extensionSiteSettings['blockingOvercommitSettings'].ATB_Val;
                    }
                    if(parseInt(atbAmount) + "" == "NaN"){
                        atbAmount = widget.site().extensionSiteSettings['blockingOvercommitSettings'].ATB_Val;
                    }
                    else{
                        atbAmount = parseInt(atbAmount);
                    }
                    self.ATB_Limit('Hi ' + widget.user().firstName() + ', you have R' + atbAmount + ' credit to spend!');
                };
                if (widget.user().loggedIn()) {
                    widget.setAtbAmount(findDynamicPropertyValue(widget.user().dynamicProperties(), "creditLimit").value())
                }
                $.Topic(hcConstants.PROFILE_CONTROLLER_POLLING_COMPLETE).subscribe(function (status) {
                    if (status.updatedProfile) {
                        widget.setAtbAmount(findDynamicPropertyValue(status.updatedProfile.dynamicProperties, "creditLimit", true).value)
                    }
                })
            }
        };
        return moduleObj;
    }
);


