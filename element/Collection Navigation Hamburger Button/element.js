define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration', 'storageApi'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, storageApi) {

        var widget;
        var elementName = "hcCollectionNavigationHamburger";
        var MODULE_NAME = 'hc-collection-navigation-hamburger';

        var moduleObj = {
            navOpen: ko.observable(''),
            elementName: elementName,
            /**
             * Runs when widget is instantiated
             */
            onLoad: function(widgetModel) {
                widget = widgetModel;
                console.log(MODULE_NAME,'loaded', widgetModel, this);
            },

            toggleOpen: function(context, event){
                context.elements[elementName].navOpen(!context.elements[elementName].navOpen());
            },

            /**
             *
             * @param context
             * @param event
             */
            handleMenuAction: function(context,event) {

            }
        };
        return moduleObj;
    }
);