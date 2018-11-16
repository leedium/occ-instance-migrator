/**
 * @project homechoice.co.za
 * @file main.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 28/07/2018
 * @description  Handles Cart population of dynamic properties onLoad passing through the
 *              site model.
 *              - terms options are defined in the shared global hc.app.cart.dynamicproperties
**/

define(['jquery', 'knockout', 'storageApi', 'pubsub', 'ccConstants', 'spinner', 'ccLogger', 'ccResourceLoader!global/hc.cart.dynamicproperties.app'],
    function ($, ko, storageApi, pubsub, ccConstants, spinner, ccLogger, cartDynamicPropertiesApp) {
        function CartDynamicPropertiesGlobal() {
            this.onLoad = function (widget) {
                var self = this;
                cartDynamicPropertiesApp.ready(widget, function (hcCartController) {
                }, self);
            };
        }
        return new CartDynamicPropertiesGlobal()
    }
);
