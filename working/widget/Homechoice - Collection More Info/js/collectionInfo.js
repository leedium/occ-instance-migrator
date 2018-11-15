define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
        "use strict";

        var MODULE_NAME = 'hc-CollectionMoreInfo';

        var moduleObj = {
            /**
             * Runs when widget is instantiated
             */
            isInited: false,
            Collection_Title: ko.observable(''),
            Collection_MoreInfo: ko.observable(''),

            //stripTags: function (input) {
            //    var div = document.createElement("div");
            //    div.innerHTML = input;
            //    return div.textContent || div.innerText || "";
            //},


            onLoad: function (widget) {

            },
            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                var widget = this;
                var div = document.createElement("div");
                div.innerHTML = widget.category().longDescription;
                var _T = $(div).find('collection-title').html();
                var _C = $(div).find('collection-content').html();
                if(_T != undefined){widget.Collection_Title(_T);}
                if(_C != undefined){widget.Collection_MoreInfo(_C);}
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function (element, context) {
                // console.log('Hero Carousel Banner::onRender();')
            },

        };

        return moduleObj;
    }
);