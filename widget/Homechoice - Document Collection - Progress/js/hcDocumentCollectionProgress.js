define(['knockout', 'jquery', 'ccResourceLoader!global/hc.ui.paymentViewModel', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],

    function (ko, $, paymentViewModel, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

        var MODULE_NAME = 'hc-DocumentCollection-Progress';

        var moduleObj = {
            //isThankYou: ko.observable(),
            //isCollectDocs: ko.observable(),
            paymentVM: paymentViewModel.getInstance(),

            /**
             * Runs when widget is instantiated
             */
            isInited: false,

            onLoad: function (widget) {
                
                //widget.isThankYou(widget.paymentVM.isThankYou()),
                //widget.isCollectDocs(widget.paymentVM.isCollectDocs()),

                console.log('hc-DocumentCollection-Progress !!',widget);
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