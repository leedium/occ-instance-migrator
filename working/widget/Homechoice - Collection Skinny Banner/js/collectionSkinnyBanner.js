define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
        "use strict";

        var MODULE_NAME = 'hc-CollectionSkinnyBanner';

        var moduleObj = {
            /**
             * Runs when widget is instantiated
             */
            isInited: false,
            skinny_Image_Lg: ko.observable(''),
            skinny_Image_Md: ko.observable(''),
            skinny_Image_Sm: ko.observable(''),
            skinny_Link: ko.observable(''),

            banner_Image_Lg: ko.observable(''),
            banner_Image_Md: ko.observable(''),
            banner_Image_Sm: ko.observable(''),
            banner_exists: ko.observable('false'),

            onLoad: function (widget) {

            },
            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                var widget = this;


                widget.skinny_Image_Lg('');
                widget.skinny_Image_Md('');
                widget.skinny_Image_Sm('');
                widget.skinny_Link('');
    
                widget.banner_Image_Lg('');
                widget.banner_Image_Md('');
                widget.banner_Image_Sm('');
                widget.banner_exists('false');


                var div = document.createElement("div");
                div.innerHTML = widget.category().longDescription;

                //Skinny Advert
                var _L = $(div).find('skinny-link').html();
                var _I = $(div).find('skinny-image').html();
                if(_L != undefined){widget.skinny_Link(_L);}
                if(_I != undefined){
                    widget.skinny_Image_Sm('/ccstore/v1/images/?source=/file/v2/general/' + _I + '-sm.jpg');
                    widget.skinny_Image_Md('/ccstore/v1/images/?source=/file/v2/general/' + _I + '-md.jpg');
                    widget.skinny_Image_Lg('/ccstore/v1/images/?source=/file/v2/general/' + _I + '-lg.jpg');
                }


                //Banner
                var _IB = $(div).find('banner-image').html();
                if(_IB != undefined){
                    widget.banner_exists('true');
                    widget.banner_Image_Sm('/ccstore/v1/images/?source=/file/v2/general/' + _IB + '-sm.jpg');
                    widget.banner_Image_Md('/ccstore/v1/images/?source=/file/v2/general/' + _IB + '-md.jpg');
                    widget.banner_Image_Lg('/ccstore/v1/images/?source=/file/v2/general/' + _IB + '-lg.jpg');
                }
            }
        };

        return moduleObj;
    }
);