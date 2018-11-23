/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-access-token
 * @file token.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 13/07/2018
 * @description  Generates a token and refreshes every -x seconds
 **/

const axios = require("axios");

const loginToOCC = (token, adminServer = null) => axios({
  method: "post",
  url: `${adminServer}/ccadmin/v1/login`,
  responseType: "json",
  params: {
    "grant_type": "client_credentials"
  },
  headers: {
    "Authorization": `Bearer ${token}`,
    "content-type": "application/x-www-form-urlencoded"
  }
});

const refresh = token => {
  loginToOCC(token)
    .then(({data}) => {
      console.log(`Bearer ${data.access_token}`);
      setTimeout(()=>{

      }, args.timeout || (1000 * 60 * 2));
      refresh(data.access_token);

    })
    .catch(err => {
      console.log(Error(err));
    });
};


