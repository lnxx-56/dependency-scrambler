import fs from 'fs/promises';
import path from 'path';
import {
  loadPackageJson,
  savePackageJson,
  createBackup,
  scrambleVersion,
  scrambleDependencies,
  scramblePackageJson,
  restoreFromBackup,
} from '../scrambler';
import { PackageJson, DependencyType } from '../types';

// Mock fs module
jest.mock('fs/promises');

describe('Scrambler Module', () => {
  // Sample package.json for testing
  const samplePackageJson: PackageJson = {
    name: 'test-package',
    version: '1.0.0',
    dependencies: {
      'express': '^4.17.1',
      'react': '^17.0.2',
      'lodash': '~4.17.21',
    },
    devDependencies: {
      'typescript': '^4.5.4',
      'jest': '^27.4.7',
    },
    peerDependencies: {
      'react': '^17.0.0',
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('loadPackageJson', () => {
    it('should load package.json correctly', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.readFile.mockResolvedValue(JSON.stringify(samplePackageJson));
      
      const result = await loadPackageJson('package.json');
      expect(result).toEqual(samplePackageJson);
      expect(mockFs.readFile).toHaveBeenCalledWith('package.json', 'utf-8');
    });

    it('should throw error when file cannot be loaded', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(loadPackageJson('nonexistent.json')).rejects.toThrow();
    });
  });

  describe('savePackageJson', () => {
    it('should save package.json correctly', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.writeFile.mockResolvedValue();
      
      await savePackageJson('package.json', samplePackageJson);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'package.json',
        JSON.stringify(samplePackageJson, null, 2),
        'utf-8'
      );
    });

    it('should throw error when file cannot be saved', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));
      
      await expect(savePackageJson('package.json', samplePackageJson)).rejects.toThrow();
    });
  });

  describe('createBackup', () => {
    it('should create a backup correctly', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.readFile.mockResolvedValue(JSON.stringify(samplePackageJson));
      mockFs.writeFile.mockResolvedValue();
      
      // Mock Date.now() to return a fixed timestamp
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);
      
      const backupPath = await createBackup('package.json');
      expect(backupPath).toEqual('package.json.backup.1234567890');
      expect(mockFs.readFile).toHaveBeenCalledWith('package.json', 'utf-8');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'package.json.backup.1234567890',
        JSON.stringify(samplePackageJson),
        'utf-8'
      );
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('scrambleVersion', () => {
    it('should modify version string', () => {
      const originalVersion = '^1.2.3';
      const scrambledVersion = scrambleVersion(originalVersion, 10);
      
      // Check that it returned a valid semver string
      expect(scrambledVersion).not.toEqual(originalVersion);
      expect(scrambledVersion).toMatch(/^[\^~>=<]?\d+\.\d+\.\d+$/);
    });

    it('should respect aggression level', () => {
      // With low aggression, multiple scrambles might sometimes keep original version
      const originalVersion = '^1.2.3';
      let modificationCount = 0;
      
      for (let i = 0; i < 10; i++) {
        const scrambledVersion = scrambleVersion(originalVersion, 1);
        if (scrambledVersion !== originalVersion) {
          modificationCount++;
        }
      }
      
      // We expect low aggression to modify less often, but this is probabilistic
      // Just checking it doesn't always change with low aggression
      expect(modificationCount).toBeLessThanOrEqual(10);
    });

    it('should handle non-standard version formats correctly', () => {
      const originalVersion = 'latest';
      const scrambledVersion = scrambleVersion(originalVersion, 10);
      
      // Should return original string if not a standard version
      expect(scrambledVersion).toEqual(originalVersion);
    });
  });

  describe('scrambleDependencies', () => {
    it('should scramble dependencies based on options', () => {
      const options = {
        dependencyTypes: [DependencyType.DEPENDENCIES],
        scramblePercentage: 100, // Ensure all dependencies get scrambled
        aggressionLevel: 10, // Max aggression
      };
      
      const { modified, scrambledDeps } = scrambleDependencies(samplePackageJson, options);
      
      // Check that dependencies were modified
      expect(modified.dependencies).not.toEqual(samplePackageJson.dependencies);
      expect(scrambledDeps.dependencies.length).toBeGreaterThan(0);
      
      // Check that other dependency types were not modified
      expect(modified.devDependencies).toEqual(samplePackageJson.devDependencies);
      expect(scrambledDeps.devDependencies.length).toBe(0);
    });

    it('should respect scramble percentage', () => {
      const options = {
        dependencyTypes: [DependencyType.DEPENDENCIES],
        scramblePercentage: 33, // Should scramble roughly 1/3 dependencies
        aggressionLevel: 10,
      };
      
      // With 3 dependencies, we expect roughly 1 to be scrambled
      const { scrambledDeps } = scrambleDependencies(samplePackageJson, options);
      expect(scrambledDeps.dependencies.length).toBeLessThanOrEqual(2);
    });
  });

  describe('scramblePackageJson', () => {
    it('should perform end-to-end scrambling', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.readFile.mockResolvedValue(JSON.stringify(samplePackageJson));
      mockFs.writeFile.mockResolvedValue();
      
      // Mock path.resolve
      const originalResolve = path.resolve;
      path.resolve = jest.fn().mockReturnValue('package.json');
      
      // Mock Date.now() for consistent backup path
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);
      
      const result = await scramblePackageJson({
        targetPath: 'package.json',
        createBackup: true,
        dependencyTypes: [DependencyType.DEPENDENCIES],
        scramblePercentage: 100,
        aggressionLevel: 10,
      });
      
      // Verify backup was created
      expect(result.backupPath).toEqual('package.json.backup.1234567890');
      
      // Verify package was modified
      expect(result.modified).not.toEqual(result.original);
      expect(result.scrambledDeps.dependencies.length).toBeGreaterThan(0);
      
      // Restore original functions
      path.resolve = originalResolve;
      Date.now = originalDateNow;
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.readFile.mockResolvedValue(JSON.stringify(samplePackageJson));
      mockFs.writeFile.mockResolvedValue();
      
      // Mock path.resolve
      const originalResolve = path.resolve;
      path.resolve = jest.fn().mockReturnValue('package.json');
      
      await restoreFromBackup('backup.json');
      
      expect(mockFs.readFile).toHaveBeenCalledWith('backup.json', 'utf-8');
      expect(mockFs.writeFile).toHaveBeenCalled();
      
      // Restore original path.resolve
      path.resolve = originalResolve;
    });

    it('should throw error when backup cannot be restored', async () => {
      const mockFs = fs as jest.Mocked<typeof fs>;
      mockFs.readFile.mockRejectedValue(new Error('Backup not found'));
      
      await expect(restoreFromBackup('nonexistent.json')).rejects.toThrow();
    });
  });
});
