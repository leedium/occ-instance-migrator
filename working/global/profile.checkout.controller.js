/**
 * @project homechoice.co.za
 * @file profile.checkout.controller.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 24/07/2018
 * @description Checkout controller handles the visibility for the following components
 *      - Checkout - Information Panel Widget
 *      - Checkout Cart Order Summary - Terms
 **/

define([
        'jquery',
        'knockout',
        'storageApi',
        'pubsub',
        'ccConstants',
        'spinner',
        'ccLogger',
        'navigation'
    ],
    function (
        $,
        ko,
        storageApi,
        pubsub,
        ccConstants,
        spinner,
        ccLogger,
        navigation
    ) {
        var CHECKOUT_PAGE = 'checkout';
        var CASH = 'cash';
        var TERMS = 'terms';
        var MIXED = 'mixed';
        var $body = $('body');

        var _showSpinner = function () {
            spinner.create({
                parent: '#page',
                selector: '#main'
            });
        };

        var _hideSpinner = function () {
            $.Topic(self.PROFILE_CHECKOUT_HIDE_SPINNER).publish();
        };

        function ProfileCheckoutViewController () {
            var self = this;

            var REGISTER_PAGE = 'register';

            //Static Event Strings
            this.PROFILE_CHECKOUT_LOAD_VIEW = 'PROFILE_CHECKOUT_LOAD_VIEW';
            this.PROFILE_CHECKOUT_SPINNER_SHOW = 'PROFILE_CHECKOUT_SPINNER_SHOW';
            this.PROFILE_CHECKOUT_SPINNER_HIDE = 'PROFILE_CHECKOUT_SPINNER_HIDE';
            this.PROFILE_CHECKOUT_COMPONENT_LOADED = 'PROFILE_CHECKOUT_COMPONENT_LOADED';
            this.PROFILE_CHECKOUT_SHOW_STATE = 'PROFILE_CHECKOUT_SHOW_STATE';
            this.PROFILE_CHECKOUT_UPDATE_PROGRESS = 'PROFILE_CHECKOUT_UPDATE_PROGRESS';
            this.PROFILE_CHECKOUT_VALIDATE = 'PROFILE_CHECKOUT_VALIDATE';
            this.PROFILE_CHECKOUT_VALIDATE_COMPLETE = 'PROFILE_CHECKOUT_VALIDATE_COMPLETE';
            this.PROFILE_CHECKOUT_HIDE_SPINNER = 'PROFILE_CHECKOUT_HIDE_SPINNER';
            this.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS';

            //Static View Keys
            this.PROFILE_CHECKOUT_INFOPANEL_VIEW = 'PROFILE_CHECKOUT_INFOPANEL_VIEW';
            this.PROFILE_CHECKOUT_TERMS_PAYMENT_VIEW = 'PROFILE_CHECKOUT_TERMS_PAYMENT_VIEW';
            this.PROFILE_CHECKOUT_PROGRESS_VIEW = 'PROFILE_CHECKOUT_PROGRESS_VIEW';

            this.PROFILE_CHECKOUT_STATE = 'PROFILE_CHECKOUT_STATE';
            this.PROFILE_CHECKOUT_STATE = 'PROFILE_CHECKOUT_STATE';
            this.PROFILE_DOCUMENTS_STATE = 'PROFILE_DOCUMENTS_STATE';
            this.pageContext = null;
            this.user = null;
            this.widget = null;
            this.cartProps = null;
            this.widgets = [];
            this.paymentState = null;
            this.paymentVM = null;
            this.registered = null;
            this.redirect = false;
            this.userProfilePayload = null;
            this.isBuildingLayout = false;

            /**
             * Dispatches notification of a progress change
             * @param value
             */
            this.updateProgress = function (value) {
                self.progress = value;
                $.Topic(self.PROFILE_CHECKOUT_UPDATE_PROGRESS).publish(self.progress);
            };

            /**
             * runs thorugh available widgets and validates them
             * @param checkoutType
             */
            this.validateWidgets = function (checkoutType) {
                var invalidItems = [];
                var valid = self.widgets.reduce(function (a, b) {
                    // console.log(b.moduleState, checkoutType,checkoutType.indexOf(b.moduleState) > -1)
                    var vType = b.moduleState;
                    if (typeof(vType) !== 'undefined' && checkoutType.indexOf(b.moduleState > -1)) {
                        // if (typeof(vType) !== 'undefined' && (vType === checkoutType || vType === 'both' || vType === 'cash_terms')) {
                        var isValid = b.instance.validate();
                        if (!isValid) {
                            invalidItems.push(b);
                        }
                        return a && isValid;
                    }
                    return a;
                }, true);
                var valObj = {
                    valid: valid,
                    checkoutType: checkoutType,
                    invalidItems: invalidItems.length ? invalidItems : null
                };
                // console.log('val obj:', valObj);
                $.Topic(self.PROFILE_CHECKOUT_VALIDATE_COMPLETE).publish(valObj);
            };

            /**
             * Returns an object with the widget visibility  true | false,
             * and the paymentState  terms, cash, mixed, empty
             *
             * @param widget
             * @returns {*}
             */
            this.getPaymentState = function (widget) {
                var cash = 0;
                var terms = 0;
                var state = 'empty';
                if (self.paymentState && self.registered) {
                    return {
                        paymentState: self.paymentState,
                        registered: self.registered
                    }
                }
                var registered = widget.user().dynamicProperties().filter(function (item) {
                    return item.id() === 'employmentStatus'
                })[0].value() !== null;

                self.registered = registered;

                widget.cart().allItems().map(function (item) {
                    if (item.hcPaymentOption() === 'terms') {
                        terms++;
                    } else if (item.hcPaymentOption() === 'cash') {
                        cash++;
                    }
                });
                if (cash > 0 && terms > 0) {
                    state = MIXED;
                } else if (cash === 0 && terms > 0) {
                    state = TERMS;
                } else if (cash > 0 && terms === 0) {
                    state = CASH;
                }
                self.paymentState = state;
                return {
                    paymentState: state,
                    registered: registered
                }
            };

            /**
             * Registers and sends back stat and visibility object
             * @param widget
             * @param moduleState
             * @returns {{widgetId: *, show: (*|boolean), paymentState: *, widgets: Array, registered: boolean}}
             */
            this.showModule = function (widget, moduleState, callback) {
                if (!self.widgets || self.widgets.length === 0) {
                    self.widgets = [];
                }
                self.widgets.push({
                    instance: widget,
                    moduleState: moduleState,
                    callback: callback
                });
            };

            this.handleBuildLayout = function () {
                if (self.userProfilePayload && !self.isBuildingLayout) {
                    self.isBuildingLayout = true;
                    var loggedIn = self.userProfilePayload.widget.user().loggedIn();
                    var cartEmpty = self.userProfilePayload.widget.cart().allItems().length === 0;
                    var paymentType = self.userProfilePayload.cartState.paymentType;
                    var newMember = self.userProfilePayload.newMember;
                    if (
                        !loggedIn ||
                        (loggedIn && newMember && paymentType === TERMS)
                    ) {
                        ccLogger.info('Trying to access when either user is not logged in,  cart is empty, or cart is Terms and Employment details have not been entered ');
                        if (newMember && paymentType === TERMS) {
                            requestTimeout(1000, function () {
                                $.Topic('PROFILE_TERMS_CHECKOUT_WITHOUT_COMPLETED_REGISTRATION').publish()
                            });
                        }
                        navigation.goTo(REGISTER_PAGE);
                        return;

                    } else if (
                        (loggedIn && newMember && paymentType !== TERMS) ||
                        (loggedIn && !newMember)
                    ) {
                        ccLogger.debug('User logged in, has cash, OR has terms an completed employment details')
                        self.widgets.map(function (widget) {
                            var show = widget.moduleState.indexOf(paymentType) >= 0;
                            show = show && loggedIn && (!newMember || (newMember && paymentType === CASH)) && !cartEmpty;
                            var sObj = {
                                widgetId: widget.instance.id(),
                                show: show,
                                paymentState: paymentType,
                                widgets: self.widgets,
                                registered: !newMember
                            };
                            widget.callback.call(widget.instance, sObj);
                        });
                        _hideSpinner();
                    }
                }
            };

            /**
             * Executes when the gobal is initialized
             */
            this.onLoad = function () {
                var self = this;
                /**
                 * Runs a timer to check if all modlues on the page are loaded.
                 * When this check is completed, the layout will reveal itself
                 * when the profile is loaded
                 */
                var moduleLoadChecker = function () {
                    var prevCount = -1;

                    function check (count) {
                        requestTimeout(1000, function () {
                            if (self.widgets) {
                                if (count !== self.widgets.length) {
                                    check(self.widgets.length)
                                } else {
                                    $.Topic('PROFILE_CONTROLLER_STATUS_RESPONSE').subscribe(function statusResponse (status) {
                                        self.userProfilePayload = status;
                                        self.handleBuildLayout();
                                        $.Topic('PROFILE_CONTROLLER_STATUS_RESPONSE').unsubscribe(statusResponse)
                                    });
                                    $.Topic('PROFILE_CONTROLLER_REQUEST_STATUS').publish();
                                }
                            } else {
                                check(count)
                            }
                        });
                    }

                    check(prevCount);
                };

                $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).subscribe(function (event) {
                    self.pageContext = event.path;
                    if (event.path === CHECKOUT_PAGE) {
                        // _showSpinner();
                        $body.addClass('checkout-page');
                        $.Topic('PROFILE_CONTROLLER_POLLING_COMPLETE').subscribe(function pollingComplete (status) {
                            if (event.path === CHECKOUT_PAGE) {
                                self.userProfilePayload = status;
                                self.handleBuildLayout();
                                $.Topic('PROFILE_CONTROLLER_POLLING_COMPLETE').unsubscribe(pollingComplete);
                            }
                        });
                        moduleLoadChecker();
                    } else {
                        self.views = [];
                        self.redirect = false;
                        try {
                            self.widgets.map(function (widget) {
                                if (widget.instance.reset) {
                                    try {
                                        widget.instance.reset();
                                    } catch (err) {
                                        // console.log(err)
                                    }
                                }
                            });
                        }
                        catch (err) {
                            // console.log(err)
                        }

                        self.widgets = [];
                        self.paymentState = null;
                        self.widgets = null;
                        self.pageContext = event.path;
                        self.cartProps = null;
                        self.initializedWigetCount = 0;
                        self.isBuildingLayout = false;
                        $body.removeClass('checkout-page');
                    }
                });

                $.Topic(self.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS).subscribe(function prrofileUpate (status) {
                    self.userProfilePayload = status;
                });

                $.Topic(self.PROFILE_CHECKOUT_VALIDATE).subscribe(function (checkoutType) {
                    self.validateWidgets(checkoutType);
                });

                $.Topic(self.PROFILE_CHECKOUT_SHOW_STATE).subscribe(function (event) {
                    switch (event.to) {
                        case self.PROFILE_CHECKOUT_STATE:
                            navigation.goTo('checkout');
                            break;
                    }
                });
            };
        }

        return new ProfileCheckoutViewController();
    });
