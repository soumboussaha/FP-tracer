In this directory a sample of Jupyter notebook scripts that illustrate how the output data of the crawl could be visualized. 
using these scripts is not mandatory, Feel free to write your script to visual data and process it. we add a few samples here as it could be useful to get a sense of what the data looks like. 

## Most important files by phase

### Preparing a Filter Crawl ( if consent banner interaction is in scope )

- `tranco_top-1m_N7QVW_2022-10-07.csv`- the original Tranco list of popular websites
- `TrancoOps.ipynb` - Notebook for processing the tranco list and generating an input file for the filter crawl


### Analyzing Results of Filter Crawl and Preparing Measurement Crawl( if consent banner interaction is in scope )

- `crawl_results_filter/` - Directory for the filter crawl results to be analyzed
- `crawl_results_filter/results.json` - the main results file from the filter crawl
- `data\FilterCrawlAnalysis.ipynb` - notebook for analyzing the filter crawl
    - get statistics
    - generate graphs
    - generate input list for measurement crawl


### Analyzing Results of the Measurement Crawls ( if consent banner is in scope ) 

- `crawl_results_fingerprinting/` - Directory for the measurements crawl results to be analyzed. *Please note that the result data has to be post-processed before analysis. See the crawler-repository for details on that*.
- `FingerprintingCrawlAnalysis.ipynb` - notebook for analyzing the fingerprinting crawl
  


### Analyzing Results of a crawl without Consent banner 

- `crawl_results_Donothing/` - Directory for the do-nothing crawl results to be analyzed. *Please note that the result data has to be post-processed before analysis. See the crawler-repository for details on that*.
- `Donohting.ipynb` - notebook for analyzing the fingerprinting crawl
