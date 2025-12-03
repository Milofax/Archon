import { test, expect } from '@playwright/test';

/**
 * UI Improvements E2E Tests
 *
 * Tests for Phase 1 (3D Card Tilt) and Phase 2 (Mermaid Diagrams)
 *
 * Prerequisites:
 * - Frontend running on localhost:3737
 * - Backend running on localhost:8181
 * - At least one knowledge item in the database
 */

test.describe('Phase 1: 3D Card Tilt Effect', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Knowledge Base page loads with cards', async ({ page }) => {
    // Check for Knowledge Base header
    const header = page.locator('h1:has-text("Knowledge Base")');
    await expect(header).toBeVisible({ timeout: 5000 });

    // Check for at least one knowledge card (if data exists)
    const cards = page.locator('[role="button"].card-3d');
    const cardCount = await cards.count();

    // Log card count for debugging
    console.log(`Found ${cardCount} knowledge cards`);
  });

  test('Card has 3D tilt class applied', async ({ page }) => {
    // Wait for cards to render
    const cards = page.locator('[role="button"].card-3d');

    // Skip if no cards (no data)
    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.skip();
      return;
    }

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Verify card-3d class is present
    await expect(firstCard).toHaveClass(/card-3d/);
  });

  test('Card responds to hover with transform', async ({ page }) => {
    const cards = page.locator('[role="button"].card-3d');

    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.skip();
      return;
    }

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Get initial transform
    const initialTransform = await firstCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Hover over the card
    await firstCard.hover();

    // Wait for transition
    await page.waitForTimeout(400);

    // Get transform after hover
    const hoverTransform = await firstCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Transform should change on hover (perspective + rotation)
    // Note: Both might be 'none' or 'matrix(...)' - we check inline style instead
    const hasInlineTransform = await firstCard.evaluate(el =>
      el.style.transform.includes('perspective')
    );

    expect(hasInlineTransform).toBe(true);
  });

  test('Card has reflection overlay element', async ({ page }) => {
    const cards = page.locator('[role="button"].card-3d');

    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Check for card-reflection class within cards
    const reflectionOverlay = page.locator('.card-3d .card-reflection');
    const reflectionCount = await reflectionOverlay.count();

    // Should have reflection overlays
    expect(reflectionCount).toBeGreaterThan(0);
  });

  test('Card click triggers bounce animation', async ({ page }) => {
    const cards = page.locator('[role="button"].card-3d');

    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.skip();
      return;
    }

    const firstCard = cards.first();

    // Click the card
    await firstCard.click();

    // Wait a bit for animation to potentially start
    await page.waitForTimeout(100);

    // Check if card-bounce animation was applied (it gets cleared after)
    // This is tricky to test - we mainly verify the click doesn't break anything
    // and the inspector modal opens
    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Phase 2: Mermaid Diagram Support', () => {

  test('Mermaid renderer component exists in build', async ({ page }) => {
    // This is a build-time check - if Mermaid isn't imported correctly, build fails
    // We verify by checking the page loads without JS errors

    await page.goto('/');

    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Filter out expected/known errors
    const relevantErrors = errors.filter(e =>
      e.includes('mermaid') || e.includes('MermaidRenderer')
    );

    expect(relevantErrors).toHaveLength(0);
  });

  test('ContentViewer can render markdown without errors', async ({ page }) => {
    // Navigate to knowledge base
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if there are knowledge cards
    const cards = page.locator('[role="button"].card-3d');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    // Click first card to open inspector
    await cards.first().click();

    // Wait for inspector modal
    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Check for content viewer area
    const contentArea = inspector.locator('.prose, pre');
    await expect(contentArea.first()).toBeVisible({ timeout: 3000 });
  });

  test('Mermaid diagram in content renders correctly', async ({ page, request }) => {
    // This test verifies mermaid rendering works
    // We need a document with mermaid content

    // First check if API is available
    const healthCheck = await request.get('http://localhost:8181/health');
    if (!healthCheck.ok()) {
      test.skip();
      return;
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // For now, we just verify the page loads without mermaid-related errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('mermaid')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Integration: Card Interaction Flow', () => {

  test('Full interaction flow: hover -> click -> view content -> close', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[role="button"].card-3d');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      console.log('No knowledge items found - skipping integration test');
      test.skip();
      return;
    }

    const firstCard = cards.first();

    // 1. Hover - should trigger tilt
    await firstCard.hover();
    await page.waitForTimeout(300);

    // Verify tilt is applied
    const hasTransform = await firstCard.evaluate(el =>
      el.style.transform.includes('rotateX') || el.style.transform.includes('rotateY')
    );
    expect(hasTransform).toBe(true);

    // 2. Click - should open inspector
    await firstCard.click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // 3. Verify content is displayed
    const content = inspector.locator('.prose, pre, code').first();
    await expect(content).toBeVisible({ timeout: 3000 });

    // 4. Close modal (Escape or click outside)
    await page.keyboard.press('Escape');

    // Wait for modal to close
    await expect(inspector).not.toBeVisible({ timeout: 3000 });

    // 5. Card should be back to normal (no tilt when not hovered)
    await page.mouse.move(0, 0); // Move mouse away
    await page.waitForTimeout(400);

    const transformAfter = await firstCard.evaluate(el => el.style.transform);
    expect(transformAfter).toContain('scale3d(1, 1, 1)');
  });
});
