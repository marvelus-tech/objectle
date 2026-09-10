/* Objectle agent prompt builder (static page; mirror of app/src/lib/prompt.ts) */
(function (global) {
  "use strict";

  var API = "https://objectle-worker-demo.marvelus.workers.dev/api";
  var LIVE_GAME = "https://marvelus-tech.github.io/objectle/";
  var LIVE_PASS = LIVE_GAME + "pass/";

  function gameUrl() {
    if (typeof document === "undefined" || !document.location) return LIVE_GAME;
    var href = document.location.href.split("#")[0].split("?")[0];
    if (/pass\/?/i.test(href)) {
      return href.replace(/pass\/?.*$/i, "") || LIVE_GAME;
    }
    return href;
  }

  function apiUrl() {
    return API;
  }

  /* Room code from ?room=ABCD (the host screen puts it in the QR). */
  function roomCode() {
    if (typeof document === "undefined" || !document.location) return null;
    var match = /[?&]room=([A-Za-z0-9]{4,8})/.exec(document.location.search);
    return match ? match[1].toUpperCase() : null;
  }

  function manualUrl(code) {
    return apiUrl() + "/room/" + code;
  }

  function mcpUrl(code) {
    return apiUrl().replace(/\/api$/, "") + "/mcp/" + code;
  }

  function agentText() {
    var code = roomCode();
    if (!code) {
      return (
        "You are playing Objectle, a daily 3D object guessing game.\n\n" +
        "Ask your human for the 4-letter room code shown on their screen, then fetch\n" +
        apiUrl() + "/room/<CODE>\n" +
        "and follow the manual it returns. Host screen: " + gameUrl()
      );
    }
    return (
      "You are playing Objectle, a daily 3D object guessing game. A human is watching your moves live on a big screen (room " + code + ").\n\n" +
      "Step 1: Fetch this URL and read it. It is your room manual with the exact tool URLs:\n" +
      manualUrl(code) + "\n\n" +
      "Step 2: Play by fetching the tool URLs (plain GET requests). Every fetch is shown instantly on the human's screen, so narrate in one short sentence what you are doing between calls.\n" +
      "  read_view, rotate_object(axis, degrees), zoom(level), submit_guess(name)\n" +
      "  6 guesses. Facet feedback after each guess: category, material, scale.\n\n" +
      "If your client supports MCP connectors, add " + mcpUrl(code) + " (Streamable HTTP, no auth) to get the same tools natively.\n\n" +
      "Start now with read_view."
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
    roomCode: roomCode,
    manualUrl: manualUrl,
    mcpUrl: mcpUrl,
    agentText: agentText,
    deepLinks: deepLinks,
    copyText: copyText,
    passUrl: LIVE_PASS,
    liveGame: LIVE_GAME
  };
})(window);
