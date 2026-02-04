#!/usr/bin/env bun
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from './cli/parseArgs'
import { exportToExcel } from './utils/exportExcel'
import { exportToWord } from './utils/exportWord'
import { processDocument } from './utils/textract'

const run = async () => {
	try {
		const { inputPath, format, outputDir } = parseArgs(process.argv)
		const layout = await processDocument(inputPath)
		const parsedPath = path.parse(inputPath)
		const outputExtension = format === 'word' ? '.docx' : '.xlsx'
		const targetDir = outputDir ?? parsedPath.dir

		if (outputDir) {
			await mkdir(outputDir, { recursive: true })
		}

		const outputPath = path.join(
			targetDir,
			`${parsedPath.name}${outputExtension}`
		)

		if (format === 'word') {
			await exportToWord(layout, outputPath)
			console.log(`Word document saved to ${outputPath}`)
			return
		}

		await exportToExcel(layout, outputPath)
		console.log(`Excel workbook saved to ${outputPath}`)
	} catch (error) {
		if (error instanceof Error) {
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
