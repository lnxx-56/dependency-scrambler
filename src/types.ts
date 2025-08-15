/**
 * Types for NPM Roulette package
 */

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export enum DependencyType {
  DEPENDENCIES = 'dependencies',
  DEV_DEPENDENCIES = 'devDependencies',
  PEER_DEPENDENCIES = 'peerDependencies',
  OPTIONAL_DEPENDENCIES = 'optionalDependencies',
}

/** Conflict modes for scrambling dependencies */
export enum ConflictMode {
  /** Allows updating to newer versions to fix issues */
  SIMPLE = 'simple',
  /** Creates more complex conflicts that can't be fixed by just updating */
  REALISTIC = 'realistic',
  /** Focused on creating peer dependency conflicts */
  PEER_CONFLICT = 'peer-conflict'
}

export interface RouletteOptions {
  /** Target path to package.json (defaults to ./package.json) */
  targetPath?: string;
  /** Create a backup of the original package.json (defaults to true) */
  createBackup?: boolean;
  /** Types of dependencies to scramble (defaults to all) */
  dependencyTypes?: DependencyType[];
  /** Percentage of dependencies to scramble (0-100, defaults to 30%) */
  scramblePercentage?: number;
  /** How aggressive the scrambling should be (1-10, defaults to 5) */
  aggressionLevel?: number;
  /** Version constraints to respect for specific packages (e.g., {"angular": "^14.0.0"}) */
  versionConstraints?: Record<string, string>;
  /** Whether to respect major versions in original package.json (defaults to true) */
  respectMajorVersions?: boolean;
  /** Type of conflicts to generate (defaults to 'realistic') */
  conflictMode?: 'simple' | 'realistic' | 'peer-conflict';
}

export interface ScrambleResult {
  original: PackageJson;
  modified: PackageJson;
  scrambledDeps: Record<DependencyType, string[]>;
  backupPath?: string;
  issues: string[];
}

export const DEFAULT_OPTIONS: RouletteOptions = {
  targetPath: './package.json',
  createBackup: true,
  dependencyTypes: Object.values(DependencyType),
  scramblePercentage: 30,
  aggressionLevel: 5,
  versionConstraints: {},
  respectMajorVersions: true,
  conflictMode: 'realistic',
};

export const VERSION_RANGE_REGEX = /^(\^|~|>=|>|<=|<|=)?(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/;

export const CONFLICT_TYPES = [
  'version mismatch',
  'peer dependency conflict',
  'unsatisfiable version range',
  'circular dependency',
  'missing dependency',
];
