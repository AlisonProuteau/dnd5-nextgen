describe(`Character Generator End-to-End`, () => {
  const imageObj = {
    bucket: 'dnd5-nextgen.firebasestorage.app',
    generation: '1762736803456',
    metageneration: '1',
    contentType: 'application/octet-stream',
    timeCreated: '2025-11-10T01:06:43.456Z',
    updated: '2025-11-10T01:06:43.456Z',
    storageClass: 'STANDARD',
    size: '5711',
    md5Hash: 'PvaCjHLYCSAyKH4JFWuiRw==',
    crc32c: '4124607903',
    etag: 'ikKc7wBRmHH4tTwP3lsAiS2EHxg',
    downloadTokens: 'db53b816-4137-4143-8b80-8757324fc8bb',
    contentEncoding: 'identity',
    contentDisposition: 'inline',
    metadata: {}
  };

  beforeEach(() => cy.task('clearDownloadsFolder'));

  it('should complete full generation workflow with admin route protection, form validation, error handling, and accessibility', () => {
    // Test: Admin route protection
    cy.visit('/character-generator');
    cy.url().should('not.include', '/character-generator');

    cy.login(Cypress.testUser.uid);
    cy.visit('/character-generator');
    cy.url().should('not.include', '/character-generator');

    cy.loginAsAdmin();
    cy.visit('/character-generator');
    cy.url().should('include', '/character-generator');
    cy.getByTestId('character-form').should('be.visible');

    // Test: Header
    cy.get('h4').should('be.visible').should('contain.text', 'D&D Character Portrait Generator');
    cy.getButton('Generate Portrait').should('be.visible').should('be.enabled');

    // Test: Race field
    cy.get('#Race').should('be.visible').should('contain.text', 'Human');
    cy.selectOption('#Race', /^Elf/);
    cy.get('#Race').should('contain.text', 'Elf');

    // Test: Gender field
    cy.get('#Gender').should('be.visible').should('contain.text', 'Gender-neutral');
    cy.selectOption('#Gender', 'Female');
    cy.get('#Gender').should('contain.text', 'Female');

    // Test: Class field
    cy.get('#Class').should('be.visible').should('contain.text', 'Barbarian');
    cy.selectOption('#Class', 'Wizard');
    cy.get('#Class').should('contain.text', 'Wizard');

    // Test: Ethnicity field
    cy.get('#Ethnicity').should('be.visible').should('contain.text', '');
    cy.selectOption('#Ethnicity', 'Caucasian');
    cy.get('#Ethnicity').should('contain.text', 'Caucasian');

    // Test: Image type field
    cy.get('*[id="Image Type"]').should('be.visible').should('contain.text', '');
    cy.selectOption('*[id="Image Type"]', 'portrait');
    cy.get('*[id="Image Type"]').should('contain.text', 'portrait');

    // Test: Image ratio field
    cy.get('*[id="Image Ratio"]').should('be.visible').should('contain.text', '');
    cy.selectOption('*[id="Image Ratio"]', '1:1');
    cy.get('*[id="Image Ratio"]').should('contain.text', '1:1');

    // Test: Description field validation
    cy.get('#refinement').should('be.visible').should('contain.value', '');

    const longText = 'A'.repeat(500);
    cy.get('#refinement').type(longText).invoke('val').should('have.length', 500);
    cy.get('#refinement').clear();

    const multilineText = 'Line one\nLine two\nLine three';
    cy.get('#refinement').type(multilineText, { delay: 0 }).should('contain.value', 'Line one');
    cy.get('#refinement').clear();

    const refinementText =
      'A wise and powerful spellcaster with flowing blue robes and a pointed hat';
    cy.get('#refinement').type(refinementText).should('have.value', refinementText);

    // Test: Loading state and success generation
    cy.getButton('Generate Portrait').click();
    cy.getByTestId('loading', { selector: '[role="progressbar"]' }).should('be.visible');

    cy.getByTestId('generated-image').should('be.visible');
    cy.getByTestId('prompt-display')
      .should('contain.text', 'female Elf Wizard')
      .should('contain.text', refinementText);

    // Test: Start Batch generation for all combinations
    cy.getButton('Start Batch').click();
    cy.getByTestId('batch-options').should('be.visible');

    // Test: All combinations are started
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"]')
      .should('have.length', 432);
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"] span')
      .each(($card) => cy.wrap($card.text()).should('match', /(pending|generating|done)/));

    // Test: Cancel pauses processing for non-started images
    cy.contains('button', 'Cancel').should('be.visible').click();
    cy.contains('button', 'Resume').should('be.visible');
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"] span:contains("generating")')
      .should('not.exist');

    // Test: Start Batch generation for all elf
    cy.get('label').contains('Only Elf').click();
    cy.getButton('Clear Batch').click();
    cy.getButton('Start Batch').click();

    cy.getByTestId('batch-options').should('be.visible');
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"]')
      .should('have.length', 48);

    cy.contains('button', 'Cancel').should('be.visible').click();
    cy.contains('button', 'Resume').should('be.visible');
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"] span:contains("generating")')
      .should('not.exist');

    // Test: Start Batch generation for all elf/wizard
    cy.get('label').contains('Only Wizard').click();
    cy.getButton('Clear Batch').click();
    cy.getButton('Start Batch').click();

    cy.getByTestId('batch-options').should('be.visible');
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"]')
      .should('have.length', 4);

    cy.contains('button', 'Cancel').should('be.visible').click();
    cy.contains('button', 'Resume').should('be.visible');
    cy.getByTestId('batch-options')
      .find('[data-testid^="character-card"] span:contains("generating")')
      .should('not.exist');

    // Test: Resume restarts everything (pending/failed images)
    cy.contains('button', 'Resume').should('be.visible').click();
    cy.wait(5000); // Wait 5 seconds for images to generate
    cy.getByTestId('character-card-').find('span').should('not.contain.text', 'pending');

    // Test: All images generated successfully
    cy.getByTestId('character-card-').find('span').should('not.contain.text', 'pending');
    cy.getByTestId('character-card-').find('span').should('not.contain.text', 'failed');
    cy.getByTestId('character-card-').find('span').should('contain.text', 'done');

    // Test: Download functionality
    cy.getByTestId('batch-options').within(($el) => {
      cy.wrap($el)
        .getByTestId('character-card-')
        .find(' button:contains("Download")')
        .should('have.length', 4)
        .first()
        .click();

      cy.wrap($el)
        .getByTestId('character-card-')
        .find(' button:contains("Download")')
        .should('be.disabled');
      cy.wrap($el)
        .getByTestId('character-card-')
        .first()
        .getByTestId('downloading')
        .should('be.visible');

      cy.wrap($el)
        .getByTestId('character-card-')
        .first()
        .getByTestId('download-done')
        .should('be.visible');
      cy.task('verifyFileExists', 'Elf_Wizard_Gender-neutral.png').should('be.true');
      cy.task('getFileCount', '*.png').should('eq', 1);

      cy.getButton(/Download All/).click();
      cy.wrap($el).getByTestId('download-done').should('have.length', 4);
      cy.task('getFileCount', '*.png').should('eq', 4);
    });

    // Test: Upload functionality
    cy.intercept('POST', '**/dnd5-nextgen*/o?name=images*', (req) =>
      req.reply({
        delay: 500,
        statusCode: 200,
        body: {
          ...imageObj,
          name: req.url.replace(/.*name=/, '')
        }
      })
    ).as('uploadImage');
    cy.intercept('GET', '**/dnd5-nextgen*/o/images*', (req) =>
      req.reply({
        delay: 500,
        statusCode: 200,
        body: { ...imageObj, name: req.url.replace(/.*\/images\//, 'images/') }
      })
    ).as('getUploadedImage');

    cy.getByTestId('batch-options').within(($el) => {
      cy.wrap($el)
        .getByTestId('character-card-')
        .find(' button:contains("Upload")')
        .should('have.length', 4)
        .first()
        .click();

      cy.wrap($el)
        .getByTestId('character-card-')
        .find(' button:contains("Upload")')
        .should('be.disabled');
      cy.wait('@uploadImage');
      cy.wait('@getUploadedImage');
      cy.wrap($el)
        .getByTestId('character-card-')
        .first()
        .getByTestId('uploading')
        .should('be.visible');

      cy.wrap($el)
        .getByTestId('character-card-')
        .first()
        .getByTestId('upload-done')
        .should('be.visible');

      cy.getButton(/Upload All/).click();
      for (let i = 0; i < 3; i++) {
        cy.wait('@uploadImage');
        cy.wait('@getUploadedImage');
      }
      cy.wrap($el).getByTestId('upload-done').should('have.length', 4);
      cy.getButton('Upload')
        .should('have.length', 5)
        .each(($element) => cy.wrap($element).should('be.disabled'));
    });
  });
});
