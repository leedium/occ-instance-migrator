define(['knockout','viewModels/productListingViewModelFactory','CCi18n',
  'ccConstants', 'pubsub', 'pageLayout/product', 'storageApi', 'ccStoreConfiguration'],

  function(ko, ProductListingViewModelFactory, CCi18n, CCConstants, pubsub, Product, storageApi, CCStoreConfiguration) {

    "use strict";
    var loadCount = 1;
    var previousSearch = false;
    var itemsPerPage = 12;
    var offset = 0;
    var currentListType = '';
    var pageData;
    var viewPortWidth;

    return {
      productListingElementFocus: ko.observable(false),
      displayRefineResults: ko.observable(false),
      WIDGET_ID: 'productListing',
      onLoad: function(widget) {
        // create productTypes map for which listingVaariant exists.
        var productListingTypesMap = {};
        if ((widget.productTypes) && (widget.productTypes())) {
          ko.utils.arrayForEach(widget.productTypes(), function(productType) {
            for (var i = 0; i < productType.variants.length; i++) {
              if (productType.variants[i].listingVariant) {
                productListingTypesMap[productType.id] = productType.variants[i];
                break;
              }
            }
          });
        }
        widget.productListingTypes = productListingTypesMap;

        var contextObj = {};
        widget.productListing = new Object();
        contextObj[CCConstants.ENDPOINT_KEY] = CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS;
        contextObj[CCConstants.IDENTIFIER_KEY] = "productListingData";
        var filterKey = CCStoreConfiguration.getInstance().getFilterToUse(contextObj);
        if(filterKey) {
          widget.productListing.filterKey = filterKey;
        }
        // disabling refine results button if there are no results for the selected category.
        $.Topic(pubsub.topicNames.SEARCH_RESULTS_FOR_CATEGORY_UPDATED).subscribe(function(obj){
          if (!this.navigation || this.navigation.length == 0) {
            widget.displayRefineResults(false);
          }
          else {
            widget.displayRefineResults(true);
          }
        });

        // disabling refine results button if search is unavailable.
        $.Topic(pubsub.topicNames.SEARCH_FAILED_TO_PERFORM).subscribe(function(obj) {
          widget.displayRefineResults(false);
        });

        //Sets the focus to the first element in the product listing page
        $.Topic(pubsub.topicNames.UPDATE_FOCUS).subscribe(function(obj) {
          if (this.WIDGET_ID === widget.WIDGET_ID) {
            widget.productListingElementFocus(true);
          }
        });

        var self = this;
        // TODO: This sortOptions property would make a nice
        // configuration option. Should be specified server-side in widget
        // configuration
        var sortOptions = [{
          "id": "default",
          "displayText": CCi18n.t("ns.productlisting:resources.sortByRelevanceText"),
          "order": ko.observable("none"),
          "maintainSortOrder": true,
          "serverOnly": true
        }, {
          "id": "listPrice",
          "displayText": CCi18n.t("ns.productlisting:resources.sortByPriceAscText"),
          "order": ko.observable("asc"),
          "maintainSortOrder": true,
          "serverOnly": true
        }, {
          "id": "listPrice",
          "displayText": CCi18n.t("ns.productlisting:resources.sortByPriceDescText"),
          "order": ko.observable("desc"),
          "maintainSortOrder": true,
          "serverOnly": true
        }];

        var searchSortOptions = [{
          "id": "product.displayName",
          "displayText": CCi18n.t("ns.productlisting:resources.sortByRelevanceText"),
          "order": ko.observable("none"),
          "maintainSortOrder": true,
          "serverOnly": true
        }, {
          "id": "sku.activePrice",
          "displayText": CCi18n.t("ns.productlisting:resources.sortByPriceAscText"),
          "sortKey": "sku.activePrice",
          "order": ko.observable("asc"),
          "maintainSortOrder": true,
          "serverOnly": true
        }, {
          "id": "sku.activePrice",
          "displayText": CCi18n.t("ns.productlisting:resources.sortByPriceDescText"),
          "sortKey": "sku.activePrice",
          "order": ko.observable("desc"),
          "maintainSortOrder": true,
          "serverOnly": true
        }];

        currentListType = widget.listType();

        widget.listingViewModel = ko.observable();
        widget.listingViewModel(
          ProductListingViewModelFactory.createListingViewModel(widget));
        if ( widget.listType() === CCConstants.LIST_VIEW_PRODUCTS){
          widget.listingViewModel().sortOptions(sortOptions);
        } else {
          widget.listingViewModel().sortOptions(searchSortOptions);
        }

        // Optimizing product grid rows formation
        widget.listingViewModel().productGridExtension = true;
        // Using generic sort, to avoid hard coding of sort keys
        widget.listingViewModel().useGenericSort = true;
        // Using client side Product view model caching
        widget.listingViewModel().isCacheEnabled = widget.isViewModelCacheEnabled ? widget.isViewModelCacheEnabled(): false;
        // Specifying number of categories to cache on client side
        widget.listingViewModel().viewModelCacheLimit = widget.viewModelCacheLimit ? widget.viewModelCacheLimit(): 3;

        if (widget.user().catalog) {
          widget.listingViewModel().catalog = widget.user().catalog.repositoryId;
        }

        widget.sortingCallback = function(evt) {
          // var element = $('#CC-product-sortAction');

          // $(element).focus();
        };


        /**
         * Updates the refinement list for the selected category.
         */
         widget.updateRefinements = function() {
          var searchParams = {
            recordsPerPage : itemsPerPage,
            recordOffSet : offset,
            newSearch : false,
            navigationDescriptors : widget.dimensionId(),
            suppressResults : true,
            searchType : CCConstants.SEARCH_TYPE_SIMPLE
          };
          $.Topic(pubsub.topicNames.SEARCH_CREATE_CATEGORY_LISTING).publishWith(searchParams, [{message:"success"}]);

          var categoryInfo = {
            categoryRoute : widget.category().route,
            categoryName : widget.category().displayName,
            repositoryId : widget.category().repositoryId,
            dimensionId : widget.dimensionId()
          };
          storageApi.getInstance().setItem("category",JSON.stringify(categoryInfo));
          $.Topic(pubsub.topicNames.CATEGORY_UPDATED).publish(categoryInfo);
        };

        /**
         * Scroll handler method used in phone and tablet modes.
         *
         * Method gets next set of products once bottom of product listing
         * element comes into view
         **/
         widget.scrollHandler = function(eventData) {

          var scrollTop = $(window).scrollTop();
          var viewportHeight = $(window).height();

          var productListElement = $('#product-grid').hasClass('active') ? '#product-grid' : '#product-list';

          var productListHeight = $(productListElement).height();

          if((scrollTop + viewportHeight) >= ((productListHeight / 5) * 4)) {
            widget.listingViewModel().incrementPage();
          }
        };

        // Scroll handle for mobile view
        widget.scrollHandleOnViewPort = function() {
          // Clear previous scrolls
          $(window).off('scroll.page');
          widget.listingViewModel().isLoadOnScroll(false);
          // Add scroll if it is mobile view only
          if (widget.listingViewModel().viewportMode() == CCConstants.TABLET_VIEW
            || widget.listingViewModel().viewportMode() == CCConstants.PHONE_VIEW || (widget.isScrollEnabled && widget.isScrollEnabled())) {
            $(window).on('scroll.page', widget.scrollHandler);
          widget.listingViewModel().pageNumber = 1;
            // if current page is already 1, then we need to trigger the computation of current products
            widget.listingViewModel().isLoadOnScroll(true);
          }
        };

        widget.productGrid = ko.observableArray([]);

        widget.changePageForSearch = function(otherData) {
          // Do not search if the type is undefined or any other type that search.
          $("html, body").animate({ scrollTop: 0 }, "slow");
          widget.productGrid([]);
          widget.listingViewModel().targetPage = 1;
          if (this.parameters.type != CCConstants.PARAMETERS_SEARCH_QUERY) {
            return;
          }
          if (this.parameters.page) {
            widget.listingViewModel().pageNumber = parseInt(this.parameters.page);
            widget.listingViewModel().targetPage = parseInt(this.parameters.page);
          } else {
            widget.listingViewModel().pageNumber = 1;
          }
          widget.listingViewModel().parameters = this.parameters;
          if (widget.listType() == CCConstants.LIST_VIEW_SEARCH) {

            // Setting the recordsPerPage from widget configuration
            if ( isNaN(widget.productsPerPage() )) {
              widget.listingViewModel().recordsPerPage(CCConstants.DEFAULT_SEARCH_RECORDS_PER_PAGE);
            } else {
              widget.listingViewModel().recordsPerPage(parseInt(widget.productsPerPage()));
            }
            widget.listingViewModel().itemsPerPage = widget.listingViewModel().recordsPerPage();

            // Add scroll for mobile view
            widget.scrollHandleOnViewPort();
            widget.listingViewModel().load(1);
          }
          // Add pagination type as type 2
          widget.listingViewModel().paginationType(2);
        };

        // Handle the page change event data to generate pages
        $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(widget.getPageUrlData.bind(widget));
        // Handle the pagination calls
        $.Topic(pubsub.topicNames.PAGE_PAGINATION_CHANGE).subscribe(widget.changePage.bind(widget));
        // Handle search
        $.Topic(pubsub.topicNames.PAGE_PARAMETERS).subscribe(widget.changePageForSearch);

        /**
         * Formats the updated products
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

        widget.resultsText = ko.computed(function(){
          return widget.listingViewModel().resultsText();
        },widget.listingViewModel());

        widget.updateFocus = function() {
          $.Topic(pubsub.topicNames.UPDATE_LISTING_FOCUS).publish();
          return true;
        };

        widget.updateFocusAndDisableQV = function(data, evt) {
          //hide the QV to prevent the user clicking it while the main PDP is loading
          $(".quickViewElement").hide();
          return widget.updateFocus();
        };

        //Create productGrid computed for the widget
        widget.productGridComputed = ko.computed(function() {
          var numElements, start, end, width;
          var rows = [];

          var products = widget.listingViewModel().currentProductsComputed();

          if(!products) {
            return;
          }

          numElements = products.length;

          width = 3; //parseInt(widget.gridWidth(),10);
          start = 0;
          end = start + width;

          while(end <= numElements) {
            rows.push(products.slice(start, end));
            start = end;
            end += width;
          }

          if(end > numElements && start < numElements) {
            rows.push(products.slice(start, numElements));
          }

          return rows;
        }, widget);

        // Below subscription updated productGrid observable array.
        widget.productGridComputed.subscribe(function(newValues) {
          if (newValues && newValues.length > 0) {
            if(widget.listingViewModel().refreshValues == true) {
              widget.productGrid(newValues);
              widget.listingViewModel().refreshValues = false;
            }
            else {
              widget.productGrid.push.apply(widget.productGrid, newValues); //Push the new row into the grid.
            }


          }
        });

        /**
         * Updated the grids when the category has been upated
         */
         widget.categoryUpdate = function(value) {

          if(!value) {
            return;
          }

          var category = widget.listingViewModel().category();
          if ( widget.listType() !== CCConstants.LIST_VIEW_PRODUCTS){

            widget.listType(CCConstants.LIST_VIEW_PRODUCTS);
            widget.listingViewModel(
              ProductListingViewModelFactory.createListingViewModel(widget));
          }


          if((!category || (category.id != value.id)) || (previousSearch) ) {

            widget.listingViewModel().resetSortOptions();
          }
          if((!category || (category.id != value.id)) || (previousSearch) || (!widget.listingViewModel().paginationOnly)) {
            widget.listingViewModel().category(value);
            widget.listingViewModel().clearOnLoad = true;
            widget.productGrid([]); //On category update we will need to clear the product grid if it is completely a new category. Also removed a or condition here (!widget.listingViewModel().paginationOnly()). Is it useful anywhere?
            widget.listingViewModel().targetPage = 1;
            widget.listingViewModel().load(1);
            widget.listingViewModel().paginationType(1);
            previousSearch = false;
          }
        };

        /**
         * Issue with bootstrap tab-contents in that sometimes it loses the
         * active tab, this ensures we have a tab chosen
         */
         widget.ensureActiveTab = function(){
          if (! ( $('#product-grid').hasClass('active') ||
            $('#product-list').hasClass('active'))) {
            $('#product-grid').addClass('active');
        }
      };

        /**
         *  Handle the widget response when the search result have been updated.
         */
         if (widget.listType() !== CCConstants.LIST_VIEW_PRODUCTS) {
          $.Topic(pubsub.topicNames.SEARCH_RESULTS_UPDATED).subscribe(function(obj) {
            widget.category(null);
            previousSearch = true;
            if (widget.listType() !== CCConstants.LIST_VIEW_SEARCH) {
              widget.listType(CCConstants.LIST_VIEW_SEARCH);
              widget.listingViewModel(
                ProductListingViewModelFactory.createListingViewModel(widget));
            }
            widget.ensureActiveTab();
            if ((this.navigation && this.navigation.length > 0) || (this.breadcrumbs && this.breadcrumbs.refinementCrumbs.length > 0)) {
              widget.displayRefineResults(true);
            }
            else {
              widget.displayRefineResults(false);
            }
          });
        }

        viewPortWidth = $(window).width();

        // Check on viewport resize
        $(window).resize(function() {
          // Empty product grid whenever view port changes ex: landscape to portrait in iPad
         // widget.productGrid([]);
          //Adding window.innerWidth for it to work correctly with the actual screen width
          var windowWidth = (window.innerWidth || $(window).width());
          if (widget.isActiveOnPage(pageData) && windowWidth != viewPortWidth ) {
        	//widget.listingViewModel().refreshValues=true;
          widget.listingViewModel().checkResponsiveFeatures(windowWidth);
          widget.scrollHandleOnViewPort();
          widget.listingViewModel().cleanPage();
          viewPortWidth = windowWidth;
        }
      });

        widget.handlePageChanged = function(pageData) {
          var widget = this;
          if (!(pageData.pageId == "category" || pageData.pageId == "searchresults")) {
            $(window).off('scroll.page', widget.scrollHandler);
          }
        };

        $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(widget.handlePageChanged.bind(widget));
      },


      beforeAppear: function (page) {
        var widget = this;
        //Regsiter this subscription only if we are on medium, desktop and large screens
        // if ((widget.isScrollEnabled && !widget.isScrollEnabled()) || (widget.listingViewModel().viewportMode() != CCConstants.TABLET_VIEW && widget.listingViewModel().viewportMode() != CCConstants.PHONE_VIEW)) {
        //   // We will need to clear the grid once the page canges to hold the new set of data.
        //   widget.listingViewModel().currentPage.subscribe(function(newValue) {
        //     if(newValue) {
        //       widget.productGrid([]);
        //     }
        //   });
        // }
        currentListType = widget.listType();

        // Adding code to clear the values of previous search results
        if (widget.listType() == CCConstants.LIST_VIEW_SEARCH) {
          widget.displayRefineResults(false);
          widget.listingViewModel().titleText('');
          widget.listingViewModel().noSearchResultsText('');
          widget.listingViewModel().suggestedSearches({});
        }


        if(widget.category() && widget.listType() != CCConstants.LIST_VIEW_SEARCH) {
          widget.categoryUpdate(widget.category());
        }

        // Updating refinements in the GuidedNavigation widget only if search is available.
        if ( widget.listType() === CCConstants.LIST_VIEW_PRODUCTS) {
          if (widget.displayRefineResults() && widget.listingViewModel().paginationOnly) {
            // do nothing cause we don't want to update the refinements.
          } else if(widget.dimensionId()){
            widget.updateRefinements();
          } else {
            widget.displayRefineResults(false);
            $.Topic(pubsub.topicNames.OVERLAYED_GUIDEDNAVIGATION_CLEAR).publish();
          }
        }
        widget.listingViewModel().handleResponsiveViewports();
      },

      getPageUrlData: function(data) {
        var widget = this;
        // Set the data to the widget level variable
        pageData = data;
        // Only change these properties if we're on the correct page.
        if (data.pageId == CCConstants.CATEGORY_CONTEXT || data.pageId == CCConstants.SEARCH_RESULTS) {
          widget.listingViewModel().pageId(data.pageId);
          widget.listingViewModel().contextId(data.contextId);
          widget.listingViewModel().seoslug(data.seoslug);
        }
      },

      changePage: function(data) {
        var widget = this;
        $("html, body").animate({ scrollTop: 0 }, "slow");
        // Handle the page number change
        if (data.page) {
          widget.listingViewModel().pageNumber = parseInt(data.page);
        } else {
          widget.listingViewModel().pageNumber = 1;
          widget.listingViewModel().initializeIndex();
        }
        // Add scroll for mobile view
        if (widget.listType() == CCConstants.LIST_VIEW_PRODUCTS) {
          widget.scrollHandleOnViewPort();
        }
        if ((widget.listType() == CCConstants.LIST_VIEW_PRODUCTS) && data.paginationOnly) {
          widget.listingViewModel().getPage(widget.listingViewModel().pageNumber);
        }
        widget.listingViewModel().paginationOnly = data.paginationOnly;
        if(!widget.listingViewModel().isLoadOnScroll()){
          widget.productGrid([]);
        }
      },

      handleSortingHelper: function(sorting, cb) {
        var widget = this;
        widget.productGrid([]);
        widget.listingViewModel().handleSorting(sorting, cb);
      },

      /**
        * Toggles active class between grid and list view buttons on click
        */

        btnClick : function() {
            // if (!$('#CC-productList-GridButton').hasClass('active')) {
            //   $(this).addClass('active');
            // }

            $('#CC-productList-GridButton').click(function() {
              if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                $('#CC-productList-ListButton').removeClass('active');
              }
            });

            $('#CC-productList-ListButton').click(function() {
              if (!$(this).hasClass('active')) {
                $(this).addClass('active');
                $('#CC-productList-GridButton').removeClass('active');
              }
            });
          },

      /**
       * Handles click on refine results
       */
       handleRefineResults : function(data, event) {

        if (!($('#CC-overlayedGuidedNavigation-column').hasClass('open')) && !($('#CC-overlayedGuidedNavigation').hasClass('CC-overlayedGuidedNavigation-mobileView'))) {
          $('#CC-overlayedGuidedNavigation').addClass('CC-overlayedGuidedNavigation-mobileView');
          // Add a pubsub to open guided navigation
          $.Topic(pubsub.topicNames.OVERLAYED_GUIDEDNAVIGATION_SHOW).publish();
        }
        if (($(window)[0].innerWidth || $(window).width()) < CCConstants.VIEWPORT_TABLET_LOWER_WIDTH) {
          // Remove the scroll handling when the refinements is open in the mobile view.
          // This saves extra calls when refinements are loaded.
          $(window).off('scroll.page');
          $('html, body').css('overflow-y', 'hidden');
        }
        $('#CC-overlayedGuidedNavigation-done').focus();
        return false;
      },
      priceUnavailableText : function() {
        return CCi18n.t('ns.productlisting:resources.priceUnavailable');
      }
    };
  });
