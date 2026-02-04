import { watch } from 'node:fs'
import path from 'node:path'
import type {
	OutputFormat,
	WatchEvent,
	WatchHandle,
	WatchOptions,
} from '../types'
import { supportedInputExtensions } from '../utils/textract'
import { convertFile } from './convert'

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

const createQueue = (
	format: OutputFormat,
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
		onEvent({ type: 'start', inputPath: next })
		try {
			const { outputPath } = await convertFile({
				inputPath: next,
				format,
			})
			onEvent({ type: 'success', inputPath: next, outputPath })
		} catch (error) {
			onEvent({
				type: 'error',
				inputPath: next,
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

	const wordQueue = createQueue('word', options.onEvent)
	const excelQueue = createQueue('excel', options.onEvent)

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

	const watchers = [] as Array<{
		close: () => void
	}>

	if (options.wordDir) {
		const wordDir = options.wordDir
		const wordWatcher = watch(wordDir, (eventType, filename) => {
			if (eventType === 'rename' || eventType === 'change') {
				schedule(wordDir, wordQueue, filename)
			}
		})
		wordWatcher.on('error', (error) => {
			options.onEvent({
				type: 'error',
				inputPath: wordDir,
				error: error instanceof Error ? error : new Error('Watcher error'),
			})
		})
		watchers.push(wordWatcher)
	}

	if (options.excelDir) {
		const excelDir = options.excelDir
		const excelWatcher = watch(excelDir, (eventType, filename) => {
			if (eventType === 'rename' || eventType === 'change') {
				schedule(excelDir, excelQueue, filename)
			}
		})
		excelWatcher.on('error', (error) => {
			options.onEvent({
				type: 'error',
				inputPath: excelDir,
				error: error instanceof Error ? error : new Error('Watcher error'),
			})
		})
		watchers.push(excelWatcher)
	}

	return {
		close: () => {
			for (const watcher of watchers) {
				watcher.close()
			}
			wordQueue.close()
			excelQueue.close()
			for (const timer of debounceTimers.values()) {
				clearTimeout(timer)
			}
			debounceTimers.clear()
		},
	}
}
