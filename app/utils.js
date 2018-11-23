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
 * This methods formats a date in the form yyyy-mm-dd
 * @param date - Date object
 */
const formatDateForExtenstion = (date) => `${date.getFullYear()}-${date.getMonth() < 10 ? '0'+date.getMonth(): date.getMonth()}-${date.getDate() < 10 ? '0'+date.getDate(): date.getDate()}`


exports.formatDateForExtenstion = formatDateForExtenstion;
