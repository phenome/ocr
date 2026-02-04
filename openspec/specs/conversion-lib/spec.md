# conversion-lib Specification

## Purpose
TBD - created by archiving change cli-lib-watch-command. Update Purpose after archive.
## Requirements
### Requirement: Library conversion API
The system SHALL expose a programmatic API to convert a single input file to a requested output format using Amazon Textract.

#### Scenario: Convert to Word
- **WHEN** the caller requests output format `word` with a valid input file
- **THEN** the system returns the path to a generated `.docx` file

#### Scenario: Convert to Excel
- **WHEN** the caller requests output format `excel` with a valid input file
- **THEN** the system returns the path to a generated `.xlsx` file

#### Scenario: Invalid format
- **WHEN** the caller requests an unsupported output format
- **THEN** the system returns an error indicating valid formats are word or excel

### Requirement: Library output location and naming
The system SHALL write output files in the same folder as the input by default and resolve name collisions by appending numbered suffixes.

#### Scenario: Default output directory
- **WHEN** the caller does not provide an output directory
- **THEN** the output file is saved in the input file’s directory

#### Scenario: Custom output directory
- **WHEN** the caller provides an output directory
- **THEN** the output file is saved in the specified directory

#### Scenario: Output name collision
- **WHEN** the output file name already exists in the target directory
- **THEN** the system appends ` (1)`, ` (2)`, etc. before the extension until an available name is found

### Requirement: Library watch API
The system SHALL expose a programmatic API to watch two input folders (Word and Excel) and process newly added files.

#### Scenario: New Word file detected
- **WHEN** a new `.docx` file is added to the Word folder
- **THEN** the system processes it and emits a success or error event to the caller

#### Scenario: New Excel file detected
- **WHEN** a new `.xlsx` file is added to the Excel folder
- **THEN** the system processes it and emits a success or error event to the caller

