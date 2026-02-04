# tooling Specification

## Purpose
TBD - created by archiving change add-linting-tooling. Update Purpose after archive.
## Requirements
### Requirement: Linting and formatting workflows
The system SHALL provide Biome-based linting and formatting scripts and a fix workflow that runs Biome check --write --unsafe.

#### Scenario: Developer runs lint
- **WHEN** a developer runs the lint script
- **THEN** Biome analyzes project files and reports lint issues

#### Scenario: Developer runs format
- **WHEN** a developer runs the format script
- **THEN** Biome formats project files according to the configured style

#### Scenario: Developer runs fix
- **WHEN** a developer runs the fix script
- **THEN** Biome applies fixes using iome check --write --unsafe

### Requirement: Typecheck workflow
The system SHALL provide a tsgo-based typecheck script.

#### Scenario: Developer runs typecheck
- **WHEN** a developer runs the typecheck script
- **THEN** tsgo validates types without emitting build artifacts

### Requirement: Git hook automation
The system SHALL run linting and fixing on staged files at pre-commit and full typecheck on pre-push via Lefthook.

#### Scenario: Pre-commit hook
- **WHEN** a developer commits changes
- **THEN** Lefthook runs lint/fix on staged files before the commit proceeds

#### Scenario: Pre-push hook
- **WHEN** a developer pushes changes
- **THEN** Lefthook runs a full typecheck before the push proceeds

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
