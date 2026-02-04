import { describe, expect, test } from 'bun:test'
import { parseArgs } from './parseArgs'

describe('parseArgs', () => {
	test('parses watch command', () => {
		const args = parseArgs([
			'bun',
			'ocr',
			'watch',
			'--word',
			'/tmp/word',
			'--excel',
			'/tmp/excel',
		])

		expect(args).toMatchObject({
			command: 'watch',
			wordDir: '/tmp/word',
			excelDir: '/tmp/excel',
		})
	})

	test('requires watch folders', () => {
		expect(() => parseArgs(['bun', 'ocr', 'watch'])).toThrow()
	})

	test('accepts only one watch folder', () => {
		const args = parseArgs(['bun', 'ocr', 'watch', '--word', '/tmp/word'])

		expect(args).toMatchObject({
			command: 'watch',
			wordDir: '/tmp/word',
		})
	})
})
