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

export const getDefaultOutputPath = (options: OutputPathOptions): string => {
	const parsedPath = path.parse(options.inputPath)
	const targetDir = options.outputDir ?? parsedPath.dir
	return path.join(
		targetDir,
		`${parsedPath.name}${getOutputExtension(options.format)}`
	)
}

export const resolveOutputPath = async (
	options: OutputPathOptions
): Promise<string> => {
	const targetDir = options.outputDir ?? path.parse(options.inputPath).dir
	await mkdir(targetDir, { recursive: true })

	let candidate = getDefaultOutputPath(options)
	if (!(await pathExists(candidate))) {
		return candidate
	}

	const parsedPath = path.parse(options.inputPath)
	let index = 1
	while (true) {
		candidate = path.join(
			targetDir,
			`${parsedPath.name} (${index})${getOutputExtension(options.format)}`
		)
		if (!(await pathExists(candidate))) {
			return candidate
		}
		index += 1
	}
}
