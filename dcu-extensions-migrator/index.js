const {spawnSync, exec, spawn} = require('child_process');
const fs = require("fs-extra");
const readline = require('readline');
const path = require("path");
const url = require("url");
const argv = require('yargs').argv;
const git = require('simple-git');

const config = require('./config');

const DIFF_FILE_PATH = './whatchanged.txt';

// const DCU_SERVER_SOURCE = "https://ccadmin-test-zbba.oracleoutsourcing.com";
// const API_KEY_SOURCE = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlOWM0YzZjNC1mNTVkLTQ3ZmQtYmZkYy1lZmEyOWYxZjllZGEiLCJpc3MiOiJhcHBsaWNhdGlvbkF1dGgiLCJleHAiOjE1NTM5MTg3NTMsImlhdCI6MTUyMjM4Mjc1M30=.g4Ws3V9PYZGnF/bIxtSLWeOBtHTbzVWjliEyS+Jb7oo=";

const {gitPath} = argv;
const diffArray = [];
const transferPaths = [];

// todo: move .sh files to js task

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
            }, config.task_delay)
        })
    })

}

function commit () {
    return new Promise((resolve) => {
        console.log('committing...')
        git(gitPath).raw(['commit', '-m', 'committing latest changes'], () => {
            setTimeout(() => {
                resolve()
            }, config.task_delay)
        })
    });
}

function checkoutBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`checkoutBranch:${name}`)
        git(gitPath).raw(['checkout', name], () => {
            setTimeout(() => {
                resolve()
            }, config.task_delay)
        })
    })
}

function createBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`createBranch:${name}`)
        git(gitPath).raw(['checkout', '-B', name], () => {
            setTimeout(() => {
                resolve()
            }, config.task_delay)
        })
    })
}

function mergeBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`mergeBranch:,${name} into target`)
        git(gitPath).raw(['merge', name, '-X', 'theirs'], () => {
            setTimeout(() => {
                resolve()
            }, config.task_delay)
        })
    })
}

function deleteBranch (name, callback) {
    return new Promise((resolve) => {
        console.log(`deleteLocalBranch:,${name}`)
        git(gitPath).raw(['branch', '-D', name], () => {
            setTimeout(() => {
                resolve()
            }, config.task_delay)
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
        let counter = 0;
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
                if (pathArray[1] === "Web Content") {
                    path = (`${pathArray.slice(0, 4).join('/')}`);
                } else {
                    path = (`${pathArray.slice(0, 2).join('/')}`);
                }

            }
            if (!transferPathArrayTemp[path]) {
                counter += 1;
                transferPathArrayTemp[`${path}`] = true;
                transferPaths.push(path);
                // console.log(counter, path)
            }
        });
        rl.on('close', () => {
            //console.log(transferPathArrayTemp)
            resolve();
        });
    })
}

async function transfer () {
    process.chdir(gitPath);
    const counter = 0;
    const load = function (count) {
        transferFile(transferPaths[count])
            .then(res => {
                count += 1;
                if (count <= transferPaths.length - 1) {
                    load(count);
                } else {
                    console.log('migration complete');
                    resolve()
                }
            })
    }
    load(counter)
}

function transferFile (path) {
    return new Promise((resolve) => {
        console.log(`transferring ${path} ...`)
        const ls1 = spawn(`dcu`, ['--transferAll', path, '--node', config.dcu_server_target, '-k', config.api_key_target], {
            env: Object.assign({}, process.env, {
                'CC_APPLICATION_KEY': config.api_key_target
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

function transferAll () {
    process.chdir('./tmp');
    return new Promise((resolve) => {
        console.log(`transferring ...`)
        const ls1 = spawn(`dcu`, ['--transferAll', '.', '--node', config.dcu_server_target, '-k', config.api_key_target], {
            env: Object.assign({}, process.env, {
                'CC_APPLICATION_KEY': config.api_key_target
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


function makeTmpFolder () {
    return new Promise((resolve) => {
        fs.ensureDirSync('./tmp/.ccc');
        fs.copySync(`../.ccc`,`./tmp/.ccc`);
        transferPaths.map((path) => {
            const fa = path.split('/');
            const f = fa.slice(0, fa.length ).join('/');
            fs.ensureDirSync(`./tmp/${f}`);

            console.log(f,`../${path}`)
            try{
                fs.copySync(`../${path}`,`./tmp/${f}`);
            }catch(err){
                // console.log(err)
            }
        });
        resolve();
    });
}


async function start () {
    try {
        await checkoutBranch('master');
        await deleteBranch('deploy');
        await deleteBranch('test');
        await grabTarget();
        await addAll();
        await commit();
        await createBranch('deploy');
        await createBranch('test');
        await grabSource()
        await addAll();
        await commit();
        await checkoutBranch('deploy');
        await mergeBranch('test');
        await getDiffs('test');
        await processDiffs();
        await makeTmpFolder();
        await transferAll();
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


