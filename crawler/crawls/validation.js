// This contains a lot of code, which was just copied from
// fingerprinting-crawl.js.
// Could be simplified in the future.

const logging = require('../common-functions/logging')
const browser = require('../common-functions/browser')
const config = require('../config')



doManualScan = async (domain, worker = undefined) => {

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


    let doSingleScan = async (message) => {


        let result = {
            start: logging.currentTime(),
            errors: [],
            warnings: [],
            findings: [],
            pages: [],
            cmp: 'DUMMY_CMP',
        }


        let processTaintReport = (taintReport, stringTaint, destinationArray) => {
            try {
                logging.logDebug('- Processing taint flow', worker)

                let finding = {
                    time: logging.currentTime(),
                    sink: taintReport.sink,
                    page: result.pages.length - 1,
                    // page: - 1,
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

        let managedBrowser = await browser.getBrowser(config.scanProfiles.manualMode, worker)
        let browserContext = managedBrowser.context
        registerTaintFlowProcessing(browserContext, result.findings, worker)
        browserContext.addInitScript({ content: `alert('${message}')` })
        logging.logVerbose('Preparing for manual analysis', worker)
        const page = await managedBrowser.context.newPage()

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

        logging.logAlways('40s timeout starting now', worker)
        await new Promise(resolve => setTimeout(resolve, 40000))
        logging.logAlways('Timeout finished', worker)

        await managedBrowser.closeContext()
        await managedBrowser.destroyUserProfile()

        result.end = logging.currentTime()

        return result

    }

    let result = {
        domain: domain,
        errors: [],
        warnings: [],
    }

    logging.logAlways('Doing AcceptAll-Scan', worker)
    result.acceptAll = await doSingleScan('Do accept this time', result.acceptAll)
    logging.logAlways('Doing RejectAll-Scan', worker)
    result.rejectAll = await doSingleScan('Do reject this time', result.rejectAll)
    logging.logAlways('Doing DoNothing-Scan', worker)
    result.doNothing = await doSingleScan('Do not interact with consent notice this time', result.doNothing)

    return result

}

module.exports = {
    crawlDomain: doManualScan
}