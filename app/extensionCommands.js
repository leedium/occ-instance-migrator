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
 * Download the widgets that had issues in the transferAll, and unzips them to
 * memory
 * @param items
 * @param errors
 * @param program
 * @returns {Promise<any>}
 */
const downloadAndRepackageWidgets = (errors, program) => new Promise((resolve, reject) => {
  const widgetsToDownload =
    errors.reduce((a, widget) => {
      // make each widget an self contained generator to run the download
      // tasks independently.
      a.push(extensionUploadObject(program, widget));
      return a;
    }, []);
  Promise.all(
    widgetsToDownload.map(widget => widget.start())
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
    const sourceInstances = await restObj.apiCall(
      program.sourceserver,
      program.sourcekey,
      constants.HTTP_METHOD_GET,
      `/widgetDescriptors/instances?fields=instances,displayName,version,latestVersion,id`
      , null
    );
    const targetInstances = await restObj.apiCall(
      program.targetserver,
      program.targetkey,
      constants.HTTP_METHOD_GET,
      `/widgetDescriptors/instances?fields=displayName,version`
      , null
    );

    const missingWidgets = sourceInstances.items.reduce((a, item) => {
      const doesExist = targetInstances.items.find((targetItem) => {
        return targetItem.displayName === item.displayName;
      });
      if (typeof doesExist === "undefined") {
        const { displayName, version, instances } = item;
        a.push({
          displayName,
          version,
          instanceId: instances[0].id
        });
      }
      return a;
    }, []);
    await downloadAndRepackageWidgets(missingWidgets.slice(1, 2), program);
    resolve();
  } else {
    resolve();
  }
});
