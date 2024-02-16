#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd "$parent_path"


gzip -k -f 12_reports/statusReport.json
# gzip -k -f 12_reports/destinationParsingReport.json
gzip -k -f 20_summarized/summarizedFlowReport.json
gzip -k -f 51_worker-status_report/workerStatusReport.json
