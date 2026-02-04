export type OutputFormat = 'word' | 'excel'

export type LayoutTable = {
	rows: string[][]
}

export type LayoutResponse = {
	paragraphs: string[]
	tables: LayoutTable[]
}

export type CliArgs = {
	inputPath: string
	format: OutputFormat
	outputDir?: string
}
