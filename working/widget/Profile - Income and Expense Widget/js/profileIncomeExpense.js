/**
 * @fileoverview Income and Expense.
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

    return {

      WIDGET_ID: "profileIncomeExpense",
      pubsubData: ko.observable(null),

      incomeGrossValidation: ko.observable(null),
      incomeNetValidation: ko.observable(null),
      incomeExtraValidation: ko.observable(null),
      expenseTotalValidation: ko.observable(null),
      incomeExpenseValidation: ko.observable(null),

      incomeGross: ko.observable(null),
      incomeNet: ko.observable(null),
      incomeExtra: ko.observable(null),
      expenseTotal: ko.observable(null),


      beforeAppear: function (page) {
        // Every time the user goes to the profile page,
        // it should fetch the data again and refresh it.
        var widget = this;

        $.Topic('profileNavigationProgress_Init').publish({ "widget": "profileIncomeExpense" });

        $.Topic('profileNavigationProgress_PreInit').subscribe(function (data) {
            $.Topic('profileNavigationProgress_Init').publish({ "widget": "profileIncomeExpense" });
        });
        // beforeAppear() ---------------------------------------
      },

      onLoad: function (widget) {
        var self = this;

        widget.updateProfile = function () {
          // Update account
          var endpoint = CCConstants.ENDPOINT_UPDATE_CUSTOMER;
          var data = {
            "netIncome": widget.incomeNet(),
            "extraIncome": widget.incomeExtra(),
            "grossMonthlyIncome": widget.incomeGross(),
            "totalExpenses": widget.expenseTotal()
          };

          CCRestClient.request(endpoint, data,
            // success
            function (result) {
              widget.returnControl(true);
            },
            // error
            function (error) {
              // TODO : WHAT DO WE DO HERE?
              // TODO : WHAT DO WE DO HERE?
              // TODO : WHAT DO WE DO HERE?
              widget.incomeExpenseValidation(error.message);
              widget.returnControl(false);
            }
          );
        };

        widget.hasScreenValidations = ko.computed(function () {
          return widget.incomeGrossValidation() ||
            widget.incomeNetValidation() ||
            widget.incomeExtraValidation() ||
            widget.incomeExpenseValidation() ||
            widget.expenseTotalValidation();
        }, widget);

        widget.clearScreenValidations = function () {
          widget.incomeGrossValidation(null);
          widget.incomeNetValidation(null);
          widget.incomeExtraValidation(null);
          widget.expenseTotalValidation(null);
          widget.incomeExpenseValidation(null);
        };

        widget.returnControl = function (res) {
          var data = widget.pubsubData();
          var result = res ? 'success' : 'error';
          $.Topic(data.callback).publish({ 'result': result, 'previousStep': data.previousStep, 'nextStep': data.nextStep });
        };

        widget.doScreenValidations = function () {
          widget.clearScreenValidations();
          var result = true;
          var validNet = false;
          var validGross = false;

          // Income gross
          if (!widget.incomeGross() || widget.incomeGross() === '') {
            widget.incomeGrossValidation('This is a required field');
            result = false;
          }
          else {
            // Remove all spaces, and check if its a value
            widget.incomeGross(widget.incomeGross().replace(/\s/g, ''));
            if (!hcUIfuncions.validateNumber(widget.incomeGross())) {
              widget.incomeGrossValidation('This is not a valid number');
              result = false;
            }
            else {
              validNet = true;
            }
          }

          // Income net
          if (!widget.incomeNet() || widget.incomeNet() === '') {
            widget.incomeNetValidation('This is a required field');
            result = false;
          }
          else {
            // Remove all spaces, and check if its a value
            widget.incomeNet(widget.incomeNet().replace(/\s/g, ''));
            if (!hcUIfuncions.validateNumber(widget.incomeNet())) {
              widget.incomeNetValidation('This is not a valid number');
              result = false;
            }
            else {
              validGross = true;
            }
          }

          // Calculated validations
          if (validNet && validGross) {
            if (widget.incomeNet() >= widget.incomeGross()) {
              widget.incomeNetValidation('Your Net income must be lower than your Gross income');
              widget.incomeGrossValidation('Your Gross income must be higher than your Net income');
              result = false;
            }
          }

          // Income extra
          if (!widget.incomeExtra() || widget.incomeExtra() === '') {
            // Non required field
          }
          else {
            // Remove all spaces, and check if its a value
            widget.incomeExtra(widget.incomeExtra().replace(/\s/g, ''));
            if (!hcUIfuncions.validateNumber(widget.incomeExtra())) {
              widget.incomeExtraValidation('This is not a valid number');
              result = false;
            }
          }

          // expense total
          if (!widget.expenseTotal() || widget.expenseTotal() === '') {
            widget.expenseTotalValidation('This is a required field');
            result = false;
          }
          else {
            // Remove all spaces, and check if its a value
            widget.expenseTotal(widget.expenseTotal().replace(/\s/g, ''));
            if (!hcUIfuncions.validateNumber(widget.expenseTotal())) {
              widget.expenseTotalValidation('This is not a valid number');
              result = false;
            }
          }

          return result;
        };

        $.Topic('profileIncomeExpense_Save').subscribe(function (data) {
          widget.pubsubData(data);
          console.log('subscribe profileIncomeExpense');
          // Do screen validations
          var res = widget.doScreenValidations();

          // Update data
          if (res) {
            widget.updateProfile();
          }
          else {
            widget.returnControl(false);
          }

        });

        // onLoad() ---------------------------------------
      }

    };
  }
);
