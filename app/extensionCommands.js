/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file extensionCommands.js
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
const extensionUploadObject = require("./extensionUploadObject");
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
 * @param widgetArray
 * @param program
 * @returns {Promise<any>}
 */
const transfomErrorsToRequests = (widgetArray, program) => new Promise(resolve => {
  console.log(widgetArray);
  resolve();
});

/**
 * Download the widgets that had issues in the transferAll, and unzips them to
 * memory
 * @param items
 * @param errors
 * @param program
 * @returns {Promise<any>}
 */
const downloadAndRepackageWidgets = (items, errors, program) => new Promise((resolve, reject) => {
  const widgetsToDownload =
    items
      .filter(item => {
        return errors.indexOf(item.displayName) >= 0;
      })
      .reduce((a, { displayName, instances }) => {
        // make each widget an self contained generator to run the download
        // tasks independently.
        const widget = extensionUploadObject(program, displayName, instances);
        a.push(widget);
        return a;
      }, []);
  Promise.all(
    widgetsToDownload.slice(1).map(widget => widget.start())
  )
    .then(() => {
      console.log("Download complete.");
      resolve();
    })
    .catch((err) => {
      console.log(err);
    });
});

/**
 * Entry method to begin processing of errors
 * @param program
 * @returns {Promise<any>}
 */
exports.analyzeLogs = program => new Promise(async (resolve) => {
  const errorWidgets = await processLog(program);
  if (errorWidgets.length) {
    // get a list of widget instance from the source server and filter them by name
    await restObj.apiCall(
      program.sourceserver,
      program.sourcekey,
      constants.HTTP_METHOD_GET,
      `/assetPackages/${instances[0].repositoryId}?type=widget&wrap=true`,
      null,
      "arraybuffer"
    );
    const { items } = await restObj.apiCall(
      program.sourceserver,
      program.sourcekey,
      constants.HTTP_METHOD_GET,
      `/widgetDescriptors/instances?fields=instances,displayName`
      , null
    );
    await downloadAndRepackageWidgets(items, errorWidgets, program);
  } else {
    resolve();
  }
});
