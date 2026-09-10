/* Objectle agent prompt builder (static pass page; mirror of app/src/lib/prompt.ts) */
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
    var room = code || "ROOM";
    var host = gameUrl();
    return (
      "You are playing Objectle, a daily 3D object guessing game.\n" +
      "A human is watching the open Objectle tab (room " + room + "): " + host + "\n" +
      "Keep that tab visible.\n\n" +
      "Preferred path (same as Foresight shop):\n" +
      "1) If you can call page WebMCP tools on the Objectle tab, use them directly:\n" +
      "   read_view, rotate_object({axis, degrees}), zoom({level}), publish_status({headline}), submit_guess({name})\n" +
      "2) After each move, tell your human to watch the Objectle stage (it should animate).\n\n" +
      "Fallback if page tools are unavailable" + (code ? "" : " (ask your human for the 4-letter room code first)") + ":\n" +
      "- Fetch the room manual: " + (code ? manualUrl(code) : apiUrl() + "/room/<CODE>") + "\n" +
      "- Or add MCP: " + (code ? mcpUrl(code) : apiUrl().replace(/\/api$/, "") + "/mcp/<CODE>") + "\n\n" +
      "Rules: 6 guesses. Facet feedback after each guess (category, material, scale). Synonyms count.\n" +
      "Start now with read_view, then rotate_object around y by 30, then read_view again."
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
