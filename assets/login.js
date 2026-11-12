/* Google login in its own tab, so this page's Back button never gets Google pages.
   The login tab closes itself when done; this page then refreshes and shows the Gmail. */
(function () {
  var KEY = "payal_login_tab";
  function authKey(k) { return /^sb-.*-auth-token$/.test(k || ""); }
  function after() {
    var pp = null, dl = null;
    try { pp = sessionStorage.getItem("payal_plan"); dl = sessionStorage.getItem("payal_dl"); } catch (e) {}
    if ((pp === "plus" || pp === "pro") && !/plan\.html/.test(location.pathname)) { location.href = "plan.html?plan=" + pp; return; }
    if (dl === "1" && !/account\.html/.test(location.pathname)) { location.href = "account.html"; return; }
    location.reload();
  }
  var waiting = false;
  function wait() {
    if (waiting) return; waiting = true;
    window.addEventListener("storage", function (e) { if (authKey(e.key) && e.newValue) after(); });
  }
  /* open the Google login; returns true when it opened in a new tab */
  window.payalOpenLogin = function (url) {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    var w = null;
    try { w = window.open(url, "_blank"); } catch (e) {}
    if (!w) { try { localStorage.removeItem(KEY); } catch (e) {} location.href = url; return false; }
    wait();
    return true;
  };
  /* called on the page Google comes back to: if this is the login tab, close it */
  window.payalLoginTabDone = function () {
    var t = 0; try { t = +localStorage.getItem(KEY) || 0; } catch (e) {}
    if (!t || Date.now() - t > 15 * 60000) return false;
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { window.close(); } catch (e) {}
    setTimeout(function () { location.replace("index.html"); }, 500);
    return true;
  };
})();
