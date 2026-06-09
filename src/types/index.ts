export type OutputFormat = 'word' | 'excel'

export type LayoutTable = {
	rows: string[][]
}

export type TextractMetadata = {
	mode: 'sync' | 'async'
	pageCount: number
	sourceBytes: number
	pollCount: number
	resultPageCount: number
	requestId?: string
	s3Bucket?: string
	s3Key?: string
	jobId?: string
}

export type LayoutResponse = {
	paragraphs: string[]
	tables: LayoutTable[]
	pageCount: number
	textract: TextractMetadata
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

export type ConvertOutput = {
	outputPath: string
	format: OutputFormat
}

export type ConvertResult = ConvertOutput & {
	pageCount: number
	sourceBytes: number
	textract: TextractMetadata
}

export type ConvertBatchResult = {
	inputPath: string
	outputs: ConvertOutput[]
	pageCount: number
	sourceBytes: number
	textract: TextractMetadata
}

export type WatchEvent = {
	type: 'start' | 'success' | 'skip' | 'error'
	inputPath: string
	formats?: OutputFormat[]
	outputPath?: string
	outputs?: ConvertOutput[]
	pageCount?: number
	sourceBytes?: number
	textract?: TextractMetadata
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
