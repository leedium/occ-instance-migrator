/**
 * @fileoverview paymentViewModel Class
 */
/*global define */
define(

    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['jquery', 'knockout', 'ccLogger', 'ccRestClient', 'ccConstants'],

    //-------------------------------------------------------------------
    // MODULE DEFINITION
    //-------------------------------------------------------------------
    function ($, ko, CCLogger, CCRestClient, CCConstants) {

        'use strict';
        //------------------------------------------------------------------
        // Class definition & member variables
        //------------------------------------------------------------------

        function paymentViewModel() {
            if (paymentViewModel.singleInstance) {
                throw new Error("Cannot instantiate more than one paymentViewModel, use getInstance()");
            }

            var self = this;
            self.TestField = ko.observable(); 

            // payment type selected
            self.paymentType = ko.observable(); 

            // cash payment details
            self.bankSelected = ko.observable(); 

            // terms payments details
            self.statementsOption = ko.observable(); 
            self.statementsAccountNumber = ko.observable(); 
            self.statementsAccountType = ko.observable(); 
            
            // ThankYou
            self.isThankTerms = ko.observable(); 
            self.isThankYou = ko.observable(); 
            self.isCollectDocs = ko.observable(); 
            self.isCheckoutReady = ko.observable(false); 
            self.isShippingBlocked = ko.observable(false); 

            self.test = ko.observable(); 

            // Constants
            self.PAYMENT_TYPE_TERMS = 'terms'; //considered terms
            self.PAYMENT_TYPE_CARD = 'card'; //considered cash
            self.PAYMENT_TYPE_EFT = 'eft'; //considered cash
            self.PAYMENT_TYPE_DEPOSIT = 'deposit'; //considered cash
            self.PAYMENT_TYPE_EASYPAY = 'easypay'; //considered cash

            self.CART_MIXED_INVALID = -1;
            self.CART_EMPTY = 0;
            self.CART_CASH = 1;
            self.CART_TERMS = 2;

            self.useGenericPaymentGateway = ko.computed(function () {
                return self.paymentType() !== self.PAYMENT_TYPE_CARD;
            }, self);

            self.paymentData = ko.computed(function () {
                var customProperties = {
                    'paymentType' : self.paymentType(),
                    'bankSelected' : self.bankSelected(),
                    'statementsOption' : self.statementsOption(),
                    'statementsAccountNumber' : self.statementsAccountNumber(),
                    'statementsAccountType' : self.statementsAccountType()
                };
                
                return  JSON.stringify({
                    'type': 'generic',
                    'customProperties' : customProperties
                });
            }, self);
            
        };


        /**
         * Return the single instance of paymentViewModel. Create it if it doesn't exist.
         *
         * @function
         * @name paymentViewModel.getInstance()
         * @return {paymentViewModel} Singleton instance.
         */
        paymentViewModel.getInstance = function () {
            if (!paymentViewModel.singleInstance) {
                paymentViewModel.singleInstance = new paymentViewModel();
            }
            return paymentViewModel.singleInstance;
        };

        return paymentViewModel;
    }
);


