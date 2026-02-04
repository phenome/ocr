## ADDED Requirements

### Requirement: Docker watch image entrypoint
The system SHALL provide a Docker image entrypoint that runs the watch workflow and reads `WATCH_DOCX` and `WATCH_XLSX` environment variables to configure watched folders.

#### Scenario: Missing watch variables
- **WHEN** neither `WATCH_DOCX` nor `WATCH_XLSX` is set
- **THEN** the entrypoint exits immediately with an error message

#### Scenario: Watch DOCX folder
- **WHEN** `WATCH_DOCX` is set to a folder path
- **THEN** the entrypoint logs `watching for files to convert to DOCX in folder <folder>` using the configured path

#### Scenario: Watch XLSX folder
- **WHEN** `WATCH_XLSX` is set to a folder path
- **THEN** the entrypoint logs `watching for files to convert to XLSX in folder <folder>` using the configured path

### Requirement: Docker image build script
The system SHALL provide an npm script that builds the Docker image tagged as `phenome/ocr`.

#### Scenario: Build script execution
- **WHEN** a developer runs the Docker build script
- **THEN** the Docker image is built with the `phenome/ocr` tag

### Requirement: Docker Hub publish workflow
The system SHALL provide a GitHub Actions workflow that builds, tags, and pushes the Docker image to Docker Hub on pushes to `main`.

#### Scenario: Push to main
- **WHEN** code is pushed to the `main` branch
- **THEN** the workflow builds and pushes the Docker image to Docker Hub using repository secrets for authentication
