define(['knockout', 'jquery', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient', 'pageLayout/product', 'ccStoreConfiguration', 'pageLayout/site', 'ccResourceLoader!global/hc.ui.paymentViewModel'],

    function (ko, $, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration, SiteViewModel, paymentViewModel) {

        var MODULE_NAME = 'hc-DocumentCollection-ArticlePage';
// To force login
// Direct link to page
// https://ccadmin-test-zbba.oracleoutsourcing.com/document-collection?loggedIn=false&page=%2Fdocument-collection
        var moduleObj = {
            paymentVM: paymentViewModel.getInstance(),
            isDocCollectBox: ko.observable(false),
            BankOption: ko.observable(''),
            BankText: ko.observable(''),
            BankType: ko.observable(''),
            BankDONE: ko.observable(false),
            errorMessage: ko.observable(''),
            
            /**
             * Runs when widget is instantiated
             */
            isInited: false,

            onLoad: function (widget) {
                //Override for test only
                //widget.paymentVM.statementsOption('nedbank')

                console.log('DocumentCollection-ArticlePage', widget)

                widget.BankOption(widget.paymentVM.statementsOption());

                if(
                    (widget.paymentVM.statementsOption() == 'nedbank')||
                    (widget.paymentVM.statementsOption() == 'standard')||
                    (widget.paymentVM.statementsOption() == 'absa')||
                    (widget.paymentVM.statementsOption() == undefined)
                ){
                    if (widget.user().loggedIn()) {
                        widget.isDocCollectBox(true)
                    }
                }
                
                widget.paymentVM.isThankYou(false);
                widget.paymentVM.isCollectDocs(false);

                
                widget.checkFields = function () {
                    $('.errorMessage').hide();
                    $('.errorMessage1').hide();
                }

                widget.CollectDocs = function () {
                    var _widget = widget;
                    console.log('Doc Collect Update Doc', _widget);

                    
                    $('.errorMessage').hide();
                    $('.errorMessage1').hide();
                    $('.errorMessage2').hide();

                    console.log('BankOption',_widget.BankOption() , ( _widget.BankOption() == ''), ( _widget.BankOption() === ''));
                    if(( _widget.BankOption() == '')){
                        this.errorMessage('Please select a Bank');
                        $('.errorMessage1').show();
                    }
                    else
                    {
                        var res = this.validateAccount(_widget.BankText());
                        if(!res){
                            this.errorMessage('Bank account number length must be between 6 and 20 characters');
                            $('.errorMessage').show();
                        }
                        else{
                            if(( _widget.BankType() == '')){
                                this.errorMessage('Please select an Account Type');
                                $('.errorMessage2').show();
                            }
                            else
                            {

                                var hcPersonNo = 'unknown';
                                for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                                    var dp_hcPersonNo =  widget.user().dynamicProperties()[i];
                                    if(dp_hcPersonNo.id() == "hcPersonNo")
                                    {
                                        if(dp_hcPersonNo.value() != undefined){
                                            hcPersonNo = dp_hcPersonNo.value();
                                        }
                                        break;
                                    }
                                }

                                var absa = 632005;
                                var standard = 051001;
                                var nedbank = 198765;
                                var SubmitCode = '';
                                var bankID = 0;
                                if(widget.BankOption() == 'absa'){
                                    SubmitCode = absa;
                                    bankID = 1;
                                } 
                                else if(widget.BankOption() == 'standard'){
                                    SubmitCode = standard;
                                    bankID = 2;
                                } 
                                else if(widget.BankOption() == 'nedbank'){
                                    SubmitCode = nedbank;
                                    bankID = 3;
                                }
                                //BankAcctType	Descrip
                                //1	Savings
                                //2	Cheque Account
                                var BankTypeId = 1;
                                if(widget.BankType() == "cheque") {BankTypeId = 2;}

                                var bankData = {
                                    //"userID" : widget.user().id(), //3827526
                                    "HCPersonNo" : hcPersonNo, //hc person number from profile.
                                    "Bank" : bankID, //nedbank / standard / absa / any other they wish to add
                                    "AccountNumber" : widget.BankText(), //number between 6 and 20
                                    "AccountType" : BankTypeId, //savings or cheque
                                    "BranchCode" : SubmitCode //632005
                                }

                                //console.log('bank Output', bankData);

                                //comment out once SSE is working.
                                widget.BankDONE(true);


                                $.ajax({
                                    url: "/ccstorex/custom/v1/hc/customer/shopperDEA",
                                    method: "POST",
                                    contentType: 'application/json',
                                    dataType: 'json',
                                    data: JSON.stringify(bankData),
                                    headers: {
                                        'hc-env': CCRestClient.previewMode,
                                        "Authorization": "Bearer " + CCRestClient.tokenSecret
                                    }
                                }).done(function (val) {
                                    console.log('Shopper DEA', val);
                                    widget.BankDONE(true);
                                });

                                console.log('Shopper DEA - Here');
                            }
                        }
                    }
                };


            },
            validateAccount: function(acc) {
                var re = /^[0-9]{6,20}$/; 
                return re.test(String(acc));
            },

            /**
             * Runs each time widget appears on the page
             */
            beforeAppear: function () {
             
            }

        };

        return moduleObj;
    }
);