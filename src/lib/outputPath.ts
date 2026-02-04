import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { OutputFormat } from '../types'
import { getOutputExtension } from './format'

type OutputPathOptions = {
	inputPath: string
	format: OutputFormat
	outputDir?: string
}

const pathExists = async (filePath: string): Promise<boolean> => {
	try {
		await access(filePath)
		return true
	} catch {
		return false
	}
}

export const resolveOutputPath = async (
	options: OutputPathOptions
): Promise<string> => {
	const parsedPath = path.parse(options.inputPath)
	const targetDir = options.outputDir ?? parsedPath.dir
	await mkdir(targetDir, { recursive: true })

	const outputExtension = getOutputExtension(options.format)
	const baseName = parsedPath.name

	let candidate = path.join(targetDir, `${baseName}${outputExtension}`)
	if (!(await pathExists(candidate))) {
		return candidate
	}

	let index = 1
	while (true) {
		candidate = path.join(targetDir, `${baseName} (${index})${outputExtension}`)
		if (!(await pathExists(candidate))) {
			return candidate
		}
		index += 1
	}
}
