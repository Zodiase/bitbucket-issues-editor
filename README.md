Bitbucket Issues Editor
=======================

This is a little tool for editing [the exported JSON file](https://confluence.atlassian.com/x/eJG3Ew) when exporting and importing issues.

Let's say you want to move some of the issues to another repo, or just want to delete them, then this tool might save you some trouble editing the JSON file.

Usage
-----

Just download the `bitbucket_issues_editor.js` file. You can rename it or create shortcuts to it if the name is too long for you.

Then just run it in terminal:
```Bash
$ node bitbucket_issues_editor.js <db_file> <command> [<arguments>]
```

Supported Commands
------------------

### List all issues:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json list
```

Example output:
```Bash
#3 Issue A title
#1 Issue B title
#2 Issue C title
```

### List all issues (sorted):
```Bash
$ node bitbucket_issues_editor.js db-1.0.json list sorted
```

Example output:
```Bash
#1 Issue B title
#2 Issue C title
#3 Issue A title
```

### Remove some issues:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json remove 2
```

This command outputs the result JSON file in `stdout`.

List result after removing:
```Bash
#3 Issue A title
#1 Issue B title
```

You can remove multiple issues at once and save the result JSON file:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json remove 2 1 > db-1.0.removed.json
```

### Keep certain issues and remove everything else:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json keep 2 3
```

This command outputs the result JSON file in `stdout`.

List result after removing:
```Bash
#1 Issue B title
```

### Reassign new issue IDs so there are no gaps caused by removing:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json reassign
```

This command outputs the result JSON file in `stdout`.

Example:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json remove 2
$ node bitbucket_issues_editor.js db-1.0.json reassign
```

List result after reassigning:
```Bash
#2 Issue A title
#1 Issue B title
```

### Check if the JSON file looks reasonable:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json check
```

This command will check to see if there are any gaps or duplicates in issue IDs, and will also check to see if any comments are headless (i.e. belong to a non-existing issue).

You could also run individual checks separately:
```Bash
$ node bitbucket_issues_editor.js db-1.0.json findgap
$ node bitbucket_issues_editor.js db-1.0.json finddup
$ node bitbucket_issues_editor.js db-1.0.json findheadless
```

Notes
-----

* Command names are case-sensitive.
* This tool does not yet support to be used as a module.
* Don't output the result to the source file as that would empty the source file before the code can actually read from it.

To-do
-----

[ ] Handle `data.attachments` appropriately. (Currently I don't have a db file that has anything in `data.attachments` so I don't know the structure of its children.)
[ ] Support merging two db files. (In case people want to put issues from two repos into one.)

License
-------

© Xingchen Hong, 2016. Licensed under an [Apache-2](https://github.com/Zodiase/bitbucket-issues-editor/blob/master/LICENSE) license.
