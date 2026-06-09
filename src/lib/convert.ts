import type {
	ConvertBatchResult,
	ConvertOptions,
	ConvertOutput,
	ConvertResult,
	LayoutResponse,
	OutputFormat,
} from '../types'
import { exportToExcel } from '../utils/exportExcel'
import { exportToWord } from '../utils/exportWord'
import { processDocument } from '../utils/textract'
import { normalizeFormat } from './format'
import { resolveOutputPath } from './outputPath'

const exportLayout = async (
	format: OutputFormat,
	layout: LayoutResponse,
	outputPath: string
): Promise<void> => {
	if (format === 'word') {
		await exportToWord(layout, outputPath)
		return
	}

	await exportToExcel(layout, outputPath)
}

export const convertFileToFormats = async (
	inputPath: string,
	formats: OutputFormat[],
	outputDir?: string
): Promise<ConvertBatchResult> => {
	const layout = await processDocument(inputPath)
	const outputs: ConvertOutput[] = []

	for (const format of formats) {
		const outputPath = await resolveOutputPath({
			inputPath,
			format,
			outputDir,
		})
		await exportLayout(format, layout, outputPath)
		outputs.push({ outputPath, format })
	}

	return {
		inputPath,
		outputs,
		pageCount: layout.pageCount,
		sourceBytes: layout.textract.sourceBytes,
		textract: layout.textract,
	}
}

export const convertFile = async (
	options: ConvertOptions
): Promise<ConvertResult> => {
	const format: OutputFormat = normalizeFormat(options.format)
	const result = await convertFileToFormats(
		options.inputPath,
		[format],
		options.outputDir
	)
	const output = result.outputs[0]
	if (!output) {
		throw new Error('No output was generated')
	}

	return {
		...output,
		pageCount: result.pageCount,
		sourceBytes: result.sourceBytes,
		textract: result.textract,
	}
}
