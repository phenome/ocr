## Why

The current CLI only supports one-off conversions, which makes it hard to integrate into other tooling or automate batch processing. We need a reusable library API and a continuous watch mode to streamline ongoing document ingestion.

## What Changes

- Extract conversion logic into a reusable library API, and update the CLI to call it.
- Add a CLI command that watches two folders (Word and Excel) and converts new files as they appear.
- Add deterministic output naming with collision handling (" (1)", " (2)", etc.).
- Log processing progress and errors for watch-based conversions.

## Capabilities

### New Capabilities
- `conversion-lib`: Public library API for converting Word/Excel inputs via Textract and exporting to the requested format.

### Modified Capabilities
- `cli`: Add a watch command, folder inputs, and ensure CLI execution uses the library API.

## Impact

- CLI surface area expands with a new command and options.
- New library entry points and types in src/ for programmatic usage.
- Tests and documentation updates for CLI and library usage.
