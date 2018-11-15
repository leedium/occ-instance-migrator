// 1 - Add to cart
// 2 - Add to cart Quick Buy
// 3 - Cart
// 4 - Login
// 5 - Register
// 6 - Income and Expences
// 7 - Logout
// 8 - Checkout
// 9 - Thank you
// 10 - DEA


define(
	['jquery', 'knockout', 'ccLogger', 'pubsub'],
	function($, ko, ccLogger, pubsub) {
		'use strict';

		// Use this PubSub topic to prepare and send custom events to Google
		// from other widgets on the site.
		var GTM_CUSTOM_PUBSUB_EVENT = 'GOOGLE_TAG_MANAGER_PUSH';

		var alreadyAppendedToPage = false;

		var widget;

		return {
				listProductsInCart: function (widget) {
				var productList = [];

				var cartItems = widget.cart().items();

				for (var i = 0; i < cartItems.length; i++) {
					var item = cartItems[i];

					productList.push({
						'id' : item.productId,
						'price' : (item.itemTotal() / item.quantity()).toFixed(2),
						'quantity' : item.quantity(),
						'variant': item.catRefId
					});
				}

				return productList;
			},
			onLoad: function(self) {

				widget = self;

				// Get site settings to see if a GTM contanier ID is configured
				var gtmSettings = self.site().extensionSiteSettings.googleTagManager;
				var gtmContainerId = gtmSettings.googleTagManagerContainerId.trim();

				// Confirm that we haven't loaded and embedded GTM more than once.
				// Only add if we haven't already and we have a GTM container to use
				if (gtmContainerId !== '' && !alreadyAppendedToPage) {
					window.dataLayer = window.dataLayer || [];

					// Append GTM to page
					var gtmScript = "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':"
						+ "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],"
						+ "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src="
						+ "'//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);"
						+ "})(window,document,'script','dataLayer','" + gtmContainerId + "');</script>";
					$('body').append(gtmScript);
				}

				self.pushGtmData = function(event) {
					window.dataLayer = window.dataLayer || [];
					dataLayer.push(event);
				};

				/* ****** EVENT SUBSCRIPTIONS ****** */
				//Removed because of SSO
				//$.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function(obj) {
				//	self.pushGtmData({'event': 'user_login_completed'});
				//});

				//$.Topic(pubsub.topicNames.USER_CREATION_SUCCESSFUL).subscribe(function(obj) {
				//	self.pushGtmData({'event': 'user_registration_completed'});
				//});

				//$.Topic(pubsub.topicNames.USER_RESET_PASSWORD_SUCCESS).subscribe(function(obj) {
				//	self.pushGtmData({'event': 'user_reset_password'});
				//});


				$.Topic(pubsub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(function(obj) {
					self.pushGtmData({
						'event' : 'e_userLogout',
                        'actionField': { 'step': 7 },
                        'userId': undefined,
						'loginStatus': "Logged In"
					});
				});
				$.Topic(pubsub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function(obj) {
					self.pushGtmData({
						'event' : 'e_userLogin',
						'userId': widget.user().id(),
						'loginStatus': "Logged Out"
					});
				});
				
				

				$.Topic(pubsub.topicNames.PRODUCT_VIEWED).subscribe(function(obj) {
					self.pushGtmData({
						'event' : 'e_productViewed',
						'ecommerce' : {
							'detail' : {
								'products' : [{
									'name' : obj.displayName(),
									'id' : obj.id(),
									'price' : ""+(obj.salePrice() !== null ? obj.salePrice() : obj.listPrice())+".00",
									'brand' : obj.brand()
								}]
							}
						}
					});
				});

				$.Topic(pubsub.topicNames.PAGE_READY).subscribe(function(obj) {
					
					var UserType = "desktop";

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



					if (obj.pageId === 'cart') {
						self.pushGtmData({
							'event' : 'e_checkoutStep',
							'currencyCode' : 'ZAR',
							'ecommerce' : {
								'checkout' : {
									'actionField' : {'step' : 3},
									'products' : self.listProductsInCart(self),
									'userType': UserType,
									'userGroup':customerGroup
								}
							}
						});
					}
					else if (obj.pageId === 'checkout') {
						self.pushGtmData({
							'event' : 'e_checkoutStep',
							'currencyCode' : 'ZAR',
							'ecommerce' : {
								'checkout' : {
									'actionField' : {'step' : 8},
									'products' : self.listProductsInCart(self),
									'userType': UserType,
									'userGroup':customerGroup
								}
							}
						});
					}
					else if (obj.pageId === 'confirmation') {
						var confirmation = self.confirmation();

						var productList = [];
						var couponList = [];
						var orderItems = confirmation.shoppingCart.items;
						var couponItems = confirmation.discountInfo.orderDiscountDescList;

						for (var i = 0; i < orderItems.length; i++) {
							var item = orderItems[i];

							productList.push({
								'name': item.displayName,
								'id': item.productId,
								'price': (item.price / item.quantity).toFixed(2),
								'quantity': item.quantity,
								'variant': item.catRefId
							});
						}

						for (var i = 0; i < couponItems.length; i++) {
							couponList.push(couponItems[i].coupon);
						}

						self.pushGtmData({
							'event': 'e_transaction',
							'currencyCode': 'ZAR',
							'ecommerce': {
								'purchase': {
									'actionField': {
										'step': 9,
										'affiliation':'HomeChoice',
										'id': confirmation.id,
										'revenue': confirmation.priceInfo.total.toFixed(2),
										'tax': confirmation.priceInfo.tax.toFixed(2),
										'shipping': confirmation.priceInfo.shipping.toFixed(2),
										'coupon': couponList.sort().join(',')
									},
									'products': productList,
									'userType': UserType,
									'userGroup':customerGroup
								}
							}
						});
					}
				});

				//$.Topic(pubsub.topicNames.SEARCH_RESULTS_UPDATED).subscribe(function(obj) {
				//	var pageType = obj.requestor.contextData.page.repositoryId;
				//	var searchQuery = obj.requestor.searchText.replace(/^(\d)+\|/g,'');
//
				//	if (pageType === 'searchResultsPage') {
				//		self.pushGtmData({
				//			'event': 'search_results_returned',
				//			'search_term': searchQuery
				//		});
				//	}
				//	else if (pageType === 'noSearchResultsPage') {
				//		self.pushGtmData({
				//			'event': 'search_no_results_returned',
				//			'search_term': searchQuery
				//		});
				//	}
				//});

				$.Topic(GTM_CUSTOM_PUBSUB_EVENT).subscribe(function(obj) {
					ccLogger.debug('Custom event sent to GTM', obj);
					self.pushGtmData(obj);
				});
			}
		};
	}
);