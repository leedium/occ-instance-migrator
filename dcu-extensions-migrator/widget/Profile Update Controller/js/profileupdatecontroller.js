/**
 * @project homechoice.co.za
 * @file profileupdatecontroller.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 01/08/2018
 * @description Viewmodel controller to notify when user profile has been updated by omega
 *              Application will dispatch the following events
 PROFILE_CONTROLLER_CHECK_FOR_CHANGES = 'PROFILE_CONTROLLER_CHECK_FOR_CHANGES';
 PROFILE_CONTROLLER_REQUEST_STATUS = 'PROFILE_CONTROLLER_REQUEST_STATUS';
 PROFILE_CONTROLLER_STATUS_RESPONSE = 'PROFILE_CONTROLLER_STATUS_RESPONSE';
 PROFILE_CONTROLLER_POLLING_COMPLETE = 'PROFILE_CONTROLLER_POLLING_COMPLETE';
 PROFILE_CONTROLLER_POLLING_START = 'PROFILE_CONTROLLER_POLLING_START';
 PROFILE_CONTROLLER_GET_ERROR = 'PROFILE_CONTROLLER_GET_ERROR';
 PROFILE_CONTROLLER_GET_CUSTOMER_FAIL = 'PROFILE_CONTROLLER_GET_CUSTOMER_FAIL';
 PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST';
 PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS';
 PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL';
 **/

define([
        'jquery',
        'knockout',
        'storageApi',
        'pubsub',
        'ccConstants',
        'spinner',
        'ccLogger',
        'navigation',
        'notifier',
        'ccRestClient',
        'ccResourceLoader!global/profile.update.controller',
        'ccResourceLoader!global/hc.constants',
        'ccResourceLoader!global/hc.ui.functions',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app'
    ],
    function (
        $,
        ko,
        storageApi,
        pubsub,
        CCConstants,
        spinner,
        ccLogger,
        navigation,
        notifier,
        ccRestClient,
        updateController,
        hcConstants,
        hcUIFunctions,
        cartDynamicPropertiesApp
    ) {

        "use strict";

        /**
         * Helper method to
         * @param key
         * @param array
         * @param isObservable
         * @returns {*}
         */
        function getDynamicPropByKey (key, array, isObservable) {
            var len = array.length;
            for (var i = 0; i < len; i++) {
                var item = array[i];
                var id = isObservable ? item.id() : item.id;
                if (id === key) {
                    return item;
                }
            }
            return null;
        }

        //  milliseconds
        var PROFILE_POLLING_DELAY = 2000;

        var LOGIN_CHECK = 5;
        var LOGIN_CHECK_TIMEOUT = 500;
        var CHECKOUT_PAGE_LIMIT = 1;

        //  seconds
        var PROFILE_POLLING_LIMIT = 20;

        //  seconds
        var PROFILE_POLL_TIME_OUT = PROFILE_POLLING_LIMIT / (PROFILE_POLLING_DELAY / 1000);

        // var SSE_BASE_PATH = 'https://hc.leedium.com/v1/hc';
        var SSE_BASE_PATH = '/ccstorex/custom/v1/hc';

        var _pollId;

        return {
            pollingInterval: 0,
            pollingTimeout: PROFILE_POLL_TIME_OUT,
            polling: false,
            hasChanged: false,
            loadedProfile: ko.observable(null),
            getCustomerStarted: false,
            inited: false,
            checkoutPageVisited: 0,
            internalRegisterRedirect: false,
            onLoad: function (widget) {
                widget.updateExpenses = function (data) {
                    widget.request({
                        method: 'POST',
                        url: SSE_BASE_PATH + '/customer/updateCustomer',
                        data: data,
                        callbackSuccess: widget.handleUpdateExpensesSuccess,
                        callbackFailure: widget.handleUpdateExpensesFailure
                    });
                };

                /**
                 * Initiates a check between the current OCC saved profile
                 * and the latest from Omega / Homechoice
                 */
                widget.initiateOmegaSyncViaSSE = function () {
                    if (!widget.getCustomerStarted && widget.checkoutPageVisited <= CHECKOUT_PAGE_LIMIT) {
                        $.Topic(hcConstants.PROFILE_CONTROLLER_POLLING_START).publish();
                        widget.getCustomerStarted = true;
                        widget.request({
                            method: 'POST',
                            url: SSE_BASE_PATH + '/customer/syncCustomer',
                            data: {
                                "HcPersonNo": getDynamicPropByKey('hcPersonNo', widget.user().dynamicProperties(), true).value(),
                                "OccProfileNo": widget.user().id()
                            },
                            callbackSuccess: widget.handleGetCustomerSuccess,
                            callbackFailure: widget.handleGetCustomerFailure
                        });
                    }else{
                        $.Topic(hcConstants.PROFILE_CHECKOUT_HIDE_SPINNER).publish();
                    }
                };

                /**
                 * Client side request takes a request object and requests services
                 * from Homechoice SSE
                 * @param requestObj
                 */
                widget.request = function (requestObj) {
                    $.ajax({
                        method: requestObj.method,
                        dataType: 'json',
                        url: requestObj.url,
                        withCredentials: true,
                        data: JSON.stringify(requestObj.data),
                        headers: {
                            'Authorization': 'Bearer ' + ccRestClient.tokenSecret,
                            'hc-env': ccRestClient.previewMode,
                            'hc-page': widget.pageContext().page.name,
                            'Content-Type': 'application/json'
                        }
                    })
                        .done(function (res) {
                            requestObj.callbackSuccess.call(widget, res);
                        })
                        .fail(function (err, status) {
                            requestObj.callbackFailure.call(widget, err, status);
                        });
                };

                /**
                 * Handler for a failed get Customer request from Homechoice API
                 */
                widget.handleGetCustomerFailure = function () {
                    widget.getCustomerStarted = false;
                    $.Topic(hcConstants.PROFILE_CONTROLLER_GET_CUSTOMER_FAIL).publish({widget: widget});
                };

                /**
                 * Handler for a failed attempt to update the users expenses
                 */
                widget.handleUpdateExpensesFailure = function () {
                    $.Topic(hcConstants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL).publish({widget: widget});
                };

                /**
                 * Handler for a successful Expense details submission
                 */
                widget.handleUpdateExpensesSuccess = function (res) {
                    widget.loadedProfile(res);
                    widget.hydrateProfile(res);
                    $.Topic(hcConstants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS).publish(widget.status());
                };

                /**
                 * Retrieves the latest profile information using the API.
                 */
                widget.handleGetCustomerSuccess = function (res) {
                    widget.getCustomerStarted = false;
                    // console.log('Get res:', res);
                    widget.loadedProfile(res);
                    widget.hydrateProfile(res);
                    $.Topic(hcConstants.PROFILE_CONTROLLER_POLLING_COMPLETE).publish(widget.status());

                };

                /**
                 * rehydrrate the profile with the latest from HC
                 * @param res
                 */
                widget.hydrateProfile = function (res) {
                    if (widget.user() && res) {
                        widget.user().dynamicProperties().map(function (item, i) {
                            if (item.value() !== res.dynamicProperties[i].value) {
                                item.value(res.dynamicProperties[i].value);
                            }
                        });
                    }
                };

                /**
                 * Compates the the loaded information from the API with
                 * the current user profile in the view model.
                 * @param loadedProfile
                 */
                widget.compare = function (loadedProfile) {
                    var len = loadedProfile.dynamicProperties.length;
                    var changed = false;
                    for (var i = 0; i < len; i++) {
                        if (loadedProfile.dynamicProperties[i].value != widget.user().dynamicProperties()[i].value()) {
                            changed = true;
                            break;
                        }
                    }
                    widget.haschanged = changed;
                    if (!changed && widget.user().loggedIn()) {
                        widget.polling = true;
                        widget.pollFortUpdatedData();
                    } else {
                        widget.loadedProfile(loadedProfile);
                        widget.stopPolling();
                        $.Topic(hcConstants.PROFILE_CONTROLLER_POLLING_COMPLETE).publish(widget.status());
                    }
                };

                /**
                 * Polling method to recursively call the api and check
                 * for changes
                 */
                widget.pollFortUpdatedData = function () {
                    if (widget.polling && widget.pollingInterval < widget.pollingTimeout) {
                        _pollId = requestTimeout(PROFILE_POLLING_DELAY, function () {
                            widget.handleGetCustomerSuccess();
                        });
                        widget.pollingInterval++;
                    } else {
                        widget.polling = false;
                        $.Topic(hcConstants.PROFILE_CONTROLLER_POLLING_COMPLETE).publish(widget.status());
                        widget.stopPolling();
                    }
                };

                /**
                 * Stops the polling and resets the state
                 * this does not clear  widget.loadedProfile() as
                 * future requestors may want to access the latest profile loaded
                 */
                widget.stopPolling = function () {
                    try {
                        clearRequestTimeout(_pollId);
                    } catch (err) {
                        //not started
                    }
                    widget.reset();
                };

                /**
                 * Formalized object to send back to listeners
                 * @returns {{polling: boolean, updatedProfile: (*|null), hasChanged: (boolean|*)}}
                 */
                widget.status = function () {
                    var newMember = false;
                    var employmentStatus;
                    if (widget.loadedProfile()) {
                        employmentStatus = getDynamicPropByKey('employmentStatus', widget.loadedProfile().dynamicProperties, false).value;
                        newMember = (employmentStatus === null);
                    }
                    return {
                        polling: widget.polling,
                        updatedProfile: widget.loadedProfile() || null,
                        hasChanged: widget.haschanged,
                        newMember: newMember,
                        widget: widget,
                        cartState: cartDynamicPropertiesApp.getInstance().isMixedCart()
                    }
                };

                /**
                 * Resets the application properties
                 */
                widget.reset = function () {
                    widget.polling = false;
                    widget.pollingInterval = 0;
                    widget.hasChanged = false;
                    widget.getCustomerStarted = false;
                };
                $.Topic(hcConstants.PROFILE_CONTROLLER_CHECK_FOR_CHANGES).subscribe(function (time) {
                    if (!widget.polling) {
                        widget.handleGetCustomerSuccess(time);
                    }
                });

                $.Topic(hcConstants.PROFILE_CONTROLLER_REQUEST_STATUS).subscribe(function () {
                    var status = widget.status();
                    var res = status.updatedProfile ? status : null;
                    $.Topic(hcConstants.PROFILE_CONTROLLER_STATUS_RESPONSE).publish(res);
                });

                $.Topic(hcConstants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST).subscribe(function (status) {
                    widget.updateExpenses(status.data);
                });

                $.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function (obj) {
                    widget.inited = false;
                });
                $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(function (obj) {
                    widget.loadedProfile(null);
                });

                function pageViewChanged (page) {
                    if (!widget.user().loggedIn()) {
                        if (page.path === hcConstants.PAGE_REGISTER) {
                            widget.user().handleSamlLogin();
                        }
                    }
                }

                function pageChanged (page) {
                    if(page.path === hcConstants.PAGE_CHECKOUT) {
                        widget.checkoutPageVisited += 1;
                    }
                    widget.handleProfileLoad(page.path);
                    $.Topic(pubsub.topicNames.PAGE_CHANGED).unsubscribe(pageViewChanged)
                }

                $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(pageChanged);
                $.Topic(pubsub.topicNames.PAGE_VIEW_CHANGED).subscribe(pageViewChanged);

            },

            handleProfileLoad: function (pageName) {
                var self = this;
                var pCount = 0;

                function checkIfLoggedIn (count) {
                    window.requestTimeout(LOGIN_CHECK_TIMEOUT, function () {
                        if (self.user().loggedIn()) {
                            self.initiateOmegaSyncViaSSE();
                        } else {
                            if (pageName === hcConstants.PAGE_REGISTER || pageName === hcConstants.PAGE_CHECKOUT) {
                                if (count === LOGIN_CHECK) {
                                    self.user().handleSamlLogin();
                                } else {
                                    checkIfLoggedIn(++pCount);
                                }
                            }
                        }
                    });
                }

                checkIfLoggedIn(++pCount);
            }
        }
    }
);
