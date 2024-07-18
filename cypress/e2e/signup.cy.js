describe("signup tests", () => {
  it("tests the sign up functionality", () => {
    cy.visit("/register");
    cy.contains(/sign up/i);

    // Fail the signup request for empty fields
    cy.getDataTest("submit-btn").click();
    cy.getDataTest("email-field").then(($el) => {
      cy.wrap($el).containsPseudo(
        "after",
        /please enter a valid email address/i
      );
    });

    // Fail the signup request for already registered email
    cy.intercept("POST", "/auth/signup").as("signupRequest");
    cy.getDataTest("username-field").find("input").type("john");
    cy.getDataTest("email-field").find("input").type("john@gmail.com");
    cy.getDataTest("password-field").find("input").type("johnpassword");
    cy.getDataTest("submit-btn").click();
    cy.wait("@signupRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(409);
      //   cy.contains(/Email is already registered/i);
      cy.getDataTest("email-field").then(($el) => {
        cy.wrap($el).containsPseudo("after", /Email is already registered/i);
      });
    });

    // Successful signup
    cy.getDataTest("username-field").find("input").clear().type("testuser");
    cy.getDataTest("email-field")
      .find("input")
      .clear()
      .type("testuser@gmail.com");
    cy.getDataTest("password-field").find("input").clear().type("testpassword");
    cy.getDataTest("submit-btn").click();
    cy.wait("@signupRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(201);
    });
    cy.url().should("include", "/login");
  });
});
