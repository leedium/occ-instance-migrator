/* global define */
/**
 * @project mygate
 * @file main.js
 * @company leedium
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 20/07/2018
 * @description Manges the show and hide of the loading overlay
 *              publish the following constants to control visibility
 *              MYGATE_OVERLAY_BEGIN - appends markup to DOM
 *              MYGATE_OVERLAY_SHOW  [copy - message to sow]- show  overlay
 *              MYGATE_OVERLAY_HIDE - hide overlay
 *              MYGATE_OVERLAY_REMOVE - remove the overlay from DOM
 *              ex: $.Topic(MYGATE_OVERLAY_SHOW).publish({
 *                  copy: 'a message'
 *              })
 *
 **/

define(
  ['knockout', 'jquery', 'pubsub'],

  function (ko, $, pubsub) {
    'use strict';

    var MYGATE_OVERLAY_BEGIN = 'MYGATE_OVERLAY_BEGIN';
    var MYGATE_OVERLAY_HIDE = 'MYGATE_OVERLAY_HIDE';
    var MYGATE_OVERLAY_SHOW = 'MYGATE_OVERLAY_SHOW';
    var MYGATE_OVERLAY_REMOVE = 'MYGATE_OVERLAY_REMOVE';

    (function () {
      var target = $('#page');
      var loader = $('<div class="mygate-payment-ui" style="position: fixed; text-align: center;  justify-content:center; align-items: center; top:0; left:0; display:none; width: 100%; height: 100%; z-index: 999999; background-color: rgba(255,255,255,.8);">' +
        ' <div class="mygate-payment-ui__logo">' +
        '<img alt="MyGate-Secure-Transaction-Logo" src="https://developers.mygateglobal.com/images/logos/MyGate-Secure-Transaction-Logo.gif" height="157" width="124" />' +
        '<div id="checkoutSpinner" class=""><div class="cc-spinner-css" style="margin: 0 auto; right: 7px;"><span class="ie-show">Loading...</span><div class="cc-spinner-css-1"></div><div class="cc-spinner-css-2"></div><div class="cc-spinner-css-3"></div><div class="cc-spinner-css-4"></div><div class="cc-spinner-css-5"></div><div class="cc-spinner-css-6"></div><div class="cc-spinner-css-7"></div><div class="cc-spinner-css-8"></div><div class="cc-spinner-css-9"></div><div class="cc-spinner-css-10"></div><div class="cc-spinner-css-11"></div><div class="cc-spinner-css-12"></div></div></div>' +
        '<p id="description"></p>' +
        '</div>' +
        '</div>');
      var description = loader.find('#description');

      /**
       * Appends overlay to the DOm and reveal it
       * @param copy
       * @private
       */
      var _begin = function (copy) {
        target.append(loader);
        _show(copy);
      };

      /**
       * Shows overlay
       * @param copy
       * @private
       */
      var _show = function (copy) {
        description.html(copy);
        loader.css('display', 'flex');
      };

      /**
       * Hides overlay
       * @private
       */
      var _hide = function () {
        loader.hide();
      };

      /**
       * Removes overlay
       * @private
       */
      var _remove = function () {
        loader.hide();
        loader.remove();
      };

      //  add listeners
      $.Topic(MYGATE_OVERLAY_BEGIN).subscribe(function (data) {
        _begin(data.copy);
      });
      $.Topic(MYGATE_OVERLAY_HIDE).subscribe(function () {
        _hide();
      });
      $.Topic(MYGATE_OVERLAY_SHOW).subscribe(function (data) {
        _show(data.copy);
      });
      $.Topic(MYGATE_OVERLAY_REMOVE).subscribe(function () {
        _remove();
      });

      $.Topic(pubsub.topicNames.ORDER_SUBMISSION_FAIL).subscribe(function (data) {
        setTimeout(function () {
          _remove();
        }, 1000);
      });

      $.Topic(pubsub.topicNames.ORDER_SUBMISSION_SUCCESS).subscribe(function (data) {
        setTimeout(function () {
          _remove();
        }, 1000);
      });
      return {};
    }());
    return {};
  }
);
