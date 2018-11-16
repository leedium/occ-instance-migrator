define(['knockout','jquery'],

    function (ko,$) {

        var imageSizes = {
            "12":{
                'large':'475,475',
                'medium':'375,375',
                'small':'280,280',
                'xsmall':'200,200',
                'quality': .9,
            },
            "6":{
                'large':'200,200',
                'medium':'345,345',
                'small':'345,345',
                'xsmall':'150,150',
                'quality': .7,
            },
            "4":{
                'large':'150,150',
                'medium':'150,150',
                'small':'150,150',
                'xsmall':'100,100',
                'quality': .6,
            },
            "3":{
                'large':'140,140',
                'medium':'140,140',
                'small':'120,120',
                'xsmall':'120,120',
                'quality': .6,
            }
        };
        var moduleObj = {
            /**
             * Runs when widget is instantiated
             */
            onLoad: function(widget) {
                /*set image sizes*/
                widget.setImageSizes = function(imageProps) {
                    return $.extend({
                        'source': imageProps.source,
                        'outputFormat': widget.imageType(),
                        'isSrcSetEnabled': true,
                        'alt': imageProps.alt
                    }, imageSizes[widget.containerCols()])
                }
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function() {
                $('.hc-content-block').parent().parent()
                    .removeClass('col-sm-2')
                    .addClass('col-sm-3 col-md-2');
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
