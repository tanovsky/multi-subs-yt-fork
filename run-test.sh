#!/bin/bash

# Install dependencies if not already installed
echo "Installing dependencies..."
npm install
npx playwright install

# Run the test with xvfb (virtual X server)
echo "Running Playwright tests..."
xvfb-run -a npm run test:playwright
