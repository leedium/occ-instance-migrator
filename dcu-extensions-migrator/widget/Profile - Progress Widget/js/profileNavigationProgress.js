/**
 * @project homechoice.co.za
 * @file profileNavigationProgress.js
 * @company leedium
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 10/08/2018
 * @description Visual representation for what stage of the registration
 *              checkout process the user is in.
**/


define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'pubsub',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/hc.constants'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (
        ko,
        pubsub,
        cartDynamicPropertiesApp,
        constants
    ) {
        "use strict";

        var findDynamicPropertyValue = function (properties, id) {
            return properties.reduce(function (a, b) {
                return b.id() === id ? b : a;
            });
        };

        return {
            cartProps: null,
            currentProgress: ko.observable(0),
            isViewVisible: ko.observable(false),
            registrationComplete: ko.observable(false),
            beforeAppear: function () {
                var widget = this;
                widget.isViewVisible(true);
                widget.getProgress();
            },

            /**
             * Executes when widget gets instantiated with model
             * @param widget
             */
            onLoad: function (widget) {
                /**
                 * stub
                 */
                widget.reset = function () {
                };

                /**
                 * REQUIRED
                 * @param value
                 */
                widget.updateProgress = function (value) {
                    widget.currentProgress(value);
                    widget.checkVisibility();
                };

                /**
                 * Return the level of progress
                 */
                widget.getProgress = function () {
                    var value;

                    if (widget.registrationComplete().complete && widget.pageContext().page.name === "checkout") {
                        value = 75;
                    } else {
                        value = 50;
                    }
                    widget.currentProgress(value);
                };

                widget.user().loggedIn.subscribe(function () {
                    setTimeout(function () {
                        widget.getProgress();
                    }, 1000)
                });

                $.Topic(constants.PROFILE_CONTROLLER_POLLING_COMPLETE).subscribe(function (status) {
                    if (status.newMember) {
                        widget.registrationComplete(false);
                    } else {
                        widget.registrationComplete(true);
                    }
                });
                $.Topic(constants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS).subscribe(function (status) {
                    widget.registrationComplete(true);
                });
            }
        };
    }
);
