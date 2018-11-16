/**
 * @project homechoice.co.za
 * @file element.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 28/07/2018
 * @description Element that wraps the MediaType, and can be added to
 *              the hero banner widget
 **/

define(
    [
        'knockout',
        'jquery',
        'pubsub',
        'notifier',
        'ccConstants',
        'ccRestClient',
        'pageLayout/product',
        'ccStoreConfiguration'
    ],
    function (
        ko,
        $,
        pubsub,
        notifier,
        CCConstants,
        CCRestClient,
        Product,
        CCStoreConfiguration
    ) {
        var widget;
        var moduleObj = {
            elementName: "heroBannerImageSize",
            onLoad: function (widgetModel) {
                widget = widgetModel;
            },

            beforeAppear: function () {
            },

            onRender: function (element, context) {
            },

            processImagePath: function (path) {
                var arrayPath = path.split('/');
                arrayPath.splice(2, 1);
                var joinedPath = arrayPath.join('/');

                var largeRatio = widget.site().extensionSiteSettings.heroBannerImageSettings.largeRatio.split(',');
                var mediumRatio = widget.site().extensionSiteSettings.heroBannerImageSettings.mediumRatio.split(',');
                var smallRatio = widget.site().extensionSiteSettings.heroBannerImageSettings.smallRatio.split(',');
                var xsmallRatio = widget.site().extensionSiteSettings.heroBannerImageSettings.xsmallRatio.split(',');

                return {
                    large: joinedPath + '&height=' + parseInt(largeRatio[0]) + '&width=' + parseInt(largeRatio[1]) + '&quality=' + widget.site().extensionSiteSettings.heroBannerImageSettings.imageQualityLarge,
                    medium: joinedPath.replace('.png', '_medium.png').replace('.jpg', '_medium.jpg') + '&height=' + parseInt(mediumRatio[0]) + '&width=' + parseInt(mediumRatio[1]) + '&quality=' + widget.site().extensionSiteSettings.heroBannerImageSettings.imageQualityMedium,
                    small: joinedPath.replace('.png', '_small.png').replace('.jpg', '_small.jpg') + '&height=' + parseInt(smallRatio[0]) + '&width=' + parseInt(smallRatio[1]) + '&quality=' + widget.site().extensionSiteSettings.heroBannerImageSettings.imageQualitySmall,
                    xsmall: joinedPath.replace('.png', '_xsmall.png').replace('.jpg', '_xsmall.jpg') + '&height=' + parseInt(xsmallRatio[0]) + '&width=' + parseInt(xsmallRatio[1]) + '&quality=' + widget.site().extensionSiteSettings.heroBannerImageSettings.imageQualityXSmall
                }
            },

            cssClasses: function () {
            }
        };

        return moduleObj;
    }
);
