/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-token-generator
 * @file token.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 11/20/2018
 * @description  Generates an OCC token and refreshes every -n seconds
 **/

const program = require("commander");
const axios = require("axios");

const HTTPS_PREFIX = "https://";
const DEFAULT_TIMEOUT = 119000;

let token;


if (typeof program.timeout === "undefined" || isNaN(program.timeout)) {
  program.timeout = DEFAULT_TIMEOUT;
}

/**
 * Api call to login and generate admin access tokens
 * @param adminServer
 * @param token
 * @param refresh
 * @returns {*}
 */
const loginToOCC = (adminServer, token, refresh = false) => axios({
  method: "post",
  url: refresh ? `${adminServer}/ccadmin/v1/refresh` : `${adminServer}/ccadmin/v1/login`,
  responseType: "json",
  params: {
    "grant_type": "client_credentials"
  },
  headers: {
    "Authorization": `Bearer ${token}`,
    "content-type": "application/x-www-form-urlencoded"
  }
});


/**
 * Starts the tire to generate an access token
 * @param server
 * @param token
 * @param refresh
 */
const generateToken = (server, token, repeat = false, timeout = DEFAULT_TIMEOUT) => {
  server = server.indexOf(HTTPS_PREFIX) !== 0 ? `${HTTPS_PREFIX}${server}` : server;
  loginToOCC(server, token, repeat)
    .then(({ data }) => {
      console.log(`old Token`, token);
      console.log(`\n\nBearer ${data.access_token}`);
      token = data.access_token;
      setTimeout(() => {
        generateToken(server, data.access_token, true, program.timeout);
      }, timeout || DEFAULT_TIMEOUT);
    })
    .catch(err => {
      console.log(Error(err));
    });
};

/**
 * Returns the currently saved token
 * @returns {*}
 */
const getCurrentToken = () => token;

//  Run if exectured from the command line
if (require.main === module) {
  generateToken(program.server, program.key, program.timeout);
  return;
}
module.exports = {
  generateToken,
  getCurrentToken
};

