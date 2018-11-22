/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

const occTokenGenerator = require("./occ-token-generator");
const axios = require("axios");

const restObj = (program) => {
  return {
    apiCall: (method, url, data, responseType = 'json') => {
      return new Promise(async resolve => {
        await occTokenGenerator.generateToken(program.sourceserver, program.sourcekey, false, 119000);
        axios({
          method,
          data,
          url,
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
