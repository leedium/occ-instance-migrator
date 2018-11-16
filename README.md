# occ-extensions-migrator

This tool will copy just the changes from a source instance to a target instance
using [Oracle Commerce Cloud](https://cloud.oracle.com/en_US/commerce-cloud "Oracle Commerce Cloud") [DCU](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedesigncodeutility01.htm "Use the Design Code Utility").

If Page Layout requires an instance, run the "--dcu" option before the "--plsu" options

Web Content data is currently not supported and coming in a later OCC release

### status
todo:  check if batch can be performed
todo:  convert to global node module  
todo:  parameterize the configuration    


### Prerequisites
[Oracle Commerce Cloud](https://cloud.oracle.com/en_US/commerce-cloud "Oracle Commerce Cloud") [DCU v1.0.7](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedesigncodeutility01.html "Use the Design Code Utility")  
[git](https://git-scm.com/downloads "download git")  
[node js](https://nodejs.org/en/ "Node JS")


### Instructions
Please follow the [installation instructions](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305downloadandinstallthedesigncodeu01.html "install Design and Code Utility") to set up the global DCU node application.
* Currently the extensions process only works on unix based systems.
// todo: port this to windows


### Installation
```
$ cd dcu-extensions-migrator
$ npm i
```

### Transfer Extensions :
```
$ npm run migrate -- --dcu
```

### Transfer Page Layouts ([PLSU](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usetheplsuutility01.html "Page Layout Synchronization Utility")) to :
```
$ npm run migrate -- --plsu [--all] // transfers all layouts
$ npm run migrate -- --plsu [--layoutName {NAME}] // transfers specific layout
```

### Transfer Extensions and ([PLSU](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usetheplsuutility01.html "Page Layout Synchronization Utility")) to :
```
npm run migrate -- --full
```

