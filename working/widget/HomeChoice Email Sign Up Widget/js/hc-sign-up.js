define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
		"use strict";

        var MODULE_NAME = 'hc-footer';

        return {
            formSubmitted: ko.observable(false),
            errorMessage: ko.observable(''),
            /**
             * Runs when widget is instantiated
             */
            onLoad: function(widget) {  
                $(window).resize(
                  function() {
                      if (widget.isCompactVersion() == false) {
                        //console.log("isCompactVersion: " + widget.isCompactVersion());
                    	if ($(window).width() < 992) {
                    		//$("[id*=sign-up-id]").children().removeClass('expanded');
                    		$(".hc-email").children().removeClass('expanded');
                    	} else {
                    		//$("[id*=sign-up-id]").children().addClass('expanded');
                    		$(".hc-email").children().addClass('expanded');
                    	}
                      }
                });
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
            validateEmail: function(email) {
                var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/; 
                return re.test(String(email).toLowerCase());
            },

            onEmailSignup: function (formElement) {
                var self = this;
                this.errorMessage('');
                var emailAddress = $(formElement).find('#email1').val();
                $(formElement).find('#email').removeClass('error');
                $('.EmailTXTBlock').attr('style', 'padding-bottom: 25px;');

                if(emailAddress == '' || emailAddress == undefined){
                    this.errorMessage('Email address is required');
                    $(formElement).find('#email').addClass('error');
                    $('.EmailTXTBlock').attr('style', 'padding-bottom: 25px;');
                }
                else{
                    var res = this.validateEmail(emailAddress);
                    if(!res){
                        this.errorMessage('Invalid email address');
                        $(formElement).find('#email').addClass('error');
                        $('.EmailTXTBlock').attr('style', 'padding-bottom: 25px;');
                    }
                    else{
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
                }

            }
        };
    }

);