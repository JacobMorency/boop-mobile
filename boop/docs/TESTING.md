# Testing Guide

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Structure

Tests are located in `__tests__/` directory, organized by feature:

- `__tests__/app/` - Main app screen tests
- `__tests__/components/` - Component-level tests

## P0 Tests (Implemented)

✅ **1. App Launch** - App initializes and shows main screen  
✅ **2. First-time Onboarding** - New user can complete onboarding  
✅ **3. Settings Modal Access** - User can open settings by long-pressing button  
✅ **4. View Pairing Code** - User can view and copy pairing code  
✅ **5. Send Boop (Paired)** - User can send a boop when paired  

## Running Specific Tests

```bash
# Run a specific test file
npm test -- app/index.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="App Launch"

# Run tests in a specific directory
npm test -- __tests__/components
```

## Test Coverage

Current coverage focuses on:
- User-facing flows (onboarding, pairing, booping)
- Critical paths that must never break
- Integration-level testing (not unit tests)

## CI/CD

Tests run automatically on:
- Pull requests to `main` or `master`
- Pushes to `main` or `master`

See `.github/workflows/test.yml` for CI configuration.

## Troubleshooting

### Tests failing with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that `jest.setup.js` has proper mocks

### AsyncStorage not working in tests
- Tests use mocked AsyncStorage - check `jest.setup.js`
- Storage is cleared between tests automatically

### Supabase calls failing
- All Supabase calls are mocked in tests
- Check that test mocks match expected API format

### Component not rendering
- Ensure ThemeProvider and other providers are wrapped
- Check that navigation mocks are configured in `jest.setup.js`

## Next Steps

After P0 tests pass, implement P1 tests:
- Device pairing flow
- Name update functionality
- Disconnect partner
- Rate limiting

See `docs/test-plan.md` for full test strategy.


