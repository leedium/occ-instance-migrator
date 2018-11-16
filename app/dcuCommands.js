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
 * Grabs the target(Source Copied From) dcu source
 * @returns {Promise<any>}
 */
const { spawn } = require("child_process");

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
const _grabSource = async function () {
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
