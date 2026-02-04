export type OutputFormat = 'word' | 'excel'

export type LayoutTable = {
	rows: string[][]
}

export type LayoutResponse = {
	paragraphs: string[]
	tables: LayoutTable[]
}

export type ConvertCliArgs = {
	command: 'convert'
	inputPath: string
	format: OutputFormat
	outputDir?: string
}

export type WatchCliArgs = {
	command: 'watch'
	wordDir?: string
	excelDir?: string
}

export type CliArgs = ConvertCliArgs | WatchCliArgs

export type ConvertOptions = {
	inputPath: string
	format: OutputFormat | string
	outputDir?: string
}

export type ConvertResult = {
	outputPath: string
	format: OutputFormat
}

export type WatchEvent = {
	type: 'start' | 'success' | 'error'
	inputPath: string
	outputPath?: string
	error?: Error
}

export type WatchOptions = {
	wordDir?: string
	excelDir?: string
	debounceMs?: number
	onEvent: (event: WatchEvent) => void
}

export type WatchHandle = {
	close: () => void
}
