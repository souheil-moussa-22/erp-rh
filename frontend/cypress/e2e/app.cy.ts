describe('ERP Application', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the application title', () => {
    cy.contains('ERP System').should('be.visible');
  });

  it('should load the login page', () => {
    cy.url().should('include', '/');
  });
});
