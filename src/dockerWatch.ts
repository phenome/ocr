#!/usr/bin/env bun
import { watchFolders } from './lib'

const watchDocx = (process.env.WATCH_DOCX ?? '').trim()
const watchXlsx = (process.env.WATCH_XLSX ?? '').trim()

const requiredAwsEnvVars = [
	'AWS_ACCESS_KEY_ID',
	'AWS_SECRET_ACCESS_KEY',
	'AWS_REGION',
	'AWS_TEXTRACT_S3_BUCKET',
]

const missingAws = requiredAwsEnvVars.filter((key) => {
	const value = process.env[key]
	return !value || value.trim().length === 0
})

if (missingAws.length > 0) {
	console.error(
		`Missing required AWS environment variables: ${missingAws.join(', ')}`
	)
	process.exit(1)
}

if (!watchDocx && !watchXlsx) {
	console.error('WATCH_DOCX or WATCH_XLSX must be set.')
	process.exit(1)
}

if (watchDocx) {
	console.log(`watching for files to convert to DOCX in folder ${watchDocx}`)
}

if (watchXlsx) {
	console.log(`watching for files to convert to XLSX in folder ${watchXlsx}`)
}

const listFormats = (formats?: string[]): string =>
	formats?.length ? formats.join('+') : 'unknown'

const formatBytes = (bytes?: number): string =>
	bytes === undefined ? 'unknown bytes' : `${bytes} bytes`

const describeOutputs = (
	outputs?: Array<{ format: string; outputPath: string }>,
	outputPath?: string
): string => {
	if (outputs?.length) {
		return outputs
			.map((output) => `${output.format}:${output.outputPath}`)
			.join(', ')
	}
	return outputPath ?? 'unknown output'
}

const watcher = await watchFolders({
	wordDir: watchDocx || undefined,
	excelDir: watchXlsx || undefined,
	onEvent: (event) => {
		if (event.type === 'start') {
			console.log(
				`Processing ${event.inputPath} formats=${listFormats(event.formats)}`
			)
			return
		}
		if (event.type === 'skip') {
			console.log(
				`Skipped ${event.inputPath} formats=${listFormats(event.formats)} reason=outputs-current`
			)
			return
		}
		if (event.type === 'success') {
			const textract = event.textract
			console.log(
				`Processed ${event.inputPath} -> ${describeOutputs(event.outputs, event.outputPath)} pages=${event.pageCount ?? 0} source=${formatBytes(event.sourceBytes)} textractMode=${textract?.mode ?? 'unknown'} polls=${textract?.pollCount ?? 0} resultPages=${textract?.resultPageCount ?? 0} jobId=${textract?.jobId ?? 'none'} s3=${textract?.s3Bucket && textract.s3Key ? `${textract.s3Bucket}/${textract.s3Key}` : 'none'} requestId=${textract?.requestId ?? 'unknown'}`
			)
			return
		}
		console.error(
			`Failed ${event.inputPath} formats=${listFormats(event.formats)}: ${event.error?.message ?? 'Unknown error'}`
		)
	},
})

const shutdown = () => {
	watcher.close()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
