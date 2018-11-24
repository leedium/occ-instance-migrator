/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-react-solution
 * @file restObj.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 22/11/2018
 * @description Handles https occ api access.
 */

const occTokenGenerator = require("./occ-token-generator");
const axios = require("axios");

const restObj = {
  apiCall: (server, key, method, apiPath, data = null, responseType = "json", additionalHeaders = {}) => {
    return new Promise(async resolve => {
      const reqObj = {
        method,
        data,
        url: `${server}${apiPath}`,
        responseType,
        headers: Object.assign({}, {
          Authorization: `Bearer ${occTokenGenerator.getCurrentToken() ||
          await occTokenGenerator.generateToken(server, key)}`,
          "X-CCAsset-Language": "en"
        }, additionalHeaders)
      };
      axios(reqObj)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
        });
    });
  }
};

module.exports = restObj;
