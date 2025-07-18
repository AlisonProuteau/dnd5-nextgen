describe('template spec', () => {
  it('Create', () => {
    cy.visit('/create');

    // TODO
  });

  it('Character Generator', () => {
    cy.visit('/character-generator');
    cy.contains('D&D Character Portrait Generator');

    // TODO
  });

  it('Contact', () => {
    cy.visit('/contact');

    // TODO
  });

  it('Settings', () => {
    cy.visit('/settings');
    cy.get('[id="version-select"]').contains('Version');
    cy.get('.MuiSelect-select').should('contain.text', 'Legacy');
    cy.get('button:contains("Submit")').should('be.enabled');

    cy.get('.MuiSelect-select').click();
    cy.get('.MuiList-root').contains('2024').click();

    cy.get('.MuiSelect-select').should('contain.text', '2024');
    cy.get('button:contains("Submit")').should('be.disabled');
    cy.get('.MuiFormControl-root').should('contain.text', 'Version not yet available');

    cy.get('.MuiSelect-select').click();
    cy.get('.MuiList-root').contains('Legacy').click();
    cy.get('button:contains("Submit")').click();

    cy.get('[role="status"]').contains('Game version updated');
  });
});
