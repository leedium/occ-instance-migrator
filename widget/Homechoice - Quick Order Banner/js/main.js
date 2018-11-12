function CheckQuickBanner() {
    var MaxW = $('.QuickOrderButton').parents('main').width();
    var MarginLeft = ($('.QuickOrderButton').parents('#main').css('marginLeft'));
    var w = $(window).width();
    if(w > 768){
        if (w < 993) {
            if (MarginLeft != undefined) {
                MarginLeft = parseInt(MarginLeft.replace('px', '')) + 15 + 'px';
            }
        }
        $('.QuickOrderButton').width(MaxW);
        $('.QuickOrderButton').css('marginLeft', '-' + MarginLeft);
    }
}

define(['knockout', 'jquery', 'ccStoreConfiguration'],

    function (ko, $, pubsub, CCStoreConfiguration) {

        var MODULE_NAME = 'hcQuickOrderButton';

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            isInited: false,
            bannerSmall: ko.observable('init'),
            bannerMedium: ko.observable('init'),
            bannerLarge: ko.observable('init'),

            onLoad: function (widget) {

                widget.bannerLarge(widget.resources().quick_order_large_image_url);
                widget.bannerMedium(widget.resources().quick_order_medium_image_url);
                widget.bannerSmall(widget.resources().quick_order_small_image_url);

                $(window).resize(function () {
                    CheckQuickBanner();
                });
                $(document).ready(function () {
                    CheckQuickBanner();
                });
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