/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-react-solution
 * @file extensionUploadObject.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 23/11/2018
 * @description Object to handle the tasks to transfer itself from source to target
 */

const zip = require("node-zip");
const unzip = require("unzip");
const fs = require('fs-extra');

const constants = require("./constants");
const restObj = require("./restObj");


module.exports = (program, displayName, instances) =>
  ({
    displayName,
    repositoryId: instances[0].repositoryId,
    // Starts the download and retrieval process
    start: function() {
      return new Promise(async (resolve, reject) => {
        try {
          const zipBuffer = await this.getAssetPackage();
          const zipJSON = this.unzipAssetPackage(zipBuffer);
          // const createApplicationIdRes = await this.createApplicationId();
          // const updateExtJSON = await this.updateExtJSON(createApplicationIdRes, zipJSON);
          // await this.uploadToOcc(createApplicationIdRes, updateExtJSON)
          //   .then(resolve);
        //
        } catch (err) {
          reject(err);
        }
      });
    },

    //  Retrieves the asset package from OCC
    getAssetPackage: function() {
      return new Promise((resolve, reject) => {
        console.log(`Downloading missing widgets: ${displayName} ...`);
        try {
          restObj.apiCall(
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
      const zipRoot = `./.zip`;
      const extractRoot = `./.ext`;
      const filename = `${displayName}.zip`;

      const zipFilePath =  `${zipRoot}/${filename}`;
      const extractFilePath = `${extractRoot}/${displayName}`;
      const data =  new zip(zipBuffer).generate({base64: false, compression:'DEFLATE'});

      fs.ensureDirSync(zipRoot);
      fs.ensureDirSync(extractFilePath);
      fs.writeFileSync(`${zipRoot}/${filename}`, data, 'binary');
      fs.createReadStream(zipFilePath).pipe(unzip.Extract({ path: extractFilePath }));
    },

    //  create a new ApplicationID(extensionId) to be used
    createApplicationId: function() {
      console.log(`Create Widget Application Id ...`);
      return new Promise((resolve) => {
        const dateTime = new Date();
        restObj.apiCall(
          program.targetserver,
          program.targetkey,
          constants.HTTP_METHOD_POST,
          `/extensions/id`, {
            name: `Extension ID for ${displayName} extension requested by ccw on ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}.`,
            type: `extension`
          }, constants.HTTP_CONTENT_TYPE_JSON, {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-CCProfileType": "applicationAccess"
          })
          .then(resolve);
      });
    },

    // updates ext.JSON with the required data for uploading
    updateExtJSON: function(extData, zipJSON) {
      zipJSON.files["ext.json"]._data = zipJSON.files["ext.json"]._data
        .replace("[Insert Created By here]", extData.createdById)
        .replace("[Insert Description here]", extData.name)
        .replace("[Insert Developer ID here]", "injected via occ-instance-migrator")
        .replace("[Insert Extension ID here]", extData.id)
        .replace("[Insert name here]", displayName)
        .replace("[Insert Time Created here]", new Date().toLocaleString());
      return zipJSON;
    },

    //  Rezips the in memory expanded zip and then uploads to the target OCCS instance
    uploadToOcc: function({ displayName, repositoryId, zipJSON }) {
      return new Promise(async (resolve) => {
        const filename = `oim_${repositoryId}.zip`;

        // payload for doFileUploadMultipart
        const payloadInit = {
          "filename": `/extensions/${filename}`,
          "segments": 1
        };

        // doFileUpload init
        const { token } = await restObj.apiCall(
          program.sourceserver,
          program.sourcekey,
          constants.HTTP_METHOD_PUT,
          `/files`,
          payloadInit,
          "json"
        );

        // payload for doFileSegmentUpload
        const payloadUpload = {
          filename: payloadInit.filename,
          file: zipJSON.generate({ base64: true }),
          index: 0,
          token
        };

        // doFileSegmentUpload
        await restObj.apiCall(
          program.sourceserver,
          program.sourcekey,
          constants.HTTP_METHOD_POST,
          `/files/${token}?changeContext=designStudio`,
          payloadUpload
        );

        // create extension
        await restObj.apiCall(
          program.sourceserver,
          program.sourcekey,
          constants.HTTP_METHOD_POST,
          `/extensions`,
          { name: filename }
        )
          .then(() => {
            console.log(`Extension ${displayName} installed.`);
            resolve()
          });
      });
    }
  });
