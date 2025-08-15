/**
 * NPM Roulette - An interview task that scrambles package.json versions to test debugging skills
 * 
 * This module exports functions to programmatically scramble package.json files,
 * creating intentional dependency conflicts for interview tasks or testing.
 */

import { 
  scramblePackageJson, 
  restoreFromBackup, 
  loadPackageJson, 
  savePackageJson,
  scrambleVersion,
  scrambleDependencies
} from './scrambler';

import {
  PackageJson,
  RouletteOptions,
  ScrambleResult,
  DependencyType,
  DEFAULT_OPTIONS
} from './types';

// Export all public APIs
export {
  // Core functionality
  scramblePackageJson,
  restoreFromBackup,
  loadPackageJson,
  savePackageJson,
  scrambleVersion,
  scrambleDependencies,
  
  // Types
  PackageJson,
  RouletteOptions,
  ScrambleResult,
  DependencyType,
  DEFAULT_OPTIONS
};

// Default export
export default {
  scramble: scramblePackageJson,
  restore: restoreFromBackup,
};
