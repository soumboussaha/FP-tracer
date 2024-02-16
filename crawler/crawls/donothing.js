const util = require('util')
var urlLib = require('url');

const logging = require('../common-functions/logging')
const browser = require('../common-functions/browser')
const config = require('../config')

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
// Fisher-Yates Shuffle
// Inplace
let shuffle = (array) => {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

let isRelevantSink = (sink) => {
    return config.relevantSinks.includes(sink)
}

let isRelevantSource = (source) => {
    return config.relevantSources.includes(source)
}

let anyStringIsRelevantSource = (sources) => {
    return sources.some(isRelevantSource)
}

let anyOperationIsRelevantSource = (sources) => {
    return sources.map(operation => operation.operation).some(isRelevantSource)
}




let doScan = async (domain, scanProfile, monitorConsent, urlList = undefined, worker = undefined) => {

    let result = {
        start: logging.currentTime(),
        errors: [],
        warnings: [],
        findings: [],
        pages: [],
    }

    let currentPage

    let processTaintReport = (taintReport, stringTaint, destinationArray) => {
        try {
            logging.logDebug('- Processing taint flow', worker)

            let finding = {
                time: logging.currentTime(),
                sink: taintReport.sink,
                // page: currentPage,
                page: result.pages.length - 1,
                loc: taintReport.loc,
                parentLoc: taintReport.parentloc,
            }
            // finding.time = logging.currentTime()
            // finding.sink = taintReport.sink
            if (isRelevantSink(finding.sink)) {
                logging.logDebug(`  - Flow into relevant sink [${finding.sink}]. Continuing processing...`, worker)
            } else {
                logging.logDebug(`  - Flow into non-relevant sink [${finding.sink}]. Skipping processing...`, worker)
                return
            }

            let operations = stringTaint.map(range => range.flow).flat(1).filter((value, index, array) => {
                const _value = JSON.stringify(value)
                return index === array.findIndex(obj => JSON.stringify(obj) === _value)
            })

            finding.sourceOperations = operations.filter(operation => operation.source && isRelevantSource(operation.operation))
            if (anyOperationIsRelevantSource(finding.sourceOperations)) {
                logging.logDebug(`  - Flow has relevant source. Continuing processing...`, worker)
            } else {
                logging.logDebug(`  - Flow has no relevant source. Skipping processing...`, worker)
                return
            }

            finding.sources = finding.sourceOperations.map(operation => operation.operation)

            finding.sinkOperation = operations.filter(operation => !(operation.source) && isRelevantSink(operation.operation))
            if (finding.sinkOperation.length > 1) {
                throw ('Found multiple sing operations')
            }
            finding.sinkOperation = finding.sinkOperation[0]

            finding.str = taintReport.str

            finding.ranges = stringTaint.map(range => {
                return {
                    'begin': range.begin,
                    'end': range.end,
                    'sources': range.flow.filter(operation => operation.source && isRelevantSource(operation.operation)).map(operation => operation.operation),
                }
            }).filter(range => range.sources.length > 0)

            // finding.stringTaint = stringTaint

            logging.logDebug(`  - Saving finding`, worker)
            logging.logVerbose(`- Relevant Taint Flow registered`, worker)
            destinationArray.push(finding)
        } catch (error) {
            console.warn('Error while processing TaintReport')
            console.warn(error)
            result.warnings.push({ 'msg': 'Error while processing TaintReport', 'origError': logging.processError(error) })
            throw error
        }
    }

    let registerTaintFlowProcessing = (browserContext, destinationArray) => {
        browserContext.addInitScript(
            { content: "window.addEventListener('__taintreport', (r) => { __playwright_taint_report(r.detail,r.detail.str.taint); });" }
        );

        browserContext.exposeBinding("__playwright_taint_report", async function (source, value, taint) {
            processTaintReport(value, taint, destinationArray, worker)
        })
    }


    let registerConsentMonitoring = (page, consentEventArray) => {
        page.on('console', msg => {

            if (msg.text() === '') { return }

            message = {
                time: logging.currentTime(),
                text: msg.text(),
                type: 'unspecified',
                // page: currentPage,
                page: result.pages.length - 1,
            }

            const text = msg.text()
            logging.logDebug(`- Console message: ${text}, [${msg.location().url}]`, worker)

            if (msg.location().url.match(/moz-extension.*\/ConsentEngine.js/g)) {
                let matches = (/CMP Detected: (?<cmpName>.*)/).exec(text)
                if (matches) {
                    logging.logVerbose(`- CMP found (${matches.groups.cmpName})`, worker)
                    message.type = 'positive'
                    message.cmp = matches.groups.cmpName.trim()
                } else {
                    let matches = (/^(?<cmpName>.*) - (SAVE_CONSENT|HIDE_CMP|DO_CONSENT|OPEN_OPTIONS|Showing|isShowing\?)$/).exec(text)
                    if (matches) {
                        logging.logVerbose(`- CMP found (${matches.groups.cmpName})`, worker)
                        message.type = 'positive'
                        message.cmp = matches.groups.cmpName.trim()
                    } else if (text.match(/No CMP detected in 5 seconds, stopping engine.*/g)) {
                        message.type = 'negative'
                    }
                }

                // don't save unnecessary messages
                if (message.type !== 'unspecified') { consentEventArray.push(message) }
            }
        })
    }

    let withBrowserContext = async (scanProfile, code) => {
        let managedBrowser = await browser.getBrowser(config.scanProfiles[scanProfile], worker)
        let browserContext = managedBrowser.context
        try {
            await code(browserContext)
        } catch (error) {
            throw error
        } finally {
            await managedBrowser.closeContext()
            await managedBrowser.destroyUserProfile()
        }

    }

    await withBrowserContext(scanProfile, async browserContext => {

        registerTaintFlowProcessing(browserContext, result.findings, worker)

        const page = await browserContext.newPage()

        let pageQueue = []

        if (monitorConsent) {
            result.consentEvents = []
            registerConsentMonitoring(page, result.consentEvents, worker)
        }

        let gotoPage = async (url) => {
            logging.logVerbose(`- Going to [${url}]`, worker)
            result.pages.push({
                targetUrl: url,
                pageLoadStart: logging.currentTime(),
            })
            currentPage = result.pages[result.pages.length - 1]
            let response = await page.goto(url,config.navigationOptions)
            logging.logVerbose(`- [${url}] loaded`, worker)
            currentPage.pageLoadEnd = logging.currentTime()
            currentPage.actualUrl = await page.url()
        }

        let leavePage = async () => {
            logging.logVerbose('- Going to [about:blank]', worker)
            await page.goto('about:blank',config.navigationOptions)
            logging.logVerbose('- [about:blank] loaded', worker)
            currentPage.pageLeave = logging.currentTime()
            logging.logVerbose('- waiting for 1000ms', worker)
            await new Promise(resolve => setTimeout(resolve, 1000))
            currentPage = undefined
        }

        let visitPage = async (url, time) => {
            await gotoPage(url)
            logging.logVerbose(`- waiting for ${time}ms`, worker)
            await new Promise(resolve => setTimeout(resolve, time / 2))
            logging.logVerbose(`- Scrolling to bottom`, worker)
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
            await new Promise(resolve => setTimeout(resolve, time / 2))
            await leavePage()
        }


        if (urlList === undefined) {
            logging.logVerbose('- No page URLs defined. Will start on homepage and do discovery', worker)
            result.pages.push({
                pageLoadStart: logging.currentTime(),
            })
            currentPage = result.pages[result.pages.length - 1]
            try {
                currentPage.targetUrl = await browser.goToUrlDynamic(page, domain, worker)
            } catch (error) {
                result.errors.push({ 'msg': 'Not able to reach domain using any alternative', 'origError': logging.processError(error) })
                return result
            }

            currentPage.pageLoadEnd = logging.currentTime()
            currentPage.actualUrl = await page.url()

            logging.logVerbose(`- Waiting on page for ${config.timePerFirstPage} seconds`, worker)
            await new Promise(resolve => setTimeout(resolve, config.timePerFirstPage / 2))
            logging.logVerbose(`- Scrolling to bottom`, worker)
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
            await new Promise(resolve => setTimeout(resolve, config.timePerFirstPage / 2))

            logging.logVerbose('- Extracting links', worker)
            let links = [...new Set(
                (await page.$$eval('a', links => {
                    return links.map(link => link.href)
                }))
                    .filter(link => (urlLib.parse(link).hostname === urlLib.parse(currentPage.actualUrl).hostname) && (urlLib.parse(link).pathname) !== urlLib.parse(currentPage.actualUrl).pathname))]
            shuffle(links)
            // console.log(links)
            pageQueue.push(currentPage.actualUrl)
            pageQueue.push(...(links.slice(0, config.secondaryPageCount)))
            if (pageQueue.length < config.secondaryPageCount + 1) {
                result.warnings.push('Did not find enough secondary pages')
            }
            // console.log(pageQueue)

            await leavePage()

        } else {
            logging.logVerbose('- Scan received page URLs. Will use that directly', worker)
            pageQueue = urlList
        }

        for (const pageUrl of pageQueue) {
            let timeToWait = config.timePerPage
            if (result.pages.length === 0) {
                timeToWait = config.timePerFirstPage
            }
            await visitPage(pageUrl, timeToWait)
        }

    })

    if (result.errors.length > 0) {
        return result
    }


    if (monitorConsent) {
        result.cmp = [...new Set(result.consentEvents.filter(e => e.cmp).map(e => e.cmp))]
        if (result.cmp.length > 1) {
            result.warnings.push(`Found more than one CMP`)
        } else if (result.cmp.length === 1) {
            result.cmp = result.cmp[0]
        } else {
            result.errors.push('Found no CMP')
        }
    }

    result.end = logging.currentTime()
    return result
}

let doAcceptAllScan = async (domain, urlList = undefined, worker = undefined) => {
    return await doScan(domain, 'acceptAll', true, urlList, worker)
}

let doRejectAllScan = async (domain, urlList = undefined, worker = undefined) => {
    return await doScan(domain, 'rejectAll', true, urlList, worker)
}

let doDoNothingScan = async (domain, urlList = undefined, worker = undefined) => {
    return await doScan(domain, 'doNothing', false, urlList, worker)
}


doFingerprintingCrawl = async (domain, worker = undefined) => {

    let result = {
        domain: domain,
        // start: logging.currentTime(),
        errors: [],
        warnings: [],
    }
    // result.flows = []
    // result.consentEvents = []
/*
    logging.logAlways('Doing AcceptAll-Scan', worker)
    result.acceptAll = await doAcceptAllScan(domain, undefined, worker)

    if (result.acceptAll.errors.length > 0) {
        logging.logAlways('Error during AcceptAll-Scan', worker)
        result.errors.push(...result.acceptAll.errors)
        return result
    } else {
        result.warnings.push(...result.acceptAll.warnings)
    }
    let acceptAllUrls = result.acceptAll.pages.map(p => p.targetUrl)

    logging.logAlways('Doing RejectAll-Scan', worker)
    result.rejectAll = await doRejectAllScan(domain, acceptAllUrls, worker)
    if (result.rejectAll.errors.length > 0) {
        logging.logAlways('Error during RejectAll-Scan', worker)
        result.errors.push(...result.rejectAll.errors)
        return result
    } else {
        result.warnings.push(...result.rejectAll.warnings)
    }
*/
    logging.logAlways('Doing DoNothing-Scan', worker)
    result.doNothing = await doDoNothingScan(domain, undefined, worker)
    if (result.doNothing.errors.length > 0) {
        logging.logAlways('Error during DoNothing-Scan', worker)
        result.errors.push(...result.doNothing.errors)
        return result
    } else {
        result.warnings.push(...result.doNothing.warnings)
    }

    logging.logAlways('Running Analysis', worker)
    result.summary = {
        //acceptAllFindings: result.acceptAll.findings.length,
        //rejectAllFindings: result.rejectAll.findings.length,
        doNothingFindings: result.doNothing.findings.length,
    }
    // result.end = logging.currentTime()


    logging.logAlways('Finished', worker)
    return result


}


module.exports = {
    crawlDomain: doFingerprintingCrawl
}