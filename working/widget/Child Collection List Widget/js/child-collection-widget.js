/**
 * @fileoverview Child Collection List Widget.
 *
 */

define(['knockout','jquery','pubsub', 'notifier', 'ccConstants', 'ccRestClient','pageLayout/product', 'ccStoreConfiguration'],

    function (ko,$, pubsub, notifier, CCConstants, CCRestClient, Product, CCStoreConfiguration) {
        "use strict";

        var MODULE_NAME = 'hc-collections-list';

        var sortArrayAsc = function(a,b){
            return (a.index < b.index) ? -1 : 1;
        }

        var moduleObj = {

            //Created a temp oservable array to manage the modified collection list
            childCollectionList: ko.observableArray([]),

            onLoad: function(widget) {
                var self = this;
                //detect the page change to reset the observable array
                $.Topic(pubsub.topicNames.PAGE_CHANGED).subscribe(function(obj){
                   widget.childCollectionList.removeAll();
                });
            },
            /**
             * Use "category"  to form a new object array with product information to handle the
             * display of collections based on their children (collection/product)
             */
            beforeAppear: function(){
                var widget = this;

                if(widget.category().childCategories){
                    var len = widget.category().childCategories.length;
                    for (var i = 0; i < len; i++){
                        var category = widget.category().childCategories[i];
                        (function(index, catItem, widget){
                            var data = {};
                            data[CCConstants.EXPAND] = CCConstants.EXPAND_CHILD_CATEGORIES;
                            data['disableActiveProdCheck'] = true;
                            CCRestClient.request(CCConstants.ENDPOINT_COLLECTIONS_GET_COLLECTION,
                                data,
                                function(categoryRes){
                                    if(categoryRes.childCategories.length === 0){
                                        CCRestClient.request(CCConstants.ENDPOINT_PRODUCTS_LIST_PRODUCTS,{
                                                categoryId: catItem.id
                                            },
                                            function(productRes){
                                                var collectionObj = {collection:categoryRes, index: index, active:false, totalChildren:categoryRes.childCategories.length + productRes.totalResults}

                                                if(productRes.totalResults + categoryRes.childCategories.length === 0){
                                                    widget.childCollectionList.push(collectionObj);
                                                }else{
                                                    collectionObj.active = true;
                                                    widget.childCollectionList.push(collectionObj);
                                                }
                                                if(index >= len-1){
                                                    widget.childCollectionList().sort(sortArrayAsc);

                                                }
                                            },
                                            function(err){}
                                        );
                                    }else{
                                        widget.childCollectionList.push({collection:categoryRes, index: index, active:true, totalChildren:categoryRes.childCategories.length});
                                        if(index >= len-1){
                                            widget.childCollectionList().sort(sortArrayAsc);
                                        }
                                    }
                                },
                                function(err){},
                                catItem.id);
                        }(i, category, widget));
                    }
                }
            }
        };
        return moduleObj;
    }
);