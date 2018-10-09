var WindowedModal = require("nativescript-windowed-modal").WindowedModal;
var windowedModal = new WindowedModal();

describe("greet function", function() {
    it("exists", function() {
        expect(windowedModal.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(windowedModal.greet()).toEqual("Hello, NS");
    });
});