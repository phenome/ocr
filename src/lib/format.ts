import type { OutputFormat } from '../types'

export const isOutputFormat = (value: string): value is OutputFormat =>
	value === 'word' || value === 'excel'

export const normalizeFormat = (value: string): OutputFormat => {
	const normalized = value.toLowerCase()
	if (isOutputFormat(normalized)) {
		return normalized
	}

	throw new Error('Invalid format. Use "word" or "excel".')
}

export const getOutputExtension = (format: OutputFormat): string =>
	format === 'word' ? '.docx' : '.xlsx'
