describe("user flow while using the website", () => {
  const email = "";
  if (!email) {
    throw new Error("Email not set for testing");
  }
  it("checks normal user using the website", () => {
    // Visit the website and click on the register button
    cy.visit("http://localhost:5173");
    cy.contains(/welcome to Mp4Together/i);
    cy.getDataTest("register-btn").click();

    // check if the user is on the register page and fill the form
    cy.url().should("include", "/register");
    cy.contains(/sign up/i);

    cy.intercept("POST", "/auth/signup").as("registerRequest");
    cy.getDataTest("username-field").within("input", (input) => {
      cy.wrap(input).type("testuser");
    });
    cy.getDataTest("email-field").within("input", (input) => {
      cy.wrap(input).type(email);
    });
    cy.getDataTest("password-field").within("input", (input) => {
      cy.wrap(input).type("testpassword");
    });
    cy.getDataTest("submit-btn").click();
    cy.wait("@registerRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(201);
    });
    cy.intercept("POST", "/auth/verify").as("verifyOtpRequest");
    cy.getDataTest("otp-container").within("input", (input) => {
      cy.wrap(input).type("123456");
    });
    cy.wait("@verifyOtpRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });

    // If the enterd otp is correct, user should be redirected to login page and login
    cy.url().should("include", "/login");
    cy.contains(/Sign in/i);
    cy.getDataTest("email-field").within("input", (input) => {
      cy.wrap(input).type(email);
    });
    cy.getDataTest("password-field").within("input", (input) => {
      cy.wrap(input).type("testpassword");
    });
    cy.intercept("POST", "/auth/login").as("loginRequest");
    cy.getDataTest("submit-btn").click();
    cy.wait("@loginRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });

    // User should be redirected to the room page
    cy.url().should("include", "/room");
    cy.intercept("POST", "/room/create").as("createRoomRequest");
    cy.getDataTest("create-room-btn").click();
    // let roomId;
    cy.wait("@createRoomRequest").then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      const roomId = interception.response.body.roomId;
      // Ensure the URL assertion is made after roomId is assigned
      cy.url().should("include", `/room/${roomId}`);
    });
  });
});
