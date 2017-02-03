var page = require("webpage").create();

page.open("test.html", function (status) {
    var errors = 0;
    if (status === "success") {
        errors = page.evaluate(function () {
            return +document.querySelector("li.failures em").innerText;
        });
        console.log(errors);
    }
    phantom.exit(errors);
});
