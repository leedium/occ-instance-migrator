define(['jquery', 'knockout', 'storageApi', 'pubsub', 'ccConstants', 'spinner', 'pageLayout/product', 'ccRestClient', 'ccLogger', 'CCi18n', 'ccNumber', 'currencyHelper'],

    function ($, ko, storageApi, pubsub, ccConstants, spinner, Product, ccRestClient, ccLogger, CCi18n, ccNumber, currencyHelper) {
        'use strict';
        return {
            onLoad: function(e) {
                //51 Degrees - Find Device Details!
                // https://51degrees.com
                //U: Donald_Homechoice
                //E: darcher@homechoice.co.za
                //P: DonHome101

                var self = this;
                var xmlhttp = new XMLHttpRequest();
                var key = "5DUAAAJHNAAASAWADJAGAWWGAUBZA7VRSLM499LUMXCF3TY2RALUHCFAQUBNVZYHEY65GDD64G42AHZM27QVDSD"
                var ua = window.navigator.userAgent;
                var url = ("https://cloud.51degrees.com/api/v1/"+key+"/match?user-agent="+ua+"");

                xmlhttp.onreadystatechange = function(){
                    if ( xmlhttp.readyState == 4 && xmlhttp.status == 200){
                        var match = JSON.parse(xmlhttp.responseText);
                        var text = "";
                        // console.log('51degrees', match, ua);
                        //TODO: Save this Data somewhere, and use it for rules.
                        window.deviceDetectionResult = match;
                        self.addAttributes();
                    }
                };
                xmlhttp.open("GET", url, true);
                xmlhttp.send();

            },

            /**
             * add devcie sp
             */
            addAttributes: function() {
                var html = document.getElementById('oracle-cc');
                $(html).attr({
                    'browser-name': window.deviceDetectionResult.Values.BrowserName[0],
                    'browser-version': window.deviceDetectionResult.Values.BrowserVersion[0],
                    'device-type': window.deviceDetectionResult.Values.DeviceType[0],
                    'device-orientation': window.deviceDetectionResult.Values.DeviceOrientation[0],
                    'is-mobile': window.deviceDetectionResult.Values.IsMobile[0],
                    'is-small-screen': window.deviceDetectionResult.Values.IsSmallScreen[0],
                    'is-smart-phone': window.deviceDetectionResult.Values.IsSmartPhone[0],
                    'is-smart-watch': window.deviceDetectionResult.Values.IsSmartWatch[0],
                    'is-tablet': window.deviceDetectionResult.Values.IsTablet[0],
                    'is-touch': window.deviceDetectionResult.Values.TouchEvents[0]
                });
            }
        }
    }
);
