define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration'],
    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
        var imageSizes = {
            "12": {
                'large': '575,575',
                'medium': '445,445',
                'small': '345,345',
                'xsmall': '345,345'
            },
            "6": {
                'large': '575,575',
                'medium': '445,445',
                'small': '345,345',
                'xsmall': '345,345'
            },
            "4": {
                'large': '380,380',
                'medium': '293,293',
                'small': '220,220',
                'xsmall': '370,370'
            },
            "3": {
                'large': '277,277',
                'medium': '212,212',
                'small': '370,370',
                'xsmall': '370,370'
            }
        };

        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            onLoad: function (widget) {
                // console.log('Editorial Tout onload();', widget);

                /*set image sizes*/
                widget.setImageSizes = function (imageProps) {
                    return $.extend({
                        'source': imageProps.source,
                        'outputFormat': 'JPEG',
                        'isSrcSetEnabled': true,
                        'quality': 1,
                        'alt': imageProps.alt
                    }, imageSizes[widget.containerCols()])
                }
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                // console.log('Editorial Tout onBeforeAppear();', this)
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function (element, context) {
                // console.log('Editorial Tout onRender();')
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
