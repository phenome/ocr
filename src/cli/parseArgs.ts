import { Command } from 'commander'
import type { CliArgs, OutputFormat } from '../types'

const supportedFormats: OutputFormat[] = ['word', 'excel']

export const parseArgs = (argv: string[]): CliArgs => {
	const program = new Command()

	program
		.name('ocr')
		.description('Process documents with Amazon Textract')
		.requiredOption('--format <format>', 'Output format (word|excel)')
		.option('--output <dir>', 'Output directory')
		.argument('<input>', 'Input file path')
		.parse(argv)

	const options = program.opts<{ format: string; output?: string }>()
	const format = options.format?.toLowerCase() as OutputFormat

	if (!supportedFormats.includes(format)) {
		throw new Error('Invalid format. Use "word" or "excel".')
	}

	const inputPath = program.args[0]
	if (!inputPath) {
		throw new Error('Input file path is required.')
	}

	return {
		inputPath,
		format,
		outputDir: options.output,
	}
}
