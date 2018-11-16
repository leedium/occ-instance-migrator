define(['knockout','jquery'],

    function (ko,$) {

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            isInited: false,
            bannerWidth: ko.observable('auto'),
            bannerOffset: ko.observable('0px'),
            onLoad: function(widget) {
                // console.log('Hero Carousel Banner::onload();',widget);
                var win = $(window);
                var main = $('#main');

                if(widget.fullWidth()) {
                    win.on('resize', function (e) {
                        var winWidth = win.width();
                        var mainWidthOffset = (winWidth - main.width()) *.5;
                        widget.bannerOffset(-mainWidthOffset + 'px');
                        widget.bannerWidth(winWidth + 'px');
                    });
                    win.trigger('resize');
                }
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function() {

                console.log('Hero Carousel Banner::onBeforeAppear();', this, this.id())
                var heroCarousel = $('#'+this.id());
                heroCarousel.find('.row').addClass('item').first().addClass('active')
                console.log('heroCarousel',heroCarousel)
                heroCarousel.carousel();
                heroCarousel.find(".right").click(function(){
                    heroCarousel.carousel ('next');
                });
                heroCarousel.find(".left").click(function(){
                    heroCarousel.carousel('prev');
                });
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function(element, context) {
                // console.log('Hero Carousel Banner::onRender();')
            },

            /**
             * Adds css classes based on user options
             * @returns {{}}
             */
            cssClasses: function(){
                return {

                };
            }
        };

        return moduleObj;
    }
);