
window.dataLayer = window.dataLayer || [];
//Donald Archer


                    
define(
    ['jquery', 'knockout', 'pubsub', 'ccLogger', 'ccRestClient', 'ccConstants'],

    function ($, ko, pubsub, CCLogger, CCRestClient, CCConstants) {
        'use strict';

        return {
            onLoad: function (widget) {
                var self = this;

                var SearchTimeout;

                // function clean(obj) {
                //     var propNames = Object.getOwnPropertyNames(obj);
                //     for (var i = 0; i < propNames.length; i++) {
                //       var propName = propNames[i];
                //       if (obj[propName] === null || obj[propName] === undefined) {
                //         delete obj[propName];
                //       }
                //     }
                //   }

                function CheckLoginInit(){
                    var LoginStatus = "logged out";
                    var UserType = "desktop";
                    var hcPersonNo = undefined;
                    if(widget.user().loggedIn())
                    { 
                        LoginStatus = "logged in";
                        hcPersonNo = widget.user().id();
                    }
                    if($(window).width() < 900) UserType = "tablet";
                    if($(window).width() < 420) UserType = "mobile";



                    var customerGroup = 6;
                    for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
                        var element = widget.user().dynamicProperties()[i];
                        if (element.id() === "customerGroup") {
                            if (element.value() != null) {
                                customerGroup = element.value();
                            }
                            break;
                        }
                    }


                    

                    dataLayer.push({
                        'userId': hcPersonNo, // if logged in
                        'pageType': (document.title == "" ? undefined : document.title), //widget.site().siteInfo.name,
                        //'pageSubType': '',
                        'userGroup':customerGroup, 
                        'siteType': 'public', //this will be overwritten for showroom
                        'userType': UserType,
                        'loginStatus': LoginStatus
                    });
                }
                CheckLoginInit();
                //check again, if user logged in, as SSO sometimes takes long.
                setTimeout(CheckLoginInit, 5000);
            

                //Menu-Click
                $(document).on('click', '.mega-menu-9000 a', function(){
                    var theTitle = $(this).html();
                    if($(this).find('span').length>0)
                        theTitle = $(this).find('span').html();
                    dataLayer.push({
                        'event':'e_menuNav',
                        'menuName':theTitle,
                        'menuType':'Menu Desktop'
                    });
                });
                $(document).on('click', '.hc-collection-navigation-mobile-menu--main-view a', function(){
                    dataLayer.push({
                        'event':'e_menuNav',
                        'menuName': $(this).html(),
                        'menuType':'Menu Mobile'
                    });
                });
                $(document).on('click', '.hc-footer--link-list a', function(){
                    dataLayer.push({
                        'event':'e_menuNav',
                        'menuName': $(this).html(),
                        'menuType':'Footer'
                    });
                });
                $(document).on('click', '.secondary-nav a', function(){
                    dataLayer.push({
                        'event':'e_menuNav',
                        'menuName': $(this).html(),
                        'menuType':'Header'
                    });
                });

                $(document).on('input', '#CC-headerWidget-Search', function(){
                    var theSearch = $(this).val();
                    var theRes = [];
                    clearTimeout(SearchTimeout);
                    SearchTimeout = setTimeout(function(){
                        $('#typeaheadDropdown .typeaheadProduct').each(function(){
                            theRes.push($(this).find('.typeaheadProductName').html());
                        });

                        dataLayer.push({
                            'event':'e_searchResults',
                            'searchTerm': theSearch,
                            'searchResults': theRes,
                            'searchType': 'Quick Search'
                        });
                    },1000);
                });

                $('.hc-footer--email-form').on('submit', 'form', function(){
                    var fType = 'footer email form';
                    var fVal = $(this).find('input')[0].value;
                    if($(this).parent().hasClass('EmailTXTBlock')) fType = 'HP email form';
                    dataLayer.push({
                        'event':'e_formSubmit',
                        'menuName': fType,
                        'value': fVal,
                        'userId':hcPersonNo
                    });
                });



//Add Item to cart - moved here to check page
                $.Topic(pubsub.topicNames.CART_ADD_SUCCESS).subscribe(function(obj) {
					var variantValue = obj.childSKUs && obj.childSKUs.length > 0 ? obj.childSKUs[0].repositoryId : '';
					var stepCount = 1; //1 is product, 2 is quick order
					//Check for Quick Order
					if(widget.pageContext().page.name != "product"){
                        stepCount = 2; 
                    }

					// axCategory
                    dataLayer.push({
						'event' : 'e_addToCart',
						'ecommerce' : {
							'currencyCode' : 'ZAR',
							'add' : {
								'actionField' : {'step' : stepCount},
								'products' : [{
									'name' : obj.displayName,
									'id' : obj.id,
									'price' : ""+ (obj.salePrice !== null ? obj.salePrice : obj.listPrice)+".00",
									'brand' : obj.brand,
									//'category' : '',
									'variant' : variantValue,
									'quantity' : obj.orderQuantity
								}]
							}
						}
					});
                });
                
                
                $.Topic(pubsub.topicNames.CART_REMOVE).subscribe(function(obj) {
                    var variantValue = obj.childSKUs && obj.childSKUs.length > 0 ? obj.childSKUs[0].repositoryId : '';
                    dataLayer.push({
						'event' : 'e_removeFromCart',
                        'productId': obj.productId,
                        'ecommerce': {
                            'add': {
                                'actionField': { 'step': undefined }
                            }
                        }
					});
                });






                $.Topic(pubsub.topicNames.SOCIAL_SPACE_ADD_SUCCESS).subscribe(function(obj) {
                    dataLayer.push({
                        'event' : 'e_addToFav',
                        'productName' : obj.displayName,
                        'productId' : obj.productId
                        });
				});
                


               
                //PAGE_READY
                $.Topic(pubsub.topicNames.PAGE_READY).subscribe(function onCartReady() {
                    console.log("PAGE_READY");
                    console.log("page.name", widget.pageContext().page.name);
                    console.log("dataLayer", dataLayer);
                    console.log("SEO widget", widget);

                    //Generic Page register
                    
                    dataLayer.push({
                        'event' : 'e_pageView',
                        'PageName' : widget.pageContext().page.name,
                        'URL' : window.location.href
                        });



                    //carousel Init
                    $('.hc-hero-banner-carousel').each(function(){
                        setTimeout(function(){
                            var myHref = '';
                            var myPos = 0;
                            $(this).find('.item').each(function(){
                                if($(this).hasClass('active')){
                                    myPos = $(this).index();
                                    myHref =  $(this).find('a').attr('href');
                                }
                            });
                            dataLayer.push({
                                'event' : 'e_carouselView',
                                'contentPosition' : myPos,
                                'contentName' : myHref
                                });
                        });
                    });
                    
                    //carousel Slide
                    $(document).on('click', '.carousel-control, .carousel-indicators li', function() {
                        setTimeout(function(){
                            var tempElem = $('.hc-hero-banner-carousel .active')
                            dataLayer.push({
                                'event' : 'e_carouselView',
                                'contentPosition' : tempElem.index(),
                                'contentName' : tempElem.find('a').attr('href')
                            });
                        }, 2000);
                    });

                    //carousel click
                    $(document).on('click', '.hc-hero-banner-carousel .item', function(){
                        var tempElem = $(this)
                        dataLayer.push({
                            'event' : 'e_carouselClick',
                            'contentPosition' : tempElem.index(),
                            'contentName' : tempElem.find('a').attr('href')
                        });
                    }); 





                    //404
                    if(widget.pageContext().page.name == "404"){
                        dataLayer.push({
                            'event':'e_httpError',
                            'httpErrorCode': widget.pageContext().page.displayName
                        });
                    }

                    //DEA - Document Collection
                    if(widget.pageContext().page.name == "document-collection"){
                        dataLayer.push({
                            'event':'e_dea',
                            'actionField': {'step': 10}
                        });
                    }

                    //DEA - Document Collection
                    if(widget.pageContext().page.name == "register"){
                        dataLayer.push({
                            'event':'e_Income_and_Expences',
                            'actionField': {'step': 6}
                        });
                    }

                    
                    
                    //Search Results
                    if(widget.pageContext().page.name == "searchresults"){
                        clearTimeout(SearchTimeout);
                        SearchTimeout = setTimeout(function(){

                            var theSearch = '';
                            var theRes = [];
                            var theFilter = [];
                            if($('#cc-product-listing-title').length>0){

                            var tempArr = $('#cc-product-listing-title').html().split('"');
                            if(tempArr.length > 1) theSearch = tempArr[1];

                            $('#product-grid .cc-product-item').each(function(){
                               theRes.push($(this).find('.cc-item-title p').html());
                            });
                            
                            $('#CC-guidedNavigation-refinementCrumbSection .label-info').each(function(){
                                var spanConcat = '';
                                var spanArr = $(this).find('span span');
                                spanArr.each(function(){
                                    spanConcat = spanConcat + $(this).html().replace(/&nbsp;/g, " ");
                                });
                                theFilter.push(spanConcat);
                             });

                             if(theFilter.length > 0){
                                dataLayer.push({
                                    'event' : 'e_searchFiltered',
                                    'searchTerm': theSearch,
                                    'filterApplied' : 'Filters',
                                    'filterValue' : theFilter,
                                    'searchResults': theRes,
                                    'searchType': 'Full Search'
                                });
                             }else{
                                dataLayer.push({
                                    'event':'e_searchResults',
                                    'searchTerm': theSearch,
                                    'searchResults': theRes,
                                    'searchType': 'Full Search'
                                });
                             }
                            }

                        },1000);
                    }
                });

            }
        }
    }
);
