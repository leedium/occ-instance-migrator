/**
 * @fileoverview Thank You Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'pubsub',
        'navigation',
        'viewModels/address',
        'notifier', 'ccConstants',
        'ccPasswordValidator',
        'CCi18n',
        'swmRestClient',
        'ccRestClient',
        'ccResourceLoader!global/profile.registration.controller'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, PubSub, navigation, Address, notifier, CCConstants, CCPasswordValidator, CCi18n, swmRestClient, CCRestClient,profileRegisterController ) {

        "use strict";
        var REGISTRATION_STATE = 'REGISTRATION_EMPLOYMENT_DETAILS_STATE';


        return {
            WIDGET_ID: "profileThankYou",
            isViewVisible: ko.observable(false),
            hasItemsInBasket: ko.observable(false),



            beforeAppear: function (page) {
                // Every time the user goes to the profile page,
                // it should fetch the data again and refresh it.
                var widget = this;
                if (widget.user().loggedIn() && widget.cart().numberOfItems() > 0) {
                    this.hasItemsInBasket(true);
                }

                profileRegisterController.showModule(widget, REGISTRATION_STATE, function (registerObj) {
                   // do nothing, the controller will handle thankyou visibility
                });


            },
            // beforeAppear() ---------------------------------------

            onLoad: function(widget) {
                var self = this;

                //INTERFACES
                /**
                 * reset
                 * @param value
                 */
                widget.reset = function() {
                    widget.isViewVisible(false);
                    widget.hasItemsInBasket(false);
                };
                //END INTERFACES

                widget.headingMessage = ko.computed(function () {
                    var result = "Thank you for Registering!";
                    if (widget.user().loggedIn() && widget.user().firstName() !== '') {
                        result = widget.user().firstName() + ", thank you for registering!"
                    }
                    return result;
                }, widget);
            }

        };
    }
);
