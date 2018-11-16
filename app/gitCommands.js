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
const git = require("simple-git");

const DELAY = require("../package").taskDelay;
const DEFAULT_GIT_PATH = require("../package").gitPath;


/**
 * Iniitalizes a git path for processing
 */
const _initGitPath = async function initGitPath(program) {
  return new Promise((resolve, reject) => {
    const cmd = spaw(["git", "init", program.gitname]);
    cmd.stdout.on("data", (chunk) => {
      console.log(chunk);
    });
    cmd.on("error", (err) => {
      reject(err);
    });
    // git(".").raw(["init", packageJson.name], () => {
    //   setTimeout(() => {
    //     resolve();
    //     console.log('');
    //   }, program.taskdelay);
    // });
  });
};

const _checkoutBranch = async function(name, gitPath = DEFAULT_GIT_PATH, taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log(`checkoutBranch:${name}`);
    git(gitPath).raw(["checkout", name], () => {
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

/**
 * Performes a get merge and forces THEIRS if any conflicts arise
 * @param name
 * @param gitPath
 * @returns {Promise<any>}
 */
const _mergeBranch = async function(gitPath = DEFAULT_GIT_PATH, taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log(`mergeBranch:,${name} into target`);
    git(gitpath).raw(["merge", name, "-Xtheirs"], () => {
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

/**
 * Performes a git add. Add all files
 * @param gitPath
 * @returns {Promise<any>}
 */
const _addAll = async function(gitPath = DEFAULT_GIT_PATH, taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log("addAll...");
    git(gitPath).raw(["add", "."], () => {
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

/**
 * Performs a git commit
 * @param gitPath
 * @returns {Promise<any>}
 */
const _commit = async function(gitPath = DEFAULT_GIT_PATH, taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log("commit...");
    git(gitPath).raw(["commit", "-m", "committing latest changes"], () => {
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

/**
 * Deletes a git branch
 * @param name
 * @param gitPath
 * @returns {Promise<any>}
 */
const _deleteBranch = async function(name, gitPath = DEFAULT_GIT_PATH, taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log(`deleteLocalBranch:${name}`);
    git(gitPath).raw(["branch", "-D", name], () => {
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

/**
 * Creates a git branch, if it preexits then it is reset -B
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
const _createBranch = async function(name, gitPath = DEFAULT_GIT_PATH, taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log(`createBranch:${name}`);
    git(gitPath).raw(["checkout", "-B", name], () => {
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

/**
 * Creates list of files that have been modified.
 * Results are piped via writeStream to whatchanged.txt
 * @returns {Promise<any>}
 */
const _getDiffs = async function(taskDelay = DELAY) {
  return new Promise((resolve) => {
    console.log("getDiffs");
    const cmd = spawn("git", ["whatchanged", "-1", "--pretty=\"\""], {
      shell: true
    });
    cmd.stdout.pipe(fs.createWriteStream("./whatchanged.txt"));
    cmd.on("close", () => {
      console.log("...created diff file...");
      setTimeout(() => {
        resolve();
      }, taskDelay);
    });
  });
};

//exports
exports.initGitPath = _initGitPath;
exports.checkoutBranch = _checkoutBranch;
exports.mergeBranch = _mergeBranch;
exports.addAll = _addAll;
exports.commit = _commit;
exports.deleteBranch = _deleteBranch;
exports.createBranch = _createBranch;
exports.getDiffs = _getDiffs;
