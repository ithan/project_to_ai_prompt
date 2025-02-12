# File Structure Documentation Generator

A command-line utility built with Deno that generates comprehensive documentation of your project's file structure and contents, similar to the Windows 'tree /F' command but with additional features. This tool is specifically designed to help developers share their projects with AI assistants by creating a single, well-structured document containing both the project structure and file contents in an easy-to-process format.

## Features

- Optimized for sharing codebases with AI assistants
- Generate visual tree representation of directory structures
- Include file contents in the documentation
- Configurable file extension filtering
- Pattern-based directory/file exclusion
- Clean and formatted output

## Prerequisites

- [Deno](https://deno.land/) installed on your system

## Installation

No installation is needed. Just clone the repository and run the script using Deno.

## Usage

Basic usage:
```bash
deno run --allow-read --allow-write file_structure_cli.ts generate <source_path>
```

With options:
```bash
deno run --allow-read --allow-write file_structure_cli.ts generate <source_path> \
  --output=docs.txt \
  --exts=.ts,.tsx \
  --exclude=node_modules,dist
```

### Commands

- `generate <path>` - Generate documentation for the specified path
- `--help` - Show help message

### Options

- `--output` - Output file path (default: "project_structure.txt")
- `--exts` - File extensions to include (comma-separated, default: ".ts,.tsx")
- `--exclude` - Patterns to exclude (comma-separated, default: "node_modules,dist,build")

## Examples

Generate documentation for a TypeScript project:
```bash
deno run --allow-read --allow-write file_structure_cli.ts generate ./src
```

Generate documentation with custom configuration:
```bash
deno run --allow-read --allow-write file_structure_cli.ts generate ./src \
  --output=project_docs.txt \
  --exts=.ts,.tsx,.js \
  --exclude=node_modules,dist,tests
```

## Output Format

The generated documentation includes:

1. A visual tree representation of your project structure
2. The contents of all included files
3. Clear separation and formatting for easy reading

Example output structure:
```
Directory structure of ./src
========================

├── components
│   ├── Button.tsx
│   └── Input.tsx
└── utils
    └── helpers.ts

File Contents:
=============

File: components/Button.tsx
==========================
[file contents here]

...
```

## License

MIT

## Author

Ithan Lara
