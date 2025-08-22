import { Browser, Page } from 'puppeteer';
import {
  startServer,
  stopServer,
  initBrowser,
  closeBrowser,
  newPage,
  TEST_URL,
  TEST_USERS,
  login,
  takeScreenshot,
} from '../setup';

describe('Admin Functionality E2E Tests', () => {
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
    // Login as admin for all admin tests
    await login(page, TEST_USERS.admin.username, TEST_USERS.admin.password);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Admin Panel Access', () => {
    it('should show admin menu for admin users', async () => {
      // Admin menu should be visible after login
      const adminMenu = await page.waitForSelector('[data-testid="admin-menu"]', {
        timeout: 5000,
      });
      expect(adminMenu).toBeTruthy();
    });

    it('should navigate to admin panel', async () => {
      // Click admin menu
      await page.click('[data-testid="admin-menu"]');
      
      // Click admin panel link
      await page.click('[data-testid="admin-panel-link"]');
      
      // Wait for admin panel
      await page.waitForSelector('[data-testid="admin-panel"]', {
        timeout: 5000,
      });
      
      // Check URL
      const url = page.url();
      expect(url).toContain('/admin');
      
      // Check admin panel sections
      const sections = await page.$$('[data-testid="admin-section"]');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Product Management', () => {
    beforeEach(async () => {
      // Navigate to product management
      await page.goto(`${TEST_URL}/admin/products`);
      await page.waitForSelector('[data-testid="product-management"]');
    });

    it('should display product list', async () => {
      // Wait for products table
      await page.waitForSelector('[data-testid="products-table"]', {
        timeout: 5000,
      });
      
      // Check for product rows
      const productRows = await page.$$('[data-testid="product-row"]');
      expect(productRows.length).toBeGreaterThan(0);
      
      // Check for action buttons
      const editButtons = await page.$$('[data-testid="edit-product"]');
      const deleteButtons = await page.$$('[data-testid="delete-product"]');
      
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should add new product', async () => {
      // Click add product button
      await page.click('[data-testid="add-product-button"]');
      
      // Wait for add product form
      await page.waitForSelector('[data-testid="product-form"]', {
        timeout: 5000,
      });
      
      // Fill product form
      await page.type('[data-testid="product-title"]', 'Test Product');
      await page.type('[data-testid="product-description"]', 'This is a test product description');
      await page.type('[data-testid="product-price"]', '99.99');
      await page.type('[data-testid="product-stock"]', '10');
      
      // Select category
      await page.select('[data-testid="product-category"]', 'shop');
      
      // Select type
      await page.select('[data-testid="product-type"]', 'license_key');
      
      // Add delivery content
      await page.type('[data-testid="delivery-text"]', 'TEST-LICENSE-KEY-123');
      
      // Submit form
      await page.click('[data-testid="save-product"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]', {
        timeout: 5000,
      });
      
      // Verify product was added
      const successText = await page.$eval(
        '[data-testid="success-message"]',
        (el) => el.textContent
      );
      expect(successText).toContain('success');
    });

    it('should edit existing product', async () => {
      // Click edit on first product
      const editButtons = await page.$$('[data-testid="edit-product"]');
      await editButtons[0].click();
      
      // Wait for edit form
      await page.waitForSelector('[data-testid="product-form"]', {
        timeout: 5000,
      });
      
      // Update product title
      const titleInput = await page.$('[data-testid="product-title"]');
      await titleInput?.click({ clickCount: 3 }); // Select all
      await titleInput?.type('Updated Product Title');
      
      // Update price
      const priceInput = await page.$('[data-testid="product-price"]');
      await priceInput?.click({ clickCount: 3 });
      await priceInput?.type('149.99');
      
      // Save changes
      await page.click('[data-testid="save-product"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]', {
        timeout: 5000,
      });
      
      const successText = await page.$eval(
        '[data-testid="success-message"]',
        (el) => el.textContent
      );
      expect(successText).toContain('updated');
    });

    it('should delete product', async () => {
      // Get initial product count
      const initialRows = await page.$$('[data-testid="product-row"]');
      const initialCount = initialRows.length;
      
      // Click delete on first product
      const deleteButtons = await page.$$('[data-testid="delete-product"]');
      await deleteButtons[0].click();
      
      // Confirm deletion
      await page.waitForSelector('[data-testid="confirm-delete"]');
      await page.click('[data-testid="confirm-delete"]');
      
      // Wait for deletion
      await page.waitForTimeout(1000);
      
      // Check product count decreased
      const finalRows = await page.$$('[data-testid="product-row"]');
      const finalCount = finalRows.length;
      
      expect(finalCount).toBe(initialCount - 1);
    });

    it('should toggle product active status', async () => {
      // Find toggle switch
      const toggleSwitches = await page.$$('[data-testid="product-active-toggle"]');
      
      if (toggleSwitches.length > 0) {
        // Get initial state
        const initialState = await toggleSwitches[0].evaluate((el: any) => 
          el.getAttribute('aria-checked')
        );
        
        // Click toggle
        await toggleSwitches[0].click();
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Check state changed
        const newState = await toggleSwitches[0].evaluate((el: any) => 
          el.getAttribute('aria-checked')
        );
        
        expect(newState).not.toBe(initialState);
      }
    });
  });

  describe('User Management', () => {
    beforeEach(async () => {
      // Navigate to user management
      await page.goto(`${TEST_URL}/admin/users`);
      await page.waitForSelector('[data-testid="user-management"]');
    });

    it('should display user list', async () => {
      // Wait for users table
      await page.waitForSelector('[data-testid="users-table"]', {
        timeout: 5000,
      });
      
      // Check for user rows
      const userRows = await page.$$('[data-testid="user-row"]');
      expect(userRows.length).toBeGreaterThan(0);
      
      // Check for user details
      const firstUser = userRows[0];
      const username = await firstUser.$('[data-testid="user-username"]');
      const role = await firstUser.$('[data-testid="user-role"]');
      const balance = await firstUser.$('[data-testid="user-balance"]');
      
      expect(username).toBeTruthy();
      expect(role).toBeTruthy();
      expect(balance).toBeTruthy();
    });

    it('should edit user balance', async () => {
      // Click edit on first non-admin user
      const editButtons = await page.$$('[data-testid="edit-user"]');
      
      if (editButtons.length > 0) {
        await editButtons[0].click();
        
        // Wait for edit form
        await page.waitForSelector('[data-testid="user-edit-form"]');
        
        // Update balance
        const balanceInput = await page.$('[data-testid="user-balance-input"]');
        await balanceInput?.click({ clickCount: 3 });
        await balanceInput?.type('500.00');
        
        // Save changes
        await page.click('[data-testid="save-user"]');
        
        // Wait for success
        await page.waitForSelector('[data-testid="success-message"]');
        
        const successText = await page.$eval(
          '[data-testid="success-message"]',
          (el) => el.textContent
        );
        expect(successText).toContain('updated');
      }
    });

    it('should change user role', async () => {
      // Find a non-admin user
      const roleSelects = await page.$$('[data-testid="user-role-select"]');
      
      if (roleSelects.length > 1) { // Skip first (admin) user
        // Change role
        await roleSelects[1].select('admin');
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Verify role changed
        const newRole = await roleSelects[1].evaluate((el: any) => el.value);
        expect(newRole).toBe('admin');
      }
    });
  });

  describe('Order Management', () => {
    beforeEach(async () => {
      // Navigate to order management
      await page.goto(`${TEST_URL}/admin/orders`);
      await page.waitForSelector('[data-testid="order-management"]');
    });

    it('should display all orders', async () => {
      // Wait for orders table
      await page.waitForSelector('[data-testid="orders-table"]', {
        timeout: 5000,
      });
      
      // Check for order rows
      const orderRows = await page.$$('[data-testid="order-row"]');
      
      // Check order details if orders exist
      if (orderRows.length > 0) {
        const firstOrder = orderRows[0];
        const orderId = await firstOrder.$('[data-testid="order-id"]');
        const customer = await firstOrder.$('[data-testid="order-customer"]');
        const status = await firstOrder.$('[data-testid="order-status"]');
        const total = await firstOrder.$('[data-testid="order-total"]');
        
        expect(orderId).toBeTruthy();
        expect(customer).toBeTruthy();
        expect(status).toBeTruthy();
        expect(total).toBeTruthy();
      }
    });

    it('should update order status', async () => {
      const statusSelects = await page.$$('[data-testid="order-status-select"]');
      
      if (statusSelects.length > 0) {
        // Change status
        await statusSelects[0].select('completed');
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Verify status changed
        const newStatus = await statusSelects[0].evaluate((el: any) => el.value);
        expect(newStatus).toBe('completed');
      }
    });

    it('should view order details', async () => {
      const orderRows = await page.$$('[data-testid="order-row"]');
      
      if (orderRows.length > 0) {
        // Click view details
        await orderRows[0].click('[data-testid="view-order"]');
        
        // Wait for order details modal
        await page.waitForSelector('[data-testid="order-details-modal"]');
        
        // Check order details
        const orderItems = await page.$('[data-testid="order-items-list"]');
        const customerInfo = await page.$('[data-testid="customer-info"]');
        const deliveryData = await page.$('[data-testid="delivery-data"]');
        
        expect(orderItems).toBeTruthy();
        expect(customerInfo).toBeTruthy();
        expect(deliveryData).toBeTruthy();
      }
    });
  });

  describe('Statistics Dashboard', () => {
    it('should display statistics overview', async () => {
      // Navigate to admin dashboard
      await page.goto(`${TEST_URL}/admin`);
      await page.waitForSelector('[data-testid="admin-dashboard"]');
      
      // Check for statistics cards
      const statsCards = await page.$$('[data-testid="stat-card"]');
      expect(statsCards.length).toBeGreaterThan(0);
      
      // Check for specific stats
      const totalRevenue = await page.$('[data-testid="total-revenue"]');
      const totalOrders = await page.$('[data-testid="total-orders"]');
      const totalUsers = await page.$('[data-testid="total-users"]');
      const totalProducts = await page.$('[data-testid="total-products"]');
      
      expect(totalRevenue).toBeTruthy();
      expect(totalOrders).toBeTruthy();
      expect(totalUsers).toBeTruthy();
      expect(totalProducts).toBeTruthy();
    });

    it('should display recent activity', async () => {
      await page.goto(`${TEST_URL}/admin`);
      await page.waitForSelector('[data-testid="admin-dashboard"]');
      
      // Check for recent orders
      const recentOrders = await page.$('[data-testid="recent-orders"]');
      expect(recentOrders).toBeTruthy();
      
      // Check for recent users
      const recentUsers = await page.$('[data-testid="recent-users"]');
      expect(recentUsers).toBeTruthy();
    });
  });

  describe('Invite Code Management', () => {
    beforeEach(async () => {
      await page.goto(`${TEST_URL}/admin/invites`);
      await page.waitForSelector('[data-testid="invite-management"]');
    });

    it('should display invite codes', async () => {
      // Wait for invite codes table
      await page.waitForSelector('[data-testid="invites-table"]');
      
      // Check for invite rows
      const inviteRows = await page.$$('[data-testid="invite-row"]');
      expect(inviteRows.length).toBeGreaterThan(0);
    });

    it('should create new invite code', async () => {
      // Click create invite button
      await page.click('[data-testid="create-invite"]');
      
      // Wait for form
      await page.waitForSelector('[data-testid="invite-form"]');
      
      // Fill form
      await page.type('[data-testid="invite-code"]', `TEST${Date.now()}`);
      await page.type('[data-testid="max-uses"]', '10');
      
      // Submit
      await page.click('[data-testid="save-invite"]');
      
      // Wait for success
      await page.waitForSelector('[data-testid="success-message"]');
      
      const successText = await page.$eval(
        '[data-testid="success-message"]',
        (el) => el.textContent
      );
      expect(successText).toContain('created');
    });

    it('should deactivate invite code', async () => {
      const deactivateButtons = await page.$$('[data-testid="deactivate-invite"]');
      
      if (deactivateButtons.length > 0) {
        await deactivateButtons[0].click();
        
        // Confirm deactivation
        await page.waitForSelector('[data-testid="confirm-deactivate"]');
        await page.click('[data-testid="confirm-deactivate"]');
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Check status changed
        const statusBadge = await page.$('[data-testid="invite-status"]');
        const statusText = await statusBadge?.evaluate((el) => el.textContent);
        expect(statusText).toContain('inactive');
      }
    });
  });
});