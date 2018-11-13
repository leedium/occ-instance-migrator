define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
        "use strict";

        var MODULE_NAME = 'hc-PDPSharedContent';

        var moduleObj = {
            isInited: false,

            onLoad: function (widget) {

                $(document).ready(function(){
                    $(document).on('click', '.phpSharedAccord > li > div', function(){
                        if(!$(this).parent().hasClass('active')){
                            $('.phpSharedAccord li').removeClass('active');
                            $('.phpSharedAccord li ul').slideUp(500);
                            $(this).parent().addClass('active');
                            var that =  $(this);
                            $(this).parent().find('ul').slideDown(500, function(){
                                $("html, body").animate({scrollTop: that.offset().top - 50}, 500);
                            });
                            
                        }
                        else{
                            $('.phpSharedAccord li').removeClass('active');
                            $('.phpSharedAccord li ul').slideUp(500);
                        }
                    });
                });
            },
            onRender: function (element, context) {

            }
        };

        return moduleObj;
    }
);