/**
 * @fileoverview Order History Details.
 *
 * @author shsatpat
 */
define(

    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['knockout', 'pubsub', 'notifier', 'CCi18n', 'ccConstants', 'navigation', 'ccRestClient', 'spinner',
        'viewModels/paymentsViewModel'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, pubsub, notifier, CCi18n, CCConstants, navigation, ccRestClient, spinner, paymentsContainer) {
        "use strict";

        return {
            /** Widget root element id */
            WIDGET_ID: 'orderDetailsRegion',
            /** Default options for creating a spinner on body*/
            accountOrderBodyIndicator: '#CC-accountOrder-body',
            selectedOrder: ko.observable(),
            accountOrderBodyIndicatorOptions: {
                parent: '#CC-accountOrder-body',
                posTop: '35em',
                posLeft: '50%'
            },


            TermsMonthly: ko.observable(0),
            isTermsMonthly: ko.observable(false),


            display: ko.observable(true),
            onLoad: function (widget) {





                var isModalVisible = ko.observable(false);
                var isModalNoClicked = ko.observable(false);
                var isModalYesClicked = ko.observable(false);

                widget.display(false);
                widget.hideModal = function () {
                    if (isModalVisible()) {
                        $("#CC-orderDetails-modal").modal('hide');
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                    }
                };

                widget.showModal = function () {
                    if ($("#CC-orderDetails-modal").length) {
                        $("#CC-orderDetails-modal").modal('show');
                        $('#CC-orderDetails-modal').on('hidden.bs.modal', function () {
                            if ((!isModalYesClicked() && !isModalNoClicked() && isModalVisible())) {
                                $("#CC-orderDetailsContextChangeMsg").show();
                            }
                        });
                        isModalVisible(true);
                    }
                    else {
                        setTimeout(widget.showModal, 50);
                    }
                };

                widget.handleModalYes = function () {
                    isModalYesClicked(true);
                    widget.cart().clearCartForProfile();
                    ccRestClient.setStoredValue(
                        CCConstants.LOCAL_STORAGE_ORGANIZATION_ID, ko
                            .toJSON(this.orderDetails().organizationId));
                    widget.hideModal();
                    window.location.assign(window.location.href);
                    widget.cart().loadCartForProfile();
                };

                widget.handleModalNo = function () {
                    isModalNoClicked(true);
                    $("#CC-orderDetailsContextChangeMsg").show();
                    widget.hideModal();
                };

                // Define a create spinner function with spinner options
                widget.createSpinner = function (pSpinner, pSpinnerOptions) {
                    $(pSpinner).css('position', 'fixed');
                    $(pSpinner).addClass('loadingIndicator');
                    spinner.create(pSpinnerOptions);
                };

                // Define a destroy spinner function with spinner id
                widget.destroySpinner = function (pSpinnerId) {
                    $(widget.accountOrderBodyIndicator).css('position', 'relative');
                    $(pSpinnerId).removeClass('loadingIndicator');
                    spinner.destroyWithoutDelay(pSpinnerId);
                };

                widget.isGiftCardUsed = ko.computed(
                    function () {
                        if (widget.orderDetails()) {
                            var payments = widget.orderDetails().payments;
                            for (var i = 0; i < payments.length; i++) {
                                if (payments[i].paymentMethod == CCConstants.GIFT_CARD_PAYMENT_TYPE && payments[i].paymentState == CCConstants.PAYMENT_GROUP_STATE_AUTHORIZED) {
                                    return true;
                                }
                            }
                        }
                    }, widget);
                widget.isScheduledOrder = ko.computed(
                    function () {
                        if (widget.orderDetails()) {
                            if (widget.orderDetails().scheduledOrderName) {
                                return true;
                            }
                        }
                    }, widget);

                widget.totalAmount = ko.computed(
                    function () {
                        if (widget.orderDetails()) {
                            var payments = widget.orderDetails().payments;
                            var remainingTotal = 0;
                            for (var i = 0; i < payments.length; i++) {
                                if (payments[i].paymentMethod != CCConstants.GIFT_CARD_PAYMENT_TYPE) {
                                    remainingTotal += payments[i].amount;
                                }
                            }
                        }
                        return remainingTotal;
                    }, widget);

                widget.approverName = ko.computed(
                    function () {
                        if (widget.orderDetails() && widget.orderDetails().approvers) {
                            var approver = widget.orderDetails().approvers[0];
                            if (approver.lastName != null) {
                                return approver.firstName + " " + approver.lastName;
                            } else {
                                return approver.firstName;
                            }
                        }
                        return null;
                    }, widget);

                widget.claimedCouponMultiPromotions = ko.pureComputed(
                    function () {
                        var coupons = new Array();
                        if (widget.orderDetails()) {
                            if (widget.orderDetails().discountInfo) {
                                for (var prop in widget.orderDetails().discountInfo.claimedCouponMultiPromotions) {
                                    var promotions = widget.orderDetails().discountInfo.claimedCouponMultiPromotions[prop];
                                    var couponMultiPromotion = [];
                                    couponMultiPromotion.code = prop;
                                    couponMultiPromotion.promotions = promotions;
                                    coupons.push(couponMultiPromotion);
                                }
                            }
                        }
                        return coupons;
                    }, widget);

                widget.approverMessage = ko.computed(
                    function () {
                        if (widget.orderDetails() && widget.orderDetails().approverMessages
                            && widget.orderDetails().approverMessages.length > 0) {
                            return widget.orderDetails().approverMessages[0];
                        }
                        return CCConstants.NO_COMMENTS;
                    }, widget);

                // To check if Payment is yet to be done by buyer and display complete payment button
                widget.isEligibleToCompletePayment = ko.computed(
                    function () {
                        //identify pending authorization payment group existence first for payU case
                        var pendingAuthPaymentGroup = false;
                        if (widget.orderDetails() && widget.orderDetails().payments) {
                            var payments = widget.orderDetails().payments;
                            for (var i = 0; i < payments.length; i++) {
                                if (payments[i].paymentState == CCConstants.PENDING_AUTHORIZATION) {
                                    pendingAuthPaymentGroup = true;
                                    break;
                                }
                            }
                        }
                        // If order is pending payment and belongs to current user and does not
                        //have pending authorization Payment Group then allow him to make payments
                        if (widget.orderDetails() && widget.user() && widget.orderDetails().priceInfo &&
                            widget.orderDetails().state == CCConstants.ORDER_STATE_PENDING_PAYMENT &&
                            widget.orderDetails().orderProfileId == widget.user().id() &&
                            !pendingAuthPaymentGroup && widget.orderDetails().priceInfo.total > 0) {
                            return true;
                        }
                        return false;
                    }, widget);

                // To verify if Billing Address is present in order details
                widget.isBillingAddressPresent = ko.computed(
                    function () {
                        if (widget.orderDetails() && widget.orderDetails().billingAddress) {
                            return true;
                        }
                        return false;
                    }, widget);

                // To append locale for scheduled orders link
                widget.detailsLinkWithLocale = ko.computed(
                    function () {
                        return navigation.getPathWithLocale('/scheduledOrders/');
                    }, widget);

                widget.populatePaymentsViewModel = function () {
                    var widget = this;
                    var authorizedAmount = 0;
                    var completedPayments = [];
                    var currency = widget.site().selectedPriceListGroup().currency.symbol;

                    for (var i = 0; i < widget.orderDetails().payments.length; i++) {
                        if (widget.orderDetails().payments[i].paymentState == CCConstants.PAYMENT_GROUP_STATE_AUTHORIZED ||
                            widget.orderDetails().payments[i].paymentState == CCConstants.PAYMENT_GROUP_STATE_PAYMENT_REQUEST_ACCEPTED ||
                            widget.orderDetails().payments[i].paymentState == CCConstants.PAYMENT_GROUP_PAYMENT_DEFERRED ||
                            widget.orderDetails().payments[i].paymentState == CCConstants.PAYMENT_GROUP_STATE_SETTLED) {
                            authorizedAmount = parseFloat(authorizedAmount) + parseFloat(widget.orderDetails().payments[i].amount);
                            completedPayments.push(widget.generateCompletedPaymentsText(widget.orderDetails().payments[i], currency));
                        }
                    }
                    var dueAmount = parseFloat(widget.orderDetails().priceInfo.total) - parseFloat(authorizedAmount);
                    // Update Payments View Model
                    var paymentsViewModel = paymentsContainer.getInstance();
                    // Reset the view model before adding the completed payments
                    paymentsViewModel.resetPaymentsContainer();
                    paymentsViewModel.paymentDue(dueAmount);
                    widget.cart().total(dueAmount);
                    paymentsViewModel.historicalCompletedPayments(completedPayments);
                    widget.user().isHistoricalOrder = true;
                };

                widget.generateCompletedPaymentsText = function (pPaymentData, currency) {
                    var type;
                    var maskedNumber;
                    if (pPaymentData.paymentMethod == CCConstants.TOKENIZED_CREDIT_CARD || pPaymentData.paymentMethod == CCConstants.CREDIT_CARD) {
                        if (pPaymentData.cardType) {
                            type = pPaymentData.cardType;
                        } else {
                            type = CCConstants.CREDIT_CARD_TEXT;
                        }
                        maskedNumber = pPaymentData.cardNumber;
                    } else if (pPaymentData.paymentMethod == CCConstants.GIFT_CARD_PAYMENT_TYPE) {
                        type = CCConstants.GIFT_CARD_TEXT;
                        maskedNumber = pPaymentData.maskedCardNumber;
                    } else if (pPaymentData.paymentMethod == CCConstants.CASH_PAYMENT_TYPE) {
                        type = CCConstants.CASH_PAYMENT_TYPE;
                        maskedNumber = "";
                    } else if (pPaymentData.paymentMethod == CCConstants.INVOICE_PAYMENT_METHOD) {
                        type = CCConstants.INVOICE_PAYMENT_TYPE;
                        maskedNumber = pPaymentData.PONumber;
                    }

                    return (currency + pPaymentData.amount + widget.translate("toBeChargedPaymentText", { type: type, number: maskedNumber }));
                };

                widget.pendingApprovalReasons = ko.computed(
                    function () {
                        if (widget.orderDetails()) {
                            var orderDetails = widget.orderDetails();
                            if (orderDetails.approvalSystemMessages) {
                                return orderDetails.approvalSystemMessages;
                            }
                        }
                        return null;
                    }, widget);
            },

            completePayment: function () {
                var widget = this;
                widget.populatePaymentsViewModel();

                this.cart().currentOrderId(this.orderDetails().id);
                this.cart().currentOrderState(this.orderDetails().state);
                this.user().validateAndRedirectPage(this.links().checkout.route + "?orderId=" + this.orderDetails().id);
            },

            beforeAppear: function (page) {
                var widget = this;



                widget.isTermsMonthly(false);
                var sumMonthInstallments = 0;

                var items = widget.orderDetails().order.items;
                for (var index = 0; index < items.length; index++) {
                    var element = items[index];

                    var mInst = 0;
                    var mQuant = element.quantity;

                    for (var d = 0; d < element.dynamicProperties.length; d++) {
                        var dp = element.dynamicProperties[d];

                        if (dp.id == "hcTermsCharge") {
                            if (dp.value !== null) {
                                widget.isTermsMonthly(true);
                                mInst = dp.value;
                                break;
                            }
                        }
                    }
                    sumMonthInstallments = sumMonthInstallments + (mInst * mQuant);
                }

                widget.TermsMonthly(sumMonthInstallments);



                $("body").attr("id", "CC-accountOrder-body");
                if (!widget.orderDetails() || !widget.user().loggedIn() || widget.user().isUserSessionExpired()) {
                    navigation.doLogin(navigation.getPath(), widget.links().home.route);
                }

                if (widget.user().currentOrganization() && this.orderDetails().organizationId !=
                    widget.user().currentOrganization().repositoryId) {
                    widget.display(false);
                    widget.showModal();
                }
                else if (widget.orderDetails() && widget.orderDetails().state == CCConstants.PENDING_APPROVAL) {
                    widget.display(true);
                    widget.createSpinner(widget.accountOrderBodyIndicator, widget.accountOrderBodyIndicatorOptions);
                    var params = {};
                    params[CCConstants.ORDER_ID] = widget.orderDetails().id;
                    params[CCConstants.REPRICE] = true;
                    ccRestClient.request(CCConstants.ENDPOINT_ORDERS_PRICE_ORDER, params,
                        function (data) {
                            data.order = {};
                            data.order = data.shoppingCart;
                            widget.orderDetails(data);
                            widget.destroySpinner(widget.accountOrderBodyIndicator);
                        }, function (data) {
                            widget.destroySpinner(widget.accountOrderBodyIndicator);
                            widget.display(true);
                            notifier.sendError(widget.WIDGET_ID, data.message, true);
                        }, params)
                }
                else {
                    widget.display(true);
                }
                widget.resetOrderDetails = function () {
                    if (!(arguments[0].data.page.orderDetails && arguments[0].data.page.orderDetails.id)) {
                        widget.orderDetails(null);
                        $.Topic(pubsub.topicNames.PAGE_LAYOUT_LOADED).unsubscribe(widget.resetOrderDetails);
                        $.Topic(pubsub.topicNames.PAGE_METADATA_CHANGED).unsubscribe(widget.resetOrderDetails);
                    }
                };

                $.Topic(pubsub.topicNames.PAGE_LAYOUT_LOADED).subscribe(widget.resetOrderDetails);
                $.Topic(pubsub.topicNames.PAGE_METADATA_CHANGED).subscribe(widget.resetOrderDetails);

                if (widget.orderDetails() && widget.orderDetails().errorMessages != undefined) {
                    notifier.clearError(widget.WIDGET_ID);
                    notifier.clearSuccess(widget.WIDGET_ID);
                    notifier.sendError(widget.WIDGET_ID, widget.orderDetails().errorMessages, true);
                }
            },
            /**
             * Function to get the display name of a state 
             * countryCd - Country Code
             * stateCd - State Code
             */
            getStateDisplayName: function (countryCd, stateCd) {
                if (this.shippingCountries()) {
                    for (var i in this.shippingCountries()) {
                        var countryObj = this.shippingCountries()[i];
                        if (countryObj.countryCode === countryCd) {
                            for (var j in countryObj.regions) {
                                var stateObj = countryObj.regions[j];
                                if (stateObj.abbreviation === stateCd) {
                                    return stateObj.displayName;
                                }
                            }
                        }
                    }
                }
                return "";
            },

            /**
             * Function to get the display name of a state 
             */
            getStateName: function () {
                if (this.orderDetails && this.orderDetails() && this.orderDetails().shippingAddress && this.orderDetails().shippingAddress.regionName) {
                    return this.orderDetails().shippingAddress.regionName;
                }
                return "";
            },

            /**
             * Function to get the display name of a Country 
             * countryCd - Country Code
             */
            getCountryDisplayName: function (countryCd) {
                if (this.shippingCountries()) {
                    for (var i in this.shippingCountries()) {
                        var countryObj = this.shippingCountries()[i];
                        if (countryObj.countryCode === countryCd) {
                            return countryObj.displayName;
                        }
                    }
                }
                return "";
            },

            /**
             * Function to get the display name of a Country 
             */
            getCountryName: function () {
                if (this.orderDetails && this.orderDetails() && this.orderDetails().shippingAddress && this.orderDetails().shippingAddress.countryName) {
                    return this.orderDetails().shippingAddress.countryName;
                }
                return "";
            },

            /**
            * Method to fetch items from the order and send them to cart
            * so that these items can be added to the cart.
            */
            mergeToCart: function (data, event) {
                var widget = this;
                if (data.order) {
                    widget.selectedOrder(data.order);
                }
                widget.cart().mergeCart(true);
                var state = widget.selectedOrder().state;
                var success = function () {
                    widget.user().validateAndRedirectPage("/cart");
                };
                var error = function (errorBlock) {
                    var errMessages = "";
                    var displayName;
                    for (var k = 0; k < errorBlock.length; k++) {
                        errMessages = errMessages + "\r\n" + errorBlock[k].errorMessage;
                    }
                    notifier.sendError("CartViewModel", errMessages, true);
                };
                widget.cart().addItemsToCart(widget.selectedOrder().items, success, error);
            },

            setSelectedOrder: function (data, event) {
                this.selectedOrder(data.order);
            }
        }
    }
);
