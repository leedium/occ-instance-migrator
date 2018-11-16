/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file index.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateCreated 12/11/2018
 * @description This tool helps transfer only changed files across instances
 *              using git and Oracle's DCU tools
 *              Options
 *              --dcu [full]  transfers extensions / widgets
 *                  --full runs both the extensions and plsu transfer
 *              --plsu [all | layoutName] transfers layouts
 *                  --all transfers all layouts
 *                  --layoutName {name} - name of layoutto transfer
 **/

const { spawn } = require("child_process");
const fs = require("fs-extra");
const filehound = require("filehound");
const readline = require("readline");
const argv = require("yargs").argv;
const git = require("simple-git");

const config = require("./config");

const GIT_PATH = ".";

const WORKING_FOLDER = "./working";
const TEMP_FOLDER = "./transfer";


const BRANCH_MASTER = "master";
const BRANCH_SOURCE = "source";
const BRANCH_TARGET = "target";

const { dcu, plsu, all, layoutName, full, cleaner } = argv;
const instanceTracker = [];

let transferPaths = [];

/**
 * Grabs the target(Source Copied From) dcu source
 * @returns {Promise<any>}
 */
function grabTarget() {
  return new Promise((resolve) => {
    process.chdir(WORKING_FOLDER);
    console.log("GRABBING TARGET (currently deployed stable)", process.cwd());
    const ls1 = spawn("dcu", ["--grab", "--clean", "--node", config.dcuServerTarget], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": config.apiKeyTarget
      })
    });
    ls1.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    ls1.on("close", () => {
      console.log("...target branch download completed.");
      process.chdir("../");
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Grabs the Source(Source Copied To) dcu source
 * @returns {Promise<any>}
 */
function grabSource() {
  return new Promise((resolve) => {
    process.chdir(WORKING_FOLDER);
    console.log("GRABBING SOURCE (latest changes)", process.cwd());
    const ls1 = spawn("dcu", ["--grab", "--clean", "--node", config.dcuServerSource], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": config.apiKeySource
      })
    });
    ls1.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    ls1.on("close", () => {
      console.log("...source branch download completed");
      process.chdir("../");
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Performs a git checkout
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
function checkoutBranch(name, callback) {
  return new Promise((resolve) => {
    console.log(`checkoutBranch:${name}`);
    git(GIT_PATH).raw(["checkout", name], () => {
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Performes a get merge and forces THEIRS if any conflicts arise
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
function mergeBranch(name, callback) {
  return new Promise((resolve) => {
    console.log(`mergeBranch:,${name} into target`);
    git(GIT_PATH).raw(["merge", name, "-Xtheirs"], () => {
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Performes a git add. Add all files
 * @returns {Promise<any>}
 */
function addAll() {
  return new Promise((resolve) => {
    console.log("addAll...");
    git(GIT_PATH).raw(["add", "."], () => {
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });

}

/**
 * Performs a git commit
 * @returns {Promise<any>}
 */
function commit() {
  return new Promise((resolve) => {
    console.log("commit...");
    git(GIT_PATH).raw(["commit", "-m", "committing latest changes"], () => {
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Deletes a git branch
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
function deleteBranch(name) {
  return new Promise((resolve) => {
    console.log(`deleteLocalBranch:${name}`);
    git(GIT_PATH).raw(["branch", "-D", name], () => {
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Creates a git branch, if it preexits then it is reset -B
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
function createBranch(name) {
  return new Promise((resolve) => {
    console.log(`createBranch:${name}`);
    git(GIT_PATH).raw(["checkout", "-B", name], () => {
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * Creates list of files that have been modified.
 * Results are piped via writeStream to whatchanged.txt
 * @returns {Promise<any>}
 */
function getDiffs() {

  return new Promise((resolve) => {
    console.log("getDiffs");
    const ls1 = spawn("git", ["whatchanged", "-1", "--pretty=\"\""], {
      shell: true
    });
    ls1.stdout.pipe(fs.createWriteStream("./whatchanged.txt"));
    ls1.on("close", () => {
      console.log("...created diff file...");
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
  });
}

/**
 * whatchanged.txt is read and the results filtered by files that
 * have been updated and added.
 * @returns {Promise<any>}
 */
function processDiffs() {
  return new Promise((resolve) => {
    const transferPathArrayTemp = {};

    // reads line from whatchanged.txt
    const rl = readline.createInterface({
      input: fs.createReadStream(config.diffFilePath)
    });
    rl.on("line", (line) => {
      const infoArray = line.split("\t");
      const pathString = infoArray[1];
      const modType = infoArray[0].split(" ")[4];
      const pathArray = pathString.split("/");

      let path;
      path = pathArray.slice(0, pathArray.length - 1).join("/");

      // Checks if the difference is an addition or modification
      // Renames and deletions are ignored.
      if (modType !== "D" && modType.indexOf("R") < 0) {
        if (!transferPathArrayTemp[path]) {
          if (path.indexOf("dcu-extensions-migrator") < 0) {
            let sp = path.split("/");
            transferPaths.push({
              path: sp.slice(0, 5).join("/"),
              extType: sp[1]
            });
            transferPathArrayTemp[`${path}`] = true;
          }
        }
      }
    });

    //  When EOF and close, modify the paths best suited for OCC DCU structure
    rl.on("close", () => {
      const pathListSearched = {};
      const filteredSearched = {};

      transferPaths = transferPaths.reduce((a, pathObj) => {
        // Convert flat paths to object with extensionType and path
        const { extType, path } = pathObj;
        if (!pathListSearched[pathObj.path]) {
          pathListSearched[pathObj.path] = true;
          a.push({
            extType,
            path
          });
        }
        return a;
      }, []).reduce(
        // Convert paths to grab necessary files for OCC DCU folder structure
        // Keep track of widget instance folders
        (ac, pathObj) => {
          let { extType, path } = pathObj;
          const pSplit = path.split("/");

          //  If path is a widget and includes an instance store value
          if (pSplit[3] === "instances" && pSplit.length > 4 && extType === "widget") {
            instanceTracker.push({extType,path});
            path = pSplit.slice(0, 3).join("/");

          }
          // if path is a pure instance path, ignore
          else if (pSplit[3] === "instances" && pSplit.length === 4) {
            return ac;
          } else {
            path = pSplit.slice(0, 3).join("/");
          }

          if (!filteredSearched[path]) {
            filteredSearched[path] = true;
            ac.push({ extType, path });
          }
          return ac;
        }, []);
      console.log("\n\n\nTransfer Paths");
      console.log( instanceTracker.map(({ extType, path }) => {
        if (extType === "widget") {
          return path.split("/").slice(0, 5).join("/");
        }
      }));
      resolve();
    });
  });
}

/**
 * Constructs the temporary folder which will be used by the DCU's transferAll
 * @returns {Promise<*>}
 */
async function makeTmpFolder() {
  return new Promise(async (resolve) => {
    const workingTransfer = WORKING_FOLDER.split("/")[1];

    // create temp folder
    fs.ensureDirSync(`${TEMP_FOLDER}/${workingTransfer}/.ccc`);

    // copy root .ccc/config.json
    fs.copySync(`${WORKING_FOLDER}/.ccc/config.json`, `${TEMP_FOLDER}/${workingTransfer}/.ccc/config.json`);

    // copy dcu source and tracking file to temp
    transferPaths.map(({ extType, path }) => {
      const pathSplitArray = path.split("/");
      const dcuSourceFolder = pathSplitArray.slice(0, pathSplitArray.length).join("/");
      pathSplitArray[1] = `.ccc/${pathSplitArray[1]}`;
      let dcuTrackingFolder = pathSplitArray.slice(0, pathSplitArray.length).join("/");

      try {
        fs.ensureDirSync(`${TEMP_FOLDER}/${dcuSourceFolder}`);
        fs.ensureDirSync(`${TEMP_FOLDER}/${dcuTrackingFolder}`);
        fs.copySync(`${path}`, `${TEMP_FOLDER}/${dcuSourceFolder}`);
        fs.copySync(dcuTrackingFolder, `${TEMP_FOLDER}/${dcuTrackingFolder}`);

        //  Blow away the instance folder.  We need to do this as we only want to
        //  include the instances we stored in instanceTracker
        if (extType === "widget") {
          const cccPath = pathSplitArray.slice(0);
          cccPath.splice(1,0,'.ccc');
          const fp = `${TEMP_FOLDER}/${pathSplitArray.slice(0, 3).join("/")}/instances`;
          const cp = `${TEMP_FOLDER}/${cccPath.join("/")}/instances`;
          fs.removeSync(fp);
          fs.removeSync(cp);
        }
        // }
        //
        // if (isStack) {
        //   let file = `${dcuTrackingFolder.split("/").slice(0, 4).join("/")}/stack.json`;
        //   console.log(isStack, path, file);
        //   fs.copySync(`${file}`, `${TEMP_FOLDER}/${file}`);
        // }


      } catch (err) {
        console.log(err);
      }
    });

    //  Add back the selected instances
    instanceTracker.map(({ extType, path }) => {
      if (extType === "widget") {
        let cSpl= path.split('/')
        cSpl.splice(1,0,'.ccc')
        let cI = cSpl.join('/');
        console.log(cI)

        fs.ensureDirSync(`${TEMP_FOLDER}/${path}`);
        fs.ensureDirSync(`${TEMP_FOLDER}/${cI}`);
        fs.copySync(path, `${TEMP_FOLDER}/${path}`);
        fs.copySync(cI, `${TEMP_FOLDER}/${cI}`);
      }
    });

    resolve();
  });
}

/**
 * Executes DCU transferAll
 * @returns {Promise<any>}
 */
function transferAll() {
  const workingTransfer = WORKING_FOLDER.split("/")[1];
  process.chdir(`${TEMP_FOLDER}/${workingTransfer}`);
  return new Promise((resolve) => {
    console.log(`Transferring all extensions start...`);
    const ls1 = spawn(`dcu`, ["--transferAll", ".", "--node", config.dcuServerTarget, "-k", config.apiKeyTarget], {
      env: Object.assign({}, process.env, {
        "CC_APPLICATION_KEY": config.apiKeyTarget
      })
    });
    ls1.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    ls1.stderr.on("data", (chunk) => {
      console.log("Error:", chunk.toString());
    });
    ls1.on("close", () => {
      console.log(`... target updated`);
      resolve();
    });
  });
}

/**
 * Removes paths specified in Array
 * @param pathsToBeRemoved - Array
 */
async function deleteFilePath(pathsToBeRemoved) {
  return new Promise(async (resolve) => {
    console.log("Removing...", pathsToBeRemoved);
    pathsToBeRemoved.map((item) => {
      fs.removeSync(item);
    });
    setTimeout(() => {
      resolve();
    }, config.taskDelay);
  });
}

/**
 * Transfers a Single Page Layout from source to target instance
 */
function plsuTransferSingle() {

  if (typeof layoutName === "undefined") {
    throw new Error("--layoutName is not defined");
  }
  console.log(`Transfering layout:${layoutName} start...`);

  const plsuSpawn = spawn("plsu", [
    "--transfer",
    "--node", config.dcuServerSource,
    "--applicationKey", config.apiKeySource,
    "--name", layoutName,
    "--destinationNode", config.dcuServerTarget,
    "--destinationApplicationKey", config.apiKeyTarget
  ]);
  plsuSpawn.stdout.on("data", (chunk) => {
    console.log(chunk.toString("utf-8"));
  });
  plsuSpawn.stderr.on("data", (chunk) => {
    console.log(chunk);
  });
  plsuSpawn.on("close", () => {
    console.log("Transfer complete.");
  });
}

/**
 * Transfers All Page Layouts from source to target instance
 */
async function plsuTransferAll() {
  return new Promise(resolve => {
    console.log("TransferAll page layouts start...");
    const plsuSpawn = spawn("plsu", [
      "--transfer",
      "--node", config.dcuServerSource,
      "--applicationKey", config.apiKeySource,
      "--all",
      "--destinationNode", config.dcuServerTarget,
      "--destinationApplicationKey", config.apiKeyTarget
    ]);
    plsuSpawn.stdout.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    plsuSpawn.stderr.on("data", (chunk) => {
      console.log(chunk.toString("utf-8"));
    });
    plsuSpawn.on("close", () => {
      console.log("TransferAll page layouts complete.");
      setTimeout(() => {
        resolve();
      }, config.taskDelay);
    });
    resolve();

  });
}

async function clean() {
  await deleteFilePath([
    TEMP_FOLDER,
    WORKING_FOLDER,
    ".ccc",
    "element",
    "global",
    "snippets",
    "stack",
    "theme",
    "widget"

  ]);
  await checkoutBranch(BRANCH_MASTER);
  await addAll();
  await commit();
  await deleteBranch(BRANCH_SOURCE);
  await deleteBranch(BRANCH_TARGET);
  fs.ensureDirSync(TEMP_FOLDER);
  fs.ensureDirSync(WORKING_FOLDER);
}

/**
 * Executes extesion tasks
 * @returns {Promise<void>}
 */
async function extensionsTransfer() {
  return new Promise(async (resolve) => {
    await clean();
    await grabTarget();
    await addAll();
    await commit();
    await createBranch(BRANCH_TARGET);
    await createBranch(BRANCH_SOURCE);
    await grabSource();
    await addAll();
    await commit();
    await checkoutBranch(BRANCH_TARGET);
    await mergeBranch(BRANCH_SOURCE);
    await getDiffs();
    await processDiffs();
    await makeTmpFolder();
    await deleteFilePath([WORKING_FOLDER]);
    await transferAll();
    await deleteFilePath([TEMP_FOLDER]);
    await checkoutBranch(BRANCH_MASTER);
    resolve();
  });
}

/**
 * Entry method to start the process
 * @returns {Promise<void>}
 */
async function start() {
  if (typeof cleaner !== "undefined") {
    await clean();
    return;
  }
  try {
    if (dcu || full) {
      await extensionsTransfer();
    }
    if (plsu || full) {
      if (all || full) {
        await plsuTransferAll();
      } else {
        await plsuTransferSingle();
      }
    }
  }
  catch (err) {
    console.log(err);
  }
}

start();