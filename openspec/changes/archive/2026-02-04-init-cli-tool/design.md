# Design: CLI Tool Architecture

## Context

This is a greenfield CLI tool that processes documents using Amazon Textract. The tool needs to handle file I/O, API calls to AWS, and document generation in multiple formats.

## Goals / Non-Goals

### Goals

- Simple, single-command CLI interface
- Clean separation between IO adapters, parsing, and transformation logic
- Easy to test with mocks/fixtures
- Support for Word and Excel output formats

### Non-Goals

- GUI or web interface
- Real-time processing or streaming
- Multiple input file batch processing (future enhancement)
- Custom document templates

## Architecture

```
src/
├── index.ts           # CLI entry point
├── cli/
│   └── parseArgs.ts   # Commander.js configuration
├── utils/
│   ├── textract.ts    # Amazon Textract client
│   ├── exportWord.ts  # DOCX generation
│   └── exportExcel.ts # XLSX generation
└── types/
    └── index.ts       # Shared type definitions
```

## Decisions

### Decision: Use Commander.js for CLI parsing

Commander.js is the de-facto standard for Node.js CLI applications with excellent TypeScript support, 193 documented code examples, and a high reputation score.

**Alternatives considered:**

- `yargs` - More complex API, less intuitive for simple CLIs
- `minimist` - Too low-level, no built-in help generation
- `clipanion` - Smaller community, less documentation

### Decision: Separate utility modules

Each major concern (API client, Word export, Excel export) gets its own module file to maintain single responsibility and ease testing.

**Alternatives considered:**

- Single monolithic module - Harder to test and maintain
- Class-based architecture - Unnecessary complexity for stateless operations

### Decision: Environment variables for credentials

AWS credentials and region are passed via environment variables following AWS conventions.

**Alternatives considered:**

- Config file - Adds complexity, credentials shouldn't be in files
- CLI arguments - Tedious to type every time, credentials in shell history

## Data Flow

```
Input File → Read Bytes
    ↓
Textract API → Analyze Document (tables/forms)
    ↓
Parse Response → Extract Structure (lines, tables, forms)
    ↓
Format Selection → Word / Excel Exporter
    ↓
Output File → Same name, new extension
```

## Risks / Trade-offs

| Risk                           | Mitigation                                                     |
| ------------------------------ | -------------------------------------------------------------- |
| Large files may timeout on API | Textract has async APIs for large documents                    |
| API costs for high volume      | Usage is per-page, pricing is documented in AWS console        |
| Network errors                 | Add retry logic with exponential backoff                       |

## Migration Plan

N/A - Greenfield project.

## Open Questions

- Should we support PDF input as well? (Document AI supports it)
- Should batch processing of multiple files be added later?
