define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
		"use strict";

        var MODULE_NAME = 'hc-footer';

        return {
            formSubmitted: ko.observable(false),
            /**
             * Runs when widget is instantiated
             */
            onLoad: function() {
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function() {
            },

            /**
             * This will piggy back off the custom "onRender" binding
             * defined on an element in the template
             */
            onRender: function(element, context) {
            },

            /**
             * There is currently no validation on the live site so this will just accept
             * a valid email and will process accordingly
             */
            onEmailSignup: function (formElement) {
                var emailAddress = $(formElement).find('#email').val();
                var self = this;
                $.ajax({
                    type: 'POST',
                    xhrFields: {
                        withCredentials: false
                    },
                    // url: 'https://www.pages03.net/homechoice/hcWebsite_Signup/Website_Signup?Email='+emailAddress+'&formSourceName=StandardForm&sp_exp=yes&NameSource_Campaign=Website_Signup',
                    url: this.endpointUrl().replace('$EMAIL_ADDRESS',emailAddress),
                    processData:false
                }).done(function (data) {
                    self.formSubmitted(true);
                }).fail(function( jqXHR, textStatus, errorThrown ) {
                    self.formSubmitted(true);
                });
            }
        };
    }

);