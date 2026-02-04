## Context

The service already provides a watch mode via the CLI and library. We need a container-friendly entrypoint that only runs watch mode and a CI workflow to publish the image to Docker Hub on `main`.

## Goals / Non-Goals

**Goals:**
- Provide a Docker image that runs the watch workflow configured via environment variables.
- Ensure the image can be built locally with a standard npm script.
- Publish Docker images automatically on pushes to `main` using standard GitHub Actions.

**Non-Goals:**
- Changing the core conversion logic or watch behavior.
- Adding new CLI flags or user-facing commands beyond the container entrypoint.
- Supporting registries other than Docker Hub in this change.

## Decisions

- **Use a dedicated `dockerWatch` entrypoint** to read `WATCH_DOCX` and `WATCH_XLSX` and invoke `watchFolders`.
  - *Alternative*: reuse CLI `watch` command with env parsing. Rejected to keep the container entrypoint simple and avoid CLI argument parsing in Docker runs.
- **Base the image on `oven/bun`** to match the runtime used locally.
  - *Alternative*: compile to a single binary. Rejected for now to keep the image build minimal and aligned with existing tooling.
- **Use official Docker GitHub Actions** (`setup-buildx`, `login`, `metadata`, `build-push`) for CI publishing.
  - *Alternative*: custom shell scripts. Rejected to reduce maintenance and follow standard practices.

## Risks / Trade-offs

- **[Misconfigured env vars]** → If neither `WATCH_DOCX` nor `WATCH_XLSX` is set, the container will exit immediately. *Mitigation*: fail fast with a clear error message.
- **[Path access in containers]** → Watch folders must be mounted into the container. *Mitigation*: document required volume mounts outside this change.

## Migration Plan

No migration required. New image and workflow are additive.
