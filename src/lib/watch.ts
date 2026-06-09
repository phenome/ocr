import { watch } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import type {
	OutputFormat,
	WatchEvent,
	WatchHandle,
	WatchOptions,
} from '../types'
import { supportedInputExtensions } from '../utils/textract'
import { convertFileToFormats } from './convert'
import { getDefaultOutputPath } from './outputPath'

type FolderQueue = {
	enqueue: (filePath: string) => void
	close: () => void
}

const getFilename = (filename: string | Buffer | null): string | null => {
	if (!filename) {
		return null
	}

	return typeof filename === 'string' ? filename : filename.toString()
}

const isIgnoredFile = (filename: string): boolean => {
	const base = path.basename(filename)
	return (
		base.startsWith('.') ||
		base.startsWith('~') ||
		base.endsWith('~') ||
		base.endsWith('.tmp') ||
		base.endsWith('.swp')
	)
}

const isSupportedInput = (filePath: string): boolean => {
	const extension = path.extname(filePath).toLowerCase()
	return supportedInputExtensions.has(extension)
}

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

const isOutputFresh = async (
	inputPath: string,
	format: OutputFormat
): Promise<boolean> => {
	const outputPath = getDefaultOutputPath({ inputPath, format })
	try {
		const [inputStats, outputStats] = await Promise.all([
			stat(inputPath),
			stat(outputPath),
		])
		return outputStats.mtimeMs >= inputStats.mtimeMs
	} catch {
		return false
	}
}

const getStaleFormats = async (
	inputPath: string,
	formats: OutputFormat[]
): Promise<OutputFormat[]> => {
	const stale: OutputFormat[] = []
	for (const format of formats) {
		if (!(await isOutputFresh(inputPath, format))) {
			stale.push(format)
		}
	}
	return stale
}

const waitForStableFile = async (
	filePath: string,
	stableIntervalMs = 1000,
	maxWaitMs = 60000
): Promise<void> => {
	let lastSize = -1
	let lastMtimeMs = -1
	let stableChecks = 0
	const deadline = Date.now() + maxWaitMs

	while (Date.now() <= deadline) {
		try {
			const fileStats = await stat(filePath)
			if (
				fileStats.size > 0 &&
				fileStats.size === lastSize &&
				fileStats.mtimeMs === lastMtimeMs
			) {
				stableChecks += 1
				if (stableChecks >= 2) {
					return
				}
			} else {
				stableChecks = 0
				lastSize = fileStats.size
				lastMtimeMs = fileStats.mtimeMs
			}
		} catch {
			stableChecks = 0
		}

		await sleep(stableIntervalMs)
	}

	throw new Error(`File was not stable after ${maxWaitMs}ms: ${filePath}`)
}

const createQueue = (
	formats: OutputFormat[],
	onEvent: (event: WatchEvent) => void
): FolderQueue => {
	const queue: string[] = []
	const pending = new Set<string>()
	let running = false
	let closed = false

	const runNext = async () => {
		if (running || closed) {
			return
		}

		const next = queue.shift()
		if (!next) {
			return
		}

		running = true
		try {
			await waitForStableFile(next)
			const staleFormats = await getStaleFormats(next, formats)
			if (staleFormats.length === 0) {
				onEvent({ type: 'skip', inputPath: next, formats })
				return
			}

			onEvent({ type: 'start', inputPath: next, formats: staleFormats })
			const result = await convertFileToFormats(next, staleFormats)
			onEvent({
				type: 'success',
				inputPath: next,
				formats: staleFormats,
				outputPath: result.outputs[0]?.outputPath,
				outputs: result.outputs,
				pageCount: result.pageCount,
				sourceBytes: result.sourceBytes,
				textract: result.textract,
			})
		} catch (error) {
			onEvent({
				type: 'error',
				inputPath: next,
				formats,
				error: error instanceof Error ? error : new Error('Unknown error'),
			})
		} finally {
			pending.delete(next)
			running = false
			await runNext()
		}
	}

	return {
		enqueue: (filePath: string) => {
			if (closed || pending.has(filePath)) {
				return
			}
			pending.add(filePath)
			queue.push(filePath)
			void runNext()
		},
		close: () => {
			closed = true
			queue.length = 0
			pending.clear()
		},
	}
}

export const watchFolders = async (
	options: WatchOptions
): Promise<WatchHandle> => {
	if (!options.wordDir && !options.excelDir) {
		throw new Error('At least one watch folder is required.')
	}

	const debounceMs = options.debounceMs ?? 500
	const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

	const watchers = [] as Array<{
		close: () => void
	}>

	const schedule = (
		folderPath: string,
		queue: FolderQueue,
		filename: string | Buffer | null
	) => {
		const name = getFilename(filename)
		if (!name || isIgnoredFile(name)) {
			return
		}

		const fullPath = path.join(folderPath, name)
		if (!isSupportedInput(fullPath)) {
			return
		}

		const existing = debounceTimers.get(fullPath)
		if (existing) {
			clearTimeout(existing)
		}

		debounceTimers.set(
			fullPath,
			setTimeout(() => {
				debounceTimers.delete(fullPath)
				queue.enqueue(fullPath)
			}, debounceMs)
		)
	}

	const addWatcher = (folderPath: string, formats: OutputFormat[]) => {
		const queue = createQueue(formats, options.onEvent)
		const folderWatcher = watch(folderPath, (eventType, filename) => {
			if (eventType === 'rename' || eventType === 'change') {
				schedule(folderPath, queue, filename)
			}
		})
		folderWatcher.on('error', (error) => {
			options.onEvent({
				type: 'error',
				inputPath: folderPath,
				formats,
				error: error instanceof Error ? error : new Error('Watcher error'),
			})
		})
		watchers.push(folderWatcher, queue)
	}

	const wordDir = options.wordDir ? path.resolve(options.wordDir) : undefined
	const excelDir = options.excelDir ? path.resolve(options.excelDir) : undefined

	if (options.wordDir && options.excelDir && wordDir === excelDir) {
		addWatcher(options.wordDir, ['word', 'excel'])
	} else {
		if (options.wordDir) {
			addWatcher(options.wordDir, ['word'])
		}
		if (options.excelDir) {
			addWatcher(options.excelDir, ['excel'])
		}
	}

	return {
		close: () => {
			for (const watcher of watchers) {
				watcher.close()
			}
			for (const timer of debounceTimers.values()) {
				clearTimeout(timer)
			}
			debounceTimers.clear()
		},
	}
}
