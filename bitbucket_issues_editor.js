#!/usr/bin/env node

/**
 * @license
 * Copyright 2016 Xingchen Hong
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A small tool for editing BitBucket issues db files.
 * @author Xingchen Hong
 */

'use strict';

if (require.main !== module) {
  // Direct execution.
  throw new Error('Should not be used as a module.');
}

// Load modules
const fs = require("fs"),
      path = require("path");

// Define helpers.
const print = (data) => {
        process.stdout.write(data);
      },
      println = (data) => {
        process.stdout.write(data + '\n');
      },
      printUsage = () => {
        println ("\nUsage: editor <issue_file> <command> [<more_args>]\n");
      },
      printPWD = () => {
        println("Working directory: " + __dirname);
      };

// Argument check.
if (process.argv.length < 4) {
  printUsage();
  process.exit(9);
}

const supported_commands = {
  // List all issues.
  list (data, args) {
    const issues = data.issues.slice();
    if (args[0] === 'sorted') {
      issues.sort((a, b) => a.id - b.id);
    }
    for (let issue of issues) {
      println('#' + issue.id + ' ' + issue.title + '');
    }
  },
  // Remove the specified issues.
  remove (data, args) {
    // Verify that all args are numbers.
    const ids = args.map((x) => {
      if (isNaN(x)) {
        throw new TypeError('"' + x + '" is not a valid issue ID.');
      }
      return Number(x);
    });

    // These are not relavant to issues:
    // - `data.milestones`
    // - `data.versions`
    // - `data.meta`
    // - `data.components`

    //! What to do with `data.attachments`?

    data.issues = data.issues.filter((issue) => ids.indexOf(issue.id) === -1);
    data.comments = data.comments.filter((comment) => ids.indexOf(comment.issue) === -1);
    data.logs = data.logs.filter((log) => ids.indexOf(log.issue) === -1);

    println(JSON.stringify(data));
  },
  // Remove all issues other than the specified ones.
  keeponly (data, args) {
    // Verify that all args are numbers.
    const ids = args.map((x) => {
      if (isNaN(x)) {
        throw new TypeError('"' + x + '" is not a valid issue ID.');
      }
      return Number(x);
    });

    // These are not relavant to issues:
    // - `data.milestones`
    // - `data.versions`
    // - `data.meta`
    // - `data.components`

    //! What to do with `data.attachments`?

    data.issues = data.issues.filter((issue) => ids.indexOf(issue.id) > -1);
    data.comments = data.comments.filter((comment) => ids.indexOf(comment.issue) > -1);
    data.logs = data.logs.filter((log) => ids.indexOf(log.issue) > -1);

    println(JSON.stringify(data));
  },
  // Find gaps in issue IDs.
  findgap (data) {
    const ids = data.issues.map((issue) => issue.id)
                           .sort((a, b) => a - b);
    // After sorting, if the last ID matches its index, then there are no gaps.
    if (ids[ids.length - 1] === ids.length) {
      return;
    }
    
    let prevId = 0;
    while (ids.length > 0) {
      let thisId = ids.shift();
      for (let i = prevId + 1, n = thisId; i < n; ++i) {
        println('#' + i + ' missing.');
      }
      prevId = thisId;
    }
  },
  // Find duplicates in issue IDs.
  finddup (data) {
    const idCounts = {};
    data.issues.map((issue) => issue.id)
    .forEach((id) => {
      idCounts[id] = idCounts[id] || 0;
      idCounts[id] += 1;
    });
    for (let id of Object.keys(idCounts)) {
      if (idCounts[id] > 1) {
        println('#' + id + ' appeared ' + idCounts[id] + ' times.');
      }
    }
  },
  // Find if anything points to an issue that doesn't exist.
  findheadless (data) {
    const ids = data.issues.map((issue) => issue.id)
                           .sort((a, b) => a - b);
    
    // These are not relavant to issues:
    // - `data.milestones`
    // - `data.versions`
    // - `data.meta`
    // - `data.components`

    //! What to do with `data.attachments`?
    
    data.comments.forEach((comment) => {
      if (ids.indexOf(comment.issue) === -1) {
        println('Comment #' + comment.id + ' is headless.');
      }
    });
    
    // Logs don't have IDs but rather are associated with comments.
  },
  // Helper for running finddup, findgap and findheadless.
  check (data, args) {
    supported_commands.finddup(data, args);
    supported_commands.findgap(data, args);
    supported_commands.findheadless(data, args);
  },
  // Assign new issue numbers so there are no gaps.
  reassign (data) {
    const oldIds = data.issues.map((issue) => issue.id)
                              .sort((a, b) => a - b);

    // Map old IDs to new IDs.
    const idMapping = new Map();
    for (let i = 0, n = oldIds.length; i < n; ++i) {
      // Issue IDs start from 1.
      idMapping.set(oldIds[i], i + 1);
    }

    // Update IDs with the mapping.
    data.issues.forEach((issue) => {
      issue.id = idMapping.get(issue.id);
    });
    data.comments.forEach((comment) => {
      comment.issue = idMapping.get(comment.issue);
    });
    data.logs.forEach((log) => {
      log.issue = idMapping.get(log.issue);
    });

    println(JSON.stringify(data));
  }
};

const calling_dir = process.cwd(),
      file_path = path.join(calling_dir, process.argv[2]),
      file_dir = path.dirname(file_path),
      command = process.argv[3],
      args = process.argv.slice(4);

// Ensure file exists and is readable.
fs.accessSync(file_path, fs.F_OK | fs.R_OK);

// Ensure file directory is writable.
fs.accessSync(file_dir, fs.F_OK | fs.W_OK);

// Verify command.
if (Object.keys(supported_commands).indexOf(command) === -1) {
  throw new RangeError('Invalid command');
}

// Read and parse source file.
const src_data = fs.readFileSync(file_path, 'utf8'),
      src_parse = JSON.parse(src_data);

// Run the command. The command may modify `src_parse`.
supported_commands[command](src_parse, args);
