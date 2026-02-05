# OCR

OCR converts PDF and image files to Word (DOCX) or Excel (XLSX) using **AWS Textract**. It watches folders, processes new documents, and writes the results back to disk.

This repo is public. The recommended way to run it is the published Docker image: `phenome/ocr`.

## AWS Textract setup (required)

OCR uses AWS Textract for document analysis. You must configure AWS credentials first.

1. Create an S3 bucket in the same AWS region you will use for Textract.
2. Create IAM credentials with access to Textract and the S3 bucket.
3. Set the required environment variables (see below).

Textract requires S3 for **PDFs and any file larger than 5 MB**, so the bucket is required in those cases. For small images, Textract can run inline, but a bucket is still recommended.

## Docker (recommended)

The container runs the folder watcher and needs AWS credentials plus at least one watch path.

**Required environment variables**

| Name | Required | Notes |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | yes | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | yes | IAM secret key |
| `AWS_REGION` | yes | AWS region (e.g. `us-east-1`) |
| `AWS_TEXTRACT_S3_BUCKET` | yes | Required by the Docker watcher |
| `WATCH_DOCX` | at least one of these | Folder to watch for DOCX output |
| `WATCH_XLSX` | at least one of these | Folder to watch for XLSX output |

**Run with inline env vars**

```bash
docker run -d \
  --name ocr \
  --restart unless-stopped \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e AWS_REGION=us-east-1 \
  -e AWS_TEXTRACT_S3_BUCKET=my-textract-bucket \
  -e WATCH_DOCX=/data/docx \
  -e WATCH_XLSX=/data/xlsx \
  -v /absolute/path/to/docx:/data/docx \
  -v /absolute/path/to/xlsx:/data/xlsx \
  phenome/ocr
```

Drop input files into the watched folders. Output files are written next to the input files (same folder) with a `.docx` or `.xlsx` extension.

**Run with an env file**

Create an `.env` file:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_TEXTRACT_S3_BUCKET=my-textract-bucket
WATCH_DOCX=/data/docx
WATCH_XLSX=/data/xlsx
```

Then run:

```bash
docker run -d \
  --name ocr \
  --restart unless-stopped \
  --env-file /absolute/path/to/.env \
  -v /absolute/path/to/docx:/data/docx \
  -v /absolute/path/to/xlsx:/data/xlsx \
  phenome/ocr
```

## CLI

The CLI requires the same AWS environment variables. If you process PDFs or files larger than 5 MB, `AWS_TEXTRACT_S3_BUCKET` is required.

Convert a single file:

```bash
ocr convert --format word ./input.pdf
```

CLI watch mode:

```bash
ocr watch --word ./word --excel ./excel
```

Watch a single folder:

```bash
ocr watch --word ./word
```

## Library

The library requires the same AWS environment variables. If you process PDFs or files larger than 5 MB, `AWS_TEXTRACT_S3_BUCKET` is required.

```ts
import { convertFile, watchFolders } from './src/lib'

const result = await convertFile({
  inputPath: './docs/input.pdf',
  format: 'word',
})

await watchFolders({
  wordDir: './word',
  excelDir: './excel',
  onEvent: (event) => {
    if (event.type === 'success') {
      console.log(event.outputPath)
    }
  },
})
```

## Local development

Install dependencies:

```bash
bun install
```

Run locally:

```bash
bun run src/index.ts
```

Tooling:

```bash
bun run lint
bun run format
bun run fix
bun run typecheck
```
