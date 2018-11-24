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

const constants = require("./constants");
const extensionUploadObject = require("./extensionUploadObject");
const restObj = require("./restObj");
const utils = require("./utils");

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
      // make each widget an self contained generator to run the download tasks
      // independently.
      a.push(extensionUploadObject(program, widget));
      return a;
    }, []);

  // Handle the zipfile processing in parallel
  Promise.all(
    widgetsToDownload.map(widget => widget.start())
  )
    .then(() => {
      //  Start the Sequence in serial... only because OCCS bonks out with
      // multiple requests.
      Promise.each(widgetsToDownload, (widget) => {
        return widget.uploadToOcc();
      }).then(() => {
        console.log(`\nFile processing complete, uploading files to ${program.targetserver}.\n`);
        resolve();
      });
    })
    .catch((err) => {
     reject(err);
    });
});

/**
 * Entry method to begin processing of missing widgets and extensions
 * This method boostraps the tasks to find installed extensions that do not
 * @param program
 * @returns {Promise<any>}
 */
exports.analyzeLogs = program => new Promise(async (resolve) => {
  console.log(`Calculating widgets to be installed.\n`);
  // get a list of extensions from the source server and filter them by name
  const sourceInstances = await restObj.apiCall(
    program.sourceserver,
    program.sourcekey,
    constants.HTTP_METHOD_GET,
    `/ccadmin/v1/extensions`
    , null
  );
  // get a list of the extensions from the target server
  const targetInstances = await restObj.apiCall(
    program.targetserver,
    program.targetkey,
    constants.HTTP_METHOD_GET,
    `/ccadmin/v1/extensions`
    , null
  );

  const missingWidgets = sourceInstances.items.reduce((a, sourceItem) => {
    const doesExist = targetInstances.items.find((targetItem) => {
      return (targetItem.name === sourceItem.name && sourceItem.enabled);
    });
    if (typeof doesExist === "undefined") {
      const { name, version, zipPath, developerId, description, creationTime } = sourceItem;
      a.push({
        name,
        version,
        zipPath,
        developerId,
        description,
        creationTime
      });
    }
    return a;
  }, []);
  if (missingWidgets.length) {
    console.log("Missing widgets exist:");
    missingWidgets.map(({ name }) => console.log(`- "${name}"`));
    console.log("======================\n");
    await downloadAndRepackageWidgets(missingWidgets.slice(2, 4), program);
    resolve();
  } else {
    resolve();
  }
});
