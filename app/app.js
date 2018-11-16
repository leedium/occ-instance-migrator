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

const constants = require('./constants');

const packageJson = require("../package");

const addAll = require('./gitCommands').addAll;
const commit = require('./gitCommands').commit;
const createBranch = require('./gitCommands').createBranch;
const checkoutBranch = require('./gitCommands').checkoutBranch;

const mergeBranch = require('./gitCommands').mergeBranch;
const grabTarget = require('./dcuCommands').grabTarget;
const grabSource = require('./dcuCommands').grabSource;

const deleteFilePath = require('./fileCommands').deleteFilePath;
const makeTmpFolder = require('./fileCommands').makeTmpFolder;
const processDiffs = require('./fileCommands').processDiffs;

/**
 * export.main Required for the bin (global) module export
 * @param argv
 */
exports.main = function(argv) {
  //  initialize the program

  program
    .version(packageJson.version)
    .description(`Wrapper for DCU  to only deploy instances differences across tool.\nDependencies:
                git cli - https://git-scm.com/downloads
                Oracle DCU -  https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedcutograbanduploadsourceco01.html `)

    // .command("-d, --dcu", "Execute a dcu transferAll from source to target instance")

    // .option("-g, --gitpath <gitpath>", "Target git repository containing target DCU folders (grab)")
    // .option("-s --sourceserver <sourceserver> ", "Occ Admin url for source instance (from)")
    // .option("-t --sourcekey <sourcekey>", "Occ Admin api key for source instance (from)")
    // .option("-u --targetserver <targetserver>", "Occ Admin url for target instance (to)")
    // .option("-w --targetkey <targetkey>", "Occ Admin api key for target instance (from)")
    // .option("-L, --includelayouts", "Transfer All Layouts [true | false]")
    // .option("-t, --taskdelay", "Execution delay in milliseconds between tasks.   Defaults to 3000ms")
    .parse(argv);

  start();

  async function init() {
    await deleteFilePath([
      constants.TEMP_FOLDER
    ]);
    await checkoutBranch(constants.BRANCH_MASTER);
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
    return new Promise(async (resolve) => {
      // await initGitPath();
      // await init();
      // await grabTarget(program);
      // await addAll();
      // await commit();
      // await createBranch(constants.BRANCH_TARGET);
      // await createBranch(constants.BRANCH_SOURCE);
      // await grabSource(program);
      // await addAll();
      // await commit();
      // await checkoutBranch(constants.BRANCH_TARGET);
      // await mergeBranch(constants.BRANCH_SOURCE);
      // await getDiffs();

      const diffs = await processDiffs();
      await makeTmpFolder(diffs);
      await transferAll();
      // await deleteFilePath([constants.TEMP_FOLDER]);
      // await checkoutBranch(constants.BRANCH_MASTER);
      // console.log('..complete');
      resolve();
    });
  }

  /**
   * Entry method to start the process
   * @returns {Promise<void>}
   */
  async function start() {
    try {
      await extensionsTransfer(program);
      if (program.includelayouts) {
        await plsuTransferAll(program);
      }
    }
    catch (err) {
      console.log(err);
    }
  }
};