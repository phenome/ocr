# Project Context

## Purpose
Greenfield service that ingests documents (Word or Excel), uses Google Document AI layout parsing, and outputs transformed documents in Word or Excel formats.

## Tech Stack
- Bun runtime
- TypeScript
- Google Cloud Document AI (Layout Parser / layout parse chunk)
- Google Cloud SDKs for Document AI

## Project Conventions

### Code Style
- TypeScript with native-preview (tsgo) for type checks
- Biome for formatting and linting
- Formatting: ES5-style commas, no semicolons, single quotes
- Prefer small, composable modules; avoid framework-heavy abstractions
- Naming: `camelCase` for vars/functions, `PascalCase` for types/classes, `camelCase` for files

### Architecture Patterns
- Pipeline: ingest → parse layout → transform → export
- Clear separation between IO adapters (Word/Excel), parsing, and transformation logic

### Testing Strategy
- Bun test runner for unit and integration tests
- Integration tests against sample documents and Document AI mocks/snapshots
- Unit test files are colocated with the file under test

### Git Workflow
- Trunk-based development with short-lived branches
- Conventional Commits
- Continuous integration on `main`

## Domain Context
- Input documents: Word (.docx) and Excel (.xlsx)
- Output documents: Word and Excel
- Core capability: preserve layout semantics while converting between formats

## Important Constraints
- Must use Google Document AI Layout Parser
- Leverage Bun + TypeScript throughout the stack

## External Dependencies
- Google Cloud Document AI (Layout Parser)
