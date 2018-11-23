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
const fs = require("fs-extra");
const upath = require("upath");
const walker = require("walker");

const constants = require("./constants");
const restObj = require("./restObj");


const normalizePath = path => upath.normalize(path);


/**
 *
 * @param program
 * @param displayName
 * @param instances
 * @returns {{displayName: *, repositoryId: *, start: (function(): Promise<any>), getAssetPackage: (function(): Promise<any>), unzipAssetPackage: unzipAssetPackage, createApplicationId: (function(): Promise<any>), uploadToOcc: (function({displayName?: *, repositoryId: *, zipJSON: *}): Promise<any>)}}
 */
const extensionUploadObject = (program, displayName, instances) =>
    ({
      displayName,
      repositoryId: instances[0].repositoryId,
      // Starts the download and retrieval process
      start: function() {
        return new Promise(async (resolve, reject) => {
          try {
            const zipBuffer = await this.getAssetPackage();
            const appRes = await this.createApplicationId();
            const zipJSON = this.unzipAssetPackage(zipBuffer, appRes);

            // const updateExtJSON = await this.updateExtJSON(appRes, zipJSON);
            // await this.uploadToOcc(appRes, updateExtJSON)
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
      unzipAssetPackage: function(zipBuffer, appRes) {
        const zipRoot = `./.zip`;
        const extractRoot = `./.ext`;
        const filename = `${displayName}.zip`;

        const zipFilePath = `${zipRoot}/${filename}`;
        const extractFilePath = `${extractRoot}/${displayName}`;

        const extensionJSONName = `${extractFilePath}/ext.json`;

        const data = new zip(zipBuffer).generate({ base64: false, compression: "DEFLATE" });

        // Write the zipfile to a temp folder and extract it to another tmp folder
        fs.ensureDir(zipRoot);
        fs.ensureDir(extractFilePath);
        fs.writeFile(normalizePath(`${zipRoot}/${filename}`), data, "binary");
        const zipStream = fs.createReadStream(normalizePath(zipFilePath))
          .pipe(unzip.Extract({ path: normalizePath(extractFilePath) }));
        zipStream.on("close", async function() {
          // File is created.
          // Read the ext.json and swap the values for the stored values.
          // the ext.json already has predefined structure so it's just a matter of updating them
          const json = await fs.readJSON(extensionJSONName);
          json.createdBy = appRes.createdBy;
          json.description = appRes.name;
          json.developerID = "injected via occ-instance-migrator";
          json.extensionID = appRes.id;
          json.name = displayName;
          json.timeCreated = new Date().toLocaleString();
          await fs.writeJSON(normalizePath(extensionJSONName), json);

          // rezip and retun for processing
          walker(normalizePath(extractFilePath))
            .on('file',function(file,stat){
              console.log(file)
            });
          resolve();
        });
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
              resolve();
            });
        });
      }
    });

module.exports = extensionUploadObject;
