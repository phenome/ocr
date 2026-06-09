#!/usr/bin/env bun
import { buildProgram, parseArgs } from './cli/parseArgs'
import { convertFile, watchFolders } from './lib'

const listFormats = (formats?: string[]): string =>
	formats?.length ? formats.join('+') : 'unknown'

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

const run = async () => {
	try {
		const args = parseArgs(process.argv)
		if (!args) {
			return
		}
		if (args.command === 'watch') {
			const watcher = await watchFolders({
				wordDir: args.wordDir,
				excelDir: args.excelDir,
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
						console.log(
							`Processed ${event.inputPath} -> ${describeOutputs(event.outputs, event.outputPath)} pages=${event.pageCount ?? 0}`
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
			return
		}

		const result = await convertFile({
			inputPath: args.inputPath,
			format: args.format,
			outputDir: args.outputDir,
		})
		const label = result.format === 'word' ? 'Word document' : 'Excel workbook'
		console.log(
			`${label} saved to ${result.outputPath} pages=${result.pageCount} textractMode=${result.textract.mode}`
		)
	} catch (error) {
		if (error instanceof Error) {
			if (error.name === 'CommanderError') {
				return
			}
			const metadata = (
				error as { $metadata?: { requestId?: string; httpStatusCode?: number } }
			).$metadata
			const details: string[] = []
			if (error.name && error.name !== 'Error') {
				details.push(error.name)
			}
			if (metadata?.httpStatusCode) {
				details.push(`HTTP ${metadata.httpStatusCode}`)
			}
			if (metadata?.requestId) {
				details.push(`RequestId ${metadata.requestId}`)
			}
			const suffix = details.length > 0 ? ` (${details.join(', ')})` : ''
			console.error(`${error.message}${suffix}`)
		} else {
			console.error('Unknown error')
		}
		process.exitCode = 1
	}
}

await run()
