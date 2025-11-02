import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// TODO: move all the should be disabled before the blur
Cypress.viewports.forEach(({ name, width, height }) =>
  describe(`${name} - Contact Form End-to-End`, () => {
    const charName = 'My Test Character';
    beforeEach(() => {
      cy.viewport(width, height);

      cy.createTestCharacter(Cypress.testUser.uid, undefined, { name: charName });
      cy.login(Cypress.testUser.uid);
      cy.visit('/contact');
    });

    it('should handle complete feedback contact workflow with validation, anonymous mode, and submission', () => {
      // Test: Setup & Navigation - Verify feedback form (default selection)
      cy.get('#type').should('contain.text', 'Feedback');
      cy.get('#message').should('be.visible');
      // cy.get('button[type="submit"]').should('be.disabled'); // TODO: remove when fixed

      // Test: Validation Testing - Required field validation
      cy.get('#message').clear().blur();
      cy.getByTestId('message-input').should('have.class', 'Mui-error');
      cy.getByTestId('message-form').should('contain.text', 'Required');
      cy.get('button[type="submit"]').should('be.disabled');

      // Test: anonymous mode functionality
      cy.get('#anonymous').should('be.checked');
      cy.get('#anonymous').uncheck();
      cy.get('#anonymous').should('not.be.checked');

      // Test: Complete anonymous form
      cy.get('#message').type('Anonymous feedback message');
      cy.get('button[type="submit"]').should('be.enabled');

      // Test: Error Handling - submission failure
      // TODO: fix to stop trying and actually fail
      // cy.intercept('POST', '**/google.firestore.v1.Firestore/**', {
      //   statusCode: 500,
      //   body: { error: 'Submission failed' }
      // }).as('submitError');
      // cy.get('button[type="submit"]').click();
      // cy.wait('@submitError');
      // cy.getByRole('status', "Something went wrong").should('be.visible');

      // Test: Success Workflow - Switch back to non-anonymous and complete submission
      cy.get('#anonymous').check();
      cy.get('#anonymous').should('be.checked');
      cy.get('#message').clear().type('This is comprehensive feedback');

      // Test: loading state during submission
      cy.intercept(
        { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
        { delay: 1000 }
      ).as('submit');
      cy.get('button[type="submit"]').click();

      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('[data-testid="loading"], [role="progressbar"]').should('be.visible');
      cy.wait('@submit');
      cy.getByRole('status', 'Ticket created').should('be.visible');
      cy.waitForLoading();

      // TODO: Check data persistence in database

      // Test: Cleanup - Form should be cleared
      cy.get('#type').should('contain.text', 'Feedback');
      cy.get('#message').should('have.value', '');
    });

    it('should handle complete bug report workflow with character selection, validation, and submission', () => {
      // Test: Setup & Navigation - Switch to Bug report
      cy.selectOption('#type', 'Bug');
      cy.get('#severity').should('be.visible');
      cy.get('#area').should('be.visible');
      cy.get('#message').should('be.visible');
      cy.get('#reproSteps').should('be.visible');
      // cy.get('button[type="submit"]').should('be.disabled'); // TODO: remove when fixed

      // Test: Validation Testing - Required field validation
      cy.get('#message').clear().blur();
      cy.getByTestId('message-input').should('have.class', 'Mui-error');
      cy.getByTestId('message-form').should('contain.text', 'Required');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('#reproSteps').clear().blur();
      cy.getByTestId('reproSteps-input').should('have.class', 'Mui-error');
      cy.getByTestId('reproSteps-form').should('contain.text', 'Required');
      cy.get('button[type="submit"]').should('be.disabled');

      // Test: Complete required fields
      cy.selectOption('#severity', 'Major');
      cy.selectOption('#area', 'Character Creation');
      cy.get('#message').type('Bug summary');
      cy.get('#reproSteps').type('1. Go to character creation\n2. Select race\n3. App crashes');
      cy.get('button[type="submit"]').should('be.enabled');

      // Test: Character selection for relevant areas
      cy.selectOption('#area', 'Character Sheet');
      cy.get('#message').should('have.value', 'Bug summary');
      cy.get('#reproSteps').should(
        'have.value',
        '1. Go to character creation\n2. Select race\n3. App crashes'
      );

      cy.get('#character').should('be.visible');
      cy.selectOption('#character', charName);

      // Test: Data corruption checkbox
      cy.get('#corrupted').should('not.be.checked');
      cy.get('#corrupted').check();
      cy.get('#corrupted').should('be.checked');

      // Test: Custom area input
      cy.selectOption('#area', 'Other');
      cy.get('input[id="area"]').should('be.visible');
      cy.get('input[id="area"]').clear().blur();
      cy.getByTestId('area-input').should('have.class', 'Mui-error');
      cy.getByTestId('area-form').should('contain.text', 'Required');
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('input[id="area"]').type('Custom Bug Area');

      // Test: Error Handling - submission error
      // TODO: fix to stop trying and actually fail
      // cy.intercept('POST', '**/google.firestore.v1.Firestore/**', {
      //   statusCode: 500,
      //   body: { error: 'Submission failed' }
      // }).as('submitError');
      // cy.get('button[type="submit"]').click();
      // cy.wait('@submitError');
      // cy.getByRole('status', "Something went wrong").should('be.visible');

      // Test: Success Workflow - Complete successful submission
      cy.get('#message').clear().type('Resolved bug summary');
      cy.get('#reproSteps').clear().type('1. Steps to reproduce after fix\n2. Additional step');
      cy.intercept(
        { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
        { delay: 1000 }
      ).as('submit');
      cy.get('button[type="submit"]').scrollIntoView().click({});

      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('[data-testid="loading"], [role="progressbar"]').should('be.visible');
      cy.wait('@submit');
      cy.getByRole('status', 'Ticket created').should('be.visible');
      cy.waitForLoading();

      // TODO: Check data persistence in database

      // Test: Cleanup - Form should be cleared
      cy.get('#type').should('contain.text', 'Feedback');
      cy.get('#message').should('have.value', '');
    });

    it('should handle complete feature request workflow with custom areas and validation', () => {
      // Test: Setup & Navigation - Switch to Request
      cy.selectOption('#type', 'Request');
      cy.get('#requestArea').should('be.visible');
      cy.get('#message').should('be.visible');
      // cy.get('button[type="submit"]').should('be.disabled'); // TODO: remove when fixed

      // Test: Validation Testing - Required field validation
      cy.selectOption('#requestArea', 'Content');
      cy.get('#requestContent').clear().blur();
      cy.getByTestId('requestContent-input').should('have.class', 'Mui-error');
      cy.getByTestId('requestContent-form').should('contain.text', 'Required');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('#message').clear().blur();
      cy.getByTestId('message-input').should('have.class', 'Mui-error');
      cy.getByTestId('message-form').should('contain.text', 'Required');
      cy.get('button[type="submit"]').should('be.disabled');

      // Test: Complete required fields
      cy.get('#requestContent').type('Please add a dice roller feature');
      // cy.get('button[type="submit"]').should('be.disabled'); // TODO: remove when fixed
      cy.get('#message').type('This is additional details for the request');
      cy.get('button[type="submit"]').should('be.enabled');

      // Test: Custom area functionality
      cy.selectOption('#requestArea', 'Other');
      cy.get('input[id="requestArea"]').should('be.visible');
      cy.get('input[id="requestArea"]').clear().blur();
      cy.getByTestId('requestArea-input').should('have.class', 'Mui-error');
      cy.getByTestId('requestArea-form').should('contain.text', 'Required');
      cy.get('input[id="requestArea"]').type('Custom Feature Request Area');

      // Test: Different request types
      cy.get('#requestArea').click();
      cy.get('[data-value="Content"]').click();
      cy.get('#requestContent').clear().type("Please add more character backgrounds from Tasha's");

      // Test: Error Handling - submission error
      // TODO: fix to stop trying and actually fail
      // cy.intercept('POST', '**/google.firestore.v1.Firestore/**', {
      //   statusCode: 500,
      //   body: { error: 'Submission failed' }
      // }).as('submitError');
      // cy.get('button[type="submit"]').click();
      // cy.wait('@submitError');
      // cy.getByRole('status', "Something went wrong").should('be.visible');

      // Test: Success Workflow - Complete successful submission
      cy.intercept(
        { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
        { delay: 1000 }
      ).as('submit');
      cy.get('button[type="submit"]').click();

      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('[data-testid="loading"], [role="progressbar"]').should('be.visible');
      cy.wait('@submit');
      cy.getByRole('status', 'Ticket created').should('be.visible');
      cy.waitForLoading();

      // TODO: Check data persistence in database

      // Test: Cleanup - Form should be cleared
      cy.get('#type').should('contain.text', 'Feedback');
      cy.get('#message').should('have.value', '');
    });
  })
);

// TODO: write tests when adding 2024
describe.skip('Settings Page End-to-End', () => undefined);
