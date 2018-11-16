define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

        var MODULE_NAME = 'content-block-image';

        var moduleObj = {
            elementName: "contentBlockImage",
            /**
             * Runs when widget is instantiated
             */
            onLoad: function(widget) {
                // console.log('element onLoad', widget);
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function() {
                //console.log('beforeAppear', this);
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

        return moduleObj;
    }
);