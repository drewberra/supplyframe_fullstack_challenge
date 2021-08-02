describe("Hackaday Projects - Test to verify basic functionality.", function () {
    test("Landing Page.", function (browser) {
        browser.url("http://localhost:8000/");
        browser.expect.elements(".project").count.to.equal(50);
        browser.assert.containsText(".meta-data", "views:");
        browser.assert.containsText(".meta-data", "comments:");
        browser.assert.containsText(".meta-data", "followers:");
        browser.assert.containsText(".meta-data", "skulls:");
        browser.end();
    });

    test("Project Page.", function (browser) {
        browser.url("http://localhost:8000/");
        browser.expect.elements(".project").count.to.equal(50);
        browser.click(".project:nth-of-type(1)");
        browser.assert.containsText(".header-site-name", "Hackaday Projects");
        browser.assert.containsText(".creation-info", "created");
        browser.assert.containsText(".meta-data", "views:");
        browser.assert.containsText(".meta-data", "comments:");
        browser.assert.containsText(".meta-data", "followers:");
        browser.assert.containsText(".meta-data", "skulls:");
        browser.assert.containsText("#summary", "Summary:");
        browser.assert.containsText("#description", "Description:");
        browser.end();
    });

    test("Project Page - Related Projects.", function (browser) {
        browser.url("http://localhost:8000/project/181021/");
        browser.expect.elements(".project").count.to.not.equal(0);
        browser.end();
    })
});