/**
 * @fileoverview Customer Profile Widget.
 *
 */
define(
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['knockout', 'pubsub', 'navigation', 'viewModels/address', 'notifier', 'ccConstants', 'ccPasswordValidator', 'CCi18n', 'swmRestClient', 'ccRestClient', 'ccResourceLoader!global/hc.cart.dynamicproperties.app','ccResourceLoader!global/hc.ui.functions'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (ko, pubsub, navigation, Address, notifier, CCConstants, CCPasswordValidator, CCi18n, swmRestClient, CCRestClient, cartDynamicPropertiesApp, hcUIFunctions) {

    "use strict";
    var self;
    var _widget;

    return {

      WIDGET_ID:        "customerProfile",
      ignoreBlur:   ko.observable(false),
      // Property to show edit screen.
      isUserDetailsEdited:                ko.observable(false),
      isUserProfileShippingEdited:        ko.observable(false),
      isUserProfileDefaultAddressEdited : ko.observable(false),
      isUserProfilePasswordEdited:        ko.observable(false),
      interceptedLink: ko.observable(null),
      isUserProfileInvalid: ko.observable(false),
      showSWM : ko.observable(true),
      isProfileLocaleNotInSupportedLocales : ko.observable(),

      amountATB: ko.observable('Loading my Credit Limit...'),
      hcPersonNo: ko.observable(''),
      hcDueNow: ko.observable(''),
      hcDueNowDate: ko.observable(''),
      hcLastPayment: ko.observable(''),
      hcLastPaymentDate: ko.observable(''),
      hcLastPaymentCash: ko.observable(''),
      hcLastPaymentCashDate: ko.observable(''),
      handleRequestStatementMessage: ko.observable(''),
      handleRequestSettlementLetterMessage: ko.observable(''),
      handleRequestSettlementLetterDisabled: ko.observable(false),
      handleRequestStatementDisabled: ko.observable(false),

      EditEmail: ko.observable('Init'),
      EditMobile: ko.observable('Init'),
      DoEditDisabled: ko.observable(false),
      DoEditMessage: ko.observable(''),

      
      DoEditInit: function() {
        _widget.DoEditDisabled(false);
        _widget.DoEditMessage('');
      },
      DoEdit: function() {
        _widget.DoEditMessage('<div style="margin-top: 27px;" class="DynamicRequest">Processing</div>');
        _widget.DoEditDisabled(true);

        var hcPersonNo = 'unknown';
        var hcMobile = 'unknown';
        var hcCode = 'ZA';
        for (var i = 0; i < _widget.user().dynamicProperties().length; i++) {
            var dp_hcPersonNo =  _widget.user().dynamicProperties()[i];
            if(dp_hcPersonNo.id() == "hcPersonNo")
            {
                if(dp_hcPersonNo.value() != undefined){
                    hcPersonNo = dp_hcPersonNo.value();
                }
            }
            if(dp_hcPersonNo.id() == "mobileTelephoneNumber"){
              hcMobile = dp_hcPersonNo.value();
            }
        }
        
        try {
          hcCode = _widget.user().shippingAddress.country();
        } catch (error) {
          
        }

        var sendData = {
            "HCPersonNo": hcPersonNo,
            "Cellnumber": hcMobile,
            "CtryCode": hcCode,
            "Email": _widget.user().email()
          }

          $.ajax({
            type: 'POST',
            contentType: "application/json",
            dataType: 'json',
            url: "/ccstorex/custom/v1/hc/customer/miniStatement",
            data: sendData,
            headers: {
                'hc-env': CCRestClient.previewMode,
                "Authorization": "Bearer " + CCRestClient.tokenSecret
            },
            success: function (data) {

                if(data.CanUpdate){
                  _widget.DoEditMessage('<div style="margin-top: 27px;" class="DynamicRequest">Syncing Changes</div>');

                  //Process SSO update??
                  //Pull update from omega back to OCC???!?!??!
                  _widget.DoEditMessage('<div style="margin-top: 27px;" class="DynamicRequest">Changes Updated</div>');

                }else{
                  _widget.DoEditMessage('<div style="margin-top: 27px;" class="DynamicRequestFail">' + data.Message + '</div>');
                }
            },
            error: function (x) {
              _widget.DoEditMessage('<div style="margin-top: 27px;" class="DynamicRequestFail">Update Failed</div>');
            }
        });
      },

      handleRequestStatement : function (btn){
        _widget.handleRequestStatementMessage('<div class="DynamicRequest">Processing...</div>');
        _widget.handleRequestStatementDisabled(true);

        var hcPersonNo = 'unknown';
        for (var i = 0; i < _widget.user().dynamicProperties().length; i++) {
            var dp_hcPersonNo =  _widget.user().dynamicProperties()[i];
            if(dp_hcPersonNo.id() == "hcPersonNo")
            {
                if(dp_hcPersonNo.value() != undefined){
                    hcPersonNo = dp_hcPersonNo.value();
                }
                break;
            }
        }

        var sendData = {
          "HCPersonNo": hcPersonNo
        }

           $.ajax({
             type: 'POST',
             contentType: "application/json",
             dataType: 'json',
             url: "/ccstorex/custom/v1/hc/customer/miniStatement",
             data: sendData,
             headers: {
                 'hc-env': CCRestClient.previewMode,
                 "Authorization": "Bearer " + CCRestClient.tokenSecret
             },
             success: function (data) {
              _widget.handleRequestStatementMessage('<div class="DynamicRequestSuccess">Statement Request Successful</div>');
             },
             error: function (x) {
              _widget.handleRequestStatementMessage('<div class="DynamicRequestFail">Statement Request Failed</div>');
             }
         });
      },
      handleRequestSettlementLetter : function (){
        _widget.handleRequestSettlementLetterMessage('<div class="DynamicRequest">Processing...</div>');
        _widget.handleRequestSettlementLetterDisabled(true);

        var hcPersonNo = 'unknown';
        for (var i = 0; i < _widget.user().dynamicProperties().length; i++) {
            var dp_hcPersonNo =  _widget.user().dynamicProperties()[i];
            if(dp_hcPersonNo.id() == "hcPersonNo")
            {
                if(dp_hcPersonNo.value() != undefined){
                    hcPersonNo = dp_hcPersonNo.value();
                }
                break;
            }
        }

        var sendData = {
          "HCPersonNo": hcPersonNo
        }

           $.ajax({
             type: 'POST',
             contentType: "application/json",
             dataType: 'json',
             url: "/ccstorex/custom/v1/hc/customer/settlementLetter",
             data: sendData,
             headers: {
                 'hc-env': CCRestClient.previewMode,
                 "Authorization": "Bearer " + CCRestClient.tokenSecret
             },
             success: function (data) {
              _widget.handleRequestSettlementLetterMessage('<div class="DynamicRequestSuccess">Settlement Letter Successful</div>');
             },
             error: function (x) {
              _widget.handleRequestSettlementLetterMessage('<div class="DynamicRequestFail">Settlement Letter Failed</div>');
             }
         });
      },
      
      toShortFormat: function(date) {

        var month_names =["Jan","Feb","Mar",
                          "Apr","May","Jun",
                          "Jul","Aug","Sep",
                          "Oct","Nov","Dec"];
        
        var day = date.getDate();
        var month_index = date.getMonth();
        var year = date.getFullYear();
        
        return "" + day + " " + month_names[month_index] + " " + year;
      },

      AccountInfo: function(widget){

        cartDynamicPropertiesApp.ready(widget,function(hcCartController){
            var atbAmount = hcCartController.GetATB();
            if (atbAmount === null) { 
              atbAmount = widget.site().extensionSiteSettings['blockingOvercommitSettings'].ATB_Val;
            }
            if(parseInt(atbAmount) + "" == "NaN"){
                atbAmount = widget.site().extensionSiteSettings['blockingOvercommitSettings'].ATB_Val;
            }
            else{
                atbAmount = parseInt(atbAmount);
            }

            widget.amountATB('R' + atbAmount);
        },this);

        var hcPersonNo = 'unknown';

        var hcDueNow = '';//'R0.00';
        var hcLastPayment = '';//'R0.00';
        var hcLastPaymentCash = '';//'R0.00';

        var hcDueNowDate = '';//'Due on 2018-01-01';
        var hcLastPaymentDate = '';//'Paid on 2018-01-01';
        var hcLastPaymentCashDate = '';//'Paid on 2018-01-01';

        for (var i = 0; i < widget.user().dynamicProperties().length; i++) {
            var dp_hcDP =  widget.user().dynamicProperties()[i];
            if(dp_hcDP.id() == "hcPersonNo")
            {
                if(dp_hcDP.value() != undefined){ hcPersonNo = dp_hcDP.value(); }
            }
            if(dp_hcDP.id() == "hcDueNow") //to be Defined...
            {
                if(dp_hcDP.value() != undefined){ hcDueNow = dp_hcDP.value(); }
            }
            if(dp_hcDP.id() == "hcLastPayment")//to be Defined...
            {
                if(dp_hcDP.value() != undefined){ hcLastPayment = dp_hcDP.value(); }
            }
            if(dp_hcDP.id() == "hcLastPaymentCash")//to be Defined...
            {
                if(dp_hcDP.value() != undefined){ hcLastPaymentCash = dp_hcDP.value(); }
            }
            if(dp_hcDP.id() == "hcDueNowDate") //to be Defined...
            {
                if(dp_hcDP.value() != undefined){ hcDueNowDate = dp_hcDP.value(); }
            }
            if(dp_hcDP.id() == "hcLastPaymentDate")//to be Defined...
            {
                if(dp_hcDP.value() != undefined){ hcLastPaymentDate = dp_hcDP.value(); }
            }
            if(dp_hcDP.id() == "hcLastPaymentCashDate")//to be Defined...
            {
                if(dp_hcDP.value() != undefined){ hcLastPaymentCashDate = dp_hcDP.value(); }
            }
        }



        // var hcDueNow = '';//'R0.00';
        // var hcLastPayment = '';//'R0.00';
        // var hcLastPaymentCash = '';//'R0.00';

        // var hcDueNowDate = '';//'Due on 2018-01-01';
        // var hcLastPaymentDate = '';//'Paid on 2018-01-01';
        // var hcLastPaymentCashDate = '';//'Paid on 2018-01-01';
        //300217344 - Has no account details.                     100000126 - Has account details.
        if(hcDueNowDate != ''){
          hcDueNowDate = "Due on " + widget.toShortFormat(new Date(hcDueNowDate));
          if(hcDueNow != ''){
            if(parseFloat(hcDueNow) + "" != "NaN"){
              hcDueNow = parseFloat(Math.floor(hcDueNow * 100) / 100).toFixed(2);
            }
            hcDueNow = 'R ' + hcDueNow
          }
        }
        else{
          hcDueNowDate = '-';
          hcDueNow = '-';
        }
        if(hcLastPaymentDate != ''){
          hcLastPaymentDate = "Paid on " + widget.toShortFormat(new Date(hcLastPaymentDate));
          if(hcLastPayment != ''){
            if(parseFloat(hcLastPayment) + "" != "NaN"){
              hcLastPayment = parseFloat(Math.floor(hcLastPayment * 100) / 100).toFixed(2);
            }
            hcLastPayment = 'R ' + hcLastPayment
          }
        }
        else{
          hcLastPaymentDate = '-';
          hcLastPayment = '-';
        }
        if(hcLastPaymentCashDate != ''){
          hcLastPaymentCashDate = "Paid on " + widget.toShortFormat(new Date(hcLastPaymentCashDate));
          if(hcLastPaymentCash != ''){
            if(parseFloat(hcLastPaymentCash) + "" != "NaN"){
              hcLastPaymentCash = parseFloat(Math.floor(hcLastPaymentCash * 100) / 100).toFixed(2);
            }
            hcLastPaymentCash = 'R ' + hcLastPaymentCash
          }
        }
        else{
          hcLastPaymentCashDate = '-';
          hcLastPaymentCash = '-';
        }


        widget.hcPersonNo(hcPersonNo);

        widget.hcDueNow(hcDueNow);
        widget.hcLastPayment(hcLastPayment);
        widget.hcLastPaymentCash(hcLastPaymentCash);

        widget.hcDueNowDate(hcDueNowDate);
        widget.hcLastPaymentDate(hcLastPaymentDate);
        widget.hcLastPaymentCashDate(hcLastPaymentCashDate);

      },


      handleSignout: function (context) {
        if(context.user().loggedIn()){
            if (context.user().isUserProfileEdited()) {
                return !0;
            }
            $.Topic(pubsub.topicNames.USER_LOGOUT_SUBMIT).publishWith([{
                message: "success"
            }]);
            context.elements[elementName].reset();
        }else{
            $('#CC-loginHeader-login').trigger('click');
            context.elements[elementName].scrollToTop();

        }
      },

      beforeAppear: function (page) {
         // Every time the user goes to the profile page,
         // it should fetch the data again and refresh it.
        var widget = this;
        this.AccountInfo(widget);


        _widget.EditEmail(_widget.user().email());
        _widget.EditMobile('');
        for (var index = 0; index < widget.user().dynamicProperties().length; index++) {
          var element = widget.user().dynamicProperties()[index];
          if(element.id() == "mobileTelephoneNumber"){
            _widget.EditMobile(element.value());
          }
        }
        

        widget.user().ignoreEmailValidation(false);
        // Checks whether the user is logged in or not
        // If not the user is taken to the home page
        // and is asked to login.
        if (widget.user().loggedIn() == false) {
          navigation.doLogin(navigation.getPath(), widget.links().home.route);
        } else if (widget.user().isSessionExpiredDuringSave()) {
          widget.user().isSessionExpiredDuringSave(false);
        } else {
          //reset all the password detals
          widget.user().resetPassword();
          this.getSubmittedOrderCountForProfile(widget);
          widget.showViewProfile(true);
          notifier.clearError(widget.WIDGET_ID);
          notifier.clearSuccess(widget.WIDGET_ID);
        }
      },

      onLoad: function(widget) {
        self = this;
        _widget = widget;


        $(document).on('click','.DistrictResultsP ul li', function(){
          var target = $(this).data('target');

          var close = $(this).data('close');
          if(close != undefined){
              $('.DistrictResultsP').hide();
          }

          var suburb = $(this).data('suburb');
          var parent = $(this).data('parent');
          var postal = $(this).data('postal');
          if(postal != undefined){
              $(parent).val(suburb).change();
              $(target).val(postal).change().focus();

              //widget
              //widget.editShippingAddress(addr);

              $('.DistrictResultsP').hide();
          }
      });

        widget.distSearch(widget, '#CC-customerProfile-scity', '#CC-customerProfile-szipcode')



        var isModalVisible = ko.observable(false);
        var clickedElementId = ko.observable(null);
        var isModalSaveClicked = ko.observable(false);

        widget.ErrorMsg = widget.translate('updateErrorMsg');
        widget.passwordErrorMsg = widget.translate('passwordUpdateErrorMsg');


        this.AccountInfo(widget);


        widget.getProfileLocaleDisplayName = function() {
          //Return the display name of profile locale
          for (var i=0; i<widget.site().additionalLanguages.length; i++) {
            if (widget.user().locale() === widget.site().additionalLanguages[i].name) {
              return widget.site().additionalLanguages[i].displayName;
            }
          }
        };

        //returns the edited locale to be displayed in non-edit mode
        widget.getFormattedProfileLocaleDisplayName = function(item) {
          return item.name.toUpperCase() + ' - ' + item.displayName;
        };

        // Clear edit profiles and set it to view only mode.
        widget.showViewProfile = function (refreshData) {
          // Fetch data in case it is modified or requested to reload.
          // Change all div tags to view only.
          if(refreshData) {
            widget.user().getCurrentUser(false);
          }
          widget.isUserDetailsEdited(false);
          widget.isUserProfileShippingEdited(false);
          widget.isUserProfileDefaultAddressEdited(false);
          widget.isUserProfilePasswordEdited(false);
        };

        // Reload shipping address.
        widget.reloadShipping = function() {
          //load the shipping address details
          if (widget.user().updatedShippingAddressBook) {
            var shippingAddresses = [];
            for (var k = 0; k < widget.user().updatedShippingAddressBook.length; k++)
            {
              var shippingAddress = new Address('user-shipping-address', widget.ErrorMsg, widget, widget.shippingCountries(), widget.defaultShippingCountry());
              shippingAddress.countriesList(widget.shippingCountries());

              shippingAddress.copyFrom(widget.user().updatedShippingAddressBook[k], widget.shippingCountries());
              shippingAddress.resetModified();
              shippingAddress.country(widget.user().updatedShippingAddressBook[k].countryName);
              shippingAddress.state(widget.user().updatedShippingAddressBook[k].regionName);
              shippingAddresses.push(shippingAddress);
            }

            widget.user().shippingAddressBook(shippingAddresses);
          }
        };

        /**
         * Ignores password validation when the input field is focused.
         */
        widget.passwordFieldFocused = function(data, event) {
          if (this.ignoreBlur && this.ignoreBlur()) {
            return true;
          }
          this.user().ignorePasswordValidation(true);
          return true;
        };

        /**
         * Password is validated when the input field loses focus (blur).
         */
        widget.passwordFieldLostFocus = function(data, event) {
          if (this.ignoreBlur && this.ignoreBlur()) {
            return true;
          }
          this.user().ignorePasswordValidation(false);
          return true;
        };

        /**
         * Ignores confirm password validation when the input field is focused.
         */
        widget.confirmPwdFieldFocused = function(data, event) {
          if (this.ignoreBlur && this.ignoreBlur()) {
            return true;
          }
          this.user().ignoreConfirmPasswordValidation(true);
          return true;
        };

        /**
         * Confirm password is validated when the input field loses focus (blur).
         */
        widget.confirmPwdFieldLostFocus = function(data, event) {
          if (this.ignoreBlur && this.ignoreBlur()) {
            return true;
          }
          this.user().ignoreConfirmPasswordValidation(false);
          return true;
        };

        /**
         * Ignores the blur function when mouse click is up
         */
        widget.handleMouseUp = function() {
            this.ignoreBlur(false);
            this.user().ignoreConfirmPasswordValidation(false);
            return true;
          };

          /**
           * Ignores the blur function when mouse click is down
           */
          widget.handleMouseDown = function() {
            this.ignoreBlur(true);
            this.user().ignoreConfirmPasswordValidation(true);
            return true;
          };

        widget.hideModal = function () {
          if(isModalVisible() || widget.user().isSearchInitiatedWithUnsavedChanges()) {
            $("#CC-customerProfile-modal").modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
          }
        };

        widget.showModal = function () {
          $("#CC-customerProfile-modal").modal('show');
          isModalVisible(true);
        };

        // Handle cancel update.
        widget.handleCancelUpdate = function () {
          widget.showViewProfile(false);
          widget.handleCancelUpdateDiscard();
        };

        // Discards user changes and reset the data which was saved earlier.
        widget.handleCancelUpdateDiscard = function () {
          // Resets every thing.
          widget.showViewProfile(true);
          widget.user().resetPassword();
          widget.user().editShippingAddress(null);
          widget.reloadShipping();
          notifier.clearError(widget.WIDGET_ID);
          notifier.clearSuccess(widget.WIDGET_ID);
          widget.hideModal();
        };

        // Discards user changes and navigates to the clicked link.
        widget.handleModalCancelUpdateDiscard = function () {
          widget.handleCancelUpdate();
          if ( widget.user().isSearchInitiatedWithUnsavedChanges() ) {
            widget.hideModal();
            widget.user().isSearchInitiatedWithUnsavedChanges(false);
          }
          else {
            widget.navigateAway();
          }
        };

        // Add new Shipping address, then display for editing.
        widget.handleCreateShippingAddress = function () {
          var addr = new Address('user-shipping-address', widget.ErrorMsg, widget, widget.shippingCountries(), widget.defaultShippingCountry());
          widget.editShippingAddress(addr);
        },

        widget.editShippingAddress = function (addr) {

          addr.firstName = widget.user().firstName;
          addr.lastName = widget.user().lastName;

          notifier.clearError(widget.WIDGET_ID);
          notifier.clearSuccess(widget.WIDGET_ID);
          widget.user().editShippingAddress(addr);
          widget.isUserProfileShippingEdited(true);
          $('#CC-customerProfile-sfirstname').focus();

          //CC-customerProfile-sfirstname

          if (widget.shippingCountries().length == 0) {
            $('#CC-customerProfile-shippingAddress-edit-region input').attr('disabled', true);
          }
        };

        widget.handleSelectDefaultShippingAddress = function (addr) {
          widget.selectDefaultShippingAddress(addr);
          widget.isUserProfileDefaultAddressEdited(true);
        };

        widget.handleRemoveShippingAddress = function (addr) {
          widget.user().shippingAddressBook.remove(addr);
          widget.user().deleteShippingAddress(true);

          // If addr was the default address, reset the default address to be the first entry.
          if (addr.isDefaultAddress() && widget.user().shippingAddressBook().length > 0) {
            widget.selectDefaultShippingAddress(widget.user().shippingAddressBook()[0]);
          }

          // If we delete the last user address, notify other modules that might have
          // cached it.
          if (widget.user().shippingAddressBook().length === 0) {
          	$.Topic(pubsub.topicNames.USER_PROFILE_ADDRESSES_REMOVED).publish();
          }

          widget.handleUpdateProfile();
        };

        widget.selectDefaultShippingAddress = function (addr) {
          widget.user().selectDefaultAddress(addr);
        };

        // Display My Profile to edit.
        widget.editUserDetails = function () {
          notifier.clearError(widget.WIDGET_ID);
          notifier.clearSuccess(widget.WIDGET_ID);
          widget.isUserDetailsEdited(true);
          $('#CC-customerProfile-edit-details-firstname').focus();
        };

        //Displays the Password edit option
        widget.editUserPassword = function () {
          notifier.clearError(widget.WIDGET_ID);
          notifier.clearSuccess(widget.WIDGET_ID);
          widget.isUserProfilePasswordEdited(true);
          widget.user().isChangePassword(true);
          $('#CC-customerProfile-soldPassword').focus();
        };

        // Handles User profile update
        widget.handleUpdateProfile = function () {

          if(widget.isUserProfilePasswordEdited()) {
            widget.user().isPasswordValid();
          }

          // Sends message for update
          $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_SUBMIT).publishWith(widget.user(), [{message: "success"}]);
        };

        // Handles User profile update and navigates to the clicked link.
        widget.handleModalUpdateProfile = function () {
          isModalSaveClicked(true);
          if ( widget.user().isSearchInitiatedWithUnsavedChanges() ) {
            widget.handleUpdateProfile();
            widget.hideModal();
            widget.user().isSearchInitiatedWithUnsavedChanges(false);
            return;
          }
          if (clickedElementId != "CC-loginHeader-myAccount") {
            widget.user().delaySuccessNotification(true);
          }
          widget.handleUpdateProfile();
        };


       // Handles if data does not change.
        $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_NOCHANGE).subscribe(function() {
          // Resetting profile.
          widget.showViewProfile(false);
          // Hide the modal.
          widget.hideModal();
        });

        //handle if the user logs in with different user when the session expiry prompts to relogin
        $.Topic(pubsub.topicNames.USER_PROFILE_SESSION_RESET).subscribe(function() {
          // Resetting profile.
          widget.showViewProfile(false);
          // Hide the modal.
          widget.hideModal();
		  //get the count of the orders
          widget.getSubmittedOrderCountForProfile(widget);
        });

        // Handles if data is invalid.
        $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_INVALID).subscribe(function() {
          notifier.sendError(widget.WIDGET_ID, widget.ErrorMsg, true);
          if (isModalSaveClicked()) {
            widget.isUserProfileInvalid(true);
            isModalSaveClicked(false);
          }
          widget.user().delaySuccessNotification(false);
          // Hide the modal.
          widget.hideModal();
        });

        // Handles if user profile update is saved.
        $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_SUCCESSFUL).subscribe(function() {
          // update user in Social module
          try{
          if (widget.displaySWM) {
            var successCB = function(result){
              $.Topic(pubsub.topicNames.SOCIAL_SPACE_SELECT).publish();
              $.Topic(pubsub.topicNames.SOCIAL_SPACE_MEMBERS_INFO_CHANGED).publish();
            };
            var errorCB = function(response, status, errorThrown){};

            var json = {};
            if (widget.user().emailMarketingMails()) {
              json = {
                firstName : widget.user().firstName()
                , lastName : widget.user().lastName()
              };
            }
            else {
              json = {
	                firstName : widget.user().firstName()
	                , lastName : widget.user().lastName()
	                , notifyCommentFlag : '0'
                  , notifyNewMemberFlag : '0'
	            };
	          }

            swmRestClient.request('PUT', '/swm/rs/v1/users/{userid}', json, successCB, errorCB, {
              "userid" : swmRestClient.apiuserid
            });
          }

          widget.showViewProfile(true);
          // Clears error message.
          notifier.clearError(widget.WIDGET_ID);
          notifier.clearSuccess(widget.WIDGET_ID);
          if (!widget.user().delaySuccessNotification()) {
            notifier.sendSuccess(widget.WIDGET_ID, widget.translate('updateSuccessMsg'), true);
          }
          widget.hideModal();
          if (isModalSaveClicked()) {
            isModalSaveClicked(false);
            widget.navigateAway();
          }
        }
        catch(x){
          console.log('USER_PROFILE_UPDATE_SUCCESSFUL 3 Error', x);
        }
        });

        // Handles if user profile update is failed.
        $.Topic(pubsub.topicNames.USER_PROFILE_UPDATE_FAILURE).subscribe(function(data) {
          if (isModalSaveClicked()) {
            widget.isUserProfileInvalid(true);
            isModalSaveClicked(false);
          }
          widget.user().delaySuccessNotification(false);
          // Hide the modal.
          widget.hideModal();
          if (data.status == CCConstants.HTTP_UNAUTHORIZED_ERROR) {
            widget.user().isSessionExpiredDuringSave(true);
            navigation.doLogin(navigation.getPath());
          } else {
            var msg = widget.passwordErrorMsg;
            notifier.clearError(widget.WIDGET_ID);
            notifier.clearSuccess(widget.WIDGET_ID);
            if (data.errorCode == CCConstants.USER_PROFILE_OLD_PASSWORD_INCORRECT) {
              $('#CC-customerProfile-soldPassword-phone-error').css("display", "block");
              $('#CC-customerProfile-soldPassword-phone-error').text(data.message);
              $('#CC-customerProfile-soldPassword-phone').addClass("invalid");
              $('#CC-customerProfile-spassword1-error').css("display", "block");
              $('#CC-customerProfile-spassword1-error').text(data.message);
              $('#CC-customerProfile-soldPassword').addClass("invalid");
            } else if (data.errorCode == CCConstants.USER_PROFILE_PASSWORD_POLICIES_ERROR) {
              $('#CC-customerProfile-spassword-error').css("display", "block");
              $('#CC-customerProfile-spassword-error').text(CCi18n.t('ns.common:resources.passwordPoliciesErrorText'));
              $('#CC-customerProfile-spassword').addClass("invalid");
              $('#CC-customerProfile-spassword-embeddedAssistance').css("display", "block");
              var embeddedAssistance = CCPasswordValidator.getAllEmbeddedAssistance(widget.passwordPolicies(), true);
              $('#CC-customerProfile-spassword-embeddedAssistance').text(embeddedAssistance);
            } else if (data.errorCode === CCConstants.USER_PROFILE_INTERNAL_ERROR) {
              msg = data.message;
              // Reloading user profile and shipping data in edit mode.
              widget.user().getCurrentUser(false);
              widget.reloadShipping();
            } else if (data.errors && data.errors.length > 0 &&
              (data.errors[0].errorCode === CCConstants.USER_PROFILE_SHIPPING_UPDATE_ERROR)) {
              msg = data.errors[0].message;
            } else {
              msg = data.message;
            }
            notifier.sendError(widget.WIDGET_ID, msg, true);
            widget.hideModal();
          }
        });

        $.Topic(pubsub.topicNames.USER_LOAD_SHIPPING).subscribe(function() {
          widget.reloadShipping();
        });

        $.Topic(pubsub.topicNames.UPDATE_USER_LOCALE_NOT_SUPPORTED_ERROR).subscribe(function() {
          widget.isProfileLocaleNotInSupportedLocales(true);
        });

        /**
         *  Navigates window location to the interceptedLink OR clicks checkout/logout button explicitly.
         */
        widget.navigateAway = function() {

          if (clickedElementId === "CC-header-checkout" || clickedElementId === "CC-loginHeader-logout" || clickedElementId === "CC-customerAccount-view-orders"
              || clickedElementId === "CC-header-language-link" || clickedElementId.indexOf("CC-header-languagePicker") != -1) {
            widget.removeEventHandlersForAnchorClick();
            widget.showViewProfile(false);
            // Get the DOM element that was originally clicked.
            var clickedElement = $("#"+clickedElementId).get()[0];
            clickedElement.click();
          } else if (clickedElementId === "CC-loginHeader-myAccount") {
            // Get the DOM element that was originally clicked.
            var clickedElement = $("#"+clickedElementId).get()[0];
            clickedElement.click();
          } else {
            if (!navigation.isPathEqualTo(widget.interceptedLink)) {
              navigation.goTo(widget.interceptedLink);
              widget.removeEventHandlersForAnchorClick();
            }
          }
        };

        // handler for anchor click event.
        var handleUnsavedChanges = function(e, linkData) {
          var usingCCLink = linkData && linkData.usingCCLink;

          widget.isProfileLocaleNotInSupportedLocales(false);
          // If URL is changed explicitly from profile.
          if(!usingCCLink && !navigation.isPathEqualTo(widget.links().profile.route)) {
            widget.showViewProfile(false);
            widget.removeEventHandlersForAnchorClick();
            return true;
          }
          if (widget.user().loggedIn()) {
            clickedElementId = this.id;
            widget.interceptedLink = e.currentTarget.pathname;
            if (widget.user().isUserProfileEdited()) {
              widget.showModal();
              usingCCLink && (linkData.preventDefault = true);
              return false;
            }
            else {
              widget.showViewProfile(false);
            }
          }
        };

        var controlErrorMessageDisplay = function(e) {
          widget.isProfileLocaleNotInSupportedLocales(false);
        };

        /**
         *  Adding event handler for anchor click.
         */
        widget.addEventHandlersForAnchorClick = function() {
          $("body").on("click.cc.unsaved","a",handleUnsavedChanges);
          $("body").on("mouseleave", controlErrorMessageDisplay);
        };

        /**
         *  removing event handlers explicitly that has been added when anchor links are clicked.
         */
        widget.removeEventHandlersForAnchorClick = function(){
          $("body").off("click.cc.unsaved","a", handleUnsavedChanges);
        };

        /**
         *  returns true if any of the user details OR password OR shipping details edit is clicked.
         */
        widget.user().isUserProfileEdited = ko.computed({
          read: function() {
            return ( widget.isUserDetailsEdited() || widget.isUserProfilePasswordEdited() || widget.isUserProfileShippingEdited() || widget.isUserProfileDefaultAddressEdited() );
          },
          owner: widget
        });
      },

      //Get count of placed orders for logged-in user
      getSubmittedOrderCountForProfile: function(widget) {
        widget.load(CCConstants.ENDPOINT_GET_ORDER_COUNT_FOR_PROFILE, '0', null,
          //success callback
          function(data) {
            widget.user().countOfSubmittedOrders(data.numberOfOrders);
          },
          //error callback
          function(data) {
          },
          widget
        );
      }      ,



      distSearch: function(widget, search, target){//'#CC-customerProfile-scity' '#CC-customerProfile-szipcode'
      var closeTimeout;
      $(document).on('keyup',search, hcUIFunctions.debounce(function(){
          clearTimeout(closeTimeout);
          var TempSearch = $(search).val();
          if(TempSearch.length>=3){
              var SearchStr = {
                  "SuburbSearchString": TempSearch
              };
              $(document).find('.DistrictResultsP ul').html('<li>Searching...</li>');
              $(document).find('.DistrictResultsP').show();
              var GenerateElem = '';

              $.ajax({
                  url: "/ccstorex/custom/v1/hc/utility/searchDistricts",
                  method: "POST",
                  timeout: 3000, // sets timeout to 3 seconds
                  contentType: 'application/json',
                  dataType: 'json',
                  data: JSON.stringify(SearchStr),
                  // headers: CCRestClient.previewMode ? {
                  //     "Authorization": "Bearer " + CCRestClient.tokenSecret
                  // } : {}
              }).done(function (res) {
                //   console.log('District Search', val);
                  if( res.Districts.length > 0){

                      //"CountryCode": "string",
                      //"Suburb": "string",
                      //"PostalCode": "string",
                      //"PostalCodeType": "string"


                      for (var index = 0; index < res.Districts.length; index++) {
                          var element = res.Districts[index];
                          GenerateElem += '<li '+
                              'data-target="' + target + '" ' +
                              'data-parent="' + search + '" ' +
                              'data-postal="' + element.PostalCode + '" ' +
                              'data-suburb="' + element.Suburb + '" ' +
                              'data-countrycode="' + element.CountryCode + '" ' +

                              '>Suburb: '+ element.Suburb +
                              ' (' + element.CountryCode + ')' +
                              '<br> PostalCode: '+ element.PostalCode +
                              '</li>';
                      }
                      GenerateElem += '<li data-close="true">Close</li>';
                  }
                  else{
                      GenerateElem += '<li>Unknown</li>';
                      closeTimeout = setTimeout(function(){
                          $(document).find('.DistrictResultsP').hide();
                      }, 3000);
                  }
                  $(document).find('.DistrictResultsP ul').html(GenerateElem);
                  $(document).find('.DistrictResultsP').show();

              }).fail(function (jqXHR, textStatus) {
                  GenerateElem += '<li>Unknown</li>';
                  //GenerateElem += '<li data-target="' + target + '" data-postal="123">Suburb: 123'+
                  //    '<br> PostalCode: 123'+
                  //    '</li>';
                  $(document).find('.DistrictResultsP ul').html(GenerateElem);
                  $(document).find('.DistrictResultsP').show();
                  closeTimeout = setTimeout(function(){
                      $(document).find('.DistrictResultsP').hide();
                  }, 2000);
                  console.log('District FAIL', jqXHR, textStatus);
              });;
          }else{
              $(document).find('.DistrictResultsP').hide();
          }
      }, 250));
  }










    };
  }
);
