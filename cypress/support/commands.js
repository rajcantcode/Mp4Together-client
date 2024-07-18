// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("getDataTest", (selector) => {
  return cy.get(`[data-test=${selector}]`);
});

// Custom command to assert text content in ::before or ::after pseudo-elements
Cypress.Commands.add(
  "containsPseudo",
  { prevSubject: true },
  (subject, position, content) => {
    // position should be either 'before' or 'after'
    cy.wrap(subject).then(($el) => {
      let pseudoContent = window
        .getComputedStyle($el[0], `::${position}`)
        .getPropertyValue("content");
      pseudoContent = pseudoContent.replace(/^"|"$/g, "");
      expect(pseudoContent).to.match(new RegExp(content, "i"));
      //   expect(pseudoContent).to.contains(content);
    });
  }
);
