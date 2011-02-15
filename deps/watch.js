
/*!
 * Watch
 * Copyright(c) 2010 Mikeal Rogers <mikeal.rogers@gmail.com>
 * Git repo URL: https://github.com/mikeal/watch
 */

var sys = require('sys')
  , fs = require('fs')
  , path = require('path')
  , events = require('events')
  ;

function walk (dir, options, callback) {
  if (!callback) {callback = options; options = {}}
  if (!callback.files) callback.files = {};
  if (!callback.pending) callback.pending = 0;
  callback.pending += 1;
  fs.readdir(dir, function (err, files) {
    if (err) return callback(err);
    callback.pending -= 1;
    files.forEach(function (f) {
      f = path.join(dir, f);
      callback.pending += 1;
      fs.stat(f, function (err, stat) {
        if (err) return callback(err)
        callback.pending -= 1;
        if (options.ignoreDotFiles && path.basename(f)[0] === '.') return;
        if (options.filter && options.filter(f)) return;
        callback.files[f] = stat;
        if (stat.isDirectory()) walk(f, options, callback);
        if (callback.pending === 0) callback(null, callback.files);
      })
    })
    if (callback.pending === 0) callback(null, callback.files);
  })
  if (callback.pending === 0) callback(null, callback.files);
}

exports.watchTree = function (root, options, callback) {
  if (!callback) {callback = options; options = {}}
  walk(root, function (err, files) {
    var fileWatcher = function (f) {
      fs.watchFile(f, options, function (c, p) {
        files[f] = c;
        if (!files[f].isDirectory()) callback(f, c, p);
        else {
          fs.readdir(f, function (err, nfiles) {
            if (err) return;
            nfiles.forEach(function (b) {
              var file = path.join(f, b);
              if (!files[file]) {
                fs.stat(file, function (err, stat) {
                  callback(file, stat, null);
                  files[file] = stat;
                  fileWatcher(file);
                })
              }
            })
          })
        }
        if (c.nlink === 0) {
          // unwatch removed files.
          delete files[f]
          fs.unwatchFile(f);
        }
      })
    }
    fileWatcher(root);
    for (i in files) {
      fileWatcher(i);
    }
    callback(files, null, null);
  })
}

exports.createMonitor = function (root, options, cb) {
  if (!cb) {cb = options; options = {}}
  var monitor = new events.EventEmitter();
  exports.watchTree(root, options, function (f, curr, prev) {
    if (typeof f == "object" && prev == null && curr === null) {
      monitor.files = f;
      return cb(monitor);
    }
    if (prev === null) {
      return monitor.emit("created", f, curr);
    }
    if (curr.nlink === 0) {
      return monitor.emit("removed", f, curr);
    }
    monitor.emit("changed", f, curr, prev);
  })
}

exports.walk = walk;
