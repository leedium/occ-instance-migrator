define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {

        var MODULE_NAME = 'hc-static-hero-banner';

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            bannerWidth: ko.observable('auto'),
            bannerOffset: ko.observable('0px'),
            onLoad: function(widget) {
                // console.log('Static Banner onload();',widget);
                var self = this;
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
                // console.log('Static Banner  onBeforeAppear();', this)
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function(element, context) {
                // console.log('Static Banner  onRender();')
            },

            /**
             * Adds css classes based on user options
             * @returns {{}}
             */
            cssClasses: function(){
                return {
                    "hc-static-hero-banner__copy-tl": this.copyAlignment() === 'tl' ? true : false,
                    "hc-static-hero-banner__copy-tm": this.copyAlignment() === 'tm' ? true : false,
                    "hc-static-hero-banner__copy-tr": this.copyAlignment() === 'tr' ? true : false,
                    "hc-static-hero-banner__copy-ml": this.copyAlignment() === 'ml' ? true : false,
                    "hc-static-hero-banner__copy-mm": this.copyAlignment() === 'mm' ? true : false,
                    "hc-static-hero-banner__copy-mr": this.copyAlignment() === 'mr' ? true : false,
                    "hc-static-hero-banner__copy-bl": this.copyAlignment() === 'bl' ? true : false,
                    "hc-static-hero-banner__copy-bm": this.copyAlignment() === 'bm' ? true : false,
                    "hc-static-hero-banner__copy-br": this.copyAlignment() === 'br' ? true : false
                };
            }
        };

        return moduleObj;

    }

);