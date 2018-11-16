/**
 * @project
 * @file blockingOvercommit.js
 * @company homechoice
 * @createdBy donaldArcher
 * @contact donald.archer
 * @dateCreated 28/07/2018
 * @description @donald, please add a description here
**/


define(
    [
        'knockout',
        'jquery',
        'pubsub',
        'notifier',
        'navigation',
        'ccConstants',
        'ccRestClient',
        'pageLayout/product',
        'ccStoreConfiguration',
        'ccResourceLoader!global/hc.cart.dynamicproperties.app'
    ],

    function (
        ko,
        $,
        pubsub,
        navigation,
        navigator,
        CCConstants,
        CCRestClient,
        Product,
        CCStoreConfiguration,
        cartDynamicPropertiesApp
    ) {

        var _widget;

        var moduleObj = {
            elementName: "hcBlockingOvercommit",
            BlockingTitle: ko.observable(''),
            BlockingText: ko.observable(''),
            ShowBlocking: ko.observable(false),
            CartSize: ko.observable(''),
            paymentType: ko.observable(''),

            /**
             * Runs when widget is instantiated
             */
            onLoad: function (widget) {
                var self = this;
                widget.init = function () {
                    widget.ShowBlocking(false);
                    
                    //  Wait for the dynamic cart controller to be 'ready'
                    cartDynamicPropertiesApp.ready(widget, function (hcCheckoutController) {
                        var blocking = hcCheckoutController.checkOverCommit();
                        if (widget.cart().allItems().length != 0) {
                            if (blocking.showBlocking()) {
                                widget.ShowBlocking(true);
                                widget.BlockingTitle(blocking.blockingTitle());
                                widget.BlockingText(blocking.blockingText());
                            }
                        }
                        if (widget.pageContext().pageType.name === "cart") {
                            $.Topic('CART_PAGE_BLOCKING_OVERCOMMIT').publish(
                                {blocked: widget.ShowBlocking()}
                            );
                            
                            $.Topic(pubsub.topicNames.CART_UPDATED).subscribe(function () {
                                widget.onMixedCartUpdate(hcCheckoutController.isMixedCart());
        
                            });
                            
                            $.Topic('IS_MIXED_CART').subscribe(function (data) {
                                widget.onMixedCartUpdate(data);
                            });
                            
                            widget.onMixedCartUpdate = function (cartSummaryObject) {
                                widget.paymentType(cartSummaryObject.paymentType);
                            };
                        }
                        if (widget.pageContext().pageType.name === "checkout") {
                            if (widget.ShowBlocking()) {
                                //navigation.goTo("cart"); 
                                //This is broken since update, no clue why, 
                                //reverting back to old redirect 
                                document.location.href = '/cart';
                            }
                        }
                    }, self);
                };

                $.Topic(pubsub.topicNames.CART_REMOVE).subscribe(function (obj) {
                    widget.init();
                });
                $.Topic(pubsub.topicNames.CART_UPDATED).subscribe(function (obj) {
                    widget.init();
                });
                
                
                widget.cart().allItems.subscribe(function (item) {
                    if (widget.pageContext().pageType.name !== "checkout") { //prevents strange error when cart items change...
                        widget.init();
                    }
                });
                
                widget.onMixedCartUpdate = function (cartSummaryObject) {
                    widget.paymentType(cartSummaryObject.paymentType);
                };
            },

            onMixedCartUpdate: function (cartSummaryObject) {
                widget.paymentType(cartSummaryObject.paymentType);
            },

            beforeAppear: function () {
                cartDynamicPropertiesApp.ready(this, function (hcCartController) {
                    try{
                        this.onMixedCartUpdate(hcCartController.isMixedCart());
                    }catch(x){}
                 });
                 
                this.init();
            }
        };
        return moduleObj;
    }
);
