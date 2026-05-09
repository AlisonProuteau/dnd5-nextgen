describe(`Settings Page End-to-End`, () => {
  beforeEach(() => {
    cy.login(Cypress.testUser.uid);
    cy.visit('/settings');
    cy.getByTestId('user-info').should('be.visible');
  });

  after(() => cy.callFirestore('update', `users/${Cypress.testUser.uid}`, { additionalCurrencies: [] }));

  it('should display user information, version selector and currency selector', () => {
    // Test: User info is displayed
    cy.getByTestId('user-info').should('be.visible');
    cy.getByTestId('user-info').should('contain.text', `User: ${Cypress.testUser.displayName}`);
    cy.getByTestId('user-info').should('contain.text', `Email: ${Cypress.testUser.email}`);

    // Test: Version form is present
    cy.getByTestId('version-form').should('be.visible');
    cy.get('#version-select').should('be.visible');
    cy.get('#version-select').should('contain.text', 'Legacy');

    // Test: Additional currencies section is present
    cy.getByTestId('additional-currencies').should('be.visible');
    cy.getByTestId('currency-pp').should('be.visible');
    cy.getByTestId('currency-ep').should('be.visible');

    // Test: Submit button behavior with Legacy version
    cy.get('button[type="submit"]').should('not.be.disabled');
    cy.getByTestId('helper-text').should('not.exist');
  });

  it('should show warning for unavailable versions and disable submission', () => {
    // Test: Select unavailable version (assuming only Legacy is available)
    cy.get('#version-select').click();
    cy.get('[data-testid="version-option"]').should('have.length.at.least', 1);

    // If there are other versions, test warning
    cy.get('[data-testid="version-option"]').then(($options) => {
      if ($options.length > 1) {
        // Select a non-Legacy version
        cy.get('[data-testid="version-option"]').not(':contains("Legacy")').first().click();

        // Test: Warning message appears
        cy.getByTestId('helper-text').should('be.visible');
        cy.getByTestId('helper-text').should('contain.text', 'Version not yet available');

        // Test: Submit button is disabled
        cy.get('button[type="submit"]').should('be.disabled');
      }
    });
  });

  it('should successfully update settings and navigate to home', () => {
    // Test: Intercept successful update
    cy.intercept(
      { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
      { delay: 500 }
    ).as('updateSettings');

    // Test: Both currencies should be checked by default
    cy.getByTestId('currency-pp').find('input[type="checkbox"]').should('not.be.checked');
    cy.getByTestId('currency-ep').find('input[type="checkbox"]').should('not.be.checked');

    // Test: Uncheck platinum
    cy.getByTestId('currency-pp').find('input[type="checkbox"]').click();
    cy.getByTestId('currency-pp').find('input[type="checkbox"]').should('be.checked');

    // Test: Uncheck electrum
    cy.getByTestId('currency-ep').find('input[type="checkbox"]').click();
    cy.getByTestId('currency-ep').find('input[type="checkbox"]').should('be.checked');

    // Test: Re-check platinum
    cy.getByTestId('currency-pp').find('input[type="checkbox"]').click();
    cy.getByTestId('currency-pp').find('input[type="checkbox"]').should('not.be.checked');

    cy.get('button[type="submit"]').click();

    // Test: Loading state
    cy.get('button[type="submit"]').should('not.exist');
    cy.wait('@updateSettings');
    cy.waitForLoading();

    // Test: Success message and navigation
    cy.getByRole('status', 'Settings updated').should('be.visible');
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Test: Settings persisted
    cy.reload();
    cy.visit('/settings');
    cy.getByTestId('currency-pp').find('input[type="checkbox"]').should('not.be.checked');
    cy.getByTestId('currency-ep').find('input[type="checkbox"]').should('be.checked');
  });
});
