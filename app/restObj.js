/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

const occTokenGenerator = require('./occ-token-generator');
const axios = require("axios");

const restObj = (program) => {
  //generateToken
  occTokenGenerator.generateToken(program.targetserver, program.targetkey, 119000, true)
  return {
    apiCall(){

    },
    restify(){
      return axios
    }
  }
}

module.exports = restObj