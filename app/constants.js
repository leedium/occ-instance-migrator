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
exports.DEFAULT_GIT_PATH = ".";

exports.DIFF_TEXT_FILE = "./whatchanged.txt";
exports.GIT_IGNORE_FILE = ".gitignore";
exports.LOGFILE = "./dcu.log";
exports.TASK_DELAY = 3000;

exports.TEMP_FOLDER = ".tmp";
exports.DCU_TRACKING_FOLDER = ".ccc";
exports.GIT_TRACKING_FOLDER = ".git";

exports.BRANCH_MASTER = "master";
exports.BRANCH_SOURCE = "source";
exports.BRANCH_TARGET = "target";

exports.LOGFILE_SEPARATOR = "[35m[1m";

exports.ExtensionTypes = {
  WIDGET: "widget",
  ELEMENT: "element",
  STACK: "stack",
  GLOBAL: "global",
  THEME: "theme",
  SNIPPETS: "snippets"
};

exports.GitMergeKeys = {
  MODIFIED: "modified",
  RENAMED: "renamed",
  ADDED: "added",
  DELETED: "deleted",
  UNTRACKED: "untracked"
};

exports.DCUSubFolder = {
  INSTANCES: "instances",
  CONFIG: "config",
  JS: "js",
  CCC: ".ccc"
};

exports.HTTP_METHOD_GET = "GET";
exports.HTTP_METHOD_POST = "POST";
exports.HTTP_METHOD_PUT = "PUT";
exports.HTTP_CONTENT_TYPE_JSON = "json";

exports.WIDGET_EXTENSION_JSON = "ext.json";



