/**
 * @fileoverview Registration Buttons Widget.
 * 
 */
define(
  //-------------------------------------------------------------------
  // DEPENDENCIES
  //-------------------------------------------------------------------
  ['ccResourceLoader!global/hc.ui.functions', 'knockout', 'pubsub', 'navigation', 'viewModels/address', 'notifier', 'ccConstants', 'ccPasswordValidator', 'CCi18n', 'swmRestClient', 'ccRestClient'],

  //-------------------------------------------------------------------
  // MODULE DEFINITION
  //-------------------------------------------------------------------
  function (hcUIfuncions, ko, PubSub, navigation, Address, notifier, CCConstants, CCPasswordValidator, CCi18n, swmRestClient, CCRestClient) {

    "use strict";
    
    var LABEL_NEXT = "Continue";

    return {

      WIDGET_ID: "profileRegistrationButtons",
      currentStep: ko.observable(0),
      currentUser: ko.observable(null),
      minStep: ko.observable(0),
      maxStep: ko.observable(3),
      maxStepOverride: ko.observable(false),
      nextButton: ko.observable(LABEL_NEXT),
      previousButton: ko.observable('Previous'),
      stepCreateAccount: ko.observable(0),
      stepEmploymentDetails: ko.observable(1),
      stepIncomeExpense: ko.observable(2),
      stepFinish: ko.observable(3),



      beforeAppear: function (page) {
        // Every time the user goes to the profile page,
        // it should fetch the data again and refresh it.
        var widget = this;

        $.Topic('profileNavigationProgress_Init').publish({"widget": "profileRegistrationButtons"});

        $.Topic('profileNavigationProgress_PreInit').subscribe(function (data) {
            $.Topic('profileNavigationProgress_Init').publish({ "widget": "profileRegistrationButtons" });
        });
        // beforeAppear() ---------------------------------------
      },

      onLoad: function (widget) {
        var self = this;

        widget.init = function () {
          if (widget.user().loggedIn()) {
            // EmploymentDetails complete?
            var status = hcUIfuncions.findDynamicPropertyValue(widget.user().dynamicProperties(), 'employmentStatus');
            var employmentStep = (status && status !== '');

            // IncomeExpense complete?
            var income = hcUIfuncions.findDynamicPropertyValue(widget.user().dynamicProperties(), 'netIncome');
            var incomeExpenseStep = (income && income > 0);

            if (employmentStep && incomeExpenseStep) {
              // all steps completed
              this.minStep(3);
              this.currentStep(3);
            }
            else if (employmentStep && !incomeExpenseStep) {
              // employment done, but income incomplete
              this.minStep(2);
              this.currentStep(2);
            }
            else {
              this.minStep(1);
              this.currentStep(1);
            }
          }

          widget.setWidgetVisibility(this.currentStep());
        };

        widget.previousOverride = ko.computed(function () {
          return !(this.currentStep() === this.maxStep());
        }, widget);


        widget.previousButtonClick = function () {
          var previousStep = this.currentStep();
          var nextStep = this.currentStep();

          if (previousStep > this.minStep()) {
            nextStep = previousStep - 1;
            widget.leaveEvent(previousStep, nextStep);
          }
        };

        widget.nextButtonClick = function () {
          var previousStep = this.currentStep();
          var nextStep = this.currentStep();

          if (previousStep < this.maxStep()) {
            nextStep = previousStep + 1;
            widget.leaveEvent(previousStep, nextStep);
          }
        };

        widget.leaveEvent = function (previous, next) {
          console.log('leaving ' + previous + ' to ' + next);
          switch (previous) {
            case this.stepCreateAccount():
              var data = { 'callback': 'profileNavigationButtons_profileCreateAccount_Save', 'previousStep': previous, 'nextStep': next };
              $.Topic('profileCreateAccount_Save').publish(data);
              break;
            case this.stepEmploymentDetails():
              var data = { 'callback': 'profileNavigationButtons_profileCreateAccount_Save', 'previousStep': previous, 'nextStep': next };
              $.Topic('profileEmploymentDetails_Save').publish(data);
              break;
            case this.stepIncomeExpense():
              var data = { 'callback': 'profileNavigationButtons_profileIncomeExpense_Save', 'previousStep': previous, 'nextStep': next };
              $.Topic('profileIncomeExpense_Save').publish(data);
              break;
            case this.stepFinish():
              // last page has no save
              widget.currentStep(next);
              widget.setWidgetVisibility(widget.currentStep());
              break;
            default:
              console.log('Error, step exceeds range');
          }
        };

        /*
        widget.enterEvent = function(step) {
          console.log('entering ' + step);
          switch(step) {
            case this.stepCreateAccount():
              break;
            case this.stepEmploymentDetails():
              break;
            case this.stepIncomeExpense():
              break;
            case this.stepFinish():
            break;
            default:
              console.log('Error, step exceeds range');
          }          
        };
        */

        widget.setWidgetVisibility = function (step) {

          var heading = '';
          widget.nextButton(LABEL_NEXT);
          widget.previousButton('Previous');

          console.log($('#CC-profileCreateAccount'));

          if (step === this.stepCreateAccount()) {
            heading = 'Register for your credit';
            widget.nextButton('Create account');
            $('#CC-profileCreateAccount').show();
          }
          else {
            $('#CC-profileCreateAccount').hide();
          }

          if (step === this.stepEmploymentDetails()) {
            heading = 'Employment details';
            $('#CC-profileEmploymentDetails').show();
          }
          else {
            $('#CC-profileEmploymentDetails').hide();
          }

          if (step === this.stepIncomeExpense()) {
            heading = 'Your monthly income';
            $('#CC-profileIncomeExpense').show();
          }
          else {
            $('#CC-profileIncomeExpense').hide();
          }

          if (step === this.stepFinish()) {
            heading = 'All done';
            $('#CC-profileThankYou').show();
          }
          else {
            $('#CC-profileThankYou').hide();
          }

          var progress = ((step + 1) / (this.maxStep() + 1)) * 100;
          var data = { 'heading': heading, 'progress': progress };
          $.Topic('profileNavigationProgress_Change').publish(data);
        };

        // Callbacks
        $.Topic('profileNavigationButtons_profileCreateAccount_Save').subscribe(function (data) {
          console.log('subscribe profileNavigationButtons_profileCreateAccount_Save ' + data);

          if (data && data.result === 'success') {
            widget.currentStep(data.nextStep);

            // when user account is created, user cannot navigate back to that step
            widget.minStep(1);

            // set widgets
            widget.setWidgetVisibility(widget.currentStep());
          }
        });

        $.Topic('profileNavigationButtons_profileEmploymentDetails_Save').subscribe(function (data) {
          console.log('subscribe profileNavigationButtons_profileEmploymentDetails_Save ' + data);

          if (data && data.result === 'success') {
            widget.currentStep(data.nextStep);

            // set widgets
            widget.setWidgetVisibility(widget.currentStep());
          }

        });

        $.Topic('profileNavigationButtons_profileIncomeExpense_Save').subscribe(function (data) {
          console.log('subscribe profileNavigationButtons_profileIncomeExpense_Save ' + data);

          if (data && data.result === 'success') {
            widget.currentStep(data.nextStep);

            // set widgets
            widget.setWidgetVisibility(widget.currentStep());

          }
          else {

          }

        });

        $.Topic(PubSub.topicNames.USER_LOGIN_SUCCESSFUL).subscribe(function (e) {
          console.log('subscribe buttons ' + PubSub.topicNames.USER_LOGIN_SUCCESSFUL);

          // If user clicks on login button (anywhere) during registration process,
          // ensure modal is hidden.  hc.profile.createaccount.widget takes care
          // of the redirect.
          $("#CC-headermodalpane").modal("hide"), $("body").removeClass("modal-open"), $(".modal-backdrop").remove();
        });

        $.Topic(PubSub.topicNames.USER_LOGOUT_SUCCESSFUL).subscribe(function (data) {
          console.log('subscribe buttons ' + PubSub.topicNames.USER_LOGOUT_SUCCESSFUL);

          // If user clicks on logout button during registration process,
          // redirect to homepage.
          window.location.href = "/";
        });

        $.Topic('profileRegistrationButtons_Init').subscribe(function (data) {
          console.log('profileRegistrationButtons_Init');
          widget.init();
        });

      },
      // onLoad() ---------------------------------------





    };
  }
);
