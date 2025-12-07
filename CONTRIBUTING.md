# Contributing to uSDR Development Board Dashboard

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions. We're building tools for the SDR community and welcome contributors of all skill levels.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Valentine-RF/Wavelet-Lab-uSDR-Board-Configurator/issues)
2. Use the bug report template
3. Include detailed steps to reproduce
4. Add screenshots or logs if applicable

### Suggesting Features

1. Check existing [feature requests](https://github.com/Valentine-RF/Wavelet-Lab-uSDR-Board-Configurator/issues?q=is%3Aissue+label%3Aenhancement)
2. Use the feature request template
3. Explain the use case and benefits
4. Consider implementation complexity

### Pull Requests

1. **Fork the repository** and create a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following the code style guidelines below

3. **Test your changes** thoroughly
   ```bash
   pnpm test
   pnpm build
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature: description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/amazing-feature
   ```

## Development Setup

### Prerequisites
- Node.js 22.13.0+
- pnpm 8.0+
- MySQL 8.0+ or TiDB

### Local Setup
```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/Wavelet-Lab-uSDR-Board-Configurator.git
cd Wavelet-Lab-uSDR-Board-Configurator

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
pnpm db:push

# Start development server
pnpm dev
```

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code formatting (Prettier)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Avoid `any` types - use proper typing

### React Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use shadcn/ui components when possible
- Follow the existing component structure

### CSS/Styling
- Use Tailwind CSS utility classes
- Follow the existing design system (see `docs/design/`)
- Maintain the cyberpunk aesthetic
- Ensure responsive design (mobile-first)
- Test on multiple screen sizes

### Backend/API
- Use tRPC procedures for all API endpoints
- Add input validation with Zod schemas
- Handle errors gracefully with proper error messages
- Add tests for new procedures
- Document complex business logic

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test auth.logout.test.ts

# Watch mode
pnpm test --watch
```

### Writing Tests
- Add tests for new features
- Use Vitest for unit and integration tests
- Mock external dependencies
- Test both success and error cases
- Aim for >80% code coverage

## Documentation

When adding features:
1. Update relevant documentation in `docs/`
2. Add JSDoc comments to functions
3. Update README if needed
4. Include examples in code comments

## Commit Message Guidelines

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(templates): add LoRa monitoring template
fix(validation): correct frequency range check for trx_wide
docs(readme): update installation instructions
```

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and helpers
│   │   └── hooks/       # Custom React hooks
├── server/              # Backend Express + tRPC
│   ├── _core/           # Framework code (don't modify)
│   ├── routers.ts       # tRPC API routes
│   └── db.ts            # Database queries
├── drizzle/             # Database schema and migrations
├── docs/                # Documentation
└── presentation/        # Feature showcase slides
```

## Review Process

1. All pull requests require review before merging
2. Automated tests must pass
3. Code must follow style guidelines
4. Documentation must be updated
5. No merge conflicts with main branch

## Getting Help

- **Questions**: Open a [discussion](https://github.com/Valentine-RF/Wavelet-Lab-uSDR-Board-Configurator/discussions)
- **Issues**: Use the issue templates
- **Wavelet Lab**: Contact via [waveletlab.com](https://waveletlab.com)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the uSDR Development Board Dashboard! 🎉
