/**
 * @fileoverview Mega Menu Widget.
 *
 */
define(
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['jquery', 'knockout', 'ccConstants', 'notifications', 'pubsub', 'CCi18n','spinner'],
  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function ($, ko, CCConstants, notifications, pubsub, CCi18n,spinner) {

    "use strict";

    return {

      categories: ko.observableArray(),
      // Spinner resources
      catalogMenuBlock: '#CC-megaMenu',
      menuOptions: {
        parent: '#CC-megaMenu',
        posTop: '40px',
        posLeft: '30%'
      },
      
      onLoad: function(widget) {

        widget.categories.isData = true;
        widget.menuName = 'CC-CategoryNav';

        widget.isMobile = ko.observable(false);
        
        $(window).resize(function(){
          widget.checkResponsiveFeatures($(window).width());
        });
        $(document).on('mouseover','li.cc-desktop-dropdown', function() {
          $(this).children('ul.dropdown-menu').css({'display': 'block', 'top': 'auto'});
          if (navigator.userAgent.indexOf("Firefox") != -1) {
            $("#CC-product-listing-sortby-controls select.form-control").hide();
          }
          else {
            $("#CC-product-listing-sortby-controls select.form-control").css('visibility', 'hidden');
          }
        });
        $(document).on('mouseout','li.cc-desktop-dropdown', function() {
          $(this).children('ul.dropdown-menu').css({'display': 'none'});
          if (navigator.userAgent.indexOf("Firefox") != -1) {
            $("#CC-product-listing-sortby-controls select.form-control").show();
          }
          else {
            $("#CC-product-listing-sortby-controls select.form-control").css('visibility', 'visible');
          }
        });
        $(document).on('keydown','a.Level1', function (event) {
            if (event.which === 9 && event.shiftKey) {
              $(this).next('ul.dropdown-menu').css({'display': 'none'}); 
            } else if (event.which == 27) {
              $(this).next('ul.dropdown-menu').css({'display': 'none'}); 
            } else if (event.which == 9) {
              $(this).next().children('a.Level2').parents('ul.dropdown-menu').css({'display': 'block', 'top': 'auto'});
            } else if (event.which == 13) {
              $(this).next('ul.dropdown-menu').css({'display': 'none'});  
            }
        });
        $(document).on('keydown','a.Level2', function (event) {
          if (event.which == 27) {
            $(this).parents('ul.dropdown-menu').css({'display': 'none'}); 
          } else if (event.which == 9) {
            $(this).next().children('a.Level3').parents('ul.dropdown-menu').css({'display': 'block', 'top': 'auto'});
          } else if (event.which == 13) {
            $(this).parents('ul.dropdown-menu').css({'display': 'none'});  
          }
        });
        $(document).on('keydown','a.Level3', function (event) {
          if (event.which == 27) {
            $(this).parents('ul.dropdown-menu').css({'display': 'none'});
          } else if (event.which == 9) {
            if ($(this).parent('li').next('li').children('a.Level3').length !=0 || $(this).parents('div.child-category-container').next('div.child-category-container').children('a.Level2').length !=0) {
            } else {
              $(this).parents('ul.dropdown-menu').parent('li.cc-desktop-dropdown').next('li.cc-desktop-dropdown').focus();
            }
          } else if (event.which == 13 && navigator.userAgent.indexOf("MSIE") == -1 && !navigator.userAgent.match(/Trident.*rv\:11\./)) {
            $(this).parents('ul.dropdown-menu').css({'display': 'none'});
          }
        });
        $(document).on('blur','a.Level3', function (event) {
          if ($(this).parent('li').next('li').children('a.Level3').length !=0 || $(this).parents('div.child-category-container').next('div.child-category-container').children('a.Level2').length !=0) {
          } else {
            $(this).parents('ul.dropdown-menu').css({'display': 'none'}); 
          } 
        });
        $(document).on('focus','li.cc-desktop-dropdown', function () {
          $(this).children('ul.dropdown-menu').css({'display': 'block', 'top': 'auto'});
        });
        if(widget.user()!= undefined && widget.user().catalogId) {
          widget.catalogId(widget.user().catalogId());
        }
        widget.setCategoryList();  






/**
 * jQuery Masonry v2.1.08
 * A dynamic layout plugin for jQuery
 * The flip-side of CSS Floats
 * http://masonry.desandro.com
 *
 * Licensed under the MIT license.
 * Copyright 2012 David DeSandro
 */
(function(e,t,n){"use strict";var r=t.event,i;r.special.smartresize={setup:function(){t(this).bind("resize",r.special.smartresize.handler)},teardown:function(){t(this).unbind("resize",r.special.smartresize.handler)},handler:function(e,t){var n=this,s=arguments;e.type="smartresize",i&&clearTimeout(i),i=setTimeout(function(){r.dispatch.apply(n,s)},t==="execAsap"?0:100)}},t.fn.smartresize=function(e){return e?this.bind("smartresize",e):this.trigger("smartresize",["execAsap"])},t.Mason=function(e,n){this.element=t(n),this._create(e),this._init()},t.Mason.settings={isResizable:!0,isAnimated:!1,animationOptions:{queue:!1,duration:500},gutterWidth:0,isRTL:!1,isFitWidth:!1,containerStyle:{position:"relative"}},t.Mason.prototype={_filterFindBricks:function(e){var t=this.options.itemSelector;return t?e.filter(t).add(e.find(t)):e},_getBricks:function(e){var t=this._filterFindBricks(e).css({position:"absolute"}).addClass("masonry-brick");return t},_create:function(n){this.options=t.extend(!0,{},t.Mason.settings,n),this.styleQueue=[];var r=this.element[0].style;this.originalStyle={height:r.height||""};var i=this.options.containerStyle;for(var s in i)this.originalStyle[s]=r[s]||"";this.element.css(i),this.horizontalDirection=this.options.isRTL?"right":"left";var o=this.element.css("padding-"+this.horizontalDirection),u=this.element.css("padding-top");this.offset={x:o?parseInt(o,10):0,y:u?parseInt(u,10):0},this.isFluid=this.options.columnWidth&&typeof this.options.columnWidth=="function";var a=this;setTimeout(function(){a.element.addClass("masonry")},0),this.options.isResizable&&t(e).bind("smartresize.masonry",function(){a.resize()}),this.reloadItems()},_init:function(e){this._getColumns(),this._reLayout(e)},option:function(e,n){t.isPlainObject(e)&&(this.options=t.extend(!0,this.options,e))},layout:function(e,t){for(var n=0,r=e.length;n<r;n++)this._placeBrick(e[n]);var i={};i.height=Math.max.apply(Math,this.colYs);if(this.options.isFitWidth){var s=0;n=this.cols;while(--n){if(this.colYs[n]!==0)break;s++}i.width=(this.cols-s)*this.columnWidth-this.options.gutterWidth}this.styleQueue.push({$el:this.element,style:i});var o=this.isLaidOut?this.options.isAnimated?"animate":"css":"css",u=this.options.animationOptions,a;for(n=0,r=this.styleQueue.length;n<r;n++)a=this.styleQueue[n],a.$el[o](a.style,u);this.styleQueue=[],t&&t.call(e),this.isLaidOut=!0},_getColumns:function(){var e=this.options.isFitWidth?this.element.parent():this.element,t=e.width();this.columnWidth=this.isFluid?this.options.columnWidth(t):this.options.columnWidth||this.$bricks.outerWidth(!0)||t,this.columnWidth+=this.options.gutterWidth,this.cols=Math.floor((t+this.options.gutterWidth)/this.columnWidth),this.cols=Math.max(this.cols,1)},_placeBrick:function(e){var n=t(e),r,i,s,o,u;r=Math.ceil(n.outerWidth(!0)/this.columnWidth),r=Math.min(r,this.cols);if(r===1)s=this.colYs;else{i=this.cols+1-r,s=[];for(u=0;u<i;u++)o=this.colYs.slice(u,u+r),s[u]=Math.max.apply(Math,o)}var a=Math.min.apply(Math,s),f=0;for(var l=0,c=s.length;l<c;l++)if(s[l]===a){f=l;break}var h={top:a+this.offset.y};h[this.horizontalDirection]=this.columnWidth*f+this.offset.x,this.styleQueue.push({$el:n,style:h});var p=a+n.outerHeight(!0),d=this.cols+1-c;for(l=0;l<d;l++)this.colYs[f+l]=p},resize:function(){var e=this.cols;this._getColumns(),(this.isFluid||this.cols!==e)&&this._reLayout()},_reLayout:function(e){var t=this.cols;this.colYs=[];while(t--)this.colYs.push(0);this.layout(this.$bricks,e)},reloadItems:function(){this.$bricks=this._getBricks(this.element.children())},reload:function(e){this.reloadItems(),this._init(e)},appended:function(e,t,n){if(t){this._filterFindBricks(e).css({top:this.element.height()});var r=this;setTimeout(function(){r._appended(e,n)},1)}else this._appended(e,n)},_appended:function(e,t){var n=this._getBricks(e);this.$bricks=this.$bricks.add(n),this.layout(n,t)},remove:function(e){this.$bricks=this.$bricks.not(e),e.remove()},destroy:function(){this.$bricks.removeClass("masonry-brick").each(function(){this.style.position="",this.style.top="",this.style.left=""});var n=this.element[0].style;for(var r in this.originalStyle)n[r]=this.originalStyle[r];this.element.unbind(".masonry").removeClass("masonry").removeData("masonry"),t(e).unbind(".masonry")}},t.fn.imagesLoaded=function(e){function u(){e.call(n,r)}function a(e){var n=e.target;n.src!==s&&t.inArray(n,o)===-1&&(o.push(n),--i<=0&&(setTimeout(u),r.unbind(".imagesLoaded",a)))}var n=this,r=n.find("img").add(n.filter("img")),i=r.length,s="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",o=[];return i||u(),r.bind("load.imagesLoaded error.imagesLoaded",a).each(function(){var e=this.src;this.src=s,this.src=e}),n};var s=function(t){e.console&&e.console.error(t)};t.fn.masonry=function(e){if(typeof e=="string"){var n=Array.prototype.slice.call(arguments,1);this.each(function(){var r=t.data(this,"masonry");if(!r){s("cannot call methods on masonry prior to initialization; attempted to call method '"+e+"'");return}if(!t.isFunction(r[e])||e.charAt(0)==="_"){s("no such method '"+e+"' for masonry instance");return}r[e].apply(r,n)})}else this.each(function(){var n=t.data(this,"masonry");n?(n.option(e||{}),n._init()):t.data(this,"masonry",new t.Mason(e,this))});return this}})(window,jQuery);



$(document).on('mouseover', 'li', function(){
  $(this).find('.lvl3-Masonry').masonry({
    itemSelector: '.menu-item-9000',
    columnWidth: 200
  });
});

      },//End onLoad



      



      /**
       * Updates categories if user catalog changes.
       */
      beforeAppear: function (page) {
        var widget = this;

        if(ko.isObservable(widget.user) && widget.user() &&
           ko.isObservable(widget.user().catalogId) && widget.user().catalogId()) {
          if(widget.user().catalogId() != widget.catalogId()) {
            widget.categories('');
            widget.createSpinner();
            widget.catalogId(widget.user().catalogId());
            widget.setCategoryList();
            widget.destroySpinner();
          }
        }
      },

      /**
       * Get the categories for the catalog and set it to the widget.
       */
      setCategoryList : function() {
    	var widget = this;
        //Load the categoryList
        widget.load('categoryList',
        [widget.rootCategoryId(), widget.catalogId(), 1000, widget.fields()],
        function(result) {

          widget.checkResponsiveFeatures($(window).width());
          
          var level, i, arraySize, maxElementCount; 
          level = 1;
          arraySize = result.length;
          maxElementCount = parseInt(widget.maxNoOfElements(),1000);
           
          if ( arraySize > maxElementCount){
            arraySize = maxElementCount;
            result = result.slice(0, maxElementCount );
          }
          // loop round the maximum number of time
          for (i = 0; i < arraySize; i+=1) {
            widget.setUiIdentifier(result[i], widget.menuName, level, i, widget.navigationCategoryClick, maxElementCount);
            widget.setAriaLabelText(result[i]);
          }
            
          widget.categories(result);  
        },
        widget);    	  
      },

      /**
       * Destroy spinner.
       */
      destroySpinner : function() {
        var widget = this;
        $(widget.catalogMenuBlock).removeClass('loadingIndicator');
        spinner.destroy(1);
      },

      /**
       * Creates spinner.
       */
      createSpinner : function() {
        var widget = this;
        $(widget.catalogMenuBlock).css('position','relative');
        widget.menuOptions.loadingText = 'Loading';
        spinner.create(widget.menuOptions);
      },
      
      /**
       * Menu items click event used to set focus to product listing result section
       * 
       * data - knockout data 
       * event - event data
       */
      catMenuClick: function(data, event) {
        $.Topic(pubsub.topicNames.OVERLAYED_GUIDEDNAVIGATION_HIDE).publish([{message: "success"}]);
        $.Topic(pubsub.topicNames.UPDATE_FOCUS).publishWith({WIDGET_ID: "productListing"}, [{message: "success"}]);
        return true;
      },
      stripTags: function (input1, input2){
        var input = input1;
        if(input1 == null) input = input2;

        var div = document.createElement("div");
        div.innerHTML = input;
        return div.textContent || div.innerText || "";
      },

      checkResponsiveFeatures : function(viewportWidth) {
        if(viewportWidth > 978) {
          this.isMobile(false);
        }   
        else if(viewportWidth <= 978){
          this.isMobile(true);
        }
      },

      /**
     * Recursive function to traverses the collection and set a UI Identifier
     * 
     * pCurrCollection - the current collection
     * pCollectionsArray - the array to hold all the collections
     * pLevel - the level we are currently at in the tree.
     * pCount - the current count
     * pKeypressFunc - the key press function to execute
     * pSubmenuClickFunc - the sub drop down menu click function, used to display the drop down submenu 
     * pOtherClick - the click function for other menu items, used to clear the drop down submenu
     * pMaxElementCount - the maximum number of categories to display.   
     */ 
    setUiIdentifier: function( pCurrCollection, pMenuName, pLevel, pCount, pSubmenuClickFunc, pMaxElementCount){
      
      var children, element, child, maxIterations ;
        
      pCurrCollection.uiIdentifier = pMenuName  + '_' + (pCount + 1).toString() ; 
      pCurrCollection.level = pLevel;
      pCurrCollection.itemIndex = pCount + 1;
      pCurrCollection.hasChildCategories = false;
      pCurrCollection.levelClass = 'Level' + pLevel.toString();
      
      // add the functions to the object so we can access them on the template
      // because this is recursive it is difficult to access the function via knockout 
      pCurrCollection.subSubmenuClickFunc = pSubmenuClickFunc;
      
      children = pCurrCollection.childCategories;
      
      if ((typeof(children) !== "undefined") && (children !== null)) {
        
        pCurrCollection.hasChildCategories = true;
        maxIterations = children.length;
                  
        if ( maxIterations > pMaxElementCount){
          maxIterations = pMaxElementCount;
          
          pCurrCollection.childCategories = pCurrCollection.childCategories.slice(0, pMaxElementCount );
        }
        // loop round the maximum number of time
        for (var i = 0; i < maxIterations; i+=1) {
          child = pCurrCollection.childCategories[i];
          this.setUiIdentifier(child, pMenuName + '_' + (pCount + 1).toString(), pLevel + 1, i, pSubmenuClickFunc, pMaxElementCount);
          this.setAriaLabelText(child);
          
        }
      }
    },    
    /**
     * Recursive function to traverses the collection and set a aria label atribute
     * 
     * pCurrCollection - the current collection
     */
    setAriaLabelText: function( pCurrCollection){
       
      var children = pCurrCollection.childCategories;
      if ((typeof(children) !== "undefined") && (children !== null)) {
        pCurrCollection.ariaLabelText =  CCi18n.t('ns.megaMenu:resources.categoryNavScreenReaderText', 
                  {categoryLength: children.length, displayName:pCurrCollection.displayName}); 
      }else{
        pCurrCollection.ariaLabelText =  CCi18n.t('ns.megaMenu:resources.noSubCategoriesText', 
                  {displayName:pCurrCollection.displayName}); 
      }
    },
    /**
     * sub sub menu click event - key press event handle
     * 
     * data - knockout data 
     * event - event data
     */ 
    navigationCategoryClick : function(data, event) {
      notifications.emptyGrowlMessages();
      var $this, parent;
      
      event.stopPropagation();
      
      $this = $(event.target).parent("li");
      parent = $this.parent().parent();
      
      if ($(event.target).parent().hasClass('dropdown-submenu') ) {
        event.preventDefault();
      }
      
      if($this.hasClass('open')) {
        // Closes previously open categories
        $this.removeClass('open').addClass('closed');

      } else {
        if(parent.hasClass('open')) {
          $('.dropdown-submenu.open').removeClass('open').addClass('closed');
          if($this.hasClass('closed')) {
            // Opens a previously closed category
            $this.removeClass('closed').addClass('open');
            return false;
          } else {
            $this.removeClass('open').addClass('closed');
          }
        }
      }
      
      return true;
    },

    megaMenuClick : function (data, event) {
      notifications.emptyGrowlMessages();
      $.Topic(pubsub.topicNames.OVERLAYED_GUIDEDNAVIGATION_HIDE).publish([{message: "success"}]);  
      event.stopPropagation();
      return true;
    }
    
  };
});
