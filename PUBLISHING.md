# Publishing Guide for NPM Roulette

This document outlines the steps required to publish and maintain the NPM Roulette package.

## Prerequisites

- Node.js (v18 or newer)
- npm account (create one at https://www.npmjs.com/signup)

## First-time Setup

1. Login to npm from your terminal:

```bash
npm login
```

2. Update the `package.json` with your information:
   - Set your name as the author
   - Update the repository URL to point to your GitHub repository

## Before Publishing

1. Ensure all tests pass:

```bash
npm test
```

2. Build the package to make sure everything compiles correctly:

```bash
npm run build
```

3. Check what files will be included in the npm package:

```bash
npm pack --dry-run
```

4. Update the version number in `package.json` following semantic versioning:
   - Patch version (`1.0.x`): Bug fixes and minor changes
   - Minor version (`1.x.0`): New features, backwards-compatible
   - Major version (`x.0.0`): Breaking changes

## Publishing

To publish to npm:

```bash
npm publish
```

For testing before publishing to the main registry, you can use:

```bash
npm publish --dry-run
```

## Updating the Package

1. Make your changes and ensure tests pass
2. Update the version in `package.json`
3. Run `npm publish` to update the package

## Publishing a Beta Version

For beta releases:

```bash
npm version prerelease --preid=beta
npm publish --tag beta
```

Users can then install the beta with:

```bash
npm install npm-roulette@beta
```

## Maintenance

- Regularly update dependencies to keep the package secure
- Monitor issues on GitHub and respond to community feedback
- Consider adding additional features based on user feedback
- Update the README as needed to clarify usage

## Release Checklist

- [ ] Update version number
- [ ] Run tests
- [ ] Build package
- [ ] Check package contents
- [ ] Update changelog (if applicable)
- [ ] Publish to npm
- [ ] Create a GitHub release (if using GitHub)
- [ ] Announce the new version to users
