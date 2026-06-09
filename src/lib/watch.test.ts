import { afterEach, describe, expect, mock, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { ConvertBatchResult, OutputFormat, WatchEvent } from '../types'

const conversions: Array<{ inputPath: string; formats: OutputFormat[] }> = []

mock.module('./convert', () => ({
	convertFileToFormats: async (
		inputPath: string,
		formats: OutputFormat[]
	): Promise<ConvertBatchResult> => {
		conversions.push({ inputPath, formats })
		return {
			inputPath,
			outputs: formats.map((format) => ({
				format,
				outputPath: path.join(
					path.dirname(inputPath),
					`${path.parse(inputPath).name}.${format === 'word' ? 'docx' : 'xlsx'}`
				),
			})),
			pageCount: 2,
			sourceBytes: 4,
			textract: {
				mode: 'async',
				pageCount: 2,
				sourceBytes: 4,
				pollCount: 3,
				resultPageCount: 1,
				jobId: 'job-1',
			},
		}
	},
}))

// Dynamic import is required here so Bun applies the module mock before watch.ts loads convert.ts.
const { watchFolders } = await import('./watch')

afterEach(() => {
	conversions.length = 0
})

const waitForEvent = async (
	events: WatchEvent[],
	type: WatchEvent['type']
): Promise<void> => {
	const deadline = Date.now() + 5000
	while (Date.now() < deadline) {
		if (events.some((event) => event.type === type)) {
			return
		}
		await new Promise((resolve) => setTimeout(resolve, 50))
	}
	throw new Error(`Timed out waiting for ${type} event`)
}

describe('watchFolders', () => {
	test('runs Textract once when word and excel watch the same folder', async () => {
		const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ocr-watch-'))
		try {
			const events: WatchEvent[] = []
			const watcher = await watchFolders({
				wordDir: tempDir,
				excelDir: tempDir,
				debounceMs: 10,
				onEvent: (event) => events.push(event),
			})
			try {
				const inputPath = path.join(tempDir, 'report.pdf')
				await writeFile(inputPath, 'data')

				await waitForEvent(events, 'success')

				expect(conversions).toEqual([{ inputPath, formats: ['word', 'excel'] }])
			} finally {
				watcher.close()
			}
		} finally {
			await rm(tempDir, { recursive: true, force: true })
		}
	})

	test('skips files whose output is already current', async () => {
		const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ocr-watch-'))
		try {
			const inputPath = path.join(tempDir, 'report.pdf')
			const outputPath = path.join(tempDir, 'report.xlsx')
			await writeFile(inputPath, 'data')
			await writeFile(outputPath, 'current')

			const events: WatchEvent[] = []
			const watcher = await watchFolders({
				excelDir: tempDir,
				debounceMs: 10,
				onEvent: (event) => events.push(event),
			})
			try {
				await writeFile(inputPath, 'data')
				await writeFile(outputPath, 'current')

				await waitForEvent(events, 'skip')

				expect(conversions).toEqual([])
			} finally {
				watcher.close()
			}
		} finally {
			await rm(tempDir, { recursive: true, force: true })
		}
	})
})
