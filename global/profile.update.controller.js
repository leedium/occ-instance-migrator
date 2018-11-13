/**
 * @project
 * @file profile.update.controller.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 07/08/2018
 * @description handles global level ui for profile updates
**/


define([
        'jquery',
        'knockout',
        'storageApi',
        'pubsub',
        'ccConstants',
        'spinner',
        'notifier'
    ],
    function (
        $,
        ko,
        storageApi,
        pubsub,
        ccConstants,
        spinner,
        notifier
    ) {

        "use strict";

        var PAGE_REGISTER = 'register';
        var PAGE_CHECKOUT = 'checkout';
        var NOTIFIER_ID = 'globalProfileupdateController';


        var $target = $('#main');
        var hcSpinner = $('<div class="hc-profile-spinner" style="position: absolute; text-align: center;  justify-content:center; align-items: center; top:0; left:0; width: 100%; height: 100%; z-index: 999999; background-color: rgba(255,255,255,.8);">' +
            '<div id="checkoutSpinner" style="position: relative; top:50%;" class=""><div class="cc-spinner-css" style="margin: 0 auto; right: 7px;"><span class="ie-show">Loading...</span><div class="cc-spinner-css-1"></div><div class="cc-spinner-css-2"></div><div class="cc-spinner-css-3"></div><div class="cc-spinner-css-4"></div><div class="cc-spinner-css-5"></div><div class="cc-spinner-css-6"></div><div class="cc-spinner-css-7"></div><div class="cc-spinner-css-8"></div><div class="cc-spinner-css-9"></div><div class="cc-spinner-css-10"></div><div class="cc-spinner-css-11"></div><div class="cc-spinner-css-12"></div></div></div>' +
            '</div>');

        var currrentPage;

        return {
            onLoad: function () {
                var self = this;
                $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(function (pageContext) {
                    currrentPage = pageContext.pageId;
                    if (pageContext.pageId === PAGE_REGISTER) {
                        self.showSpinner();
                    }
                });
                $.Topic('PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST').subscribe(function (status) {
                    if (status.widget.pageContext().page.name === PAGE_REGISTER) {
                        notifier.clearMessage(NOTIFIER_ID,'error');
                        self.showSpinner();
                    }
                });
                $.Topic('PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL').subscribe(function (status) {
                    if (status.widget.pageContext().page.name === PAGE_REGISTER) {
                        notifier.sendError(NOTIFIER_ID,'There is an issue with your form, please review and resubmit.', true);
                        self.hideSpinner(1000);
                    }
                });
                $.Topic('PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS').subscribe(function (status) {
                    if (status.widget.pageContext().page.name === PAGE_REGISTER) {
                        notifier.sendSuccess(NOTIFIER_ID,'Registration Complete.', true);
                        self.hideSpinner(500);
                    }
                });

                $.Topic('PROFILE_CONTROLLER_GET_CUSTOMER_FAIL').subscribe(function (status) {
                    notifier.sendError(NOTIFIER_ID,'Error retrieving your profile. Please contact customer service if the problem persists.', 'info', true);
                });

                $.Topic('PROFILE_TERMS_CHECKOUT_WITHOUT_COMPLETED_REGISTRATION').subscribe(function () {
                    notifier.sendError(NOTIFIER_ID,'Sorry, you must complete your Employment Details before making a Terms /Monthly Purchase.', 'info', false);
                });

                $.Topic('PROFILE_CHECKOUT_WITHOUT_LOGIN').subscribe(function () {
                    notifier.sendError(NOTIFIER_ID,'Sorry, you must be logged in to complete a purchase.', 'info', true);
                });

                $.Topic('PROFILE_CONTROLLER_POLLING_START').subscribe(function (status) {
                   if(currrentPage == PAGE_CHECKOUT){
                       self.showSpinner();
                   }
                });

                $.Topic('PROFILE_CONTROLLER_POLLING_COMPLETE').subscribe(function (status) {
                    self.hideSpinner(500);
                });

                $.Topic('PROFILE_CHECKOUT_HIDE_SPINNER').subscribe(function (status) {
                    self.hideSpinner(500);
                });
            },

            /**
             * Shows the spinner
             */
            showSpinner: function () {
                $target.append(hcSpinner);
            },

            /**
             * hides the loading spinner
             * @param delay - in milliseconds
             */
            hideSpinner: function (delay) {
                requestTimeout(delay, function(){
                    hcSpinner.remove();
                });
            }
        }
    }
);
