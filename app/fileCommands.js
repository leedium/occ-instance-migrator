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
const readline = require("readline");
const upath = require("upath");
const rimraf = require("rimraf");

const constants = require('./constants');

const TASK_DELAY = require("./constants").TASK_DELAY;


/**
 * whatchanged.txt is read and the results filtered by files that
 * have been updated and added.
 * @returns {Promise<any>}
 */
const _processDiffs = () => new Promise((resolve) => {
  //  stores
  const instanceRef = [];
  let transferRef = [];
  let widgetRef = [];
  const transferPathArrayTemp = {};

  const diffFile = (upath.join(__dirname, '../', constants.DIFF_TEXT_FILE));


  // reads line from whatchanged.txt
  const rl = readline.createInterface({
    input: fs.createReadStream(diffFile)
  });
  rl.on("line", (line) => {
    const infoArray = line.split("\t");
    const pathString = infoArray[1];
    const modType = infoArray[0].split(" ")[4];
    const pathArray = pathString.split("/");
    let path;
    path = pathArray.slice(0, pathArray.length - 1).join("/");

    // Checks if the difference is an addition or modification
    // Renames and deletions are ignored.
    if (modType !== constants.GitMergeKeys.DELETED && modType.indexOf(constants.GitMergeKeys.RENAMED) < 0) {
      if (!transferPathArrayTemp[path]) {
        if (path.indexOf(constants.APP_ID) < 0) {
          let sp = path.split("/");
          transferRef.push({
            path: sp.slice(0, 4).join("/"),
            type: sp[0]
          });
          transferPathArrayTemp[`${path}`] = true;
        }
      }
    }
  });

  //  When EOF and close, modify the paths best suited for OCC DCU structure
  rl.on("close", () => {
    // console.log("\n\n\nTransfer Paths");

    const pathListSearched = {};
    const filteredSearched = {};
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

        //  Grab Only Widgets root folders that are updated
        //  This will be used for all the root level non /instance folders and files that are
        //  required for the DCU transfer
        if (type === constants.ExtensionTypes.WIDGET && pSplit[2] !== constants.DCUSubFolder.INSTANCES) {
          widgetRef.push({ type, path });
          path = pSplit.slice(0, 2).join("/");
        }

        //  If path is of type widget and includes an instance folder store value so that it
        //  will get added back after the instance folder removal
        else if (type === constants.ExtensionTypes.WIDGET && pSplit[2] === constants.DCUSubFolder.INSTANCES) {
          path = pSplit.slice(0, 2).join("/");
          instanceRef.push({ type, path });
          return ac;
        }

        // If path is of typ stack store the re
        // else if (pSplit[2] === ExtensionTypes.STACK) {
        //   stackRef.push({
        //     type,
        //     path: pSplit.slice(0, 3).join("/")
        //   });
        // }

        if (!filteredSearched[path]) {
          filteredSearched[path] = true;
          ac.push({ type, path });
        }
        return ac;
      }, []);
    // console.log('Diff file processing transferRef.', transferRef);
    // console.log('Diff file processing widgetRef.', widgetRef);
    // console.log('Diff file processing instanceRef.', instanceRef);
    resolve({transferRef, instanceRef, widgetRef});
  });
});

/**
 *  Constructs the temporary folder which will be used by the DCU's transferAll
 * @param transferRef
 * @param instanceRef
 * @param widgetRef
 * @returns {Promise<any>}
 * @private
 */
const _makeTmpFolder = async ({transferRef, instanceRef, widgetRef}) => new Promise(async (resolve) => {
  //  create temp folder
  fs.ensureDirSync(upath.normalizeSafe(`./${constants.TEMP_FOLDER}`));

  // create .ccc tracking folder
  fs.ensureDirSync(`${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}`);

  // copy root .ccc/config.json
  fs.copySync(`${constants.DCUSubFolder.CCC}/config.json`, `${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/config.json`);

  // copy dcu source and tracking file to temp
  transferRef.map(({ type, path }) => {
    try {
      fs.ensureDirSync(`${constants.TEMP_FOLDER}/${path}`);
      fs.ensureDirSync(`${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/${path}`);
      fs.copySync(path, `${constants.TEMP_FOLDER}/${path}`);
      fs.copySync(`${constants.DCUSubFolder.CCC}/${path}`, `${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/${path}`);
    }catch (err) {
      console.log(err);
    }
  });

  //  Blow away the instance folder.  We need to do this as we only want to
  //  include the instances we stored in instanceRef array
  widgetRef.map(({ type, path }) => {
    if (type === constants.ExtensionTypes.WIDGET) {
      fs.removeSync(`${constants.TEMP_FOLDER}/${path}/${constants.DCUSubFolder.INSTANCES}`);
      fs.removeSync(`${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/${path}/${constants.DCUSubFolder.INSTANCES}`);
    }
  });

  //  Add back the selected widget instances
  instanceRef.map(({ type, path }) => {
    if (type === constants.ExtensionTypes.WIDGET) {
      fs.ensureDirSync(`${constants.TEMP_FOLDER}/${path}`);
      fs.ensureDirSync(`${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/${path}`);
      fs.copySync(path,`${constants.TEMP_FOLDER}/${path}`);
      fs.copySync(`${constants.DCUSubFolder.CCC}/${path}`, `${constants.TEMP_FOLDER}/${constants.DCUSubFolder.CCC}/${path}`);
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
    rimraf(item, {}, ()=>{
      count += 1;
      if(count >= pathsToBeRemoved.length){
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