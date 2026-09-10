/* Objectle agent prompt builder */
(function (global) {
  "use strict";

  var API = "https://objectle-worker-demo.marvelus.workers.dev/api";
  var LIVE_GAME = "https://marvelus-tech.github.io/objectle/";
  var LIVE_PASS = LIVE_GAME + "pass/";

  function gameUrl() {
    if (typeof document === "undefined" || !document.location) return LIVE_GAME;
    try {
      var url = new URL(document.location.href);
      url.hash = "";
      url.pathname = url.pathname.replace(/pass\/?$/i, "");
      return url.toString();
    } catch (error) {
      return LIVE_GAME;
    }
  }

  function apiUrl() {
    return API;
  }

  function agentText() {
    var game = gameUrl();
    var api = apiUrl();
    return (
      "You are playing Objectle. Your human is watching the game on their host screen.\n\n" +
      "Shared theater URL (open this): " + game + "\n" +
      "Worker API: " + api + "\n\n" +
      "How to play:\n" +
      "1. Open the shared theater URL above. Keep its room parameter so your actions appear on the host screen.\n" +
      "2. Use the WebMCP / page modelContext tools to play:\n" +
      "   - read_view() - See current 3D view description\n" +
      "   - rotate_object(axis, degrees) - Rotate for different angles (x/y/z, ±15-45°)\n" +
      "   - zoom(level) - Zoom closer (0-3, unlocks with wrong guesses)\n" +
      "   - publish_status(headline, rationale, candidates, next, confidence) - Share a concise public working theory\n" +
      "   - submit_guess(name) - Submit your guess\n" +
      "3. You have 6 guesses. Facet feedback shows category/material/scale matches.\n" +
      "4. Your human is watching the 3D viewer and agent theater on their screen as you play.\n" +
      "5. Use publish_status before each guess and after interpreting feedback. Share only a short public summary, never private chain-of-thought.\n\n" +
      "Strategy:\n" +
      "- Start with read_view() to see the silhouette\n" +
      "- Rotate around y-axis to see different angles\n" +
      "- Keep up to three candidates with confidence percentages\n" +
      "- Make informed guesses based on shape, facets, and details\n" +
      "- Zoom unlocks progressively (Heardle-style)\n\n" +
      "Play now!"
    );
  }

  function deepLinks(text) {
    var q = encodeURIComponent(text || agentText());
    return {
      grok: "https://grok.com/?q=" + q,
      claude: "https://claude.ai/new?q=" + q,
      chatgpt: "https://chatgpt.com/?q=" + q
    };
  }

  function copyText(text, done) {
    function ok() { if (typeof done === "function") done(true); }
    function fail() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok();
      } catch (err) {
        if (typeof done === "function") done(false);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else {
      fail();
    }
  }

  global.ObjectlePrompt = {
    apiUrl: apiUrl,
    gameUrl: gameUrl,
    agentText: agentText,
    deepLinks: deepLinks,
    copyText: copyText,
    passUrl: LIVE_PASS,
    liveGame: LIVE_GAME
  };
})(window);
