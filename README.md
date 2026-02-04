# ocr

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Convert a single file:

```bash
ocr convert --format word ./input.pdf
```

CLI watch mode:

```bash
ocr watch --word ./word --excel ./excel
```

Watch a single folder:

```bash
ocr watch --word ./word
```

Library usage:

```ts
import { convertFile, watchFolders } from './src/lib'

const result = await convertFile({
	inputPath: './docs/input.pdf',
	format: 'word',
})

await watchFolders({
	wordDir: './word',
	excelDir: './excel',
	onEvent: (event) => {
		if (event.type === 'success') {
			console.log(event.outputPath)
		}
	},
})
```

Tooling:

```bash
bun run lint
bun run format
bun run fix
bun run typecheck
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
