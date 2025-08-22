import { Browser, Page } from 'puppeteer';
import {
  startServer,
  stopServer,
  initBrowser,
  closeBrowser,
  newPage,
  TEST_URL,
  TEST_USERS,
  takeScreenshot,
} from '../setup';

describe('Authentication E2E Tests', () => {
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

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Login Flow', () => {
    it('should display login form on landing page', async () => {
      await page.goto(TEST_URL);
      
      // Wait for login form to be visible
      await page.waitForSelector('#login-username', { visible: true });
      
      // Check for login elements
      const usernameInput = await page.$('#login-username');
      const passwordInput = await page.$('#login-password');
      const loginButton = await page.$('button[type="submit"]');
      
      expect(usernameInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(loginButton).toBeTruthy();
      
      // Check for login tab
      const loginTab = await page.$eval(
        'button[role="tab"]',
        (el) => el.textContent
      );
      expect(loginTab).toContain('Login');
    });

    it('should show error with invalid credentials', async () => {
      await page.goto(TEST_URL);
      await page.waitForSelector('#login-username');
      
      // Enter invalid credentials
      await page.type('#login-username', 'wronguser');
      await page.type('#login-password', 'wrongpass');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });
      
      const errorText = await page.$eval(
        '[role="alert"]',
        (el) => el.textContent
      );
      expect(errorText).toContain('Invalid');
    });

    it('should login successfully with valid credentials', async () => {
      await page.goto(TEST_URL);
      await page.waitForSelector('#login-username');
      
      // Enter valid admin credentials
      await page.type('#login-username', TEST_USERS.admin.username);
      await page.type('#login-password', TEST_USERS.admin.password);
      
      // Submit form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]'),
      ]);
      
      // Should redirect to shop page
      const url = page.url();
      expect(url).toContain('/shop');
      
      // Should show user menu
      const userMenu = await page.waitForSelector('[data-testid="user-menu"]', {
        timeout: 5000,
      });
      expect(userMenu).toBeTruthy();
    });
  });

  describe('Registration Flow', () => {
    it('should switch to registration tab', async () => {
      await page.goto(TEST_URL);
      await page.waitForSelector('button[role="tab"]');
      
      // Click on Register tab
      const registerTabs = await page.$$('button[role="tab"]');
      await registerTabs[1].click(); // Second tab is Register
      
      // Wait for registration form
      await page.waitForSelector('#register-username', { visible: true });
      
      // Check for registration elements
      const usernameInput = await page.$('#register-username');
      const passwordInput = await page.$('#register-password');
      const inviteCodeInput = await page.$('#register-inviteCode');
      
      expect(usernameInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(inviteCodeInput).toBeTruthy();
    });

    it('should show error without invite code', async () => {
      await page.goto(TEST_URL);
      
      // Switch to Register tab
      const registerTabs = await page.$$('button[role="tab"]');
      await registerTabs[1].click();
      
      await page.waitForSelector('#register-username');
      
      // Fill registration form without invite code
      await page.type('#register-username', 'newuser');
      await page.type('#register-password', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });
      
      const errorText = await page.$eval(
        '[role="alert"]',
        (el) => el.textContent
      );
      expect(errorText).toContain('invite');
    });

    it('should register with valid invite code', async () => {
      await page.goto(TEST_URL);
      
      // Switch to Register tab
      const registerTabs = await page.$$('button[role="tab"]');
      await registerTabs[1].click();
      
      await page.waitForSelector('#register-username');
      
      // Generate unique username
      const username = `user_${Date.now()}`;
      
      // Fill registration form with invite code
      await page.type('#register-username', username);
      await page.type('#register-password', 'password123');
      await page.type('#register-inviteCode', 'WELCOME2025'); // Default invite code
      
      // Submit form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]'),
      ]);
      
      // Should redirect to shop after successful registration
      const url = page.url();
      expect(url).toContain('/shop');
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      // First login
      await page.goto(TEST_URL);
      await page.waitForSelector('#login-username');
      
      await page.type('#login-username', TEST_USERS.admin.username);
      await page.type('#login-password', TEST_USERS.admin.password);
      
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
      ]);
      
      // Click user menu
      await page.click('[data-testid="user-menu"]');
      
      // Click logout
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect back to login page
      await page.waitForSelector('#login-username', { timeout: 5000 });
      const url = page.url();
      expect(url).toBe(TEST_URL + '/');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across page refreshes', async () => {
      // Login
      await page.goto(TEST_URL);
      await page.waitForSelector('#login-username');
      
      await page.type('#login-username', TEST_USERS.admin.username);
      await page.type('#login-password', TEST_USERS.admin.password);
      
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
      ]);
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      const userMenu = await page.waitForSelector('[data-testid="user-menu"]', {
        timeout: 5000,
      });
      expect(userMenu).toBeTruthy();
      
      // Should still be on shop page
      const url = page.url();
      expect(url).toContain('/shop');
    });
  });
});