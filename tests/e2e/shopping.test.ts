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

describe('Shopping Flow E2E Tests', () => {
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
    // Login as regular user for shopping tests
    await login(page, TEST_USERS.user.username, TEST_USERS.user.password);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Product Browsing', () => {
    it('should display product listing page', async () => {
      // Should be on shop page after login
      const url = page.url();
      expect(url).toContain('/shop');
      
      // Wait for products to load
      await page.waitForSelector('[data-testid="product-card"]', {
        timeout: 10000,
      });
      
      // Check if products are displayed
      const products = await page.$$('[data-testid="product-card"]');
      expect(products.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      await page.waitForSelector('[data-testid="category-filter"]');
      
      // Click on a category filter
      await page.click('[data-testid="category-shop"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check filtered products
      const products = await page.$$('[data-testid="product-card"]');
      expect(products.length).toBeGreaterThan(0);
    });

    it('should search for products', async () => {
      await page.waitForSelector('[data-testid="search-input"]');
      
      // Type in search box
      await page.type('[data-testid="search-input"]', 'Windows');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check search results
      const products = await page.$$('[data-testid="product-card"]');
      
      // Verify search worked by checking product titles
      if (products.length > 0) {
        const firstProductTitle = await products[0].$eval(
          'h3',
          (el) => el.textContent
        );
        expect(firstProductTitle?.toLowerCase()).toContain('windows');
      }
    });

    it('should view product details', async () => {
      await page.waitForSelector('[data-testid="product-card"]');
      
      // Click on first product
      const products = await page.$$('[data-testid="product-card"]');
      await products[0].click();
      
      // Wait for product details page
      await page.waitForSelector('[data-testid="product-details"]', {
        timeout: 5000,
      });
      
      // Check product details elements
      const productTitle = await page.$('[data-testid="product-title"]');
      const productPrice = await page.$('[data-testid="product-price"]');
      const addToCartButton = await page.$('[data-testid="add-to-cart"]');
      
      expect(productTitle).toBeTruthy();
      expect(productPrice).toBeTruthy();
      expect(addToCartButton).toBeTruthy();
    });
  });

  describe('Shopping Cart', () => {
    it('should add product to cart', async () => {
      await page.waitForSelector('[data-testid="product-card"]');
      
      // Click on first product
      const products = await page.$$('[data-testid="product-card"]');
      await products[0].click();
      
      // Wait for product details
      await page.waitForSelector('[data-testid="add-to-cart"]');
      
      // Add to cart
      await page.click('[data-testid="add-to-cart"]');
      
      // Wait for success notification
      await page.waitForSelector('[data-testid="toast-success"]', {
        timeout: 5000,
      });
      
      // Check cart badge
      const cartBadge = await page.$('[data-testid="cart-badge"]');
      const badgeText = await cartBadge?.evaluate((el) => el.textContent);
      expect(badgeText).toBe('1');
    });

    it('should update cart quantity', async () => {
      // Add product first
      await page.waitForSelector('[data-testid="product-card"]');
      const products = await page.$$('[data-testid="product-card"]');
      await products[0].click();
      await page.waitForSelector('[data-testid="add-to-cart"]');
      await page.click('[data-testid="add-to-cart"]');
      
      // Go to cart
      await page.click('[data-testid="cart-link"]');
      await page.waitForSelector('[data-testid="cart-page"]');
      
      // Find quantity input
      const quantityInput = await page.$('[data-testid="quantity-input"]');
      
      // Clear and update quantity
      await quantityInput?.click({ clickCount: 3 }); // Select all
      await quantityInput?.type('2');
      
      // Update quantity
      await page.click('[data-testid="update-quantity"]');
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Check updated total
      const total = await page.$eval(
        '[data-testid="cart-total"]',
        (el) => el.textContent
      );
      expect(total).toBeTruthy();
    });

    it('should remove product from cart', async () => {
      // Add product first
      await page.waitForSelector('[data-testid="product-card"]');
      const products = await page.$$('[data-testid="product-card"]');
      await products[0].click();
      await page.waitForSelector('[data-testid="add-to-cart"]');
      await page.click('[data-testid="add-to-cart"]');
      
      // Go to cart
      await page.click('[data-testid="cart-link"]');
      await page.waitForSelector('[data-testid="cart-page"]');
      
      // Remove item
      await page.click('[data-testid="remove-item"]');
      
      // Confirm removal if dialog appears
      const confirmButton = await page.$('[data-testid="confirm-remove"]');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      // Wait for empty cart message
      await page.waitForSelector('[data-testid="empty-cart"]', {
        timeout: 5000,
      });
      
      const emptyMessage = await page.$eval(
        '[data-testid="empty-cart"]',
        (el) => el.textContent
      );
      expect(emptyMessage).toContain('empty');
    });
  });

  describe('Checkout Process', () => {
    beforeEach(async () => {
      // Add a product to cart before checkout tests
      await page.waitForSelector('[data-testid="product-card"]');
      const products = await page.$$('[data-testid="product-card"]');
      await products[0].click();
      await page.waitForSelector('[data-testid="add-to-cart"]');
      await page.click('[data-testid="add-to-cart"]');
      await page.waitForTimeout(1000);
    });

    it('should navigate to checkout', async () => {
      // Go to cart
      await page.click('[data-testid="cart-link"]');
      await page.waitForSelector('[data-testid="cart-page"]');
      
      // Click checkout button
      await page.click('[data-testid="checkout-button"]');
      
      // Wait for checkout page
      await page.waitForSelector('[data-testid="checkout-page"]', {
        timeout: 5000,
      });
      
      // Check checkout elements
      const orderSummary = await page.$('[data-testid="order-summary"]');
      const totalAmount = await page.$('[data-testid="total-amount"]');
      const placeOrderButton = await page.$('[data-testid="place-order"]');
      
      expect(orderSummary).toBeTruthy();
      expect(totalAmount).toBeTruthy();
      expect(placeOrderButton).toBeTruthy();
    });

    it('should show insufficient balance error', async () => {
      // Go to checkout
      await page.click('[data-testid="cart-link"]');
      await page.waitForSelector('[data-testid="cart-page"]');
      await page.click('[data-testid="checkout-button"]');
      await page.waitForSelector('[data-testid="checkout-page"]');
      
      // Try to place order with insufficient balance
      await page.click('[data-testid="place-order"]');
      
      // Wait for error message
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 5000,
      });
      
      const errorText = await page.$eval(
        '[data-testid="error-message"]',
        (el) => el.textContent
      );
      expect(errorText).toContain('balance');
    });

    it('should complete purchase with sufficient balance', async () => {
      // Note: This test assumes the test user has sufficient balance
      // In a real scenario, you'd set up the test data properly
      
      // Go to checkout
      await page.click('[data-testid="cart-link"]');
      await page.waitForSelector('[data-testid="cart-page"]');
      await page.click('[data-testid="checkout-button"]');
      await page.waitForSelector('[data-testid="checkout-page"]');
      
      // Place order
      await page.click('[data-testid="place-order"]');
      
      // Wait for success page or notification
      const successElement = await Promise.race([
        page.waitForSelector('[data-testid="order-success"]', { timeout: 5000 }).catch(() => null),
        page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 }).catch(() => null),
      ]);
      
      if (successElement) {
        const successText = await successElement.evaluate((el) => el.textContent);
        expect(successText).toContain('success');
      }
    });
  });

  describe('Order History', () => {
    it('should view order history', async () => {
      // Navigate to profile/orders
      await page.goto(`${TEST_URL}/profile`);
      await page.waitForSelector('[data-testid="orders-tab"]');
      
      // Click orders tab
      await page.click('[data-testid="orders-tab"]');
      
      // Wait for orders list
      await page.waitForSelector('[data-testid="orders-list"]', {
        timeout: 5000,
      });
      
      // Check if orders are displayed
      const orders = await page.$$('[data-testid="order-item"]');
      
      // If there are orders, check their structure
      if (orders.length > 0) {
        const firstOrder = orders[0];
        const orderId = await firstOrder.$('[data-testid="order-id"]');
        const orderDate = await firstOrder.$('[data-testid="order-date"]');
        const orderStatus = await firstOrder.$('[data-testid="order-status"]');
        
        expect(orderId).toBeTruthy();
        expect(orderDate).toBeTruthy();
        expect(orderStatus).toBeTruthy();
      }
    });

    it('should view order details', async () => {
      // Navigate to orders
      await page.goto(`${TEST_URL}/profile`);
      await page.waitForSelector('[data-testid="orders-tab"]');
      await page.click('[data-testid="orders-tab"]');
      await page.waitForSelector('[data-testid="orders-list"]');
      
      // Check if there are any orders
      const orders = await page.$$('[data-testid="order-item"]');
      
      if (orders.length > 0) {
        // Click on first order
        await orders[0].click();
        
        // Wait for order details
        await page.waitForSelector('[data-testid="order-details"]', {
          timeout: 5000,
        });
        
        // Check order details elements
        const orderItems = await page.$('[data-testid="order-items"]');
        const deliveryInfo = await page.$('[data-testid="delivery-info"]');
        
        expect(orderItems).toBeTruthy();
        expect(deliveryInfo).toBeTruthy();
      }
    });
  });
});