const filterCrawl = require('./filter-crawl')
const fingerprintingCrawl = require('./fingerprinting-crawl')
const validation = require('./validation')
const donothing = require('./donothing')

const crawls = [
    {
        name: 'Filter Crawl',
        argument: 'filter',
        crawlDomain: filterCrawl.crawlDomain
    },
    {
        name: 'Fingerprinting Crawl',
        argument: 'fingerprinting',
        crawlDomain: fingerprintingCrawl.crawlDomain
    },
    {
        name: 'Validation',
        argument: 'validate',
        crawlDomain: validation.crawlDomain
    },
    {
        name: 'Donothing',
        argument: 'donothing',
        crawlDomain: donothing.crawlDomain
    }
]

module.exports = {
    crawls: crawls
}
