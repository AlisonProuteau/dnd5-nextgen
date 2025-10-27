import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

describe('Authentication End-to-End', () => {
  beforeEach(() => cy.visit('/'));

  describe('Complete Sign In Flow', () => {
    const signInUser = {
      uid: 'existing-user-id',
      email: 'existing.user@example.com',
      password: 'v@lidPassword123'
    };

    before(() => {
      cy.authGetUser(signInUser.uid)
        .then((existingUser) => {
          if (existingUser?.uid) cy.authDeleteUser(signInUser.uid);
        })
        .then(() =>
          cy.authCreateUser(signInUser).callFirestore('set', `users/${signInUser.uid}`, {})
        );
    });

    after(() => {
      cy.authDeleteUser(signInUser.uid);
      cy.callFirestore('delete', `users/${signInUser.uid}`);
    });

    it('should successfully sign in an existing user and redirect to version selection or home', () => {
      cy.get('input[id="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain.text', 'Sign In');

      cy.get('input[id="email"]').type(signInUser.email);
      cy.get('input[id="password"]').type(signInUser.password);
      cy.get('button[type="submit"]').click();

      cy.get('div:contains("Update your display name") form')
        .should('be.visible')
        .within(() => {
          cy.fillMuiTextField('input[id="name"]', 'Sign In User');
          cy.get('button[type="submit"]').click();
        });

      cy.url().should('include', '/settings');
      cy.get('[id="version-select"]').should('be.visible');
      cy.get('button[type="submit"]').click();

      cy.url().should('eq', Cypress.config().baseUrl + '/');

      cy.logout();
      cy.get('input[id="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain.text', 'Sign In');

      cy.get('input[id="email"]').type(signInUser.email);
      cy.get('input[id="password"]').type(signInUser.password);
      cy.get('button[type="submit"]').click();

      cy.url().should('not.include', '/settings');
      cy.get('[id="version-select"]').should('not.exist');
      cy.get('p:contains("Sign In User")').should('be.visible');
    });

    it('should handle sign in with invalid credentials', () => {
      cy.get('input[id="email"]').type('invalid@example.com');
      cy.get('input[id="password"]').type('password');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/');
      cy.get('div[role="status"]:contains("Something went wrong")')
        .should('be.visible')
        .should('contain.text', 'user-not-found');

      cy.wait(2000); // Wait to ensure previous error message is cleared
      cy.get('div[role="status"]:contains("Something went wrong")').should('not.exist');

      cy.get('input[id="email"]').type(Cypress.testUser.email);
      cy.get('input[id="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/');
      cy.get('div[role="status"]:contains("Something went wrong")')
        .should('be.visible')
        .should('contain.text', 'wrong-password');
    });

    it('should allow user to retry after network failure', () => {
      cy.get('input[id="email"]').type(Cypress.testUser.email);
      cy.get('input[id="password"]').type(Cypress.testUser.password);

      cy.intercept(
        {
          method: 'POST',
          url: '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**',
          times: 2
        },
        {
          forceNetworkError: true
        }
      ).as('network');

      cy.get('button[type="submit"]').click();
      cy.wait('@network');

      cy.get('div[role="status"]:contains("Something went wrong")').should('be.visible');
      cy.get('button[type="submit"]').should('be.enabled');

      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/create');
    });

    it('should maintain authentication across page refreshes', () => {
      cy.get('input[id="email"]').type(Cypress.testUser.email);
      cy.get('input[id="password"]').type(Cypress.testUser.password);
      cy.get('button[type="submit"]').click();

      cy.visit('/settings');
      cy.get('[id="version-select"]').should('be.visible');

      cy.reload();
      cy.get('[id="version-select"]').should('be.visible');
      cy.url().should('include', '/settings');
    });

    it('should handle session expiration gracefully', () => {
      cy.login(Cypress.testUser.uid);
      cy.visit('/settings');
      cy.get('[id="version-select"]').should('be.visible');

      cy.logout();
      cy.url().should('not.include', '/settings');
      cy.get('input[id="email"]').should('be.visible');
    });
  });

  describe('Sign Up and Onboarding Flow', () => {
    const testUser = {
      uid: 'incomplete-user-id',
      email: 'incomplete@example.com',
      password: 'password123'
    };

    afterEach(() => {
      cy.authGetUser(testUser.uid).then((existingUser) => {
        if (existingUser?.uid) {
          cy.authDeleteUser(testUser.uid);
          cy.callFirestore('delete', `users/${testUser.uid}`);
        }
      });
    });

    it('should validate form fields and test form interactions before allowing submission', () => {
      cy.get('button[type="reset"]').click();
      cy.get('button[type="submit"]').should('contain.text', 'Sign Up');

      cy.get('input[id="name"]').type('Jo').should('have.value', 'Jo').blur();
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('input[id="email"]').type('invalid-email').should('have.value', 'invalid-email').blur();
      cy.get('input[id="email"]')
        .parentsUntil('.MuiFormControl-root').parent()
        .should('contain.text', 'Invalid Email');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('input[id="email"]').clear().type(Cypress.testUser.email);

      cy.get('input[id="password"]').type('weak').should('have.value', 'weak').blur();
      cy.get('input[id="password"]').parentsUntil('.MuiFormControl-root').parent()
        .should('contain.text', 'PasswordMust be at least 8 charactersMust contain at least 1 numberMust contain at least 1 uppercaseMust contain at least 1 special character in .,:;?!@$%&*^=+~_-');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('input[id="password"]').should('have.attr', 'type', 'password');
      cy.get('[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]').first().click();
      cy.get('input[id="password"]').should('have.attr', 'type', 'input');
      cy.get('input[id="password"]').should('have.value', 'weak');
      cy.get('[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]').first().click();
      cy.get('input[id="password"]').should('have.attr', 'type', 'password');

      cy.get('input[id="password"]').clear().type(testUser.password);

      cy.get('input[id="passwordConfrim"]').type('differentPassword').should('have.value', 'differentPassword').blur();
      cy.get('input[id="passwordConfrim"]').parentsUntil('.MuiFormControl-root').parent().should('contain.text', 'Passwords mismatch');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('input[id="passwordConfrim"]').clear().type(testUser.password).blur();
      cy.get('button[type="submit"]').should('be.enabled').click();

      cy.get('div[role="status"]:contains("Something went wrong")')
        .should('be.visible')
        .should('contain.text', 'email-already-in-use');

      cy.get('button[type="reset"]').click();
      cy.get('input[id="email"]').should('have.value', '');
      cy.get('input[id="password"]').should('have.value', '');
      cy.get('input[id="name"]').should('not.exist');

      cy.get('input[id="email"]').type('user@example.com');
      cy.get('input[id="password"]').type('password123');
      cy.get('button[type="reset"]').click();
      cy.get('input[id="email"]').should('have.value', '');
      cy.get('input[id="password"]').should('have.value', '');

      cy.get('input[id="name"]').type('Test User');
      cy.get('input[id="email"]').type(testUser.email);
      cy.get('input[id="password"]').type(testUser.password);
      cy.get('input[id="passwordConfrim"]').type(testUser.password);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/settings');
      cy.get('[id="version-select"]').should('be.visible');
    });
  });
});
