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

const fs = require('fs-extra');
const { spawn } = require("child_process");

const constants = require('./constants');

/**
 * Grabs the target(Source Copied From) dcu source
 * @param server
 * @param key
 * @param id
 * @returns {Promise<any>}
 * @private
 */
const _dcuGrab = async (server, key, id ='') => new Promise((resolve, reject) => {
  console.log(`GRABBING ${id} (currently deployed stable)`, process.cwd());
  const cmd = spawn("dcu", ["--grab", "--clean", "--node", server], {
    env: Object.assign({}, process.env, {
      "CC_APPLICATION_KEY": key
    })
  });
  cmd.stdout.on("data", (chunk) => {
    const str = chunk.toString();
    process.stdout.write(`DCU ${str}`);
    process.stdout.write(fs.appendFile(constants.LOGFILE, str ));
  });
  cmd.on('error', (err) => {
    reject(err)
  });
  cmd.on("close", () => {
    console.log("...target branch download completed.");
    setTimeout(() => {
      resolve();
    }, constants.TASK_DELAY);
  });
});

/**
 * Executes a DCU transferAll from source instance to target instance
 * @param path
 * @param program
 * @returns {Promise<any>}
 * @private
 */
const _putAll = (path,program) => {
  return new Promise((resolve) => {
    console.log(`Putting all extensions start...`);
    const cmd = spawn(`dcu`, ["--putAll", `${path}`, "--base", constants.TEMP_FOLDER, "--node", program.targetserver, "-k", program.targetkey], {
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
 * Executes a DCU transferAll from source instance to target instance
 * @param program
 * @returns {Promise<any>}
 * @private
 */
const _transferAll = program => {
  return new Promise((resolve) => {
    console.log(`Transferring all extensions start...`);
    const cmd = spawn(`dcu`, ["--transferAll", ".", "--base", constants.TEMP_FOLDER, "--node", program.targetserver, "-k", program.targetkey], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": program.targetkey
      })
    });
    cmd.stdout.on("data", (chunk) => {
      const str = chunk.toString();
      console.log(str);
      process.stdout.write(fs.appendFile(constants.LOGFILE, str ));
    });
    cmd.stderr.on("data", (chunk) => {
      const str = chunk.toString();
      console.log(str);
      process.stdout.write(fs.appendFile(constants.LOGFILE, `Error:[${str}]` ));
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
const _plsuTransferAll = async program => new Promise(resolve => {
  console.log("TransferAll page layouts start...");
  const plsuSpawn = spawn("plsu", [
    "--transfer",
    "--node", program.sourceserver,
    "--applicationKey", program.sourcekey,
    "-s",
    "--destinationNode", program.targetserver,
    "--destinationApplicationKey", program.targetkey
  ]);
  plsuSpawn.stdout.on("data", (chunk) => {
    const str = chunk.toString();
    process.stdout.write(fs.appendFile(constants.LOGFILE, str ));
    console.log(str)
  });
  plsuSpawn.stderr.on("data", (chunk) => {
    const str = chunk.toString();
    process.stdout.write(fs.appendFile(constants.LOGFILE, `Error:[${str}]` ));
    console.log(str)
  });
  plsuSpawn.on("close", () => {
    console.log("TransferAll page layouts complete.");
    setTimeout(() => {
      resolve();
    }, constants.TASK_DELAY);
  });
  resolve();
});

//exports
exports.dcuGrab = _dcuGrab;
exports.putAll = _putAll;
exports.transferAll = _transferAll;
exports.plsuTransferAll = _plsuTransferAll;
