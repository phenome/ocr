# cli Specification

## ADDED Requirements

### Requirement: Watch command
The system SHALL provide a `watch` command that accepts two input folders, one for Word files and one for Excel files.

#### Scenario: Start watch with both folders
- **WHEN** the user runs `ocr watch --word ./word --excel ./excel`
- **THEN** the system starts watching both folders for new files

#### Scenario: Missing Word folder
- **WHEN** the user runs `ocr watch --excel ./excel` without a Word folder
- **THEN** the system displays an error message indicating the Word folder is required

#### Scenario: Missing Excel folder
- **WHEN** the user runs `ocr watch --word ./word` without an Excel folder
- **THEN** the system displays an error message indicating the Excel folder is required

### Requirement: Watch processing logging
The system SHALL log processing start, success, and error events for watch-based conversions.

#### Scenario: Successful watch conversion
- **WHEN** a watched file is processed successfully
- **THEN** the system logs the input file path and the output file path

#### Scenario: Failed watch conversion
- **WHEN** a watched file fails to process
- **THEN** the system logs the input file path and the error message

## MODIFIED Requirements

### Requirement: CLI Argument Parsing
The system SHALL accept command-line arguments for specifying input file, output format, and optional output directory.

#### Scenario: Valid arguments with word format
- **GIVEN** a valid input file path
- **WHEN** the user runs `ocr --format word <input-file>`
- **THEN** the system processes the file and outputs a .docx file

#### Scenario: Valid arguments with excel format
- **GIVEN** a valid input file path
- **WHEN** the user runs `ocr --format excel <input-file>`
- **THEN** the system processes the file and outputs an .xlsx file

#### Scenario: Custom output directory
- **GIVEN** a valid input file path
- **WHEN** the user runs `ocr --format word --output ./output <input-file>`
- **THEN** the system outputs the file to the specified directory

#### Scenario: Missing required format argument
- **WHEN** the user runs `ocr <input-file>` without --format
- **THEN** the system displays an error message indicating format is required

#### Scenario: Invalid format value
- **WHEN** the user runs `ocr --format pdf <input-file>`
- **THEN** the system displays an error message indicating valid formats are word or excel

#### Scenario: Missing input file
- **WHEN** the user runs `ocr --format word` without an input file
- **THEN** the system displays an error message indicating input file is required

#### Scenario: Help command
- **WHEN** the user runs `ocr --help`
- **THEN** the system displays usage information with all available options

### Requirement: Output File Naming
The system SHALL generate output files with the same base name as the input file but with the appropriate extension based on format, and resolve naming collisions.

#### Scenario: Word output naming
- **GIVEN** an input file named `document.pdf`
- **WHEN** processing with format `word`
- **THEN** the output file is named `document.docx`

#### Scenario: Excel output naming
- **GIVEN** an input file named `report.pdf`
- **WHEN** processing with format `excel`
- **THEN** the output file is named `report.xlsx`

#### Scenario: Default output directory
- **GIVEN** no output directory specified
- **WHEN** processing completes
- **THEN** the output file is created in the same directory as the input file

#### Scenario: Output name collision
- **GIVEN** the output file name already exists in the target directory
- **WHEN** processing completes
- **THEN** the system appends ` (1)`, ` (2)`, etc. before the extension until an available name is found
