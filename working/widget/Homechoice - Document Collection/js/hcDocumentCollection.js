define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

        var MODULE_NAME = 'hc-DocumentCollection';

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            isInited: false,

            onLoad: function (widget) {
                // console.log('Hero Carousel Banner::onload();',widget);
              
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
             
            }

        };

        return moduleObj;
    }
);



