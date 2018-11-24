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
const formatDateForExtenstion = require("./utils").formatDateForExtenstion;

const normalizePath = path => upath.normalize(path);

/**
 *
 * @param program
 * @param displayName
 * @param instances
 * @returns {{displayName: *, repositoryId: *, start: (function(): Promise<any>), getAssetPackage: (function(): Promise<any>), unzipAssetPackage: unzipAssetPackage, createApplicationId: (function(): Promise<any>), uploadToOcc: (function({displayName?: *, repositoryId: *, zipJSON: *}): Promise<any>)}}
 */
const extensionUploadObject = (program, { displayName, version, instanceId }) =>
  ({
    displayName,
    instanceId: instanceId,
    // Starts the download and retrieval process
    start: function() {
      return new Promise(async (resolve, reject) => {
        try {
          const zipBuffer = await this.getAssetPackage();
          console.log(`Downloading  ${this.displayName} complete.`);
          const appRes = await this.createApplicationId();
          const updatedZip = await this.unzipAssetPackage(zipBuffer, appRes);
          await this.uploadToOcc(appRes, updatedZip)
            .then(resolve)
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
          `/assetPackages/${instanceId}?type=widget&wrap=true`,
          null,
          "arraybuffer"
        )
          .then(resolve)
          .catch(reject);
      });
    },

    //  Unzips the package
    unzipAssetPackage: function(zipBuffer, appRes) {
      return new Promise(async function(resolve) {
        const zipRoot = `./.zip`;
        const extractRoot = `./.ext`;
        const filename = `${displayName}.zip`;
        const zipFilePath = `${zipRoot}/${filename}`;
        const extractFilePath = `${extractRoot}/${displayName}`;
        const extensionJSONName = `${extractFilePath}/ext.json`;
        const data = new zip(zipBuffer).generate({ base64: false, compression: "DEFLATE" });

        // Write the zipfile to a temp folder and extract it to another tmp folder
        // fs.ensureDir(zipRoot);
        await fs.ensureFile(zipFilePath);
        await fs.writeFile(normalizePath(`${zipRoot}/${filename}`), data, "binary");
        const zipStream = fs.createReadStream(normalizePath(zipFilePath))
          .pipe(unzip.Extract({ path: normalizePath(extractFilePath) }));
        zipStream.on("close", function() {
          // File is created.
          // Read the ext.json and swap the values for the stored values.
          // the ext.json already has predefined structure so it's just a matter of updating them
          const json = fs.readJSON(extensionJSONName)
            .then(function(resJSON) {
              console.log('DL:', version, displayName)
              resJSON.createdBy = appRes.createdById;
              resJSON.description = appRes.name;
              resJSON.developerID = "injected via occ-instance-migrator";
              resJSON.extensionID = appRes.id;
              resJSON.name = displayName;
              resJSON.version = version;
              resJSON.timeCreated = formatDateForExtenstion(new Date());
              fs.writeJSON(normalizePath(extensionJSONName), resJSON)
                .then(function() {
                  console.log(`Updated ${displayName}.`);
                  const newZip = new zip();
                  // rezip and retun for processing
                  process.chdir(normalizePath(extractFilePath));
                  walker(normalizePath("."))
                    .on("file", function(file) {
                      newZip.file(file, fs.readFileSync(normalizePath(file), "utf-8"));
                    }).on("end", function() {
                    resolve(newZip);
                  });
                  // After all files traversed, generate and resolve the new zip
                });
            }).catch(function(err) {
              console.log(`${displayName}:${err.message}`);
            });
        });
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
          `/extensions/id`, {
            name: `${displayName} by occ-instance-migrator on ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}.`,
            type: `extension`
          }, constants.HTTP_CONTENT_TYPE_JSON, {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-CCProfileType": "applicationAccess"
          })
          .then(resolve);
      });
    },

    //  Rezips the in memory expanded zip and then uploads to the target OCCS instance
    uploadToOcc: function({ repositoryId }, updatedZip) {
      console.log(`Uploading ${displayName} to ${program.targetserver}.`);
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
            `/files`,
            payloadInit,
            "json"
          );

          // payload for doFileSegmentUpload
          const payloadUpload = {
            filename: payloadInit.filename,
            file: updatedZip.generate({ base64: true }),
            index: 0
          };

          // doFileSegmentUpload
          const uploadedFiles = await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/files/${token}?changeContext=designStudio`,
            payloadUpload
          );

          // create extension
          await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/extensions`,
            { name: filename }
          )
            .then((res) => {
              console.log(`Extension ${displayName} installed.\n\n\n\n`, res);
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
