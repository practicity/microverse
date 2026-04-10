if (new URLSearchParams(window.location.search).get("env") === "local") {
    document.write('<script src="config.local.js"><\/script>');
}
