/**
 * @fileoverview Command line utility for generating file structure and content documentation.
 * Creates a comprehensive view of project structure with file contents.
 * 
 * @module FileStructureCLI
 * @author Ithan lara
 * @license MIT
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { relative } from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * Configuration options for file tree generation
 * @interface Ifile_tree_options
 * @property {RegExp[]} exclude_patterns - Array of regular expressions for paths to exclude
 * @property {string[]} include_extensions - Array of file extensions to include in the documentation
 */
interface Ifile_tree_options {
    exclude_patterns: RegExp[];
    include_extensions: string[];
}

/**
 * Displays help message for the CLI utility
 * @function show_help
 * @returns {void}
 */
function show_help(): void {
    console.log(`
File Structure Documentation Generator

Usage:
    deno run --allow-read --allow-write file_structure_cli.ts generate <source_path> [options]

Commands:
    generate <path>   Generate documentation for the specified path
    --help            Show this help message

Options:
    --output         Output file path (default: "project_structure.txt")
    --exts           File extensions to include (comma-separated, default: ".ts,.tsx")
    --exclude        Patterns to exclude (comma-separated, default: "node_modules,dist,build")

Examples:
    deno run --allow-read --allow-write file_structure_cli.ts generate ./src
    deno run --allow-read --allow-write file_structure_cli.ts generate ./src --output=docs.txt --exts=.ts,.tsx
    `);
}

/**
 * Creates a visual tree representation of the directory structure
 * Similar to Windows 'tree /F' command
 * 
 * @async
 * @function generate_tree_structure
 * @param {string} root_path - The root directory path to start generating the tree from
 * @param {Ifile_tree_options} options - Configuration options for tree generation
 * @returns {Promise<string>} A formatted string representing the directory structure
 * 
 * @example
 * const options = {
 *   exclude_patterns: [/node_modules/, /dist/],
 *   include_extensions: ['.ts', '.tsx']
 * };
 * const tree = await generate_tree_structure('./src', options);
 * console.log(tree);
 */
async function generate_tree_structure(
    root_path: string,
    options: Ifile_tree_options
): Promise<string> {
    let output = `Directory structure of ${root_path}\n`;
    output += "".padEnd(root_path.length + 22, "=") + "\n\n";

    const entries: { path: string; isDirectory: boolean }[] = [];
    
    // Collect all entries first
    for await (const entry of walk(root_path, {
        includeDirs: true,
        skip: options.exclude_patterns,
    })) {
        const rel_path = relative(root_path, entry.path);
        if (!rel_path) continue;
        
        // Skip files that don't match our extensions unless they're directories
        if (!entry.isDirectory && 
            options.include_extensions.length > 0 && 
            !options.include_extensions.some(ext => entry.path.endsWith(ext))) {
            continue;
        }
        
        entries.push({
            path: rel_path,
            isDirectory: entry.isDirectory,
        });
    }

    // Sort entries to ensure directories come before files
    entries.sort((a, b) => {
        const a_parts = a.path.split(/[\\/]/);
        const b_parts = b.path.split(/[\\/]/);
        
        for (let i = 0; i < Math.min(a_parts.length, b_parts.length); i++) {
            if (a_parts[i] !== b_parts[i]) {
                return a_parts[i].localeCompare(b_parts[i]);
            }
        }
        return a_parts.length - b_parts.length;
    });

    // Generate tree structure
    for (const entry of entries) {
        const parts = entry.path.split(/[\\/]/);
        const prefix = parts.slice(0, -1).map(() => "│   ").join("");
        const is_last = entries.indexOf(entry) === entries.length - 1;
        
        output += prefix + (is_last ? "└── " : "├── ");
        output += parts[parts.length - 1] + "\n";
    }

    return output;
}

/**
 * Generates comprehensive documentation including tree structure and file contents
 * 
 * @async
 * @function generate_documentation
 * @param {string} source_path - The source directory path to document
 * @param {string} output_path - The path where the documentation file will be written
 * @param {Ifile_tree_options} options - Configuration options for documentation generation
 * @returns {Promise<void>}
 * @throws {Error} If file operations fail or paths are invalid
 * 
 * @example
 * const options = {
 *   exclude_patterns: [/node_modules/, /dist/],
 *   include_extensions: ['.ts', '.tsx']
 * };
 * await generate_documentation(
 *   './src',
 *   './docs/project-structure.txt',
 *   options
 * );
 */
async function generate_documentation(
    source_path: string,
    output_path: string,
    options: Ifile_tree_options
): Promise<void> {
    let output = "";

    // Generate tree structure
    output += await generate_tree_structure(source_path, options);
    output += "\n\nFile Contents:\n";
    output += "=============\n\n";

    // Add file contents
    for await (const entry of walk(source_path, {
        includeDirs: false,
        skip: options.exclude_patterns,
    })) {
        if (!options.include_extensions.some(ext => entry.path.endsWith(ext))) {
            continue;
        }

        const content = await Deno.readTextFile(entry.path);
        const rel_path = relative(source_path, entry.path);
        
        output += `File: ${rel_path}\n`;
        output += "".padEnd(rel_path.length + 6, "=") + "\n";
        output += content;
        output += "\n\n";
    }

    await Deno.writeTextFile(output_path, output);
    console.log(`Successfully generated documentation at ${output_path}`);
}

/**
 * Main CLI orchestration function
 * Handles command line arguments and executes appropriate actions
 * 
 * @async
 * @function main
 * @returns {Promise<void>}
 * @throws {Error} If required arguments are missing or invalid
 * 
 * @example
 * // Generate documentation for TypeScript files
 * deno run --allow-read --allow-write file_structure_cli.ts generate ./src
 * 
 * @example
 * // Generate documentation with custom extensions and output file
 * deno run --allow-read --allow-write file_structure_cli.ts generate ./src \
 *   --output=docs.txt \
 *   --exts=.ts,.tsx \
 *   --exclude=node_modules,dist
 */
async function main() {
    const args = parseArgs(Deno.args, {
        string: ["output", "exts", "exclude"],
        boolean: ["help", "h"],
        default: {
            output: "project_structure.txt",
            exts: ".ts,.tsx",
            exclude: "node_modules,dist,build"
        }
    });

    // Handle help flag
    if (args.help || args.h) {
        show_help();
        return;
    }

    const [command, source_path] = args._;

    if (command !== "generate" || !source_path) {
        console.error("Error: 'generate' command and source path are required");
        show_help();
        Deno.exit(1);
    }

    try {
        const options: Ifile_tree_options = {
            exclude_patterns: args.exclude.split(",").map(p => new RegExp(p)),
            include_extensions: args.exts.split(",")
        };

        await generate_documentation(
            String(source_path),
            args.output,
            options
        );
    } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : "Unknown error occurred");
        Deno.exit(1);
    }
}

// Run the CLI if this is the main module
if (import.meta.main) {
    main();
}
