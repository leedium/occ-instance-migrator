/**
 * @fileoverview Product Details Widget.
 * 
 */
define(

  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'ccConstants', 'koValidate', 'notifier', 'CCi18n', 'storeKoExtensions', 'swmRestClient', 'spinner', 'pageLayout/product', 'ccRestClient', 'pinitjs'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, pubsub, CCConstants, koValidate, notifier, CCi18n, storeKoExtensions, swmRestClient, spinner, product, ccRestClient, pinitjs) {

    "use strict";
    var widgetModel;

    var LOADED_EVENT = "LOADED";
    var LOADING_EVENT = "LOADING";

    var productLoadingOptions = {
        parent: '#cc-product-spinner',
        selector: '#cc-product-spinner-area'
    };

    var resourcesAreLoaded      = false;
    var resourcesNotLoadedCount = 0;
    var resourcesMaxAttempts    = 5;
    
    var mySpacesComparator = function(opt1, opt2) {
      if (opt1.spaceNameFull() > opt2.spaceNameFull()) {
        return 1;
      } else if (opt1.spaceNameFull() < opt2.spaceNameFull()) {
        return -1;
      } else {
        return 0;
      }
    };
    var joinedSpacesComparator = function(opt1, opt2) {
      if (opt1.spaceNameFull() > opt2.spaceNameFull()) {
        return 1;
      } else if (opt1.spaceNameFull() < opt2.spaceNameFull()) {
        return -1;
      } else {
        return 0;
      }
    };

    return {

      stockStatus: ko.observable(false),
      stockState: ko.observable(),
      showStockStatus: ko.observable(false),
      variantOptionsArray: ko.observableArray([]),
      itemQuantity: ko.observable(1),
      stockAvailable: ko.observable(1),
      availabilityDate: ko.observable(),
      selectedSku: ko.observable(),
      disableOptions: ko.observable(false),
      priceRange : ko.observable(false),
      filtered : ko.observable(false),
      WIDGET_ID : 'productDetails',
      isAddToCartClicked : ko.observable(false),
      containerImage: ko.observable(),
      imgGroups: ko.observableArray(),
      mainImgUrl: ko.observable(),
      activeImgIndex: ko.observable(0),
      viewportWidth: ko.observable(),
      skipTheContent: ko.observable(false),
      listPrice : ko.observable(),
      salePrice : ko.observable(),
      backLinkActive : ko.observable(true),
      variantName: ko.observable(),
      variantValue: ko.observable(),
      listingVariant: ko.observable(),
      shippingSurcharge: ko.observable(),
      imgMetadata: [],
      isMobile : ko.observable(false),

      // social
      showSWM: ko.observable(true),
      isAddToSpaceClicked : ko.observable(false),
      disableAddToSpace : ko.observable(false),
      spaceOptionsArray: ko.observableArray([]),
      spaceOptionsGrpMySpacesArr : ko.observableArray([]),
      spaceOptionsGrpJoinedSpacesArr : ko.observableArray([]),
      mySpaces: ko.observableArray([]),
      siteFbAppId: ko.observable(''),

      resourcesLoaded: function(widget) {
        resourcesAreLoaded = true;
      },

      onLoad: function (widget) {
        widgetModel = widget;

        $.Topic(pubsub.topicNames.UPDATE_LISTING_FOCUS).subscribe(function(obj) {
          widget.skipTheContent(true);
        });

        
        $.Topic(pubsub.topicNames.PAGE_READY).subscribe(function(obj) {
          var parameters = {};
          if (obj.parameters) {
            var param = obj.parameters.split("&");
            for (var i = 0; i < param.length; i++) {
              var tempParam = param[i].split("=");
              parameters[tempParam[0]] = tempParam[1];
            }
          }
          if (parameters.variantName && parameters.variantValue) {
            widget.variantName(decodeURI(parameters.variantName));
            widget.variantValue(decodeURI(parameters.variantValue));
          } else {
            widget.variantName("");
            widget.variantValue("");
          }
        });

        $.Topic(pubsub.topicNames.SOCIAL_SPACE_ADD_SUCCESS).subscribe(function(obj) {
          if (obj.productUpdated) {
            widget.disableAddToSpace(true);
            setTimeout(function() {widget.disableAddToSpace(false);}, 3000);
          }
          else {
            widget.isAddToSpaceClicked(true);
            widget.disableAddToSpace(true);
            setTimeout(function() {widget.isAddToSpaceClicked(false);}, 3000);
            setTimeout(function() {widget.disableAddToSpace(false);}, 3000);
          }
        });

				$.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function(obj) {
				  widget.getSpaces(function(){});
				});
				
      	$.Topic(pubsub.topicNames.USER_AUTO_LOGIN_SUCCESSFUL).subscribe(function(obj) {
      	  widget.getSpaces(function(){});
      	});
      	
      	$.Topic(pubsub.topicNames.SOCIAL_REFRESH_SPACES).subscribe(function(obj) {
      	  widget.getSpaces(function(){});
      	});
        
        widget.itemQuantity.extend({required: {params: true, message: CCi18n.t('ns.common:resources.quantityRequireMsg') },
                                    digit: {params: true, message: CCi18n.t('ns.common:resources.quantityNumericMsg') },
                                    min: {params: 1, message: CCi18n.t('ns.productdetails:resources.quantityGreaterThanMsg', {quantity: 0})}
                                   });
                                    
        widget.stockAvailable.subscribe(function (newValue) {
          var max = parseInt(newValue, 10);
          widget.itemQuantity.rules.remove(function (item) {
            return item.rule == "max";
          });
          if (max > 0) {
            widget.itemQuantity.extend({max: {params: max,
                                              message: CCi18n.t('ns.productdetails:resources.quantityLessThanMsg',
                                                                {quantity: max})}
                                       });
          }
        });
        
        // initialize swm rest client
        swmRestClient.init(widget.site().tenantId, widget.isPreview(), widget.locale());
        
        // get FB app ID
        widget.fetchFacebookAppId();
        
        /**
         * Set up the popover and click handler 
         * @param {Object} widget
         * @param {Object} event
         */
        widget.shippingSurchargeMouseOver = function(widget, event) {
          // Popover was not being persisted between
          // different loads of the same 'page', so
          // popoverInitialised flag has been removed
          
          // remove any previous handlers
          $('.shippingSurchargePopover').off('click');
          $('.shippingSurchargePopover').off('keydown');
        
          var options = new Object();
          options.trigger = 'manual';
          options.html = true;              
          
          // the button is just a visual aid as clicking anywhere will close popover
          options.title = widget.translate('shippingSurchargePopupTitle')
                          + "<button id='shippingSurchargePopupCloseBtn' class='close btn pull-right'>"
                          + widget.translate('escapeKeyText')
                          + " &times;</button>";
                          
          options.content = widget.translate('shippingSurchargePopupText');
          
          $('.shippingSurchargePopover').popover(options);
          $('.shippingSurchargePopover').on('click', widget.shippingSurchargeShowPopover);
          $('.shippingSurchargePopover').on('keydown', widget.shippingSurchargeShowPopover);
        };
        
        widget.shippingSurchargeShowPopover = function(e) {
          // if keydown, rather than click, check its the enter key
          if(e.type === 'keydown' && e.which !== CCConstants.KEY_CODE_ENTER) {
            return;
          }
          
          // stop event from bubbling to top, i.e. html
          e.stopPropagation();
          $(this).popover('show');
          
          // toggle the html click handler
          $('html').on('click', widget.shippingSurchargeHidePopover);
          $('html').on('keydown', widget.shippingSurchargeHidePopover);
          
          $('.shippingSurchargePopover').off('click');
          $('.shippingSurchargePopover').off('keydown');
        };
        
        widget.shippingSurchargeHidePopover = function(e) {
          // if keydown, rather than click, check its the escape key
          if(e.type === 'keydown' && e.which !== CCConstants.KEY_CODE_ESCAPE) {
            return;
          }
          
          $('.shippingSurchargePopover').popover('hide');
          
          $('.shippingSurchargePopover').on('click', widget.shippingSurchargeShowPopover);
          $('.shippingSurchargePopover').on('keydown', widget.shippingSurchargeShowPopover);
          
          $('html').off('click');
          $('html').off('keydown');
          
          $('.shippingSurchargePopover').focus();
        };

        $(window).resize(function() {
          // Optimizing the carousel performance, to not reload when only height changes
          var width = $(window)[0].innerWidth || $(window).width() ;
          if (widget.product && widget.product() && widget.product().primaryFullImageURL) {
            if (widget.viewportWidth() == width) {
               // Don't reload as the width is same
            } else {
              // Reload the things
              if (width > CCConstants.VIEWPORT_TABLET_UPPER_WIDTH) {
                if (widget.viewportWidth() <= CCConstants.VIEWPORT_TABLET_UPPER_WIDTH) {
                  // Optionally reload the image place in case the view port was different
                  widget.activeImgIndex(0);
                  widget.mainImgUrl(widget.product().primaryFullImageURL);
                  $('#prodDetails-imgCarousel').carousel(0);
                  $('#carouselLink0').focus();
                }
              } else if (width >= CCConstants.VIEWPORT_TABLET_LOWER_WIDTH) {
                if ((widget.viewportWidth() < CCConstants.VIEWPORT_TABLET_LOWER_WIDTH) || (widget.viewportWidth() > CCConstants.VIEWPORT_TABLET_UPPER_WIDTH)) {
                  // Optionally reload the image place in case the view port was different
                  widget.activeImgIndex(0);
                  widget.mainImgUrl(widget.product().primaryFullImageURL);
                  $('#prodDetails-imgCarousel').carousel({interval: 1000000000});
                  $('#prodDetails-imgCarousel').carousel(0);
                  $('#carouselLink0').focus();
                }
              } else {
                if (widget.viewportWidth() > CCConstants.VIEWPORT_TABLET_LOWER_WIDTH) {
                  // Optionally reload the carousel in case the view port was different
                  $('#prodDetails-mobileCarousel').carousel({interval: 1000000000});
                  $('#prodDetails-mobileCarousel').carousel(0);
                }
              }
            }
          }
          widget.viewportWidth(width);
          widget.checkResponsiveFeatures($(window).width());
        });

        widget.viewportWidth($(window).width());
        if (widget.product()) {
          widget.imgGroups(widget.groupImages(widget.product().thumbImageURLs()));
          widget.mainImgUrl(widget.product().primaryFullImageURL());
        }

        if (true || widget.skipTheContent()) {
          var focusFirstItem = function () {
            $('#cc-product-details :focusable').first().focus();          
            widget.skipTheContent(false);
          };
  
          focusFirstItem();
          setTimeout(focusFirstItem, 1); // Daft IE fix.        
        }
      },

      beforeAppear: function (page) {
        var widget = this;
				if (widget.product && widget.product()){
					widget.checkResponsiveFeatures($(window).width());
					this.backLinkActive(true);
					if (!widget.isPreview() && !widget.historyStack.length) {
						this.backLinkActive(false);
					}

					/* reset active img index to 0 */
					widget.shippingSurcharge(null);
					widget.activeImgIndex(0);
					widget.firstTimeRender = true;
					this.populateVariantOptions(widget);
					if (widget.product()) {
					widget.imgGroups(widget.groupImages(widget.product().thumbImageURLs()));
					}
					widget.loaded(true);
					this.itemQuantity(1);
					// the dropdown values should be pre-selected if there is only one sku
					if (widget.product() && widget.product().childSKUs().length == 1) {
						this.filtered(false);
						this.filterOptionValues(null);
					}
					notifier.clearSuccess(this.WIDGET_ID);
					var catalogId = null;
					if (widget.user().catalog) {
						catalogId = widget.user().catalog.repositoryId;
					}
					widget.listPrice(widget.product().listPrice());
					widget.salePrice(widget.product().salePrice());

					if (widget.product()) {
						widget.product().stockStatus.subscribe(function (newValue) {
							if ((widget.product().stockStatus().stockStatus === CCConstants.IN_STOCK ||
									widget.product().stockStatus().stockStatus === CCConstants.PREORDERABLE ||
									widget.product().stockStatus().stockStatus === CCConstants.BACKORDERABLE) &&
									(widget.product().stockStatus().orderableQuantity != undefined ||
									 widget.product().stockStatus().productSkuInventoryStatus != undefined)) {
								if (widget.product().stockStatus().orderableQuantity) {
									widget.stockAvailable(widget.product().stockStatus().orderableQuantity);
								} else {
									widget.stockAvailable(1);
								}
								widget.disableOptions(false);
								widget.stockStatus(true);
								widget.stockState(widget.product().stockStatus().stockStatus);
								widget.availabilityDate(widget.product().stockStatus().availabilityDate);
							} else {
								widget.stockAvailable(0);
								widget.stockState(CCConstants.OUT_OF_STOCK);
								widget.disableOptions(true);
								widget.stockStatus(false);
							}
							widget.showStockStatus(true);
						});
						var firstchildSKU = widget.product().childSKUs()[0];
						if (firstchildSKU) {
							var skuId = firstchildSKU.repositoryId();
							if (this.variantOptionsArray().length > 0) {
								skuId = '';
							}
							this.showStockStatus(false);
							widget.product().getAvailability(widget.product().id(), skuId, catalogId);
							widget.product().getPrices(widget.product().id(), skuId);
						} else {
							widget.stockStatus(false);
							widget.disableOptions(true);
							widget.showStockStatus(true);
						}
						this.priceRange(this.product().hasPriceRange);
						widget.mainImgUrl(widget.product().primaryFullImageURL());

						$.Topic(pubsub.topicNames.PRODUCT_VIEWED).publish(widget.product());
						$.Topic(pubsub.topicNames.PRODUCT_PRICE_CHANGED).subscribe(function() {
							widget.listPrice(widget.product().listPrice());
							widget.salePrice(widget.product().salePrice());
							widget.shippingSurcharge(widget.product().shippingSurcharge());
						});
					}

					// Load spaces
					if (widget.user().loggedIn()){
						widget.getSpaces(function(){});
					}
				}
      },

      goBack: function () {
        $(window).scrollTop($(window).height());
        window.history.go(-1);
        return false;
      },

      // Handles loading a default 'no-image' as a fallback
      cancelZoom: function(element) {
        $(element).parent().removeClass('zoomContainer-CC');
      },

      //this method populates productVariantOption model to display the variant options of the product
      populateVariantOptions: function(widget) {
        var options = widget.productVariantOptions();
        if (options && options !== null && options.length > 0) {
          var optionsArray = [], productLevelOrder, productTypeLevelVariantOrder = {}, optionValues, productVariantOption, variants;
          for(var typeIdx = 0, typeLen = widget.productTypes().length; typeIdx < typeLen; typeIdx++) {
            if (widget.productTypes()[typeIdx].id == widget.product().type()) {
              variants = widget.productTypes()[typeIdx].variants;
              for (var variantIdx = 0, variantLen = variants.length; variantIdx < variantLen; variantIdx++) {
                productTypeLevelVariantOrder[variants[variantIdx].id] = variants[variantIdx].values;  
              }
            } 
          }
          for (var i = 0; i < options.length; i++) {
            if (widget.product().variantValuesOrder[options[i].optionId]) {
              productLevelOrder = widget.product().variantValuesOrder[options[i].optionId]();  
            }
            optionValues = this.mapOptionsToArray(options[i].optionValueMap, productLevelOrder ? productLevelOrder : productTypeLevelVariantOrder[options[i].optionId]);
            productVariantOption = this.productVariantModel(options[i].optionName, options[i].mapKeyPropertyAttribute, optionValues, widget, options[i].optionId);
            optionsArray.push(productVariantOption);
          }
          widget.variantOptionsArray(optionsArray);
        } else {
          widget.imgMetadata = widget.product().product.productImagesMetadata;
          widget.variantOptionsArray([]);
        }
      },

      /*this create view model for variant options this contains
      name of the option, possible list of option values for the option
      selected option to store the option selected by the user.
      ID to map the selected option*/
      productVariantModel: function(optionDisplayName, optionId, optionValues, widget, actualOptionId) {
        var productVariantOption = {};
        var productImages = {};
        productVariantOption.optionDisplayName = optionDisplayName;
        productVariantOption.parent = this;
        productVariantOption.optionId = optionId;
        productVariantOption.originalOptionValues = ko.observableArray(optionValues);
        productVariantOption.actualOptionId = actualOptionId;
        
        var showOptionCation = ko.observable(true);
        if (optionValues.length === 1) {
          showOptionCation(this.checkOptionValueWithSkus(optionId, optionValues[0].value));
        }
        //If there is just one option value in all Skus we dont need any caption
        if (showOptionCation()) {
          productVariantOption.optionCaption = widget.translate('optionCaption', {optionName: optionDisplayName}, true);
        }
        productVariantOption.selectedOptionValue = ko.observable();
        productVariantOption.countVisibleOptions = ko.computed(function() {
          var count = 0;
          for (var i = 0; i < productVariantOption.originalOptionValues().length; i++) {
            if (optionValues[i].visible() == true) {
              count = count + 1;
            }
          }
          return count;
        }, productVariantOption);
        productVariantOption.disable = ko.computed(function() {
          if (productVariantOption.countVisibleOptions() == 0) {
            return true;
          } else {
            return false;
          }
        }, productVariantOption);
        productVariantOption.selectedOption = ko.computed({
          write: function(option) {
            this.parent.filtered(false);
            productVariantOption.selectedOptionValue(option);
            if (productVariantOption.actualOptionId === this.parent.listingVariant()) {
              if (option && option.listingConfiguration) {
            	this.parent.imgMetadata = option.listingConfiguration.imgMetadata;
                this.parent.assignImagesToProduct(option.listingConfiguration);
              } else {
            	this.parent.imgMetadata = this.parent.product().product.productImagesMetadata;
                this.parent.assignImagesToProduct(this.parent.product().product);
              }
            }
            this.parent.filterOptionValues(productVariantOption.optionId);
          },
          read: function() {
            return productVariantOption.selectedOptionValue();
          },
          owner: productVariantOption
        });
        productVariantOption.selectedOption.extend({
    	  required: { params: true, message:widget.translate('optionRequiredMsg', {optionName: optionDisplayName}, true) }
        });
        productVariantOption.optionValues = ko.computed({
          write: function(value) {
            productVariantOption.originalOptionValues(value);
          },
          read: function() {
            return ko.utils.arrayFilter(
              productVariantOption.originalOptionValues(),
              function(item) { return item.visible() == true; }
            );
          },
          owner: productVariantOption
        });

        
        //The below snippet finds the product display/listing variant (if available)        
        //looping through all the product types
        for (var productTypeIdx = 0; productTypeIdx < widget.productTypes().length; productTypeIdx++) {
          //if the product type matched with the current product
          if (widget.product().type() && widget.productTypes()[productTypeIdx].id == widget.product().type()) {
            var variants = widget.productTypes()[productTypeIdx].variants;
            //Below FOR loop is to iterate over the various variant types of that productType
            for (var productTypeVariantIdx = 0; productTypeVariantIdx < variants.length; productTypeVariantIdx++) {
              //if the productType has a listingVariant == true, hence this is the product display variant
              if (variants[productTypeVariantIdx].listingVariant) {
                widget.listingVariant(variants[productTypeVariantIdx].id);
                break;
              }
            }
            break;
          }
        }
        productImages.thumbImageURLs = ( widget.product().product.thumbImageURLs.length == 1 && widget.product().product.thumbImageURLs[0].indexOf("/img/no-image.jpg&")>0 ) ? 
            [] : ( widget.product().product.thumbImageURLs );
        productImages.smallImageURLs = (widget.product().product.smallImageURLs.length == 1 && widget.product().product.smallImageURLs[0].indexOf("/img/no-image.jpg&")>0 ) ? 
            [] : ( widget.product().product.smallImageURLs );
        productImages.mediumImageURLs = ( widget.product().product.mediumImageURLs.length == 1 && widget.product().product.mediumImageURLs[0].indexOf("/img/no-image.jpg&")>0 ) ? 
            [] : ( widget.product().product.mediumImageURLs );
        productImages.largeImageURLs = ( widget.product().product.largeImageURLs.length == 1 && widget.product().product.largeImageURLs[0].indexOf("/img/no-image.jpg&")>0 ) ? 
            [] : ( widget.product().product.largeImageURLs );
        productImages.fullImageURLs = ( widget.product().product.fullImageURLs.length == 1 && widget.product().product.fullImageURLs[0].indexOf("/img/no-image.jpg&")>0 ) ? 
            [] : ( widget.product().product.fullImageURLs );
        productImages.sourceImageURLs = ( widget.product().product.sourceImageURLs.length == 1 && widget.product().product.sourceImageURLs[0].indexOf("/img/no-image.jpg")>0 ) ? 
            [] : ( widget.product().product.sourceImageURLs );
           
        var prodImgMetadata =[];
        if(widget.product().thumbImageURLs && widget.product().thumbImageURLs().length>0) {
          for(var index=0; index< widget.product().thumbImageURLs().length;index++) {
            prodImgMetadata.push(widget.product().product.productImagesMetadata[index]);
          }   
        }
        
        ko.utils.arrayForEach(productVariantOption.originalOptionValues(), function(option) {
          if (widget.listingVariant() === actualOptionId) {
            for (var childSKUsIdx = 0; childSKUsIdx < widget.product().childSKUs().length; childSKUsIdx++) {
              if (widget.product().childSKUs()[childSKUsIdx].productListingSku()) {
                var listingConfiguration = widget.product().childSKUs()[childSKUsIdx];
                if (listingConfiguration[actualOptionId]() == option.key) {
                  var listingConfig = {};
                  listingConfig.thumbImageURLs = $.merge( $.merge( [], listingConfiguration.thumbImageURLs() ), productImages.thumbImageURLs);
                  listingConfig.smallImageURLs = $.merge( $.merge( [], listingConfiguration.smallImageURLs() ), productImages.smallImageURLs);
                  listingConfig.mediumImageURLs = $.merge( $.merge( [], listingConfiguration.mediumImageURLs() ), productImages.mediumImageURLs);
                  listingConfig.largeImageURLs = $.merge( $.merge( [], listingConfiguration.largeImageURLs() ), productImages.largeImageURLs);
                  listingConfig.fullImageURLs = $.merge( $.merge( [], listingConfiguration.fullImageURLs() ), productImages.fullImageURLs);
                  listingConfig.sourceImageURLs = $.merge( $.merge( [], listingConfiguration.sourceImageURLs() ), productImages.sourceImageURLs);
                  listingConfig.primaryFullImageURL = listingConfiguration.primaryFullImageURL()? listingConfiguration.primaryFullImageURL() : widget.product().product.primaryFullImageURL;
                  listingConfig.primaryLargeImageURL= listingConfiguration.primaryLargeImageURL()? listingConfiguration.primaryLargeImageURL() : widget.product().product.primaryLargeImageURL;
                  listingConfig.primaryMediumImageURL= listingConfiguration.primaryMediumImageURL()? listingConfiguration.primaryMediumImageURL() : widget.product().product.primaryMediumImageURL;
                  listingConfig.primarySmallImageURL= listingConfiguration.primarySmallImageURL() ? listingConfiguration.primarySmallImageURL() : widget.product().product.primarySmallImageURL;
                  listingConfig.primaryThumbImageURL= listingConfiguration.primaryThumbImageURL()? listingConfiguration.primaryThumbImageURL() : widget.product().product.primaryThumbImageURL;
                 
                  //storing the metadata for the images
                  var childSKUImgMetadata =[];
                  if(listingConfiguration.images && listingConfiguration.images().length>0) {
                    for(var index=0; index< listingConfiguration.images().length;index++) {
                      childSKUImgMetadata.push(widget.product().product.childSKUs[childSKUsIdx].images[index].metadata);
                    }   
                  }
                  listingConfig.imgMetadata =  $.merge( $.merge( [], childSKUImgMetadata),prodImgMetadata);
                  option.listingConfiguration = listingConfig;
                }
              }
            }
          }
          if (widget.variantName() === actualOptionId && option.key === widget.variantValue()) {
            productVariantOption.selectedOption(option);
          }
        });

        return productVariantOption;
      },

      //this method is triggered to check if the option value is present in all the child Skus.
      checkOptionValueWithSkus : function(optionId, value) {
        var childSkus = this.product().childSKUs();
        var childSkusLength = childSkus.length;
        for (var i = 0; i < childSkusLength; i++) {
          if (!childSkus[i].dynamicPropertyMapLong[optionId] || childSkus[i].dynamicPropertyMapLong[optionId]() === undefined) {
            return true;
          }
        }
        return false;
      },

      //this method is triggered whenever there is a change to the selected option.
      filterOptionValues : function(selectedOptionId) {
        if (this.filtered()) {
          return;
        }
        var variantOptions = this.variantOptionsArray();
        for (var i = 0; i < variantOptions.length; i++) {
          var currentOption = variantOptions[i];
          var matchingSkus = this.getMatchingSKUs(variantOptions[i].optionId);
          var optionValues = this.updateOptionValuesFromSku(matchingSkus, selectedOptionId, currentOption);
          variantOptions[i].optionValues(optionValues);
          this.filtered(true);
        }
        this.updateSingleSelection(selectedOptionId);
      },

      // get all the matching SKUs
      getMatchingSKUs: function(optionId) {
        var childSkus = this.product().childSKUs();
        var matchingSkus = [];
        var variantOptions = this.variantOptionsArray();
        var selectedOptionMap = {};
        for (var j = 0; j < variantOptions.length; j++) {
          if (variantOptions[j].optionId != optionId && variantOptions[j].selectedOption() != undefined) {
            selectedOptionMap[variantOptions[j].optionId] = variantOptions[j].selectedOption().value;
          }
        }
        for (var i = 0; i < childSkus.length; i++) {
          var skuMatched = true;
          for (var key in selectedOptionMap) {
            if (selectedOptionMap.hasOwnProperty(key)) {
              if (!childSkus[i].dynamicPropertyMapLong[key] ||
                childSkus[i].dynamicPropertyMapLong[key]() != selectedOptionMap[key]) {
                skuMatched = false;
                break;
              }
            }
          }
          if (skuMatched) {
            matchingSkus.push(childSkus[i]);
          }
        }
        return matchingSkus;
      },

      //this method constructs option values for all the options other than selected option
      //from the matching skus.
      updateOptionValuesFromSku : function (skus, selectedOptionID, currentOption) {
        var optionId = currentOption.optionId;
        var options = [];
        var optionValues = currentOption.originalOptionValues();
          for (var k = 0; k < skus.length; k++) {
            var optionValue = skus[k].dynamicPropertyMapLong[optionId];
            if (optionValue!= undefined ) {
              options.push(optionValue());
            }
          }
          for (var j = 0; j < optionValues.length; j++) {
            var value = optionValues[j].value;
            var visible = false;
            var index = options.indexOf(value);
            if (index != -1) {
              visible = true;
            }
            optionValues[j].visible(visible);
          }
        return optionValues;
      },

      //This method returns true if the option passed is the only one not selected
      //and all other options are either selected or disabled.
      validForSingleSelection : function(optionId) {
        var variantOptions = this.variantOptionsArray();
        for (var j = 0; j < variantOptions.length; j++) {
          if (variantOptions[j].disable() || (variantOptions[j].optionId != optionId && variantOptions[j].selectedOption()!= undefined)) {
        	  return true;
          }
          if (variantOptions[j].optionId != optionId && variantOptions[j].selectedOption()== undefined && variantOptions[j].countVisibleOptions() == 1) {
        	  return true;
          }
        }
        return false;
      },

      //This method updates the selection value for the options wiht single option values.
      updateSingleSelection : function(selectedOptionID) {
        var variantOptions = this.variantOptionsArray();
        for (var i = 0; i < variantOptions.length; i++) {
          var optionId = variantOptions[i].optionId;
          if (variantOptions[i].countVisibleOptions() == 1 && variantOptions[i].selectedOption()== undefined && optionId != selectedOptionID ) {
            var isValidForSingleSelection = this.validForSingleSelection(optionId);
            var optionValues = variantOptions[i].originalOptionValues();
            for (var j = 0; j < optionValues.length; j++) {
              if (optionValues[j].visible() == true) {
                variantOptions[i].selectedOption(optionValues[j]);
                break;
              }
            }
          }
        }
      },

      //this method convert the map to array of key value object and sort them based on the enum value
      //to use it in the select binding of knockout
      mapOptionsToArray : function(variantOptions, order) {
        var optionArray = [];
        
        for(var idx=0, len=order.length; idx<len; idx++) {
          if (variantOptions.hasOwnProperty(order[idx])) {
            optionArray.push({ key: order[idx], value: variantOptions[order[idx]], visible: ko.observable(true) });
          }
        }        
        return optionArray;
      },

      //this method returns the selected sku in the product, Based on the options selected
      getSelectedSku : function(variantOptions) {
        var childSkus = this.product().product.childSKUs;
        var selectedSKUObj = {};
        for (var i = 0; i < childSkus.length; i++) {
          selectedSKUObj =  childSkus[i];
          for (var j = 0; j < variantOptions.length; j++) {
            if ( !variantOptions[j].disable() && childSkus[i].dynamicPropertyMapLong[variantOptions[j].optionId] != variantOptions[j].selectedOption().value ) {
              selectedSKUObj = null;
              break;
            }
          }
          if (selectedSKUObj !== null) {
            $.Topic(pubsub.topicNames.SKU_SELECTED).publish(this.product(), selectedSKUObj, variantOptions);
            return selectedSKUObj;
          }
        }
        return null;
      },

      //refreshes the prices based on the variant options selected
      refreshSkuPrice : function(selectedSKUObj) {
        if (selectedSKUObj === null) {
          if (this.product().hasPriceRange) {
            this.priceRange(true);
          } else {
            this.listPrice(this.product().listPrice());
            this.salePrice(this.product().salePrice());
            this.priceRange(false);
          }
        } else {
          this.priceRange(false);
          var skuPriceData = this.product().getSkuPrice(selectedSKUObj);
          this.listPrice(skuPriceData.listPrice);
          this.salePrice(skuPriceData.salePrice);
        }     
      },

      //refreshes the stockstatus based on the variant options selected
      refreshSkuStockStatus : function(selectedSKUObj) {
        var key;
        var orderable = true;
        var stockStatusMap = this.product().stockStatus();
        if (selectedSKUObj === null) {
          key = 'stockStatus';
        } else {
          key = selectedSKUObj.repositoryId;
          if (stockStatusMap != undefined && stockStatusMap.productSkuInventoryStatus != undefined) {
            orderable = stockStatusMap.productSkuInventoryStatus[key] > 0 ? true : false;
          }
        }
        for (var i in stockStatusMap) {
          if (i == key) {
            if ((stockStatusMap[key] == 'IN_STOCK' || 
                stockStatusMap[key] == 'PREORDERABLE' || 
                stockStatusMap[key] == 'BACKORDERABLE') && orderable) {
              this.stockStatus(true);
              this.stockState(stockStatusMap[key]);
              this.availabilityDate(this.getAvailabilityDate(key));
              if (selectedSKUObj === null)
              {
                this.stockAvailable(1);
              }            
              else
              {
                this.stockAvailable(selectedSKUObj.quantity);
              }
            } else {
              this.stockStatus(false);
              this.stockAvailable(0);
              this.stockState('OUT_OF_STOCK');
            }
            return;
          }
        }
      },

      refreshSkuData : function(selectedSKUObj) {
        this.refreshSkuPrice(selectedSKUObj);
        this.refreshSkuStockStatus(selectedSKUObj);
      },

      // this method returns the availabilityDate if present for the selected variant of the product
      getAvailabilityDate : function(pSkuId) {
        var date = null;
        var skuInventoryList = this.product().stockStatus().productSkuInventoryDetails;
        for(var i in skuInventoryList) {
          var skuInfo = skuInventoryList[i];
          if(skuInfo["catRefId"] === pSkuId) {
            date = skuInfo["availabilityDate"];
            break;
          }
        }
        return date;
      },

      // this method  returns a map of all the options selected by the user for the product
      getSelectedSkuOptions : function(variantOptions) {
        var selectedOptions = [], listingVariantImage;
        for (var i = 0; i < variantOptions.length; i++) {
          if (!variantOptions[i].disable()) {
            selectedOptions.push({'optionName': variantOptions[i].optionDisplayName, 'optionValue': variantOptions[i].selectedOption().key, 'optionId': variantOptions[i].actualOptionId, 'optionValueId': variantOptions[i].selectedOption().value});
          }
        }
        return selectedOptions;
      },
      
      // this function  assign  sku specific image for style based item
      assignSkuIMage : function(newProduct, selectedSKU) {
        var variants,listingVariantId, listingVariantValues={} ;
        for(var typeIdx = 0, typeLen = this.productTypes().length; typeIdx < typeLen; typeIdx++) {
          if (this.productTypes()[typeIdx].id == newProduct.type) {
            variants = this.productTypes()[typeIdx].variants;
            for (var variantIdx = 0 ; variantIdx < variants.length ; variantIdx++) {
              if(variants[variantIdx].listingVariant){
                listingVariantId = variants[variantIdx].id;
                listingVariantValues = variants[variantIdx].values;
                break;
              }
            }
          } 
        }
          if (newProduct.childSKUs) {
            for (var childSKUsIdx = 0; childSKUsIdx < newProduct.childSKUs.length ; childSKUsIdx++) {
              if (newProduct.childSKUs[childSKUsIdx][listingVariantId] === selectedSKU[listingVariantId]
                  && !selectedSKU.primaryThumbImageURL) {
                selectedSKU.primaryThumbImageURL = newProduct.childSKUs[childSKUsIdx].primaryThumbImageURL;
                break;
              }

            }
          }
      },
      
      allOptionsSelected: function () {
        var allOptionsSelected = true;
        if (this.variantOptionsArray().length > 0) {
          var variantOptions = this.variantOptionsArray();
          for (var i = 0; i < variantOptions.length; i++) {
            if (! variantOptions[i].selectedOption.isValid() && !variantOptions[i].disable()) {
              allOptionsSelected = false;
              this.selectedSku(null);
              break;
            }
          }
          
          if (allOptionsSelected) {
            // get the selected sku based on the options selected by the user
            var selectedSKUObj = this.getSelectedSku(variantOptions);
            if (selectedSKUObj === null) {
              return false;
            }
            this.selectedSku(selectedSKUObj);
          }
          this.refreshSkuData(this.selectedSku());
        }
        
        return allOptionsSelected;
      },
      
      quantityIsValid: function () {
        return this.itemQuantity() > 0 && this.itemQuantity() <= this.stockAvailable();
      },

      // this method validated if all the options of the product are selected
      validateAddToCart : function() {

        var AddToCartButtonFlag = this.allOptionsSelected() && this.stockStatus() && this.quantityIsValid() && (this.listPrice()!=null);
        // Requirement for configurable items. Do not allow item to be added to cart.
        if ((this.variantOptionsArray().length > 0) && this.selectedSku()) {
          AddToCartButtonFlag = AddToCartButtonFlag
              && !this.selectedSku().configurable;
        } else {
          // Check if the product is configurable. Since the product has only
          // one sku,
          // it should have the SKU as configurable.
          AddToCartButtonFlag = AddToCartButtonFlag
              && !this.product().isConfigurable();
        }
        if(!AddToCartButtonFlag) {
          $('#cc-prodDetailsAddToCart').attr( "aria-disabled","true");
        }

        return AddToCartButtonFlag;

      },

      handleChangeQuantity: function (data, event) {
        var quantity = this.itemQuantity();
        
        if (quantity < 1) {
          console.log('<= 0');
        } else if (quantity > this.stockAvailable()) {
          console.log('> orderable quantity');
        }
        
        return true;
      },

      // Sends a message to the cart to add this product
      handleAddToCart: function() {
        var variantOptions = this.variantOptionsArray();
        notifier.clearSuccess(this.WIDGET_ID);
        //get the selected options, if all the options are selected.
        var selectedOptions = this.getSelectedSkuOptions(variantOptions);

        var selectedOptionsObj = { 'selectedOptions': selectedOptions };
        
        //adding availabilityDate for product object to show in the edit summary 
        //dropdown for backorder and preorder
        var availabilityDateObj = { 'availabilityDate': this.availabilityDate()};
        var stockStateObj = { 'stockState': this.stockState()};
        

        var newProduct = $.extend(true, {}, this.product().product, selectedOptionsObj, 
                                        availabilityDateObj, stockStateObj);
        
        if(this.selectedSku() && ! this.selectedSku().primaryThumbImageURL){
          this.assignSkuIMage(newProduct, this.selectedSku());
        }
        if (this.variantOptionsArray().length > 0) {
          //assign only the selected sku as child skus
          newProduct.childSKUs = [this.selectedSku()];
        }
        
        newProduct.orderQuantity = parseInt(this.itemQuantity(), 10);
        
        $.Topic(pubsub.topicNames.CART_ADD).publishWith(
          newProduct,[{message:"success"}]);

        // To disable Add to cart button for three seconds when it is clicked and enabling again
        this.isAddToCartClicked(true);
        var self = this;
        setTimeout(enableAddToCartButton, 3000);

        function enableAddToCartButton() {
          self.isAddToCartClicked(false);
        };

        if (self.isInDialog()){
          $(".modal").modal("hide");
        }
      },
      
     /**
      * Retrieve list of spaces for a user
      */
      getSpaces : function(callback) {
        var widget = this;
        var successCB = function(result) {
          var mySpaceOptions = [];
          var joinedSpaceOptions = [];
          if (result.response.code.indexOf("200") === 0) {
            
            //spaces
            var spaces = result.items;
            spaces.forEach( function (space, index) {
              var spaceOption = {spaceid: space.spaceId,
                                 spaceNameFull: ko.observable(space.spaceName),
                                 spaceNameFormatted : ko.computed(function(){
                                   return space.spaceName + " (" + space.creatorFirstName + " " + space.creatorLastName + ")";
                                 }, widget),
                                 creatorid: space.creatorId,
                                 accessLevel: space.accessLevel,
                                 spaceOwnerFirstName: space.creatorFirstName,
                                 spaceOwnerLastName: space.creatorLastName};

              // if user created the space, add it to My Spaces, otherwise add it to Joined Spaces
              if (space.creatorId == swmRestClient.apiuserid) {
                mySpaceOptions.push(spaceOption);
              }
              else {
                joinedSpaceOptions.push(spaceOption);
              }
            });

            // sort each group alphabetically
            mySpaceOptions.sort(mySpacesComparator);
            joinedSpaceOptions.sort(joinedSpacesComparator);

            widget.spaceOptionsGrpMySpacesArr(mySpaceOptions);
            widget.spaceOptionsGrpJoinedSpacesArr(joinedSpaceOptions);

            var groups = [];
            var mySpacesGroup = {label: widget.translate('mySpacesGroupText'), children: ko.observableArray(widget.spaceOptionsGrpMySpacesArr())};
            var joinedSpacesGroup = {label: widget.translate('joinedSpacesGroupText'), children: ko.observableArray(widget.spaceOptionsGrpJoinedSpacesArr())};
            
            var createOptions = [];
            var createNewOption = {spaceid: "createnewspace", spaceNameFull: ko.observable(widget.translate('createNewSpaceOptText'))};
            createOptions.push(createNewOption);
            var createNewSpaceGroup = {label: "", children: ko.observableArray(createOptions)};

            groups.push(mySpacesGroup);
            groups.push(joinedSpacesGroup);
            groups.push(createNewSpaceGroup);
            widget.spaceOptionsArray(groups);
            widget.mySpaces( mySpaceOptions );

            if(callback){
              callback();
            }
          }
        };
        var errorCB = function(resultStr, status, errorThrown) {
        };
        
        swmRestClient.request('GET', '/swm/rs/v1/sites/{siteid}/spaces', '', successCB, errorCB, {});
      },

      // SC-4166 : ajax success/error callbacks from beforeAppear does not get called in IE9, ensure dropdown options are populated when opening dropdown
      openAddToWishlistDropdownSelector : function() {
        var widget = this;
        if (widget.spaceOptionsArray().length === 0) {
          widget.getSpaces();  
        }
      },
      // this method validates if all the options of the product are selected before allowing
      // add to space. Unlike validateAddToCart, however, it does not take into account inventory.
      validateAddToSpace : function() {
        var allOptionsSelected = true;
        if (this.variantOptionsArray().length > 0) {
          var variantOptions = this.variantOptionsArray();
          for (var i = 0; i < variantOptions.length; i++) {
            if (! variantOptions[i].selectedOption.isValid() && !variantOptions[i].disable()) {
              allOptionsSelected = false;
              break;
            }
          }
          if (allOptionsSelected) {
            // get the selected sku based on the options selected by the user
            var selectedSKUObj = this.getSelectedSku(variantOptions);
            
            var skuPriceData = this.product().getSkuPrice(selectedSKUObj);
            if (selectedSKUObj === null || skuPriceData.listPrice === null) {
              return false;
            }
          }
        }else {//if no variants are there check product listPrice is not null
            if (this .listPrice() == null) {
                return false ;
              }
           }
        
        // Requirement for configurable items. Do not allow item to be added to WL.
        if ((this.variantOptionsArray().length > 0) && this.selectedSku()) {
          allOptionsSelected = allOptionsSelected
              && !this.selectedSku().configurable;
        } else {
          // Check if the product is configurable. Since the product has only
          // one sku,
          // it should have the SKU as configurable.
          allOptionsSelected = allOptionsSelected
              && !this.product().isConfigurable();
        }
        
        // get quantity input value
        var quantityInput = this.itemQuantity();
        if (quantityInput.toString() != "") {
          if (!quantityInput.toString().match(/^\d+$/) || Number(quantityInput) < 0) {
            return false;
          }
        }
        
        var addToSpaceButtonFlag = allOptionsSelected && this.product().childSKUs().length > 0;
        if (!addToSpaceButtonFlag) {
          $('#cc-prodDetailsAddToSpace').attr( "aria-disabled","true");
        }

        return addToSpaceButtonFlag;
      },
      
      //check whether all the variant options are selected and if so, populate selectedSku with the correct sku of the product.
      //this is generic method, can be reused in validateAddToSpace and validateAddToCart in future
      validateAndSetSelectedSku: function (refreshRequired) {
        var allOptionsSelected = true;
        if (this.variantOptionsArray().length > 0) {
          var variantOptions = this.variantOptionsArray();
          for (var i = 0; i < variantOptions.length; i++) {
            if (! variantOptions[i].selectedOption.isValid() && !variantOptions[i].disable()) {
              allOptionsSelected = false;
              this.selectedSku(null);
              break;
            }
          }
          if (allOptionsSelected) {
            // get the selected sku based on the options selected by the user
            var selectedSKUObj = this.getSelectedSku(variantOptions);
            if (selectedSKUObj === null) {
              return false;
            }
            this.selectedSku(selectedSKUObj);
          }
          if (refreshRequired) {
            this.refreshSkuData(this.selectedSku());
          }
        }
        return allOptionsSelected;
      },
      
      // displays Add to Space modal
      addToSpaceClick: function(widget) {
        var variantOptions = this.variantOptionsArray();
        notifier.clearSuccess(this.WIDGET_ID);
        
        //get the selected options, if all the options are selected.
        var selectedOptions = this.getSelectedSkuOptions(variantOptions);
        var selectedOptionsObj = { 'selectedOptions': selectedOptions };
        var newProduct = $.extend(true, {}, this.product().product, selectedOptionsObj);
        newProduct.desiredQuantity = this.itemQuantity();

        if (this.variantOptionsArray().length > 0) {
          //assign only the selected sku as child skus
          newProduct.childSKUs = [this.selectedSku()];
        }
        newProduct.productPrice = (newProduct.salePrice != null) ? newProduct.salePrice : newProduct.listPrice;
        $.Topic(pubsub.topicNames.SOCIAL_SPACE_ADD).publishWith( newProduct, [{message:"success"}]);
      },
      
      // displays Add to Space modal, triggered from selector button
      addToSpaceSelectorClick: function(widget) {
        var variantOptions = this.variantOptionsArray();
        notifier.clearSuccess(this.WIDGET_ID);
        
        //get the selected options, if all the options are selected.
        var selectedOptions = this.getSelectedSkuOptions(variantOptions);
        var selectedOptionsObj = { 'selectedOptions': selectedOptions };
        var newProduct = $.extend(true, {}, this.product().product, selectedOptionsObj);
        newProduct.desiredQuantity = this.itemQuantity();

        if (this.variantOptionsArray().length > 0) {
          //assign only the selected sku as child skus
          newProduct.childSKUs = [this.selectedSku()];
        }
        newProduct.productPrice = (newProduct.salePrice != null) ? newProduct.salePrice : newProduct.listPrice;
        $.Topic(pubsub.topicNames.SOCIAL_SPACE_SELECTOR_ADD).publishWith( newProduct, [{message:"success"}]);
      },
      
      // automatically add product to selected space
      addToSpaceSelect: function(widget, spaceId) {
        var variantOptions = this.variantOptionsArray();
        notifier.clearSuccess(this.WIDGET_ID);
        
        //get the selected options, if all the options are selected.
        var selectedOptions = this.getSelectedSkuOptions(variantOptions);
        var selectedOptionsObj = { 'selectedOptions': selectedOptions };
        var newProduct = $.extend(true, {}, this.product().product, selectedOptionsObj);
        newProduct.desiredQuantity = this.itemQuantity();

        if (this.variantOptionsArray().length > 0) {
          //assign only the selected sku as child skus
          newProduct.childSKUs = [this.selectedSku()];
        }
        newProduct.productPrice = (newProduct.salePrice != null) ? newProduct.salePrice : newProduct.listPrice;
        $.Topic(pubsub.topicNames.SOCIAL_SPACE_ADD_TO_SELECTED_SPACE).publishWith( newProduct, [spaceId]);
      },
      
      /**
       * Fetch Facebook app id
       */
      fetchFacebookAppId: function() {
        var widget = this;
        var serverType = CCConstants.EXTERNALDATA_PRODUCTION_FACEBOOK;
        if (widget.isPreview()){
          serverType = CCConstants.EXTERNALDATA_PREVIEW_FACEBOOK; 
        }
        ccRestClient.request(CCConstants.ENDPOINT_MERCHANT_GET_EXTERNALDATA,
            null, widget.fetchFacebookAppIdSuccessHandler.bind(widget),
            widget.fetchFacebookAppIdErrorHandler.bind(widget),
            serverType);
      },
      
      /**
       * Fetch Facebook app id successHandler, update local and global scope data
       */
      fetchFacebookAppIdSuccessHandler: function(pResult){
        var widget = this;
        widget.siteFbAppId(pResult.serviceData.applicationId);
        
        //if (widget.siteFbAppId()) {
        //  facebookSDK.init(widget.siteFbAppId());
        //}
      },
      
      /**
       * Fetch Facebook app id error handler
       */
      fetchFacebookAppIdErrorHandler: function(pResult){
        logger.debug("Failed to get Facebook appId.", result);
      },
      
      // Share product to FB
      shareProductFbClick: function() {
        var widget = this;
        
    		// open fb share dialog
        var protocol = window.location.protocol;
        var host = window.location.host;
        var productUrlEncoded = encodeURIComponent(protocol + "//" + host + widget.product().route());
      
        var appID = widget.siteFbAppId();
        // NOTE: Once we can support the Facebook Crawler OG meta-tags, then we should try and use the newer Facebook Share Dialog URL
        //       (per https://developers.facebook.com/docs/sharing/reference/share-dialog).  Until then, we will use a legacy
        //       share URL.  Facebook may eventually not support this older URL, so would be good to replace it as soon as possible.
        //var fbShareUrl = "https://www.facebook.com/dialog/share?app_id=" + appID + "&display=popup&href=" + spaceUrlEncoded + "&redirect_uri=https://www.facebook.com";
        var fbShareUrl = "https://www.facebook.com/sharer/sharer.php?app_id=" + appID + "&u=" + productUrlEncoded;
        var facebookWin = window.open(fbShareUrl, 'facebookWin', 'width=720, height=500');
        if(facebookWin){
          facebookWin.focus();
        }
      },
      
      // Share product to Twitter
      shareProductTwitterClick: function() {
        var widget = this;
        var productNameEncoded = encodeURIComponent(widget.product().displayName());
        var protocol = window.location.protocol;
        var host = window.location.host;
        var productUrlEncoded = encodeURIComponent(protocol + "//" + host + widget.product().route());
        var twitterWin = window.open('https://twitter.com/share?url=' + productUrlEncoded + '&text=' + productNameEncoded, 'twitterWindow', 'width=720, height=500');
        if(twitterWin){
          twitterWin.focus();
        }
      },

      // Share product to Pinterest
      shareProductPinterestClick: function() {
        var widget = this;
        var productNameEncoded = encodeURIComponent(widget.product().displayName());
        var protocol = window.location.protocol;
        var host = window.location.host;
        var productUrlEncoded = encodeURIComponent(protocol + "//" + host + widget.product().route());
        var productMediaEncoded = encodeURIComponent(protocol + "//" + host + widget.product().primaryLargeImageURL());
        
        var pinterestWin = window.open('https://pinterest.com/pin/create/button/?url=' + productUrlEncoded + '&description=' + productNameEncoded + '&media=' + productMediaEncoded, 'pinterestWindow', 'width=720, height=500');
        if(pinterestWin){
          pinterestWin.focus();
        }
      },
      
      // Share product by Email
      shareProductEmailClick: function() {
        var widget = this;
        var mailto = [];
        var protocol = window.location.protocol;
        var host = window.location.host;
        var productUrl = protocol + "//" + host + widget.product().route();
        mailto.push("mailto:?");
        mailto.push("subject=");
        mailto.push(encodeURIComponent(widget.translate('shareProductEmailSubject', {'productName': widget.product().displayName()})));
        mailto.push("&body=");
        var body = [];
        body.push(widget.translate('shareProductEmailBodyIntro', {'productName': widget.product().displayName()}));
        body.push("\n\n");
        body.push(productUrl);
        mailto.push(encodeURIComponent(body.join("")));
        window.location.href = mailto.join("");
      },

      handleLoadEvents: function(eventName) {
        if (eventName.toUpperCase() === LOADING_EVENT) {
          spinner.create(productLoadingOptions);
          $('#cc-product-spinner').css('z-index', 1);
        } else if (eventName.toUpperCase() === LOADED_EVENT) {
          this.removeSpinner();
        }
      },
      // Loads the Magnifier and/or Viewer, when required
      loadImage: function() {
        if(resourcesAreLoaded) {
          var contents = $('#cc-image-viewer').html();
          if (!contents) {
            if (this.viewportWidth() > CCConstants.VIEWPORT_TABLET_UPPER_WIDTH) {
              this.loadMagnifier();
            } else if (this.viewportWidth() >= CCConstants.VIEWPORT_TABLET_LOWER_WIDTH) {
              this.loadZoom();
            } else {
              //Load zoom on carousel
              this.loadCarouselZoom();
            }
          } else {
            this.loadViewer(this.handleLoadEvents.bind(this));
          }
        } else if (resourcesNotLoadedCount++ < resourcesMaxAttempts) {
          setTimeout(this.loadImage,500);
        }
      },

      groupImages: function(imageSrc) {
        var self = this;
        var images = [];
        if (imageSrc) {
          for (var i = 0; i < imageSrc.length; i++) {
            if (i % 4 == 0) {
              images.push(ko.observableArray([imageSrc[i]]));
            } else {
              images[images.length - 1]().push(imageSrc[i]);
            }
          }
        }
        return images;
      },

      handleCarouselArrows: function(data, event) {
        // Handle left key
        if (event.keyCode == 37) {
          $('#prodDetails-imgCarousel').carousel('prev');
        }
        // Handle right key
        if (event.keyCode == 39) {
          $('#prodDetails-imgCarousel').carousel('next');
        }
      },

      handleCycleImages: function(data, event, index, parentIndex) {
        var absoluteIndex = index + parentIndex * 4;
        // Handle left key
        if (event.keyCode == 37) {
          if (absoluteIndex == 0) {
            $('#prodDetails-imgCarousel').carousel('prev');
            $('#carouselLink' + (this.product().thumbImageURLs.length - 1)).focus();
          } else if (index == 0) {
            // Go to prev slide
            $('#prodDetails-imgCarousel').carousel('prev');
            $('#carouselLink' + (absoluteIndex - 1)).focus();
          } else {
            $('#carouselLink' + (absoluteIndex - 1)).focus();
          }
        }
        // Handle right key
        if (event.keyCode == 39) {
          if (index == 3) {
            $('#prodDetails-imgCarousel').carousel('next');
            $('#carouselLink' + (absoluteIndex + 1)).focus();
          } else if (absoluteIndex == (this.product().thumbImageURLs.length - 1) ) {
            // Extra check when the item is the last item of the carousel
            $('#prodDetails-imgCarousel').carousel('next');
            $('#carouselLink0').focus();
          } else {
            $('#carouselLink' + (absoluteIndex + 1)).focus();
          }
        }
      },

      loadImageToMain: function(data, event, index) {
        this.activeImgIndex(index);
        this.mainImgUrl(this.product().fullImageURLs[index]);

        return false;
      },

      assignImagesToProduct : function(pInput) {
        if (this.firstTimeRender == true) {
          this.product().primaryFullImageURL(pInput.primaryFullImageURL);
          this.product().primaryLargeImageURL(pInput.primaryLargeImageURL);
          this.product().primaryMediumImageURL(pInput.primaryMediumImageURL);
          this.product().primarySmallImageURL(pInput.primarySmallImageURL);
          this.product().primaryThumbImageURL(pInput.primaryThumbImageURL);
          this.firstTimeRender=false;
        }
        
        this.product().thumbImageURLs(pInput.thumbImageURLs);
        this.product().smallImageURLs(pInput.smallImageURLs);
        this.product().mediumImageURLs(pInput.mediumImageURLs);
        this.product().largeImageURLs(pInput.largeImageURLs);
        this.product().fullImageURLs([]);
        this.product().fullImageURLs(pInput.fullImageURLs);
        this.product().sourceImageURLs(pInput.sourceImageURLs);
        
        this.mainImgUrl(pInput.primaryFullImageURL);
        this.imgGroups(this.groupImages(pInput.thumbImageURLs));
        this.activeImgIndex(0);
        this.activeImgIndex.valueHasMutated();
      },
      
      checkResponsiveFeatures : function(viewportWidth) {
        if(viewportWidth > 978) {
          this.isMobile(false);
        }   
        else if(viewportWidth <= 978){
          this.isMobile(true);
        }
      },
      priceUnavailableText : function() {
          return CCi18n.t('ns.productdetails:resources.priceUnavailable');
      },
      isInDialog : function(){
        return $("#CC-prodDetails-addToCart").closest(".modal").length;
      }
    };
  }
);
