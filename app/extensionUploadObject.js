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

const constants = require("./constants");
const restObj = require("./restObj");

/**
 * Return a self contained object to handle the zip download and reupload process
 * @param program
 * @param name
 * @param version
 * @param zipPath
 * @returns {
 * {appRes: null,
 * updatedZip: null,
 * start: (function(): Promise<any>),
 * getAssetPackage: (function(): Promise<any>),
 * updateZipContents: (function(*=, *): Promise<any>),
 * createApplicationId: (function(): Promise<any>),
 * uploadToOcc: (function(): Promise<any>)}}
 */
const extensionUploadObject = (program, { name, version, zipPath}) =>
  ({
    // Starts the download and retrieval process
    appRes: null,
    updatedZip: null,
    start: function() {
      const self = this;
      return new Promise(async (resolve, reject) => {
        console.log(`Installing  ${name} `);
        try {
          const zipBuffer = await this.getAssetPackage();
          self.appRes = await this.createApplicationId();
          self.updatedZip = await this.updateZipContents(zipBuffer, self.appRes);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    },
    //  Retrieves the asset package from OCC
    getAssetPackage: function() {
      return new Promise((resolve, reject) => {
        restObj.apiCall(
          program.sourceserver,
          program.sourcekey,
          constants.HTTP_METHOD_GET,
          `/file/${zipPath}`,
          null,
          "arraybuffer"
        )
          .then(resolve)
          .catch(reject);
      });
    },

    /**;
     * Updates the in memory zip with the recently created ExtensionId preserving
     * the previous configuration settings.
     * @param zipBuffer
     * @param appRes
     */
    updateZipContents: function(zipBuffer, appRes) {
      return new Promise(resolve => {
        const unzipped = new zip(zipBuffer, { base64: false, checkCRC32: true });
        const extJSON = JSON.parse(unzipped.files["ext.json"]._data);
        extJSON.extensionID = appRes.id;
        unzipped.files["ext.json"]._data = JSON.stringify(extJSON);
        const updatedZip = new zip();
        updatedZip.files = unzipped.files;
        updatedZip.generate({ base64: true });
        resolve(updatedZip);
        resolve(updatedZip);
      });
    },

    //  create a new ApplicationID(extensionId) to be used
    createApplicationId: function() {
      return new Promise((resolve) => {
        const dateTime = new Date();
        restObj.apiCall(
          program.targetserver,
          program.targetkey,
          constants.HTTP_METHOD_POST,
          `/ccadmin/v1/extensions/id`, {
            name: `${name} by occ-instance-migrator on ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}.`,
            type: `extension`
          }, constants.HTTP_CONTENT_TYPE_JSON, {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-CCProfileType": "applicationAccess"
          })
          .then(resolve);
      });
    },

    //  Rezips the in memory expanded zip and then uploads to the target OCCS instance
    uploadToOcc: function() {
      console.log(`Uploading ${name}...`);
      const self = this;
      const { repositoryId } = this.appRes;
      return new Promise(async (resolve) => {
        try {
          const filename = `oim_${repositoryId}.zip`;

          // payload for doFileUploadMultipart
          const payloadInit = {
            "filename": `/extensions/${filename}`,
            "segments": 1
          };

          // doFileUpload init
          const { token } = await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_PUT,
            `/ccadmin/v1/files`,
            payloadInit,
            "json"
          );

          // payload for doFileSegmentUpload
          const payloadUpload = {
            filename: payloadInit.filename,
            file: self.updatedZip.generate({ base64: true }),
            index: 0
          };

          // doFileSegmentUpload
          const uploadedFiles = await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/ccadmin/v1/files/${token}?changeContext=designStudio`,
            payloadUpload
          );

          // create extension
          await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/ccadmin/v1/extensions`,
            { name: filename }
          )
            .then(() => {
              console.log(`Extension ${name} installed. (${program.targetserver})`);
              resolve();
            });
        } catch (e) {
          console.log(e);
          reject(e);
        }
      });
    }
  });
module.exports = extensionUploadObject;
