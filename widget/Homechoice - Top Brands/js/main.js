define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

        var MODULE_NAME = 'hc-TopBrands';

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
             isInited: false,
             bannerWidth: ko.observable('auto'),
             bannerOffset: ko.observable('0px'),

             itemsPerRowInLargeDesktopView: ko.observable(6),
             itemsPerRowInDesktopView: ko.observable(6),
             itemsPerRowInTabletView: ko.observable(3),
             itemsPerRowInPhoneView: ko.observable(2),
             itemsPerRow: ko.observable(),
             indicatators: ko.observable(0),
             totalItems: ko.observable(0),
             viewportWidth: ko.observable(),
             viewportMode: ko.observable(),
             productGroups: ko.observableArray(),
             products: ko.observableArray(),
             titleText: ko.observable(),
             spanClass: ko.observable(),
             spanClassNumber: ko.observable(),
             isCollectionVisible: ko.observable(true),
             storeConfiguration: CCStoreConfiguration.getInstance(),

             onLoad: function (widget) {
                // console.log('Hero Carousel Banner::onload();',widget);
                var win = $(window);
                var main = $('#main');

                if (widget.fullWidth()) {
                    win.on('resize', function (e) {
                        var winWidth = win.width();
                        var mainWidthOffset = (winWidth - main.width()) * .5;
                        widget.bannerOffset(-mainWidthOffset + 'px');
                        widget.bannerWidth(winWidth + 'px');
                    });
                    win.trigger('resize');

                }

                widget.updateSpanClass = function () {
                    var classString = "";
                    var phoneViewItems = 0,
                    tabletViewItems = 0,
                    desktopViewItems = 0,
                    largeDesktopViewItems = 0;

                    if (this.itemsPerRow() == this.itemsPerRowInPhoneView()) {
                        phoneViewItems = 12 / this.itemsPerRow();
                    }
                    if (this.itemsPerRow() == this.itemsPerRowInTabletView()) {
                        tabletViewItems = 12 / this.itemsPerRow();
                    }
                    if (this.itemsPerRow() == this.itemsPerRowInDesktopView()) {
                        desktopViewItems = 12 / this.itemsPerRow();
                    }
                    if (this.itemsPerRow() == this.itemsPerRowInLargeDesktopView()) {
                        largeDesktopViewItems = 12 / this.itemsPerRow();
                    }
                    

                    if (phoneViewItems > 0) {
                        classString += "col-xs-" + phoneViewItems;
                        widget.spanClassNumber(12/phoneViewItems);
                    }
                    if ((tabletViewItems > 0) && (tabletViewItems != phoneViewItems)) {
                        classString += " col-sm-" + tabletViewItems;
                        widget.spanClassNumber(12/tabletViewItems);
                    }
                    if ((desktopViewItems > 0) && (desktopViewItems != tabletViewItems)) {
                        classString += " col-md-" + desktopViewItems;
                        widget.spanClassNumber(12/desktopViewItems);
                    }
                    if ((largeDesktopViewItems > 0) && (largeDesktopViewItems != desktopViewItems)) {
                        classString += " col-lg-" + largeDesktopViewItems;
                        widget.spanClassNumber(12/largeDesktopViewItems);
                    }

                    widget.spanClass(classString);


                //Re-generate with new sizes.... //widget.spanClass //widget.spanClassNumber
                widget.moveImageToSlider();
            };

            widget.checkResponsiveFeatures = function (viewportWidth) {
                if (viewportWidth > CCConstants.VIEWPORT_LARGE_DESKTOP_LOWER_WIDTH) {
                    if (widget.viewportMode() != CCConstants.LARGE_DESKTOP_VIEW) {
                        widget.viewportMode(CCConstants.LARGE_DESKTOP_VIEW);
                        widget.itemsPerRow(widget.itemsPerRowInLargeDesktopView());
                    }
                } else if (viewportWidth > CCConstants.VIEWPORT_TABLET_UPPER_WIDTH
                    && viewportWidth <= CCConstants.VIEWPORT_LARGE_DESKTOP_LOWER_WIDTH) {
                    if (widget.viewportMode() != CCConstants.DESKTOP_VIEW) {
                        widget.viewportMode(CCConstants.DESKTOP_VIEW);
                        widget.itemsPerRow(widget.itemsPerRowInDesktopView());
                    }
                } else if (viewportWidth >= CCConstants.VIEWPORT_TABLET_LOWER_WIDTH
                    && viewportWidth <= CCConstants.VIEWPORT_TABLET_UPPER_WIDTH) {
                    if (widget.viewportMode() != CCConstants.TABLET_VIEW) {
                        widget.viewportMode(CCConstants.TABLET_VIEW);
                        widget.itemsPerRow(widget.itemsPerRowInTabletView());
                    }
                } else if (widget.viewportMode() != CCConstants.PHONE_VIEW) {

                    widget.viewportMode(CCConstants.PHONE_VIEW);
                    widget.itemsPerRow(widget.itemsPerRowInPhoneView());

                }

                widget.updateSpanClass();
            };


            widget.moveImageToSlider = function(){

                //Fix the snap point for the element once loaded onto screen
                //stupid layout always puts in a row, need to change it to col.
                var checkExist = setInterval(function () {
                    if ($('.theTemplateItems > div .oc-panel span').length) {

                        // //widget.spanClass //widget.spanClassNumber
                        var ItemPerRow = widget.spanClassNumber();
                        
                        var theItems = $('.theTemplateItems .oc-panel .cc-image');
                        //console.log('~~~~~theItems~~~~~~', theItems);
                        //reset slider
                        $('.hc-TopBrands .carousel-inner').html('');
                        
                        var TheItemsRows = Math.ceil(theItems.length / ItemPerRow); 
                        widget.indicatators(TheItemsRows);
                        widget.totalItems(theItems.length);
                        for (i = 0; i < TheItemsRows; i++) { 
                            $('.hc-TopBrands .carousel-inner')
                            .append('<div class="item row itemRowNo'+(i+ 1)+'">'+
                                '</div>');
                        }
                        for (j = 0; j < ItemPerRow; j++) {

                            $('.hc-TopBrands .carousel-inner .item')
                            .append('<div class="'+widget.spanClass()+' itemNo'+j+'"></div>');
                            
                        }
                        
                        for (i = 0; i < theItems.length; i++) { 
                            var ThePos = Math.ceil((i+ 1) / ItemPerRow);
                            $('.hc-TopBrands .carousel-inner .itemRowNo'+ThePos + ' .itemNo' + (i % ItemPerRow))
                            .append(theItems[i].outerHTML);
                        }
                        
                        
                        $('.hc-TopBrands .carousel-inner .item').first().addClass('active')
                        
                        $('.hc-TopBrands .carousel-inner .item a').each(function(){
                            if($(this).attr('href').indexOf('http')>=0){
                                $('.hc-TopBrands .carousel-inner .item a').attr('target','_blank');
                            }
                        });

                        clearInterval(checkExist);
                    }
                }, 100); // check every 100ms
            },

            widget.checkResponsiveFeatures($(window)[0].innerWidth || $(window).width());

            $(window).resize(
                function () {
                    widget.checkResponsiveFeatures($(window)[0].innerWidth || $(window).width());
                    widget.viewportWidth($(window)[0].innerWidth || $(window).width());
                });

            widget.moveImageToSlider();
        },

            /**
             * Runs each time widget appears on the page
             */
             beforeAppear: function () {

                //console.log('Hero Carousel Banner::onBeforeAppear();', this, this.id())
                var heroCarousel = $('#' + this.id());
                heroCarousel.find('.row').addClass('item').first().addClass('active')
                //console.log('heroCarousel', heroCarousel)
                heroCarousel.carousel();
                heroCarousel.find(".right").click(function () {
                    heroCarousel.carousel('next');
                });
                heroCarousel.find(".left").click(function () {
                    heroCarousel.carousel('prev');
                });
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
             onRender: function (element, context) {
                // console.log('Hero Carousel Banner::onRender();')
            },

            /**
             * Adds css classes based on user options
             * @returns {{}}
             */
             cssClasses: function () {
                return {

                };
            }
        };

        return moduleObj;
    }
    );