describe(`Character Generator End-to-End`, () => {
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
    cy.get('#Refinement').should('be.visible').should('contain.value', '');

    const longText = 'A'.repeat(500);
    cy.get('#Refinement').type(longText).invoke('val').should('have.length', 500);
    cy.get('#Refinement').clear();

    const multilineText = 'Line one\nLine two\nLine three';
    cy.get('#Refinement').type(multilineText, { delay: 0 }).should('contain.value', 'Line one');
    cy.get('#Refinement').clear();

    const refinementText =
      'A wise and powerful spellcaster with flowing blue robes and a pointed hat';
    cy.get('#Refinement').type(refinementText).should('have.value', refinementText);

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
    cy.get('[data-testid^="character-card-"] span').should('not.contain.text', 'pending');

    // Test: All images generated successfully
    cy.get('[data-testid^="character-card-"] span').should('not.contain.text', 'pending');
    cy.get('[data-testid^="character-card-"] span').should('not.contain.text', 'failed');
    cy.get('[data-testid^="character-card-"] span').should('contain.text', 'done');

    // Test: Download functionality
    // TODO: check it was downloaded
    cy.getByTestId('batch-options').within(() => {
      cy.get('[data-testid^="character-card-"] button:contains("Download")')
        .should('have.length', 4)
        .first()
        .click();

      cy.get('[data-testid^="character-card-"] button:contains("Download")').should('be.disabled');
      cy.get('[data-testid^="character-card-"]')
        .first()
        .find('[data-testid="DownloadingIcon"]')
        .should('be.visible');
      cy.get('[data-testid^="character-card-"]')
        .first()
        .find('[data-testid="DownloadDoneIcon"]')
        .should('be.visible');
      // cy.get('@downloadImageStub').should('have.been.called.times', 1);

      cy.getButton('Download All').click();
      cy.getByTestId('DownloadDoneIcon').should('have.length', 4);
      // cy.get('@downloadImageStub').should('have.been.called.times', 4);
    });

    // Test: Upload functionality
    // TODO: check it was uploaded
    cy.getByTestId('batch-options').within(() => {
      cy.get('[data-testid^="character-card-"] button:contains("Upload")')
        .should('have.length', 4)
        .first()
        .click();

      cy.get('[data-testid^="character-card-"] button:contains("Upload")').should('be.disabled');
      cy.get('[data-testid^="character-card-"]')
        .first()
        .find('[data-testid="CloudUploadIcon"]')
        .should('be.visible');
      cy.get('[data-testid^="character-card-"]')
        .first()
        .find('[data-testid="CloudDoneIcon"]')
        .should('be.visible');

      cy.getButton('Upload All').click();
      cy.getByTestId('CloudDoneIcon').should('have.length', 4);
      cy.get('button:contains("Upload")')
        .should('have.length', 5)
        .each(($element) => cy.wrap($element).should('be.disabled'));
    });

    // TODO: Figure out the mocking situation
    // Test: Generation error handling
    // cy.intercept('POST', '**/api/generate**', {
    //   statusCode: 500,
    //   body: { error: 'Generation failed' }
    // }).as('generateImageError');
    // cy.window().then((win) => {
    //   cy.stub(win, 'alert').as('windowAlert');
    // });
    // cy.getButton('Generate Portrait').click();
    // cy.wait('@generateImageError');
    // cy.get('@windowAlert').should(
    //   'have.been.calledWith',
    //   'Image generation failed: Generation failed'
    // );
  });
});
