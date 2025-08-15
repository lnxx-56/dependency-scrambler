# Dependency Scrambler

[![npm version](https://img.shields.io/npm/v/dependency-scrambler.svg)](https://www.npmjs.com/package/dependency-scrambler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An interview task generator that deliberately scrambles your `package.json` dependency versions to create conflicts.

## 🎯 Purpose

Dependency Scrambler is designed as an interview task to test a developer's ability to identify and resolve dependency conflicts in Node.js projects. It intentionally introduces version incompatibilities that cause `npm install` to fail, challenging candidates to fix these issues without using flags like `--force` or `--legacy-peer-deps`.

## 📦 Installation

```bash
# Install globally
npm install -g dependency-scrambler

# Or run directly with npx
npx dependency-scrambler
```

## 🚀 Usage

### For Interviewers

1. Set up a simple project with multiple dependencies
2. Run Dependency Scrambler to create dependency conflicts
3. Ask the candidate to fix the conflicts without using force flags

```bash
# Create conflicts in the current project
npx dependency-scrambler scramble

# Customize the level of difficulty
npx dependency-scrambler scramble --aggression-level 8 --scramble-percentage 50
```

### For Developers (Practice Mode)

Test your debugging skills by running Dependency Scrambler on a test project:

```bash
# Create a test project
mkdir npm-challenge && cd npm-challenge
npm init -y
npm install express react lodash axios react-dom

# Scramble the dependencies
npx dependency-scrambler scramble

# Now try to fix the project so npm install works without force flags!
```

### CLI Options

```
Options:
  -V, --version                      output the version number
  -h, --help                         display help for command

Commands:
  scramble [options]                 Scramble your package.json dependencies to create conflicts
  restore [options]                  Restore package.json from backup
  hint                               Get hints for solving the dependency issues
  help [command]                     display help for command

Scramble Options:
  -p, --path <path>                  Target package.json path (default: "./package.json")
  -n, --no-backup                    Skip creating backup of package.json
  -t, --types <types>                Types of dependencies to scramble (comma separated)
  -s, --scramble-percentage <percentage>  Percentage of dependencies to scramble (0-100)
  -a, --aggression-level <level>     How aggressive the scrambling should be (1-10)
```

## 📝 Interview Task Guide

### Task Description Template

> **Node.js Dependency Debugging Challenge**
> 
> The project's dependencies are in conflict, causing `npm install` to fail. Your task is to:
> 
> 1. Identify the conflicting dependencies in `package.json`
> 2. Make the necessary adjustments to fix the version conflicts
> 3. Successfully run `npm install` **without** using flags like `--force` or `--legacy-peer-deps`
> 4. Explain what issues you found and how you resolved them
> 
> This task tests your understanding of npm's dependency resolution and your debugging skills.

### Evaluation Criteria

- **Problem Identification**: Can the candidate identify which dependencies are causing issues?
- **Resolution Strategy**: Does the candidate use a systematic approach to fixing the issues?
- **Technical Knowledge**: Does the candidate demonstrate understanding of semver and npm?
- **Solution Quality**: Is the solution minimal and effective, avoiding force flags?

### Recommended Difficulty Levels

- **Junior**: `--aggression-level 3 --scramble-percentage 20`
- **Mid-level**: `--aggression-level 5 --scramble-percentage 30`
- **Senior**: `--aggression-level 8 --scramble-percentage 50`

## 💡 For Candidates (Solution Tips)

If you're practicing or stuck during an interview, here are some strategies:

1. Use `npm ls` to identify dependency tree issues
2. Check for peer dependency conflicts
3. Look for inconsistent version ranges
4. Use tools like `npm-check-updates` to analyze potential fixes
5. Consider using exact versions (`npm install package@exact`) for problematic dependencies

Remember that you can always run `npx dependency-scrambler hint` for additional guidance!

## 🧪 How It Works

Dependency Scrambler modifies dependency versions in various ways:

1. **Version Range Modifiers**: Changes prefixes like `^` or `~` to create range mismatches
2. **Version Number Changes**: Alters major, minor, or patch numbers 
3. **Peer Dependency Conflicts**: Creates intentional conflicts between peer and regular dependencies

The conflicts created are solvable but require careful analysis of npm's dependency resolution algorithm.

## 📄 License

MIT
