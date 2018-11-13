/**
 * @project
 * @file profile.registration.controller.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 07/08/2018
 * @description handles registration views and display
 **/


define([
        'jquery',
        'knockout',
        'storageApi',
        'pubsub'
    ],
    function (
        $,
        ko,
        storageApi,
        pubsub
    ) {

        "use strict";

        var MODULE_LOADER_CHECK_DELAY = 1000;

        var findDynamicPropertyValue = function (properties, id) {
            return properties.reduce(function (a, b) {
                return b.id() === id ? b : a;
            });
        };

        var _hideSpinner = function () {
            $.Topic('PROFILE_CHECKOUT_HIDE_SPINNER').publish();
        };

        //Component Count
        var REGISTER_PAGE = 'register';
        var PROGRESS_ACCOUNT = 25;
        var PROGRESS_EMPLOYMENT = 50;
        var PROGRESS_DELIVERY = 75;
        var $body = $('body');

        function ProfileRegistrationViewController () {
            var self = this;
            //Static Event Strings
            this.PROFILE_REGISTER_UPDATE_PROGRESS = 'PROFILE_REGISTER_UPDATE_PROGRESS';

            //Static View Keys
            this.pageContext = null;
            this.progress = PROGRESS_ACCOUNT;
            this.user = null;
            this.widgets = null;

            /**
             * Returns a widget based of a the widget's profileId
             * @param id
             */
            this.getViewByWidgetId = function (id) {
                return self.widgets.filter(function (item) {
                    return id === item.instance.WIDGET_ID;
                })[0];
            };

            /**
             * Dispatches notification of a progress change
             * @param value
             */
            this.updateProgress = function (value) {
                self.progress = value;
                $.Topic(self.PROFILE_REGISTER_UPDATE_PROGRESS).publish(self.progress);
            };

            /**
             * Checks to see if all data dor a user was previously added
             * @returns {boolean}
             */
            this.registrationComplete = function (widget) {
                var income;
                if (!widget.user().loggedIn()) {
                    return {
                        state: 'REGISTRATION_USER_NOT_REGISTERED',
                        complete: false,
                        value: 0
                    }
                }
                income = findDynamicPropertyValue(widget.user().dynamicProperties(), 'grossMonthlyIncome');
                return {
                    state: 'REGISTRATION_EMPLOYMENT_DETAILS_STATE',
                    complete: income.value() > 0,
                    value: income.value()
                };
            };

            /**
             * Registers and sends back stat and visibility object
             * @param widget
             * @param moduleState
             * @returns {{widgetId: *, show: (*|boolean), paymentState: *, widgets: Array, registered: boolean}}
             */
            this.showModule = function (widget, moduleState, callback) {
                if (!self.widgets) {
                    self.widgets = [];
                }
                self.widgets.push({
                    instance: widget,
                    moduleState: moduleState,
                    callback: callback
                });
            };

            this.handleBuildLayout = function (status) {
                if (status && self.widgets) {
                    var loggedIn = status.widget.user().loggedIn();
                    var cartEmpty = status.widget.cart().allItems().length === 0;
                    var paymentType = status.cartState.paymentType;
                    var newMember = status.newMember;
                    self.widgets.map(function(widget){
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
                    if (newMember) {
                        self.showForm(status);
                    } else {
                        self.showThankYou(status);
                    }
                    _hideSpinner();
                }
            };

            /**
             * Shows the employment details form if the registration
             * flow is not complete
             * @param status - obj comes from the global profileudatecontroller
             *                 widget
             */
            this.showForm = function (status) {
                var view1 = self.getViewByWidgetId('profileThankYou').instance;
                var view2 = self.getViewByWidgetId('profileEmploymentDetails').instance;
                self.updateProgress(PROGRESS_EMPLOYMENT);
                view1.isViewVisible(false);
                view2.isViewVisible(true);
                $body.addClass('profile--not-completed', status);
            };

            /**
             * Shows the Thank you view.
             * @param status - obj comes from the global profileudatecontroller
             *                 widget
             */
            this.showThankYou = function (status) {
                var view1 = self.getViewByWidgetId('profileThankYou').instance;
                var view2 = self.getViewByWidgetId('profileEmploymentDetails').instance;
                self.updateProgress(PROGRESS_DELIVERY);
                view1.isViewVisible(true);
                view2.isViewVisible(false);
                $body.addClass('profile--completed', status);
            };

            this.onLoad = function () {
                /**
                 * Runs a timer to check if all modlues on the page are loaded.
                 * When this check is completed, the layout will reveal itself
                 */
                var moduleLoadChecker = function () {
                    var prevCount = -1;

                    function check (count) {
                        requestTimeout(MODULE_LOADER_CHECK_DELAY, function () {
                            if (self.widgets) {
                                if (count != self.widgets.length) {
                                    check(self.widgets.length)
                                } else {
                                    $.Topic('PROFILE_CONTROLLER_STATUS_RESPONSE').subscribe(function statusResponse (status) {
                                        if (status) {
                                            self.handleBuildLayout(status);
                                        }
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
                    if (event.path === REGISTER_PAGE) {
                        $.Topic('PROFILE_CONTROLLER_POLLING_COMPLETE').subscribe(function pollingComplete (status) {
                            if (event.path === 'register') {
                                self.handleBuildLayout(status);
                            }
                            $.Topic('PROFILE_CONTROLLER_POLLING_COMPLETE').unsubscribe(pollingComplete);
                        });
                        moduleLoadChecker();
                        $body.addClass('register-page');
                    } else {
                        try {
                            self.widgets.map(function (widget) {
                                if (widget.reset) {
                                    widget.reset();
                                    console.log('reset')
                                }
                            });
                        } catch (err) {
                            //
                        }
                        self.widgets = null;
                        $body.removeClass('register-page profile--not-completed profile--completed');
                    }
                });

                $.Topic('PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS').subscribe(function () {
                    self.showThankYou();
                });
            };
        }

        return new ProfileRegistrationViewController()
    }
);
