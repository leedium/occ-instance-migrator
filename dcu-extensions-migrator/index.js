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
 *              --dcu [gitPath]  transfers extensions / widgets
 *                  --gitPath - target directory to use for git processing
 *              --plsu [all | layoutName] transfers layouts
 *                  --all transfers all layouts
 *                  --layoutName {name} - name of layoutto transfer
 **/

const {spawn} = require('child_process');
const fs = require("fs-extra");
const readline = require('readline');
const argv = require('yargs').argv;
const git = require('simple-git');

const config = require('./config');

const {gitPath, dcu, plsu, all, layoutName} = argv;
const transferPaths = [];
const pathsToBeRemoved = [];

/**
 * Grabs the target(Source Copied From) dcu source
 * @returns {Promise<any>}
 */
function grabTarget() {
    process.chdir(gitPath);
    return new Promise((resolve) => {
        console.log('GRABBING TARGET (currently deployed)');
        const ls1 = spawn('dcu', ['--grab', '--clean', '--node', config.dcuServerTarget], {
            env: Object.assign({}, process.env, {
                'CC_APPLICATION_KEY': config.apiKeyTarget
            })
        });
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'))
        });
        ls1.on('close', () => {
            console.log('...created target branch...');
            resolve();
        });
    })
}

/**
 * Grabs the Source(Source Copied To) dcu source
 * @returns {Promise<any>}
 */
function grabSource() {
    return new Promise((resolve) => {
        console.log('GRABBING SOURCE (latest changes)');
        const ls1 = spawn('dcu', ['--grab', '--clean', '--node', config.dcuServerSource], {
            env: Object.assign({}, process.env, {
                'CC_APPLICATION_KEY': config.apiKeySource
            })
        });
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'));
        });
        ls1.on('close', () => {
            console.log('...create source branch...');
            resolve();
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
        git(gitPath).raw(['checkout', name], () => {
            setTimeout(() => {
                resolve()
            }, config.taskDelay)
        })
    })
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
        git(gitPath).raw(['merge', name, '-X', 'theirs'], () => {
            setTimeout(() => {
                resolve()
            }, config.taskDelay)
        })
    })
}

/**
 * Performes a git add. Add all files
 * @returns {Promise<any>}
 */
function addAll() {
    return new Promise((resolve) => {
        console.log('staging...');
        git(gitPath).raw(['add', '.'], () => {
            setTimeout(() => {
                resolve()
            }, config.taskDelay)
        })
    })

}

/**
 * Performs a git commit
 * @returns {Promise<any>}
 */
function commit() {
    return new Promise((resolve) => {
        console.log('committing...');
        git(gitPath).raw(['commit', '-m', 'committing latest changes'], () => {
            setTimeout(() => {
                resolve()
            }, config.taskDelay)
        })
    });
}

/**
 * Deletes a git branch
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
function deleteBranch(name, callback) {
    return new Promise((resolve) => {
        console.log(`deleteLocalBranch:,${name}`);
        git(gitPath).raw(['branch', '-D', name], () => {
            setTimeout(() => {
                resolve()
            }, config.taskDelay)
        })
    })
}

/**
 * Creates a git branch, if it preexits then it is reset -B
 * @param name
 * @param callback
 * @returns {Promise<any>}
 */
function createBranch(name, callback) {
    return new Promise((resolve) => {
        console.log(`createBranch:${name}`);
        git(gitPath).raw(['checkout', '-B', name], () => {
            setTimeout(() => {
                resolve()
            }, config.taskDelay)
        })
    })
}

/**
 * Creates list of files that have been modified.
 * Results are piped to whatchanged.txt
 * @returns {Promise<any>}
 */
function getDiffs() {
    return new Promise((resolve) => {
        console.log('formulating diffs');
        const ls1 = spawn('./diffs.sh');
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'));
        });
        ls1.on('close', () => {
            console.log('...created diff file...');
            resolve();
        });
    })
}

/**
 * whatchanged.txt is read and the results filtered by files that
 * have been updated and added.
 * @returns {Promise<any>}
 */
function processDiffs() {
    return new Promise((resolve) => {
        const transferPathArrayTemp = [];
        const deletePathArrayTemp = [];
        let counter = 0;
        const rl = readline.createInterface({
            input: fs.createReadStream(config.diffFilePath)
        });
        rl.on('line', (line) => {
            const infoArray = line.split('\t');
            const pathString = infoArray[1];
            const modType = infoArray[0].split(' ')[4];
            const pathArray = pathString.split('/');


            let path;
            let pathDelete;
            if (pathArray.length === 2) {
                // path = (`${pathArray[0]}/`);
                path = (`${pathArray[0]}/`);
            } else if (pathArray.length > 2) {
                if (pathArray[1] === "Web Content") {
                    pathDelete = path = (`${pathArray.slice(0, 4).join('/')}`);
                } else {
                    path = (`${pathArray.slice(0, 2).join('/')}`);
                    pathDelete = (`${pathArray.slice(0, 4).join('/')}`);

                }
            }

            if (modType !== "D" && modType.indexOf('R') < 0) {
                if (!transferPathArrayTemp[path]) {
                    counter += 1;
                    transferPathArrayTemp[`${path}`] = true;
                    console.log(path, modType);
                    transferPaths.push(path);
                    // console.log(counter, path)
                }
            } else {
                if (!deletePathArrayTemp[pathDelete]) {
                    pathsToBeRemoved.push(pathDelete);
                    deletePathArrayTemp[pathDelete] = true;
                }
            }
        });
        rl.on('close', () => {
            resolve();
        });
    })
}

function makeTmpFolder() {
    return new Promise((resolve) => {
        fs.ensureDirSync('./tmp/.ccc');
        fs.copySync(`../.ccc`, `./tmp/.ccc`);
        console.log(pathsToBeRemoved);
        deleteFilePath(pathsToBeRemoved.map(path => `./tmp/${path}`));
        deleteFilePath(pathsToBeRemoved.map(path => `./tmp/.ccc/${path}`));
        transferPaths.map((path) => {
            const fa = path.split('/');
            const f = fa.slice(0, fa.length).join('/');
            fs.ensureDirSync(`./tmp/${f}`);
            console.log(f, `../${path}`);
            try {
                fs.copySync(`../${path}`, `./tmp/${f}`);
            } catch (err) {
            }
        });
        resolve();
    });
}

/**
 * Removes paths specified in Array
 * @param pathsToBeRemoved - Array
 */
function deleteFilePath(pathsToBeRemoved) {
    console.log('Removing...', pathsToBeRemoved);
    pathsToBeRemoved.map((item) => {
        fs.removeSync(item);
    });
}

/**
 * Transfers all extension from source instance to target instance
 * @returns {Promise<any>}
 */
function transferAll() {
    process.chdir('./tmp');
    return new Promise((resolve) => {
        console.log(`Transferring all extensions start...`);
        const ls1 = spawn(`dcu`, ['--transferAll', '.', '--node', config.dcuServerTarget, '-k', config.apiKeyTarget], {
            env: Object.assign({}, process.env, {
                'CC_APPLICATION_KEY': config.apiKeyTarget
            })
        });
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'));
        });
        ls1.stderr.on('data', (chunk) => {
            console.log('Error:', chunk.toString());
        });
        ls1.on('close', () => {
            console.log(`... target updated`);
            resolve();
        });
    })
}

/**
 * Transfers a Single Page Layout from source to target instance
 */
function plsuTransferSingle() {

    if (typeof layoutName === 'undefined') {
        throw new Error('--layoutName is not defined');
    }
    console.log(`Transfering layout:${layoutName} start...`);

    const plsuSpawn = spawn('plsu', [
        '--transfer',
        '--node', config.dcuServerSource,
        '--applicationKey', config.apiKeySource,
        '--name', layoutName,
        '--destinationNode', config.dcuServerTarget,
        '--destinationApplicationKey', config.apiKeyTarget
    ]);
    plsuSpawn.stdout.on('data', (chunk) => {
        console.log(chunk.toString('utf-8'));
    });
    plsuSpawn.stderr.on('data', (chunk) => {
        console.log(chunk);
    });
    plsuSpawn.on('close', () => {
        console.log('Transfer complete.');
    });
}

/**
 * Transfers All Page Layouts from source to target instance
 */
function plsuTransferAll() {
    console.log('TransferAll page layouts start...');
    const plsuSpawn = spawn('plsu', [
        '--transfer',
        '--node', config.dcuServerSource,
        '--applicationKey', config.apiKeySource,
        '--all',
        '--destinationNode', config.dcuServerTarget,
        '--destinationApplicationKey', config.apiKeyTarget
    ]);
    plsuSpawn.stdout.on('data', (chunk) => {
        console.log(chunk.toString('utf-8'));
    });
    plsuSpawn.stderr.on('data', (chunk) => {
        console.log(chunk.toString('utf-8'));
    });
    plsuSpawn.on('close', () => {
        console.log('TransferAll page layouts complete.');
    });
}

/**
 * Executes extesion tasks
 * @returns {Promise<void>}
 */
async function extensionsTransfer() {
    if (typeof gitPath === 'undefined') {
        throw new Error('--gitPath is not defined');
    }
    // await checkoutBranch('master');
    // await deleteBranch('deploy');
    // await deleteBranch('test');
    // await grabTarget();
    await addAll();
    await commit();
    await createBranch('deploy');
    await createBranch('test');
    await grabSource();
    await addAll();
    await commit();
    await checkoutBranch('deploy');
    await mergeBranch('test');
    await getDiffs('test');
    await processDiffs();
    await makeTmpFolder();
    await transferAll();
    deleteFilePath([
        './tmp',
        '../.ccc',
        '../element',
        '../global',
        '../snippets',
        '../stack',
        '../theme',
        '../widget',
    ]);
}

/**
 * Entry method to start the process
 * @returns {Promise<void>}
 */
async function start() {
    try {
        if (plsu) {
            if (all) {
                plsuTransferAll();
            } else {
                plsuTransferSingle();
            }
        }
        else if (dcu) {
            extensionsTransfer();
        }
    }
    catch (err) {
        console.log(err);
    }
}

start();