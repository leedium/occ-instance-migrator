/**
 * @project
 * @file hc.constants.js
 * @company spindrift
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 05/08/2018
 * @description Constants to use across Homechoice libs
 *
 * todo:  move all localized constants to this file
 **/

define([],
    function () {
        function HomeChoiceConstants() {
        }
        HomeChoiceConstants.COLLECTIONS_NAV_HAMBURGER_OPEN = 'COLLECTIONS_NAV_HAMBURGER_OPEN';

        HomeChoiceConstants.PAGE_CHECKOUT = 'checkout';
        HomeChoiceConstants.PAGE_REGISTER = 'register';
        HomeChoiceConstants.PAGE_ABOUT_US = 'aboutus';
        HomeChoiceConstants.PAGE_QUICK_ORDER = 'quickorder';

        HomeChoiceConstants.PROFILE_CONTROLLER_CHECK_FOR_CHANGES = 'PROFILE_CONTROLLER_CHECK_FOR_CHANGES';
        HomeChoiceConstants.PROFILE_CONTROLLER_REQUEST_STATUS = 'PROFILE_CONTROLLER_REQUEST_STATUS';
        HomeChoiceConstants.PROFILE_CONTROLLER_STATUS_RESPONSE = 'PROFILE_CONTROLLER_STATUS_RESPONSE';
        HomeChoiceConstants.PROFILE_CONTROLLER_POLLING_COMPLETE = 'PROFILE_CONTROLLER_POLLING_COMPLETE';
        HomeChoiceConstants.PROFILE_CONTROLLER_POLLING_START = 'PROFILE_CONTROLLER_POLLING_START';
        HomeChoiceConstants.PROFILE_CONTROLLER_GET_ERROR = 'PROFILE_CONTROLLER_GET_ERROR';
        HomeChoiceConstants.PROFILE_CONTROLLER_GET_CUSTOMER_FAIL = 'PROFILE_CONTROLLER_GET_CUSTOMER_FAIL';
        HomeChoiceConstants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_REQUEST';
        HomeChoiceConstants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_SUCCESS';
        HomeChoiceConstants.PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL = 'PROFILE_CONTROLLER_EMPLOYMENT_UPDATE_FAIL';
        HomeChoiceConstants.PROFILE_CONTROLLER_LOGOUT = 'PROFILE_CONTROLLER_LOGOUT';
        HomeChoiceConstants.PROFILE_TERMS_CHECKOUT_WITHOUT_COMPLETED_REGISTRATION = 'PROFILE_TERMS_CHECKOUT_WITHOUT_COMPLETED_REGISTRATION';
        HomeChoiceConstants.PROFILE_CHECKOUT_TRIGGER_PLACE_ORDER = 'PROFILE_CHECKOUT_TRIGGER_PLACE_ORDER';
        HomeChoiceConstants.PROFILE_CHECKOUT_VALIDATE = 'PROFILE_CHECKOUT_VALIDATE';
        HomeChoiceConstants.PROFILE_CHECKOUT_VALIDATE_COMPLETE = 'PROFILE_CHECKOUT_VALIDATE_COMPLETE';
        HomeChoiceConstants.PROFILE_CHECKOUT_CASH_PAYMENT_TYPE_SELECTED = 'PROFILE_CHECKOUT_CASH_PAYMENT_TYPE_SELECTED';

        HomeChoiceConstants.CHECKOUT_PROFILE_MODULES_LOADED = 'CHECKOUT_PROFILE_MODULES_LOADED';
        return HomeChoiceConstants;
    });