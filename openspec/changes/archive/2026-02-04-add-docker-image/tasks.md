## 1. Docker Runtime

- [x] 1.1 Add a Docker watch entrypoint that validates `WATCH_DOCX`/`WATCH_XLSX` and starts `watchFolders`
- [x] 1.2 Add Dockerfile and `.dockerignore` to build the watch image

## 2. Developer Workflow

- [x] 2.1 Add an npm script that builds the Docker image tagged `phenome/ocr`

## 3. CI Publish

- [x] 3.1 Add a GitHub Actions workflow to build, tag, and push the Docker image to Docker Hub on `main`
