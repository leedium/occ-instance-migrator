define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration', 'numberFormatHelper'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, numberFormatHelper) {
        "use strict";
        
        return {
            elementName: 'product-badges'
        };
    }
);