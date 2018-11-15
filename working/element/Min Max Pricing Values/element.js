define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration', 'numberFormatHelper'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, numberFormatHelper) {

        var MODULE_NAME = 'customPricing';
        var widgetModel;

        var moduleObj = {
            elementName: "custom-pricing",
            listPrice : ko.observable(),
            salePrice : ko.observable(),
            
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

                if (widget.product && widget.product()){
                    widget.listPrice(widget.product().listPrice());
                    widget.salePrice(numberFormatHelper.formatNumber(widget.product().salePrice(), 0, "decimal"));
                }
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