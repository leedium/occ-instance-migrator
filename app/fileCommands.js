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

const constants = require('./constants');

//  stores
const instanceRef = [];
let transferRef = [];
let widgetRef = [];


/**
 * whatchanged.txt is read and the results filtered by files that
 * have been updated and added.
 * @returns {Promise<any>}
 */
const _processDiffs = function() {
  return new Promise((resolve) => {
    const transferPathArrayTemp = {};

   const diffFile = (upath.join(__dirname,'../',constants.DIFF_TEXT_FILE))

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
              path: sp.slice(0, 5).join("/"),
              type: sp[1]
            });
            transferPathArrayTemp[`${path}`] = true;
          }
        }
      }
    });

    //  When EOF and close, modify the paths best suited for OCC DCU structure
    rl.on("close", () => {
      console.log("\n\n\nTransfer Paths");

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

          // skip if invalid path
          if (pSplit.length <= 2) {
            return ac;
          }

          //  Grab Only Widgets root folders that are updated
          //  This will be used for all the root level non /instance folders and files that are
          //  required for the DCU transfer
          if (type === constants.ExtensionTypes.WIDGET && pSplit[3] != constants.DCUSubFolder.INSTANCES) {
            widgetRef.push({ type, path });
            path = pSplit.slice(0, 3).join("/");
          }

          //  If path is of type widget and includes an instance folder store value so that it
          //  will get added back after the instance folder removal
          else if (pSplit[3] === constants.DCUSubFolder.INSTANCES && type === constants.ExtensionTypes.WIDGET) {
            path = pSplit.slice(0, 3).join("/");
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
            console.log(`path: ${path}`, `type: ${type}`);
          }
          return ac;
        }, []);
      resolve(transferRef);
    });
  });
};

/**
 * Constructs the temporary folder which will be used by the DCU's transferAll
 * @param transferRef
 * @returns {Promise<*>}
 * @private
 */
const _makeTmpFolder = async function(transferRef) {
  return new Promise(async (resolve) => {
    //  create temp folder
    fs.ensureDirSync(constants.TEMP_FOLDER);

    const workingTransfer = WORKING_FOLDER.split("/")[1];

    // create temp folder
    fs.ensureDirSync(`${TEMP_FOLDER}/${workingTransfer}/${DCUSubFolder.CCC}`);

    // copy root .ccc/config.json
    fs.copySync(`${WORKING_FOLDER}/${DCUSubFolder.CCC}/config.json`, `${TEMP_FOLDER}/${workingTransfer}/${DCUSubFolder.CCC}/config.json`);

    // copy dcu source and tracking file to temp
    transferRef.map(({ type, path }) => {
      const pathSplitArray = path.split("/");
      const dcuSourceFolder = pathSplitArray.slice(0, pathSplitArray.length).join("/");
      pathSplitArray[1] = `${DCUSubFolder.CCC}/${pathSplitArray[1]}`;
      let dcuTrackingFolder = pathSplitArray.slice(0, pathSplitArray.length).join("/");

      try {
        fs.ensureDirSync(`${TEMP_FOLDER}/${dcuSourceFolder}`);
        fs.ensureDirSync(`${TEMP_FOLDER}/${dcuTrackingFolder}`);
        fs.copySync(`${path}`, `${TEMP_FOLDER}/${dcuSourceFolder}`);
        fs.copySync(dcuTrackingFolder, `${TEMP_FOLDER}/${dcuTrackingFolder}`);
      } catch (err) {
        console.log(err);
      }
    });

    //  Blow away the instance folder.  We need to do this as we only want to
    //  include the instances we stored in instanceRef array
    widgetRef.map(({ type, path }) => {
      if (type === ExtensionTypes.WIDGET) {
        const splPath = path.split("/");
        ;
        const cPath = splPath.slice(0);
        cPath.splice(1, 0, DCUSubFolder.CCC);
        const fp = `${TEMP_FOLDER}/${splPath.slice(0, 3).join("/")}/${DCUSubFolder.INSTANCES}`;
        const cp = `${TEMP_FOLDER}/${cPath.join("/")}/${DCUSubFolder.INSTANCES}`;
        fs.removeSync(fp);
        fs.removeSync(cp);
      }
    });

    //  Add back the selected widget instances
    instanceRef.map(({ type, path }) => {
      if (type === ExtensionTypes.WIDGET) {
        let cSpl = path.split("/");
        cSpl.splice(1, 0, DCUSubFolder.CCC);
        let cI = cSpl.join("/");
        fs.ensureDirSync(`${TEMP_FOLDER}/${path}`);
        fs.ensureDirSync(`${TEMP_FOLDER}/${cI}`);
        fs.copySync(path, `${TEMP_FOLDER}/${path}`);
        fs.copySync(cI, `${TEMP_FOLDER}/${cI}`);
      }
    });
    resolve();
  });
};

/**
 * Removes paths specified in Array
 * @param pathsToBeRemoved - Array
 */
const _deleteFilePath = async function(pathsToBeRemoved) {
  return new Promise(async (resolve) => {
    console.log("Removing...", pathsToBeRemoved);
    pathsToBeRemoved.map((item) => {
      fs.removeSync(item);
    });
    setTimeout(() => {
      resolve();
    }, program.taskdelay);
  });
};

//exports
exports.processDiffs = _processDiffs;
exports.makeTmpFolder = _makeTmpFolder;
exports.deleteFilePath = _deleteFilePath;