# SpendSavvy E2E Tests with Puppeteer

This directory contains end-to-end tests for the SpendSavvy application using Puppeteer and Jest.

## Test Structure

```
tests/
├── e2e/
│   ├── auth.test.ts       # Authentication tests (login, register, logout)
│   ├── shopping.test.ts   # Shopping flow tests (browse, cart, checkout)
│   └── admin.test.ts      # Admin functionality tests
├── screenshots/           # Screenshots taken on test failures
├── setup.ts              # Test utilities and helpers
└── README.md             # This file
```

## Prerequisites

1. Make sure the database is set up and seeded:
```bash
npm run db:push
npx tsx scripts/seed-db.ts
```

2. Ensure test users exist:
- Admin: username: `admin`, password: `admin123`
- User: username: `testuser`, password: `test123`

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test suites
```bash
npm run test:auth      # Authentication tests only
npm run test:shopping  # Shopping flow tests only
npm run test:admin     # Admin tests only
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run all E2E tests
```bash
npm run test:e2e
```

## Test Configuration

Tests are configured to:
- Run with headless browser (can be changed in `setup.ts`)
- Take screenshots on failure (saved to `tests/screenshots/`)
- Use a test server on port 5173
- Timeout after 30 seconds per test

## Writing New Tests

### Test Structure
```typescript
describe('Feature Name', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    await startServer();
    browser = await initBrowser();
  });

  afterAll(async () => {
    await closeBrowser();
    await stopServer();
  });

  beforeEach(async () => {
    page = await newPage();
  });

  it('should do something', async () => {
    await page.goto(TEST_URL);
    // Your test code here
  });
});
```

### Available Helpers

The `setup.ts` file provides several helper functions:

- `startServer()` - Starts the dev server
- `stopServer()` - Stops the dev server
- `initBrowser()` - Initializes Puppeteer browser
- `newPage()` - Creates a new browser page
- `login(page, username, password)` - Helper to login
- `logout(page)` - Helper to logout
- `takeScreenshot(page, name)` - Take a screenshot
- `waitForNavigation(page)` - Wait for page navigation

### Data Test IDs

Tests rely on `data-testid` attributes in the React components. Make sure to add these attributes when creating new features:

```tsx
<button data-testid="submit-button">Submit</button>
```

Common test IDs used:
- Authentication: `login-username`, `login-password`, `register-username`, etc.
- Navigation: `user-menu`, `admin-menu`, `cart-link`
- Products: `product-card`, `add-to-cart`, `product-details`
- Cart: `cart-badge`, `cart-page`, `checkout-button`
- Admin: `admin-panel`, `product-form`, `users-table`

## Debugging Tests

### Run tests with visible browser
Edit `setup.ts` and set `headless: false` in the Puppeteer launch options.

### Slow down test execution
Add delays to see what's happening:
```typescript
await page.waitForTimeout(1000); // Wait 1 second
```

### Take screenshots during tests
```typescript
await takeScreenshot(page, 'step-name');
```

### View console logs
Console logs from the browser are captured and displayed in the test output.

## Common Issues

### Tests timing out
- Increase timeout in `jest.config.js`
- Check if selectors are correct
- Ensure the server is running properly

### Elements not found
- Check if `data-testid` attributes exist
- Wait for elements to be visible: `await page.waitForSelector('#id', { visible: true })`
- Check if authentication is required

### Server not starting
- Check if port 5173 is available
- Ensure all dependencies are installed
- Check for TypeScript compilation errors

## CI/CD Integration

For CI/CD pipelines, set these environment variables:
- `HEADLESS=true` - Run browser in headless mode
- `CI=true` - Optimize for CI environment

Example GitHub Actions workflow:
```yaml
- name: Run E2E Tests
  env:
    HEADLESS: true
    CI: true
  run: |
    npm install
    npm run db:push
    npm test
```