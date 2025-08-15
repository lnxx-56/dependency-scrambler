#!/usr/bin/env node

import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { scramblePackageJson, restoreFromBackup } from './scrambler';
import { DEFAULT_OPTIONS, DependencyType } from './types';

// Constants for CLI display
const PACKAGE_NAME = 'dependency-scrambler';
const VERSION = process.env['npm_package_version'] || '1.0.0';

// Create CLI program
const program = new Command();

// Configure the program
program
  .name(PACKAGE_NAME)
  .description(
    'Dependency Scrambler: An interview task that scrambles package.json versions to test debugging skills'
  )
  .version(VERSION);

// Scramble command
program
  .command('scramble')
  .description('Scramble your package.json dependencies to create conflicts')
  .option('-p, --path <path>', 'Target package.json path', './package.json')
  .option('-n, --no-backup', 'Skip creating backup of package.json')
  .option(
    '-t, --types <types>',
    'Types of dependencies to scramble (comma separated)',
    Object.values(DependencyType).join(',')
  )
  .option(
    '-s, --scramble-percentage <percentage>',
    'Percentage of dependencies to scramble (0-100)',
    String(DEFAULT_OPTIONS.scramblePercentage)
  )
  .option(
    '-a, --aggression-level <level>',
    'How aggressive the scrambling should be (1-10)',
    String(DEFAULT_OPTIONS.aggressionLevel)
  )
  .action(async (options): Promise<void> => {
    try {
      console.log(chalk.yellow('🎲 Dependency Scrambler: Scrambling package.json dependencies...'));
      
      const targetPath = options.path;
      const createBackup = options.backup !== false;
      const dependencyTypes = options.types.split(',').filter((t: string) => 
        Object.values(DependencyType).includes(t as DependencyType)
      ) as DependencyType[];
      const scramblePercentage = Math.min(100, Math.max(0, parseInt(options.scramblePercentage, 10)));
      const aggressionLevel = Math.min(10, Math.max(1, parseInt(options.aggressionLevel, 10)));
      
      const result = await scramblePackageJson({
        targetPath,
        createBackup,
        dependencyTypes,
        scramblePercentage,
        aggressionLevel,
      });
      
      // Print summary of changes
      console.log(chalk.green('✓ Dependencies successfully scrambled!'));
      console.log();
      
      if (result.backupPath) {
        console.log(chalk.blue(`Backup created at: ${result.backupPath}`));
      }
      
      // Show counts of scrambled deps by type
      for (const [type, deps] of Object.entries(result.scrambledDeps)) {
        if (deps.length > 0) {
          console.log(chalk.yellow(`${type}: ${deps.length} dependencies scrambled`));
        }
      }
      
      console.log();
      console.log(chalk.red('⚠️  Warning: npm install will now likely fail due to dependency conflicts.'));
      console.log(chalk.yellow('📝 This is part of an interview challenge to fix dependency issues.'));
      
      if (result.backupPath) {
        console.log();
        console.log(chalk.blue(`To restore the original package.json, run:`));
        console.log(chalk.cyan(`  npx ${PACKAGE_NAME} restore --backup ${path.basename(result.backupPath)}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${String(error)}`));
      process.exit(1);
    }
  });

// Restore command
program
  .command('restore')
  .description('Restore package.json from backup')
  .requiredOption('-b, --backup <path>', 'Backup file to restore from')
  .option('-t, --target <path>', 'Target path to restore to', './package.json')
  .action(async (options): Promise<void> => {
    try {
      console.log(chalk.yellow('🔄 Dependency Scrambler: Restoring package.json from backup...'));
      await restoreFromBackup(options.backup, options.target);
      console.log(chalk.green('✓ Package.json successfully restored!'));
    } catch (error) {
      console.error(chalk.red(`Error: ${String(error)}`));
      process.exit(1);
    }
  });

// Add a hint command to give clues for solving the dependency issues
program
  .command('hint')
  .description('Get hints for solving the dependency issues')
  .action((): void => {
    console.log(chalk.yellow('🔍 Dependency Scrambler: Hints for solving dependency issues'));
    console.log();
    console.log(chalk.cyan('1. Look for inconsistent version ranges in package.json'));
    console.log(chalk.cyan('2. Check for peer dependency conflicts'));
    console.log(chalk.cyan('3. Try using npm ls to identify dependency issues'));
    console.log(chalk.cyan('4. Look for dependencies that might need exact versions'));
    console.log(chalk.cyan('5. Consider using npm-check-updates to analyze version problems'));
    console.log();
    console.log(chalk.yellow('Remember: The goal is to make npm install work without using --force or --legacy-peer-deps'));
  });

// Parse the command line arguments
program.parse();

// Default action if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
