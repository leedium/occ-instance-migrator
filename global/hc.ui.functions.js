/**
 * @fileoverview Common User Interface Functions.
 *  Global winddow hc object
 *  use $.extend(window.hc,{object}) to add to it
 */
define(
    //-------------------------------------------------------------------
    // DEPENDENCIES
    //-------------------------------------------------------------------
    ['jquery', 'knockout', 'ccLogger', 'ccRestClient', 'ccConstants'],

    //-------------------------------------------------------------------
    // Module definition
    //-------------------------------------------------------------------

    function ($, ko, CCLogger, CCRestClient, CCConstants) {
        'use strict';


        //Detect Opera Mini, and show a message.
        // var isOpera = (
        //     window.opera |
        //     window.opr |
        //     (navigator.userAgent.indexOf(' OPR/') > 1 ) |
        //     (navigator.userAgent.indexOf(' Coast/') > 1 ) |
        //     (navigator.userAgent.indexOf(' OPiOS/') > 1 )
        // ) == 1;

        // if(isOpera)
        //     //alert('We detected you are using Opera Mini, please use another browser, or turn off your data saving option, this website won\'t charget you data in South Africa.');
        //     document.getElementsByTagName("BODY")[0].innerHTML = 'We detected you are using Opera Mini, please use another browser.';

//document.getElementsByTagName("BODY")[0].innerHTML = navigator.userAgent;
        /**
         * This logic hijacks the native dropdown implementation and
         * make it an overlay
         * @type {*|jQuery|HTMLElement}
         */
        var $window = $(window);
        var MOBILE_DROPDOWN_OPEN = 'select_mobile_overlay_open';
        //Select Box Override
        var $container = $('body');
        $container.on('mousedown', 'select', function (e) {
            if ($window.width() <= CCConstants.VIEWPORT_TABLET_UPPER_WIDTH) {
                e.preventDefault();
                var scrollPoint = $window.scrollTop();
                var page = document.getElementById('page');
                var $select = $(this);
                var $title = $select.parent().find('label');
                    $title = $title.length > 0 ? $title : $select.parent().parent().find('label');
                    $title = $title.length > 0 ? $title : [{innerText: ''}];
                var selectMobileOverlay = $('<div class="select-mobile-overlay"></div>');
                var btnBack = $('<button class="select-mobile-overlay__back-btn"></i><span>Back</span></button>')
                    .on('click', function onBtnBack() {
                        btnBack.off('click', onBtnBack);
                        close();
                    });
                var optionTitle = ('<h3>' + ($title[0].innerText || '') + '</h3>');
                var selectMobileOverlayContainer = $('<div class="select-mobile-overlay__container container"></div>')
                var close = function () {
                    setTimeout(function () {
                        selectMobileOverlayContainer.off('click','**');
                        $container.removeClass(MOBILE_DROPDOWN_OPEN);
                        selectMobileOverlayContainer.remove();
                        selectMobileOverlay.remove();
                        $window.scrollTop(scrollPoint);
                    }, 150);
                };

                for (var i = 0; i < $select[0].options.length; i++) {
                    var option = $select[0].options[i];
                    var label = option.label.toLowerCase();
                    if (label.indexOf('select') < 0 && label.indexOf('...') < 0 && label.indexOf('expiry') < 0) {
                        selectMobileOverlayContainer.append('<div data-option-index="' + option.index + '" class="select-mobile-overlay__row ' + (option.selected ? ' option-selected' : '') + '"><div class="select-mobile-overlay__option-item col-xs-10"><span>' + option.label + '</span></div><div class="col-xs-2"><div class="select-mobile-overlay__option"></div></div></div>');
                    }
                }
                selectMobileOverlayContainer.on('click', '.select-mobile-overlay__row', function onRowClick(e) {
                    selectMobileOverlayContainer.find('.option-selected').removeClass('option-selected');
                    $(this).addClass('option-selected');
                    $select[0].selectedIndex = parseInt(e.currentTarget.getAttribute('data-option-index'));
                    $select.change();
                    close();
                });

                $container.append(selectMobileOverlay.append(btnBack, optionTitle, selectMobileOverlayContainer));
                try {
                    $(document).scrollTop($('.select-mobile-overlay__row.option-selected').offset().top - 100);
                }catch(err){
                    //most likely nothing selected;
                    $(document).scrollTop(0);
                }
                $container.addClass(MOBILE_DROPDOWN_OPEN);
                return false;
            }
        });


        //Polyfills
        /////Object.assign()
        /////https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
        if (typeof Object.assign != 'function') {
            // Must be writable: true, enumerable: false, configurable: true
            Object.defineProperty(Object, "assign", {
                value: function assign(target, varArgs) { // .length of function is 2
                    'use strict';
                    if (target == null) { // TypeError if undefined or null
                        throw new TypeError('Cannot convert undefined or null to object');
                    }

                    var to = Object(target);

                    for (var index = 1; index < arguments.length; index++) {
                        var nextSource = arguments[index];

                        if (nextSource != null) { // Skip over if undefined or null
                            for (var nextKey in nextSource) {
                                // Avoid bugs when hasOwnProperty is shadowed
                                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                    to[nextKey] = nextSource[nextKey];
                                }
                            }
                        }
                    }
                    return to;
                },
                writable: true,
                configurable: true
            });
        }

        //Global hc object for shared resources
        window.hc = {};

        /**
         * Use as replacement for setInterval
         * @param delay
         * @param fn
         * @returns {{}}
         */
        window.requestInterval = function (delay, fn) {
            var start = Date.now();
            var data = {};
            data.id = requestAnimationFrame(loop);

            return data;

            function loop() {

                data.id = requestAnimationFrame(loop);
                if (Date.now() - start >= delay) {
                    fn();
                    start = Date.now();
                }
            }
        };

        /**
         * use as replacement for clearInterval
         * @param data
         */
        window.clearRequestInterval = function (data) {
            cancelAnimationFrame(data.id);
        };

        /**
         * use as replacement for requestTimeout
         * @param delay
         * @param fn
         * @param ctx
         * @returns {any}
         */
        window.requestTimeout = function (delay, fn, ctx) {
            var start = new Date().getTime();
            var data = Object.create(null);
            data.id = requestAnimationFrame(loop);

            return data;

            function loop() {
                (new Date().getTime() - start) >= delay
                    ? fn.call(ctx)
                    : data.id = requestAnimationFrame(loop);
            }
        };

        /**
         * Use as replacement for clearRequestTimeout
         * @param data
         */
        window.clearRequestTimeout = function (data) {
            cancelAnimationFrame(data.id);
        };


        //TEMPLATES FOR THE PRODUCT BADGES
        // Used in the collections carousel, related products carousel
        var saleBadgeString = '<span class="hc-product-badge hc-product-badge__onsale">Sale</span>';
        var newBadgeString = '<span  class="hc-product-badge hc-product-badge__new">New</span>';
        var inStockBadgeString = '<span class="hc-product-badge hc-product-badge__in-stock">In Stock</span>';
        var outOufStockBadgeString = '<span class="hc-product-badge hc-product-badge__out-of-stock">Out of Stock</span>';


        ////////Custom inline template bindings
        ko.bindingHandlers['let'] = {
            'init': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                // Make a modified binding context, with extra properties, and apply it to descendant elements
                var innerContext = bindingContext.extend(valueAccessor);
                ko.applyBindingsToDescendants(innerContext, element);

                return {controlsDescendantBindings: true};
            }
        };
        //////////


        ko.virtualElements.allowedBindings['let'] = true;

        return {

            /////UI HELPERS
            /**
             * returns a series of badges for each product within a div element
             * @param model - a model you pass through
             * @param showStock - boolean to show product
             * @returns HTML markup for the badges
             *  Usage in template
             *  : Example:
             *            <!-- ko if:  hc.getProductBadges-->
             <div class="hc-product-badge--container" data-bind="onRender: hc.getProductBadges($data,true, $element )"></div>
             <!-- /ko -->
             */
            getProductBadges: function (productData, showStock, el) {
                var badgeString = '';

                if (productData.product.hc_new) {
                    badgeString += newBadgeString;
                }

                if (productData.product.hc_sale) {
                    badgeString += saleBadgeString;
                }

                if (showStock) {
                    $.ajax({
                        url: "/ccstoreui/v1/stockStatus/" + productData.product.id,
                        method: "GET",
                        headers: CCRestClient.previewMode ? {
                            "Authorization": "Bearer " + CCRestClient.tokenSecret
                        } : {}
                    }).done(function (val) {
                        if (val.stockStatus === "OUT_OF_STOCK") {
                            badgeString += outOufStockBadgeString;
                        } //else if (val.stockStatus === "IN_STOCK") {
                        // badgeString += inStockBadgeString;
                        //}

                        el.innerHTML = badgeString;
                    });
                } else {
                    el.innerHTML = badgeString;
                }
            },
            getProductBadgesNoParent: function (productData, showStock, el) {
                var badgeString = '';

                if (productData.hc_new) {
                    badgeString += newBadgeString;
                }

                if (productData.hc_sale) {
                    badgeString += saleBadgeString;
                }

                if (showStock) {
                    $.ajax({
                        url: "/ccstoreui/v1/stockStatus/" + productData.id,
                        method: "GET",
                        headers: CCRestClient.previewMode ? {
                            "Authorization": "Bearer " + CCRestClient.tokenSecret
                        } : {}
                    }).done(function (val) {
                        if (val.stockStatus === "OUT_OF_STOCK") {
                            badgeString += outOufStockBadgeString;
                        } //else if (val.stockStatus === "IN_STOCK") {
                        // badgeString += inStockBadgeString;
                        //}

                        el.innerHTML = badgeString;
                    });
                } else {
                    el.innerHTML = badgeString;
                }
            },
            getProductBadgesByProdId: function (productId, el) {
                var badgeString = '';

                $.ajax({
                    url: "/ccstoreui/v1/products/" + productId,
                    method: "GET",
                    headers: CCRestClient.previewMode ? {
                        "Authorization": "Bearer " + CCRestClient.tokenSecret
                    } : {}
                }).done(function (val) {
                    if (val.hc_new) {
                        badgeString += newBadgeString;
                    }

                    if (val.hc_sale) {
                        badgeString += saleBadgeString;
                    }

                    if (val.stockStatus === "OUT_OF_STOCK") {
                        badgeString += outOufStockBadgeString;
                    }

                    el.innerHTML = badgeString;
                });
            },
            updateProductImage: function (productId, el) {
                $.ajax({
                    url: "/ccstoreui/v1/products/" + productId,
                    method: "GET",
                    headers: CCRestClient.previewMode ? {
                        "Authorization": "Bearer " + CCRestClient.tokenSecret
                    } : {}
                }).done(function (val) {
                    //console.log("img: " + val.primaryThumbImageURL);
                    //console.log(el);
                    el.src = val.primaryThumbImageURL;
                    //el.src = "https://d3bdsjrbvm7x2t.cloudfront.net/FEB%202018/44/5/1/18521/Lexi_beddinghc_hero_01.jpg";
                });
            },
            // END UI HELPERS


            /**
             * Returns a function, that, as long as it continues to be invoked, will not
             be triggered. The function will be called after it stops being called for
             N milliseconds. If `immediate` is passed, trigger the function on the
             leading edge, instead of the trailing.
             * @param func
             * @param wait
             * @param immediate
             * @returns {Function}
             */
            debounce: function (func, wait, immediate) {
                var timeout;
                return function () {
                    var context = this, args = arguments;
                    var later = function () {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            },


            onLoad: function () {
                var self = this;
                CCLogger.info("Loading Common User Interface Functions...");

                window.hc = $.extend(window.hc, {
                    getProductBadges: self.getProductBadges,
                    getProductBadgesNoParent: self.getProductBadgesNoParent,
                    getProductBadgesByProdId: self.getProductBadgesByProdId,
                    updateProductImage: self.updateProductImage
                });
                var $document = $(document);
                $document.ready(function () {
                    $document.on('click', '.more-info', function (e) {
                        e.preventDefault();
                        $("html, body").animate({scrollTop: $(".carousel-inner").offset().top}, "slow");
                    });
                });
                document.addEventListener("DOMContentLoaded", function(){
                    $('#region-Accordion .panel-title a').addClass('collapsed');
                    $('#region-Accordion [role="tabpanel"]').removeClass('in');
                });
            },

            // ---------------------------------------------------------------- //
            // findDynamicPropertyValue
            // Accepts the user().dynamicProperties collection, and returns
            // the value for the passed key (id).
            // ---------------------------------------------------------------- //
            findDynamicPropertyValue: function (properties, id) {
                var result = '';
                var property = $.grep(properties, function (e) {
                    return e.id() === id;
                });
                if (property.length === 1) {
                    result = property[0].value();
                }
                return result;
            },

            // ---------------------------------------------------------------- //
            // validateNumber
            // Basic method to validate is the value is a number.
            // ---------------------------------------------------------------- //
            validateNumber: function (val) {
                var numberRegex = /^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/;
                return numberRegex.test(val);
            },

            // ---------------------------------------------------------------- //
            // validateSAID
            // Basic method to check if the entered number is a
            // valid South African ID-Number.
            // ---------------------------------------------------------------- //
            validateSAID: function (idNumber) {
                idNumber = idNumber.trim();

                if (idNumber.length !== 13)
                    return false;

                var regEx = /^\d{10}[0-1]\d{2}$/;
                if (idNumber == '0000000000000')
                    return false;

                if (!regEx.test(idNumber))
                    return false;

                var n = idNumber;
                var p1 = parseInt(n[0], 10) + parseInt(n[2], 10) + parseInt(n[4], 10) + parseInt(n[6], 10) + parseInt(n[8], 10) + parseInt(n[10], 10);
                var p2 = (parseInt(n[1] + n[3] + n[5] + n[7] + n[9] + n[11], 10) * 2).toString();
                var p3 = 0;

                for (var i = 0; i < p2.length; i++) {
                    p3 += parseInt(p2[i]);
                }

                var check = 10 - (p1 + p3).toString()[(p1 + p3).toString().length - 1];
                var check_char = check > 9 ? check.toString()[1] : check.toString();
                return (check_char == idNumber[12]);
            },

            // ---------------------------------------------------------------- //
            // followTabKeyPress
            // Allow focus to be automatically moved from
            // one input control to another when the max-length was reached.
            // Remember to add a custom attrbute 'tabindex="n"' to the input control -
            // where n is the tab sequence number.
            // ---------------------------------------------------------------- //
            followTabKeyPress: function (event, control) {
                var charLimit = control.maxLength;
                var currentIndex = $(control).attr("tabindex");
                var nextIndex = parseInt(currentIndex) + 1;
                var previousIndex = parseInt(currentIndex) - 1;

                if (!event) {
                    if (control.value.length >= charLimit) {
                        $("input[tabindex='" + nextIndex + "']").focus();
                        return false;
                    }
                } else {
                    var keys = [8, 9, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 144, 145];

                    if (event.which == 8 && control.value.length == 0) {
                        $("input[tabindex='" + previousIndex + "']").focus();
                    } else if ($.inArray(event.which, keys) >= 0) {
                        return true;
                    } else if (control.value.length >= charLimit) {
                        $("input[tabindex='" + nextIndex + "']").focus();
                        return false;
                    } else if (event.shiftKey || event.which <= 48 || event.which >= 58) {
                        return false;
                    }
                }
            }
            // ---------------------------------------------------------------- //

            /*
                   // get querystring parameter
                    getParameterByName = function (name, url) {
                      if (!url) url = window.location.href;
                      name = name.replace(/[\[\]]/g, "\\$&");
                      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                        results = regex.exec(url);
                      if (!results) return null;
                      if (!results[2]) return '';
                      return decodeURIComponent(results[2].replace(/\+/g, " "));
                    };
                    */


        };
    }
);
