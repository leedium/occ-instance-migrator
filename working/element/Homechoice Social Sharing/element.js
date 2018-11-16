define(['knockout','jquery'],

    function (ko,$) {

        var moduleObj = {
            elementName: "productDetailsSocialSharing",
            /**
             * Runs when widget is instantiated
             */
            property: ko.observable(''),
            onLoad: function(widgetModel) {
            }
        };

        return moduleObj;
    }
);