/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file extCommands.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 17/11/2018
 * @description Extension commands.
 *              These interfaces will install any missing extensions outlined
 *              in the previous transfer attempt.
 */

const fs = require("fs-extra");

const constants = require("./constants");
const restObj = require("./restObj");

/**
 * Parses the logfle for errors and if extensions need to be installed
 * @returns {Promise<any>}
 */
const processLog = () => new Promise(resolve => {
  const file = fs.readFileSync(constants.LOGFILE).toString();
  //  find files with errors.
  //  errors are signed by special text
  const r = /1m(.*?)\u001b/g;

  // console.log(file.toString());

  const problemExtensions = file.toString().match(r).map((val) => {
    const pathArray = val.replace("1m", "").replace("\u001b", "").split("/");
    let x;
    return pathArray.slice(x = pathArray.indexOf("widget"), x + 2)[1];
  }).reduce((ac, item) => {
    if (ac.indexOf(item) < 0 && typeof item !== "undefined") {
      ac.push(item);
    }
    return ac;
  }, []);

  resolve(problemExtensions);
  resolve();
});

/**
 * This method converts the error responses to promises that
 * will handle any loads
 * @returns {Promise<any>}
 */
const transfomErrorsToRequests = (widgetArray, program) => new Promise(resolve => {
  console.log(widgetArray);
  const tmpObj = {};
  widgetArray.map(widget => {
  });
  resolve();
});

/**
 * Entry method to begin processing of errors
 * @param program
 * @returns {Promise<any>}
 */
exports.analyzeLogs = program => new Promise(async (resolve) => {
  const errors = await processLog(program);
  if (errors.length) {
    const r = restObj(program);
    const { items } = await r.apiCall("GET", `${program.sourceserver}/ccadmin/v1/widgetDescriptors/instances?fields=instances,displayName`, null);
    const widgetsToDownload = items.filter(item => {
      return errors.indexOf(item.displayName) >= 0;
    }).reduce((a, { displayName, instances }) => {
      a.push({
        displayName,
        repositoryId: instances[0].repositoryId,
        getAssetPackage: () => {
          return new Promise(async (resolve, reject) => {
            try {
              const data = await r.apiCall("GET", `${program.sourceserver}/ccadmin/v1/assetPackages/${instances[0].repositoryId}?type=widget&wrap=true`, null, "arraybuffer");
              console.log(data);
              fs.writeFile(`${instances[0].repositoryId}.zip`, data, resolve);
            }catch(err){
              reject(err);
            }
          });
        }
      });
      return a;
    }, []);
    widgetsToDownload
  } else {
    resolve();
  }
});
