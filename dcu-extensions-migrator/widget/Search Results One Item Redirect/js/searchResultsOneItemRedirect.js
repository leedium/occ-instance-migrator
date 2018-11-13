/**
* @fileoverview Search Results One Item Redirect Widget.
* 
* @author Marcelo Tresso Marcolino
*/


define(
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------		
  ['jquery','knockout','viewModels/productListingViewModelFactory', 'ccConstants', 'pubsub', 'pageLayout/product', 'ccStoreConfiguration', 'navigation'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function($, ko, ProductListingViewModelFactory, CCConstants, pubsub, Product, CCStoreConfiguration, navigation) {

    "use strict";
    
    var previousSearch = false;
    var currentListType = '';
    var pageData;

    return {

      WIDGET_ID: 'searchResultsOneItemRedirect',
      
      
      onLoad: function(widget) {

    	console.log("** onLoad: searchResultsOneItemRedirect **", widget);

        var contextObj = {};
        widget.searchResultsOneItemRedirect = new Object();
        contextObj[CCConstants.ENDPOINT_KEY] = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
        contextObj[CCConstants.IDENTIFIER_KEY] = "productListingData";
        var filterKey = CCStoreConfiguration.getInstance().getFilterToUse(contextObj);
        if(filterKey) {
          widget.searchResultsOneItemRedirect.filterKey = filterKey;
        }
        
        var self = this;
        currentListType = widget.listType();

        widget.listingViewModel = ko.observable();
        widget.listingViewModel(ProductListingViewModelFactory.createListingViewModel(widget));
        
        // Using generic sort, to avoid hard coding of sort keys
        widget.listingViewModel().useGenericSort = true;
        
        // Using client side Product view model caching
        widget.listingViewModel().isCacheEnabled = false;
        
        // Specifying number of categories to cache on client side
        widget.listingViewModel().viewModelCacheLimit = 3;

        /**
         *  Handle the widget response when the search result have been updated.
         */
        $.Topic(pubsub.topicNames.SEARCH_RESULTS_UPDATED).subscribe(function(obj) {
            widget.category(null);
            previousSearch = true;
            if (widget.listType() !== CCConstants.LIST_VIEW_SEARCH) {
              widget.listType(CCConstants.LIST_VIEW_SEARCH);
              widget.listingViewModel(ProductListingViewModelFactory.createListingViewModel(widget));
            }
        });
        
        console.log("widget.isOneItemRedirectEnabled() -> ", widget.isOneItemRedirectEnabled());
        
        // Check if Redirect is Enabled in Widget Settings
        if (widget.isOneItemRedirectEnabled()){
                        
            widget.listingViewModel().currentProducts.subscribe(
                function(currentProducts){
                    //console.log('current products length', currentProducts.length, currentProducts);
                    
                	// Check how many items exists in search result
                    if(widget.listingViewModel().totalNumber() === 1) {
                        //console.log('current products route', currentProducts[0].route());
                    	//$('#CC-productListing').css('display','none');
                        //$('#CC-productListing').hide();
                        widget.listingViewModel().display(false); 
                        navigation.goTo(currentProducts[0].route(), false, true);
                        
                    } //else {
                        //$('#CC-productListing').show();
                    //}
                }
            );
        }
        
      },
      // End onLoad 

      
      beforeAppear: function (page) {

        var widget = this;
        currentListType = widget.listType();

        // Adding code to clear the values of previous search results
        widget.listingViewModel().titleText('');
        widget.listingViewModel().noSearchResultsText('');
        widget.listingViewModel().suggestedSearches({});
        widget.listingViewModel().cleanPage();
        widget.listingViewModel().clearOnLoad = true;
        widget.listingViewModel().refreshValues = true;
        widget.listingViewModel().targetPage = 1;
        widget.listingViewModel().load(1);
        //$('#CC-productListing').show();
  
      },
      // End beforeAppear
      
      
      getPageUrlData: function(data) {
        var widget = this;
        // Set the data to the widget level variable
        pageData = data;
        
        // Only change these properties if we're on the correct page.
        if (data.pageId == CCConstants.SEARCH_RESULTS) {
          widget.listingViewModel().pageId(data.pageId);
          widget.listingViewModel().contextId(data.contextId);
          widget.listingViewModel().seoslug(data.seoslug);
        }
        
      }
      // End getPageUrlData
      
    };
  });
