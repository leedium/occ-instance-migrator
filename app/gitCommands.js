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

const { spawn } = require("child_process");
const git = require("simple-git");
const upath = require("upath");
const fs = require("fs-extra");

const TASK_DELAY = require("./constants").TASK_DELAY;
const DIFF_TEXT_FILE = require("./constants").DIFF_TEXT_FILE;
const DEFAULT_GIT_PATH = require("./constants").DEFAULT_GIT_PATH;
const GIT_IGNORE_PATH = require("./constants").GIT_IGNORE_FILE;


/**
 * Iniitalizes a git path for processing
 * @returns {Promise<any>}
 * @private
 */
const _initGitPath = async () => new Promise((resolve, reject) => {
  const cmd = spawn("git", ["init", DEFAULT_GIT_PATH], {
    shell: true
  });
  cmd.stdout.on("data", (chunk) => {
    console.log(chunk.toString("utf-8"));
  });
  cmd.on("error", (err) => {
    reject(err);
  });
  cmd.on("close", () => {
    resolve();
  });
});

/**
 * clones a repo
 * @param program
 * @returns {Promise<*>}
 */
const _cloneRepo = async (gitrepoUrl) => new Promise((resolve, reject) => {

  const cmd = spawn("git", ["clone", gitrepoUrl], {
    shell: true
  });
  cmd.stdout.on("data", (chunk) => {
    console.log(chunk.toString("utf-8"));
  });
  cmd.on("error", (err) => {
    reject(err);
  });
  cmd.on("close", () => {
    resolve();
  });
});


const _addRemote = async (gitrepoUrl) => new Promise((resolve, reject) => {

  const cmd = spawn("git", ["remote", "add", "origin", gitrepoUrl], {
    shell: true
  });
  cmd.stdout.on("data", (chunk) => {
    console.log(chunk.toString("utf-8"));
  });
  cmd.on("error", (err) => {
    reject(err);
  });
  cmd.on("close", () => {


    resolve();
  });
});

const _pull = async (branch) => new Promise((resolve, reject) => {

  const cmd = spawn("git", ["pull", "origin", branch], {
    shell: true
  });
  cmd.stdout.on("data", (chunk) => {
    console.log(chunk.toString("utf-8"));
  });
  cmd.on("error", (err) => {
    reject(err);
  });
  cmd.on("close", () => {


    resolve();
  });
});

const _checkoutBranch = async (name, gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["checkout", name], () => {
    setTimeout(() => {
      console.log(`\nChecked out "${name}".`);
      resolve();
    }, taskDelay);
  });
});

/**
 * Performes a get merge and forces THEIRS if any conflicts arise
 * @param name
 * @param gitPath
 * @returns {Promise<any>}
 */
const _mergeBranch = async (name, gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["merge", name, "-Xtheirs"], () => {
    setTimeout(() => {
      console.log(`\nMerged "${name}".`);
      resolve();
    }, taskDelay);
  });
});

/**
 * Performes a git add. Add all files
 * @param gitPath
 * @returns {Promise<any>}
 */
const _addAll = async (gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["add", "."], () => {
    setTimeout(() => {
      console.log("\nFiles added.");
      resolve();
    }, taskDelay);
  });
});

const _addN = async (gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["add", ".", "-N"], () => {
    setTimeout(() => {
      console.log("\ndummy untracked Files added.");
      resolve();
    }, taskDelay);
  });
});

/**
 * Performs a git commit
 * @param gitPath
 * @returns {Promise<any>}
 */
const _commit = async (gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["commit", "-m", "committing latest changes"], () => {
    setTimeout(() => {
      console.log("\nFiles committed.");
      resolve();
    }, taskDelay);
  });
});

/**
 * Deletes a git branch
 * @param name
 * @param gitPath
 * @returns {Promise<any>}
 */
const _deleteBranch = async (name, gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["branch", "-D", name], () => {
    setTimeout(() => {
      console.log(`\nDeleted "${name}" branch .`);
      resolve();
    }, taskDelay);
  });
});

/**
 * Creates a git branch, if it preexits then it is reset -B
 * @param name
 * @param gitPath
 * @param taskDelay
 * @returns {Promise<any>}
 * @private
 */
const _createBranch = async (name, gitPath = DEFAULT_GIT_PATH, taskDelay = TASK_DELAY) => new Promise((resolve) => {
  git(gitPath).raw(["checkout", "-B", name], () => {
    setTimeout(() => {
      console.log(`\nBranch: "${name}" created.`);
      resolve();
    }, taskDelay);
  });
});

/**
 * Creates list of files that have been modified.
 * Results are piped via writeStream to whatchanged.txt
 * @returns {Promise<any>}
 */
const _getDiffs = async (taskDelay = TASK_DELAY) => {
  let fileDiffArrayString = '';
  return new Promise((resolve) => {
    // const diffFile = (upath.join(__dirname, "../", DIFF_TEXT_FILE));
    const cmd = spawn("git", ["diff", "--name-only"], {
      shell: true
    });
    cmd.stdout.on("data", (chunk) => {
      fileDiffArrayString += chunk.toString("utf-8");
    });
    // cmd.stdout.pipe(fs.createWriteStream(diffFile));
    cmd.on("close", () => {
      // console.log("\nDiff file created.", fileDiffArray);
      setTimeout(() => {
        resolve(fileDiffArrayString.split('\n'));
      }, taskDelay);
    });
  });
};

const _gitIgnore = async () => {
  return new Promise((resolve, reject) => fs.outputFile(upath.join(GIT_IGNORE_PATH), ".ccc/\ntmp/\nnode_modules/")
    .then(resolve)
    .catch(reject)
  );
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
exports.gitIgnore = _gitIgnore;
exports.cloneRepo = _cloneRepo;
exports.addRemote = _addRemote;
exports.pull = _pull;
exports.addN = _addN;
