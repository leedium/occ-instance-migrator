define(['knockout', 'jquery', 'pubsub'],

    function (ko, $, pubsub) {

        var _widget;

        var moduleObj = {
            stringValue: ko.observable(''),
            sizeToolTip: ko.observable(''),
            elementName: "pdpVariantOptions",
            /**
             * Runs when widget is instantiated
             */
            property: ko.observable(''),
            variantExceptions: ko.observable(),
            onLoad: function (widget) {
                var self = this;
                _widget = widget;
                this.parseVariantOptionExceptions(widget);
                this.sizeToolTip = widget.site().extensionSiteSettings['pdpVariantOptionsSettings'].sizeToolTip;

                $.Topic(pubsub.topicNames.PAGE_READY).subscribe(self.checkBlueTip);
                $.Topic(pubsub.topicNames.PAGE_CONTEXT_CHANGED).subscribe(self.checkBlueTip);

            },

            /**
             * function to handle blue tooltips on the page
             * using timeout over interval as interval was "leaking"
             * @param obj
             */
            checkBlueTip: function () {
                if(_widget.pageContext().pageType.name === 'product'){
                    var timeout = window.requestTimeout(2000, function () {
                        var blueTip = $('.blueToolTip');
                        if (blueTip.length > 0) {
                            blueTip.tooltip();
                            window.clearRequestTimeout(timeout);
                        }
                    }, self);
                }
            },

            checkExceptions: function (data) {
                var targetedObject = this.variantExceptions()[data.actualOptionId];
                if(data.originalOptionValues().length == 1 &&
                    typeof(targetedObject) != 'undefined' &&
                    targetedObject != null && targetedObject ===
                    data.originalOptionValues()[0].key) {
                    return false;
                }
                return true;
            },

            parseVariantOptionExceptions: function (model) {
                var keys = model.site().extensionSiteSettings['pdpVariantOptionsSettings'].exceptionKeys.split(',');
                var value = model.site().extensionSiteSettings['pdpVariantOptionsSettings'].exceptionValues.split(',');
                this.variantExceptions(keys.reduce(function (a, item, i) {
                    a[item.trim()] = value[i].trim();
                    return a;
                }, {}));
            }
        };

        return moduleObj;
    }
);