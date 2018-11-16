/*
 * Copyright (c) 2018 LEEDIUM.
 * This file is subject to the terms and conditions
 * defined in file 'LICENSE.txt', which is part of this
 * source code package.
 */

/**
 * @project occ-instance-migrator
 * @file constants.js
 * @company LEEDIUM
 * @createdBy davidlee
 * @contact david@leedium.com
 * @dateUpdated 16/11/2018
 * @description Application Constants
 */

exports.APP_ID = __dirname.split("/").pop();

exports.WORKING_FOLDER = "./working";
exports.TEMP_FOLDER = "./tmp";

exports.BRANCH_MASTER = "master";
exports.BRANCH_SOURCE = "source";
exports.BRANCH_TARGET = "target";

exports.ExtensionTypes = {
  WIDGET: "widget",
  ELEMENT: "element",
  STACK: "stack",
  GLOBAL: "global",
  THEME: "theme",
  SNIPPETS: "snippets"
};

exports.GitMergeKeys = {
  MODIFIED: "M",
  RENAMED: "R",
  ADDED: "A",
  DELETED: "D"
};

exports.DCUSubFolder = {
  INSTANCES: "instances",
  CCC: ".ccc"
};

