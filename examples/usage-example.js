/**
 * Example of programmatically using NPM Roulette to create an interview challenge
 */
const path = require('path');
const { scramblePackageJson } = require('npm-roulette');

async function setupInterviewChallenge() {
  console.log('Setting up NPM Roulette interview challenge...');

  try {
    // Path to the target package.json to scramble
    const targetPath = path.join(__dirname, 'sample-project', 'package.json');

    // Scramble with custom options
    const result = await scramblePackageJson({
      targetPath,
      createBackup: true,
      scramblePercentage: 40,
      aggressionLevel: 7
    });

    console.log('Challenge created successfully!');
    console.log(`Backup saved to: ${result.backupPath}`);
    console.log('\nScrambled Dependencies:');
    
    // Print out the scrambled dependencies for reference
    for (const [type, deps] of Object.entries(result.scrambledDeps)) {
      if (deps.length > 0) {
        console.log(`\n${type}:`);
        deps.forEach(dep => {
          const originalVersion = result.original[type]?.[dep];
          const newVersion = result.modified[type]?.[dep];
          console.log(`  ${dep}: ${originalVersion} → ${newVersion}`);
        });
      }
    }

    console.log('\nInstruction for candidate:');
    console.log('-------------------------');
    console.log('1. Run "npm install" and observe the errors');
    console.log('2. Fix the dependency conflicts in package.json');
    console.log('3. Successfully run npm install WITHOUT using --force or --legacy-peer-deps flags');
    console.log('4. Document what issues you found and how you resolved them');

  } catch (error) {
    console.error('Error setting up challenge:', error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  setupInterviewChallenge().catch(console.error);
}

module.exports = setupInterviewChallenge;
