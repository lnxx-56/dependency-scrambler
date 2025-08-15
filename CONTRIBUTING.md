# Contributing to NPM Roulette

Thank you for considering contributing to NPM Roulette! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project.

## How to Contribute

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -am 'Add new feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Create a new Pull Request

## Development Setup

1. Clone your fork of the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Code Style

This project uses strict TypeScript with comprehensive type checking. Please follow these guidelines:

- Use the existing ESLint configuration
- Maintain strict typing (no `any` types)
- Write tests for new features
- Document public APIs with JSDoc comments

## Testing

Tests are written using Jest. Run the test suite with:

```bash
npm test
```

## Feature Requests and Bug Reports

If you have ideas for new features or have found a bug, please open an issue on the GitHub repository with a detailed description.

## Pull Request Process

1. Update the README.md or other documentation with details of your changes if appropriate
2. Update the tests to cover your changes
3. Ensure your code passes all tests and linting
4. Your pull request will be reviewed by the maintainers

## Release Process

The release process is documented in [PUBLISHING.md](PUBLISHING.md).

Thank you for contributing to NPM Roulette!
