#!/usr/bin/env bun
import { buildProgram, parseArgs } from './cli/parseArgs'
import { convertFile, watchFolders } from './lib'

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
						console.log(`Processing ${event.inputPath}`)
						return
					}
					if (event.type === 'success') {
						console.log(`Processed ${event.inputPath} -> ${event.outputPath}`)
						return
					}
					console.error(
						`Failed ${event.inputPath}: ${event.error?.message ?? 'Unknown error'}`
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
		console.log(`${label} saved to ${result.outputPath}`)
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
