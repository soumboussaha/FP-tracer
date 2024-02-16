const { firefox } = require('playwright')
const path = require('path')
const fs = require('fs-extra')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const events = require('events')
const glob = require("glob")
const util = require('util')

const logging = require('./common-functions/logging')
const profile = require('./common-functions/profile')
const config = require('./config')
const { currentTime } = require('./common-functions/logging')
const { ADDRCONFIG } = require('dns')
const crawls = require('./crawls/crawls').crawls


const argv = yargs(hideBin(process.argv))
  // .env('')
  .env('CONSENTSCAN')
  .option('v', {
    alias: 'verbose',
    type: 'boolean',
    description: 'print info about process steps'
  })
  .option('d', {
    alias: 'debug',
    type: 'boolean',
    description: 'print even more info about process steps'
  })
  .option('m', {
    alias: 'mode',
    choices: crawls.map(c => c.argument),
    description: 'which scan mode to carry out',
    default: crawls[0].argument
  })
  .option('u', {
    alias: 'url',
    type: 'string',
    description: 'Specify a single URL to be analyzed'
  })
  .option('l', {
    alias: 'list',
    type: 'string',
    description: 'Specify a path to a file containing sites to be scanned. One URL per line.'
  })
  .option('o', {
    alias: 'output',
    type: 'string',
    description: 'Specify a path to where output should be written. If no output path is specified, results will be written to console'
  })
  .option('c', {
    alias: 'concurrency',
    type: 'int',
    description: 'Specify the number of pages which can be crawled at any given point in parallel.',
    default: 1
  })
  .option('b', {
    alias: 'backup',
    type: 'int',
    description: 'Specify the number results after which a backup is made during scanning.',
    default: 5
  })
  .option('x', {
    alias: 'clear',
    type: 'boolean',
    description: 'Clear results in memory after backup. Useful for large amounts of data. Will cause result file to be only available as parts.',
  })
  .option('e', {
    alias: 'executable-location',
    type: 'string',
    description: 'Location of the Project Foxhound executable to be used for crawls involving taint tracking'
  })
  .option('s', {
    alias: 'skip-last-active',
    type: 'boolean',
    description: 'Skip the domains, the crawlers were last working on. Useful, if crawler is stuck.',
  })
  .conflicts('u', 'l')
  .check((argv, options) => {
    if (argv.u || argv.l) {
      return true
    } else {
      throw new Error("Must specify information about the site(s) to be scanned.")
    }
  })
  .example('npm run $0 -- --url "www.h-ka.de" -d -v ', 'scan "www.h-ka.de" for consent banners and log all available information')
  .example('npm run consentscan -- --list exampleURLs -v -o results.json', 'scan all pages in "exampleURLs" and output results to "results.json"')
  .epilog('Do not forget the "--" before the parameters. Otherwise they will not be passed to the script by npm run.')
  .epilog('You can also set parameters using environment variables of form CONSENTSCAN_[parameterName]')
  .showHelpOnFail(false, 'whoops, something went wrong! run with -- --help')
  .argv

// when debugging output is requested, also include verbose output
if (argv.d) argv.v = true

if (argv.e) {
  config.setFoxhoundPath(argv.e)
}

logging.setDebugActive(argv.d)
logging.setVerboseActive(argv.v)

const backupFrequency = argv.b;

const crawl = crawls.filter(c => c.argument == argv.m)[0];

let results = []

let clearAfterBackup = argv.x

const workerEventEmitter = new events.EventEmitter()

pages = []
if (argv.url) {
  pages.push(argv.url)
}
else {
  pages = fs.readFileSync(argv.l).toString().split("\n").filter(page => page).map(page => page.trim())
}
logging.logDebug('Scan will be done for:')
for (const page of pages) {
  logging.logDebug('- ' + page)
}


(async () => {

  if (argv.o) {
    try {
      logging.logVerbose(`Looking for backup files at ${argv.o}_*`)
      const backupFiles = glob.sync(`${argv.o}_*`)
      if (backupFiles.length > 0) {
        console.log('Found incomplete backup. Restoring backup and continuing crawl from there')
        for (const file of backupFiles) {
          logging.logVerbose(`- Restoring ${file}`)
          const partialResults = fs.readJSONSync(file)
          logging.logVerbose(`- Removing pages from backup from pending pages`)
          for (const result of partialResults) {
            const page = result.domain
            const index = pages.indexOf(page)
            if (index > -1) {
              pages.splice(index, 1)
            }
          }
          if (clearAfterBackup) {
            results = results.concat(Array.apply(undefined, Array(partialResults.length)))
          } else {
            results = results.concat(partialResults)
          }
          logging.logVerbose(`- Restored ${file}`)
        }
        logging.setDomainCounter(results.length)
        console.log('Backups read.')
        console.log(`Restore finished. Restored ${results.length} results.`);
      } else {
        logging.logVerbose('No backup files found. Beginnning from start.')
      }
    } catch (error) {
      console.log(`Error. Cannot restore backup. Remove backup files to continue.`)
      console.log(error)
      console.log(`Exiting...`)
      throw (error)
    }
  }

  let skiplist = []
  if (argv.s && argv.o) {
    console.log()
    console.log('s-Flag was specified. Will read last worker status and put those domains on skiplist')
    try {
      let lastWorkerStatus = fs.readJSONSync(path.join(path.dirname(argv.o), 'currentWorkerStatus.json'))
      console.log('Last worker status read')
      for (const worker in lastWorkerStatus.worker_domains) {
        console.log(`Adding [${lastWorkerStatus.worker_domains[worker].domain}] to skiplist`)
        skiplist.push(
          lastWorkerStatus.worker_domains[worker].domain
        )
      }
      console.log('Skiplist filled')
    } catch (error) {
      console.log(error)
      console.log('Cannot read last worker status. Continuing...')
    }
    console.log()
  }

  const backupResults = (from, to) => {
    logging.logVerbose(`Backing up results from ${from} to ${to}.`)
    resultSlice = results.slice(from, to + 1)
    if (!argv.o) {
      console.log(resultSlice)
    } else {
      try {
        const fromText = from.toLocaleString('en-US', { minimumIntegerDigits: 8, useGrouping: false })
        const toText = to.toLocaleString('en-US', { minimumIntegerDigits: 8, useGrouping: false })
        const backupFilePath = `${argv.o}_${fromText}-${toText}.json`
        fs.writeJsonSync(backupFilePath, resultSlice);
        logging.logVerbose(`Backup successful: ${backupFilePath}`)
        if (clearAfterBackup) {
          for (let index = from; index <= to; index++) {
            results[index] = undefined
          }
        }
      } catch (error) {
        console.log(`Error. Cannot write backup to file at ${backupFilePath}.`)
        console.log(error)
        logging.logVerbose('Outputting to console as fallback.')
        console.log(resultSlice)
      }
    }
  }

  const processSinglePage = async (page, worker, allowedRetries = 2) => {
    logging.logVerbose(`## Running scan for page [${page}] using crawl profile [${crawl.name}] ##`, worker)


    doProcessing = async (page, worker, remainingRetries) => {

      let result = undefined
      // let profileCreated = false
      // let tempPath
      let start = logging.currentTime()

      if (skiplist.includes(page)) {
        logging.logAlways(`Domain [${page}] is on skiplist. Will not be processed.`, worker)
        result = { 'domain': page, errors: ['domain was put on skiplist'] }
      } else {
        try {

          result = await crawl.crawlDomain(page, worker)
          logging.logVerbose(`Result for [${page}]: ${JSON.stringify(result)}`)

        }
        catch (e) {
          if (remainingRetries > 0) {
            logging.logAlways(`Uncaught error while processing page ${page}`, worker)
            console.warn(e)
            logging.logAlways(`${remainingRetries} retries left. Retrying...`, worker)
            result = await doProcessing(page, worker, remainingRetries - 1)
          } else {
            logging.logAlways(`Uncaught error while processing page ${page}`, worker)
            console.warn(e)
            logging.logAlways(`No retries left`, worker)
            result = { 'domain': page, errors: [{ 'msg': `Fatal uncaught eror while processing domain.`, 'origErr': logging.processError(e) }] }
          }
        }
        // finally {
        //   if (profileCreated) { await profile.destroyUserProfile(tempPath, worker) }
        // }
      }


      result.start = start
      result.end = logging.currentTime()

      return result
    }

    let result = await doProcessing(page, worker, allowedRetries)
    workerEventEmitter.emit('finished', { 'worker': worker, 'result': result });

  }

  workerEventEmitter.on('finished', (rval) => {
    if (rval.result) {
      results.push(rval.result)
    }
    activeWorkers--
    startWorker(rval.worker)
  })

  let activeWorkers = 0

  const finalizeResults = () => {

    logging.logVerbose(`## Page scanning finished ##`)
    clearInterval(workerStatusLoggingInterval)
    if (!argv.o) {
      console.log(util.inspect(results, { showHidden: false, depth: null, colors: true }))
    } else {
      try {
        if (clearAfterBackup) {
          let from = results.findIndex(v => v !== undefined)
          if (from != -1) {
            logging.logVerbose(`Writing one last file using backup functionality.`)
            let to = results.length - 1
            backupResults(from, to)
          }
        } else {
          logging.logVerbose(`Writing results to file at ${argv.o}.`)
          fs.writeJsonSync(argv.o, results);
          console.log(`Write successful`)
          logging.logVerbose(`Removing backup files`)
          const backupFiles = glob.sync(`${argv.o}_*`)
          for (const file of backupFiles) {
            fs.removeSync(file)
          }
        }
      } catch (error) {
        console.log(`Error. During Saving result / removing backups.`)
        console.log(error)
        logging.logVerbose('Outputting to console as fallback.')
        console.log(util.inspect(results, { showHidden: false, depth: null, colors: true }))
      }
    }
  }

  const startWorker = (worker) => {
    if ((results.length % backupFrequency) === 0 && results.length != initialResultsLength) {
      backupResults(results.length - backupFrequency, results.length - 1)
    }
    if (worker !== 0 && !worker) {
      console.log(`Error: received invalid worker number to start worker ${worker}`)
    }
    const page = pages.shift()
    if (page) {
      activeWorkers++;
      console.log(`Starting worker ${worker} for processing page ${page}. ${pages.length} pages in queue. ${activeWorkers} workers running.`)
      logging.registerWorkerDomain(worker, page)
      if (argv.o) {
        logging.saveWorkerStatus(path.join(path.dirname(argv.o), 'currentWorkerStatus.json'))
      }
      processSinglePage(page, worker)
    } else {
      console.log(`No more pages available. Worker ${worker} will no longer be started.  ${activeWorkers} workers remaining.`)
      if (!activeWorkers) {
        finalizeResults()
      }
    }
  }

  // Register worker status logging
  let workerStatusLoggingInterval = undefined
  if (argv.o) {
    const interval = 1000 * 60 * 10 // 10 minutes

    const logWorkerStatus = () => {
      const statusLoggingPrefix = path.join(path.dirname(argv.o), 'workerStatus_' + (Number((new Date()))) + '.json')
      logging.saveWorkerStatus(statusLoggingPrefix)
    }

    logWorkerStatus()
    workerStatusLoggingInterval = setInterval(logWorkerStatus, interval)
  }

  initialResultsLength = results.length
  logging.logVerbose('Starting initial workers')
  for (const worker of Array(argv.c).keys()) {
    logging.logVerbose('Starting initial worker ' + worker)
    startWorker(worker)
  }



})();