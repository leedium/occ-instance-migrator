/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file fileCommands.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 16/11/2018
 * @description  Methods to interface with the file system
 */

const fs = require("fs-extra");
const upath = require("upath");
const rimraf = require("rimraf");

const constants = require("./constants");

const TASK_DELAY = require("./constants").TASK_DELAY;


/**
 * whatchanged.txt is read and the results filtered by files that
 * have been updated and added.
 * @returns {Promise<any>}
 */
const _processDiffs = (diffs) => new Promise((resolve) => {
  //  stores
  const instanceRef = [];
  let transferRef = [];
  let widgetRef = [];
  let cccRef = [];
  const transferPathArrayTemp = {};
  const pathListSearched = {};
  const filteredSearched = {};



  diffs.forEach(({ status, path }) => {
    // Checks if the difference is an addition or modification
    // Renames and deletions are ignored.
    if (status === constants.GitMergeKeys.MODIFIED || status === constants.GitMergeKeys.UNTRACKED) {
      if (!transferPathArrayTemp[path]) {
        let sp = path.split("/");
        transferRef.push({
          path: sp.slice(0, 4).join("/"),
          type: sp[0]
        });
        transferPathArrayTemp[`${path}`] = true;
      }
    }
  });

  transferRef = transferRef.reduce((a, pathObj) => {
    // Convert flat paths to object with extensionType and path
    const { type, path } = pathObj;
    if (!pathListSearched[pathObj.path]) {
      pathListSearched[pathObj.path] = true;
      a.push({
        type,
        path
      });
    }
    return a;
  }, []).reduce(
    // Convert paths to grab necessary files for OCC DCU folder structure
    // Keep track of widget instance folders
    (ac, pathObj) => {

      let { type, path } = pathObj;
      const pSplit = path.split("/");

      // Keep track of any folder and store just the extension for later .ccc copy
      // if (pSplit.length >= 2 || pSplit[0] === 'global') {
      //   const p = pSplit.slice(0, 1).join("/");
      //   if (cccRef.indexOf(p) < 0) {
      //     cccRef.push({
      //       type,
      //       path:p
      //     });
      //   }
      // }

      // Dont include and paths that have one subfolder (extension)
      if (pSplit.length === 2 && type === constants.ExtensionTypes.WIDGET) {
        return ac;
      }

      else if (type === constants.ExtensionTypes.THEME) {
        path = pSplit.slice(0, 2).join("/");
      }

      //  If path is of type widget and includes an instance folder store value so that it
      //  will get added back after the instance folder removal
      else if (type === constants.ExtensionTypes.WIDGET && pSplit[2] === constants.DCUSubFolder.INSTANCES) {
        const widgetPath = pSplit.slice(0, 2).join("/");
        const instancePath = pSplit.slice(0, 3).join("/");

        widgetRef.push({ type, path: widgetPath });
        instanceRef.push({ type, path: instancePath });

        path = widgetPath;
      }

      // If path is of type widget and only config values have changed
      else if (type === constants.ExtensionTypes.WIDGET && (pSplit[2] === constants.DCUSubFolder.CONFIG ||
        pSplit[2] === constants.DCUSubFolder.JS ||
        constants.widgetOrphanFiles.indexOf(pSplit[2]) >=0
      )) {
        const widgetPath = pSplit.slice(0, 2).join("/");
        widgetRef.push({ type, path: widgetPath });
        path = widgetPath;
      }

      if (!filteredSearched[path]) {
        filteredSearched[path] = true;
        ac.push({ type, path });
      }

      // console.log(path)

      return ac;
    }, []);

  transferRef.map(item => {console.log(item)})

  resolve({ transferRef, instanceRef, widgetRef, cccRef });
});

/**
 *  Constructs the temporary folder which will be used by the DCU's transferAll
 * @param transferRef
 * @param instanceRef
 * @param widgetRef
 * @returns {Promise<any>}
 * @private
 */
const _makeTmpFolder = async ({ transferRef, instanceRef, widgetRef, cccRef }) => new Promise(async (resolve) => {
  //  create temp folder
  fs.ensureDirSync(upath.normalizeSafe(`./${constants.TEMP_FOLDER}`));

  // create .ccc tracking folder
  fs.ensureDirSync(`./${upath.normalizeSafe(constants.TEMP_FOLDER)}/${constants.DCUSubFolder.CCC}`);

  // copy root .ccc/config.json
  fs.copySync(`${constants.DCUSubFolder.CCC}/config.json`, `${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/config.json`);

  // copy dcu source and tracking file to temp
  // console.log(`${transferRef}`);
  transferRef.map(({ type, path }) => {
    try {
      if (type !== constants.ExtensionTypes.GLOBAL) {
        fs.ensureDirSync(`${constants.TEMP_FOLDER}/${path}`);
        fs.copySync(path, `${constants.TEMP_FOLDER}/${path}`);
      }else{
        fs.ensureFileSync(`${constants.TEMP_FOLDER}/${path}`);
        fs.copyFileSync(path, `${constants.TEMP_FOLDER}/${path}`);
      }
    } catch (err) {
      console.log(err);
    }
  });

  // To make it easy we copy all the reference files
  fs.ensureDirSync(`${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}`);
  fs.copySync(`${constants.DCUSubFolder.CCC}`, `${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}`);

  //  Blow away the instance folder.  We need to do this as we only want to
  //  include the instances we stored in instanceRef array
  widgetRef.map(({ type, path }) => {
    if (type === constants.ExtensionTypes.WIDGET) {
      fs.removeSync(`${constants.TEMP_FOLDER}/${path}/${constants.DCUSubFolder.INSTANCES}`);
    }
  });

  //  Add back the selected widget instances
  instanceRef.map(({ type, path }) => {
    if (type === constants.ExtensionTypes.WIDGET) {
      fs.ensureDirSync(`${constants.TEMP_FOLDER}/${path}`);
      fs.copySync(path, `${constants.TEMP_FOLDER}/${path}`);
    }
  });
  resolve();
});

/**
 * Removes paths specified in Array
 * @param pathsToBeRemoved - Array
 */
const _deleteFilePath = async (pathsToBeRemoved) => new Promise(async (resolve) => {
  console.log("Removing...", pathsToBeRemoved);
  let count = 0;
  pathsToBeRemoved.map((item) => {
    rimraf(item, {}, () => {
      count += 1;
      if (count >= pathsToBeRemoved.length) {
        setTimeout(() => {
          resolve();
        }, TASK_DELAY);
      }
    });
  });
});

//exports
exports.processDiffs = _processDiffs;
exports.makeTmpFolder = _makeTmpFolder;
exports.deleteFilePath = _deleteFilePath;
