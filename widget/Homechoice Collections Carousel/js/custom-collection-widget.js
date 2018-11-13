/**
 * @fileoverview Collection Widget.
 * 
 * 
 */
define(  
  // -------------------------------------------------------------------
  // DEPENDENCIES
  // -------------------------------------------------------------------
  [ 'knockout', 'pubsub', 'notifier', 'ccConstants', 'ccRestClient',
      'pageLayout/product', 'ccStoreConfiguration' ],
  // -------------------------------------------------------------------
  // MODULE DEFINITION
  // -------------------------------------------------------------------
  function(ko, pubsub, notifier, CCConstants, ccRestClient, Product, CCStoreConfiguration) {
    
    "use strict";
    
    return {
      itemsPerRowInLargeDesktopView : ko.observable(4),
      itemsPerRowInDesktopView : ko.observable(4),
      itemsPerRowInTabletView : ko.observable(4),
      itemsPerRowInPhoneView : ko.observable(2),
      itemsPerRow : ko.observable(),
      viewportWidth : ko.observable(),
      viewportMode : ko.observable(),
      productGroups : ko.observableArray(),
      products : ko.observableArray(),
      titleText : ko.observable(),
      spanClass : ko.observable(),
      isCollectionVisible: ko.observable(true),
      storeConfiguration: CCStoreConfiguration.getInstance(),
      onLoad : function(widget) {        
        widget.products = ko.observableArray();
        widget.productGroups = ko.observableArray();
        
        /**
         * Formats the products
         */
        widget.formatProducts = function(products) {
          var formattedProducts = [];
          var productsLength = products.length;
          for (var i = 0; i < productsLength; i++) {
            if (products[i]) {
              formattedProducts.push(new Product(products[i]));
            }
          }
          return formattedProducts;
        };
        
        /**
         * Groups the products based on the viewport
         */
        widget.productGroups = ko.computed(function() {
          var groups = [];
          if (widget.products) {
            for (var i = 0; i < widget.products().length; i++) {
              if (i % widget.itemsPerRow() == 0) {
                groups.push(ko.observableArray([ widget.products()[i] ]));
              } else {
                groups[groups.length - 1]().push(widget.products()[i]);
              }
            }
          }
          return groups;
        }, widget);
        
        widget.updateSpanClass = function() {
          var classString ="";
          var phoneViewItems = 0,
          tabletViewItems = 0,
          desktopViewItems = 0,
          largeDesktopViewItems = 0;
          if (this.itemsPerRow() == this.itemsPerRowInPhoneView()) {
            phoneViewItems = 12 / this.itemsPerRow();
          }
          if (this.itemsPerRow() == this.itemsPerRowInTabletView()) {
            tabletViewItems = 12 / this.itemsPerRow();
          }
          if (this.itemsPerRow() == this.itemsPerRowInDesktopView()) {
            desktopViewItems = 12 / this.itemsPerRow();
          }
          if (this.itemsPerRow() == this.itemsPerRowInLargeDesktopView()) {
            largeDesktopViewItems = 12 / this.itemsPerRow();
          }
          
          if (phoneViewItems > 0) {
            classString += "col-xs-" + phoneViewItems;
          }
          if ((tabletViewItems > 0) && (tabletViewItems != phoneViewItems)) {
            classString += " col-sm-" + tabletViewItems;
          }
          if ((desktopViewItems > 0) && (desktopViewItems != tabletViewItems)) {
            classString += " col-md-" + desktopViewItems;
          }
          if ((largeDesktopViewItems > 0) && (largeDesktopViewItems != desktopViewItems)) {
            classString += " col-lg-" + largeDesktopViewItems;
          }
          
          widget.spanClass(classString);
        };
        /**
         * Checks the size of the current viewport and sets the viewport and itemsPerRow
         * mode accordingly
         */
        widget.checkResponsiveFeatures = function(viewportWidth) {
          if (viewportWidth > CCConstants.VIEWPORT_LARGE_DESKTOP_LOWER_WIDTH) {
            if (widget.viewportMode() != CCConstants.LARGE_DESKTOP_VIEW) {
              widget.viewportMode(CCConstants.LARGE_DESKTOP_VIEW);
              widget.itemsPerRow(widget.itemsPerRowInLargeDesktopView());
            }
          } else if (viewportWidth > CCConstants.VIEWPORT_TABLET_UPPER_WIDTH
              && viewportWidth <= CCConstants.VIEWPORT_LARGE_DESKTOP_LOWER_WIDTH) {
            if (widget.viewportMode() != CCConstants.DESKTOP_VIEW) {
              widget.viewportMode(CCConstants.DESKTOP_VIEW);
              widget.itemsPerRow(widget.itemsPerRowInDesktopView());
            }
          } else if (viewportWidth >= CCConstants.VIEWPORT_TABLET_LOWER_WIDTH
              && viewportWidth <= CCConstants.VIEWPORT_TABLET_UPPER_WIDTH) {
            if (widget.viewportMode() != CCConstants.TABLET_VIEW) {
              widget.viewportMode(CCConstants.TABLET_VIEW);
              widget.itemsPerRow(widget.itemsPerRowInTabletView());
            }
          } else if (widget.viewportMode() != CCConstants.PHONE_VIEW) {
            widget.viewportMode(CCConstants.PHONE_VIEW);
            widget.itemsPerRow(widget.itemsPerRowInPhoneView());
          }
          widget.updateSpanClass();
        };
        
        /**
         * Updates the focus when product details is loaded
         */
        widget.updateFocus = function() {
          $.Topic(pubsub.topicNames.UPDATE_LISTING_FOCUS).publish();
          return true;
        };
        
       
        
        widget.checkResponsiveFeatures($(window)[0].innerWidth || $(window).width());
        $(window).resize(
          function() {
            widget.checkResponsiveFeatures($(window)[0].innerWidth || $(window).width());
            widget.viewportWidth($(window)[0].innerWidth || $(window).width());
          });
        
        var url = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
        var data = {};
        data[CCConstants.CATEGORY] = widget.collectionId();
        data.includeChildren = true;
        data[CCConstants.STORE_PRICELISTGROUP_ID] = widget.site().selectedPriceListGroup().id;
        if (widget.fields()){
              data.fields = widget.fields();
        }

        var contextObj = {};
        contextObj[CCConstants.ENDPOINT_KEY] = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
        contextObj[CCConstants.IDENTIFIER_KEY] = "collectionWidget";
        var filterKey = widget.storeConfiguration.getFilterToUse(contextObj);
        if (filterKey) {
          data[CCConstants.FILTER_KEY] = filterKey;
        }
        ccRestClient.request(url, data, 
          // success callback
          function(result) {
            if (result.items) {
              widget.products(widget.formatProducts(result.items));
            }
            if (result.category) {
              widget.titleText(result.category.displayName);
            }
          },
          // error callback
          function(result) {
            if (result && result.errorCode == CCConstants.LIST_PRODUCTS_INVALID_COLLECTION) {
              widget.isCollectionVisible(false);
            }
          }
        );

      },
      handleCarouselArrows : function(data, event) {
        // Handle left key
        if (event.keyCode == 37) {
          $('#collection-Carousel').carousel('prev');
        }
        // Handle right key
        if (event.keyCode == 39) {
          $('#collection-Carousel').carousel('next');
        }
      }
    };
  });
