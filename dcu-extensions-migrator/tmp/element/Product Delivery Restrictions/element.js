define(['knockout', 
'viewModels/address',

'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration', 'ccResourceLoader!global/hc.cart.dynamicproperties.app',
'ccResourceLoader!global/hc.ui.functions'
],

    function (ko, 
        Address,

        $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, cartDynamicPropertiesApp,
        hcUIFunctions) {

        var _widget;
        var self ;

        var moduleObj = {
            isAppropriateProduct: ko.observable(false),
            isLoggedIn: ko.observable(false),
            ShippingCountriesTOTAL: ko.observable(),
            ShippingCountries: ko.observable([
                {country: "LOADING!", code: "..."}
            ]),
            ShippingCountryRegion: ko.observable([]),
            Message: ko.observable('Checking delivery options...'),
            elementName: "pdpPODelRest",
            selectedCountry: ko.observable('ZA'),
            selectedRegion: ko.observable(''),
            addressLine1Text: ko.observable(''),
            addressLine2Text: ko.observable(''),
            cityText: ko.observable(''),
            zipCodeText: ko.observable(''),
            testResults: ko.observable(''),
            

            testNewAddress: function(){
                
                self.testResults('Checking delivery options...');

                var dWrapper = self.doDeliveryCheckObject(
                    _widget.selectedSku().listPrice, 
                    _widget.selectedSku().repositoryId, 
                    {
                        "country": self.selectedCountry(),
                        "lastName": "",
                        "address3": "",
                        "city": self.cityText(),
                        "address2": self.addressLine2Text(),
                        "prefix": "",
                        "address1": self.addressLine1Text(),
                        "postalCode": self.zipCodeText(),
                        "jobTitle": "",
                        "companyName": "",
                        "county": "",
                        "suffix": "",
                        "firstName": "",
                        "phoneNumber": "",
                        "repositoryId": "",
                        "faxNumber": "",
                        "middleName": "",
                        "state": self.selectedRegion(),
                    });


                    $.ajax({
                        type: 'POST',
                        contentType: "application/json",
                        dataType: 'json',
                        url: "/ccstorex/custom/v1/hc/utility/calculateCashDeliveryFee",
                        data: dWrapper,
                        headers: {
                            'hc-env': CCRestClient.previewMode,
                            "Authorization": "Bearer " + CCRestClient.tokenSecret
                        },
                        success: function (data) {
                            self.isLoggedIn(true);

                            if (data.shippingMethods[0].taxcode == "can-ship") {
                                self.testResults('<div class="DeliverRestrictions" style="font-size: 14px;text-align:left;"><div class="DeliverRestrictionsHead">We deliver to your address.</div></div>');
                            } else {
                                self.testResults('<div class="DeliverRestrictions" style="font-size: 14px;text-align:left;"><div class="DeliverRestrictionsHead">Sorry. Unfortunately you do not qualify for home delivery.</div>Alternatively, try another address.</div>');
                            }

                        },
                        error: function (x) {
                            console.log('calculateCashDeliveryFee 2 Error', x);
                            self.testResults('Something went wrong, please try again later.');
                        }
                    });


            },

            doDeliveryCheckObject: function(listPrice, repositoryId, contactShippingAddress){
                var itemz = [];
                itemz.push({
                    'amount': listPrice,
                    'product': {
                        'length': '',
                        'width': '',
                        'weight': '',
                        'shippingSurcharge': '',
                        'id': '',
                        'taxCode': '',
                        'height': ''
                    },
                    'quantity': 1,
                    'rawTotalPrice': listPrice,
                    'discount': '0',
                    'catalogRefId': repositoryId
                })
                var dRequest = {
                    'orderDiscount': 0,
                    'rawOrderTotal': listPrice,
                    'orderTotal': listPrice,
                    'currencyCode': "ZAR",
                    'items': itemz,
                    'address': contactShippingAddress,
                    'locale': {
                        "language": "en",
                        "displayName": "English (United States)",
                        "country": "US"
                    },
                    'priceListGroup': dRequest
                };
                var dWrapper = JSON.stringify({
                    'request': dRequest
                });
                return dWrapper;
            },
            
            onLoad: function (widget) {

                self = this;
                _widget = widget;
                self.isAppropriateProduct(false);



                //check if in cat
                for (var i = 0; i < _widget.product().parentCategories().length; i++) {
                    var element = _widget.product().parentCategories()[i];

                    if (
                        (element.id() == 'bedroom-furniture') ||
                        (element.id() == 'baby-kids-furniture') ||
                        (element.id() == 'dining-room-furniture') ||
                        (element.id() == 'kitchen-furniture') ||
                        (element.id() == 'lounge-furniture')
                    ) {

                        self.isAppropriateProduct(true);

                        if (_widget.user().loggedIn()){

                            //now check if has shipping address
                            if (widget.user().contactShippingAddress == null) {
                                self.Message('To see if we deliver to you, <a href="/profile">Click here</a> to add your address');
                            } else {

                                var dWrapper = self.doDeliveryCheckObject(
                                    _widget.selectedSku().listPrice, 
                                    _widget.selectedSku().repositoryId, 
                                    _widget.user().contactShippingAddress);


                                    $.ajax({
                                        type: 'POST',
                                        contentType: "application/json",
                                        dataType: 'json',
                                        url: "/ccstorex/custom/v1/hc/utility/calculateCashDeliveryFee",
                                        data: dWrapper,
                                        headers: {
                                            'hc-env': CCRestClient.previewMode,
                                            "Authorization": "Bearer " + CCRestClient.tokenSecret
                                        },
                                        success: function (data) {
                                            self.isLoggedIn(true);

                                            if (data.shippingMethods[0].taxcode == "can-ship") {
                                                self.Message('We deliver to your address in ' + widget.user().contactShippingAddress.city + '. <a href="#" data-toggle="modal" data-target="#modalShippingPOP">Check other locations</a>');
                                            } else {
                                                self.Message('We do not deliver to ' + widget.user().contactShippingAddress.city + '. <a href="#" data-toggle="modal" data-target="#modalShippingPOP">Check other locations</a>');
                                            }

                                        },
                                        error: function (x) {
                                            console.log('calculateCashDeliveryFee Error', x);
                                        }
                                    });





                            }
                            //now check API for shipping


                        }
                        else{
                            self.Message('Login to see if we deliver to you saved address. <a href="#" data-toggle="modal" data-target="#modalShippingPOP">Check other locations</a>');
                        }
                    }
                }



 




                CCRestClient.request("getShippingCountries", { },
                    function(data){
                        widget.ShippingCountriesDoStuffs(data);
                    },
                    function(data){
                        console.log('Error getShippingCountries', data);
                    }
                );
                
                widget.ShippingCountriesDoStuffs = function(data){
                    self.ShippingCountryRegion([]);
                    self.selectedRegion('');


                    self.ShippingCountriesTOTAL(data);
                    var tempArr = [];
                    for (var i = 0; i < data.length; i++) {
                        var element = data[i];
                        tempArr.push({country: element.country.displayName, code: element.country.repositoryId});
                    }
                    self.ShippingCountries(tempArr);
                    self.selectedCountry('ZA');
                };





                self.selectedCountry.subscribe(function(newValue) {
                    var tempArr = [];
                    if(self.ShippingCountriesTOTAL() != undefined){
                        for (var i = 0; i < self.ShippingCountriesTOTAL().length; i++) {
                            var element = self.ShippingCountriesTOTAL()[i];
                            if(element.country.repositoryId == newValue)
                            {
                                for (var j = 0; j < element.regions.length; j++) {
                                    var jelement = element.regions[j];
                                    tempArr.push({Region: jelement.displayName, code: jelement.abbreviation});
                                }
    
                            }
                        }
                        self.ShippingCountryRegion(tempArr);
                        self.selectedRegion('');
                    }
                 });
                  

                 this.distSearch(widget, '#CC-checkoutAddressBook-scity', '#CC-checkoutAddressBook-szipcode')
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


        };

        return moduleObj;
    }
);