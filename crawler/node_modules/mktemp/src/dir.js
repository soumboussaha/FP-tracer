/**
 * @file for directory processing
 */

const fs = require('fs');

const uniqueName = require('./unique_name');

/**
 * try create unique name directory
 *
 * @param {string} template template string for directory name
 * @param {number} retryCount
 * @param {Function} callback
 */
function tryCreateDir(template, retryCount, callback) {
  let dirname = uniqueName.generate(template);

  fs.mkdir(dirname, 448 /*=0700*/, function(err) {
    if (err) {
      if (err.code === 'EEXIST' && retryCount > 0) {
        setImmediate(tryCreateDir, template, retryCount - 1, callback);

        return;
      }

      // dirname set to null if throws error
      dirname = null;
    }

    callback(err, dirname);
  });
}

/**
 * create unique name directory
 *
 * @param {string} template template string for file directory
 * @param {Function} [callback]
 * @return {Promise}
 */
function createDir(template, callback) {
  if (typeof callback !== 'function') {
    return new Promise(function(resolve, reject) {
      createDir(template, (err, dirname) =>
        err ? reject(err) : resolve(dirname)
      );
    });
  }

  const retryCount = uniqueName.getOutcomeCount(template);

  tryCreateDir(template, retryCount, callback);
}

/**
 * sync version createDir
 *
 * @param {string} template template string for directory name
 * @throws {Error} if caught error
 * @return {string} dirname
 */
function createDirSync(template) {
  let dirname;
  let isExist;

  let retryCount = uniqueName.getOutcomeCount(template);

  do {
    isExist = false;
    retryCount -= 1;
    dirname = uniqueName.generate(template);

    try {
      fs.mkdirSync(dirname, 448 /*=0700*/);
    } catch (e) {
      if (e.code === 'EEXIST' && retryCount > 0) {
        isExist = true;
      } else {
        throw e;
      }
    }
  } while (isExist);

  return dirname;
}

module.exports = {
  createDir,
  createDirSync
};
