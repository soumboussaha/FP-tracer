const { firefox } = require('playwright')
const path = require('path')

const logging = require('./logging')
const profile = require('./profile')
const config = require('../config')

destroyUserProfile = async () => { await profile.destroyUserProfile(tempPath, worker) }


getBrowser = async (scanProfile, worker = undefined) => {

    let profileCreated = false
    let tempPath

    tempPath = await profile.setupUserProfile(scanProfile.browserProfilePath, worker)
    profileCreated = true

    logging.logVerbose('Setting up browser', worker);
    const userProfile = path.join(tempPath, scanProfile.browserProfileName)
    const options = { headless: scanProfile.headless }
    if (scanProfile.useFoxhound) {
        options.executablePath = config.getFoxhoundPath()
    }

    logging.logVerbose('- Creating browser context', worker);
    let browser = await firefox.launchPersistentContext(
        userProfile,
        options
    )
    logging.logVerbose('- Browser context created', worker);

    return {
        tempPath: tempPath,
        context: browser,
        closeContext: async () => {
            logging.logVerbose('Closing browser context', worker);
            await browser.close();
            logging.logVerbose('- Browser context closed', worker);
        },
        destroyUserProfile: async () => {
            await profile.destroyUserProfile(tempPath, worker)
        }

    }

}

goToUrlDynamic = async (page, baseUrl, worker = undefined) => {
    logging.logVerbose(`Trying to access website with domain ${baseUrl}`, worker)
    // logging.logVerbose(`- Dynamically accessing ${baseUrl} or derivatives`, worker)
    const strippedUrl = baseUrl.replace('https://', '').replace('http://', '')
    logging.logVerbose(`- Base Url stripped to ${strippedUrl}`, worker)

    let usedUrl;

    try {
        usedUrl = 'https://' + strippedUrl
        logging.logVerbose(`- Going to ${usedUrl}`, worker);
        await page.goto(usedUrl,config.navigationOptions);
    } catch (error) {
        try {
            logging.logVerbose(`- ${usedUrl} cannot be reached. Trying out alternative`, worker)
            logging.logVerbose(`- ${error}`, worker)
            usedUrl = 'http://' + strippedUrl
            logging.logVerbose(`- Trying to reach ${usedUrl}`, worker)
            await page.goto(usedUrl,config.navigationOptions)
        } catch (error) {
            try {
                logging.logVerbose(`- ${usedUrl} cannot be reached. Trying out alternative`, worker)
                usedUrl = 'https://www.' + strippedUrl
                logging.logVerbose(`- Trying to reach ${usedUrl}`, worker)
                await page.goto(usedUrl,config.navigationOptions);
            } catch (error) {
                try {
                    logging.logVerbose(`- ${usedUrl} cannot be reached. Trying out alternative`, worker)
                    usedUrl = 'http://www.' + strippedUrl
                    logging.logVerbose(`- Trying to reach ${usedUrl}`, worker)
                    await page.goto(usedUrl,config.navigationOptions);
                } catch (error) {
                    throw "Could not reach Url with any alternative. " + error
                }
            }
        }
    }
    logging.logVerbose(`- ${usedUrl} successfully loaded`, worker)
    return usedUrl
}


module.exports = {

    getBrowser: getBrowser,

    goToUrlDynamic: goToUrlDynamic

}