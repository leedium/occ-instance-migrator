define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'ccResourceLoader!global/hc.ui.functions', 'https://unpkg.com/imask@4.1.0/dist/imask.min.js', 'https://unpkg.com/moment@2.22.2/moment.js'],

    function (ko, $, pubsub, notifier, ccConstants, ccRestClient, hcUIFunctions, imask, moment) {
        "use strict";

        var MODULE_NAME = "requestCatalogueForm";
        var NAMES_MIN_LENGTH = 3;
        var AGE_MIN_ALLOWED = 18;
        var ID_TYPE_SA = "RSAIdentityNumber";
        var ID_TYPE_PASSPORT = "PassportNumber";
        var ID_TYPE_FOREIGN = "ForeignIDNumber";
        var COUNTRY_CODE_SA = 1;
        var cellphoneMaxLength = 10;

        return {
            title: ko.observable('Mrs'),
            firstName: ko.observable(null),
            surname: ko.observable(null),
            idType: ko.observable(ID_TYPE_SA),
            idTypeLabelText: ko.observable(null),
            idNumber: ko.observable(null),
            birthday: ko.observable(null),
            cellphoneNumberCode: ko.observable(1),
            cellphoneNumber: ko.observable(null),
            cellphoneNumberExample: ko.observable(null),
            emailAddress: ko.observable(null),
            ShippingCountriesTOTAL: ko.observable(),
            ShippingCountries: ko.observable([
                { country: "LOADING!", code: "..." }
            ]),
            ShippingCountryRegion: ko.observable([]),
            selectedCountry: ko.observable('ZA'),
            selectedRegion: ko.observable(''),
            streetAddress: ko.observable(null),
            suburb: ko.observable(null),
            postalCode: ko.observable(null),

            // Validation flags
            firstNameMissing: ko.observable(false),
            firstNameInvalidLength: ko.observable(false),
            surnameMissing: ko.observable(false),
            surnameInvalidLength: ko.observable(false),
            surnameContainsNoVowel: ko.observable(false),
            idNumberMissing: ko.observable(false),
            birthdayMissing: ko.observable(false),
            birthdayVisible: ko.observable(false),
            userUnderAge: ko.observable(false),
            userUnderAgeId: ko.observable(false),
            cellphoneNumberMissing: ko.observable(false),
            cellphoneNumberInvalidLength: ko.observable(false),
            emailAddressMissing: ko.observable(false),
            streetAddressMissing: ko.observable(false),
            suburbMissing: ko.observable(false),
            postalCodeMissing: ko.observable(false),

            disqualifyUser: ko.observable(false),

            formValid: ko.observable(false),
            formSubmitSuccessful: ko.observable(false),

            /**
             * Runs when widget is instantiated
             */
            onLoad: function (widget) {

                ccRestClient.request("getShippingCountries", {},
                    function (data) {
                        widget.ShippingCountriesDoStuffs(data);
                    },
                    function (data) {
                        console.log('Error getShippingCountries', data);
                    }
                );

                widget.ShippingCountriesDoStuffs = function (data) {
                    widget.ShippingCountryRegion([]);
                    widget.selectedRegion('');


                    widget.ShippingCountriesTOTAL(data);
                    var tempArr = [];
                    for (var i = 0; i < data.length; i++) {
                        var element = data[i];
                        tempArr.push({ country: element.country.displayName, code: element.country.repositoryId });
                    }
                    widget.ShippingCountries(tempArr);
                    widget.selectedCountry('ZA');
                };

                widget.selectedCountry.subscribe(function (newValue) {
                    var tempArr = [];
                    if (widget.ShippingCountriesTOTAL() != undefined) {
                        for (var i = 0; i < widget.ShippingCountriesTOTAL().length; i++) {
                            var element = widget.ShippingCountriesTOTAL()[i];
                            if (element.country.repositoryId == newValue) {
                                for (var j = 0; j < element.regions.length; j++) {
                                    var jelement = element.regions[j];
                                    tempArr.push({ Region: jelement.displayName, code: jelement.abbreviation });
                                }

                            }
                        }
                        widget.ShippingCountryRegion(tempArr);
                        widget.selectedRegion('');
                    }
                });

                widget.ShippingCountriesDoStuffs = function (data) {
                    widget.ShippingCountryRegion([]);
                    widget.selectedRegion('');


                    widget.ShippingCountriesTOTAL(data);
                    var tempArr = [];
                    for (var i = 0; i < data.length; i++) {
                        var element = data[i];
                        tempArr.push({ country: element.country.displayName, code: element.country.repositoryId });
                    }
                    widget.ShippingCountries(tempArr);
                    widget.selectedCountry('ZA');
                };

                this.distSearch(widget, '#suburb', '#postalCode');

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

                widget.reset = function () {
                    widget.firstName(null);
                    widget.surname(null);
                    widget.idType(ID_TYPE_SA);
                    widget.idNumber(null);
                    widget.birthday(null);
                    widget.cellphoneNumberCode(1),
                    widget.cellphoneNumber(null);
                    widget.emailAddress(null);
                    widget.streetAddress(null);
                    widget.selectedCountry('ZA');
                    widget.selectedRegion('');
                    widget.suburb(null);
                    widget.postalCode(null);
                    widget.formValid(false);

                    widget.firstNameMissing(false);
                    widget.firstNameInvalidLength(false);
                    widget.surnameMissing(false);
                    widget.surnameInvalidLength(false);
                    widget.idNumberMissing(false);
                    widget.birthdayMissing(false);
                    widget.birthdayVisible(false);
                    widget.userUnderAge(false);
                    widget.userUnderAgeId(false),
                    widget.cellphoneNumberMissing(false);
                    widget.cellphoneNumberInvalidLength(false);
                    widget.emailAddressMissing(false);
                    widget.streetAddressMissing(false);
                    widget.suburbMissing(false);
                    widget.postalCodeMissing(false);

                    widget.disqualifyUser(false);
                    widget.formSubmitSuccessful(false);
                };

                // First name validations
                widget.validateFirstName = function (widget, event) {
                    widget.firstNameMissing(false);
                    widget.firstNameInvalidLength(false);

                    function isFirstNameMissing() {
                        widget.firstName() === null || widget.firstName() === "" ? widget.firstNameMissing(true) : widget.firstNameMissing(false);
                    }

                    function isFirstNameInvalidLength() {
                        widget.firstName().length < NAMES_MIN_LENGTH ? widget.firstNameInvalidLength(true) : widget.firstNameInvalidLength(false);
                    }

                    isFirstNameMissing();

                    if (!widget.firstNameMissing()) {
                        isFirstNameInvalidLength();
                    }
                };

                // Surname validations
                widget.validateSurname = function (widget, event) {
                    widget.surnameMissing(false);
                    widget.surnameInvalidLength(false);
                    widget.surnameContainsNoVowel(false);

                    function isSurnameMissing() {
                        widget.surname() === null || widget.surname() === "" ? widget.surnameMissing(true) : widget.surnameMissing(false);
                    }

                    function isSurnameInvalidLength() {
                        widget.surname().length < NAMES_MIN_LENGTH ? widget.surnameInvalidLength(true) : widget.surnameInvalidLength(false);
                    }

                    function surnameContainsVowel() {
                        var vowelRegex = new RegExp(/[aeiou]/g, 'i');
                        var containsVowel = vowelRegex.test(widget.surname());

                        containsVowel ? widget.surnameContainsNoVowel(false) : widget.surnameContainsNoVowel(true);
                    }

                    isSurnameMissing();

                    if (!widget.surnameMissing()) {
                        isSurnameInvalidLength();
                    }

                    if (!widget.surnameMissing() && !widget.surnameInvalidLength()) {
                        surnameContainsVowel();
                    }
                };

                // ID type selection change
                widget.idTypeChange = function (selectedVal) {
                    var idNumberLabelText = "";
                    var idNumber = $("#idNumber");
                    var inputType = "tel";

                    // Reset fields and flags
                    widget.idNumber(null);
                    widget.birthday(null);
                    widget.idNumberMissing(false);
                    widget.userUnderAge(false);
                    widget.userUnderAgeId(false);

                    if (selectedVal === ID_TYPE_SA) {
                        idNumberLabelText = widget.translate("idNumberLabel");
                        widget.birthdayVisible(false);
                    } else {
                        inputType = "text";
                        widget.birthdayVisible(true);

                        if (selectedVal === ID_TYPE_PASSPORT) {
                            idNumberLabelText = widget.translate("idNumberPassportLabel");
                        }

                        if (selectedVal === ID_TYPE_FOREIGN) {
                            idNumberLabelText = widget.translate("idNumberForeignLabel");
                        }
                    }

                    widget.idTypeLabelText(idNumberLabelText);
                    idNumber.attr("type", inputType);
                    widget.idType(selectedVal);
                };

                // ID number validations
                widget.validateIdNumber = function (widget, event) {
                    widget.idNumberMissing(false);

                    function isIdNumberMissing() {
                        (widget.idNumber() === null || widget.idNumber() === "") ? widget.idNumberMissing(true) : widget.idNumberMissing(false);
                    }

                    function isValidSAID(idNo) {
                        var i, c,
                            even = '',
                            sum = 0,
                            check = idNo.slice(-1);

                        if (idNo.length != 13 || idNo.match(/\D/)) {
                            return false;
                        }

                        idNo = idNo.substr(0, idNo.length - 1);
                        for (i = 0; c = idNo.charAt(i); i += 2) {
                            sum += +c;
                            even += idNo.charAt(i + 1);
                        }
                        even = '' + even * 2;
                        for (i = 0; c = even.charAt(i); i++) {
                            sum += +c;
                        }
                        sum = 10 - ('' + sum).charAt(1);
                        return ('' + sum).slice(-1) == check;
                    }

                    isIdNumberMissing();

                    if (widget.idNumberMissing() !== true) {
                        if (widget.idType() === ID_TYPE_SA) {
                            if (isValidSAID(widget.idNumber())) {
                                widget.idNumberMissing(false);
                                calculateBirthdayFromSAId(widget.idNumber());
                                widget.checkIfUnderage(widget);
                            } else {
                                widget.idNumberMissing(true);
                            }
                        }
                    }

                    function calculateBirthdayFromSAId(idNoDob) {
                        var digitsToExtract = 2;
                        var day = idNoDob.substr(4, digitsToExtract);
                        var month = idNoDob.substr(2, digitsToExtract);
                        var year = parseInt(idNoDob.substr(0, digitsToExtract), 10);
                        var currentYear = (new Date()).getFullYear() % 2000;

                        if (year > currentYear) {
                            year = 1900 + year;
                        }
                        else {
                            year = 2000 + year;
                        }

                        widget.birthday(day + "/" + month + "/" + year);
                    }
                };

                // Birthday validations
                widget.validateBirthday = function (widget, event) {
                    widget.birthdayMissing(false);

                    function isBirthdayMissing() {
                        (widget.birthday() === null || widget.birthday() === "") ? widget.birthdayMissing(true) : widget.birthdayMissing(false);
                    }

                    isBirthdayMissing();

                    widget.checkIfUnderage(widget);
                };

                widget.checkIfUnderage = function (widget) {
                    var day = widget.birthday().substr(0, 2);
                    var month = widget.birthday().substr(3, 2);
                    var year = widget.birthday().substr(6);
                    var bDay = new Date();

                    bDay.setTime(0);
                    bDay.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));

                    console.log('User DOB: ', widget.birthday(), " | Birthday generated: ", bDay);

                    var userAge = calculateAge(bDay);
                    console.log("Age: ", userAge);

                    if (userAge < AGE_MIN_ALLOWED) {
                        widget.idType() === ID_TYPE_SA ? widget.userUnderAgeId(true) : widget.userUnderAge(true);
                    } else {
                        widget.userUnderAge(false);
                        widget.userUnderAgeId(false);
                    }

                    function calculateAge(birthday) {
                        var ageDiffMs = Date.now() - birthday.getTime();
                        var ageDate = new Date(ageDiffMs); // miliseconds from epoch
                        return Math.abs(ageDate.getUTCFullYear() - 1970);
                    }
                };

                // Cellphone number code selection change
                widget.cellphoneCodeChange = function (obj, event) {
                    var selectedIndex = event.delegateTarget.options.selectedIndex;
                    var selectedIndexValue = event.delegateTarget.options[selectedIndex].value;
                    var cellphoneNumber = document.getElementById("cellphoneNumber");
                    var mobilePattern = "";
                    var exampleMsg = "(e.g. ";
                    var maxLength = "";

                    switch (selectedIndexValue) {
                        case "1":
                            mobilePattern = new RegExp("^[0-9]{9}$|^(0)([0-9]{9})$");
                            maxLength = 10;
                            exampleMsg += "0812345678";
                            break;
                        case "2":
                        case "3":
                        case "8":
                            mobilePattern = new RegExp("^[0-9]{8}$");
                            maxLength = 8;
                            exampleMsg += "71123456";
                            break;
                        case "4":
                            mobilePattern = new RegExp("^[0-9]{9,10}$");
                            maxLength = 10;
                            exampleMsg += "0811234567";
                            break;
                        case "14":
                            mobilePattern = new RegExp("^[0-9]{9}$");
                            maxLength = 9;
                            exampleMsg += "951234567";
                            break;
                        default:
                            mobilePattern = new RegExp("^[0-9]{9}$|^(0)([0-9]{9})$");
                            maxLength = 10;
                            exampleMsg += "0812345678";
                    }

                    cellphoneNumber.setAttribute("pattern", mobilePattern.source);
                    cellphoneNumber.setAttribute("maxlength", maxLength);
                    widget.cellphoneNumberExample(exampleMsg + ")");
                    cellphoneMaxLength = maxLength;

                    if (widget.cellphoneNumberMissing() !== false) {
                        widget.validateCellphoneNumber(widget, event);
                    }
                };

                // Cellphone number validations
                widget.validateCellphoneNumber = function (widget, event) {
                    widget.cellphoneNumberMissing(false);
                    widget.cellphoneNumberInvalidLength(false);

                    function isCellphoneNumberMissing() {
                        widget.cellphoneNumber() === null || widget.cellphoneNumber() === "" ? widget.cellphoneNumberMissing(true) : widget.cellphoneNumberMissing(false);
                    }

                    function isCellphoneNumberInvalidLength() {
                        $('#cellphoneNumber')[0].validity.patternMismatch ? widget.cellphoneNumberInvalidLength(true) : widget.cellphoneNumberInvalidLength(false);
                    }

                    isCellphoneNumberMissing();

                    if (!widget.cellphoneNumberMissing()) {
                        isCellphoneNumberInvalidLength();
                    }
                };

                // Email address validations
                widget.validateEmailAddress = function (widget, event) {
                    widget.emailAddressMissing(false);

                    function isEmailAddressMissing() {
                        widget.emailAddress() === null || widget.emailAddress() === "" || $('#emailAddress')[0].validity.typeMismatch ? widget.emailAddressMissing(true) : widget.emailAddressMissing(false);
                    }

                    isEmailAddressMissing();
                };

                // Street address validations
                widget.validateStreetAddress = function (widget, event) {
                    widget.streetAddressMissing(false);

                    function isStreetAddressMissing() {
                        widget.streetAddress() === null || widget.streetAddress() === "" ? widget.streetAddressMissing(true) : widget.streetAddressMissing(false);
                    }

                    isStreetAddressMissing();
                };

                // Suburb validations
                widget.validateSuburb = function (widget, event) {
                    widget.suburbMissing(false);

                    function isSuburbMissing() {
                        (widget.suburb() === null || widget.suburb() === "") ? widget.suburbMissing(true) : widget.suburbMissing(false);
                    }

                    isSuburbMissing();
                };

                // Postal code validations
                widget.validatePostalCode = function (widget, event) {
                    widget.postalCodeMissing(false);

                    function isPostalCodeMissing() {
                        (widget.postalCode() === null || widget.postalCode() === "") ? widget.postalCodeMissing(true) : widget.postalCodeMissing(false);
                    }

                    isPostalCodeMissing();
                };

                // Validate entire form
                widget.validateForm = function () {
                    var formValid = true;

                    if (widget.firstName() === null) {
                        widget.firstNameMissing(true);
                    } else {
                        widget.firstNameMissing(false);
                    }

                    if (widget.surname() === null) {
                        widget.surnameMissing(true);
                    } else {
                        widget.surnameMissing(false);
                    }

                    if (widget.idNumber() === null) {
                        widget.idNumberMissing(true);
                    } else {
                        widget.idNumberMissing(false);
                    }

                    if (widget.birthday() === null) {
                        widget.birthdayMissing(true);
                    } else {
                        widget.birthdayMissing(false);
                    }

                    if (widget.cellphoneNumber() === null) {
                        widget.cellphoneNumberMissing(true);
                    } else {
                        widget.cellphoneNumberMissing(false);
                    }

                    if (widget.emailAddress() === null) {
                        widget.emailAddressMissing(true);
                    } else {
                        widget.emailAddressMissing(false);
                    }

                    if (widget.streetAddress() === null) {
                        widget.streetAddressMissing(true);
                    } else {
                        widget.streetAddressMissing(false);
                    }

                    if (widget.suburb() === null) {
                        widget.suburbMissing(true);
                    } else {
                        widget.suburbMissing(false);
                    }

                    if (widget.postalCode() === null) {
                        widget.postalCodeMissing(true);
                    } else {
                        widget.postalCodeMissing(false);
                    }

                    formValid = formValid &&
                        (!widget.firstNameMissing() &&
                            !widget.firstNameInvalidLength() &&
                            !widget.surnameMissing() &&
                            !widget.surnameInvalidLength() &&
                            !widget.idNumberMissing() &&
                            !widget.birthdayMissing() &&
                            !widget.userUnderAge() &&
                            !widget.userUnderAgeId() &&
                            !widget.cellphoneNumberMissing() &&
                            !widget.cellphoneNumberInvalidLength() &&
                            !widget.emailAddressMissing() &&
                            !widget.streetAddressMissing() &&
                            !widget.suburbMissing() &&
                            !widget.postalCodeMissing());

                    widget.formValid(formValid);

                    return formValid;
                };

                // Form submission handling
                widget.formSubmit = function (obj, event) {
                    if (widget.validateForm()) {
                        widget.postFormRequest();
                    } else {
                        notifier.sendError(widget.WIDGET_ID, widget.translate("formSubmitHasErrors"), true);
                    }
                };

                widget.postFormRequest = function () {

                    // Optional leading zero (0) for SA cellphone number
                    if (widget.cellphoneNumberCode() == COUNTRY_CODE_SA) {
                        if (widget.cellphoneNumber().length == 9) {
                            widget.cellphoneNumber('0' + widget.cellphoneNumber());
                        }
                    }
                     
                    widget.formSubmitSuccessful(true);

                    notifier.sendSuccess(widget.WIDGET_ID, "Catalogue request submitted.");

                    var classSelector = ".request-catalogue-thank-you";

                    if (typeof $(classSelector).first().offset() !== 'undefined') {
                        $('html, body').animate({
                            scrollTop: $(classSelector)[0].offsetTop + 800
                        }, 1000);
                    }

                    // For demo purposes to output what data will be sent

                    console.log("Submitted Information");
                    console.log("=====================");

                    console.table({
                        "Title": widget.title(),
                        "First Name": widget.firstName(),
                        "Surname": widget.surname(),
                        "ID Type": widget.idType(),
                        "IDNumber": widget.idNumber(),
                        "Birthday": widget.birthday(),
                        "Cellphone Number Code": widget.cellphoneNumberCode(),
                        "Cellphone Number": widget.cellphoneNumber(),
                        "Email Address": widget.emailAddress(),
                        "Delivery Country": widget.selectedCountry(),
                        "Province/Region": widget.selectedRegion(),
                        "Street Address": widget.streetAddress(),
                        "Suburb": widget.suburb(),
                        "Postal Code": widget.postalCode()
                    });

                    //var data = {
                    //    "employmentCompanyName": widget.workName(),
                    //    "employmentContactNumber": widget.workPhone(),
                    //    "employmentStatus": widget.employmentStatus(),
                    //    "netIncome": widget.netMonthlyIncome(),
                    //    "extraIncome": widget.additionalMonthlyIncome(),
                    //    "grossMonthlyIncome": widget.grossMonthlyIncome(),
                    //    "totalExpenses": widget.totalLivingExpenses()
                    //};

                    //$.Topic(constants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST).publish({
                    //    widget: widget,
                    //    data: data
                    //});
                };
            },

            maskDate: function () {
                var currentDate = new Date(Date.now());
                var currentYear = currentDate.getUTCFullYear();

                var momentFormat = 'DD/MM/YYYY';
                var momentMask = new IMask(
                    document.getElementById('birthday'), {
                        mask: Date,
                        pattern: momentFormat,
                        lazy: false,
                        min: new Date(1800, 0, 1),
                        max: new Date(currentYear, 11, 31),

                        format: function (date) {
                            return momentJS.moment(date).format(momentFormat);
                        },
                        parse: function (str) {
                            return momentJS.moment(str, momentFormat);
                        },

                        blocks: {
                            YYYY: {
                                mask: IMask.MaskedRange,
                                from: 1800,
                                to: currentYear
                            },
                            MM: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 12
                            },
                            DD: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 31
                            }
                        }
                    }
                );
            },


            distSearch: function (widget, search, target) {
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
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                var widget = this;

                widget.idTypeChange(ID_TYPE_SA);
                $("#cellphoneNumberCode").trigger('change');

                $(document).ready(function () {

                    $(document).on('keydown', '#idNumber, #cellphoneNumber', function (e) {
                        var currentInput = e.currentTarget.id;

                        // Allow: backspace, tab, escape, enter and delete
                        if ($.inArray(e.keyCode, [8, 9, 27, 13, 46]) !== -1 ||
                            // Allow: Ctrl+A,Ctrl+C,Ctrl+V,Ctrl+Z, Command+A
                            (e.keyCode == 65 || e.keyCode == 86 || e.keyCode == 67 || e.keyCode == 90) && (e.ctrlKey === true || e.metaKey === true) ||
                            // Allow: home, end, left, right, down, up
                            e.keyCode >= 35 && e.keyCode <= 40) {
                            return; // let it happen, don't do anything
                        }

                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                            if (currentInput == "idNumber" && widget.idType() !== ID_TYPE_SA) {
                                return;
                            }
                            e.preventDefault();
                        }
                    });

                    $(document).on('keydown', '#firstName, #surname', function (e) {
                        if ($.inArray(e.keyCode, [8, 9, 27, 13, 32, 46]) !== -1 ||
                            (e.keyCode == 65 || e.keyCode == 86 || e.keyCode == 67 || e.keyCode == 90) && (e.ctrlKey === true || e.metaKey === true) ||
                            e.keyCode >= 35 && e.keyCode <= 40) {
                            return;
                        }

                        // Ensure that it is a letter and stop the keypress
                        if (e.keyCode < 65 || e.keyCode > 90) {
                            e.preventDefault();
                        }
                    });

                });

                // Date masking
                var currentDate = new Date(Date.now());
                var currentYear = currentDate.getUTCFullYear();

                var momentFormat = 'DD/MM/YYYY';
                var momentMask = new IMask(
                    document.getElementById('birthday'), {
                        mask: Date,
                        pattern: momentFormat,
                        lazy: false,
                        min: new Date(1800, 0, 1),
                        max: new Date(currentYear, 11, 31),

                        format: function (date) {
                            return moment(date).format(momentFormat);
                        },
                        parse: function (str) {
                            return moment(str, momentFormat);
                        },

                        blocks: {
                            YYYY: {
                                mask: IMask.MaskedRange,
                                from: 1800,
                                to: currentYear
                            },
                            MM: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 12
                            },
                            DD: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 31
                            }
                        }
                    }
                );
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function (element, context) {
                $('[data-toggle=popover]').popover();
            }
        };
    }
);