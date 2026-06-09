import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
	AnalyzeDocumentCommand,
	type Block,
	GetDocumentAnalysisCommand,
	type Relationship,
	StartDocumentAnalysisCommand,
	TextractClient,
} from '@aws-sdk/client-textract'
import type { LayoutResponse, LayoutTable, TextractMetadata } from '../types'

const requiredEnvVars = [
	'AWS_ACCESS_KEY_ID',
	'AWS_SECRET_ACCESS_KEY',
	'AWS_REGION',
]
export const supportedInputExtensions = new Set([
	'.pdf',
	'.png',
	'.jpg',
	'.jpeg',
	'.tif',
	'.tiff',
])
const maxInlineBytes = 5 * 1024 * 1024
const pollIntervalMs = 2000

const validateEnv = (): string => {
	const missing = requiredEnvVars.filter((key) => {
		const value = process.env[key]
		return !value || value.trim().length === 0
	})

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`
		)
	}

	return process.env.AWS_REGION ?? ''
}

const getChildBlocks = (
	block: Block,
	blocksById: Map<string, Block>,
	blockType?: string
): Block[] => {
	const relationships: Relationship[] = block.Relationships ?? []
	const childIds = relationships
		.filter((relationship: Relationship) => relationship.Type === 'CHILD')
		.flatMap((relationship: Relationship) => relationship.Ids ?? [])

	const children = childIds
		.map((id: string) => blocksById.get(id))
		.filter((child: Block | undefined): child is Block => Boolean(child))

	if (!blockType) {
		return children
	}

	return children.filter((child: Block) => child.BlockType === blockType)
}

const getCellText = (cell: Block, blocksById: Map<string, Block>): string => {
	const children = getChildBlocks(cell, blocksById)
	const textParts: string[] = []

	for (const child of children) {
		if (child.BlockType === 'WORD' && child.Text) {
			textParts.push(child.Text)
			continue
		}

		if (
			child.BlockType === 'SELECTION_ELEMENT' &&
			child.SelectionStatus === 'SELECTED'
		) {
			textParts.push('X')
		}
	}

	return textParts.join(' ')
}

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

const buildTables = (
	blocks: Block[],
	blocksById: Map<string, Block>
): LayoutTable[] => {
	const tables: LayoutTable[] = []

	for (const block of blocks) {
		if (block.BlockType !== 'TABLE') {
			continue
		}

		const cells = getChildBlocks(block, blocksById, 'CELL')
		let maxRow = 0
		let maxCol = 0

		for (const cell of cells) {
			const rowIndex = cell.RowIndex ?? 1
			const colIndex = cell.ColumnIndex ?? 1
			if (rowIndex > maxRow) {
				maxRow = rowIndex
			}
			if (colIndex > maxCol) {
				maxCol = colIndex
			}
		}

		const rows = Array.from({ length: maxRow }, () =>
			Array.from({ length: maxCol }, () => '')
		)

		for (const cell of cells) {
			const rowIndex = (cell.RowIndex ?? 1) - 1
			const colIndex = (cell.ColumnIndex ?? 1) - 1
			const text = getCellText(cell, blocksById)
			if (rows[rowIndex]) {
				rows[rowIndex][colIndex] = text
			}
		}

		tables.push({ rows })
	}

	return tables
}

const uploadToS3 = async (bucket: string, key: string, bytes: Uint8Array) => {
	const client = new S3Client({ region: process.env.AWS_REGION })
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: bytes,
		})
	)
}

const fetchAnalysisBlocks = async (
	client: TextractClient,
	jobId: string
): Promise<{
	blocks: Block[]
	pollCount: number
	resultPageCount: number
	requestId?: string
}> => {
	let pollCount = 0
	while (true) {
		const response = await client.send(
			new GetDocumentAnalysisCommand({
				JobId: jobId,
				MaxResults: 1000,
			})
		)
		pollCount += 1

		const status = response.JobStatus
		if (status === 'FAILED') {
			throw new Error(response.StatusMessage ?? 'Textract job failed')
		}

		if (status !== 'SUCCEEDED') {
			await sleep(pollIntervalMs)
			continue
		}

		const blocks: Block[] = [...(response.Blocks ?? [])]
		let nextToken = response.NextToken
		let resultPageCount = 1
		let requestId = response.$metadata.requestId

		while (nextToken) {
			const page = await client.send(
				new GetDocumentAnalysisCommand({
					JobId: jobId,
					NextToken: nextToken,
					MaxResults: 1000,
				})
			)
			pollCount += 1
			resultPageCount += 1
			requestId = page.$metadata.requestId ?? requestId
			blocks.push(...(page.Blocks ?? []))
			nextToken = page.NextToken
		}

		return { blocks, pollCount, resultPageCount, requestId }
	}
}

export const processDocument = async (
	filePath: string
): Promise<LayoutResponse> => {
	const region = validateEnv()
	const extension = path.extname(filePath).toLowerCase()
	if (!supportedInputExtensions.has(extension)) {
		throw new Error(
			`Unsupported document format: ${extension}. Supported formats: ${[...supportedInputExtensions].join(', ')}`
		)
	}

	const fileStats = await stat(filePath)
	const bytes = await readFile(filePath)
	const client = new TextractClient({ region })
	let blocks: Block[] = []
	let textract: TextractMetadata

	const requiresS3 = extension === '.pdf' || fileStats.size > maxInlineBytes
	if (requiresS3) {
		const bucket = process.env.AWS_TEXTRACT_S3_BUCKET?.trim()
		if (!bucket) {
			throw new Error(
				'Missing required environment variable: AWS_TEXTRACT_S3_BUCKET'
			)
		}
		const key = `textract/${Date.now()}-${path.basename(filePath)}`
		await uploadToS3(bucket, key, bytes)

		const startResponse = await client.send(
			new StartDocumentAnalysisCommand({
				DocumentLocation: {
					S3Object: { Bucket: bucket, Name: key },
				},
				FeatureTypes: ['TABLES', 'FORMS'],
			})
		)

		const jobId = startResponse.JobId
		if (!jobId) {
			throw new Error('Textract did not return a job id')
		}

		const analysis = await fetchAnalysisBlocks(client, jobId)
		blocks = analysis.blocks
		textract = {
			mode: 'async',
			pageCount: blocks.filter((block) => block.BlockType === 'PAGE').length,
			sourceBytes: fileStats.size,
			pollCount: analysis.pollCount,
			resultPageCount: analysis.resultPageCount,
			requestId: analysis.requestId ?? startResponse.$metadata.requestId,
			s3Bucket: bucket,
			s3Key: key,
			jobId,
		}
	} else {
		const command = new AnalyzeDocumentCommand({
			Document: { Bytes: bytes },
			FeatureTypes: ['TABLES', 'FORMS'],
		})

		const response = await client.send(command)
		blocks = response.Blocks ?? []
		textract = {
			mode: 'sync',
			pageCount: blocks.filter((block) => block.BlockType === 'PAGE').length,
			sourceBytes: fileStats.size,
			pollCount: 0,
			resultPageCount: 1,
			requestId: response.$metadata.requestId,
		}
	}
	const blocksById = new Map<string, Block>()

	for (const block of blocks) {
		if (block.Id) {
			blocksById.set(block.Id, block)
		}
	}

	const paragraphs = blocks
		.filter((block: Block) => block.BlockType === 'LINE' && block.Text)
		.map((block: Block) => block.Text ?? '')

	const tables = buildTables(blocks, blocksById)

	return { paragraphs, tables, pageCount: textract.pageCount, textract }
}
