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
    apiCall: (method, apiPath, data, responseType = 'json') => {
      return new Promise(async resolve => {
        await occTokenGenerator.generateToken(program.sourceserver, program.sourcekey, false, 119000);
        axios({
          method,
          data,
          url:`${program.sourceserver}/ccadmin/v1${apiPath}`,
          responseType,
          headers: {
            Authorization: `Bearer ${occTokenGenerator.getCurrentToken()}`,
            "X-CCAsset-Language": "en"
          }
        })
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
