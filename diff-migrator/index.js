const {spawnSync, exec, spawn} = require('child_process');
const fs = require("fs");
const readline = require('readline');
const path = require("path");
const url = require("url");
const argv = require('yargs').argv;
const git = require('simple-git');

const TASK_DELAY = 3000;
const DIFF_FILE_PATH = './whatchanged.txt'

const DCU_SERVER_SOURCE = "https://ccadmin-test-zbba.oracleoutsourcing.com"
const API_KEY_SOURCE = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlOWM0YzZjNC1mNTVkLTQ3ZmQtYmZkYy1lZmEyOWYxZjllZGEiLCJpc3MiOiJhcHBsaWNhdGlvbkF1dGgiLCJleHAiOjE1NTM5MTg3NTMsImlhdCI6MTUyMjM4Mjc1M30=.g4Ws3V9PYZGnF/bIxtSLWeOBtHTbzVWjliEyS+Jb7oo="

const DCU_SERVER_TARGET = "https://ccadmin-stage-zbba.oracleoutsourcing.com"
const API_KEY_TARGET = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkMzIyNGJjOC1iZjljLTRhNWMtYjFhNi05MjIwYzI3NzQ1MWUiLCJpc3MiOiJhcHBsaWNhdGlvbkF1dGgiLCJleHAiOjE1NzEwMzExNTYsImlhdCI6MTUzOTQ5NTE1Nn0=.d8gGlYAtIZeVqE0vftJJ3qCKdDQjtHiMSiqA3CFfLdc="


const {gitPath} = argv;
const diffArray = [];
const transferPaths = [];


function grabTarget () {
    return new Promise((resolve) => {
        console.log('GRABBING TARGET (currently deployed)')
        const ls1 = spawn('./dcu_grab_target.sh');
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'))
        });
        ls1.on('close', (code) => {
            console.log('...created target branch...');
            resolve();
        });
    })
}

function grabSource () {
    return new Promise((resolve) => {
        console.log('GRABBING SOURCE (latest changes)')
        const ls1 = spawn('./dcu_grab_source.sh');
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'));
        });
        ls1.on('close', (code) => {
            console.log('...create source branch...');
            resolve();
        });
    });
}

function addAll () {
    return new Promise((resolve) => {
        console.log('staging...')
        git(gitPath).raw(['add', '.'], () => {
            setTimeout(() => {
                resolve()
            }, TASK_DELAY)
        })
    })

}

function commit () {
    return new Promise((resolve) => {
        console.log('committing...')
        git(gitPath).raw(['commit', '-m', 'committing latest changes'], () => {
            setTimeout(() => {
                resolve()
            }, TASK_DELAY)
        })
    });
}

function checkoutBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`checkoutBranch:${name}`)
        git(gitPath).raw(['checkout', name], () => {
            setTimeout(() => {
                resolve()
            }, TASK_DELAY)
        })
    })
}

function createBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`createBranch:${name}`)
        git(gitPath).raw(['checkout', '-B', name], () => {
            setTimeout(() => {
                resolve()
            }, TASK_DELAY)
        })
    })
}

function mergeBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`mergeBranch:,${name} into target`)
        git(gitPath).raw(['merge', name, '-X', 'theirs'], () => {
            setTimeout(() => {
                resolve()
            }, TASK_DELAY)
        })
    })
}

function deleteBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`deleteLocalBranch:,${name}`)
        git(gitPath).raw(['branch', '-D', name], () => {
            setTimeout(() => {
                resolve()
            }, TASK_DELAY)
        })
    })
}

function getDiffs () {
    return new Promise((resolve) => {
        console.log('formulating diffs')
        const ls1 = spawn('./diffs.sh');
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'))
        });
        ls1.on('close', (code) => {
            console.log('...created diff file...');
            resolve();
        });
    })
}

function processDiffs () {
    return new Promise((resolve) => {
        const transferPathArrayTemp = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(DIFF_FILE_PATH)
        });
        rl.on('line', (line) => {
            const pathArray = line.split('/');
            let path;
            if (pathArray.length === 2) {
                // path = (`${pathArray[0]}/`);
                path = (`${pathArray[0]}/`);
            } else if (pathArray.length > 2) {
                path = (`${pathArray.slice(0, 2).join('/')}`);
            }

            if (!transferPathArrayTemp[path]) {
                transferPathArrayTemp[`${path}`] = true;
                transferPaths.push(path);
            }
        });
        rl.on('close', () => {
            // console.log(transferPathArrayTemp)
            resolve();
        });
    })
}

async function transfer () {
    process.chdir(gitPath);
    return await Promise.all(
        transferPaths.reduce((acc, path) => {
            acc.push(transferFile(path))
            return acc;
        }, [])
    )
}

function transferFile (path) {
    return new Promise((resolve) => {
        console.log(`transferring ${path} ...`)
        const ls1 = spawn(`dcu`, ['--transferAll', path, '--node', DCU_SERVER_TARGET, '-k', API_KEY_TARGET], {
            env: Object.assign({}, process.env, {
                'CC_APPLICATION_KEY': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkMzIyNGJjOC1iZjljLTRhNWMtYjFhNi05MjIwYzI3NzQ1MWUiLCJpc3MiOiJhcHBsaWNhdGlvbkF1dGgiLCJleHAiOjE1NzEwMzExNTYsImlhdCI6MTUzOTQ5NTE1Nn0=.d8gGlYAtIZeVqE0vftJJ3qCKdDQjtHiMSiqA3CFfLdc='
            })
        });
        ls1.stdout.on('data', (chunk) => {
            console.log(chunk.toString('utf-8'));
        });
        ls1.stderr.on('data', (chunk) => {
            console.log('Error:', chunk.toString());
        });
        ls1.on('close', (code) => {
            console.log(`... ${path} target updated`);
            resolve();
        });
    })
}


async function start () {
    try {
        // await checkoutBranch('master');
        // await deleteBranch('deploy');
        // await deleteBranch('test');
        await grabTarget();
        // await addAll();
        // await commit();
        // await createBranch('deploy');
        // await createBranch('test');
        // await grabSource()
        // await addAll();
        // await commit();
        // await checkoutBranch('deploy');
        // await mergeBranch('test');
        // await getDiffs('test');
        // await processDiffs();
        // await transfer();
    }
    catch (err) {
        console.log(err)
    }
}

start();


// const ls1 = spawnSync('../migrate.sh');
//
// // console.log( `stderr: ${ls1.stderr.toString()}` );
// console.log( `stdout: ${ls1.stdout.toString()}` );


// const rl = readline.createInterface({
//     input: fs.createReadStream(diffFile)
// });
// rl.on('line', (line) => {
//     const pathArray = line.split('/');
//     let path;
//     if(pathArray.length === 2){
//         path = (`${pathArray[1]}/`);
//     }else if(pathArray.length > 2) {
//         path = (`${pathArray.slice(1,2).join('/')}`);
//     }
//
//     if(!diffArrayCheck.has(path)) {
//         diffArrayCheck.add(`${path}`);
//     }
// });
// rl.on('close', () => {
//     console.log('done');
//     processDiffs();
// });


