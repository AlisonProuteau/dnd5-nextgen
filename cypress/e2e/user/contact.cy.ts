describe('Contact Form', () => {
  const isMobile = Cypress.config('viewportWidth') === 375;
  const charId = `test-char-tickets-${isMobile ? 'mobile' : 'desktop'}`;
  const charName = 'My Test Character';

  before(() => cy.seedCharacter(Cypress.testUser.uid, charId, { id: charId, name: charName }));

  beforeEach(() => {
    cy.callFirestore('delete', 'tickets');
    cy.visitAs(Cypress.testUser.uid, '/contact');
  });

  after(() => {
    cy.callFirestore('delete', 'tickets');
    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters/${charId}`);
  });

  it('submits anonymous feedback after validating the required message', () => {
    // Test: Setup & Navigation - Verify feedback form (default selection)
    cy.get('#type').should('contain.text', 'Feedback');
    cy.get('#message').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    // Test: Validation Testing - Required field validation
    cy.get('#message').type('a').clear();
    cy.getByTestId('message-input').should('have.class', 'Mui-error');
    cy.getByTestId('message-form').should('contain.text', 'Required');
    cy.get('button[type="submit"]').should('be.disabled');

    // Test: Submit anonymous feedback
    cy.get('#anonymous').should('be.checked');
    cy.get('#message').type('Anonymous feedback message');
    cy.get('button[type="submit"]').should('be.enabled');

    // Test: loading state during anonymous submission
    cy.intercept(
      { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
      { delay: 1000 }
    ).as('submitAnonymous');

    cy.get('button[type="submit"]').click();
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('[data-testid="loading"], [role="progressbar"]').should('be.visible');
    cy.wait('@submitAnonymous');
    cy.getByRole('status', 'Ticket created').should('be.visible');
    cy.waitForLoading();

    // Test: Ticket should be saved and NOT include userEmail
    cy.callFirestore('get', 'tickets', {
      where: ['message', '==', 'Anonymous feedback message']
    }).then((docs) => {
      cy.wrap(docs.length).should('eq', 1);

      const ticketData = docs[0];
      cy.wrap(ticketData.userEmail).should('be.undefined');
      cy.wrap(ticketData.status).should('eq', 'open');
      cy.wrap(ticketData.type).should('eq', 'Feedback');
      cy.wrap(ticketData.version).should('eq', 'Legacy');
    });

    // Test: Form should be cleared after submission
    cy.get('#type').should('contain.text', 'Feedback');
    cy.get('#message').should('have.value', '');

  });

  it('submits non-anonymous feedback with the user id attached', () => {
    cy.get('#anonymous').should('be.checked');
    cy.get('#anonymous').uncheck();
    cy.get('#anonymous').should('not.be.checked');
    cy.get('#message').type('This is feedback is not anonymous');
    cy.get('button[type="submit"]').should('be.enabled');

    // Test: loading state during non-anonymous submission
    cy.intercept(
      { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
      { delay: 1000 }
    ).as('submitWithEmail');

    cy.get('button[type="submit"]').click();
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('[data-testid="loading"], [role="progressbar"]').should('be.visible');
    cy.wait('@submitWithEmail');
    cy.getByRole('status', 'Ticket created').should('be.visible');
    cy.waitForLoading();

    // Test: Ticket should be saved and include user id
    cy.callFirestore('get', 'tickets', {
      where: ['message', '==', 'This is feedback is not anonymous']
    }).then((docs) => {
      cy.wrap(docs.length).should('eq', 1);

      const ticketData = docs[0];
      cy.wrap(ticketData.userId).should('eq', Cypress.testUser.uid);
      cy.wrap(ticketData.status).should('eq', 'open');
      cy.wrap(ticketData.type).should('eq', 'Feedback');
      cy.wrap(ticketData.version).should('eq', 'Legacy');
    });

    // Test: Form should be cleared after submission
    cy.get('#type').should('contain.text', 'Feedback');
    cy.get('#message').should('have.value', '');
  });

  it('submits a bug report with character details and custom area', () => {
    // Test: Setup & Navigation - Switch to Bug report
    cy.selectOption('#type', 'Bug');
    cy.get('#severity').should('be.visible');
    cy.get('#area').should('be.visible');
    cy.get('#message').should('be.visible');
    cy.get('#reproSteps').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    // Test: Validation Testing - Required field validation
    cy.get('#message').type('a').clear();
    cy.getByTestId('message-input').should('have.class', 'Mui-error');
    cy.getByTestId('message-form').should('contain.text', 'Required');
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('#reproSteps').type('a').clear();
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
    cy.get('input[id="area"]').type('a').clear();
    cy.getByTestId('area-input').should('have.class', 'Mui-error');
    cy.getByTestId('area-form').should('contain.text', 'Required');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('input[id="area"]').type('Custom Bug Area');

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

    // Test: Ticket should be saved
    cy.callFirestore('get', 'tickets', {
      where: ['message', '==', 'Resolved bug summary']
    }).then((docs) => {
      cy.wrap(docs.length).should('eq', 1);

      const ticketData = docs[0];
      cy.wrap(ticketData.userId).should('eq', Cypress.testUser.uid);
      cy.wrap(ticketData.type).should('eq', 'Bug');
      cy.wrap(ticketData.severity).should('eq', 'Major');
      cy.wrap(ticketData.area).should('eq', 'Custom Bug Area');
      cy.wrap(ticketData.corrupted).should('eq', true);
      cy.wrap(ticketData.character).should('eq', charId);
      cy.wrap(ticketData.reproSteps).should(
        'eq',
        '1. Steps to reproduce after fix\n2. Additional step'
      );
      cy.wrap(ticketData.status).should('eq', 'open');
      cy.wrap(ticketData.version).should('eq', 'Legacy');
    });

    // Test: Cleanup - Form should be cleared
    cy.get('#type').should('contain.text', 'Feedback');
    cy.get('#message').should('have.value', '');
  });

  it('submits a feature request with contact permission', () => {
    // Test: Setup & Navigation - Switch to Request
    cy.selectOption('#type', 'Request');
    cy.get('#requestArea').should('be.visible');
    cy.get('#message').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');

    // Test: Validation Testing - Required field validation
    cy.selectOption('#requestArea', 'Content');
    cy.get('#requestContent').type('a').clear();
    cy.getByTestId('requestContent-input').should('have.class', 'Mui-error');
    cy.getByTestId('requestContent-form').should('contain.text', 'Required');
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('#message').type('a').clear();
    cy.getByTestId('message-input').should('have.class', 'Mui-error');
    cy.getByTestId('message-form').should('contain.text', 'Required');
    cy.get('button[type="submit"]').should('be.disabled');

    // Test: Complete required fields
    cy.get('#requestContent').type('Please add a dice roller feature');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('#message').type('This is additional details for the request');
    cy.get('button[type="submit"]').should('be.enabled');

    // Test: Custom area functionality
    cy.selectOption('#requestArea', 'Other');
    cy.get('input[id="requestArea"]').should('be.visible');
    cy.get('input[id="requestArea"]').type('a').clear();
    cy.getByTestId('requestArea-input').should('have.class', 'Mui-error');
    cy.getByTestId('requestArea-form').should('contain.text', 'Required');
    cy.get('input[id="requestArea"]').type('Custom Feature Request Area');

    // Test: Different request types
    cy.get('#requestArea').click();
    cy.get('[data-value="Content"]').click();
    cy.get('#requestContent').clear().type("Please add more character backgrounds from Tasha's");

    // Test: Submit request with contact permission
    cy.get('#canContact').should('not.be.checked');
    cy.get('#canContact').check();
    cy.get('#canContact').should('be.checked');
    cy.get('button[type="submit"]').should('be.enabled');

    // Test: Success Workflow - Submit with contact permission
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

    // Test: Ticket should be saved with user email
    cy.callFirestore('get', 'tickets', {
      where: ['message', '==', 'This is additional details for the request']
    }).then((docs) => {
      cy.wrap(docs.length).should('eq', 1);

      const ticketData = docs[0];
      cy.wrap(ticketData.userEmail).should('eq', Cypress.testUser.email);
      cy.wrap(ticketData.type).should('eq', 'Request');
      cy.wrap(ticketData.requestArea).should('eq', 'Content');
      cy.wrap(ticketData.requestContent).should(
        'eq',
        "Please add more character backgrounds from Tasha's"
      );
      cy.wrap(ticketData.canContact).should('eq', true);
      cy.wrap(ticketData.status).should('eq', 'open');
      cy.wrap(ticketData.version).should('eq', 'Legacy');
    });

    // Test: Form should be cleared after submission
    cy.get('#type').should('contain.text', 'Feedback');
    cy.get('#message').should('have.value', '');

  });

  it('submits a feature request without contact permission', () => {
    cy.selectOption('#type', 'Request');
    cy.selectOption('#requestArea', 'Feature');
    cy.get('#message').type('Feature request without contact permission');

    // Test: Contact permission is disabled
    cy.get('#canContact').should('not.be.checked');

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

    // Test: Ticket should be saved without user email
    cy.callFirestore('get', 'tickets', {
      where: ['message', '==', 'Feature request without contact permission']
    }).then((docs) => {
      cy.wrap(docs.length).should('eq', 1);

      const ticketData = docs[0];
      cy.wrap(ticketData.userEmail).should('be.undefined');
      cy.wrap(ticketData.type).should('eq', 'Request');
      cy.wrap(ticketData.requestArea).should('eq', 'Feature');
      cy.wrap(ticketData.canContact).should('be.undefined');
      cy.wrap(ticketData.status).should('eq', 'open');
      cy.wrap(ticketData.version).should('eq', 'Legacy');
    });

    // Test: Form should be cleared after submission
    cy.get('#type').should('contain.text', 'Feedback');
    cy.get('#message').should('have.value', '');
  });
});
