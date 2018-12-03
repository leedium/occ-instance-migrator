 # occ-extensions-migrator

This tool will copy just the changes from a source instance to a target instance
using [Oracle Commerce Cloud](https://cloud.oracle.com/en_US/commerce-cloud "Oracle Commerce Cloud") [DCU](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedesigncodeutility01.htm "Use the Design Code Utility").
A check is made first to see if the target instance is missing extensions installed in the source. If extensions are missing then only the deltas are copied prior to the DCU transferAll executing.
There is almost to 70% savings in time including the DCU and PLSU transfer processes.
This is still a work in process but has saved me quite some time

Web Content data is currently not supported and coming in a later OCC release. (Dec 2018)

### status
~todo:  check if batch can be performed~    
~todo:  convert to global node module~     
~todo:  parameterize the configuration~      
~todo: check if a widget exists and install it before the transfer so that the instances can be populated.~  
~todo: remove git dependency, replace with [nodegit](https://www.nodegit.org/ "nodegit")~ .  
todo: test with up and coming DCU 1.0.8 and 18D(v16) release
todo: add SSE transfer
toto: add paymentGateway transfer

### Prerequisites
[Oracle Commerce Cloud](https://cloud.oracle.com/en_US/commerce-cloud "Oracle Commerce Cloud") [DCU v1.0.7](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedesigncodeutility01.html "Use the Design Code Utility")  
[node js](https://nodejs.org/en/ "Node JS")


### Instructions
Please follow the [installation instructions](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305downloadandinstallthedesigncodeu01.html "install Design and Code Utility") to set up the global DCU node application.


### Installation
Change directory to your downloaded folder and run:
```
$ npm i -g
```

### Options
```
$ oim -help

Usage: oim [options] [command]

Wrapper for DCU  to only deploy instances differences across tool.
Dependencies:
                git cli - https://git-scm.com/downloads
                Oracle DCU -  https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedcutograbanduploadsourceco01.html

Options:
  -V, --version                      output the version number
  -s --sourceserver <sourceserver>   Occ Admin url for source instance (from)
  -t --sourcekey <sourcekey>         Occ Admin api key for source instance (from)
  -u --targetserver <targetserver>   Occ Admin url for target instance (to)
  -v --targetkey <targetkey>         Occ Admin api key for target instance (from)
  -L, --includelayouts               Transfer All Layouts [true | false]
  -t, --taskdelay                    Execution delay in milliseconds between tasks.   Defaults to 3000ms
  -h, --help                         output usage information

Commands:
  oim, [sourceserver] [sourcekey] [targetserver] [targetkey]  Execute a dcu transferAll from source to target instance
  help [cmd]                         display help for [cmd]
```


### Transfer Extensions :
```
$  oim -s {SOURCE_SERVER}
       -t {SOURCE_KEY}
       -u {TARGET_SERVER}
       -v {TARGET_KEY}

```

### Transfer Page Layouts ([PLSU](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usetheplsuutility01.html "Page Layout Synchronization Utility")) to :
```
$  oim -s {SOURCE_SERVER}
       -t {SOURCE_KEY}
       -u {TARGET_SERVER}
       -v {TARGET_KEY}
       -L
```

