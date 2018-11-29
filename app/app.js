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
const GitKit = require("nodegit-kit");
const NodeGit = require("nodegit");

const constants = require("./constants");
const packageJson = require("../package");
const initGitPath = require("./gitCommands").initGitPath;
const addAll = require("./gitCommands").addAll;
const commit = require("./gitCommands").commit;
const deleteBranch = require("./gitCommands").deleteBranch;
const createBranch = require("./gitCommands").createBranch;
const checkoutBranch = require("./gitCommands").checkoutBranch;
const getDiffs = require("./gitCommands").getDiffs;
const gitIgnore = require("./gitCommands").gitIgnore;
const createSignature = require("./gitCommands").createSignature;
const mergeBranch = require("./gitCommands").mergeBranch;
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

    .command(
      "oim, -s [sourceserver] -t [sourcekey] -u [targetserver] -v [targetkey]",
      "Execute a dcu transferAll from source to target instance"
    )
    //
    .option(
      "-s --sourceserver <sourceserver> ",
      "Occ Admin url for source instance (from)"
    )
    .option(
      "-t --sourcekey <sourcekey>",
      "Occ Admin api key for source instance (from)"
    )
    .option(
      "-u --targetserver <targetserver>",
      "Occ Admin url for target instance (to)"
    )
    .option(
      "-v --targetkey <targetkey>",
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
   * Initializes the temp git repo for diff checking
   * @returns {Promise<void>}
   */
  async function init(repo, index) {
    try {
      await commit(repo);
      await createBranch(repo, constants.BRANCH_MASTER);
      // await checkoutBranch(repo, constants.BRANCH_MASTER);
      await gitIgnore();
      // await addAll();
      // await commit();
      // await deleteBranch(constants.BRANCH_SOURCE);
      // await deleteBranch(constants.BRANCH_TARGET);
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Executes extesion tasks
   * @returns {Promise<void>}
   */
  async function extensionsTransfer() {
    return new Promise(async resolve => {
      try {
        // await analyzeInstalledExtensions(program);


        // await clean();
        // let index, head, oid, parent, sourceOid, targetOid, oidMaster, sourceHead;
        // await gitIgnore();
        // // 1 Init Master Branch with the latest fiels from the target
        // const repo = await NodeGit.Repository.init(constants.DEFAULT_GIT_PATH, 0);
        // index = await repo.refreshIndex();
        // await index.addAll(constants.DEFAULT_GIT_PATH);
        // await index.write();
        // oidMaster = await index.writeTree();
        // await repo.createCommit("HEAD", createSignature(60), createSignature(90), "initial master commit ", oidMaster, []);
        // //
        // // // add target
        // index = await repo.refreshIndex();
        // await dcuGrab(program.targetserver, program.targetkey, "target");
        // await index.addAll(constants.DEFAULT_GIT_PATH);
        // await index.write();
        // targetOid = await index.writeTree();
        // head = await NodeGit.Reference.nameToId(repo, "HEAD");
        // parent = await repo.getCommit(head);
        // await repo.createCommit("HEAD", createSignature(60), createSignature(90), "base source repo commit", targetOid, [parent]);
        //

        // // 2 -- Checkout The Source Branch and grab and commit latest
        let repo = await NodeGit.Repository.open(constants.DEFAULT_GIT_PATH);
       //
       //  repo.checkoutBranch(constants.BRANCH_SOURCE);
       //  let sourceCommit = await repo.getHeadCommit();

        //  index = await repo.refreshIndex();
        // await dcuGrab(program.sourceserver, program.sourcekey, "source");

        // console.log(history)
        // get the diffs
        const diffs = await GitKit.diff(repo);

        const fileRefs = await processDiffs(diffs);

        await makeTmpFolder(fileRefs);

        // console.log(fileRefs)

        await transferAll(program);


      } catch (e) {
        console.log(e);
      }

      // await gitIgnore();
      // await init(repo);
      // await dcuGrab(program.targetserver, program.targetkey, "test");
      // await addAll();
      // await commit();
      // await createBranch(constants.BRANCH_TARGET);
      // await createBranch(constants.BRANCH_SOURCE);
      // await dcuGrab(program.sourceserver, program.sourcekey, "source");
      // await addAll();
      // await commit();
      // await checkoutBranch(constants.BRANCH_TARGET);
      // await mergeBranch(constants.BRANCH_SOURCE);
      // await getDiffs();
      // const fileRefs = await processDiffs();
      // await makeTmpFolder(fileRefs);
      // await transferAll(program);
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
        // await plsuTransferAll(program);
      }
    } catch (err) {
      console.log(err);
    }
  }
};
