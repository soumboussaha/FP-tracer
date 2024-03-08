> **This repository is part of collection of repositories created as part of FP-tracer**

# playwright-fingerprint-consent

A NodeJS script for automating crawls for collecting data about consent prompts and browser fingerprinting using playwright.

Created for the master's thesis *The Impact of User Consent on Browser Fingerprinting*.

## General Information

### Prerequisites
1. Install Linux (this script is currently only running on Linux, because it assumes a Linux-like Filesystem)
1. Install NodeJS
1. Install Firefox

### Install
```
npm install
```

### Usage Information

All parameters are documented. More information can be accessed: via
```
npm run consentscan -- --help
```

Parameters as of 2022-11-10:
```
Options:
      --help                 Show help                                 [boolean]
      --version              Show version number                       [boolean]
  -v, --verbose              print info about process steps            [boolean]
  -d, --debug                print even more info about process steps  [boolean]
  -m, --mode                 which scan mode to carry out
                       [choices: "filter", "fingerprinting"] [default: "filter"]
  -u, --url                  Specify a single URL to be analyzed        [string]
  -l, --list                 Specify a path to a file containing sites to be
                             scanned. One URL per line.                 [string]
  -o, --output               Specify a path to where output should be written.
                             If no output path is specified, results will be
                             written to console                         [string]
  -c, --concurrency          Specify the number of pages which can be crawled at
                             any given point in parallel.           [default: 1]
  -b, --backup               Specify the number results after which a backup is
                             made during scanning.                  [default: 5]
  -x, --clear                Clear results in memory after backup. Useful for
                             large amounts of data. Will cause result file to be
                             only available as parts.                  [boolean]
  -e, --executable-location  Location of the Project Foxhound executable to be
                             used for crawls involving taint tracking   [string]

Examples:
  npm run consentscan -- --url              scan "www.h-ka.de" for consent
  "www.h-ka.de" -d -v                       banners and log all available
                                            information
  npm run consentscan -- --list             scan all pages in "exampleURLs" and
  exampleURLs -v -o results.json            output results to "results.json"

Do not forget the "--" before the parameters. Otherwise, they will not be passed
to the script by npm run.
You can also set parameters using environment variables of the form
CONSENTSCAN_[parameterName]
```



### Example
```
npm run consentscan -- --list exampleURLs -v -o results.json
```

## Running with Docker

This crawler also supports running in a container. 
The container image is based on the [Playwright-image provided by Microsoft](https://mcr.microsoft.com/en-us/product/playwright/about).

Please be aware of the following points when running the application via docker:

- The application will always output to a file
  - The file's internal path will be `/app/output/results.json`
  - Use a bind mount to access the file; e.g. `-v "$(pwd)/output:/app/output"`
- Outputting to the console is not available


### Building the Container

```
sudo docker build --tag fingerprint-consent-docker .
```


### Running the Container

Crawling a single domain
```
sudo docker run -v "$(pwd)/output:/app/output" fingerprint-consent-docker  -u h-ka.de
```

Crawling the example list with 5 workers and backups after every 3 sites
```
sudo docker run -v "$(pwd)/output:/app/output" fingerprint-consent-docker -o output/results.json -l exampleURLs -c 5 -b 3
```


## Information

### Crawled Websites

The paper is based on the [Tranco List #N7QVW](https://tranco-list.eu/list/N7QVW/100000). We targeted the top 100k websites on it.

This list has already been prepared in the required format and is provided as part of this repository at [tranco/tranco_top-100k_N7QVW_2022-10-07](tranco/tranco_top-100k_N7QVW_2022-10-07).
It can be used as the input for the crawl by specifying `-l tranco/tranco_top-100k_N7QVW_2022-10-07`.

### Filter Crawl ( consent banner in scope) 

The first crawl will be a filter crawl to determine, which websites possess a consent banner compatible with consent-o-matic. This crawl will also filter  any unreachable or invalid websites.

To run this first crawl, execute the following command:
```
npm run consentscan -- --list tranco/tranco_top-100k_N7QVW_2022-10-07  -o tranco-top100k_filter-scan_results.json -c 10 -b 10
```

This will crawl all 100k pages. It will use `10` workers (`-c`) and do a backup after every `10` successful pages crawled (`-b`). You can modify those parameters if needed.

**Warning:** If you increase the concurrency by to much, some websites might not be reachable because of missing resources.
No specific error messages will be generated in this case, making this problem hard to recognize.
On a simple development machine, 10 workers were running fine.

#### Docker Instructions

You can also do this crawl using Docker

First, build the image
```
sudo docker build --tag fingerprint-consent-docker .
```

Then run the modified command
```
sudo docker run -it -v "$(pwd)/output:/app/output" fingerprint-consent-docker --list tranco/tranco_top-100k_N7QVW_2022-10-07 -o output/tranco-top100k_filter-scan_results.json -c 10 -b 10
```

Backup and recovery will still work.

In a local test, 10 pages required about 40s of crawling time.
This would give an estimate of 400,000s = 6666m = 111h = 4.6d of runtime for the full crawl.
This of course can change depending on the resources of the crawler and specifically of the websites.

### Measurement Crawl ( consent banner in score )

The measurement crawl will access each page with a compatible consent banner 3 times. Each time use a different consent-action (do-nothing, accept-all, reject-all).

Use the following commands to start the crawl.

First, build the image
```
sudo docker build --tag fingerprint-consent-docker .
```

Then run the modified command
```
sudo docker run -it -v "$(pwd)/output:/app/output" fingerprint-consent-docker -m fingerprinting -l tranco/tranco_top-100k_N7QVW_2022-10-07_with_cmp -o output/results.json -c 12 -b 10 -x
```

A few notes about the used flags:

- `-m fingerprinting` specifies that the fingerprinting/main crawls should be executed; not the filter-crawl again
- `-c 12` is the concurrency/number of workers. It can probably be set to slightly below the number of cores
- `-b 10` is the number of results per backup file. `10` should be fine
- `-x` will cause the backup files not to be joined in the end. furthermore, the RAM will be cleared once results are written to backup files. this flag should be set because of the higher amount of data in the fingerprinting crawl
- `-l tranco/tranco_top-100k_N7QVW_2022-10-07_with_cmp` is the list of domains for the main crawl. It was created by evaluating the results from the first filter crawl
- `-o output/results.json` Sets the location of the file to store the results.

### Donothing Crawl ( simple crawl without accounting for consent banners ) 

Similar to The measurement crawl, Donothing will access each page regardless of the compatibility with the consent banner once with the consent-action do-nothing.

Use the following commands to start the crawl.

First, build the image
```
sudo docker build --tag fingerprint-consent-docker .
```

Then run the modified command
```
sudo docker run -it -v "$(pwd)/output:/app/output" fingerprint-consent-docker -m donothing -l tranco/tranco_top-100k_N7QVW_2022-10-07 -o output/results.json -c 12 -b 10 -x
```

A few notes about the used flags:

- `-m donothing` specifies that the fingerprinting/main crawls should be executed; not the filter-crawl again
- `-c 12` is the concurrency / number of workers. It can probably be set to slightly below the number of cores
- `-b 10` is the number of results per backup file. `10` should be fine
- `-x` will cause the backup files not to be joined in the end. furthermore, the RAM will be cleared once results are written to backup files. this flag should be set because of the higher amount of data in the fingerprinting crawl
- `-l tranco/tranco_top-100k_N7QVW_2022-10-07` is the list of domains for the main crawl. this is the initial list and does not require a prior crawl
- `-o output/results.json` Sets the location of the file to store the results.

### Postprocessing

The data generated by the measurement crawl is nested and thus difficult to analyze directly using tools like Pandas.
The postprocessing will analyze all result files from the measurement crawl and generate flat files that can be analyzed more easily.
It also contains logic to categorize errors, determine hosts, and do other cleanup.

To use the postprocessing, do the following:
- put all files into the postprocessing input folders
    - put the result files into [postprocessing/00_raw/](./postprocessing/00_raw/). The result files are those files containing the actual cawl data and will usually have a name starting with `results_`.
    - *optional:* put the worker status files into [postprocessing/50_worker-status_raw/](./postprocessing/50_worker-status_raw/). Worker status files have a name starting with `workerStatus_` followed by a UNIX timestamp.
    - Other files like logs and the `currentWorkerStatus.json` file are not part of the postprocessing procedure
- run `npm run postprocessing` to do the postprocessing. New folders with the output files will appear.
- run `npm run compress` to gzip some of the larger output files (optional)
- run  `npm run DonothingPost` to do the Post-processing for the Donothing crawl mode.

Postprocessing is designed to run locally. It has not been tested in containerized environments.

If you want to extract other data from the raw data collected by the crawl, that is not extracted by the current Posprocessing code you will have to update the Posprocessing script, the code is fairly easy to browse, so don't hesitate to reach out to us for assistance. 


