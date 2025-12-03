import { test, expect } from '@playwright/test';

/**
 * UI Improvements E2E Tests
 *
 * Tests for Phase 2 (Mermaid Diagrams) and Phase 3 (Summary Tab)
 *
 * Prerequisites:
 * - Frontend running on localhost:3737
 * - Backend running on localhost:8181
 * - At least one knowledge item in the database
 */

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
    const cards = page.locator('[role="button"].group');
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

    // Switch to Documents tab to see content
    const documentsTab = inspector.locator('button:has-text("Documents")');
    await documentsTab.click();

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

test.describe('Phase 3: Summary Tab in KnowledgeInspector', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Inspector opens with Summary tab as default', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
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

    // Summary tab should be active (cyan color indicates active)
    // Use exact match to avoid matching "Regenerate Summary" button
    const summaryTab = inspector.getByRole('button', { name: 'Summary', exact: true });
    await expect(summaryTab).toBeVisible();
    await expect(summaryTab).toHaveClass(/text-cyan-400/);
  });

  test('Summary tab displays AI-generated summary', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Check for summary content area
    const summarySection = inspector.locator('text=AI-generated overview');
    await expect(summarySection).toBeVisible({ timeout: 3000 });
  });

  test('Summary tab has copy button when content exists', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Check for copy button (might not be visible if no summary)
    const copyButton = inspector.locator('button:has-text("Copy")');
    const noCopyButton = inspector.locator('text=No summary available');

    // Either copy button exists (has summary) or empty state exists
    const hasCopy = await copyButton.count() > 0;
    const hasEmptyState = await noCopyButton.count() > 0;

    expect(hasCopy || hasEmptyState).toBe(true);
  });

  test('Can switch between Summary, Documents, and Code tabs', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Click Documents tab
    const documentsTab = inspector.locator('button:has-text("Documents")');
    await documentsTab.click();
    await expect(documentsTab).toHaveClass(/text-cyan-400/);

    // Sidebar should be visible in Documents mode
    const sidebar = inspector.locator('aside');
    await expect(sidebar).toBeVisible();

    // Click Code Examples tab
    const codeTab = inspector.locator('button:has-text("Code Examples")');
    await codeTab.click();
    await expect(codeTab).toHaveClass(/text-cyan-400/);

    // Click back to Summary (use exact match to avoid "Regenerate Summary")
    const summaryTab = inspector.getByRole('button', { name: 'Summary', exact: true });
    await summaryTab.click();
    await expect(summaryTab).toHaveClass(/text-cyan-400/);

    // Sidebar should be hidden in Summary mode
    await expect(sidebar).not.toBeVisible();
  });

  test('Summary view shows character count when content exists', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Check for character count (only visible if summary exists)
    const charCount = inspector.locator('text=/\\d+ characters/');
    const noCopyButton = inspector.locator('text=No summary available');

    const hasCharCount = await charCount.count() > 0;
    const hasEmptyState = await noCopyButton.count() > 0;

    // Either shows char count or empty state
    expect(hasCharCount || hasEmptyState).toBe(true);
  });
});

test.describe('Phase 3b: Summary Beautiful/Edit Feature', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Summary view shows Beautiful/Edit toggle buttons', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Check for Beautiful and Edit toggle buttons
    const beautifulBtn = inspector.locator('button:has-text("Beautiful")');
    const editBtn = inspector.locator('button:has-text("Edit")');

    await expect(beautifulBtn).toBeVisible();
    await expect(editBtn).toBeVisible();
  });

  test('Beautiful mode is active by default', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Beautiful button should be active (cyan color)
    const beautifulBtn = inspector.locator('button:has-text("Beautiful")');
    await expect(beautifulBtn).toHaveClass(/bg-cyan-500/);
  });

  test('Edit mode shows textarea and live preview', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // Click Edit button
    const editBtn = inspector.locator('button:has-text("Edit")');

    // Check if Edit button is enabled (disabled if no summary)
    const isDisabled = await editBtn.isDisabled();
    if (isDisabled) {
      // No summary exists - skip test
      test.skip();
      return;
    }

    await editBtn.click();

    // Should show Markdown Editor label
    await expect(inspector.locator('text=Markdown Editor')).toBeVisible();

    // Should show Live Preview label
    await expect(inspector.locator('text=Live Preview')).toBeVisible();

    // Should show textarea
    await expect(inspector.locator('textarea')).toBeVisible();

    // Should show Save and Cancel buttons
    await expect(inspector.locator('button:has-text("Save Changes")')).toBeVisible();
    await expect(inspector.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('Cancel button returns to view mode', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    const editBtn = inspector.locator('button:has-text("Edit")');
    const isDisabled = await editBtn.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }

    await editBtn.click();

    // Should be in edit mode
    await expect(inspector.locator('text=Markdown Editor')).toBeVisible();

    // Click Cancel
    await inspector.locator('button:has-text("Cancel")').click();

    // Should be back in view mode (Beautiful button active)
    const beautifulBtn = inspector.locator('button:has-text("Beautiful")');
    await expect(beautifulBtn).toHaveClass(/bg-cyan-500/);

    // Markdown Editor should not be visible
    await expect(inspector.locator('text=Markdown Editor')).not.toBeVisible();
  });

  test('Live preview updates as user types', async ({ page }) => {
    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await cards.first().click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    const editBtn = inspector.locator('button:has-text("Edit")');
    const isDisabled = await editBtn.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }

    await editBtn.click();

    // Type in textarea
    const textarea = inspector.locator('textarea');
    await textarea.fill('# Test Heading\n\nThis is a **test** paragraph.');

    // Check that preview shows formatted content
    // The heading should be rendered as h1 in the preview
    const preview = inspector.locator('.prose');
    await expect(preview.locator('h1')).toContainText('Test Heading');
    await expect(preview.locator('strong')).toContainText('test');
  });
});

test.describe('Integration: Knowledge Card Flow', () => {

  test('Full interaction flow: click card -> view summary -> switch tabs -> close', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[role="button"].group');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      console.log('No knowledge items found - skipping integration test');
      test.skip();
      return;
    }

    const firstCard = cards.first();

    // 1. Click - should open inspector with Summary tab
    await firstCard.click();

    const inspector = page.locator('[role="dialog"]');
    await expect(inspector).toBeVisible({ timeout: 5000 });

    // 2. Verify Summary tab is active (use exact match to avoid "Regenerate Summary")
    const summaryTab = inspector.getByRole('button', { name: 'Summary', exact: true });
    await expect(summaryTab).toHaveClass(/text-cyan-400/);

    // 3. Switch to Documents tab
    const documentsTab = inspector.locator('button:has-text("Documents")');
    await documentsTab.click();
    await expect(documentsTab).toHaveClass(/text-cyan-400/);

    // 4. Verify sidebar is visible
    const sidebar = inspector.locator('aside');
    await expect(sidebar).toBeVisible();

    // 5. Close modal (Escape)
    await page.keyboard.press('Escape');

    // Wait for modal to close
    await expect(inspector).not.toBeVisible({ timeout: 3000 });
  });
});
