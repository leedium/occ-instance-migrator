/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file gitCommands.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 16/11/2018
 * @description Methods for interfacing with the git cli
 */

/**
 * Performs a git checkout
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */

const upath = require("upath");
const fs = require("fs-extra");
const Git = require("nodegit");

const GIT_IGNORE_PATH = require("./constants").GIT_IGNORE_FILE;

/**
 * Creates a user signature for node git
 * @param offset
 * @returns {}
 * @private
 */
const _createSignature = (offset) => Git.Signature.create("leedium","info@leedium.com", new Date().valueOf(), offset);

/**
 * Creates a gitingore so that .ccc tracking files are not compared
 * @returns {Promise<*>}
 * @private
 */
const _gitIgnore = async () => {
  return new Promise((resolve, reject) => fs.outputFile(upath.join(GIT_IGNORE_PATH), ".ccc/\ntmp/\nnode_modules/")
    .then(resolve)
    .catch(reject)
  );
};

exports.createSignature = _createSignature;
exports.gitIgnore = _gitIgnore;
