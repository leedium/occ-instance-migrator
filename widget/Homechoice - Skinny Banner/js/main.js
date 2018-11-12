define(['knockout', 'jquery', 'ccStoreConfiguration'],

    function (ko, $, pubsub, CCStoreConfiguration) {

        var MODULE_NAME = 'hcSkinnyBanner';

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            isInited: false,
            bannerSmall: ko.observable('init'),
            bannerLarge: ko.observable('init'), 
            bannerLink: ko.observable('init'), 

            onLoad: function (widget) {

                widget.bannerLarge(widget.resources().skinny_banner_large_image_url);
                widget.bannerSmall(widget.resources().skinny_banner_small_image_url);
                widget.bannerLink(widget.resources().skinny_banner_link);
                
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                CheckQuickBanner();
            }
        };

        return moduleObj;
    }
);