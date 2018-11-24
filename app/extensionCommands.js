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
const utils = require("./utils");

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

  // Handle the zipfile processing in paraller
  Promise.all(
    widgetsToDownload.map(widget => widget.start())
  )
    .then(() => {
      // console.log(`Upate of extensions from ${program.sourceserver} complete.`);
      //  Start the Sequence in serial... only because OCCS bonks out with multiple requests.

      Promise.each(widgetsToDownload, (widget) => {
        return widget.uploadToOcc();
      }).then(() => {
        console.log(`file processing complete, uploading files to ${program.targetserver}`);
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

/**
 * Entry method to begin processing of missing widgets and extensions
 * This method boostraps the tasks to find installed extensions that do not
 * @param program
 * @returns {Promise<any>}
 */
exports.analyzeLogs = program => new Promise(async (resolve) => {
  console.log(`Calculating widgets to be installed.`);
  // const errorWidgets = await processLog(program);
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
    missingWidgets.map(({ name }) => console.log(`- ${name}`));
    await downloadAndRepackageWidgets(missingWidgets.slice(2, 4), program);
    resolve();

  } else {
    resolve();
  }
});
