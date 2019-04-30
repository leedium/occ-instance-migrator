/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file app.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 12/11/2018
 * @description This tool helps transfer only changed files across instances
 *              using git and Oracle's DCU tools
 **/

const program = require("commander");

const constants = require("./constants");
const packageJson = require("../package");
const initGitPath = require("./gitCommands").initGitPath;
const cloneRepo = require("./gitCommands").cloneRepo;
const addRemote = require("./gitCommands").addRemote;
const addN = require("./gitCommands").addN;
const pull = require("./gitCommands").pull;
const addAll = require("./gitCommands").addAll;
const commit = require("./gitCommands").commit;
const deleteBranch = require("./gitCommands").deleteBranch;
const createBranch = require("./gitCommands").createBranch;
const checkoutBranch = require("./gitCommands").checkoutBranch;
const getDiffs = require("./gitCommands").getDiffs;
const gitIgnore = require("./gitCommands").gitIgnore;
const mergeBranch = require("./gitCommands").mergeBranch;
const dcuGrab = require("./dcuCommands").dcuGrab;
const transferAll = require("./dcuCommands").transferAll;
const plsuTransferAll = require("./dcuCommands").plsuTransferAll;
const deleteFilePath = require("./fileCommands").deleteFilePath;
const makeTmpFolder = require("./fileCommands").makeTmpFolder;
const processDiffs = require("./fileCommands").processDiffs;

const analyzeInstalledExtensions = require('./extensionCommands').analyzeInstalledExtensions;

/**
 * export.main Required for the bin (global) module export
 * @param argv
 */
exports.main = function(argv) {
  //  initialize the program

  program
    .version(packageJson.version)
    .description(
      `Wrapper for DCU  to only deploy instances differences across tool.\nDependencies:
                git cli - https://git-scm.com/downloads
                Oracle DCU -  https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedcutograbanduploadsourceco01.html `
    )

    .command(
      "oim, -s [sourceserver] -t [sourcekey] -u [targetserver] -v [targetkey]",
      "Execute a dcu transferAll from source to target instance"
    )

    .usage(
      "-s [sourceserver] -t [sourcekey] -u [targetserver] -v [targetkey]",
      "Execute a dcu transferAll from source to target instance"
    )
    //
    .option(
      "-n, --deploybranch <deploybranch> ",
      "DCU deploy branch to grab"
    )
    .option(
      "-p, --gitrepo <gitrepo>",
      "Git repo  url"
    )
    .option(
      "-q, --gitusername <gitusername>",
      "Git username"
    )
    .option(
      "-r, --gitpassword <gitpassword>",
      "Git password"
    )
    .option(
      "-s, --sourceserver <sourceserver>",
      "Occ Admin url for source instance (from)"
    )
    .option(
      "-t, --sourcekey <sourcekey>",
      "Occ Admin api key for source instance (from)"
    )
    .option(
      "-u, --targetserver <targetserver>",
      "Occ Admin url for target instance (to)"
    )
    .option(
      "-v, --targetkey <targetkey>",
      "Occ Admin api key for target instance (from)"
    )
    .option(
      "-L, --includelayouts [optional]",
      "Transfer All Layouts [true | false]"
    )
    .option(
      "-w, --taskdelay <n>",
      "Execution delay in milliseconds between tasks.   Defaults to 3000ms",
      parseInt
    )
    .option(
      "-x, --cleanup",
      "Removes all DCU generated and temporary fies after completion.   Defaults to false"
    )
    .parse(argv);

  //set defaults

  if(typeof program.taskdelay === 'undefined' || isNaN(program.taskdelay)){
    program.taskdelay = constants.TASK_DELAY;
  }

  start();

  /**
   * Task to clean the working folder before DCU grab executes
   * @returns {Promise<*>}
   */
  async function clean() {
    return await deleteFilePath([
      ".gitignore",
      `./${constants.TEMP_FOLDER}`,
      `./${constants.GIT_TRACKING_FOLDER}`,
      `./${constants.DCU_TRACKING_FOLDER}`,
      `./${constants.LOGFILE}`,
      `./HC.OCC.DCU`,
      `./widget`,
      `./global`,
      `./stack`,
      `./element`,
      `./theme`,
      `./snippets`
    ]);
  }

  /**
   * Initializes the temp git repo for diff checking
   * @returns {Promise<void>}
   */
  async function init() {
    await checkoutBranch(constants.BRANCH_MASTER);
    await gitIgnore();
    await addAll();
    await commit();
    await deleteBranch(constants.BRANCH_SOURCE);
    await deleteBranch(constants.BRANCH_TARGET);
  }

  /**
   * Executes extesion tasks
   * @returns {Promise<void>}
   */
  async function extensionsTransfer() {
    return new Promise(async resolve => {
      // await analyzeInstalledExtensions(program);
      await clean();
      await initGitPath(program);
      await addRemote(program.gitrepo);
      await pull(program.deploybranch);

      await dcuGrab(program.sourceserver, program.sourcekey, "source");
      await addN();

      const diffs = await getDiffs();

      await transferAll(diffs, program);
      if (program.cleanp) {
        await clean();
      }
      resolve();
    });
  }

  /**
   * Entry method to start the process
   * @returns {Promise<void>}
   */
  async function start() {
    try {
      await extensionsTransfer();
      if (program.includelayouts) {
        await plsuTransferAll(program);
      }
    } catch (err) {
      console.log(err);
    }
  }
};
