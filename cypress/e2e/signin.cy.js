describe("signin tests", () => {
  it("tests the sign in functionality", () => {
    cy.visit("/login");
    cy.contains(/Sign in/i);

    // Fail the login request for empty fields
    cy.intercept("POST", "/auth/login").as("loginRequest");
    cy.getDataTest("submit-btn").click();
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(403);
      cy.contains(/"username" is not allowed to be empty/i);
    });

    // Fail the login request for unregistered email
    cy.getDataTest("email-field").find("input").type("abcxyz@gmail.com");
    cy.getDataTest("password-field").find("input").type("pass134256783");
    cy.getDataTest("submit-btn").click();
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(401);
      cy.contains(/No user with such email exists/i);
    });

    // Fail the login request for wrong password
    cy.getDataTest("email-field").find("input").clear().type("testuser");
    cy.getDataTest("password-field")
      .find("input")
      .clear()
      .type("wrongpassword");
    cy.getDataTest("submit-btn").click();
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(401);
      cy.contains(/Incorrect password/i);
    });

    // Successful login
    cy.getDataTest("email-field").find("input").clear().type("testuser");
    cy.getDataTest("password-field").find("input").clear().type("testpassword");
    cy.getDataTest("submit-btn").click();
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      cy.getCookie("accessToken").should("exist");
    });
    cy.url().should("include", "/room");
  });
});
