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
 *              using nodegit and Oracle's DCU tools
 *
 *              Extensions deltas are installed and then using nodegit, a diff check on
 *              what's changed is used to transfer only those files.
 *
 **/

const program = require("commander");
const GitKit = require("nodegit-kit");
const NodeGit = require("nodegit");

const constants = require("./constants");
const packageJson = require("../package");
const createSignature = require("./gitCommands").createSignature;
const gitIgnore = require("./gitCommands").gitIgnore;
const dcuGrab = require("./dcuCommands").dcuGrab;
const transferAll = require("./dcuCommands").transferAll;
const plsuTransferAll = require("./dcuCommands").plsuTransferAll;
const deleteFilePath = require("./fileCommands").deleteFilePath;
const makeTmpFolder = require("./fileCommands").makeTmpFolder;
const processDiffs = require("./fileCommands").processDiffs;

const analyzeInstalledExtensions = require("./extensionCommands").analyzeInstalledExtensions;

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

    .usage(
      "-s [sourceserver] -t [sourcekey] -u [targetserver] -v [targetkey]",
      "Execute a dcu transferAll from source to target instance"
    )
    //
    .option(
      "-s, --sourceserver <sourceserver> ",
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

  if (typeof program.taskdelay === "undefined" || isNaN(program.taskdelay)) {
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
      `./widget`,
      `./global`,
      `./stack`,
      `./element`,
      `./theme`,
      `./snippets`
    ]);
  }

  /**
   * Executes extesion tasks
   * @returns {Promise<void>}
   */
  async function extensionsTransfer() {
    return new Promise(async resolve => {
      try {
        let index, head, parent, targetOid, oidMaster;

        // clean the working folder
        await clean();

        // Check for and Extensions not installed on the target instance
        await analyzeInstalledExtensions(program);

        await gitIgnore();

        // 1 Init Master Branch with the latest fiels from the target
        const repo = await NodeGit.Repository.init(constants.DEFAULT_GIT_PATH, 0);
        index = await repo.refreshIndex();
        await index.addAll(constants.DEFAULT_GIT_PATH);
        await index.write();
        oidMaster = await index.writeTree();
        await repo.createCommit("HEAD", createSignature(60), createSignature(90), "initial master commit ", oidMaster, []);

        // add target
        index = await repo.refreshIndex();
        await dcuGrab(program.targetserver, program.targetkey, "target");
        await index.addAll(constants.DEFAULT_GIT_PATH);
        await index.write();
        targetOid = await index.writeTree();
        head = await NodeGit.Reference.nameToId(repo, "HEAD");
        parent = await repo.getCommit(head);
        await repo.createCommit("HEAD", createSignature(60), createSignature(90), "base source repo commit", targetOid, [parent]);

        // Grab the Source branch(latest files) and measure the diffs
        await dcuGrab(program.sourceserver, program.sourcekey, "source");
        const diffs = await GitKit.diff(repo);

        // if there are differences process them
        if(diffs.length) {
          const fileRefs = await processDiffs(diffs);

          //  Create a custom dcu upload folder for only the changes.
          await makeTmpFolder(fileRefs);

          // DCU TransferAll assets to target server
          await transferAll(program);
        }else{
          resolve();
        }

      } catch (e) {
        console.log(e);
        process.exit();
      }
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
