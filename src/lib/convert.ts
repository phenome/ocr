import type { ConvertOptions, ConvertResult, OutputFormat } from '../types'
import { exportToExcel } from '../utils/exportExcel'
import { exportToWord } from '../utils/exportWord'
import { processDocument } from '../utils/textract'
import { normalizeFormat } from './format'
import { resolveOutputPath } from './outputPath'

export const convertFile = async (
	options: ConvertOptions
): Promise<ConvertResult> => {
	const format: OutputFormat = normalizeFormat(options.format)
	const outputPath = await resolveOutputPath({
		inputPath: options.inputPath,
		format,
		outputDir: options.outputDir,
	})
	const layout = await processDocument(options.inputPath)

	if (format === 'word') {
		await exportToWord(layout, outputPath)
		return { outputPath, format }
	}

	await exportToExcel(layout, outputPath)
	return { outputPath, format }
}
