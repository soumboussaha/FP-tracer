const logging = require('../common-functions/logging')
const browser = require('../common-functions/browser')
const config = require('../config')


getResultObject = (
    pageUrl,
    usedUrl,
    fullUrl,
    hasBanner,
    cmp,
    errorText
) => {
    return {
        'domain': pageUrl,
        'usedUrl': usedUrl,
        'fullUrl': fullUrl,
        'hasBanner': hasBanner,
        'cmp': cmp,
        'error': errorText
    }
}


doConsentScan = async (pageUrl, worker = undefined) => {

    let managedBrowser = await browser.getBrowser(config.scanProfiles['checkForCompatibleBanner'], worker)


    let result = await new Promise(async (resolve, reject) => {


        logging.logVerbose('Doing crawl actions', worker)
        const page = await managedBrowser.context.newPage()

        let usedUrl
        let fullUrl
        try {
            usedUrl = await goToUrlDynamic(page, pageUrl, worker)
            fullUrl = await page.url()
        } catch (error) {
            resolve(getResultObject(pageUrl, undefined, undefined, undefined, undefined, error))
            return
        }


        const hasCompatibleBanner = () => {
            return new Promise((resolve, reject) => {

                let scanFinished = false

                const consoleScanTimeout = setTimeout(() => {
                    scanFinished = true
                    logging.logVerbose(`- Error: Timeout`, worker)
                    reject("timeout")
                    return
                }, 60000)



                let waitForFurtherActionsTimeout = undefined
                const resolveNotFound = (cmpName) => {
                    scanFinished = true
                    clearTimeout(consoleScanTimeout)
                    logging.logVerbose(`- Negative: No CMP found`, worker)
                    resolve({ 'hasBanner': false, })
                    return
                }
                const delayedResolveNotFound = () => {
                    if (waitForFurtherActionsTimeout === undefined) {
                        waitForFurtherActionsTimeout = setTimeout(() => { resolveNotFound() }, 10000)
                    }
                }
                const resetDelayedResolveNotFound = () => {
                    if (waitForFurtherActionsTimeout !== undefined) {
                        logging.logVerbose('- New activity by consentManager encountered. Resetting resolve timer', worker)
                        clearTimeout(waitForFurtherActionsTimeout)
                        waitForFurtherActionsTimeout = undefined
                        delayedResolveNotFound()
                    }
                }

                page.on('console', msg => {

                    if (scanFinished) return

                    const text = msg.text()
                    logging.logDebug(`- Console message: ${text}`, worker)

                    if (msg.location().url.match(/moz-extension.*\/ConsentEngine.js/g)) {
                        resetDelayedResolveNotFound()
                    }

                    let matches = (/CMP Detected: (?<cmpName>.*)/g).exec(text)
                    if (matches) {
                        scanFinished = true
                        clearTimeout(consoleScanTimeout)
                        logging.logVerbose(`- Positive: CMP found (${matches.groups.cmpName})`, worker)
                        resolve({ 'hasBanner': true, 'cmp': matches.groups.cmpName.trim() })
                        return
                    } else if (text.match(/No CMP detected in 5 seconds, stopping engine.*/g)) {
                        clearTimeout(consoleScanTimeout)
                        if (waitForFurtherActionsTimeout !== undefined) {
                            resetDelayedResolveNotFound()
                        } else {
                            logging.logVerbose(`- Console message indicating no banner found ecountered. Resolving after 10s of inactivity`, worker)
                            delayedResolveNotFound()
                        }
                    }
                })
            });
        }

        logging.logVerbose('- Waiting for console message indicating consent banner', worker);
        hasCompatibleBanner()
            .then((bannerInfo) => {
                resolve(getResultObject(pageUrl, usedUrl, fullUrl, bannerInfo.hasBanner, bannerInfo.cmp))
            })
            .catch((e) => {
                resolve(getResultObject(pageUrl, usedUrl, fullUrl, undefined, undefined, errorText = 'timeout when scanning for relevant console messages'))
            })
    })


    await managedBrowser.closeContext()
    await managedBrowser.destroyUserProfile()

    return result



}



module.exports = {
    crawlDomain : doConsentScan
}