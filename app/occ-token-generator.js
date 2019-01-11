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
const DEFAULT_TIMEOUT = 240000;

let tokens = {};
let inited = false;


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
const loginToOCC = (adminServer, token) => {
  return axios({
    method: "POST",
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
};

/**
 * Starts the tire to generate an access token
 * @param server
 * @param token
 * @param refresh
 */
const generateToken = async (server, token) => {
  return new Promise((resolve, reject) => {
    server = server.indexOf(HTTPS_PREFIX) !== 0 ? `${HTTPS_PREFIX}${server}` : server;
    const req = function ({ data }){
      //  store the token(s) in a hash
      tokens[server] = data.access_token;
      resolve(data.access_token);
    };
    loginToOCC(server, token, inited)
      .then((res) => {
        req(res);
      })
      .catch(reject);
  });
};

/**
 * Returns the currently saved token
 * @returns {*}
 */
const getCurrentToken = (server) => tokens[server];
module.exports = {
  generateToken,
  getCurrentToken
};

