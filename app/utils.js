/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-react-solution
 * @file utils.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 23/11/2018
 * @description Helper methods to help with shared logic / processing
 */

/**
 * Add a function to Promise that will iterate through an array of promises serially.
 * @param arr
 * @param func
 * @returns {Promise<*>}
 */
Promise.each = function(arr, func) {
    // if arr is not an array reject the process
    if(!Array.isArray(arr)){return Promise.reject(new Error(`The first argument passed must be of type Array`))}

    // if arr is empty return a "completed promise"
    if(arr.length === 0){return Promise.resolve()}

    // Start the flow with a resolved Promise and return the "then" with function execution of the next Promise
    return arr.reduce(function(a,b){
      return a.then(()=> func(b));
    }, Promise.resolve())
}

/**
 * This methods formats a date in the form yyyy-mm-dd
 * @param date - Date object
 */
const formatDateForExtenstion = (date) => `${date.getFullYear()}-${date.getMonth() < 10 ? '0'+date.getMonth(): date.getMonth()}-${date.getDate() < 10 ? '0'+date.getDate(): date.getDate()}`


exports.formatDateForExtenstion = formatDateForExtenstion;
