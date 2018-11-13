/**
 * @fileoverview Checkout Address Book Widget.
 */
/*global $ */
/*global define */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    [
        'knockout',
        'jquery',
        'viewModels/address',
        'ccConstants',
        'pubsub',
        'koValidate',
        'notifier',
        'ccKoValidateRules',
        'storeKoExtensions',
        'spinner',
        'navigation',
        'storageApi',
        'CCi18n',
        'ccRestClient',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app',
        'ccResourceLoader!global/profile.checkout.controller',
        'ccResourceLoader!global/hc.ui.functions'
    ],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------

    function (
        ko,
        $,
        Address,
        CCConstants,
        pubsub,
        koValidate,
        notifier,
        rules,
        storeKoExtensions,
        spinner,
        navigation,
        storageApi,
        CCi18n,
        CCRestClient,
        cartDynamicPropertiesApp,
        hcCheckoutController,
        hcUIFunctions) {

        "use strict";
        var VISIBLE_STATE = 'cash_terms';


        return {
            visibleState: VISIBLE_STATE,
            cartProps: null,
            WIDGET_ID: "profileDeliveryAddress",
            useAsBillAddress: ko.observable(true),
            displayUseAsBillAddress: ko.observable(),
            isViewVisible: ko.observable(false),
            isUsingSavedAddress: ko.observable(false),
            isSelectingAddress: ko.observable(false),
            billingAddressEnabled: ko.observable(),
            addressSetAfterWebCheckout: ko.observable(false),
            addressSetAfterOrderLoad: ko.observable(false),
            showPreviousAddressInvalidError: ko.observable(false),
            previousSelectedCountryValid: ko.observable(false),
            shippingAddressBook: ko.observableArray().extend({deferred: true}),
            loadPersistedShipping: ko.observable(false),
            cityValue: ko.observable(''),
            shippingAddressIndicator: '#shippingAddress',
            shippingAddressIndicatorOptions: {
                parent: '#shippingAddress',
                posTop: '50px',
                posLeft: '30%'
            },

            /**
             * Repopulate this form with up to date info from the User view model.
             */
            reloadAddressInfo: function () {
                var widget = this;

                if (widget.shippingCountriesPriceListGroup().length == 0) {
                    widget.destroySpinner();
                    $.Topic(pubsub.topicNames.NO_SHIPPING_METHODS).publish();
                }

                // If there are no billing countries disable all the fields of billing address
                if (!widget.billingCountries().length) {
                    $('#billingAddress').attr('disabled', 'disabled');
                }

                widget.isUsingSavedAddress(false);

                $('#CC-addressBook-picker').on('shown.bs.modal', function () {
                    $('#CC-addressBook-picker :focusable').first().focus();
                });

                $('#CC-addressBook-picker').on('hide.bs.modal', function () {
                    $('#cc-checkout-show-address-book').focus();
                });

                // Should always use registered shopper's saved shipping address book if set
                var eventToFire = pubsub.topicNames.VERIFY_SHIPPING_METHODS;
                if (widget.user().loggedIn() === true && widget.user().updatedShippingAddressBook && widget.user().updatedShippingAddressBook.length > 0) {
                    var shippingAddresses = [];
                    var shippingAddressesAll = [];
                    for (var k = 0; k < widget.user().updatedShippingAddressBook.length; k++) {
                        var shippingAddress = new Address('user-saved-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry());
                        shippingAddress.countriesList(widget.shippingCountriesPriceListGroup());
                        shippingAddress.copyFrom(widget.user().updatedShippingAddressBook[k], widget.shippingCountriesPriceListGroup());
                        // Save shipping address JS object to Address object.
                        shippingAddress.resetModified();

                        shippingAddress.selectedCountry.subscribe(function (newValue) {
                            widget.checkIfSelectedShipCountryInBillCountries();
                        });
                        if (shippingAddress.isValid()) {
                            shippingAddresses.push(shippingAddress);
                        }
                        if (shippingAddress.isDefaultAddress() && !widget.addressSetAfterWebCheckout() &&
                            !widget.addressSetAfterOrderLoad() && shippingAddress.isValid()) {
                            widget.order().shippingAddress().copyFrom(shippingAddress.toJSON(), widget.shippingCountriesPriceListGroup());
                            widget.notifyListenersOfShippingAddressPhoneNumberUpdate();
                        }
                        widget.addressSetAfterWebCheckout(false);
                        widget.addressSetAfterOrderLoad(false);

                        // Preserve existing logic to save all the addresses to user().shippingAddressBook, irrespective of their validness
                        var shippingAddressValidOrInValid = new Address('user-saved-shipping-address', widget.ErrorMsg, widget, widget.shippingCountries(), widget.defaultShippingCountry());
                        shippingAddressValidOrInValid.countriesList(widget.shippingCountries());
                        shippingAddressValidOrInValid.copyFrom(widget.user().updatedShippingAddressBook[k], widget.shippingCountries());
                        shippingAddressesAll.push(shippingAddressValidOrInValid);
                    }
                    widget.shippingAddressBook(shippingAddresses);
                    widget.user().shippingAddressBook(shippingAddressesAll);
                    widget.user().resetShippingAddressBookModified();

                    // There shouldn't be a case where no default address was set.
                    if (!widget.order().shippingAddress().isValid() && widget.shippingAddressBook()[0]) {
                        widget.order().shippingAddress().copyFrom(widget.shippingAddressBook()[0].toJSON(), widget.shippingCountriesPriceListGroup());
                        widget.order().updateShippingAddress.bind(widget.order().shippingAddress())();
                        widget.notifyListenersOfShippingAddressPhoneNumberUpdate();
                    }

                    eventToFire = pubsub.topicNames.POPULATE_SHIPPING_METHODS;
                    if (!widget.order().isPaypalVerified() && shippingAddresses.length > 0) {
                        widget.isUsingSavedAddress(true);
                    }
                    //If the user has all invalid addresses then set the cart address if present
                    if (!widget.order().shippingAddress().isValid() && widget.cart().shippingAddress()) {
                        var shippingAddress = new Address('cart-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry());
                        shippingAddress.countriesList(widget.shippingCountriesPriceListGroup());
                        // Save shipping address JS object to Address object.
                        shippingAddress.copyFrom(widget.cart().shippingAddress().toJSON(), widget.shippingCountriesPriceListGroup());
                        shippingAddress.resetModified();
                        widget.order().shippingAddress().copyFrom(shippingAddress.toJSON(), widget.shippingCountriesPriceListGroup());
                        widget.notifyListenersOfShippingAddressPhoneNumberUpdate();
                    }
                }

                // Otherwise If the cart shipping address is already set, then use this
                else if (widget.cart().shippingAddress()) {
                    widget.order().shippingAddress().copyFrom(widget.cart().shippingAddress().toJSON(), widget.shippingCountriesPriceListGroup());
                    widget.notifyListenersOfShippingAddressPhoneNumberUpdate();
                }
                widget.checkIfSelectedShipCountryInBillCountries();
            },

            removeSelectedCountryRegion: function () {
                storageApi.getInstance().removeItem("selectedCountryRegion");
            },

            initResourceDependents: function () {
                var widget = this;

                // Message to be displayed in the Message Panel if an error occurs
                widget.ErrorMsg = widget.translate('checkoutErrorMsg');

                widget.order().billingAddress.extend({
                    propertyWatch: widget.order().billingAddress()
                });
                widget.order().shippingAddress.extend({
                    propertyWatch: widget.order().shippingAddress()
                });

                widget.order().billingAddress(new Address('checkout-billing-address', widget.ErrorMsg, widget, widget.billingCountries(), widget.defaultBillingCountry()));
                $.Topic(pubsub.topicNames.BILLING_ADDRESS_POPULATED).publishWith([{message: "success"}]);
                widget.order().shippingAddress(new Address('checkout-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry()));
                $.Topic(pubsub.topicNames.SHIPPING_ADDRESS_POPULATED).publishWith([{message: "success"}]);

                /**
                 * @function
                 * @name isValid
                 * Determine whether or not the current widget object is valid
                 * based on the validity of its component parts. This will not
                 * cause error messages to be displayed for any observable values
                 * that are unchanged and have never received focus on the
                 * related form field(s).
                 * @return boolean result of validity test
                 */
                widget.isValid = ko.computed(function () {
                    if (widget.order().isPaypalVerified()) {
                        return widget.order().shippingAddress().isValid();
                    } else {
                        return (widget.order().billingAddress().isValid() && widget.order().shippingAddress().isValid());
                    }
                });

                /**
                 * @function
                 * @name validateNow
                 * Force all relevant member observables to perform their
                 * validation now & display the errors (if any)
                 */
                widget.validateNow = function () {
                    // call order methods to generate correct
                    // error messages, if required.
                    widget.order().billingAddress().firstName(widget.user().firstName());
                    widget.order().billingAddress().lastName(widget.user().lastName());
                    widget.order().validateBillingAddress();
                    widget.order().validateShippingAddress();
                    return (widget.isValid());
                };

                /**
                 * Callback function for use in widget stacks.
                 * Triggers internal widget validation.
                 * @return true if we think we are OK, false o/w.
                 */
                widget.validate = function () {
                    // Shipping address is valid and being used as the billing address so copy it.
                    if (widget.order().shippingAddress().isValid() && widget.useAsBillAddress() === true) {
                        widget.order().shippingAddress().copyTo(widget.order().billingAddress());
                    }

                    return widget.validateNow();
                };

                widget.showShippingAddressSelection = function () {
                    $('#CC-addressBook-picker').modal('show');
                };

                widget.hideShippingAddressSelection = function () {
                    $('#CC-addressBook-picker').modal('hide');
                };

                widget.selectShippingAddress = function (addr) {
                    widget.isUsingSavedAddress(true);
                    widget.order().shippingAddress().copyFrom(addr.toJSON(), widget.shippingCountriesPriceListGroup());
                    widget.hideShippingAddressSelection();
                    widget.checkIfSelectedShipCountryInBillCountries();
                };


                widget.useAsBillAddress.subscribe(function (newValue) {
                    if (widget.useAsBillAddress() === true) {
                        // Need to clear any validation errors specific to the
                        // billing address fields, prior to resetting it.
                        widget.order().shippingAddress().copyTo(widget.order().billingAddress());

                    } else {
                        widget.order().billingAddress().reset();
                        widget.order().billingAddress().resetModified();

                        if (widget.order().shippingAddress().isValid()) {
                            // CC requires Phone Number in Billing Address
                            // but ATG requires it in the Shipping Address
                            widget.order().billingAddress().phoneNumber(widget.order().shippingAddress().phoneNumber());
                        }

                        // Need to inform interested parties that any previous
                        // billing address is no longer current
                        $.Topic(pubsub.topicNames.CHECKOUT_BILLING_ADDRESS).publishWith(
                            widget.order().billingAddress(), [{
                                message: "success"
                            }]);
                    }
                });

                widget.order().shippingAddress().selectedCountry.subscribe(function (newValue) {
                    widget.checkIfSelectedShipCountryInBillCountries();
                    if (widget.useAsBillAddress() === true) {
                        widget.order().billingAddress().selectedCountry(widget.order().shippingAddress().selectedCountry());
                    }
                });

                widget.order().shippingAddress.hasChanged.subscribe(function (hasChanged) {
                    if (hasChanged && widget.order().shippingAddress().isValid()) {
                        // Shipping address has changed and is valid and being used as the billing address so copy it.
                        if (widget.useAsBillAddress() === true) {
                            widget.order().shippingAddress().copyTo(widget.order().billingAddress());
                        }
                    }
                    widget.notifyListenersOfShippingAddressUpdate();
                });

                widget.order().billingAddress.hasChanged.subscribe(function (hasChanged) {
                    if (hasChanged && widget.order().billingAddress().isValid()) {
                        $.Topic(pubsub.topicNames.CHECKOUT_BILLING_ADDRESS).publishWith(
                            widget.order().billingAddress(), [{
                                message: "success"
                            }]);
                    }
                });

                widget.notifyListenersOfShippingAddressUpdate = function () {
                    if (widget.order().shippingAddress().isValid()) {
                        if (widget.useAsBillAddress() === true) {
                            // Need to clear any validation errors specific to the
                            // billing address fields, prior to resetting it.
                            widget.order().shippingAddress().copyTo(widget.order().billingAddress());
                        } else {
                            // CC requires Phone Number in Billing Address
                            // but ATG requires it in the Shipping Address
                            widget.order().billingAddress().phoneNumber(widget.order().shippingAddress().phoneNumber());
                        }

                        if (widget.cart().shippingAddress() == "" || widget.cart().shippingMethod() == "" ||
                            (widget.cart().isShippingAddressChanged(widget.order().shippingAddress().toJSON(), widget.cart().shippingAddress().toJSON())
                                && !widget.loadPersistedShipping())) {
                            widget.order().selectedShippingOption('');
                            $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_UPDATED).publish();
                        } else {
                            widget.loadPersistedShipping(false);
                            var shippingAddressWithProductIDs = {};
                            shippingAddressWithProductIDs[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = widget.order().shippingAddress();
                            shippingAddressWithProductIDs[CCConstants.PRODUCT_IDS_FOR_SHIPPING] = widget.cart().getProductIdsForItemsInCart();
                            widget.cart().shippingAddress(widget.cart().shippingAddress().toJSON());
                            widget.cart().updateShippingAddress.bind(shippingAddressWithProductIDs)();
                        }

                        // Saving selected country and selected region to localStorage
                        var selectedCountryRegion = new Object();
                        selectedCountryRegion.selectedCountry = widget.order().shippingAddress().selectedCountry();
                        selectedCountryRegion.selectedState = widget.order().shippingAddress().selectedState();
                        try {
                            widget.checkPreviousAddressValidity(widget);
                            storageApi.getInstance().setItem("selectedCountryRegion", JSON.stringify(selectedCountryRegion));
                        } catch (pError) {
                        }

                    } else if (widget.order().shippingAddress().validateForShippingMethod()) {
                        // Handle case where address is sufficiently completed to calculate shipping & tax
                        // Ensure that required fields have at least blank values

                        widget.order().shippingAddress().firstName(widget.user().firstName());
                        widget.order().shippingAddress().lastName(widget.user().lastName());

                        // if (widget.order().shippingAddress().firstName() == undefined)
                        //     widget.order().shippingAddress().firstName('');
                        // if (widget.order().shippingAddress().lastName() == undefined)
                        //     widget.order().shippingAddress().lastName('');
                        if (widget.order().shippingAddress().address1() == undefined)
                            widget.order().shippingAddress().address1('');
                        if (widget.order().shippingAddress().city() == undefined)
                            widget.order().shippingAddress().city('');
                        if (widget.order().shippingAddress().phoneNumber() == undefined)
                            widget.order().shippingAddress().phoneNumber('');

                        if (widget.cart().shippingAddress() == "" || widget.cart().shippingMethod() == "" ||
                            widget.cart().isShippingAddressChanged(widget.order().shippingAddress().toJSON(), widget.cart().shippingAddress().toJSON())) {
                            widget.order().selectedShippingOption('');
                            $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_UPDATED).publish();
                        } else {
                            var shippingAddressWithProductIDs = {};
                            shippingAddressWithProductIDs[CCConstants.SHIPPING_ADDRESS_FOR_METHODS] = widget.order().shippingAddress();
                            shippingAddressWithProductIDs[CCConstants.PRODUCT_IDS_FOR_SHIPPING] = widget.cart().getProductIdsForItemsInCart();
                            widget.cart().shippingAddress(widget.cart().shippingAddress().toJSON());
                            widget.cart().updateShippingAddress.bind(shippingAddressWithProductIDs)();
                        }

                        // Saving selected country and selected region to localStorage
                        var selectedCountryRegion = new Object();
                        selectedCountryRegion.selectedCountry = widget.order().shippingAddress().selectedCountry();
                        selectedCountryRegion.selectedState = widget.order().shippingAddress().selectedState();
                        try {
                            widget.checkPreviousAddressValidity(widget);
                            storageApi.getInstance().setItem("selectedCountryRegion", JSON.stringify(selectedCountryRegion));
                        } catch (pError) {
                        }

                    } else if (!widget.order().shippingAddress().isValid()) {
                        if (!widget.cart().shippingMethod() && widget.cart().shipping()) {
                            widget.cart().shipping(0);
                        }
                        $.Topic(pubsub.topicNames.CHECKOUT_SHIPPING_ADDRESS_INVALID).publish();
                    }
                };

                widget.notifyListenersOfShippingAddressPhoneNumberUpdate = function () {
                    if (widget.order().shippingAddress().phoneNumber.isValid()) {
                        widget.order().billingAddress().phoneNumber(widget.order().shippingAddress().phoneNumber());
                    }
                };
            },

            /**
             * Called before the widget appears every time.
             */
            beforeAppear: function () {
                var widget = this;

                // $('#CC-profileDeliveryAddress, #CustomPromotion_v1-wi1200136, #region-re600057, #region-re600098').show();
                //OOTB
                if (widget.cart().shippingMethod()) {
                    widget.loadPersistedShipping(true);
                } else {
                    widget.loadPersistedShipping(false);
                }
                widget.checkPreviousAddressValidity(widget);

                var previousSelectedCountryRegion = null;
                try {
                    previousSelectedCountryRegion = storageApi.getInstance().getItem("selectedCountryRegion");
                    if (previousSelectedCountryRegion && typeof previousSelectedCountryRegion == 'string') {
                        previousSelectedCountryRegion = JSON.parse(previousSelectedCountryRegion);
                    }
                } catch (pError) {
                }
                var c = widget.cart().shippingAddress().validateForShippingMethod;
                if (c == undefined) c = false;
                if (previousSelectedCountryRegion && !widget.showPreviousAddressInvalidError() && (!widget.cart().shippingAddress() || !c)) {
                    widget.order().shippingAddress().selectedCountry(previousSelectedCountryRegion.selectedCountry);
                    widget.order().shippingAddress().selectedState(previousSelectedCountryRegion.selectedState);
                    widget.previousSelectedCountryValid(false);
                } else if (previousSelectedCountryRegion && widget.previousSelectedCountryValid() && widget.showPreviousAddressInvalidError()) {
                    widget.order().shippingAddress().selectedCountry(previousSelectedCountryRegion.selectedCountry);
                    notifier.sendError(widget.typeId(), CCi18n.t('ns.checkoutaddressbook:resources.invalidPreviousAddress'), true);
                    widget.showPreviousAddressInvalidError(false);
                    widget.previousSelectedCountryValid(false);
                }
                else if (widget.showPreviousAddressInvalidError()) {
                    notifier.sendError(widget.typeId(), CCi18n.t('ns.checkoutaddressbook:resources.invalidPreviousAddress'), true);
                    widget.showPreviousAddressInvalidError(false);
                }

                if(widget.order().shippingAddress().isEmpty()){
                    widget.order().shippingAddress().selectedCountry("ZA");
                }

                widget.removeSelectedCountryRegion();

                widget.billingAddressEnabled(widget.order().isPaypalVerified());
                widget.reloadAddressInfo();
                if (widget.order().isPaypalVerified()) {
                    // On successful return from paypal site
                    widget.createSpinner();
                    // Fetches the data to populate the checkout widgets
                    widget.order().getOrder();
                }

                hcCheckoutController.showModule(widget, VISIBLE_STATE, function(ready) {
                    widget.isViewVisible(ready.show);
                });
            },

            // end initResourceDependents
            resourcesLoaded: function (widget) {
                widget.initResourceDependents();
            },

            distSearch: function (widget, search, target) {//'#CC-checkoutAddressBook-scity' '#CC-checkoutAddressBook-szipcode'
                var closeTimeout;
                $(document).on('keyup', search, hcUIFunctions.debounce(function () {
                    clearTimeout(closeTimeout);
                    var TempSearch = $(search).val();
                    if (TempSearch.length >= 3) {
                        var SearchStr = {
                            "SuburbSearchString": TempSearch
                        };
                        $(search).parent().parent().find('.DistrictResults ul').html('<li>Searching...</li>');
                        $(search).parent().parent().find('.DistrictResults').show();
                        var GenerateElem = '';

                        $.ajax({
                            url: "/ccstorex/custom/v1/hc/utility/searchDistricts",
                            method: "POST",
                            timeout: 3000, // sets timeout to 3 seconds
                            contentType: 'application/json',
                            dataType: 'json',
                            data: JSON.stringify(SearchStr),
                            // headers: CCRestClient.previewMode ? {
                            //     "Authorization": "Bearer " + CCRestClient.tokenSecret
                            // } : {}
                        }).done(function (res) {

                            if (res.Districts.length > 0) {

                                //"CountryCode": "string",
                                //"Suburb": "string",
                                //"PostalCode": "string",
                                //"PostalCodeType": "string"


                                for (var index = 0; index < res.Districts.length; index++) {
                                    var element = res.Districts[index];
                                    GenerateElem += '<li ' +
                                        'data-target="' + target + '" ' +
                                        'data-parent="' + search + '" ' +
                                        'data-postal="' + element.PostalCode + '" ' +
                                        'data-suburb="' + element.Suburb + '" ' +
                                        'data-countrycode="' + element.CountryCode + '" ' +

                                        '>Suburb: ' + element.Suburb +
                                        ' (' + element.CountryCode + ')' +
                                        '<br> PostalCode: ' + element.PostalCode +
                                        '</li>';
                                }
                                GenerateElem += '<li data-close="true">Close</li>';
                            }
                            else {
                                GenerateElem += '<li>Unknown</li>';
                                closeTimeout = setTimeout(function () {
                                    $(search).parent().parent().find('.DistrictResults').hide();
                                }, 3000);
                            }
                            $(search).parent().parent().find('.DistrictResults ul').html(GenerateElem);
                            $(search).parent().parent().find('.DistrictResults').show();

                        }).fail(function (jqXHR, textStatus) {
                            GenerateElem += '<li>Unknown</li>';
                            //GenerateElem += '<li data-target="' + target + '" data-postal="123">Suburb: 123'+
                            //    '<br> PostalCode: 123'+
                            //    '</li>';
                            $(search).parent().parent().find('.DistrictResults ul').html(GenerateElem);
                            $(search).parent().parent().find('.DistrictResults').show();
                            closeTimeout = setTimeout(function () {
                                $(search).parent().parent().find('.DistrictResults').hide();
                            }, 2000);
                            console.log('District FAIL', jqXHR, textStatus);
                        });
                        ;
                    } else {
                        $(search).parent().parent().find('.DistrictResults').hide();
                    }
                }, 250));
            },

            /**
             Checkout Customer Details Widget.
             @private
             @name checkout-customer-details
             @property {observable String} checkoutGuest value for the guest checkout radio button
             @property {observable String} checkoutLogin value for the login radio button
             @property {observable String} checkoutOption currently selected checkout option
             @property {observable String} emailAddress Email address entered by user
             @property {observable String} password Either registered or desired user password
             @property {observable String} confirmPassword confirmation of desired password
             @property {observable Boolean} createAccount current value of create account checkbox
             @property {observable Address} billingAddress object representing the customer's
             billing address.
             @property {observable Address} shippingAddress object representing the customer's
             shipping address.
             @property {observable Boolean} useAsBillAddress current value of the checkbox
             indicating whether to use SHipping Addr as Billing Addr
             */
            onLoad: function (widget) {
                $(document).on('click', '.DistrictResults ul li', function () {
                    var target = $(this).data('target');

                    var close = $(this).data('close');
                    if (close != undefined) {
                        $('.DistrictResults').hide();
                    }

                    var suburb = $(this).data('suburb');
                    var parent = $(this).data('parent');
                    var postal = $(this).data('postal');
                    if (postal != undefined) {
                        $(parent).val(suburb).change();
                        $(target).val(postal).change().focus();
                        $('.DistrictResults').hide();
                    }
                });

                $(document).on({
                    click: function () { $('#CC-checkoutAddressBook-blastname').val('Address').change();
                    $('#CC-checkoutAddressBook-bfirstname').val('Billing').change();
                },
                    change: function () { $('#CC-checkoutAddressBook-blastname').val('Address').change();
                    $('#CC-checkoutAddressBook-bfirstname').val('Billing').change();
                },
                    keyup: function () { $('#CC-checkoutAddressBook-blastname').val('Address').change();
                    $('#CC-checkoutAddressBook-bfirstname').val('Billing').change();
                }
                }, '#CC-checkoutAddressBook-baddress1');



                widget.distSearch(widget, '#CC-checkoutAddressBook-scity', '#CC-checkoutAddressBook-szipcode')
                widget.distSearch(widget, '#CC-checkoutAddressBook-bcity', '#CC-checkoutAddressBook-bzipcode')


                //homechoice
                //INTERFACE
                widget.reset = function (checkoutControllerObj) {
                    widget.isViewVisible(false);
                };
                //END INTERFACE

                // $.Topic('prePaymentCheck').subscribe(function(data) {
                //     console.log('subscribe prePaymentCheck');
                //     // Do screen validations
                //     var result = widget.validateNow();
                //     $.Topic(data.callback).publish({'widget': widget.WIDGET_ID, 'result': result, 'previousStep': data.previousStep, 'nextStep': data.nextStep, 'paymentType': data.paymentType});
                // });

                // These are not configuration options
                widget.order().billingAddress.isData = true;
                widget.order().shippingAddress.isData = true;
                widget.useAsBillAddress.isData = true;

                // set form defaults

                widget.resetListener = function (obj) {
                    widget.order().billingAddress().reset();
                    widget.order().shippingAddress().reset();
                    widget.shippingAddressBook([]);
                };

                $.Topic(pubsub.topicNames.ORDER_SUBMISSION_SUCCESS).subscribe(widget.resetListener);
                $.Topic(pubsub.topicNames.LOAD_ORDER_RESET_ADDRESS).subscribe(widget.resetListener);

                //$.Topic("TERMS_PURCHASE").subscribe(widget.isViewVisible(false));


                // Handle user logging in- reload address details whenever the user profile loads shipping info.
                $.Topic(pubsub.topicNames.USER_LOAD_SHIPPING).subscribe(function (obj) {
                    if (navigation.getRelativePath().indexOf(widget.links().profile.route) == -1) {
                        widget.reloadAddressInfo();
                    }

                    if (widget.user().loggedIn() && widget.user().updatedShippingAddress && (widget.cart().items().length > 0)) {
                        var shippingAddress = new Address('user-default-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry());
                        shippingAddress.countriesList(widget.shippingCountriesPriceListGroup());
                        shippingAddress.copyFrom(widget.user().updatedShippingAddress, widget.shippingCountriesPriceListGroup());
                        shippingAddress.resetModified();
                        if (shippingAddress.isValid()) {
                            widget.order().shippingAddress().copyFrom(widget.user().updatedShippingAddress, widget.shippingCountriesPriceListGroup());
                            widget.order().shippingAddress().resetModified();
                            widget.notifyListenersOfShippingAddressPhoneNumberUpdate();
                        }
                    }
                });

                // Handle user logging out and taking their saved addresses with them.
                $.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(function (obj) {
                    widget.resetListener();
                    widget.isUsingSavedAddress(false);
                    widget.removeSelectedCountryRegion();
                });

                $.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(widget.removeSelectedCountryRegion);

                $.Topic(pubsub.topicNames.ORDER_SUBMISSION_SUCCESS).subscribe(widget.removeSelectedCountryRegion);

                widget.destroySpinner = function () {
                    $(widget.shippingAddressIndicator).removeClass('loadingIndicator');
                    spinner.destroyWithoutDelay(widget.shippingAddressIndicator);
                };

                widget.shippingAddressDuringPaypalCheckout = function (paypalShippingAddress) {
                    var shippingAddress = new Address('user-paypal-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry());
                    if (paypalShippingAddress && (widget.cart().items().length > 0) && widget.order().isPaypalVerified()) {
                        // Check if checkout address (without any shipping method) exists in local storage. If exists then ovewrite the PayPal's address with this address
                        var checkoutAddressWithoutShippingMethod = storageApi.getInstance().getItem("checkoutAddressWithoutShippingMethod");
                        if (checkoutAddressWithoutShippingMethod) {
                            paypalShippingAddress = JSON.parse(checkoutAddressWithoutShippingMethod);
                            storageApi.getInstance().removeItem("checkoutAddressWithoutShippingMethod");
                        }
                        // Save shipping address JS object to Address object.
                        shippingAddress.copyFrom(paypalShippingAddress, widget.shippingCountriesPriceListGroup());
                        shippingAddress.resetModified();
                    } else if (widget.user().loggedIn() === true && widget.user().updatedShippingAddress && (widget.cart().items().length > 0)) {
                        // Save shipping address JS object to Address object.
                        shippingAddress.copyFrom(widget.user().updatedShippingAddress, widget.shippingCountriesPriceListGroup());
                        shippingAddress.resetModified();
                    }
                    widget.order().shippingAddress().copyFrom(shippingAddress.toJSON(), widget.shippingCountriesPriceListGroup());
                    widget.cart().shippingAddress(widget.order().shippingAddress());
                    widget.billingAddressEnabled(widget.order().isPaypalVerified());
                    $.Topic(pubsub.topicNames.PAYPAL_SHIPPING_ADDRESS_ALTERED).publish();
                    widget.destroySpinner();
                };

                widget.billingAddressDuringExternalCheckout = function (externalBillingAddress) {
                    var billingAddress = new Address('user-billing-address', widget.ErrorMsg, widget, widget.billingCountries(), widget.defaultBillingCountry());
                    if (externalBillingAddress && (widget.cart().items().length > 0)) {
                        // Save billing address JS object to Address object.
                        widget.useAsBillAddress(false);
                        widget.displayUseAsBillAddress(false);
                        billingAddress.copyFrom(externalBillingAddress, widget.billingCountries());
                        billingAddress.resetModified();
                        widget.order().billingAddress().copyFrom(billingAddress.toJSON(), widget.billingCountries());
                        //if billing country returned by paypal is not listed in the commerce's billing countries
                        if (!billingAddress.isValid() && billingAddress.country() == '' && billingAddress.state() == '') {
                            widget.order().billingAddress().selectedCountry(externalBillingAddress.country);
                            widget.order().billingAddress().selectedState(externalBillingAddress.state);
                        }
                    }
                    widget.destroySpinner();
                };
                $.Topic(pubsub.topicNames.PAYPAL_CHECKOUT_SHIPPING_ADDRESS).subscribe(widget.shippingAddressDuringPaypalCheckout.bind(this));
                $.Topic(pubsub.topicNames.EXTERNAL_CHECKOUT_BILLING_ADDRESS).subscribe(widget.billingAddressDuringExternalCheckout.bind(this));

                widget.shippingAddressDuringWebCheckout = function (webShippingAddress) {
                    var shippingAddress = new Address('user-web-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry());
                    if (webShippingAddress && (widget.cart().items().length > 0)) {
                        // Save shipping address JS object to Address object.
                        shippingAddress.copyFrom(webShippingAddress, widget.shippingCountriesPriceListGroup());
                        shippingAddress.resetModified();
                    }
                    widget.order().shippingAddress().copyFrom(shippingAddress.toJSON(), widget.shippingCountriesPriceListGroup());
                    widget.addressSetAfterWebCheckout(true);
                    widget.destroySpinner();
                };

                $.Topic(pubsub.topicNames.WEB_CHECKOUT_SHIPPING_ADDRESS).subscribe(widget.shippingAddressDuringWebCheckout.bind(this));

                widget.shippingAddressDuringLoadOrder = function (loadOrderShippingAddress) {
                    var shippingAddress = new Address('loaded-order-shipping-address', widget.ErrorMsg, widget, widget.shippingCountriesPriceListGroup(), widget.defaultShippingCountry());
                    if (loadOrderShippingAddress && (widget.cart().items().length > 0)) {
                        // Save shipping address JS object to Address object.
                        shippingAddress.copyFrom(loadOrderShippingAddress, widget.shippingCountriesPriceListGroup());
                        shippingAddress.resetModified();
                    }
                    widget.order().shippingAddress().copyFrom(shippingAddress.toJSON(), widget.shippingCountriesPriceListGroup());
                    widget.addressSetAfterOrderLoad(true);
                    widget.destroySpinner();
                };

                $.Topic(pubsub.topicNames.LOADED_ORDER_SHIPPING_ADDRESS).subscribe(widget.shippingAddressDuringLoadOrder.bind(this));


                $.Topic(pubsub.topicNames.USER_SESSION_EXPIRED).subscribe(function () {
                    widget.isUsingSavedAddress(false);
                });

                $.Topic(pubsub.topicNames.GET_INITIAL_ORDER_FAIL).subscribe(function () {
                    widget.billingAddressEnabled(widget.order().isPaypalVerified());
                    widget.destroySpinner();
                    widget.checkIfSelectedShipCountryInBillCountries();
                });

                widget.createSpinner = function () {
                    $(widget.shippingAddressIndicator).css('position', 'relative');
                    $(widget.shippingAddressIndicator).addClass('loadingIndicator');
                    spinner.create(widget.shippingAddressIndicatorOptions);
                };

                widget.handleAddNewShippingAddress = function () {
                    widget.order().shippingAddress().reset();
                    widget.order().shippingAddress().resetModified();
                    widget.isUsingSavedAddress(false);
                    $('#CC-checkoutAddressBook-sfirstname').focus();
                    widget.checkIfSelectedShipCountryInBillCountries();
                    $.Topic(pubsub.topicNames.ADD_NEW_CHECKOUT_SHIPPING_ADDRESS).publish();

                    widget.order().shippingAddress().selectedCountry("ZA");
                };

                widget.checkIfSelectedShipCountryInBillCountries = function () {
                    //If the selected shipping country is not in the billing country list, hide the checkbox,
                    //and show the billing address. If the selected country is in the billing country list,
                    //then, show the checkbox, and hide the billing address
                    if (widget.billingCountries()) {
                        var selectedShipCountryInBillCountries = false;
                        for (var i = 0; i < widget.billingCountries().length; i++) {
                            if (widget.order().shippingAddress().selectedCountry() === widget.billingCountries()[i].countryCode) {
                                selectedShipCountryInBillCountries = true;
                                break;
                            }
                        }
                        if (!selectedShipCountryInBillCountries || widget.order().isPaypalVerified()) {
                            widget.useAsBillAddress(false);
                            widget.displayUseAsBillAddress(false);
                        } else {
                            if (widget.order().billingAddress().isEmpty() || widget.order().billingAddress().compare(widget.order().shippingAddress()))
                                widget.useAsBillAddress(true);
                            else
                                widget.useAsBillAddress(false);
                            widget.displayUseAsBillAddress(true);
                        }
                    } else {
                        widget.useAsBillAddress(true);
                        widget.displayUseAsBillAddress(true);
                    }
                };
                widget.displayInvalidBillingAddressText = function () {
                    return !widget.billingAddressEnabled() && !widget.displayUseAsBillAddress()
                        && ko.isObservable(widget.order) && ko.isObservable(widget.order().shippingAddress) && widget.order().shippingAddress()
                        && ko.unwrap(widget.order().shippingAddress().country) !== '';
                };
            },
            checkPreviousAddressValidity: function (widget) {
                var previousSelectedCountryRegion = null;
                try {
                    previousSelectedCountryRegion = storageApi.getInstance().getItem("selectedCountryRegion");
                    if (previousSelectedCountryRegion && typeof previousSelectedCountryRegion == 'string') {
                        previousSelectedCountryRegion = JSON.parse(previousSelectedCountryRegion);
                    }
                }
                catch (pError) {
                }
                if (previousSelectedCountryRegion) {
                    var shippingCountries = widget.shippingCountriesPriceListGroup();
                    for (var k = 0; k < shippingCountries.length; k++) {
                        if (previousSelectedCountryRegion.selectedCountry === shippingCountries[k].countryCode) {
                            widget.previousSelectedCountryValid(true);
                            var regions = shippingCountries[k].regions;
                            // Its valid for a country to 0 regions.
                            if (regions.length === 0 && previousSelectedCountryRegion.selectedState === "") {
                                break;
                            }
                            for (var j = 0; j < regions.length; j++) {
                                if (previousSelectedCountryRegion.selectedState === regions[j].abbreviation) {
                                    break;
                                }
                            }
                            if (j < regions.length) {
                                break;
                            }
                        }
                    }
                    if (k === shippingCountries.length) {
                        //show error message that previously entered shipping address is now not valid and clear local storage
                        notifier.clearError(widget.typeId());
                        widget.showPreviousAddressInvalidError(true);
                    } else {
                        widget.showPreviousAddressInvalidError(false);
                    }
                }
            }
        };
    }
);
