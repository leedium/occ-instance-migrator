/**
 * @fileoverview Card Payment Widget.
 *
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['knockout', 'ccConstants', 'pubsub', 'koValidate', 'notifier',
        'storeKoExtensions', 'ccKoValidateRules', 'CCi18n',
        'ccResourceLoader!global/hc.ui.paymentViewModel',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/profile.checkout.controller',
        'ccResourceLoader!global/hc.constants'
    ],
    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function (ko, CCConstants, pubsub, koValidate, notifier,
              storeKoExtensions, rules, CCi18n, paymentViewModel, cartDynamicPropertiesApp, hcCheckoutController,hcConstants) {
        "use strict";

        var VISIBLE_STATE = 'cash';
        var CARD = 'card';

        return {
            visibleState: VISIBLE_STATE,
            cartProps: null,
            WIDGET_ID: "profileCardPayment",
            paymentVM: paymentViewModel.getInstance(),
            paymentIndex: ko.observable(-1),
            isViewVisible: ko.observable(false),
            getMonths: function () {
                var widget = this;
                var order = widget.order();
                order.paymentDetails().monthList().splice(0);
                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '01',
                        month: widget.translate('januaryText')
                    }),
                    value: '01'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '02',
                        month: widget.translate('februaryText')
                    }),
                    value: '02'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '03',
                        month: widget.translate('marchText')
                    }),
                    value: '03'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '04',
                        month: widget.translate('aprilText')
                    }),
                    value: '04'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '05',
                        month: widget.translate('mayText')
                    }),
                    value: '05'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '06',
                        month: widget.translate('juneText')
                    }),
                    value: '06'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '07',
                        month: widget.translate('julyText')
                    }),
                    value: '07'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '08',
                        month: widget.translate('augustText')
                    }),
                    value: '08'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '09',
                        month: widget.translate('septemberText')
                    }),
                    value: '09'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '10',
                        month: widget.translate('octoberText')
                    }),
                    value: '10'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '11',
                        month: widget.translate('novemberText')
                    }),
                    value: '11'
                });

                order.paymentDetails().monthList().push({
                    name: widget.translate('monthDropDownFormatter', {
                        number: '12',
                        month: widget.translate('decemberText')
                    }),
                    value: '12'
                });
            },

            applyConditions: function () {
                var widget = this;
                return widget.cart().total() > 0 && !widget.order().paymentDetails().isCardPaymentDisabled();
            },
            addValidation: function () {
                var widget = this;
                var order = widget.order();
                order.paymentDetails().nameOnCard.extend({
                    required: {
                        params: true,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('nameOnCardRequired')
                    }
                });

                order.paymentDetails().cardType.extend({
                    required: {
                        params: true,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('cardTypeRequired')
                    }
                });

                order.paymentDetails().cardNumber.extend({
                    required: {
                        params: true,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('cardNumberRequired')
                    },
                    maxLength: {
                        params: CCConstants.CYBERSOURCE_CARD_NUMBER_MAXIMUM_LENGTH,
                        message: widget.translate('cardNumberMaxLength', {maxLength: CCConstants.CYBERSOURCE_CARD_NUMBER_MAXIMUM_LENGTH})
                    },
                    creditcard: {
                        params: {
                            iin: order.paymentDetails().cardIINPattern,
                            length: order.paymentDetails().cardNumberLength
                        },
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('cardNumberInvalid')
                    }
                });

                order.paymentDetails().cardCVV.extend({
                    required: {
                        params: true,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('cardCVVRequired')
                    },
                    minLength: {
                        params: 3,
                        message: widget.translate('cardCVVNumberMinLength')
                    },
                    maxLength: {
                        params: 4,
                        message: widget.translate('cardCVVNumberMaxLength')
                    },
                    number: {
                        param: true,
                        message: widget.translate('cardCVVNumberInvalid')
                    },
                    cvv: {
                        params: order.paymentDetails().cvvLength,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('cardCVVInvalid')
                    }
                });

                order.paymentDetails().endMonth.extend({
                    required: {
                        params: true,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('endMonthRequired')
                    },
                    endmonth: {
                        params: order.paymentDetails().endYear,
                        message: widget.translate('endMonthInvalid')
                    }
                });

                order.paymentDetails().endYear.extend({
                    required: {
                        params: true,
                        onlyIf: function () {
                            return widget.applyConditions();
                        },
                        message: widget.translate('endYearRequired')
                    }
                });

                if (order.paymentDetails().endYearList().length) {
                    order.paymentDetails().endYear.extend({
                        max: {
                            params: order.paymentDetails().endYearList()[(order.paymentDetails().endYearList().length - 1)].value,
                            message: widget.translate('endYearInvalid')
                        },
                        min: {
                            params: order.paymentDetails().endYearList()[0].value,
                            message: widget.translate('endYearInvalid')
                        }
                    });
                }
            },

            initResourceDependents: function () {
                this.getMonths();
                this.addValidation();
            },

            resourcesLoaded: function (widget) {
                var order =  widget.order();
                order.paymentDetails().endMonthPlaceholderText(widget.translate('endMonthPlaceholder'));
                order.paymentDetails().endYearPlaceholderText(widget.translate('endYearPlaceholder'));
                order.paymentDetails().cardTypePlaceholderText(widget.translate('cardTypePlaceholder'));
                widget.initResourceDependents(widget.resources);
            },

            beforeAppear: function () {
                var widget = this;
                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    if(widget.paymentVM.paymentType() === CARD) {
                        widget.isViewVisible(ready.show);
                    }
                });
            },

            onLoad: function (widget) {
                var YEAR_LIST_LENGTH = 20;
                var self = this;
                var order = widget.order();
                widget.reset = function () {
                    widget.isViewVisible(false);
                };
                widget.validate = function () {
                    var valid = true;
                    if(widget.paymentVM.paymentType() === CARD) {
                        valid = widget.order().paymentDetails().isValid();
                    }
                    // console.log('Card Payment Validate:  result', valid);

                    return valid
                };
                widget.onCashPaymentSelected = function (viewArray) {
                    widget.isViewVisible(viewArray[0]);
                };

                //listen to change from profile cash payment buttons
                $.Topic(hcConstants.PROFILE_CHECKOUT_CASH_PAYMENT_TYPE_SELECTED).subscribe(function (subViewVisible) {
                    widget.onCashPaymentSelected(subViewVisible);
                });

                order.paymentDetails().nameOnCard.isData = true;
                order.paymentDetails().cardType.isData = true;
                order.paymentDetails().cardNumber.isData = true;
                order.paymentDetails().cardCVV.isData = true;
                order.paymentDetails().endMonth.isData = true;
                order.paymentDetails().endYear.isData = true;

                order.paymentDetails().selectedCardType.isData = true;
                order.paymentDetails().selectedEndMonth.isData = true;
                order.paymentDetails().selectedEndYear.isData = true;

                order.paymentDetails().cardIINPattern.isData = true;
                order.paymentDetails().cardNumberLength.isData = true;
                order.paymentDetails().cvvLength.isData = true;
                order.paymentDetails().startDateRequired.isData = true;

                order.showSchedule.subscribe(function (newValue) {
                    if (newValue) {
                        if (!order.paymentDetails().isCardEnabledForScheduledOrder()) {
                            order.paymentDetails().resetPaymentDetails(self);
                        }
                    }
                });

                $.Topic(pubsub.topicNames.PAYMENTS_DISABLED).subscribe(function () {
                    //Reset card payment details on disable
                    order.paymentDetails().resetPaymentDetails();
                });

                /**
                 * Responds to updates to the credit card number and, if relevant, applies those updates to the cart.
                 */
                order.paymentDetails().cardNumber.subscribe(function (newCardNumber) {
                    // Only reprice if iin range promotions exist
                    if (!widget.payment().IINPromotionsEnabled ) {
                        if ((newCardNumber) && (order.paymentDetails().cardNumber.isValid())) {

                            // Is the IIN we've just received any different to the IIN already on the cart?
                            var newIIN = newCardNumber.substr(0, CCConstants.CREDIT_CARD_IIN_LENGTH);
                            var cartIINDetailsArray = widget.cart().IINDetails;

                            // This widget only supports one payment type so if there is more than one IIN
                            // on the cart already, we'll definitely need a reprice as there's a definite change.
                            // The same goes if there previously was no IIN at all on the cart. But we shouldn't update any IIN until
                            // we're sure it's different from the 'new' one.
                            if ((!cartIINDetailsArray) ||
                                (cartIINDetailsArray.length > 1) ||
                                (cartIINDetailsArray.length === 0) ||
                                (newIIN !== cartIINDetailsArray[0].IIN)) {
                                widget.cart().applyIINsToCart([new IINPaymentDetails(newIIN)]);
                            }
                        } else if (newCardNumber == null) {
                            // Looks like we previously had a card number and now we don't. That means we might need to reprice
                            // to remove any previously applied IIN promotion.
                            widget.cart().applyIINsToCart([new IINPaymentDetails(null)]);
                        }
                    }
                });

                /**
                 * A simple object to hold details about IIN based payments. Initially it provides the IIN and nothing else,
                 * in the future it may provide more
                 */
                function IINPaymentDetails(IIN) {
                    this.IIN = IIN;
                }

                widget.getEndYears = function () {
                    var endYear = new Date().getFullYear();

                    order.paymentDetails().endYearList.removeAll();

                    for (var i = 0; i < YEAR_LIST_LENGTH; i++) {
                        order.paymentDetails().endYearList().push({name: endYear, value: endYear});
                        ++endYear;
                    }
                };

                $.Topic(pubsub.topicNames.CART_UPDATED).subscribe(function (obj) {
                    if (order.amountRemaining() === 0 || order.isCashPayment()) {
                        order.paymentDetails().isCardPaymentDisabled(true);
                        order.paymentDetails().resetPaymentDetails(obj);
                    }
                    else {
                        if (((order.paymentDetails().enabledTypes).indexOf(CCConstants.CARD_PAYMENT_TYPE) !== -1)) {
                            order.paymentDetails().isCardPaymentDisabled(false);
                        }
                    }
                });

                $.Topic(pubsub.topicNames.CART_UPDATED_PENDING_PAYMENT).subscribe(function (obj) {
                    if (order.amountRemaining() === 0 || order.isCashPayment()) {
                        order.paymentDetails().isCardPaymentDisabled(true);
                        order.paymentDetails().resetPaymentDetails(obj);
                    }
                    else {
                        if (((order.paymentDetails().enabledTypes).indexOf(CCConstants.CARD_PAYMENT_TYPE) !== -1)) {
                            order.paymentDetails().isCardPaymentDisabled(false);
                        }
                    }
                });

                widget.cardClicked = function (card) {
                    if (card && card.value !== "") {
                        for (var i = 0; i < order.paymentDetails().cardTypeList().length; i++) {
                            if (order.paymentDetails().cardTypeList()[i].value === card.value) {
                                order.paymentDetails().selectedCardType(card.value);
                                break;
                            }
                        }
                    }
                };

                /**
                 * Set up the popover and click handler
                 * @param {Object} widget
                 */
                widget.cvvMouseOver = function (widget) {
                    // Popover was not being persisted between
                    // different loads of the same 'page', so
                    // popoverInitialised flag has been removed
                    var popOver = $('.cvvPopover');

                    // remove any previous handlers
                    popOver.off('click');
                    popOver.off('keydown');

                    var options = {};
                    options.trigger = 'manual';
                    options.html = true;

                    // the button is just a visual aid as clicking anywhere will close popover
                    options.title = widget.translate('cardCVVPopupTitle')
                        + "<button id='cardCVVPopupCloseBtn' class='close btn pull-right'>"
                        + widget.translate('escapeKeyText')
                        + " &times;</button>";

                    options.content = widget.translate('cardCVVPopupText');

                    popOver.popover(options);
                    popOver.on('click', widget.cvvShowPopover);
                    popOver.on('keydown', widget.cvvShowPopover);
                };

                widget.cvvShowPopover = function (e) {
                    var $html = $('html');
                    var popOver = $('.cvvPopover');
                    // if keydown, rather than click, check its the enter key
                    if (e.type === 'keydown' && e.which !== CCConstants.KEY_CODE_ENTER) {
                        return;
                    }

                    // stop event from bubbling to top, i.e. html
                    e.stopPropagation();
                    $(this).popover('show');

                    // toggle the html click handler
                    $html.on('click', widget.cvvHidePopover);
                    $html.on('keydown', widget.cvvHidePopover);

                    popOver.off('click');
                    popOver.off('keydown');
                };

                widget.cvvHidePopover = function (e) {
                    var popOver = $('.cvvPopover');
                    var $html = $('html');
                    // if keydown, rather than click, check its the escape key
                    if (e.type === 'keydown' && e.which !== CCConstants.KEY_CODE_ESCAPE) {
                        return;
                    }

                    popOver.popover('hide');

                    popOver.on('click', widget.cvvShowPopover);
                    popOver.on('keydown', widget.cvvShowPopover);

                    $html.off('click');
                    $html.off('keydown');

                    popOver.focus();
                };

                order.paymentDetails().selectedCardType.subscribe(function (newValue) {
                    if (order.paymentDetails()) {
                        if (!newValue || newValue === '') {
                            order.paymentDetails().cardType(undefined);
                            return;
                        }
                        for (var i = 0; i < order.paymentDetails().cardTypeList().length; i++) {
                            if (order.paymentDetails().cardTypeList()[i].value === order.paymentDetails().selectedCardType()) {
                                // set acard type to pass on
                                order.paymentDetails().cardType(order.paymentDetails().cardTypeList()[i].value);

                                // set validation fields
                                order.paymentDetails().cardIINPattern(order.paymentDetails().cardTypeList()[i].iin);
                                order.paymentDetails().cardNumberLength(order.paymentDetails().cardTypeList()[i].length);
                                order.paymentDetails().cvvLength(order.paymentDetails().cardTypeList()[i].cvvLength);
                                order.paymentDetails().startDateRequired(order.paymentDetails().cardTypeList()[i].startDateRequired);
                                break;
                            }
                        }
                        // The changing of the card type needs to force a re-validation of the card number so that we can
                        // decide whether or not to perform a pricing operation in order to pick up any IIN-based promotions.
                        // This happens primarily when the card number itself changes, but we don't do the pricing call
                        // when the card number is invalid. So, for example, if someone selects visa then enters a mastercard number
                        // we won't do the pricing call as the card number is invalid. If they then choose mastercard we need
                        // to re-evaluate the card number to see if we should now do the pricing operation.
                        order.paymentDetails().cardNumber.valueHasMutated();
                    }
                });

                widget.selectFromList = function (value, listObs, targetObs) {
                    if (!value || value === '') {
                        targetObs(undefined);
                        return;
                    }
                    for (var i = 0; i < listObs().length; i++) {
                        if (listObs()[i].value === value) {
                            targetObs(value);
                            break;
                        }
                    }
                };

                order.paymentDetails().selectedEndMonth.subscribe(function (newValue) {
                    if (order.paymentDetails()) {
                        widget.selectFromList(newValue, order.paymentDetails().monthList, order.paymentDetails().endMonth);
                    }
                });

                order.paymentDetails().selectedEndYear.subscribe(function (newValue) {
                    if (order.paymentDetails()) {
                        widget.selectFromList(newValue, order.paymentDetails().endYearList, order.paymentDetails().endYear);
                    }
                });

                // Initialise values
                // Must be done before adding validation rules
                widget.getEndYears();
            }


        };
    }
);
