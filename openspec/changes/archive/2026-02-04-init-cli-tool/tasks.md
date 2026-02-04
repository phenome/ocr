# Tasks: Initialize CLI Tool

## 1. Project Setup

- [x] 1.1 Install dependencies with `bun add commander docx exceljs @aws-sdk/client-textract`
- [x] 1.2 Create directory structure: `src/cli/`, `src/utils/`, `src/types/`

## 2. Type Definitions

- [x] 2.1 Create `src/types/index.ts` with shared types for Textract response and output formats

## 3. CLI Argument Parsing

- [x] 3.1 Create `src/cli/parseArgs.ts` with Commander.js configuration
- [x] 3.2 Define `--format` option (word/excel, required)
- [x] 3.3 Define `<input>` argument (file path, required)
- [x] 3.4 Define `--output` option (folder path, optional, defaults to input file directory)
- [x] 3.5 Add help text and version info

## 4. Textract Integration

- [x] 4.1 Create `src/utils/textract.ts` with client initialization
- [x] 4.2 Implement `processDocument(filePath: string)` function
- [x] 4.3 Handle environment variable validation (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
- [x] 4.4 Return parsed layout JSON response
- [x] 4.5 Add S3-based PDF processing using `StartDocumentAnalysis`

## 5. Word Export

- [x] 5.1 Create `src/utils/exportWord.ts`
- [x] 5.2 Implement `exportToWord(layout: LayoutResponse, outputPath: string)` function
- [x] 5.3 Map layout elements to DOCX components (Paragraphs, Tables, TextRuns)

## 6. Excel Export

- [x] 6.1 Create `src/utils/exportExcel.ts`
- [x] 6.2 Implement `exportToExcel(layout: LayoutResponse, outputPath: string)` function
- [x] 6.3 Map layout elements to Workbook sheets and cells

## 7. CLI Entry Point

- [x] 7.1 Update `src/index.ts` as CLI entry point
- [x] 7.2 Wire up argument parsing, processing, and export
- [x] 7.3 Generate output filename (same name, different extension)
- [x] 7.4 Add error handling and user feedback

## 8. Package Configuration

- [x] 8.1 Add `bin` field to `package.json` for CLI executable
- [x] 8.2 Add `start` script for running the CLI

## 9. Validation

- [ ] 9.1 Test CLI with sample document
- [ ] 9.2 Verify Word output generation
- [ ] 9.3 Verify Excel output generation
