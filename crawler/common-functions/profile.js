
const path = require('path')
const StreamZip = require("node-stream-zip")
const mktemp = require('mktemp')
const fs = require('fs-extra')

const config = require('../config')
const logging = require('./logging')

setupUserProfile = async (profilePath, worker = undefined) => {
    logging.logVerbose('Setting up environment', worker)
    logging.logVerbose(`- Connecting to browser profile at ${profilePath}`, worker);
    const zip = new StreamZip.async({ file: profilePath });
    logging.logVerbose('- Creating temp directory', worker);
    let tempPath = await mktemp.createDir(path.join(config.tempRoot, 'playwright-fingerprint-consent-XXXXX'))
    logging.logVerbose(`- Created at ${tempPath}`, worker);
    await zip.extract(null, tempPath);
    return tempPath
}

destroyUserProfile = async (path, worker = undefined) => {
    logging.logVerbose('Deleting temp user profile', worker, worker)
    logging.logVerbose(`- Looking at ${path}`, worker)
    await fs.remove(path)
    logging.logVerbose(`- Deleted`, worker)
}

module.exports = {

    destroyUserProfile: destroyUserProfile,

    setupUserProfile: setupUserProfile

}