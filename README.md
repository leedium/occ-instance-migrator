# occ-extensions-migrator

This tool will copy extension deltas from a source instance to a target instance
using [Oracle Commerce Cloud](https://cloud.oracle.com/en_US/commerce-cloud "Oracle Commerce Cloud") [DCU](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedesigncodeutility01.htm "Use the Design Code Utility").

### Prerequisites
[Oracle Commerce Cloud](https://cloud.oracle.com/en_US/commerce-cloud "Oracle Commerce Cloud") [DCU v1.0.7](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305usethedesigncodeutility01.html "Use the Design Code Utility")  
[git](https://git-scm.com/downloads "download git")  
[node js](https://nodejs.org/en/ "Node JS")


### Instructions
Please follow the [installation instructions](https://docs.oracle.com/cd/E97801_01/Cloud.18C/ExtendingCC/html/s4305downloadandinstallthedesigncodeu01.html "install Design and Code Utility") to set up the global DCU node application.


### Installation
```
$ cd dcu-extensions-migrator
$ npm i
```

### Run:
```
npm run migrate -- --gitPath ../
```
