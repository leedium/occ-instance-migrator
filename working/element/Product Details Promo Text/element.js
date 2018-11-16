define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

    function objIndex(obj,i) {return obj[i]}

        var widget;

        var MODULE_NAME = 'product-details-promo';

        var moduleObj = {
            stringValue: ko.observable(''),
            elementName: "productDetailsPromoText",
            /**
             * Runs when widget is instantiated
             */
            property: ko.observable(''),
            onLoad: function(widgetModel) {
                widget = widgetModel;
                console.log('productPromo onLoad', widget);
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