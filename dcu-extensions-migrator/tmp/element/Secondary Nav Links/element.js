define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, CCStoreConfiguration) {
        "use strict";

        var widgetModel;

        return {
            elementName: 'secondary-nav-links-element',

            /**
             * Runs when widget is instantiated
             */
            onLoad: function(widget) {
                widgetModel = widget;
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function(page) {
                var widget = this;

            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function(element, context) {

            },

            /**
             * Adds css classes based on user options
             * @returns {{}}
             */
            cssClasses: function(){

            }
        };
    }
);