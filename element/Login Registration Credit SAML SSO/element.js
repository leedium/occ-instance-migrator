define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'jquery',
        'knockout',
        'notifier',
        'ccPasswordValidator',
        'pubsub',
        'CCi18n',
        'ccConstants',
        'navigation',
        'ccLogger',
        'storageApi',
        'spinner',
        'ccResourceLoader!global/hc.constants',
        'ccRestClient'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function ($,
              ko,
              notifier,
              CCPasswordValidator,
              pubsub,
              CCi18n,
              CCConstants,
              navigation,
              ccLogger,
              storageApi,
              spinner,
              hcConstants,
              ccRestClient
    ) {
        "use strict";
        var OCC_TEST_PREVIEW_HOST = 'ccadmin-test-zbba.oracleoutsourcing.com';
        var OCC_TEST_STOREFRONT_HOST = 'ccstore-test-zbba.oracleoutsourcing.com';
        var OCC_STAGE_PREVIEW_HOST = 'ccadmin-stage-zbba.oracleoutsourcing.com';
        var OCC_STAGE_STOREFRONT_HOST = 'ccstore-stage-zbba.oracleoutsourcing.com';
        var OCC_PROD_PREVIEW_HOST = 'host'; //  fill this in later
        var OCC_PROD_STOREFRONT_HOST = 'host'; // fill this in later

        var SSO_TEST_PREVIEW_URI = 'sso-dev.homechoice.co.za';
        var SSO_TEST_STOREFRONT_URI = 'sso-dev.homechoice.co.za';
        var SSO_STAGE_PREVIEW_URI = 'secure3-staging.homechoice.co.za';
        var SSO_STAGE_STOREFRONT_URI = 'secure3-staging.homechoice.co.za';
        var SSO_PROD_PREVIEW_URI = 'secure3.homehoice.co.za';
        var SSO_PROD_STOREFRONT_URI = 'secure3.homehoice.co.za';

        var ssoHash = {
            test:{
                preview:SSO_TEST_PREVIEW_URI,
                store:SSO_TEST_STOREFRONT_URI
            },
            stage:{
                preview:SSO_STAGE_PREVIEW_URI,
                store:SSO_STAGE_STOREFRONT_URI
            },
            prod:{
                preview:SSO_PROD_PREVIEW_URI,
                store:SSO_PROD_STOREFRONT_URI
            }
        };

        var getSSOUri = function(){
            switch(window.location.host){
                case OCC_TEST_PREVIEW_HOST:
                    return ssoHash.test.preview;
                    break;
                case OCC_TEST_STOREFRONT_HOST:
                    return ssoHash.test.store;
                    break;
                case OCC_STAGE_PREVIEW_HOST:
                    return ssoHash.stage.preview;
                    break;
                case OCC_STAGE_STOREFRONT_HOST:
                    return ssoHash.stage.store;
                    break;
                case OCC_PROD_PREVIEW_HOST:
                    return ssoHash.prod.preview;
                    break;
                case OCC_PROD_STOREFRONT_HOST:
                    return ssoHash.prod.store;
                    break;
                default:
                    return ssoHash.test.preview;
            }
        };

        var getDynamicProfileValue = function (arr, key) {
            return arr.reduce(function (a, b) {
                return b.id() === key ? b : a;
            });
        };


        return {
            elementName: 'login-registration',

            modalMessageType:   ko.observable(''),
            modalMessageText:   ko.observable(''),
            showErrorMessage:   ko.observable(false),
            userCreated:        ko.observable(false),
            ignoreBlur:         ko.observable(false),
            creditLimit: ko.observable(100),
            creditCopy: ko.observable(null).extend({ deferred: true }),

            onLoad: function(widget) {
                var self = this;
                navigation.setLoginHandler(function(data) {
                    widget.user().handleSamlLogin();

                });
                $.Topic(hcConstants.PROFILE_CONTROLLER_LOGOUT).subscribe(function (user) {
                    self.handleLogout(user);
                });

                $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_SUCCESSFUL).subscribe(function (obj) {
                    setTimeout(function(){
                        try{
                            self.updateCreditInfo(widget);
                        }
                        catch(x){
                            console.log('USER_PROFILE_UPDATE_SUCCESSFUL Error', x);
                        }
                    },500);
                });

                $.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function(obj) {
                    setTimeout(function(){
                        self.updateCreditInfo(widget);
                    },500);
                });

                this.updateCreditInfo(widget);
            },

            /**
             * Added to display the dynamic properties
             * @param widget
             */
            updateCreditInfo: function (widget) {
                if (widget.user().loggedIn()) {
                    var creditLimit = getDynamicProfileValue(widget.user().dynamicProperties(), 'creditLimit').value();
                    var copy;
                    if (creditLimit !== null) {
                        copy = widget.site().extensionSiteSettings.headerLoginRegistrationCreditSSOSettings.headerLoginWithBalanceCreditMessage
                            .replace('__creditValue__', 'R' + creditLimit);
                    } else {
                        copy = widget.site().extensionSiteSettings.headerLoginRegistrationCreditSSOSettings.headerLoginWithNullCreditMessage;
                    }

                    copy = copy.replace('__name__', widget.user().loggedInUserName());

                    this.creditCopy(copy);
                    this.creditLimit(creditLimit);
                }
            },

            /**
             * Invoked when Login method is called
             */
            handleSamlLogin: function(data, event) {
                data.user().handleSamlLogin();
                return true;
            },

            /**
             * Invoked when register method is called
             */
            handleSamlRegistration: function(data, event) {
                // data.user().handleSamlRegistration();
                navigation.goTo('register');
                return true;
            },

            /**
             * Invoked when Logout method is called
             */
            handleLogout: function(data) {
                var widget = this;
                // returns if the profile has unsaved changes.
                if (data.isUserProfileEdited()) {
                    return true;
                }
                // Clearing the auto-login success message
                notifier.clearSuccess(this.WIDGET_ID);
                // Clearing any other notifications
                notifier.clearError(this.WIDGET_ID);
                data.updateLocalData(data.loggedinAtCheckout(), false);

                var self = data; // defined as 'self' because logic taken from core object

                spinner.create({
                    parent: 'body',
                    selector: '#page'
                });

                $.Topic(pubsub.topicNames.USER_CLEAR_CART).publish([{message: "success"}]);
                var successFunc = function() {
                    $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).publish([{message: "success"}]);
                    storageApi.getInstance().removeItem(CCConstants.LOCAL_STORAGE_SHOPPER_CONTEXT);
                    storageApi.getInstance().removeItem(CCConstants.LOCAL_STORAGE_CURRENT_CONTEXT);
                    self.clearUserData();
                    self.profileRedirect();
                    if(self.refreshPageAfterContactLogout()){
                        // self.refreshPageAfterContactLogout(false);
                        window.location.assign(self.contextData.global.links.home.route);
                    } else{
                        //Refreshing layout to set Content Variation Slots, if any.
                        var eventData = {'pageId': navigation.getPath()};
                        $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).publish(eventData);
                    }
                };
                var errorFunc = function(pResult) {
                    self.clearUserData();
                    self.profileRedirect();
                    window.location.assign(self.contextData.global.links.home.route);
                };
                if (self.loggedIn()) {
                    if(self.parentOrganization && self.parentOrganization.name()){
                        self.refreshPageAfterContactLogout(true);
                    }
                    window.location = 'https://'+getSSOUri()+'/auth/realms/occ/protocol/openid-connect/logout?redirect_uri=https%3A%2F%2F'+ccRestClient.url;

                    self.client().logout(successFunc, errorFunc);
                } else {
                    self.clearUserData();
                    $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).publish([{message: "success"}]);
                    // self.profileRedirect();
                }
            }
        };
    }
);
