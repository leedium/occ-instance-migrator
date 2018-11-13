define(['knockout','jquery'],

    function (ko,$) {

        var widget;

        var moduleObj = {
            stringValue: ko.observable(''),
            elementName: "productDetailsProperty",
            /**
             * Runs when widget is instantiated
             */
            property: ko.observable(''),
            onLoad: function(widgetModel) {
                widget = widgetModel;
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function() {
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function() {
                $('.product-details-accordion-item--checkbox').first()[0].checked = true;
            },

            processDotNotation: function(dotString) {
                return widget.product().product[widget.resources()[dotString]];
            },

            /**
             * Adds css classes based on user options
             * @returns {{}}
             */
            cssClasses: function(){

            }
        };

        return moduleObj;
    }
);