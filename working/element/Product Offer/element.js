define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration', 'ccResourceLoader!global/hc.cart.dynamicproperties.app'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, cartDynamicPropertiesApp) {

        var _widget;

        var moduleObj = {
            arrayException: ko.observable(''),
            elementName: "pdpPO",
            /**
             * Runs when widget is instantiated
             */
            property: ko.observable(''),

            onLoad: function (widgetModel) {
                var self = this;
                _widget = widgetModel;

                var NoOfferArr = _widget.site().extensionSiteSettings.pdpProductOfferSettings.POexceptionValues.toLowerCase().split(',');
                console.log('Product Offer Internal:: NoOfferArr', NoOfferArr);


                // if (_widget.product().productOffer() != null) {
                //     var CurrentOffer = _widget.product().productOffer().toString().toLowerCase();
                //     console.log('Product Offer Internal:: CurrentOffer', CurrentOffer);

                //     var checkOffer = false;
                //     NoOfferArr.forEach(function (entry) {
                //         if (CurrentOffer == entry) checkOffer = true;
                //     });
                //     console.log('Product Offer Internal:: checkOffer', checkOffer);
                //     if (checkOffer)
                //         _widget.product().productOffer("");
                // }
                // else {
                //     _widget.product().productOffer("");
                // }


                //this.arrayException = model.site().extensionSiteSettings['pdpProductOfferSettings'].POexceptionValues.split(',');

                //console.log('pdpProductOfferSettings', this.arrayException);

            },


            //checkExceptions: function (theValueToCheck) {
            //
            //    var pos = value.findIndex(item => theValueToCheck.toLowerCase() === item.toLowerCase());
            //
            //    if (pos < 0) return false;
            //    return true;
            //},

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
            }
        };

        return moduleObj;
    }
);