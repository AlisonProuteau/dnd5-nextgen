import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

Cypress.viewports.forEach(({ name, width, height }) =>
  describe(`${name} - Authentication End-to-End`, () => {
    before(() => cy.clearAllNonDefaultUsers());

    beforeEach(() => {
      cy.viewport(width, height);
      cy.visit('/');
    });

    describe('Complete Sign In Flow', () => {
      const signInUser = {
        uid: 'existing-user-id',
        email: 'existing.user@example.com',
        password: 'v@lidPassword123'
      };

      before(() =>
        cy.authCreateUser(signInUser).callFirestore('set', `users/${signInUser.uid}`, {})
      );

      after(() => cy.clearUser(signInUser.uid));

      it('should handle complete sign-in workflow with loading states, responsive design, and first-time user flow', () => {
        // Test: email validation
        // TODO: Add check for validation message once implemented

        // Test: password validation
        // TODO: Add check for validation message once implemented

        // Test: complete first-time sign-in flow
        cy.get('input[id="email"]').type(signInUser.email);
        cy.get('button[type="submit"]').should('be.disabled');
        cy.get('input[id="password"]').type(signInUser.password);
        cy.get('button[type="submit"]').should('be.enabled');
        cy.get('input[id="email"]').clear();
        cy.get('button[type="submit"]').should('be.disabled');
        cy.get('input[id="email"]').type(signInUser.email);
        cy.get('button[type="submit"]').click();

        // Test: first-time display name setup
        cy.get('div:contains("Update your display name") form')
          .should('be.visible')
          .within(() => {
            cy.get('input[id="name"]').clear().type('Sign In User');
            cy.get('button[type="submit"]').click();
          });

        // Test: first login redirects to settings for version selection
        cy.url().should('include', '/settings');
        cy.get('[id="version-select"]').should('be.visible');
        cy.get('button[type="submit"]').click();
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // Test: subsequent login workflow (skips settings)
        cy.logout();
        cy.get('input[id="email"]').should('be.visible');
        cy.get('input[id="email"]').type(signInUser.email);
        cy.get('input[id="password"]').type(signInUser.password);
        cy.get('button[type="submit"]').click();

        cy.url().should('not.include', '/settings');
        cy.get('[id="version-select"]').should('not.exist');
        cy.get('p:contains("Sign In User")').should('be.visible');
        cy.get('div:contains("Update your display name") form').should('not.exist');

        // Test: authentication persistence across page reloads
        cy.visit('/settings');
        cy.get('[id="version-select"]').should('be.visible');
        cy.reload();
        cy.get('[id="version-select"]').should('be.visible');
        cy.url().should('include', '/settings');
      });

      it('should handle authentication errors, network failures, and recovery workflows', () => {
        // Test: invalid user error handling
        cy.get('input[id="email"]').type('invalid@example.com');
        cy.get('input[id="password"]').type('password');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/');
        cy.getByRole('status', 'Something went wrong').should('contain.text', 'user-not-found');

        // Test: error message clearing and wrong password handling
        cy.wait(2000);
        cy.getByRole('status', 'Something went wrong').should('not.exist');

        // Test: invalid password error handling
        cy.get('input[id="email"]').clear().type(Cypress.testUser.email);
        cy.get('input[id="password"]').clear().type('wrongpassword');
        cy.get('button[type="submit"]').click();

        cy.getByRole('status', 'Something went wrong').should('contain.text', 'wrong-password');

        // Test: network failure simulation and retry capability
        cy.get('input[id="password"]').clear().type(Cypress.testUser.password);

        cy.intercept(
          {
            method: 'POST',
            url: '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**',
            times: 2
          },
          {
            forceNetworkError: true
          }
        ).as('networkFailure');

        cy.get('button[type="submit"]').click();
        cy.wait('@networkFailure');
        cy.getByRole('status', 'Something went wrong').should('be.visible');
        cy.get('button[type="submit"]').should('be.enabled');

        cy.intercept({
          method: 'POST',
          url: '**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**'
        });

        // Test: successful retry after error recovery
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/create');

        // Test: session expiration and logout behavior
        cy.logout();
        cy.url().should('not.include', '/create');
        cy.get('input[id="email"]').should('be.visible');
      });
    });

    describe('Sign Up and Onboarding Flow', () => {
      const testUser = {
        uid: 'incomplete-user-id',
        email: 'incomplete@example.com',
        password: 'v@lidPassword123'
      };

      afterEach(() => cy.clearUser(testUser.uid));

      it('should validate form fields and test form interactions before allowing submission', () => {
        // Test: switch to sign-up mode
        cy.get('button[type="reset"]').click();
        cy.get('button[type="submit"]').should('contain.text', 'Sign Up');

        // Test: name field validation (minimum length)
        cy.get('input[id="name"]').type('Jo').should('have.value', 'Jo').blur();
        cy.get('button[type="submit"]').should('be.disabled');
        // TODO: Add check for validation message once implemented

        // Test: email validation
        cy.get('input[id="email"]')
          .type('invalid-email')
          .should('have.value', 'invalid-email')
          .blur();
        cy.get('input[id="email"]').closest('form').should('contain.text', 'Invalid Email');
        cy.get('button[type="submit"]').should('be.disabled');

        cy.get('input[id="email"]').clear().type(Cypress.testUser.email);

        // Test: password complexity validation
        cy.get('input[id="password"]').type('weak').should('have.value', 'weak').blur();
        cy.get('input[id="password"]')
          .closest('form')
          .should(
            'contain.text',
            'PasswordMust be at least 8 charactersMust contain at least 1 numberMust contain at least 1 uppercaseMust contain at least 1 special character in .,:;?!@$%&*^=+~_-'
          );
        cy.get('button[type="submit"]').should('be.disabled');

        // Test: password visibility toggle
        cy.get('input[id="password"]').should('have.attr', 'type', 'password');
        cy.get('[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]').first().click();
        cy.get('input[id="password"]').should('have.attr', 'type', 'input');
        cy.get('input[id="password"]').should('have.value', 'weak');
        cy.get('[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]').first().click();
        cy.get('input[id="password"]').should('have.attr', 'type', 'password');

        cy.get('input[id="password"]').clear().type('P@ssWord123');

        // Test: password confirmation matching
        cy.get('input[id="passwordConfrim"]')
          .type('differentPassword')
          .should('have.value', 'differentPassword')
          .blur();
        cy.get('input[id="passwordConfrim"]')
          .closest('form')
          .should('contain.text', 'Passwords mismatch');
        cy.get('button[type="submit"]').should('be.disabled');

        cy.get('input[id="passwordConfrim"]').clear().type('P@ssWord123').blur();
        cy.get('button[type="submit"]').should('be.enabled').click();

        // Test: duplicate email error handling
        cy.getByRole('status', 'Something went wrong').should(
          'contain.text',
          'email-already-in-use'
        );

        // Test: form reset functionality
        cy.get('button[type="reset"]').click();
        cy.get('input[id="email"]').should('have.value', '');
        cy.get('input[id="password"]').should('have.value', '');
        cy.get('input[id="name"]').should('not.exist');

        cy.get('input[id="email"]').type('user@example.com');
        cy.get('input[id="password"]').type('Pa@ssWord123');
        cy.get('button[type="reset"]').click();
        cy.get('input[id="email"]').should('have.value', '');
        cy.get('input[id="password"]').should('have.value', '');

        // Test: complete successful sign-up flow
        cy.get('input[id="name"]').type('Test User for Sign Up');
        cy.get('input[id="email"]').type(testUser.email);
        cy.get('input[id="password"]').type(testUser.password);
        cy.get('input[id="passwordConfrim"]').type(testUser.password);
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/settings');
        cy.get('[id="version-select"]').should('be.visible');
      });
    });
  })
);
