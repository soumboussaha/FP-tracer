
# FP-tracer Artifact Release

This directory presents the tools for the artifact release for FP-tracer, submitted to POpets 24.

## Directory Contents

- **crawler**: Contains the crawler code and instructions to run the crawl with different profiles.
- **foxhound**: A link to the maintained Foxhound project developed and used as part of the crawl.
- **post_processing**: (Will be updated soon) contains Python scripts to read and visualize crawling reports.
- **dataset**: Contains a set of detected attribute combinations and their associated entropies detected in the study.



-------------------------- This section is added to facilitate the artifact evaluation. 
# Artifact Appendix

Paper title: **FP-tracer: Fine-grained Browser Fingerprinting Detection via Taint-tracking and Multi-level Entropy-based Thresholds**

Requested Badge: **Available**

## Description
We have open-sourced the browser (i.e., extended Foxhound implementation) and the crawler code used in the paper. Additionally, we have made available as a CSV the list of attribute combinations that were detected to be leaked to remote servers and their associated joint entropy and anonymity set. We opted for "available" instead of "reproducible" as a badge to mitigate ethical issues. We did not open-source the dataset used for computing joint entropy values to address ethical concerns, as the dataset comprises real-world browser user fingerprints. Since this aspect of the study is not disclosed, one can reproduce our crawling experiments and reuse the provided entropy CSV file if similar attribute combinations are detected. If new combinations are detected, a dataset of fingerprints would be required to use our methodology to evaluate the detected attribute combination.

### Security/Privacy Issues and Ethical Concerns
The dataset used to compute the values is not open-sourced due to its private nature, to avoid ethical concerns.

## Basic Requirements
Depending on the crawl scope, if you run a crawl with a list of a few domains to test the crawler, you won't need much processing power or time. However, crawling 100K domains as we did in the paper would require a few weeks, depending on the processing power of the machine used. For the sake of testing the artifact, using the example list presented for testing is sufficient.

### Software Requirements
- Install Linux (this script currently only runs on Linux because it assumes a Linux filesystem).
- Install NodeJS.
- Install Firefox.
- Install Jupyter Notebook.

### Estimated Time and Storage Consumption
The valuation can take 4 to 5 hours.

### Accessibility
The artifact will be maintained through:git@github.com:soumboussaha/FP-tracer.git

### Set up the Environment
Use Linux
make sure to install nodeJS
Make sure install firefox .
we recommend using the provided docker container to run the crawl.

Clone the repo:
```bash
git clone git@github.com:soumboussaha/FP-tracer.git
```

Access the file named crawler.

Go through the provided readme under: /crawler/readme.

To install the crawler, run: `npm install`.

Alternatively, using the Docker container provided in the readme is recommended.

### Testing the Environment
Display help to ensure the crawler is installed:
```bash
npm run consentscan -- --help
```

## Experiments
Remark: Feel free to modify the content of the exampleURLs file that contains target domains to evaluate other domains.

To evaluate the crawler, please run the following experiments per crawling mode:

### Experiment 1:
Step 1: Run Filter crawl.

Duration (30 minutes - 1 hour).

This crawl filters domains that are compatible with consent banner reader, Consent-O-matic. The output is used as a list to be crawled in the measurement crawl to reduce target domains.
```bash
npm run consentscan -- --list exampleURLs -o filter-scan_results.json -c 10 -b 10
```
or
```bash
sudo docker build --tag fingerprint-consent-docker .
sudo docker run -it -v "$(pwd)/output:/app/output" fingerprint-consent-docker --list exampleURLs -c 10 -b 10
```

Step 3: Visualize results.
Open the output file: filter-scan_results.json. Marked domains as non-compatible with Consent-O-Matic are detailed.

Step 4: Visualize the crawl of the paper (optional).
Exit the crawler directory. Go to file /Postprocessing/crawl_results_filter/. crawl_results_filter/results.json - the main results file from the filter crawl.
By running FilterCrawlAnalysis.ipynb, you will display:
- Get statistics.
- Generate graphs.
- Generate an input list for measurement crawl used in the consent banner crawl of the paper.

### Experiment 2:
Duration (30 minutes - 2 hours).

Step 1: Run Measurement Crawl.

This crawler logs the fingerprinting flows of targeted domains and interacts in 3 ways with consent banners while logging the behavior. To run the crawl:
```bash
sudo docker build --tag fingerprint-consent-docker .
sudo docker run -it -v "$(pwd)/output:/app/output" fingerprint-consent-docker -m fingerprinting -l exampleURLs -c 12 -b 10 -x
```

Step 2: Run post-processing.

Put all files into the post-processing input folders. Put the result files into post-processing/00_raw/. The result files are those files containing the actual crawl data and will usually have a name starting with results_.
Optional: Put the worker status files into post-processing/50_worker-status_raw/. Worker status files have a name starting with workerStatus_ followed by a UNIX timestamp. Other files like logs and the currentWorkerStatus.json file are not part of the post-processing procedure.
Run:
```bash
npm run postprocessing
```

New folders with the output files will appear. Open the file to find the summarized reports in JSON:
- SummarizedFlowReport.json contains the flows detected from each source to sink.
- statusReport.json contains the output of crawling each domain (if it was reachable, unreachable, or any other specific errors).

Step 3 (optional):

Go to file /Postprocessing/crawl_results_fingerprinting/. You will find the files of the crawl conducted in the paper related to the measurement crawl. To visualize them, run the Jupyter Notebook named FingerprintingCrawlAnalysis.ipynb. This step is marked as optional; other tools can be used to visualize and process the reports. We include these for the sake of example.

### Experiment 3:
Duration (30 minutes - 2 hours).

Step 1: Run Do nothing crawl.

This crawling mode does not interact with the consent banner and simply visits the domain pages while logging fingerprinting flows.
```bash
sudo docker build --tag fingerprint-consent-docker .
sudo docker run -it -v "$(pwd)/output:/app/output" fingerprint-consent-docker -m donothing -l exampleURLs -c 12 -b 10 -x
```

Step 2: Put all files into the post-processing input folders. Put the result files into post-processing/00_raw/. The result files are those files containing the actual crawl data and will usually have a name starting with results_. Optional: Put the worker status files into post-processing/50_worker-status_raw/. Worker status files have a name starting with workerStatus_ followed by a UNIX timestamp. Other files like logs and the currentWorkerStatus.json file are not part of the post-processing procedure.
To run the post-processing script specific to this mode, run:
```bash
npm run DonothingPost
```

New folders with the output files will appear. Open the file to find the summarized reports in JSON:
- SummarizedFlowReport.json contains the flows detected from each source to sink.
- statusReport.json contains the output of crawling each domain (if it was reachable, unreachable, or any other specific errors).

Step 3 (optional):

For this step, first, you have to get the large files in /Largefiles/, unzip them, and then copy them to /Postprocessing/crawl_results_Donothing/. You will find the files of the crawl conducted in the paper related to the simple large-scale crawl without the consent banner. 

To visualize them, run the Jupyter Notebook named Donothing.ipynb, under /Postprocessing. This step is marked as optional; other tools can be used to visualize and process the reports. We include these for the sake of example.

### Main Results and Claims

#### Main Result 1: Using taint tracking to detect browser fingerprinting with minimal overhead.
We are the only work offering to open source their instrumented browser capable of tracking fingerprinting-related flows and their crawler code. Previous work either had significant overhead, or their implementation was closed source. We believe this artifact would help the community greatly. Refer to sections 4.1 and 4.2 for methodology and sections 5.1 and 5.2 for implementation details. Appendix A describes also the overhead computation.

#### Main Result 2: Conduct interactive crawl with consent banners.
Our crawler not only allows crawling domains but also interacts with consent banners. For that, you should run a filter crawl to determine compatible domains with ConsentOmatic, the integrated tool we use, and then run a measurement crawl to crawl those compatible domains, as described in Experiments 1 and 2. Refer to section 7.3 of the paper.

#### Main Result 3: Joint entropy computation to assess fingerprinting.
Unfortunately, we cannot open source the dataset that we used to compute as it contains private data that could impact web end users' privacy. However, we disclosed the list of attributes that we found and their related entropies under the directory dataset. This can help the community get a sense of the most dangerous combinations. Refer to sections 4.3 and 5.3 for methodology and implementation.

## Limitations
We have already touched a bit on the limitations of the artifact. If you run a new crawl and try to conduct an analysis, you might uncover new attribute combinations that are not listed in our provided list of attribute combinations. We will try to update it in the future by running crawls on our end since we have the dataset required to compute the joint entropy for the assessment to mitigate this limitation. However, any researcher or interested party who has a dataset of their own can reproduce our methodology.


