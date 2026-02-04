import { Command } from 'commander'
import { normalizeFormat } from '../lib/format'
import type { CliArgs, OutputFormat } from '../types'

const configureProgram = (
	program: Command,
	onConvert?: (input: string, cmd: Command) => void,
	onWatch?: (cmd: Command) => void
) => {
	program
		.name('ocr')
		.description('Process documents with Amazon Textract')
		.showHelpAfterError()
		.action(() => {
			program.outputHelp()
		})

	const convertCommand = program
		.command('convert')
		.description('Convert a single document')
		.requiredOption('--format <format>', 'Output format (word|excel)')
		.option('--output <dir>', 'Output directory')
		.argument('<input>', 'Input file path')
		.exitOverride()

	const watchCommand = program
		.command('watch')
		.description('Watch folders for new documents')
		.option('--word <dir>', 'Folder for Word output')
		.option('--excel <dir>', 'Folder for Excel output')
		.exitOverride()

	if (onConvert) {
		convertCommand.action(onConvert)
	}
	if (onWatch) {
		watchCommand.action((_, cmd) => onWatch(cmd))
	}
}

export const buildProgram = () => {
	const program = new Command()
	configureProgram(program)
	return program
}

export const parseArgs = (argv: string[]): CliArgs | null => {
	const program = new Command()
	let parsed: CliArgs | null = null

	configureProgram(
		program,
		(input, cmd) => {
			const options = cmd.opts() as { format: string; output?: string }
			const inputPath = input
			if (!inputPath) {
				cmd.error('Input file path is required.')
			}

			let format: OutputFormat
			try {
				format = normalizeFormat(options.format)
			} catch (error) {
				cmd.error(error instanceof Error ? error.message : 'Invalid format')
				return
			}

			parsed = {
				command: 'convert',
				inputPath,
				format,
				outputDir: options.output,
			}
		},
		(cmd) => {
			const options = cmd.opts() as { word?: string; excel?: string }
			if (!options.word && !options.excel) {
				cmd.error('At least one of --word or --excel is required.')
			}
			parsed = {
				command: 'watch',
				wordDir: options.word,
				excelDir: options.excel,
			}
		}
	)

	program.parse(argv)
	return parsed
}
