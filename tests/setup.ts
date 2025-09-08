import { spawn, ChildProcess } from 'child_process';
import puppeteer, { Browser, Page } from 'puppeteer';

let serverProcess: ChildProcess;
let browser: Browser;
let page: Page;

export const TEST_PORT = 5173;
export const TEST_URL = `http://localhost:${TEST_PORT}`;

// Test user credentials
export const TEST_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  user: {
    username: 'testuser',
    password: 'user123',
  }
};

// Start the dev server before running tests
export async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, PORT: TEST_PORT.toString() },
      shell: true,
    });

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      if (output.includes('ready in') || output.includes('Local:')) {
        setTimeout(resolve, 2000); // Give server time to fully initialize
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('error', reject);

    // Timeout after 30 seconds
    setTimeout(() => reject(new Error('Server failed to start')), 30000);
  });
}

// Stop the server after tests
export async function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess.on('close', () => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Initialize Puppeteer browser
export async function initBrowser(): Promise<Browser> {
  browser = await puppeteer.launch({
    headless: false, // Always run in headful mode
    slowMo: 250, // Slow down actions for visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1280,
      height: 720,
    },
  });
  return browser;
}

// Get a new page
export async function newPage(): Promise<Page> {
  if (!browser) {
    await initBrowser();
  }
  page = await browser.newPage();
  
  // Set up console log capture
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('Browser Console Error:', msg.text());
    }
  });

  // Set up request interception for debugging
  page.on('requestfailed', (request) => {
    console.error('Request Failed:', request.url(), request.failure()?.errorText);
  });

  return page;
}

// Close browser
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
  }
}

// Helper function to wait for navigation
export async function waitForNavigation(page: Page): Promise<void> {
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
}

// Helper function to login
export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto(TEST_URL);
  await page.waitForSelector('#login-username', { timeout: 5000 });
  
  // Fill login form
  await page.type('#login-username', username);
  await page.type('#login-password', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

// Helper function to logout
export async function logout(page: Page): Promise<void> {
  // Click on user menu
  await page.click('[data-testid="user-menu"]');
  
  // Click logout
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to login page
  await page.waitForSelector('#login-username', { timeout: 5000 });
}

// Helper function to take screenshot on failure
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ 
    path: `tests/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

// Clean up function
export async function cleanup(): Promise<void> {
  await closeBrowser();
  await stopServer();
}