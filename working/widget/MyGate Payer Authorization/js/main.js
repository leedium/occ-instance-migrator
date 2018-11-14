/* global define */

/**
 * @project mygate
 * @file main.js
 * @company Spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 13/07/2018
 * @description  Handles the 3rd party authorization submission.  Once validated,
 *              the system is put in a polling state and listens for a request from
 *              the SSE to generic card responses with AUTH_ACCEPT or AUTH dECLINe
 *
 **/

define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration', 'ccLogger'],
    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, log) {
        'use strict';

        var moduleObj = {
            DEFAULT_DECLINE_MESSAGE: '(1000) Your credit card has been declined, please use an alternative card.',
            DEFAULT_TIMEOUT_MESSAGE: 'We experienced a technical problem (timeout) while authorizing payment. Please try again in a little while.',
            DEFAULT_LOAD_TIMEOUT: 60,
            outputFrameCount: 0,
            authDertails: null,
            isPaymentDeclined: false,
            onLoad: function (widget) {
                console.log('PAYMENT AUTH ON LOAD');

                /**
                 * returns the self submitting form
                 * @returns {HTMLElement | null}
                 */
                widget.getInputFrame = function () {
                    return document.getElementById('inputIframe');
                };

                /**
                 * returns the output iframe that displays the 3DSecure form
                 * @returns {HTMLElement | null}
                 */
                widget.getOutputFrame = function () {
                    return document.getElementById('mygateIframeOutput');
                };

                /**
                 * Conditional function returning a iframe by key
                 * @param type
                 * @returns {Document}
                 */
                widget.getFrameDocument = function (type) {
                    var iframe = type === 'output' ? widget.getOutputFrame() : widget.getInputFrame();
                    if (iframe) {
                        return iframe.contentDocument || iframe.contentWindow.document;
                    }
                };

                //  todo:  add more error handling here
                widget.addHandleErrors = function () {

                    // $.Topic(pubsub.topicNames.PAYMENT_AUTH_SUCCESS).subscribe(function (data) {
                    //     console.log('mygate::PAYMENT_AUTH_SUCCESS');
                    //     notifier.sendError(widget.WIDGET_ID, widget.resources().paymentAuthSuccessMessage, true);
                    // });

                    $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).subscribe(function onPaymentAuthDeclined(data) {
                        console.log('mygate::PAYMENT_AUTH_DECLINED WHY?', data, widget);
                        console.log('message', widget.resources().orderSubmissionFailMessage)
                        $.Topic(pubsub.topicNames.PAYMENT_AUTH_DECLINED).unsubscribe(onPaymentAuthDeclined);
                        // notifier.sendMessageToPage(widget.WIDGET_ID, widget.resources().paymentAuthDeclinedMessage, true);
                        // notifier.sendMessageToPage(widget.WIDGET_ID, 'DAVID LEE', true);
                    });

                    // $.Topic(pubsub.topicNames.PAYMENT_AUTH_TIMED_OUT).subscribe(function (data) {
                    //     console.log('mygate::PAYMENT_AUTH_TIMED_OUT, whY!');
                    //     notifier.sendMessageToPage(widget.WIDGET_ID, widget.resources().paymentAuthTimedoutMessage, true, 'checkout');
                    // });
                    //
                    // $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).subscribe(function (data) {
                    //     $.Topic('MYGATE_OVERLAY_HIDE').publish();
                    //     console.log('message',widget.resources().orderSubmissionFailMessage)
                    //     setTimeout(function(){
                    //         notifier.sendError(widget.WIDGET_ID, widget.resources().orderSubmissionFailMessage);
                    //     }, 1000);
                    //     console.log('mygate::ORDER_SUBMISSION_FAIL');
                    // });
                };

                /**
                 * Checks that iframe content/form is loaded and injects the values into the form. Also
                 * sets the action url
                 * @param order
                 * @param pTryCount
                 */
                widget.populateIframeWithIssuerUrl = function (order, pTryCount) {
                    //    helper function to handle the recursive reload
                    var checkFrame = function (order, pTryCount) {
                        log.error('Payment Form not loading.');
                        widget.order().destroySpinner();
                        widget.populateIframeWithIssuerUrl(order, pTryCount + 1);
                    };

                    if (pTryCount === widget.DEFAULT_LOAD_TIMEOUT) {
                        widget.handleUnexpectedErrors();
                        return;
                    }

                    setTimeout(function () {
                        var contentDoc;
                        var authForm;
                        var iframe = widget.getInputFrame();
                        if (iframe) {
                            contentDoc = widget.getFrameDocument();
                            authForm = contentDoc.getElementById('mygateACSForm');
                            if (authForm) {
                                var customPaymentProperties = order.orderDetails.payments[0].customPaymentProperties;
                                authForm.setAttribute('action', customPaymentProperties.acsUrl);
                                contentDoc.getElementById('TermUrl').value = customPaymentProperties.termUrl;
                                contentDoc.getElementById('MD').value = customPaymentProperties.MD;
                                contentDoc.getElementById('PaReq').value = customPaymentProperties.payload;

                                //  Submit form to generate 3D Secure Authentication form
                                authForm.submit();
                                console.log('auth form loaded');
                                var messageDetails = [
                                    {
                                        message: 'success',
                                        order: order,
                                        orderid: order.orderDetails.id,
                                        orderuuid: order.orderDetails.uuid,
                                        paymentGroupId: order.orderDetails.payments[0].paymentGroupId,
                                        gatewayname: 'mygate'
                                    }
                                ];

                                widget.getOutputFrame().onload = function () {
                                    widget.outputFrameCount++;
                                    if (widget.outputFrameCount % 2 === 0) {
                                        $.Topic('MYGATE_OVERLAY_SHOW').publish({copy: '...please wait....'});
                                    }
                                };

                                setTimeout(function () {
                                    $.Topic('MYGATE_OVERLAY_HIDE').publish();
                                }, 2000);

                                //  Start polling for a response here
                                //  https://ccadmin-test-zbba.oracleoutsourcing.com/ccstoreui/v1/paymentGroups/{pgId}
                                $.Topic(pubsub.topicNames.PAYMENT_GET_AUTH_RESPONSE).publish(messageDetails);
                            } else {
                                checkFrame(order, pTryCount + 1);
                            }
                        } else {
                            checkFrame(order, pTryCount + 1);
                        }
                    }, 500);
                };

                widget.handleTimeout = function () {
                };

                //  Add listeners
                $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(function (data) {
                    console.log('PAGE_CHANGED', data);
                    if (data.pageId === 'confirmation') {
                        $.Topic('MYGATE_OVERLAY_REMOVE').publish();
                    }
                });

                $.Topic(pubsub.topicNames.ORDER_AUTHORIZE_PAYMENT).subscribe(function authorizePayment(orderObj) {
                    var order = orderObj[0].details;
                    console.log('mygate:ORDER_AUTHORIZE_PAYMENT:order', order);
                    if (order) {
                        widget.authDetails = order;
                        widget.populateIframeWithIssuerUrl(order, 0);
                        widget.addHandleErrors();
                    }
                });


                /**
                 * Handle payment authorization time out.
                 * Defined default message only used when the resource can not be found.
                 */
                widget.notify = function (message) {
                    notifier.sendErrorToPage(widget.WIDGET_ID, message, true, 'checkout');
                };

                /**
                 * Handle unexpected errors.
                 */
                widget.handleUnexpectedErrors = function () {
                    try {
                        $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).publish([{message: 'fail'}]);
                    } catch (e) {
                        log.error('Error Handling Order Fail');
                        log.error(e);
                    }
                    try {
                        widget.handleTimeout();
                    } catch (e) {
                        log.error('Error Handling Timeout');
                        log.error(e);
                    }
                };
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                $(window).scrollTop(0);
                this.isPaymentDeclined = false;
            }
        };
        return moduleObj;
    }
);
