# Change: Initialize CLI Tool

## Why

The project needs a command-line interface to process documents using Amazon Textract. Users should be able to easily convert documents from various input formats to structured Word or Excel outputs.

## What Changes

- Add CLI entry point using Commander.js for argument parsing
- Add output format selection (word/excel)
- Add file input handling with validation
- Add optional output folder configuration
- Integrate Amazon Textract for document processing
- Add document export utilities for DOCX and XLSX generation

## Impact

- Affected specs: `cli` (new capability)
- Affected code: `src/cli/`, `src/utils/`, `src/index.ts`
- New dependencies: `commander`, `docx`, `exceljs`, `@aws-sdk/client-textract`

## Dependencies & Environment

### Required Dependencies

| Package                     | Purpose                   |
| --------------------------- | ------------------------- |
| `commander`                 | CLI argument parsing      |
| `docx`                      | Word document generation  |
| `exceljs`                   | Excel workbook generation |
| `@aws-sdk/client-textract`  | Amazon Textract SDK       |

### Environment Variables

| Variable                  | Description                          | Required |
| ------------------------- | ------------------------------------ | -------- |
| `AWS_ACCESS_KEY_ID`       | AWS access key                       | Yes      |
| `AWS_SECRET_ACCESS_KEY`   | AWS secret access key                | Yes      |
| `AWS_REGION`              | AWS region for Textract              | Yes      |
| `AWS_TEXTRACT_S3_BUCKET`  | S3 bucket for PDF processing         | Yes      |
| `AWS_SESSION_TOKEN`       | AWS session token (if using STS)     | No       |

## Technical Notes

- Uses Amazon Textract `AnalyzeDocument` for images and `StartDocumentAnalysis` for PDFs
- Input documents are read as bytes before sending to the API
- Output JSON from Textract contains structured layout information (lines, tables, forms)
- DOCX generation uses the `docx` library with Paragraph, Table, and TextRun elements
- XLSX generation uses the `exceljs` library with Workbook and Worksheet APIs
