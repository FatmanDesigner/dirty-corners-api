#!/usr/bin/env bash

echo 'Executing hourly crawl against Facebook Fanpage news feed...'

node ./service/fanpage-monitor/index.js
