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

const restObj = (program) => {
  return {
    apiCall: (server, key, method, apiPath, data, responseType = "json", additionalHeaders) => {
      return new Promise(async resolve => {
        const reqObj = {
          method,
          data,
          url: `${server}/ccadmin/v1${apiPath}`,
          responseType,
          headers: Object.assign({}, {
            Authorization: `Bearer ${occTokenGenerator.getCurrentToken() || 
            await occTokenGenerator.generateToken(server, key)}`,
            "X-CCAsset-Language": "en"
          }, additionalHeaders)
        };
        // console.log(JSON.stringify(reqObj,null,2));
        axios(reqObj)
          .then(res => {
            resolve(res.data);
          })
          .catch(err => {
            console.log(err);
          });
      });
    },
    restify() {
      return axios;
    }
  };
};

module.exports = restObj;
