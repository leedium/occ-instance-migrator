/**
 * @project homechoice.co.za
 * @file element.js
 * @company leedium
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 10/09/2018
 * @description Customizable mobile menu for OCC
 **/


define([
        'knockout',
        'jquery',
        'pubsub',
        'notifier',
        'ccConstants',
        'ccRestClient',
        'navigation',
        'ccResourceLoader!global/hc.constants'
    ],

    function (
        ko,
        $,
        pubsub,
        notifier,
        CCConstants,
        CCRestClient,
        navigation,
        hcConstants

    ) {

        var widget;
        var elementName = "hcCollectionNavigationMobileMenu";

        var moduleObj = {
            stringValue: ko.observable(''),
            isMenuVisible: ko.observable(false),
            menuStateCollection: ko.observable(false),
            menuStateAccount: ko.observable(false),
            collectionButtonTitle: ko.observable(''),
            collectionItems: ko.observableArray([]),
            elementName: elementName,
            property: ko.observable(''),

            /**
             * Runs when widget is instantiated
             */
            onLoad: function (widgetModel) {
                var self = this;
                var container = $('div[id^="hcCollectionNavigation_"]');
                console.log(container)

                widget = widgetModel;
                $.Topic(hcConstants.COLLECTIONS_NAV_HAMBURGER_OPEN).subscribe(function (state) {
                    // console.log(state);
                    self.isMenuVisible(state.show);
                    if (!state.show) {
                        container.css('top', 'auto');
                        self.reset();
                    } else {
                        container.css('top', (state.headerHeight) + 'px');
                    }
                });
            },

            /**
             * Loads the sub collection for the collection item
             * @param collectionId
             */
            loadCollection: function (collectionId) {
                var self = this;

                var data = {};
                data[CCConstants.EXPAND] = CCConstants.EXPAND_CHILD_CATEGORIES;
                data['disableActiveProdCheck'] = true;
                CCRestClient.request(CCConstants.ENDPOINT_COLLECTIONS_GET_COLLECTION,
                    data,
                    function response (res) {
                        self.collectionButtonTitle(res.displayName);
                        self.collectionItems(res.childCategories);
                        self.handleShowCollection();
                    },
                    function error (err) {
                    }, collectionId)
            },

            /**
             * Scrolls inner div 'CC-MegaMenu' to top
             */
            scrollToTop: function () {
                window.scrollTo(0, 0);
                $('body.hc-collection-navigation-mobile__open div[id^="hcCollectionNavigation_"]')[0].scrollTop = 0;

            },

            adjustMainMenuHeight: function (height) {
                var container = $('#hcCollectionNavigationMobileMenuContainer');
                if (!height) {
                    container[0].style.height = 'auto';
                    return;
                }
                container
                    .height(Math.min(container.height(), height) + 50);
            },

            /**
             * Sets menu back to main staate
             */
            reset: function () {
                this.menuStateCollection(false);
                this.menuStateAccount(false);
                this.adjustMainMenuHeight();
            },

            /**
             *
             * @param context
             * @param event
             */
            handleMenuAction: function (context, event) {
                if (event.target.className.indexOf('hc-collection-navigation-mobile-menu--api-link') > -1) {
                    context.elements[elementName].loadCollection(event.target.getAttribute('data-collection-id'))
                } else if (event.target.className.indexOf('hc-collection-navigation-mobile-menu--internal-link') > -1) {
                    navigation.goTo(event.target.getAttribute('href'));
                }
            },

            /**
             * Shows the sub collection state when the list has loaded
             */
            handleShowCollection: function () {
                this.menuStateCollection(true);
                this.menuStateAccount(false);
                this.scrollToTop();
                this.adjustMainMenuHeight($('#hcCollectionNavigationMobileMenuCollectionView').height())
            },

            /**
             * Sets the My Account state when selected
             * @param context
             * @param event
             */
            handleShowAccount: function (context) {
                var el = context.elements[elementName];
                el.menuStateCollection(false);
                el.menuStateAccount(true);
                el.adjustMainMenuHeight($('#hcCollectionNavigationMobileMenuAccountView').height())
                el.scrollToTop();
            },

            /**
             * returns to main menu state
             * @param context
             * @param event
             */
            handleReturnToMainMenu: function (context) {
                context.elements[elementName].reset();
            },

            /**
             * Signs user out of system
             * @param context
             * @param event
             */
            handleSignout: function (context) {
                if (context.user().loggedIn()) {
                    if (context.user().isUserProfileEdited()) {
                        return !0;
                    }
                    // $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).publishWith([{
                    //     message: "success"
                    // }]);
                    $.Topic(hcConstants.PROFILE_CONTROLLER_LOGOUT).publish(context.user());
                    context.elements[elementName].reset();
                } else {
                    $('#CC-loginHeader-login').trigger('click');
                    context.elements[elementName].scrollToTop();

                }
            }
        };
        return moduleObj;
    }
);
