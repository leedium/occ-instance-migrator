define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['jquery', 'knockout', 'notifier', 'ccPasswordValidator', 'pubsub', 'CCi18n',
        'ccConstants', 'navigation', 'ccLogger', 'ccResourceLoader!global/hc.cart.dynamicproperties.app'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function ($, ko, notifier, CCPasswordValidator, pubsub, CCi18n, CCConstants,
              navigation, ccLogger, cartDynamicPropertiesApp) {
        "use strict";

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

            ATB_limit: ko.observable('????'),

            beforeAppear: function() {
                this.ATB_limit(cartDynamicPropertiesApp.getInstance().GetATB().toString());
            },

            onLoad: function(widget) {
                var self = this;

                this.updateCreditInfo(widget);

                widget.user().ignoreEmailValidation(false);
                // To display success notification after redirection from customerProfile page.
                if(widget.user().delaySuccessNotification()) {
                    notifier.sendSuccess(widget.WIDGET_ID, widget.translate('updateSuccessMsg'), true);
                    widget.user().delaySuccessNotification(false);
                }

                this.ATB_limit(cartDynamicPropertiesApp.getInstance().GetATB().toString());

                // Handle widget responses when registration is successful or invalid
                $.Topic(pubsub.topicNames.USER_AUTO_LOGIN_SUCCESSFUL).subscribe(function(obj) {
                    if(obj.widgetId === widget.WIDGET_ID) {
                        self.userCreated(true);
                        self.hideLoginModal();
                        self.showErrorMessage(false);
                        notifier.clearSuccess(widget.WIDGET_ID);
                        notifier.sendSuccess(widget.WIDGET_ID, widget.translate('createAccountSuccess') );
                        $(window).scrollTop('0');
                    }
                });

                $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_SUCCESSFUL).subscribe(function (obj) {
                    try{
                    self.updateCreditInfo(t);
                    }
                    catch(x){
                        console.log('USER_PROFILE_UPDATE_SUCCESSFUL 2 Error', x);
                    }
                });

                $.Topic(pubsub.topicNames.USER_RESET_PASSWORD_SUCCESS).subscribe(function(data) {
                    self.hideAllSections();
                    $('#CC-forgotPasswordMessagePane').show();
                });

                $.Topic(pubsub.topicNames.USER_RESET_PASSWORD_FAILURE).subscribe(function(data) {
                    notifier.sendError(widget.WIDGET_ID, data.message, true);
                });

                $.Topic(pubsub.topicNames.USER_PASSWORD_GENERATED).subscribe(function(data) {
                    $('#alert-modal-change').text(CCi18n.t('ns.common:resources.createNewPasswordModalOpenedText'));
                    self.hideAllSections();
                    widget.user().showCreateNewPasswordMsg(true);
                    widget.user().hasFieldLevelError(false);
                    widget.user().createNewPasswordError(CCi18n.t('ns.common:resources.createNewPasswordError'));
                    widget.user().resetPassword();
                    $('#CC-createNewPassword-oldPassword-error').empty();
                    $('#CC-createNewPassword-password-error').empty();
                    $('#CC-createNewPassword-password-embeddedAssistance').empty();
                    $('#CC-createNewPassword-oldPassword').removeClass("invalid");
                    $('#CC-createNewPassword-password').removeClass("invalid");
                    $('#CC-createNewPasswordPane').show();
                    $('#CC-createNewPassword-oldPassword').focus();
                    widget.user().oldPassword.isModified(false);
                });

                $.Topic(pubsub.topicNames.USER_PASSWORD_EXPIRED).subscribe(function(data) {
                    $('#alert-modal-change').text(CCi18n.t('ns.common:resources.resetPasswordModalOpenedText'));
                    widget.user().ignoreEmailValidation(false);
                    self.hideAllSections();
                    $('#CC-forgotPasswordSectionPane').show();
                    $('#CC-forgotPwd-input').focus();
                    widget.user().emailAddressForForgottenPwd('');
                    widget.user().emailAddressForForgottenPwd.isModified(false);
                    widget.user().forgotPasswordMsg(CCi18n.t('ns.common:resources.resetPwdText'));
                });

                $.Topic(pubsub.topicNames.USER_PROFILE_PASSWORD_UPDATE_FAILURE).subscribe(function(data) {
                    widget.user().showCreateNewPasswordMsg(false);
                    if (data.errorCode == CCConstants.UPDATE_EXPIRED_PASSWORD_OLD_PASSWORD_INCORRECT) {
                        $('#CC-createNewPassword-oldPassword-error').css("display", "block");
                        $('#CC-createNewPassword-oldPassword-error').text(CCi18n.t('ns.common:resources.oldPasswordsDoNotMatch'));
                        $('#CC-createNewPassword-oldPassword').addClass("invalid");
                        widget.user().hasFieldLevelError(true);
                    } else if (data.errorCode == CCConstants.USER_EXPIRED_PASSWORD_POLICIES_ERROR) {
                        $('#CC-createNewPassword-password-error').css("display", "block");
                        $('#CC-createNewPassword-password-error').text(CCi18n.t('ns.common:resources.passwordPoliciesErrorText'));
                        $('#CC-createNewPassword-password').addClass("invalid");
                        $('#CC-createNewPassword-password-embeddedAssistance').css("display", "block");
                        var embeddedAssistance = CCPasswordValidator.getAllEmbeddedAssistance(widget.passwordPolicies(), true);
                        $('#CC-createNewPassword-password-embeddedAssistance').text(embeddedAssistance);
                        widget.user().hasFieldLevelError(true);
                    } else {
                        widget.user().createNewPasswordError(data.message);
                        widget.user().showCreateNewPasswordMsg(true);
                        widget.user().hasFieldLevelError(false);
                    }
                });

                $.Topic(pubsub.topicNames.USER_PROFILE_PASSWORD_UPDATE_SUCCESSFUL).subscribe(function(data) {
                    self.hideAllSections();
                    $('#CC-createNewPasswordMessagePane').show();
                    $('#CC-headermodalpane').on('hide.bs.modal', function () {
                        if ($('#CC-createNewPasswordMessagePane').css('display') == 'block') {
                            widget.user().handleLogin();
                        }
                    });
                });

                $.Topic(pubsub.topicNames.USER_CREATION_FAILURE).subscribe(function(obj) {
                    if(obj.widgetId === widget.WIDGET_ID) {
                        widget.user().resetPassword();
                        self.modalMessageType("error");
                        self.modalMessageText(obj.message);
                        self.showErrorMessage(true);
                    };
                });

                $.Topic(pubsub.topicNames.USER_LOGIN_FAILURE).subscribe(function(obj) {
                    self.modalMessageType("error");

                    if (obj.errorCode && obj.errorCode === CCConstants.ACCOUNT_ACCESS_ERROR_CODE) {
                        self.modalMessageText(CCi18n.t('ns.common:resources.accountError'));
                    }
                    else {
                        self.modalMessageText(CCi18n.t('ns.common:resources.loginError'));
                    }

                    self.showErrorMessage(true);
                });

                $.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function(obj) {
                    setTimeout(function(){
                        self.updateCreditInfo(widget);
                    },500);
                    self.hideLoginModal();
                    self.showErrorMessage(false);
                    notifier.clearSuccess(widget.WIDGET_ID);
                    $('#CC-loginHeader-myAccount').focus();
                    $('#CC-loginHeader-myAccount-mobile').focus();
                });

                // Replacing pubsub subscription with this. PubSub's getting called multiple times, causing this method to be called multiple times,
                // causing login modal to appear and disappears at times.
                navigation.setLoginHandler(function(data) {

                    // Do a subscription to page ready.
                    $.Topic(pubsub.topicNames.PAGE_READY).subscribe(function(pageEvent) {
                        if (pageEvent) {
                            // Check if the pageId is undefined. If so, set it to empty string.
                            if (pageEvent.pageId == undefined) {
                                pageEvent.pageId = "";
                            }
                            var loginHandlerPageParts = [];
                            if (navigation.loginHandlerPage) {
                                loginHandlerPageParts = navigation.loginHandlerPage.split('/');
                            } else if (navigation.loginHandlerPage == "") {
                                loginHandlerPageParts = [""];
                            }
                            if ((navigation.loginHandlerPage == undefined) || (navigation.loginHandlerPage == null)) {
                                return;
                            }
                        }
                        if (data && data[0] && data[0].linkToRedirect) {
                            widget.user().pageToRedirect(data[0].linkToRedirect);
                            if (widget.user().loggedInUserName()!='' && !widget.user().isUserSessionExpired()) {
                                widget.user().handleSessionExpired();
                            }
                        }

                        setTimeout(function(){
                            $('#CC-headermodalpane').modal('show');
                            self.hideAllSections();
                            self.userCreated(false);
                            $('#CC-loginUserPane').show();
                            $('#CC-headermodalpane').on('shown.bs.modal', function () {
                                if (!widget.user().loggedIn() && !widget.user().isUserLoggedOut() && widget.user().login()
                                    && widget.user().login() != '' && widget.user().isUserSessionExpired()) {
                                    widget.user().populateUserFromLocalData(true);
                                    $('#CC-login-password-input').focus();
                                    widget.user().password.isModified(false);
                                } else {
                                    $('#CC-login-input').focus();
                                    widget.user().login.isModified(false);
                                }
                                // Set the login handler page to null now
                                navigation.loginHandlerPage = null;
                            });

                            $('#CC-headermodalpane').on('hidden.bs.modal', function () {
                                if (!(self.userCreated() || widget.user().loggedIn()) &&
                                    (($('#CC-loginUserPane').css('display') == 'block') ||
                                        ($('#CC-registerUserPane').css('display') == 'block') ||
                                        ($('#CC-createNewPasswordPane').css('display') == 'block') ||
                                        ($('#CC-forgotPasswordSectionPane').css('display') == 'block') ||
                                        ($('#CC-forgotPasswordMessagePane').css('display') == 'block')) ) {
                                    self.cancelLoginModal(widget);
                                }
                            });
                        }, CCConstants.PROFILE_UNAUTHORIZED_DEFAULT_TIMEOUT);
                    });
                });

                $(document).on('hide.bs.modal','#CC-headermodalpane', function () {
                    if ($('#CC-loginUserPane').css('display') == 'block') {
                        $('#alert-modal-change').text(CCi18n.t('ns.common:resources.loginModalClosedText'));
                    }
                    else if ($('#CC-registerUserPane').css('display') == 'block') {
                        $('#alert-modal-change').text(CCi18n.t('ns.common:resources.registrationModalClosedText'));
                    }
                    else if ($('#CC-forgotPasswordSectionPane').css('display') == 'block') {
                        if (widget.user().forgotPasswordMsg() == CCi18n.t('ns.common:resources.forgotPwdText') ){
                            $('#alert-modal-change').text(CCi18n.t('ns.common:resources.forgottenPasswordModalClosedText'));
                        }
                        else {
                            $('#alert-modal-change').text(CCi18n.t('ns.common:resources.resetPasswordModalClosedText'));
                        }
                    }
                    else if ($('#CC-createNewPasswordPane').css('display') == 'block') {
                        $('#alert-modal-change').text(CCi18n.t('ns.common:resources.createNewPasswordModalClosedText'));
                    }
                });
                $(document).on('show.bs.modal','#CC-headermodalpane', function () {
                    if ($('#CC-loginUserPane').css('display') == 'block') {
                        $('#alert-modal-change').text(CCi18n.t('ns.common:resources.loginModalOpenedText'));
                    }
                    else if ($('#CC-registerUserPane').css('display') == 'block') {
                        $('#alert-modal-change').text(CCi18n.t('ns.common:resources.registrationModalOpenedText'));
                    }
                    else if ($('#CC-forgotPasswordSectionPane').css('display') == 'block') {
                        if (widget.user().forgotPasswordMsg() == CCi18n.t('ns.common:resources.forgotPwdText') ){
                            $('#alert-modal-change').text(CCi18n.t('ns.common:resources.forgottenPasswordModalOpenedText'));
                        }
                        else {
                            $('#alert-modal-change').text(CCi18n.t('ns.common:resources.resetPasswordModalOpenedText'));
                        }
                    }
                    else if ($('#CC-createNewPasswordMessagePane').css('display') == 'block') {
                        $('#alert-modal-change').text(CCi18n.t('ns.common:resources.createNewPasswordModalOpenedText'));
                    }
                });

            },

            /**
             * Added to display the dynamic properties
             * @param widget
             */
            updateCreditInfo: function (widget) {
                if (widget.user()) {
                    var creditLimit = getDynamicProfileValue(widget.user().dynamicProperties(), 'creditLimit').value();
                    var copy;
                    if (creditLimit !== null) {
                        copy = widget.site().extensionSiteSettings.headerLoginRegistrationCreditSettings.headerLoginWithBalanceCreditMessage
                            .replace('__creditValue__', 'R' + creditLimit);
                    } else {
                        copy = widget.site().extensionSiteSettings.headerLoginRegistrationCreditSettings.headerLoginWithNullCreditMessage;
                    }

                    copy = copy.replace('__name__', widget.user().loggedInUserName());

                    this.creditCopy(copy);
                    this.creditLimit(creditLimit);

                }
            },

            removeMessageFromPanel: function() {
                var message = this;
                var messageId = message.id();
                var messageType = message.type();
                notifier.deleteMessage(messageId, messageType);
            },

            emailAddressFocused : function(data) {
                if(this.ignoreBlur && this.ignoreBlur()) {
                    return true;
                }
                this.user().ignoreEmailValidation(true);
                return true;
            },

            emailAddressLostFocus : function(data) {
                if(this.ignoreBlur && this.ignoreBlur()) {
                    return true;
                }
                this.user().ignoreEmailValidation(false);
                return true;
            },

            passwordFieldFocused : function(data) {
                if(this.ignoreBlur && this.ignoreBlur()) {
                    return true;
                }
                this.user().ignorePasswordValidation(true);
                return true;
            },

            passwordFieldLostFocus : function(data) {
                if(this.ignoreBlur && this.ignoreBlur()) {
                    return true;
                }
                this.user().ignorePasswordValidation(false);
                return true;
            },

            confirmPwdFieldFocused : function(data) {
                if(this.ignoreBlur && this.ignoreBlur()) {
                    return true;
                }
                this.user().ignoreConfirmPasswordValidation(true);
                return true;
            },

            confirmPwdFieldLostFocus : function(data) {
                if(this.ignoreBlur && this.ignoreBlur()) {
                    return true;
                }
                this.user().ignoreConfirmPasswordValidation(false);
                return true;
            },

            handleLabelsInIEModals: function() {
                if(!!(navigator.userAgent.match(/Trident/)) ) {
                    $("#CC-LoginRegistrationModal label").removeClass("inline");
                }
            },

            /**
             * Registration will be called when register is clicked
             */
            registerUser: function(data, event) {
                if ('click' === event.type || (('keydown' === event.type || 'keypress' === event.type) && event.keyCode === 13)) {
                    notifier.clearError(this.WIDGET_ID);
                    //removing the shipping address if anything is set
                    data.user().shippingAddressBook([]);
                    data.user().updateLocalData(false, false);
                    if (data.user().validateUser()) {
                        $.Topic(pubsub.topicNames.USER_REGISTRATION_SUBMIT).publishWith(data.user(), [{message: "success", widgetId: data.WIDGET_ID}]);
                    }
                }
                return true;
            },

            /**
             * this method is invoked to hide the login modal
             */
            hideLoginModal: function() {
                $('#CC-headermodalpane').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            },

            /**
             * Invoked when Login method is called
             */
            handleLogin: function(data, event) {
                if('click' === event.type || (('keydown' === event.type || 'keypress' === event.type) && event.keyCode === 13)) {
                    notifier.clearError(this.WIDGET_ID);
                    if (data.user().validateLogin()) {
                        data.user().updateLocalData(false, false);
                        $.Topic(pubsub.topicNames.USER_LOGIN_SUBMIT).publishWith(data.user(), [{message: "success"}]);
                    }
                }
                return true;
            },

            /**
             * Invoked when cancel button is clicked on login modal
             */
            handleCancel: function(data, event) {
                if('click' === event.type || (('keydown' === event.type || 'keypress' === event.type) && event.keyCode === 13)) {
                    notifier.clearError(this.WIDGET_ID);
                    if (data.user().isUserSessionExpired()) {
                        $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).publishWith([{message: "success"}]);
                        this.hideLoginModal();
                    }
                }
                return true;
            },

            /**
             * this method is triggered when the user clicks on the save
             * on the create new password model
             */
            savePassword: function(data, event) {
                if('click' === event.type || (('keydown' === event.type || 'keypress' === event.type) && event.keyCode === 13)) {
                    data.user().ignoreConfirmPasswordValidation(false);
                    if (data.user().isPasswordValid()) {
                        data.user().updateExpiredPassword();
                    }
                }
                return true;
            },

            /**
             * Invoked when cancel button is called on
             */
            cancelLoginModal: function(widget) {
                if (widget.hasOwnProperty("user")) {
                    widget.user().handleCancel();
                    if (widget.user().pageToRedirect() && widget.user().pageToRedirect() == widget.links().checkout.route && widget.cart().items().length > 0) {
                        var hash = widget.user().pageToRedirect();
                        widget.user().pageToRedirect(null);
                        navigation.goTo(hash);
                    } else {
                        navigation.cancelLogin();
                    }
                    widget.user().pageToRedirect(null);
                    notifier.clearError(widget.WIDGET_ID);
                    widget.user().clearUserData();
                    widget.user().profileRedirect();
                }
                else {
                    navigation.cancelLogin();
                }
            },

            /**
             * Invoked when Logout method is called
             */
            handleLogout: function(data) {
                // returns if the profile has unsaved changes.
                if (data.isUserProfileEdited()) {
                    return true;
                }
                // Clearing the auto-login success message
                notifier.clearSuccess(this.WIDGET_ID);
                // Clearing any other notifications
                notifier.clearError(this.WIDGET_ID);
                data.updateLocalData(data.loggedinAtCheckout(), false);
                $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).publishWith([{message: "success"}]);
            },

            /**
             * Invoked when the modal dialog for registration is closed
             */
            cancelRegistration: function(data) {
                notifier.clearSuccess(this.WIDGET_ID);
                notifier.clearError(this.WIDGET_ID);
                this.hideLoginModal();
                data.user().reset();
                this.showErrorMessage(false);
                data.user().pageToRedirect(null);
            },

            /**
             * Invoked when registration link is clicked
             */
            clickRegistration: function(data) {
                notifier.clearSuccess(this.WIDGET_ID);
                notifier.clearError(this.WIDGET_ID);
                data.reset();
                this.hideAllSections();
                $('#CC-registerUserPane').show();
                this.showErrorMessage(false);
                $('#CC-headermodalpane').on('shown.bs.modal', function () {
                    $('#CC-userRegistration-firstname').focus();
                    data.firstName.isModified(false);
                });
            },

            /**
             * Invoked when login link is clicked
             */
            clickLogin: function(data) {
                notifier.clearSuccess(this.WIDGET_ID);
                notifier.clearError(this.WIDGET_ID);
                data.reset();
                this.hideAllSections();
                $('#CC-loginUserPane').show();
                this.showErrorMessage(false);
                $('#CC-headermodalpane').on('shown.bs.modal', function () {
                    if (!data.loggedIn() && data.login() && data.login() != '' && data.isUserSessionExpired()) {
                        data.populateUserFromLocalData(true);
                        $('#CC-login-password-input').focus();
                        data.password.isModified(false);
                    } else {
                        $('#CC-login-input').focus();
                        data.login.isModified(false);
                    }
                    // Set the login handler page to null now
                    navigation.loginHandlerPage = null;
                });
            },

            /**
             * Ignores the blur function when mouse click is up
             */
            handleMouseUp: function(data) {
                this.ignoreBlur(false);
                data.user().ignoreConfirmPasswordValidation(false);
                return true;
            },

            /**
             * Ignores the blur function when mouse click is down
             */
            handleMouseDown: function(data) {
                this.ignoreBlur(true);
                data.user().ignoreConfirmPasswordValidation(true);
                return true;
            },

            /**
             * Ignores the blur function when mouse click is down outside the modal dialog(backdrop click).
             */
            handleModalDownClick: function(data, event) {
                if (event.target === event.currentTarget) {
                    this.ignoreBlur(true);
                    this.user().ignoreConfirmPasswordValidation(true);
                }
                return true;
            },

            /**
             * Invoked when register is clicked on login modal
             */
            showRegistrationSection: function(data) {
                $('#alert-modal-change').text(CCi18n.t('ns.common:resources.registrationModalOpenedText'));
                this.hideAllSections();
                $('#CC-registerUserPane').show();
                $('#CC-userRegistration-firstname').focus();
                data.user().firstName.isModified(false);
                notifier.clearError(this.WIDGET_ID);
                notifier.clearSuccess(this.WIDGET_ID);
                data.user().reset();
                this.showErrorMessage(false);
            },

            /**
             * Invoked when forgotten Password link is clicked.
             */
            showForgotPasswordSection: function(data) {
                $('#alert-modal-change').text(CCi18n.t('ns.common:resources.forgottenPasswordModalOpenedText'));
                data.ignoreEmailValidation(false);
                this.hideAllSections();
                $('#CC-forgotPasswordSectionPane').show();
                $('#CC-forgotPwd-input').focus();
                data.emailAddressForForgottenPwd('');
                data.emailAddressForForgottenPwd.isModified(false);
                data.forgotPasswordMsg(CCi18n.t('ns.common:resources.forgotPwdText'));
            },

            /**
             * Hides all the sections of  modal dialogs.
             */
            hideAllSections: function() {
                $('#CC-loginUserPane').hide();
                $('#CC-registerUserPane').hide();
                $('#CC-forgotPasswordSectionPane').hide();
                $('#CC-forgotPasswordMessagePane').hide();
                $('#CC-createNewPasswordMessagePane').hide();
                $('#CC-createNewPasswordPane').hide();
            },

            /**
             * Resets the password for the entered email id.
             */
            resetForgotPassword: function(data,event) {
                if('click' === event.type || (('keydown' === event.type || 'keypress' === event.type) && event.keyCode === 13)) {
                    data.user().ignoreEmailValidation(false);
                    data.user().emailAddressForForgottenPwd.isModified(true);
                    if(data.user().emailAddressForForgottenPwd  && data.user().emailAddressForForgottenPwd.isValid()) {
                        data.user().resetForgotPassword();
                    }
                }
                return true;
            }
        };
    }
);
