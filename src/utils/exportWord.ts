import { writeFile } from 'node:fs/promises'
import {
	Document,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
} from 'docx'
import type { LayoutResponse } from '../types'

export const exportToWord = async (
	layout: LayoutResponse,
	outputPath: string
): Promise<void> => {
	const children = [] as (Paragraph | Table)[]

	for (const paragraph of layout.paragraphs) {
		children.push(new Paragraph({ children: [new TextRun(paragraph)] }))
	}

	for (const table of layout.tables) {
		const rows = table.rows.map(
			(row) =>
				new TableRow({
					children: row.map(
						(cellText) =>
							new TableCell({
								children: [new Paragraph(cellText)],
							})
					),
				})
		)

		children.push(new Table({ rows }))
	}

	const document = new Document({
		sections: [{ children }],
	})

	const buffer = await Packer.toBuffer(document)
	await writeFile(outputPath, buffer)
}
