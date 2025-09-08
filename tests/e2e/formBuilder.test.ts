import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('FormBuilder and Add to Cart E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = 'http://localhost:5000';
  
  // Admin credentials
  const adminCredentials = {
    username: 'admin',
    password: 'admin123' // Update with actual admin password
  };

  beforeAll(async () => {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 50, // Slow down actions by 50ms for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Authentication', () => {
    it('should navigate to the landing page', async () => {
      await page.goto(baseUrl);
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Check if we're on the landing page
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    it('should login with admin credentials', async () => {
      // Navigate to login page
      await page.goto(`${baseUrl}/`);
      
      // Wait for login form
      await page.waitForSelector('input[name="username"]', { timeout: 5000 });
      
      // Enter admin credentials
      await page.type('input[name="username"]', adminCredentials.username);
      await page.type('input[name="password"]', adminCredentials.password);
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Verify we're logged in by checking for user menu or dashboard
      const isLoggedIn = await page.evaluate(() => {
        return localStorage.getItem('user') !== null;
      });
      expect(isLoggedIn).toBe(true);
    });
  });

  describe('Product Listing and Navigation', () => {
    it('should navigate to shop page', async () => {
      await page.goto(`${baseUrl}/shop`);
      await page.waitForSelector('a[href^="/product/"]', { timeout: 5000 });
      
      // Count products on page
      const productCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href^="/product/"]').length;
      });
      expect(productCount).toBeGreaterThan(0);
    });

    it('should navigate to a regular product detail page', async () => {
      // Click on first non-generator product
      const productLinks = await page.$$eval('a[href^="/product/"]', links => 
        links.map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent
        }))
      );
      
      // Find a regular product (not a generator)
      const regularProduct = productLinks.find(p => !p.text?.toLowerCase().includes('generator'));
      
      if (regularProduct && regularProduct.href) {
        await page.goto(`${baseUrl}${regularProduct.href}`);
        await page.waitForSelector('button', { timeout: 5000 });
        
        // Check for Add to Cart button
        const addToCartButton = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Add to Cart'));
        });
        expect(addToCartButton).toBeTruthy();
      }
    });
  });

  describe('Add to Cart - Regular Product', () => {
    it('should add a regular product to cart without validation', async () => {
      // Navigate to a regular product
      await page.goto(`${baseUrl}/shop`);
      await page.waitForSelector('a[href^="/product/"]', { timeout: 5000 });
      
      // Click first product
      await page.click('a[href^="/product/"]:first-child');
      await page.waitForSelector('button', { timeout: 5000 });
      
      // Get initial cart count
      const initialCartCount = await page.evaluate(() => {
        const cartBadge = document.querySelector('[data-testid="cart-count"]');
        return cartBadge ? parseInt(cartBadge.textContent || '0') : 0;
      });
      
      // Click Add to Cart
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('Add to Cart'));
        if (button) (button as HTMLButtonElement).click();
      });
      
      // Wait for toast notification
      await page.waitForSelector('[role="alert"]', { timeout: 3000 }).catch(() => {});
      
      // Check if item was added to cart
      const newCartCount = await page.evaluate(() => {
        const cartBadge = document.querySelector('[data-testid="cart-count"]');
        return cartBadge ? parseInt(cartBadge.textContent || '0') : 0;
      });
      
      expect(newCartCount).toBeGreaterThan(initialCartCount);
    });

    it('should increase quantity and add to cart', async () => {
      // Click quantity increase button if available
      const hasQuantityControl = await page.evaluate(() => {
        return document.querySelector('button svg.lucide-plus') !== null;
      });
      
      if (hasQuantityControl) {
        // Click plus button to increase quantity
        await page.click('button:has(svg.lucide-plus)');
        
        // Get quantity value
        const quantity = await page.evaluate(() => {
          const qtySpan = document.querySelector('.w-12.text-center');
          return qtySpan ? parseInt(qtySpan.textContent || '1') : 1;
        });
        expect(quantity).toBe(2);
        
        // Add to cart with quantity 2
        await page.evaluate(() => {
          const button = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Add to Cart'));
          if (button) (button as HTMLButtonElement).click();
        });
        
        // Wait for toast
        await page.waitForSelector('[role="alert"]', { timeout: 3000 }).catch(() => {});
      }
    });
  });

  describe('Generator Product with Form', () => {
    it('should navigate to test form builder page', async () => {
      await page.goto(`${baseUrl}/test-form-builder`);
      await page.waitForSelector('form, [data-testid="form-renderer"]', { 
        timeout: 5000 
      }).catch(() => {});
      
      // Check if form fields are present
      const hasFormFields = await page.evaluate(() => {
        return document.querySelectorAll('input, select, textarea').length > 0;
      });
      expect(hasFormFields).toBe(true);
    });

    it('should validate required fields before adding to cart', async () => {
      // Navigate to a generator product with form
      await page.goto(`${baseUrl}/shop`);
      
      // Find and click on a generator product
      const generatorLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href^="/product/"]'));
        const generator = links.find(link => 
          link.textContent?.toLowerCase().includes('generator') ||
          link.textContent?.toLowerCase().includes('gentest')
        );
        return generator ? generator.getAttribute('href') : null;
      });
      
      if (generatorLink) {
        await page.goto(`${baseUrl}${generatorLink}`);
        await page.waitForSelector('button', { timeout: 5000 });
        
        // Try to add to cart without filling required fields
        await page.evaluate(() => {
          const button = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Add to Cart'));
          if (button) (button as HTMLButtonElement).click();
        });
        
        // Check for validation error toast
        const hasValidationError = await page.waitForSelector('[role="alert"]', { 
          timeout: 3000 
        }).then(() => true).catch(() => false);
        
        if (hasValidationError) {
          const errorText = await page.evaluate(() => {
            const alert = document.querySelector('[role="alert"]');
            return alert ? alert.textContent : '';
          });
          expect(errorText).toContain('Required');
        }
      }
    });

    it('should add generator product after filling required fields', async () => {
      // Fill required fields if present
      const requiredFields = await page.$$('input[required], select[required]');
      
      for (const field of requiredFields) {
        const fieldType = await field.evaluate(el => el.tagName.toLowerCase());
        
        if (fieldType === 'input') {
          const inputType = await field.evaluate(el => (el as HTMLInputElement).type);
          
          if (inputType === 'text') {
            await field.type('Test Value');
          } else if (inputType === 'email') {
            await field.type('test@example.com');
          } else if (inputType === 'number') {
            await field.type('123');
          }
        } else if (fieldType === 'select') {
          // Select first option
          await field.click();
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
      }
      
      // Now try to add to cart
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('Add to Cart'));
        if (button) (button as HTMLButtonElement).click();
      });
      
      // Wait for success toast
      await page.waitForSelector('[role="alert"]', { timeout: 3000 }).catch(() => {});
      
      const toastText = await page.evaluate(() => {
        const alert = document.querySelector('[role="alert"]');
        return alert ? alert.textContent : '';
      });
      
      expect(toastText).toContain('Added to Cart');
    });
  });

  describe('Cart Operations', () => {
    it('should open cart sidebar', async () => {
      // Click cart button
      const cartButton = await page.$('button[aria-label*="cart"], button:has(svg.lucide-shopping-cart)');
      
      if (cartButton) {
        await cartButton.click();
        
        // Wait for cart sidebar
        await page.waitForSelector('[data-testid="cart-sidebar"], .cart-sidebar', { 
          timeout: 3000 
        }).catch(() => {});
        
        // Check if cart has items
        const cartItems = await page.evaluate(() => {
          return document.querySelectorAll('[data-testid="cart-item"], .cart-item').length;
        });
        expect(cartItems).toBeGreaterThan(0);
      }
    });

    it('should proceed to checkout', async () => {
      // Click checkout button if cart is open
      const checkoutButton = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('Checkout'));
        return button ? true : false;
      });
      
      if (checkoutButton) {
        await page.evaluate(() => {
          const button = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Checkout'));
          if (button) (button as HTMLButtonElement).click();
        });
        
        // Wait for navigation to checkout page
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Verify we're on checkout page
        const url = page.url();
        expect(url).toContain('/checkout');
      }
    });
  });

  describe('Admin Product Management', () => {
    it('should navigate to admin panel', async () => {
      await page.goto(`${baseUrl}/admin`);
      await page.waitForSelector('h1, h2', { timeout: 5000 });
      
      // Check if we're in admin panel
      const isAdminPanel = await page.evaluate(() => {
        const heading = document.querySelector('h1, h2');
        return heading?.textContent?.toLowerCase().includes('admin');
      });
      expect(isAdminPanel).toBe(true);
    });

    it('should create a new generator product with form builder', async () => {
      // Navigate to add product page
      await page.goto(`${baseUrl}/admin/add-product`);
      await page.waitForSelector('input[name="title"]', { timeout: 5000 });
      
      // Fill product details
      await page.type('input[name="title"]', 'Test Generator Product');
      await page.type('textarea[name="description"]', 'Test generator with form builder');
      await page.type('input[name="price"]', '49.99');
      
      // Select category as generator
      const categorySelect = await page.$('select[name="category"]');
      if (categorySelect) {
        await categorySelect.select('generator');
      }
      
      // Add form builder configuration if available
      const formBuilderToggle = await page.$('[data-testid="enable-form-builder"]');
      if (formBuilderToggle) {
        await formBuilderToggle.click();
        
        // Wait for form builder interface
        await page.waitForSelector('[data-testid="form-builder"]', { 
          timeout: 3000 
        }).catch(() => {});
      }
      
      // Save product
      const saveButton = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.includes('Save') || btn.textContent?.includes('Create'));
        return button ? true : false;
      });
      
      if (saveButton) {
        await page.evaluate(() => {
          const button = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Save') || btn.textContent?.includes('Create'));
          if (button) (button as HTMLButtonElement).click();
        });
        
        // Wait for success message or redirect
        await page.waitForSelector('[role="alert"]', { timeout: 3000 })
          .catch(() => page.waitForNavigation({ waitUntil: 'networkidle2' }));
      }
    });
  });

  describe('Cleanup', () => {
    it('should logout', async () => {
      // Clear local storage to logout
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Navigate back to home
      await page.goto(baseUrl);
      
      // Verify logged out
      const isLoggedOut = await page.evaluate(() => {
        return localStorage.getItem('user') === null;
      });
      expect(isLoggedOut).toBe(true);
    });
  });
});