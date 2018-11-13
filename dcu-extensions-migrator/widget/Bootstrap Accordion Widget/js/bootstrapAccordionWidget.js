define(['jquery'],
    function ($) {

        var MODULE_NAME = 'bootstrap-accordion-widget';

        var moduleObj = {
            onLoad: function(widget) {
                console.log('Bootstrap Accordion onLoad();', widget);
                
                // Add minus icon for collapse element which is open by default
                $('.collapse.in').each(function(){
                    $(this).siblings('.panel-heading').find('.glyphicon').addClass('glyphicon-minus').removeClass('glyphicon-plus');
                });
        
                // Toggle plus minus icon on show hide of collapse element
                $('.collapse').on('show.bs.collapse', function(){
                    $(this).parent().find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-minus');
                }).on('hide.bs.collapse', function(){
                    $(this).parent().find('.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
                });
            },

            beforeAppear: function() {
                console.log('Bootstrap Accordion onBeforeAppear();', this)
            },

            onRender: function(element, context) {
                console.log('Bootstrap Accordion onRender();')
            },
        };

        return moduleObj;
    }
);