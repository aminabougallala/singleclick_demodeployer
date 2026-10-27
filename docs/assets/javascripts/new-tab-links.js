// Every link that leaves the guide opens in a new tab, so a student never
// loses the page they are following. Links inside the site keep the same tab.
(function () {
  function retarget() {
    document.querySelectorAll(".md-content a[href]").forEach(function (a) {
      if (a.host && a.host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });
  }
  if (window.document$) { window.document$.subscribe(retarget); } else { document.addEventListener("DOMContentLoaded", retarget); }
})();
