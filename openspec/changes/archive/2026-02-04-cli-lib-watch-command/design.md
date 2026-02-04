## Context

The CLI currently performs one-off conversions and owns the conversion orchestration. There is no stable programmatic API for reuse, and no watch-mode for ongoing ingestion. The change introduces a library boundary and a watch command that continuously processes new Word and Excel files.

## Goals / Non-Goals

**Goals:**
- Provide a library API that encapsulates conversion orchestration and is used by the CLI.
- Add a CLI watch command that monitors two folders (Word and Excel) and converts new files immediately.
- Ensure output naming avoids collisions by appending numbered suffixes.
- Emit structured, consistent logging for processing and errors.

**Non-Goals:**
- Implement a new conversion engine or alternative to Textract.
- Add new document formats beyond Word and Excel.
- Provide a long-running service or daemon outside the CLI process.

## Decisions

- **Create a library entry point in src/**: Expose a small API (e.g., `convertFile`, `watchFolders`) that wraps existing conversion pipeline steps. This keeps CLI logic thin and enables future programmatic usage.
  - *Alternative considered:* Keep CLI logic and export internal functions ad-hoc. Rejected to avoid unstable/undocumented API surface.
- **Use the library from the CLI**: CLI subcommands call the library to keep behavior consistent and reduce duplication.
  - *Alternative considered:* Duplicate logic in the new watch command. Rejected due to drift risk and maintenance cost.
- **File watching approach**: Use Node/Bun compatible file watching with recursive detection on the two input folders and a simple queue per folder to avoid concurrent processing of the same file.
  - *Alternative considered:* Polling-based approach. Rejected for slower detection and extra IO.
- **Output naming**: Resolve collisions by appending ` (1)`, ` (2)`, etc. before the file extension, ensuring deterministic naming within the same folder.

## Risks / Trade-offs

- **Watchers can be noisy on large folders** → Mitigation: ignore temporary/hidden files and debounce rapid events before conversion.
- **Library API surface may need revision** → Mitigation: keep API minimal and focused on current CLI use cases.
- **Concurrent updates to the same file** → Mitigation: process only on stable writes (e.g., delay conversion briefly after a change event).
