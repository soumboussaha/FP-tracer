"use strict";

const trimchar = (str, char) => {
    let i = 0;
    let j = str.length - 1;
    while (str[i] === char) i++;
    while (str[j] === char) j--;
    return str.slice(i, j + 1);
}

(async () => {
    const path = require('path')
    const fs = require('fs-extra')
    const glob = require("glob")
    const ObjectsToCsv = require('objects-to-csv')
    const url = require('url')
    const { parseDomain, fromUrl } = await import('parse-domain')
    // import { parseDomain, fromUrl } from "parse-domain"



    const getPayLevelDomainFromDomain = (fullDomain) => {
        const { subDomains, domain, topLevelDomains, errors } = parseDomain(fullDomain.replace('_', '-UNDERSCORE-'))
        if (errors && errors.length > 0) {

            return 'ERROR'
        } else {
            return domain + '.' + topLevelDomains.join('.')
        }
    }


    const getPayLevelDomainFromUrl = (urlString, alternative) => {
        if (urlString.startsWith('about:')) {
            return urlString
        } else if (urlString.startsWith('data:') || urlString.startsWith('blob:') || urlString === 'self-hosted') {
            if (alternative) {
                return alternative
            } else {
                throw 'Invalid URL without alternative'
            }
            return urlString
        } else {
            return getPayLevelDomainFromDomain(url.parse(urlString).hostname)
        }
    }

    let baseDir = 'postprocessing'
    let rawDir = (path.join(baseDir, '00_raw'))
    let withoutErrorDir = (path.join(baseDir, '10_without-error'))
    let withErrorDir = (path.join(baseDir, '11_with-error'))
    let reportDir = (path.join(baseDir, '12_reports'))
    let summaryDir = (path.join(baseDir, '20_summarized'))
    let workerStatusRawDir = (path.join(baseDir, '50_worker-status_raw'))
    let workerStatusReportDir = (path.join(baseDir, '51_worker-status_report'))

    fs.emptyDirSync(withoutErrorDir)
    fs.emptyDirSync(withErrorDir)
    fs.emptyDirSync(reportDir)
    fs.emptyDirSync(summaryDir)
    fs.emptyDirSync(workerStatusReportDir)



    // #######################################
    // Worker Status reporting
    // #######################################


    console.log('## Doing worker status analysis ##')
    const rawWorkerFiles = glob.sync('*.json', { cwd: workerStatusRawDir })
    let workerReport = []
    for (const file of rawWorkerFiles) {
        console.log(`Reading ${file}`)
        const workerStatusSummary = fs.readJSONSync(path.join(workerStatusRawDir, file))
        for (const worker in workerStatusSummary.worker_domains)
            workerReport.push({
                currentTime: workerStatusSummary.currentTime,
                worker: worker,
                startedAt: workerStatusSummary.worker_domains[worker].startedAt,
                domain: workerStatusSummary.worker_domains[worker].domain,
                domainNum: workerStatusSummary.worker_domains[worker].domainNum,
            })
    }

    console.log('Writing worker report')
    fs.writeJSONSync(path.join(workerStatusReportDir, 'workerStatusReport.json'), workerReport)



    // #######################################
    // Filtering and Statistics
    // #######################################

    console.log('## Doing general status analysis ##')
    const rawResultFiles = glob.sync('*.json', { cwd: rawDir })
    let statusReport = []
    let skippedDomains = []
    for (const file of rawResultFiles) {
        let basename = path.basename(file)
        let withError = []
        let withoutError = []
        console.log(`Reading ${file}`)
        const partialResults = fs.readJSONSync(path.join(rawDir, file))
        for (const result of partialResults) {
            let cmp = undefined
            let cmps = undefined
            let hasErrors = !!(result.error) || result.errors.length > 0
            let error //= result.errors


            // Duplicate Handling
            let existingDuplicates = statusReport.filter(e => e.domain === result.domain)
            if (existingDuplicates.length > 1) {
                throw 'Something went wrong. More than one duplicate already exists.'
            }
            else if (existingDuplicates.length > 0) {
                console.log(`Found duplicate for domain [${result.domain}]`)
                let duplicate = existingDuplicates[0]
                if (hasErrors) {
                    console.log(`Skipping this instance because it has errors. Keeping duplicate`)
                    continue
                } else if (duplicate.hasErrors || result.end > duplicate.end) {
                    console.log(`Removing duplicate. Keeping this instance because it has no errors or is newer.`)
                    // Remove duplicate from status report
                    statusReport = statusReport.filter(e => e.domain !== duplicate.domain)
                    // Remove duplicate from its output file
                    let duplicateFileLocation = path.join(duplicate.hasErrors ? withErrorDir : withoutErrorDir, duplicate.originalFile)
                    let duplicateOutputFile = fs.readJSONSync(duplicateFileLocation)
                    fs.writeJSONSync(duplicateFileLocation, duplicateOutputFile.filter(e => e.domain !== duplicate.domain))
                } else {
                    console.log(`Both with error. Duplicate newer. Keeping duplicate.`)
                    continue
                }
            }


            if (hasErrors) {
                withError.push(result)
                if (result.errors[0].msg === 'Not able to reach domain using any alternative') {
                    error = 'unreachable'
                } else if (result.errors[0] === 'Found no CMP') {
                    error = 'no CMP'
                } else if (result.errors[0].msg === "Fatal uncaught eror while processing domain." && result.errors[0].origErr.name === 'TimeoutError') {
                    error = 'timeout error'
                } else if (result.errors[0].msg === "Fatal uncaught eror while processing domain." && result.errors[0].origErr.name === 'Error') {
                    error = 'unspecified error'
                } else if (result.errors[0].msg === "Fatal uncaught eror while processing domain." && result.errors[0].origErr.code === "ERR_INVALID_ARG_TYPE") {
                    error = 'argtype error'
                } else if (result.errors[0] === 'domain was put on skiplist') {
                    error = 'domain skipped'
                    skippedDomains.push(result.domain)
                } else {
                    throw { msg: 'Unsupported error in processing', origError: result.errors }
                }
            } else {
                withoutError.push(result)
                error = 'Successful'
                cmps = result.acceptAll.cmp
                if (typeof (cmps) === 'string') {
                    cmp = cmps
                    cmps = [cmps]
                } else {
                    cmp = cmps[0]
                }
            }
            let reachedDomain = undefined
            if (result.acceptAll && result.acceptAll.pages && result.acceptAll.pages.length > 1) {
                reachedDomain = getPayLevelDomainFromUrl(result.acceptAll.pages[0].actualUrl)
            }
            statusReport.push({
                'domain': result.domain,
                reachedDomain: reachedDomain,
                'start': result.start,
                'end': result.end,
                'hasErrors': hasErrors,
                error: error,
                'originalFile': basename,
                cmp: cmp,
                cmps: cmps,
            })
        }

        if (withoutError.length > 0) {
            console.log(`Writing results without error to ${path.join(withoutErrorDir, basename)}`)
            fs.writeJSONSync(path.join(withoutErrorDir, basename), withoutError)
        }

        if (withError.length > 0) {
            console.log(`Writing results with error to ${path.join(withErrorDir, basename)}`)
            fs.writeJSONSync(path.join(withErrorDir, basename), withError)
        }
    }

    console.log('Writing status report')
    fs.writeJSONSync(path.join(reportDir, 'statusReport.json'), statusReport)

    console.log('Writing skipped domain list')
    fs.writeFileSync(path.join(reportDir, 'skippedDomains'), skippedDomains.join('\n'))


    // #######################################
    // Summarize and Flatten Results
    // #######################################

    console.log('## Summarizing successful results ##')

    let destinationParsingReport = []


    const getDestinationHostFromFinding = (finding) => {
        let destinationUrl = undefined
        let domainOnly = false
        let originalString = undefined
        let usedStringOrigin = undefined
        let taintedString = finding.str
        switch (finding.sink) {
            case 'fetch.url':
            case 'iframe.src':
            case 'img.src':
            case 'img.srcset':
            case 'navigator.sendBeacon(url)':
            case 'script.src':
            case 'WebSocket':
            case 'XMLHttpRequest.open(url)':
                if (finding.str.match(/^(https?|wss):\/\//i)) {
                    destinationUrl = finding.str
                    originalString = destinationUrl
                    usedStringOrigin = 'Tainted source string from report'
                } else if (finding.str.startsWith('//')) {
                    originalString = finding.str
                    destinationUrl = 'https:' + originalString
                    usedStringOrigin = 'Tainted source string from report'
                } else {
                    destinationUrl = finding.loc
                    originalString = destinationUrl
                    usedStringOrigin = 'Sink frame location'
                }
                break
            case 'document.cookie':
                // Example:   "str": "_ga=GA1.2.833097509.1667920221; path=/; expires=Thu, 07 Nov 2024 15:10:21 GMT; domain=cloudflare.com;",
                let match = finding.str.match(/(;\s*)?domain=([^;]*)/i)
                if (match) {
                    domainOnly = true
                    originalString = finding.str
                    destinationUrl = match[2]
                    usedStringOrigin = 'Tainted cookie string from report'
                } else {
                    destinationUrl = finding.loc
                    usedStringOrigin = 'Sink frame location'
                    originalString = destinationUrl
                }
                break
            case 'XMLHttpRequest.send':
            case 'XMLHttpRequest.setRequestHeader(value)':
            case 'fetch.body':
            case 'WebSocket.send':
            case 'navigator.sendBeacon(body)':
                originalString = finding.sinkOperation.arguments[0]
                if (originalString.match(/^(https?|wss):\/\//i)) {
                    destinationUrl = originalString
                    usedStringOrigin = 'Taint sink argument zero'
                } else if (originalString.startsWith('//')) {
                    destinationUrl = 'https:' + originalString
                    usedStringOrigin = 'Taint sink argument zero'
                } else {
                    originalString = finding.loc
                    destinationUrl = originalString
                    usedStringOrigin = 'Sink frame location'
                }
                break
            default:
                throw `Unsupported sink type: ${finding.sink}`
                break
        }

        if (destinationUrl) {
            destinationUrl = trimchar(destinationUrl, '.')
            let payLevelDomain = undefined
            try {
                if (domainOnly) {
                    payLevelDomain = getPayLevelDomainFromDomain(destinationUrl)
                } else {
                    payLevelDomain = getPayLevelDomainFromUrl(destinationUrl)
                }
                destinationParsingReport.push({
                    sink: finding.sink,
                    // sinkOperation: finding.sinkOperation,
                    usedStr: destinationUrl.substring(0, 500),
                    usedStrOrigin: usedStringOrigin.substring(0, 500),
                    originalStr: originalString.substring(0, 500),
                    taintedStr: taintedString.substring(0, 500),
                    args: finding.sinkOperation.arguments,
                    payLevelDomain: payLevelDomain,
                })
                return payLevelDomain
            } catch (error) {
                console.log(error)
                destinationParsingReport.push({
                    sink: finding.sink,
                    taintedStr: taintedString.substring(0, 500),
                    args: finding.sinkOperation.arguments,
                    // sinkOperation: finding.sinkOperation,
                    error: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))),
                })
                return undefined
            }
        } else {
            // Should never be reached
            throw 'No destinationUrl set'
        }
    }


    const linesForFlows = (resultFromSubScan) => {
        let lines = []

        for (const finding of resultFromSubScan.findings) {
            const destinationHost = getDestinationHostFromFinding(finding)
            for (const sourceOperation of finding.sourceOperations) {
                lines.push({
                    'page': finding.page,
                    'pageHost': getPayLevelDomainFromUrl(resultFromSubScan.pages[finding.page].actualUrl),
                    'frameHost': getPayLevelDomainFromUrl(finding.loc),
                    'destinationHost': destinationHost,
                    'source': sourceOperation.operation,
                    'sourceHost': getPayLevelDomainFromUrl(sourceOperation.location.filename, finding.loc),
                    'sink': finding.sink,
                    'sinkHost': getPayLevelDomainFromUrl(finding.sinkOperation.location.filename, finding.loc),
                })
            }
        }


        return lines
    }

    const addDomainInfo = (line, result, consentModeName) => {
        return {
            'domain': result.domain,
            'consentMode': consentModeName,
            ...line,
        }
    }

    console.log('Reading list of successful results')
    const successfulResultFiles = glob.sync('*.json', { cwd: withoutErrorDir })
    let summarizedFlowReport = []
    for (const file of successfulResultFiles) {
        console.log(`Reading ${file}`)
        const partialResults = fs.readJSONSync(path.join(withoutErrorDir, file))
        console.log(`Processing ${file}`)
        for (const result of partialResults) {

            summarizedFlowReport.push(...linesForFlows(result.acceptAll).map(l => addDomainInfo(l, result, 'acceptAll')))
            summarizedFlowReport.push(...linesForFlows(result.rejectAll).map(l => addDomainInfo(l, result, 'rejectAll')))
            summarizedFlowReport.push(...linesForFlows(result.doNothing).map(l => addDomainInfo(l, result, 'doNothing')))

        }
    }

    console.log(`Writing summarizedFlowReport.json`)
    fs.writeJSONSync(path.join(summaryDir, 'summarizedFlowReport.json'), summarizedFlowReport);

    // Currently causes nodejs dump due to garbage colllection error
    // (async () => {
    //     const csv = new ObjectsToCsv(summarizedFlowReport);
    //     console.log(`Writing summarizedFlowReport.csv`)
    //     await csv.toDisk(path.join(summaryDir, 'summarizedFlowReport.csv'));
    // })()



    console.log(`Deduplicating destinationParsingReport`)
    destinationParsingReport = [... new Set(destinationParsingReport.map(JSON.stringify))].map(JSON.parse)

    // console.log(`Writing destinationParsingReport.json (${destinationParsingReport.length} elements)`)
    // fs.writeJSONSync(path.join(reportDir, 'destinationParsingReport.json'), destinationParsingReport, { spaces: 2 });

    const destinationParsingReport_errors = destinationParsingReport.filter(x => !!x.error)
    console.log(`Writing destinationParsingReport_errors.json (${destinationParsingReport_errors.length} elements)`)
    fs.writeJSONSync(path.join(reportDir, 'destinationParsingReport_errors.json'), destinationParsingReport_errors, { spaces: 2 });

    console.log()
    console.log('## Finished ##')
    console.log()
})()



