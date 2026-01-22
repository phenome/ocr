# Change: Add linting, formatting, and typecheck automation

## Why
The project lacks standardized linting, formatting, and typechecking workflows, which makes code quality inconsistent and allows regressions to slip into commits.

## What Changes
- Add Biome configuration and scripts for linting and formatting (including a iome check --write --unsafe fix workflow)
- Add tsgo typecheck script wired for CI and pre-push
- Add Lefthook to run staged-file lint/fix on pre-commit and full typecheck on pre-push

## Impact
- Affected specs: tooling
- Affected code: package.json, biome.json, lefthook.yml