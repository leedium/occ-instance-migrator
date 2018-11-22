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
const nodeZip = require("node-zip");

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
  resolve();
});

/**
 * Download the widgets that had issues in the transferAll, and unzips them to
 * memory
 * @param items
 * @returns {Promise<any>}
 */
const downloadAndRepackageWidgets = (items, errors, r, program) => new Promise((resolve, reject) => {
  const widgetsToDownload = items.filter(item => {
    return errors.indexOf(item.displayName) >= 0;
  }).reduce((a, { displayName, instances }) => {

    // make each widget an self contained generator to run the download
    // tasks independently.
    const widget = {
      displayName,
      repositoryId: instances[0].repositoryId,
      start: async function() {
        try {
          const getAssetPackageRes = await this.getAssetPackage();
          const unzipAssetPackageRes = this.unzipAssetPackage(getAssetPackageRes);
          const createApplicationIdRes = await this.createApplicationId(unzipAssetPackageRes);
          const updateExtJSON = await this.updateExtJSON(createApplicationIdRes, unzipAssetPackageRes);
          const rezipAndUploadToOCCRes = await this.uploadToOcc(updateExtJSON);
        } catch (err) {
          console.log(err);
        }
      },

      //  Retrieves the asset package from OCC
      getAssetPackage: function() {
        return new Promise((resolve, reject) => {
          console.log(`Downloading missing widgets: ${this.displayName} ...`);
          try {
            r.apiCall(
              program.sourceserver,
              program.sourcekey,
              constants.HTTP_METHOD_GET,
              `/assetPackages/${instances[0].repositoryId}?type=widget&wrap=true`,
              null,
              "arraybuffer"
            )
              .then(resolve);

          } catch (err) {
            reject(err);
          }
        });
      },

      //  Unzips the package
      unzipAssetPackage: function(zipBuffer) {
        console.log(`Unzipping  ${this.displayName}...`);
        const zipJSON = new nodeZip(zipBuffer, { base64: false, checkCRC32: true });
        return {
          displayName,
          repositoryId: instances[0].repositoryId,
          zipJSON
        };
      },

      //  create a new ApplicationID(extensionId) to be used
      createApplicationId: function() {
        console.log(`Create Widget Application Id ...`);
        return new Promise((resolve, reject) => {
          const self = this;
          const dateTime = new Date();
          r.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/extensions/id`, {
              name: `Extension ID for ${self.displayName} extension requested by ccw on ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}.`,
              type: `extension`
            }, constants.HTTP_CONTENT_TYPE_JSON, {
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "X-CCProfileType": "applicationAccess"
            })
            .then(resolve);
        });
      },

      // updates ext.JSON with the required data for uploading
      updateExtJSON: function(extData, unzippedData) {
        unzippedData.zipJSON.files["ext.json"]._data = unzippedData.zipJSON.files["ext.json"]._data
          .replace("[Insert Created By here]", extData.createdById)
          .replace("[Insert Description here]", extData.name)
          .replace("[Insert Developer ID here]", "injected via occ-instance-migrator")
          .replace("[Insert Extension ID here]", extData.id)
          .replace("[Insert name here]", this.displayName)
          .replace("[Insert Time Created here]", new Date().toLocaleString());
        return unzippedData;
      },

      //  Rezips the in memory expanded zip and then uploads to the target OCCS instance
      uploadToOcc: function() {

      }
    }

    a.push(widget);
    return a;
  }, []);
  Promise.all(
    widgetsToDownload.map(widget => widget.start())
  )
    .then(res => {
      console.log("Download complete.");
      // resolve(res);
    })
    .catch(reject);
});

/**
 * Entry method to begin processing of errors
 * @param program
 * @returns {Promise<any>}
 */
exports.analyzeLogs = program => new Promise(async (resolve) => {
  const errorWidgets = await processLog(program);
  if (errorWidgets.length) {
    const r = restObj(program);
    const { items } = await r.apiCall(
      program.sourceserver,
      program.sourcekey,
      constants.HTTP_METHOD_GET,
      `/widgetDescriptors/instances?fields=instances,displayName`
      , null
    );
    const widgets = await downloadAndRepackageWidgets(items, errorWidgets, r, program);
  } else {
    resolve();
  }
});
