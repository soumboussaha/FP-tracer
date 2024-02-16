#!/usr/bin/env bash

# this whole mechanism basically exists because of the following issue
# https://github.com/microsoft/playwright/issues/9840

echo "[runWithAutoRestart]" running tests with auto-restart
echo "[runWithAutoRestart] only use this, if output is set to output/* (default for docker)"
echo "[runWithAutoRestart]" using parameters "$@"

runNum=0
maxRunsWithoutChange=50
maxRunsBeforeSkipping=3
fileCount=-1

while true; do
    echo "[runWithAutoRestart]" retry number $runNum
    echo "[runWithAutoRestart]" previous file count $fileCount
    newFileCount=$(find output/ -maxdepth 1 -name "results\.json*" -printf '.' | wc -m)
    echo "[runWithAutoRestart]" new file count $newFileCount
    if [ $newFileCount -gt $fileCount ]; then
        echo "[runWithAutoRestart] resetting run counter"
        fileCount=$newFileCount
        runNum=0
    fi

    if [ $runNum -gt $maxRunsBeforeSkipping ]; then
        echo "[runWithAutoRestart]" "starting crawler with skip flag"
        npm run consentscan -- -s "$@" & crawler_pid=$!
    else
        echo "[runWithAutoRestart]" "starting crawler"
        npm run consentscan -- "$@" & crawler_pid=$!
    fi

    while true; do
        sleep 30s

        if ! kill -0 "$crawler_pid"; then
            echo "[runWithAutoRestart]" "Crawler crashed"
            break
        fi

        if test "`find output/ -maxdepth 1 -name "workerStatus*\.json" -mmin -15`"; then
            echo "[runWithAutoRestart]" "last log file less than 15 minutes old. continuing..."
        else
            echo "[runWithAutoRestart]" "last log file older than 15 minutes. KILLING CRAWLER"
            kill -9 "$crawler_pid"
            break
        fi
    done

    wait "$crawler_pid"
    if [ $? -eq 0 ]; then
        echo "[runWithAutoRestart] tests successfully finished"
        break
    fi

    ((++runNum))
    if [ $runNum -gt $maxRunsWithoutChange ]; then
        echo "[runWithAutoRestart] max retry count reached"
        break
    fi

done
