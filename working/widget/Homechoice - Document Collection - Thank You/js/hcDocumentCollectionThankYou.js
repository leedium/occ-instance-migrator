define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration', 'pageLayout/site', 'ccResourceLoader!global/hc.ui.paymentViewModel', 'navigation'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, SiteViewModel, paymentViewModel, navigation) {

        var MODULE_NAME = 'hc-DocumentCollection-thankyou';
        var OTHER = "other";
        var noBank = "no";
        
        var moduleObj = {

            /**
             * Runs when widget is instantiated
             */
            isInited: false,
            isTerms: ko.observable(true),
            
            isCreditCard: ko.observable(false),
            isEFT: ko.observable(false),
            isDEP: ko.observable(false),
            PersonNo: ko.observable(''),

            bank_absa: ko.observable(false),
            bank_fnb: ko.observable(false),
            bank_standard: ko.observable(false),
            bank_other: ko.observable(false),

            OrderId: ko.observable(false),

            isDocCollect: ko.observable(false),
            termsBank: ko.observable(''),
            termsBankClickDisabled: ko.observable(true),
            paymentVM: paymentViewModel.getInstance(),
            showError: ko.observable(false),

            onLoad: function (widget) {
                    //cart is now clear so now we need to check items in completed order, can't re-use old cart code.

                widget.SaveBankAndContinue = function () {
                    console.log('setBank MOVE!', widget);
                    widget.showError(false);
                    navigation.goTo('/document-collection', false, true);
                };

                widget.SaveBankShowError = function () {
                    console.log('setBank ERRR!', widget);
                    widget.showError(true);
                };

                widget.termsBankClick = function () {
                    console.log('setBank', widget.termsBank());
                    widget.showError(false);
                    widget.paymentVM.statementsOption(widget.termsBank());
                    widget.termsBankClickDisabled(false);
                    return true;
                };
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
                var widget = this;
                
                try{
                    if (widget.cart().contextData.page.confirmation) {
                        var items = [];
                        if (widget.cart().contextData.page.confirmation.shoppingCart) {
                            items = widget.cart().contextData.page.confirmation.shoppingCart.items;

                            for (var index = 0; index < items.length; index++) {
                                var element = items[index];
                                for (var i = 0; i < element.dynamicProperties.length; i++) {
                                    var dp = element.dynamicProperties[i];
                                    
                                    if(dp.id == "hcPaymentOption"){
                                        if(dp.value == null)//cash
                                        {
                                            widget.isTerms(false);
                                        }
                                        else if(dp.value != "terms")//cash
                                        {
                                            widget.isTerms(false);
                                        }
                                        else{
                                            //terms, now look for user Group 4
                                            for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                                                var customerGroup =  widget.user().dynamicProperties()[i];
                                                if(customerGroup.id() == "customerGroup")
                                                {
                                                    //won't work on ccadmin, only in ccstore.
                                                    if(customerGroup.value() != undefined){
                                                        if(customerGroup.value() == 4){
                                                            widget.isDocCollect(true);
                                                        }
                                                        if(customerGroup.value() == 5){
                                                            if(widget.cart().contextData.page.confirmation.shippingAddress.country == "ZA")
                                                            {
                                                                widget.isDocCollect(true);
                                                            }
                                                        }
                                                    }
                                                    break; //Break out once found.
                                                }
                                            }

                                        }
                                        break; //Break out once found.
                                    }
                                }
                                break; //no mixed, only need to check 1st product
                            }
                        }
                    }

                   
                    
            }catch(x){}

            //Override for test only
            //widget.isTerms(true);
            //widget.isDocCollect(true);
            
            widget.paymentVM.isThankYou(true);
            widget.paymentVM.isThankTerms(false);

            widget.OrderId(widget.cart().contextData.page.confirmation.id.replace('o',''));

            //widget.paymentVM.isCollectDocs(true);
            if(widget.isTerms())
            {
                widget.paymentVM.isThankTerms(true);
                if(widget.isDocCollect()){
                    widget.paymentVM.isCollectDocs(true);
                }
                else{
                    widget.paymentVM.isCollectDocs(false);
                }
            }else
            {
                widget.paymentVM.isCollectDocs(false);

                widget.isCreditCard(false);
                widget.isEFT(false);
                widget.isDEP(false);

                for (var i = 0; i < widget.cart().contextData.page.confirmation.dynamicProperties.length; i++) {
                    var ConfDP =  widget.cart().contextData.page.confirmation.dynamicProperties[i];
                    if(ConfDP.id == "hcPersonNo")
                    {
                        //won't work on ccadmin, only in ccstore.
                        if(ConfDP.value != undefined){
                            if((ConfDP.value + "").indexOf("Credit Card") >= 0){
                                widget.isCreditCard(true);
                            } else if((ConfDP.value + "").indexOf("eft") >= 0){
                                widget.isEFT(true);
                            } else {
                                widget.isDEP(true);
                            }
                            widget.PersonNo((ConfDP.value + "").split('|')[2]);

                            if((ConfDP.value + "").indexOf("bank_absa") >= 0){
                                widget.bank_absa(true);
                            } else if((ConfDP.value + "").indexOf("bank_fnb") >= 0){
                                widget.bank_fnb(true);
                            } else if((ConfDP.value + "").indexOf("bank_standard") >= 0){
                                widget.bank_standard(true);
                            } else {
                                widget.bank_other(true);
                            }                          
                               
                        }
                        break; //Break out once found.
                    }
                }


            }
            

            }

        };

        return moduleObj;
    }
);