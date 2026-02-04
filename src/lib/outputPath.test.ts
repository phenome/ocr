import { describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { resolveOutputPath } from './outputPath'

describe('resolveOutputPath', () => {
	test('appends suffix when name is taken', async () => {
		const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ocr-output-'))
		try {
			const inputPath = path.join(tempDir, 'report.pdf')
			await writeFile(inputPath, 'source')

			const existing = path.join(tempDir, 'report.docx')
			const existingOne = path.join(tempDir, 'report (1).docx')
			await writeFile(existing, 'existing')
			await writeFile(existingOne, 'existing')

			const resolved = await resolveOutputPath({
				inputPath,
				format: 'word',
			})

			expect(resolved).toBe(path.join(tempDir, 'report (2).docx'))
		} finally {
			await rm(tempDir, { recursive: true, force: true })
		}
	})
})
