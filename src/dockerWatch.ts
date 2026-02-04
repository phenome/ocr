#!/usr/bin/env bun
import { watchFolders } from './lib'

const watchDocx = (process.env.WATCH_DOCX ?? '').trim()
const watchXlsx = (process.env.WATCH_XLSX ?? '').trim()

if (!watchDocx && !watchXlsx) {
	console.error('WATCH_DOCX or WATCH_XLSX must be set.')
	process.exit(1)
}

if (watchDocx) {
	console.log(`watching for files to convert to DOCX in folder ${watchDocx}`)
}

if (watchXlsx) {
	console.log(`watching for files to convert to XLSX in folder ${watchXlsx}`)
}

const watcher = await watchFolders({
	wordDir: watchDocx || undefined,
	excelDir: watchXlsx || undefined,
	onEvent: (event) => {
		if (event.type === 'start') {
			console.log(`Processing ${event.inputPath}`)
			return
		}
		if (event.type === 'success') {
			console.log(`Processed ${event.inputPath} -> ${event.outputPath}`)
			return
		}
		console.error(
			`Failed ${event.inputPath}: ${event.error?.message ?? 'Unknown error'}`
		)
	},
})

const shutdown = () => {
	watcher.close()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
