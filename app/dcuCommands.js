/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file dcuCommands.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 16/11/2018
 * @description Commands the execute the DCU
 */

/**
 * Executes DCU transferAll
 * @returns {Promise<any>}
 */

const { spawn } = require("child_process");

const constants = require('./constants');

const _transferAll = function transferAll(program) {
  const workingTransfer = constants.WORKING_FOLDER.split("/")[1];
  process.chdir(`${constants.TEMP_FOLDER}/${workingTransfer}`);
  return new Promise((resolve) => {
    console.log(`Transferring all extensions start...`);
    const cmd = spawn(`dcu`, ["--transferAll", ".", "--node", program.targetserver, "-k", program.targetkey], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": program.targetkey
      })
    });
    cmd.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    cmd.stderr.on("data", (chunk) => {
      console.log("Error:", chunk.toString());
    });
    cmd.on("close", () => {
      console.log(`... target updated`);
      resolve();
    });
  });
};

/**
 * Transfers All Page Layouts from source to target instance
 */
const _plsuTransferAll = async function (program) {
  return new Promise(resolve => {
    console.log("TransferAll page layouts start...");
    const plsuSpawn = spawn("plsu", [
      "--transfer",
      "--node", program.sourceserver,
      "--applicationKey", program.sourcekey,
      "--all",
      "--destinationNode", program.targetserver,
      "--destinationApplicationKey", program.targetkey
    ]);
    plsuSpawn.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    plsuSpawn.stderr.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    plsuSpawn.on("close", () => {
      console.log("TransferAll page layouts complete.");
      setTimeout(() => {
        resolve();
      }, program.taskdelay);
    });
    resolve();
  });
}


/**
 * Grabs the target(Source Copied From) dcu source
 * @returns {Promise<any>}
 */
const _grabTarget = async function(program) {
  return new Promise((resolve, reject) => {
    console.log("GRABBING TARGET (currently deployed stable)", process.cwd());
    const cmd = spawn("dcu", ["--grab", "--clean", "--node", program.targetserver], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": program.targetkey
      })
    });
    cmd.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    cmd.on('error',(err) => {
      reject(err)
    });
    cmd.on("close", () => {
      console.log("...target branch download completed.");
      setTimeout(() => {
        resolve();
      }, program.taskdelay);
    });
  });
}

/**
 * Grabs the Source(Source Copied To) dcu source
 * @returns {Promise<any>}
 */
const _grabSource = async function (program) {
  return new Promise((resolve, reject) => {
    console.log("GRABBING SOURCE (latest changes)", process.cwd());
    const cmd = spawn("dcu", ["--grab", "--clean", "--node", program.sourceserver], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": program.sourcekey
      })
    });
    cmd.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    cmd.on('error',(err) => {
      reject(err)
    });
    cmd.on("close", () => {
      console.log("...source branch download completed");
      setTimeout(() => {
        resolve();
      }, program.taskdelay);
    });
  });
};

//exports
exports.grabTarget = _grabTarget;
exports.grabSource = _grabSource;
exports.transferAll = _transferAll;
exports.plsuTransferAll = _plsuTransferAll;
