import { Workbook } from 'exceljs'
import type { LayoutResponse } from '../types'

export const exportToExcel = async (
	layout: LayoutResponse,
	outputPath: string
): Promise<void> => {
	const workbook = new Workbook()
	const worksheet = workbook.addWorksheet('Sheet1')

	for (const table of layout.tables) {
		if (worksheet.rowCount > 0) {
			worksheet.addRow([])
		}

		for (const row of table.rows) {
			worksheet.addRow(row)
		}
	}

	await workbook.xlsx.writeFile(outputPath)
}
