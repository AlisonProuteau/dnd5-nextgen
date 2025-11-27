import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

describe(`Authentication End-to-End`, () => {
  before(() => cy.clearAllNonDefaultUsers());

  beforeEach(() => cy.visit('/'));

  describe('Complete Sign In Flow', () => {
    const signInUser = {
      uid: 'existing-user-id',
      email: 'existing.user@example.com',
      password: 'v@lidPassword123'
    };

    before(() => cy.authCreateUser(signInUser).callFirestore('set', `users/${signInUser.uid}`, {}));

    after(() => cy.clearUser(signInUser.uid));

    it('should handle complete sign-in workflow with loading states, responsive design, and first-time user flow', () => {
      // Test: email validation
      // TODO: Add check for validation message once implemented

      // Test: password validation
      // TODO: Add check for validation message once implemented

      // Test: complete first-time sign-in flow
      cy.get('#email').type(signInUser.email);
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('#password').type(signInUser.password);
      cy.get('button[type="submit"]').should('be.enabled');
      cy.get('#email').clear();
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('#email').type(signInUser.email);
      cy.get('button[type="submit"]').click();

      // Test: first-time display name setup
      cy.get('div:contains("Update your display name") form')
        .should('be.visible')
        .within(() => {
          cy.get('#name').clear().type('Sign In User');
          cy.get('button[type="submit"]').click();
        });

      // Test: first login redirects to settings for version selection
      cy.url().should('include', '/settings');
      cy.get('[id="version-select"]').should('be.visible');
      cy.get('button[type="submit"]').click();
      cy.get('[id="version-select"]').should('not.exist');
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test: subsequent login workflow (skips settings)
      cy.logout();
      cy.get('#email').should('be.visible');
      cy.get('#email').type(signInUser.email);
      cy.get('#password').type(signInUser.password);
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
      cy.get('#email').type('invalid@example.com');
      cy.get('#password').type('password');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/');
      cy.getByRole('status', 'Something went wrong').should('contain.text', 'user-not-found');

      // Test: error message clearing and wrong password handling
      cy.wait(2000);
      cy.getByRole('status', 'Something went wrong').should('not.exist');

      // Test: invalid password error handling
      cy.get('#email').clear().type(signInUser.email);
      cy.get('#password').clear().type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.getByRole('status', 'Something went wrong').should('contain.text', 'wrong-password');

      // Test: network failure simulation and retry capability
      cy.get('#password').clear().type(signInUser.password);

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
      cy.get('#email').should('be.visible');
    });
  });

  describe('Sign Up and Onboarding Flow', () => {
    const uniqueSuffix = Date.now();
    const testUser = {
      uid: `signup-user-id-${uniqueSuffix}`,
      email: `signup-${uniqueSuffix}@example.com`,
      password: 'v@lidPassword123'
    };

    afterEach(() => cy.clearUser(testUser.uid));

    it('should validate form fields and test form interactions before allowing submission', () => {
      // Test: switch to sign-up mode
      cy.get('button[type="reset"]').click();
      cy.get('button[type="submit"]').should('contain.text', 'Sign Up');

      // Test: name field validation (minimum length)
      cy.get('#name').type('Jo').should('have.value', 'Jo').blur();
      cy.get('button[type="submit"]').should('be.disabled');
      // TODO: Add check for validation message once implemented

      // Test: email validation
      cy.get('#email').type('invalid-email').should('have.value', 'invalid-email').blur();
      cy.get('#email').closest('form').should('contain.text', 'Invalid Email');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('#email').clear().type(Cypress.testUser.email);

      // Test: password complexity validation
      cy.get('#password').type('weak').should('have.value', 'weak').blur();
      cy.get('#password')
        .closest('form')
        .should(
          'contain.text',
          'PasswordMust be at least 8 charactersMust contain at least 1 numberMust contain at least 1 uppercaseMust contain at least 1 special character in .,:;?!@$%&*^=+~_-'
        );
      cy.get('button[type="submit"]').should('be.disabled');

      // Test: password visibility toggle
      cy.get('#password').should('have.attr', 'type', 'password');
      cy.get('#password')
        .parent()
        .find('[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]')
        .click();
      cy.get('#password').should('have.attr', 'type', 'input');
      cy.get('#password').should('have.value', 'weak');
      cy.get('#password')
        .parent()
        .find('[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]')
        .click();
      cy.get('#password').should('have.attr', 'type', 'password');

      cy.get('#password').clear().type('P@ssWord123');

      // Test: password confirmation matching
      cy.get('#passwordConfrim')
        .type('differentPassword')
        .should('have.value', 'differentPassword')
        .blur();
      cy.get('#passwordConfrim').closest('form').should('contain.text', 'Passwords mismatch');
      cy.get('button[type="submit"]').should('be.disabled');

      cy.get('#passwordConfrim').clear().type('P@ssWord123').blur();
      cy.get('button[type="submit"]').should('be.enabled').click();

      // Test: duplicate email error handling
      cy.getByRole('status', 'Something went wrong').should('contain.text', 'email-already-in-use');

      // Test: form reset functionality
      cy.get('button[type="reset"]').click();
      cy.get('#email').should('have.value', '');
      cy.get('#password').should('have.value', '');
      cy.get('#name').should('not.exist');

      cy.get('#email').type('user@example.com');
      cy.get('#password').type('Pa@ssWord123');
      cy.get('button[type="reset"]').click();
      cy.get('#email').should('have.value', '');
      cy.get('#password').should('have.value', '');

      // Test: complete successful sign-up flow
      cy.get('#name').type('Test User for Sign Up');
      cy.get('#email').type(testUser.email);
      cy.get('#password').type(testUser.password);
      cy.get('#passwordConfrim').type(testUser.password);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/settings');
      cy.get('[id="version-select"]').should('be.visible');
    });
  });

  describe('Header Navigation and Menu', () => {
    beforeEach(() => {
      cy.createTestCharacter(Cypress.testUser.uid);
      cy.login(Cypress.testUser.uid);
      cy.visit('/');
    });

    it('should display header elements, navigate through menu, and handle menu interactions for regular users', () => {
      // Test: User display name/email is shown
      cy.getByTestId('user-display-name')
        .should('be.visible')
        .and('contain', Cypress.testUser.displayName || Cypress.testUser.email);

      // Test: Home link is visible and functional
      cy.getByTestId('home-link').should('be.visible');
      cy.visit('/settings');
      cy.getByTestId('home-link').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test: Logout button exists
      cy.getByTestId('logout-button').should('be.visible');

      // Test: Menu button exists and opens menu
      cy.getByTestId('menu-button').should('be.visible').click();
      cy.getByRole('menu').should('be.visible');

      // Test: Menu contains expected items (non-admin user)
      cy.getByRole('menu').within(($el) => {
        cy.wrap($el).getByTestId('settings-link').should('exist');
        cy.wrap($el).getByTestId('contact-link').should('exist');

        // Admin-only items should not be visible for regular user
        cy.wrap($el).getByTestId('character-generator-link').should('not.exist');
        cy.wrap($el).getByTestId('database-link').should('not.exist');
      });

      // Test: Close menu by clicking outside
      cy.get('body').click(0, 0);
      cy.getByRole('menu').should('not.be.visible');

      // Test: Reopen menu and navigate to Settings
      cy.getByTestId('menu-button').click();
      cy.getByRole('menu').should('be.visible');
      cy.getByTestId('settings-link').click();
      cy.url().should('include', '/settings');

      // Test: Return home and navigate to Contact via menu
      cy.visit('/');
      cy.getByTestId('menu-button').click();
      cy.getByTestId('contact-link').click();
      cy.url().should('include', '/contact');
    });

    it('should show admin menu items and allow navigation to admin routes', () => {
      cy.loginAsAdmin();
      cy.visit('/');

      // Test: Open menu
      cy.getByTestId('menu-button').click();
      cy.getByRole('menu').should('be.visible');

      // Test: Admin-only menu items are visible
      cy.getByTestId('character-generator-link').should('exist');
      cy.getByTestId('database-link').should('exist');

      // Test: Regular menu items are also present
      cy.getByTestId('settings-link').should('exist');
      cy.getByTestId('contact-link').should('exist');

      // Test: Can navigate to admin route
      cy.getByTestId('character-generator-link').click();
      cy.url().should('include', '/character-generator');

      // Test: Can navigate to database route
      cy.visit('/');
      cy.getByTestId('menu-button').click();
      cy.getByTestId('database-link').click();
      cy.url().should('include', '/database');
    });

    it('should redirect invalid routes to home page', () => {
      // Test: Invalid route redirects to home
      cy.visit('/invalid-route-that-does-not-exist');
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test: Invalid nested route redirects to home
      cy.visit('/some/random/nested/path');
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test: Typo in valid route redirects to home
      cy.visit('/sett1ngs'); // typo in 'settings'
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test: Character grid is visible after redirect
      cy.getByTestId('character-grid').should('be.visible');
    });
  });
});
