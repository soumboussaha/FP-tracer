const fs = require('fs-extra')

const config = require('../config')


let debugActive = false
let verboseActive = false

let domainCounter = 0

let worker_status = {}

const registerWorkerDomain = (worker, domain) => {
    worker_status[worker] = {
        domain: domain,
        domainNum: domainCounter++,
        startedAt: currentTime(),
    }
}

const setDomainCounter = (finishedDomainCount) => {
    domainCounter = finishedDomainCount - 1
}

const getWorkerPrefix = (worker) => {
    return `[Worker ${worker.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}] `
}

const saveWorkerStatus = async (path) => {

    fs.writeJsonSync(path, {
        currentTime: currentTime(),
        worker_domains: worker_status,
    })
}

const getWorkerDomainSuffix = (worker) => {
    if (worker_status[worker].domain) {
        return '   [' + worker_status[worker].domain + ']'
    } else {
        return ''
    }
}

const getWorkerMessage = (message, worker) => {
    let messageText
    if ((typeof message) == 'object') {
        messageText = JSON.stringify(message)
    } else {
        messageText = message
    }
    if (worker || worker === 0) {
        return `${getWorkerPrefix(worker)} ${messageText}${getWorkerDomainSuffix(worker)}`
    } else {
        return message
    }
}

const logVerbose = (message, worker) => {
    if (verboseActive) {
        console.log(getWorkerMessage(message, worker))
    }
}

const logDebug = (message, worker) => {
    if (debugActive) {
        console.log(getWorkerMessage(message, worker))
    }
}

const logAlways = (message, worker) => {
    console.log(getWorkerMessage(message, worker))
}

const currentTime = () => {
    return new Date().toISOString()
}

const processError = (error) => {
    return JSON.parse(
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
}

module.exports = {

    setDebugActive: (flag) => {
        debugActive = flag
    },

    setVerboseActive: (flag) => {
        verboseActive = flag
    },

    getWorkerMessage: logDebug,

    logVerbose: logVerbose,

    logDebug: logDebug,

    logAlways: logAlways,

    registerWorkerDomain: registerWorkerDomain,

    currentTime: currentTime,

    saveWorkerStatus: saveWorkerStatus,

    setDomainCounter: setDomainCounter,

    processError: processError,

}

