
# FP-tracer Artifact Release

This directory presents the tools for the artifact release for FP-tracer, submitted to POpets 24.

## Directory Contents

- **crawler**: Contains the crawler code and instructions to run the crawl with different profiles.
- **foxhound**: A link to the maintained Foxhound project developed and used as part of the crawl.
- **post_processing**: (Will be updated soon) contains Python scripts to read and visualize crawling reports.
- **dataset**: Contains a set of detected attribute combinations and their associated entropies detected in the study.



# Artifact Appendix

Paper title: **FP-tracer: Fine-grained Browser Fingerprinting Detection via Taint-tracking and Multi-level Entropy-based Thresholds**

Requested Badge: **Available**

## Description
We have open-sourced the browser (i.e., extended Foxhound implementation) and the crawler code used in the paper. Additionally, we have made available as a CSV the list of attribute combinations that were detected to be leaked to remote servers and their associated joint entropy and anonymity set. We opted for "available" instead of "reproducible" as a badge to mitigate ethical issues. We did not open-source the dataset used for computing joint entropy values to address ethical concerns, as the dataset comprises real-world browser user fingerprints. Since this aspect of the study is not disclosed, one can reproduce our crawling experiments and reuse the provided entropy CSV file if similar attribute combinations are detected. If new combinations are detected, a dataset of fingerprints would be required to use our methodology to evaluate the detected attribute combination.

### Security/Privacy Issues and Ethical Concerns
The dataset used to compute the joint entropy values is not open-sourced due to its private nature.

## Basic Requirements
we recommend using an Ubuntu VM. The machine used on our end is an Ubuntu machine of kernel verion  5.4.0-144-generic 

Depending on the crawl scope, if you run a crawl with a list of a few domains to test the crawler, you won't need much processing power or time. However, crawling 100K domains as we did in the paper would require a few weeks, depending on the processing power of the machine used. 
For the sake of testing the artifact, using the example list presented for testing is sufficient.

### Software Requirements and Set up the Environment
- we recommend using an Ubuntu VM. The machine used on our end is an Ubuntu 20.04 machine of kernel verion  5.4.0-144-generic.
- Install NodeJS ( recommend verion is v18.17.1).
- Install Firefox (recommended verion is  Mozilla Firefox 124.0.2)
- Install Python 3 . you can run :
```bash
sudo apt install python3 python3-pip
```
- Install git.
- Install Jupyter Notebook (recommended verion is 6.5.3).
- Install necessary libraries to run python scripts jupyter notebook: pandas matplotlib numpy seaborn jenkspy .
you can run :

```bash
pip3 install pandas matplotlib numpy seaborn jenkspy
```

### Estimated Time and Storage Consumption
The evaluation can take 4 to 5 hours.

### Accessibility
The artifact will be maintained through:git@github.com:soumboussaha/FP-tracer.git

## Experiments


When running the crawler optional we recommend using the provided docker container to run the crawl. This avoids incompatibilities when using a `libstdc++` that's too new for the provided foxhound version. This would be visible by Foxhound crashing with an error such as:
>  [pid=433839][err] $HOME/.cache/ms-playwright/firefox-1322/firefox/libstdc++.so.6: version `GLIBCXX_3.4.30' not found (required by /usr/lib/libicuuc.so.74)
In case you get such an error please proceed by using the docker container.

Clone the repository:
```bash
git clone git@github.com:soumboussaha/FP-tracer.git
```

Access the file named crawler.

Go through the provided readme under/crawler/README.md

To install the crawler, run: `npm install`.

Alternatively, using the Docker container provided in the readme is recommended.

### Testing the Environment
Display help to ensure the crawler is installed:
```bash
npm run consentscan -- --help
```

Remark: Feel free to modify the content of the exampleURLs file, it contains the target domains for our demo evaluation.

To evaluate the crawler, please run the following experiments per crawling mode:

### Experiment 1:
Step 1: Run Filter crawl.

Duration (30 minutes - 1 hour).

This crawl filters domains that are compatible with the consent banner reader, Consent-O-Matic. 
```bash
sudo docker build --tag fingerprint-consent-docker .
sudo docker run -it  -v "$(pwd)/output:/app/output" fingerprint-consent-docker --list exampleURLs   -c 10 -b 10 -x 
```

The output of this crawl labels the domains based on the compatibility of the consent banner with consent-O-Matic.

this command can also be run for one domain rather than a list. 
for that, you can run :
```bash
sudo docker run -v "$(pwd)/output:/app/output" fingerprint-consent-docker  -u google.com
```

you should see the following output 
```bash
Starting worker 0 for processing page google.com. 0 pages in queue. 1 workers running.
No more pages available. Worker 0 will no longer be started.  0 workers remaining.
[
  {
    domain: 'google.com',
    usedUrl: 'https://google.com',
    fullUrl: 'https://www.google.com/',
    hasBanner: true,
    cmp: 'google_popup',
    error: undefined,
    start: '2024-05-01T18:54:26.508Z',
    end: '2024-05-01T18:54:32.399Z'
  }
]

```

hasBanner output field indicates whether the consent banner is detectable by consent-O-Matic.  For google.com the banner was detected successfully in the previous example.


### Experiment 2:
Duration (30 minutes - 2 hours).

Step 1: Run Measurement Crawl.

This crawler logs the fingerprinting flows of targeted domains and interacts in 3 ways with consent banners while logging the behavior. To run the crawl with a list :
```bash
sudo docker build --tag fingerprint-consent-docker .
sudo docker run -it  -v "$(pwd)/output:/app/output" fingerprint-consent-docker -m fingerprinting --list exampleURLs  -c 10 -b 10 -x 
```
To run the crawl with one single domain :
```bash
sudo docker run -v "$(pwd)/output:/app/output" fingerprint-consent-docker  -m fingerprinting -o output/results.json -u google.com
```

if the crawl runs succefully you will see printed to the console the detected fingerprinting attributes leaked when crawling the domain in 3 diffirent modes : by ignoring the consent banner , accepting the consent banner and rejecting the consent banner. 

the logs of the crawl will be saved in the indicated location with -O option in this case you can open output/results.json to see the logs of the crawl .

Step 2 (optional):

Go to file /Postprocessing/crawl_results_fingerprinting/. You will find the files of the crawl conducted in the paper related to the measurement crawl. To visualize them, run the Jupyter Notebook named FingerprintingCrawlAnalysis.ipynb. This step is marked as optional; other tools can be used to visualize and process the reports. We include these for the sake of example.

### Experiment 3:
Duration (30 minutes - 2 hours).

Step 1: Run Do nothing crawl.

This crawling mode does not interact with the consent banner and simply visits the domain pages while logging fingerprinting flows.
```bash
sudo docker run -v "$(pwd)/output:/app/output" fingerprint-consent-docker  -m donothing --list exampleURLs  -c 10 -b 10 -x
```
To run the crawl with one single domain :
```bash
sudo docker run -v "$(pwd)/output:/app/output" fingerprint-consent-docker -m donothing -o output/results.json -u google.com
```
you will see the output of the crawl summary displayed in the console.
the logs of the crawl will be saved in the indicated location with -O option in this case you can open output/results.json to see the logs of the crawl . 


Step 2 (optional):

For this step, first, you have to go back to the root of the cloned repo . you can go to the the directory : /Largefiles/ . here you have large files that contain the postprocessed data from the crawl presented in the paper, unzip the files, then copy them to /Postprocessing/crawl_results_Donothing/. 

To visualize them, run the Jupyter Notebook named Donothing.ipynb, under /Postprocessing. 

This step is marked as optional; other tools can be used to visualize and process the reports. We include these for the sake of example, also to provide an easy way to check our crawl results presented in the paper. 

### Main Results and Claims

#### Main Result 1: Using taint tracking to detect browser fingerprinting with minimal overhead.
We are the only work offering to open source their instrumented browser capable of tracking fingerprinting-related flows and their crawler code. Previous work either had significant overhead, or their implementation was closed source. We believe this artifact would help the community greatly. Refer to sections 4.1 and 4.2 for methodology and sections 5.1 and 5.2 for implementation details. Appendix A describes also the overhead computation.

#### Main Result 2: Conduct interactive crawl with consent banners.
Our crawler not only allows crawling domains but also interacts with consent banners. For that, you should run a filter crawl to determine compatible domains with ConsentOmatic, the integrated tool we use, and then run a measurement crawl to crawl those compatible domains, as described in Experiments 1 and 2. Refer to section 7.3 of the paper.

#### Main Result 3: Joint entropy computation to assess fingerprinting.
Unfortunately, we cannot open source the dataset that we used to compute as it contains private data that could impact web end users' privacy. However, we disclosed the list of attributes that we found and their related entropies under the directory dataset. This can help the community get a sense of the most dangerous combinations. Refer to sections 4.3 and 5.3 for methodology and implementation.

## Limitations
We have already touched a bit on the limitations of the artifact. If you run a new crawl and try to conduct an analysis, you might uncover new attribute combinations that are not listed in our provided list of attribute combinations. We will try to update it in the future by running crawls on our end since we have the dataset required to compute the joint entropy for the assessment to mitigate this limitation. However, any researcher or interested party who has a dataset of their own can reproduce our methodology.


