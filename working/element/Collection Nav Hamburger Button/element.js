/**
 * @project homechoice.co.za
 * @file element.js
 * @company homechoice
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 28/07/2018
 * @description Hamburger element for Header
 *              Dispatches -COLLECTIONS_NAV_HAMBURGER_OPEN with
 *                  - show: true | false
 *                  - headerHeight: value for fixed positioning
**/


define([
        'knockout',
        'jquery',
        'pubsub',
        'notifier',
        'ccConstants',
        'ccRestClient',
        'pageLayout/product',
        'ccStoreConfiguration',
        'storageApi',
        'notifications'
    ],
    function (
        ko,
        $,
        pubsub,
        notifier,
        CCConstants,
        CCRestClient,
        Product,
        CCStoreConfiguration,
        storageApi,
        notifications
    ) {
        var widget;
        var $body = $('body');
        var $window = $('window');
        var elementName = "hcCollectionNavHamburger";
        var moduleObj = {
            navOpen: ko.observable(false),
            elementName: elementName,
            onLoad: function (widgetModel) {
                var self = this;
                widget = widgetModel;
                $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).subscribe(function (page) {
                    if (self.navOpen()) {
                        notifications.emptyGrowlMessages();
                        $.Topic(pubsub.topicNames.OVERLAYED_GUIDEDNAVIGATION_HIDE).publish([{message: "success"}]);
                        $body.removeClass('hc-collection-navigation-mobile__open');
                        $window.scrollTop(0);
                        self.navOpen(false);
                        $.Topic('COLLECTIONS_NAV_HAMBURGER_OPEN').publish({
                            show: false,
                            headerHeight: $('#header').height()
                        });
                    }
                });
            },

            /**
             * Toggles the open and close of the menu
             * @param context
             * @param event
             * @returns {boolean}
             */
            toggleOpen: function (context, event) {
                var state = !context.elements[elementName].navOpen();
                $body.toggleClass('hc-collection-navigation-mobile__open');
                notifications.emptyGrowlMessages();
                $.Topic(pubsub.topicNames.OVERLAYED_GUIDEDNAVIGATION_HIDE).publish([{message: "success"}]);
                context.elements[elementName].navOpen(state);
                $.Topic('COLLECTIONS_NAV_HAMBURGER_OPEN').publish({
                    show: state,
                    headerHeight: $('#header').height()
                });
                $window.scrollTop(0);
                event.stopPropagation();
                return true;
            }
        };
        return moduleObj;
    }
);
