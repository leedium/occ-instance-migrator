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
const formatDateForExtenstion = require('./utils').formatDateForExtenstion;


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
      const self = this;
      return new Promise((resolve, reject) => {
        console.log(`Downloading missing widgets: ${self.displayName} ...`);
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
      const self = this;
      return new Promise(resolve => {
        const zipRoot = `./.zip`;
        const extractRoot = `./.ext`;
        const filename = `${self.displayName}.zip`;
        const zipFilePath = `${zipRoot}/${filename}`;
        const extractFilePath = `${extractRoot}/${self.displayName}`;
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
          const today =  new Date();
          const json = await fs.readJSON(extensionJSONName);
          json.createdBy = appRes.createdById;
          json.description = appRes.name;
          json.developerID = "injected via occ-instance-migrator";
          json.extensionID = appRes.id;
          json.name = self.displayName;
          json.timeCreated = formatDateForExtenstion(new Date());

          console.log(json)

          //this will be used for another flwo
          await fs.writeJSONSync(normalizePath(extensionJSONName), json);

          const newZip = new zip();

          // rezip and retun for processing
          process.chdir(normalizePath(extractFilePath));
          walker(normalizePath('.'))
            .on("file", function(file) {
              // console.log(file)
              newZip.file(file, fs.readFileSync(normalizePath(file), "utf-8"));
            }).on("end", function() {
            // process.chdir(normalizePath('../../'));
            // console.log(process.cwd());
            // console.log(newZip)
            resolve(newZip);
            // After all files traversed, generate and resolve the new zip
          });

        });
      });
    },

    //  create a new ApplicationID(extensionId) to be used
    createApplicationId: function() {
      const self = this;
      console.log(`Create Widget Application Id ...`);
      return new Promise((resolve) => {
        const dateTime = new Date();
        restObj.apiCall(
          program.targetserver,
          program.targetkey,
          constants.HTTP_METHOD_POST,
          `/extensions/id`, {
            name: `${self.displayName} by occ-instance-migrator on ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString()}.`,
            type: `extension`
          }, constants.HTTP_CONTENT_TYPE_JSON, {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-CCProfileType": "applicationAccess"
          })
          .then(resolve);
      });
    },


    //  Rezips the in memory expanded zip and then uploads to the target OCCS instance
    uploadToOcc: function({repositoryId }, updatedZip) {
      const self = this;
      console.log(`Uploading ${this.displayName} to ${program.targetserver}.`);
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


          // console.log('token', token);
          // payload for doFileSegmentUpload
          const payloadUpload = {
            filename: payloadInit.filename,
            file: updatedZip.generate({ base64: true }),
            index: 0
          };

          // console.log('payloadUpload', payloadUpload)

          // doFileSegmentUpload
          const uploadedFiles = await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/files/${token}?changeContext=designStudio`,
            payloadUpload
          );

          // console.log('uploadedFiles', uploadedFiles);
          // create extension
          await restObj.apiCall(
            program.targetserver,
            program.targetkey,
            constants.HTTP_METHOD_POST,
            `/extensions`,
            { name: filename }
          )
            .then((res) => {
              console.log(`Extension ${self.displayName} installed.\n\n\n\n`, res);
              resolve();
            })
        }catch(e){
          console.log(e);
          reject(e);
        }
      });
    }
  });

module.exports = extensionUploadObject;
