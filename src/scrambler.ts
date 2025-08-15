import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import {
  PackageJson,
  RouletteOptions,
  DependencyType,
  ScrambleResult,
  DEFAULT_OPTIONS,
  VERSION_RANGE_REGEX,
} from './types';

/**
 * Constants for version scrambling behavior
 */
const VERSION_MODIFIERS = ['^', '~', '>=', '>', '=', '<', '<=', ''];
const MAJOR_VERSION_BOUND = 3; // How far to modify major version
const MINOR_VERSION_BOUND = 5; // How far to modify minor version
const PATCH_VERSION_BOUND = 10; // How far to modify patch version

/**
 * Loads package.json from the specified path
 */
export async function loadPackageJson(filePath: string): Promise<PackageJson> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as PackageJson;
  } catch (error) {
    throw new Error(`Failed to load package.json from ${filePath}: ${String(error)}`);
  }
}

/**
 * Saves package.json to the specified path
 */
export async function savePackageJson(filePath: string, data: PackageJson): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save package.json to ${filePath}: ${String(error)}`);
  }
}

/**
 * Creates a backup of package.json
 */
export async function createBackup(filePath: string): Promise<string> {
  try {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content, 'utf-8');
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${String(error)}`);
  }
}

/**
 * Modifies a version string to create conflicts
 */
export function scrambleVersion(
  originalVersion: string, 
  aggressionLevel: number,
  options: {
    respectMajorVersion?: boolean | undefined;
    packageName?: string | undefined;
    versionConstraints?: Record<string, string> | undefined;
    conflictMode?: string | undefined;
  } = {}
): string {
  const match = VERSION_RANGE_REGEX.exec(originalVersion);
  if (!match) return originalVersion; // If not a standard version format, leave unchanged
  
  const [, modifier, major, minor, patch, prerelease] = match;
  
  // Check for version constraints if package name is provided
  if (options.packageName && options.versionConstraints) {
    // Find constraints for this package or packages that start with this name (e.g. @angular/core matches @angular)
    const constraintKey = Object.keys(options.versionConstraints).find(
      key => options.packageName === key || (options.packageName && options.packageName.startsWith(`${key}/`))
    );
    
    if (constraintKey) {
      const constraint = options.versionConstraints[constraintKey];
      if (constraint) {
        const constraintMatch = VERSION_RANGE_REGEX.exec(constraint);
      
        // If we have a valid constraint, use it as a base for scrambling
        if (constraintMatch) {
          const [, cModifier, cMajor, cMinor, cPatch] = constraintMatch;
          
          // For realistic conflicts, respect the major version in the constraint
          // but create conflicts in minor/patch versions
          return createVersionWithinConstraint(cModifier || '', Number(cMajor), Number(cMinor), 
                                             Number(cPatch), aggressionLevel);
        }
      }
    }
  }

  // Scale aggression level (1-10) to determine probability of changes
  const scaledAggression = aggressionLevel / 10;
  
  // Choose how to modify the version
  const modType = Math.random();
  let newModifier = modifier || '';
  let newMajor = Number(major);
  let newMinor = Number(minor);
  let newPatch = Number(patch);
  
  // Chance to change the modifier (^, ~, etc.)
  if (Math.random() < scaledAggression * 0.8) {
    // For realistic mode, prefer using exact versions or more restrictive ranges
    if (options.conflictMode === 'realistic') {
      newModifier = Math.random() < 0.6 ? '' : (Math.random() < 0.7 ? '~' : '^');
    } else {
      newModifier = VERSION_MODIFIERS[Math.floor(Math.random() * VERSION_MODIFIERS.length)] || '';
    }
  }

  // Modify version numbers based on aggression level and options
  if (Math.random() < scaledAggression * 0.7) {
    if (modType < 0.3 && (!options.respectMajorVersion && options.conflictMode !== 'realistic')) {
      // Change major version - but only if not respecting major versions
      const change = Math.floor(Math.random() * MAJOR_VERSION_BOUND) + 1;
      newMajor = Math.max(0, Math.random() > 0.5 ? newMajor + change : newMajor - change);
    } else if (modType < 0.7) {
      // Change minor version
      const change = Math.floor(Math.random() * MINOR_VERSION_BOUND) + 1;
      newMinor = Math.max(0, Math.random() > 0.5 ? newMinor + change : newMinor - change);
    } else {
      // Change patch version
      const change = Math.floor(Math.random() * PATCH_VERSION_BOUND) + 1;
      newPatch = Math.max(0, Math.random() > 0.5 ? newPatch + change : newPatch - change);
    }
  }
  
  // For realistic conflicts, sometimes create a very specific version
  // that would be hard to satisfy with other dependencies
  if (options.conflictMode === 'realistic' && Math.random() < 0.4 * scaledAggression) {
    // Use an exact version but offset it slightly to create conflicts
    newModifier = '';
    if (Math.random() < 0.5) {
      // Increment patch by a specific small amount to create subtle conflicts
      newPatch = newPatch + 1 + Math.floor(Math.random() * 3);
    }
  }
  
  // Reconstruct the version string
  return `${newModifier}${newMajor}.${newMinor}.${newPatch}${prerelease || ''}`;
}

/**
 * Creates a version string that stays within specified major version constraint
 * but is likely to cause conflicts with other dependencies
 */
function createVersionWithinConstraint(
  modifier: string,
  major: number,
  minor: number,
  patch: number,
  aggressionLevel: number
): string {
  // Keep the same major version for constraint
  let newModifier = modifier;
  let newMinor = minor;
  let newPatch = patch;
  
  // Scale aggression level
  const scaledAggression = aggressionLevel / 10;
  
  // Choose modification strategy - higher aggression means more changes
  if (Math.random() < scaledAggression * 0.8) {
    // 1. Possibly change modifier to make range more restrictive
    if (modifier === '^') {
      newModifier = Math.random() < 0.6 ? '~' : '';
    } else if (modifier === '~') {
      newModifier = Math.random() < 0.7 ? '' : '^';
    } else {
      newModifier = Math.random() < 0.3 ? '=' : '';
    }
    
    // 2. Modify minor/patch versions but keep major the same
    if (Math.random() < 0.6) {
      // Change minor version within reasonable bounds for the same major
      const minorChange = Math.floor(Math.random() * MINOR_VERSION_BOUND) + 1;
      newMinor = Math.max(0, Math.random() > 0.5 ? newMinor + minorChange : newMinor - minorChange);
    } else {
      // Change patch version
      const patchChange = Math.floor(Math.random() * PATCH_VERSION_BOUND) + 1;
      newPatch = Math.max(0, Math.random() > 0.5 ? newPatch + patchChange : newPatch - patchChange);
    }
  }
  
  return `${newModifier}${major}.${newMinor}.${newPatch}`;
}

/**
 * Scrambles dependencies in the package.json
 */
export function scrambleDependencies(
  pkg: PackageJson,
  options: RouletteOptions
): { modified: PackageJson; scrambledDeps: Record<DependencyType, string[]>; issues: string[] } {
  const modified = JSON.parse(JSON.stringify(pkg)) as PackageJson;
  const scrambledDeps: Record<DependencyType, string[]> = {
    [DependencyType.DEPENDENCIES]: [],
    [DependencyType.DEV_DEPENDENCIES]: [],
    [DependencyType.PEER_DEPENDENCIES]: [],
    [DependencyType.OPTIONAL_DEPENDENCIES]: [],
  };
  
  const issues: string[] = [];
  const depTypes = options.dependencyTypes || DEFAULT_OPTIONS.dependencyTypes || [];
  const scramblePercentage = options.scramblePercentage || DEFAULT_OPTIONS.scramblePercentage || 30;
  const aggressionLevel = options.aggressionLevel || DEFAULT_OPTIONS.aggressionLevel || 5;
  const conflictMode = options.conflictMode || DEFAULT_OPTIONS.conflictMode || 'realistic';
  const respectMajorVersions = options.respectMajorVersions !== undefined ? 
      options.respectMajorVersions : DEFAULT_OPTIONS.respectMajorVersions;
  const versionConstraints = options.versionConstraints || DEFAULT_OPTIONS.versionConstraints || {};
  
  // Process each dependency type
  for (const depType of depTypes) {
    const deps = pkg[depType];
    if (deps && Object.keys(deps).length > 0) {
      // Calculate how many dependencies to scramble
      const totalDeps = Object.keys(deps).length;
      const scrambleCount = Math.ceil((totalDeps * scramblePercentage) / 100);
      
      // Select random dependencies to scramble
      const depsToScramble = Object.keys(deps)
        .sort(() => Math.random() - 0.5)
        .slice(0, scrambleCount);
      
      // Scramble selected dependencies
      for (const dep of depsToScramble) {
        const originalVersion = deps[dep];
        const newVersion = scrambleVersion(originalVersion || '', aggressionLevel, {
          conflictMode,
          packageName: dep,
          versionConstraints,
          respectMajorVersion: respectMajorVersions === true ? true : undefined
        });
        
        if (originalVersion !== newVersion) {
          if (modified[depType]) {
            modified[depType]![dep] = newVersion;
            scrambledDeps[depType].push(dep);
            
            // Generate information about the change for tracking issues
            const versionInfo = `${dep}: ${originalVersion} -> ${newVersion}`;
            issues.push(`Modified ${depType} ${versionInfo}`);
          }
        }
      }
      
      // Enhanced conflict generation based on conflict mode
      if (conflictMode === 'realistic' || conflictMode === 'peer-conflict') {
        createRealisticConflicts(pkg, modified, scrambledDeps, depType, issues, {
          aggressionLevel,
          conflictMode,
          versionConstraints
        });
      }
    }
  }
  
  return { modified, scrambledDeps, issues };
}

/**
 * Creates more realistic dependency conflicts based on various strategies
 */
export function createRealisticConflicts(
  original: PackageJson,
  modified: PackageJson,
  scrambledDeps: Record<DependencyType, string[]>,
  currentDepType: DependencyType,
  issues: string[],
  options: {
    aggressionLevel: number;
    conflictMode: string;
    versionConstraints?: Record<string, string>;
  }
): void {
  const { aggressionLevel, conflictMode } = options;
  const scaledAggression = aggressionLevel / 10;
  
  // Strategy 1: Create peer dependency conflicts (focused on this if peer-conflict mode)
  if (
    (currentDepType === DependencyType.PEER_DEPENDENCIES || 
     (conflictMode === 'peer-conflict' && Math.random() < 0.8)) &&
    original.dependencies &&
    Object.keys(original.dependencies).length > 0
  ) {
    // Find shared dependencies between peer and regular deps
    const peerDeps = original[DependencyType.PEER_DEPENDENCIES] || {};
    const sharedDeps = Object.keys(peerDeps).filter(dep => 
      original.dependencies && original.dependencies[dep]
    );
    
    if (sharedDeps.length > 0) {
      // Pick a random shared dependency or React (common peer dependency)
      const sharedDep = sharedDeps.includes('react') && Math.random() < 0.7 ? 
        'react' : sharedDeps[Math.floor(Math.random() * sharedDeps.length)];
      const regularVersion = original.dependencies && sharedDep ? original.dependencies[sharedDep] : undefined;
      
      // Create conflict strategies
      if (regularVersion && semver.valid(semver.coerce(regularVersion))) {
        const coercedRegular = semver.coerce(regularVersion);
        if (coercedRegular) {
          let conflictVersion: string;
          
          // Different conflict strategies
          const strategyChoice = Math.random();
          if (strategyChoice < 0.4) {
            // Strategy: Major version conflict
            const majorDiff = Math.floor(Math.random() * 2) + 1; // 1 or 2 major versions different
            conflictVersion = `^${coercedRegular.major + majorDiff}.0.0`;
          } else if (strategyChoice < 0.7) {
            // Strategy: Exact version requirement that's slightly different
            conflictVersion = `${coercedRegular.major}.${coercedRegular.minor}.${coercedRegular.patch + 1}`;
          } else {
            // Strategy: Incompatible range
            conflictVersion = `>=${coercedRegular.major}.${coercedRegular.minor + 2}.0 <${coercedRegular.major}.${coercedRegular.minor + 5}.0`;
          }
          
          if (modified[DependencyType.PEER_DEPENDENCIES]) {
            if (modified[DependencyType.PEER_DEPENDENCIES] && sharedDep) {
              modified[DependencyType.PEER_DEPENDENCIES][sharedDep] = conflictVersion;
            }
            if (sharedDep) {
              scrambledDeps[DependencyType.PEER_DEPENDENCIES].push(sharedDep);
            }
            issues.push(
              `Created peer dependency conflict for ${sharedDep}: regular=${regularVersion}, peer=${conflictVersion}`
            );
          }
        }
      }
    }
  }
  
  // Strategy 2: Create transitive dependency conflicts (when not focused on peer dependencies)
  if (conflictMode === 'realistic' && Math.random() < scaledAggression * 0.6) {
    // This simulates when two dependencies have conflicting sub-dependencies
    // Find popular packages that might have transitive dependencies
    const dependencies = original.dependencies || {};
    const depKeys = Object.keys(dependencies);
    
    // Common packages that often have transitive dependency requirements
    const popularPackages = [
      'react', 'react-dom', 'angular', '@angular/core', 'vue', 
      'express', 'next', 'gatsby', 'webpack'
    ];
    
    // Find if we have any of these packages
    const foundPopular = popularPackages.filter(pkg => 
      depKeys.some(dep => dep === pkg || dep.startsWith(`${pkg}/`))
    );
    
    if (foundPopular.length > 0 && modified.dependencies) {
      // Choose a popular package to create conflict for
      const targetPkg = foundPopular[Math.floor(Math.random() * foundPopular.length)];
      const matchingDeps = depKeys.filter(dep => dep === targetPkg || dep.startsWith(`${targetPkg}/`));
      
      if (matchingDeps.length > 0) {
        // Choose one of the matching deps
        const dep = matchingDeps[Math.floor(Math.random() * matchingDeps.length)];
        const originalVersion = dependencies && dep ? dependencies[dep] : undefined;
        
        // Create a version that would likely cause transitive dependency issues
        // For example, mixing React 16 and 17 components can cause issues
        if (originalVersion && semver.valid(semver.coerce(originalVersion))) {
          const coerced = semver.coerce(originalVersion);
          if (coerced) {
            // Force a minor version that would likely cause transitive dep issues
            // but keep the major version (to make it subtly difficult)
            const newMinor = Math.max(0, coerced.minor - Math.floor(Math.random() * 3) - 1);
            const newVersion = `${coerced.major}.${newMinor}.0`;
            
            // Define potential transitive conflicts
            const transitiveConflicts = [
              { name: '@babel/core', version: '^7.0.0', transitive: '@babel/preset-env', transVersion: '^7.18.0' },
              { name: 'webpack', version: '^4.0.0', transitive: 'html-webpack-plugin', transVersion: '^5.0.0' },
              { name: 'react', version: '^17.0.0', transitive: 'react-router-dom', transVersion: '^6.0.0' },
              { name: 'typescript', version: '^4.0.0', transitive: 'tslib', transVersion: '^2.5.0' },
            ];
            
            for (const conflict of transitiveConflicts) {
              const depVersion = dependencies[conflict.name];
              if (depVersion && !scrambledDeps[DependencyType.DEPENDENCIES].includes(conflict.name)) {
                modified.dependencies[conflict.name] = newVersion;
                scrambledDeps[DependencyType.DEPENDENCIES].push(conflict.name);
                issues.push(
                  `Created potential transitive dependency conflict for ${conflict.name}: ${depVersion} -> ${newVersion}`
                );
              }
            }
          }
        }
      }
    }
  }
  
  // Strategy 3: Create subtle version mismatches for related packages (e.g. @angular/* packages)
  if (conflictMode === 'realistic' && currentDepType === DependencyType.DEPENDENCIES) {
    const dependencies = original.dependencies || {};
    const depKeys = Object.keys(dependencies);
    
    // Find package groups (packages with the same prefix like @angular/)
    const prefixes = new Set<string>();
    for (const dep of depKeys) {
      const match = /^(@[^/]+\/|[^@][^/]+-)/.exec(dep);
      if (match && match[1]) {
        prefixes.add(match[1]);
      }
    }
    
    // For each prefix, potentially create subtle version mismatches
    for (const prefix of prefixes) {
      if (Math.random() < scaledAggression * 0.7) {
        const relatedPackages = depKeys.filter(dep => dep.startsWith(prefix));
        
        if (relatedPackages.length >= 2) {
          // Get the first package's version to base others on
          const basePkg = relatedPackages[0];
          const baseVersion = dependencies && basePkg ? dependencies[basePkg] : '';
          const baseMatch = baseVersion ? VERSION_RANGE_REGEX.exec(baseVersion) : null;
          
          if (baseMatch && modified.dependencies) {
            const [, baseModifier, baseMajor, baseMinor, basePatch] = baseMatch;
            
            // Make other packages in this group slightly different
            for (let i = 1; i < relatedPackages.length; i++) {
              if (Math.random() < 0.7) {
                const pkg = relatedPackages[i];
                // Create a slight version mismatch, keeping major version same
                // This is especially problematic for packages like Angular where
                // all @angular/* packages must have matching versions
                const newPatch = Number(basePatch) + Math.floor(Math.random() * 3) + 1;
                const newVersion = `${baseModifier || ''}${baseMajor}.${baseMinor}.${newPatch}`;
                
                if (modified.dependencies && pkg) {
                  modified.dependencies[pkg] = newVersion;
                }
                if (pkg) {
                  scrambledDeps[DependencyType.DEPENDENCIES].push(pkg);
                }
                issues.push(
                  `Created version mismatch for related package ${pkg}: ${dependencies && pkg ? dependencies[pkg] : ''} -> ${newVersion} (base: ${baseVersion})`
                );
              }
            }
          }
        }
      }
    }
  }

  // Function returns void, no return statement needed
}

/**
 * Main function to scramble a package.json file
 */
export async function scramblePackageJson(options: RouletteOptions = DEFAULT_OPTIONS): Promise<ScrambleResult> {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const targetPath = path.resolve(process.cwd(), mergedOptions.targetPath || './package.json');
  
  // Load the package.json
  const originalPkg = await loadPackageJson(targetPath);
  
  // Create backup if requested
  let backupPath: string | undefined;
  if (mergedOptions.createBackup) {
    backupPath = await createBackup(targetPath);
  }
  
  // Scramble the dependencies
  const { modified, scrambledDeps, issues } = scrambleDependencies(originalPkg, mergedOptions);
  
  // Save the modified package.json
  await savePackageJson(targetPath, modified);
  
  return {
    original: originalPkg,
    modified,
    scrambledDeps,
    backupPath: backupPath || '',
    issues,
  };
}

/**
 * Restores package.json from backup
 */
export async function restoreFromBackup(backupPath: string, targetPath?: string): Promise<void> {
  const target = targetPath || './package.json';
  const resolvedTarget = path.resolve(process.cwd(), target);
  
  try {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    await fs.writeFile(resolvedTarget, backupContent, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to restore from backup: ${String(error)}`);
  }
}
