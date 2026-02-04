# Change: Add Docker Watch Image + CI Publish

## Why
We need a lightweight, repeatable way to run the watch workflow in containers and publish it automatically from main. This enables deployment to container platforms and consistent image delivery to Docker Hub.

## What Changes
- Add a Dockerfile that runs a watch-only entrypoint and reads `WATCH_DOCX` and `WATCH_XLSX` to configure watched folders.
- Add a new npm script to build the image with the required `phenome/ocr` tag.
- Add a GitHub Actions workflow that builds, tags, and pushes the image to Docker Hub on pushes to `main` using standard Docker actions.

## Impact
- Affected specs: tooling, cli
- Affected code: `Dockerfile`, `package.json`, `src/dockerWatch.ts`, `.github/workflows/docker-publish.yml`
- New CI requirement: Docker Hub credentials must be provided via repository secrets.
