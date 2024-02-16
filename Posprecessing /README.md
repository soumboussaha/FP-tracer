# `data/`

This folder contains the following:

- Popular website lists
- Post-processed crawl data
- Manually collected validation data
- Python-Notebooks for...
    - ...generating crawler input
    - ...creating entry sheets for manual validation
    - ...analyzing manual validation
    - ...analyzing crawl results
    - ...creating graphs

> If you are just looking for the main results of the thesis and how
> they are calculated, go to `FingerprintingCrawlAnalysis.ipynb`.
> This notebooks contains most of the results and graph generation.


## General Directories and Files

- `images/` - Output directory for graphs generated using Matplotlib
- `tables/` - Output directory for LaTeX source code for tables of graph data
- `thesis.mplstyle` - Matplotlib style file for setting graph appearance
- `common.py` - Shared code for the notebooks. Mainly contains helper functions and formatting. **Also contains the fingerprinting classification rule**.


## Most important files by phase


### Preparing a Filter Crawl

- `tranco_top-1m_N7QVW_2022-10-07.csv`- the original Tranco list of popular websites
- `TrancoOps.ipynb` - Notebook for processing the tranco list and generating an input file for the filter crawl


### Analyzing Results of Filter Crawl and Preparing Measurement Crawl

- `crawl_results_filter/` - Directory for the filter crawl results to be analyzed
- `crawl_results_filter/results.json` - the main results file from the filter crawl
- `data\FilterCrawlAnalysis.ipynb` - notebook for analyzing the filter crawl
    - get statistics
    - generate graphs
    - generate input list for measurement crawl


### Analyzing Results of the Measurement Crawls

- `crawl_results_fingerprinting/` - Directory for the measurements crawl results to be analyzed. *Please note that the result data has to be post-processed before analysis. See the crawler-repository for details on that*.
- `FingerprintingCrawlAnalysis.ipynb` - notebook for analyzing the fingerprinting crawl
    - get statistics
    - generate graphs
    - generate various samples for validation
    - do the fingerprinting classification


### Deeper Analysis / Interpretation

- `SingleAttributeCombinationAnalysis.ipynb` - Notebook for getting more insights regarding on specific combination of transmitted fingerprinting attributes
- `SinglePageAnalysis.ipynb` - Notebook for getting detailed insights into the fingerprinting activity on a specific website
- `SinglePageAnalysisTargeted.ipynb` - Same as above but allows to set more filters to get information on specific flows you have identified as interesting


### Validation

Most files/directories with `sample` or `entry_sheet` in their name belong to various validation attempts further described in the thesis.

These files are generally automatically sampled/generated from the two main Python notebooks, are manually created or combination of both.