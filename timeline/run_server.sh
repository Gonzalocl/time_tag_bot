#!/bin/bash

(sleep 1; google-chrome-stable 'http://0.0.0.0:5959/timeline.html') &
python -m http.server 5959
