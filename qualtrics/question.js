/*
 * Paste into the JavaScript of the Qualtrics question that contains the iframe.
 * 1. In Survey Flow, BEFORE this block, add Embedded Data fields:
 *      b4c_json, b4c_version, b4c_seed, b4c_duration_s, b4c_check_attempts,
 *      and for n = 1..8: b4c_n_trip, b4c_n_set, b4c_n_ai, b4c_n_rec, b4c_n_choice, b4c_n_code,
 *      b4c_n_follow, b4c_n_over, b4c_n_just, b4c_n_addons, b4c_n_bleisure, b4c_n_rt
 * 2. Replace APP_ORIGIN with your Vercel URL (no trailing slash).
 * 3. Question HTML (Rich Content Editor > Source):
 *      <iframe id="b4c-frame" src="https://APP_HOST/?pid=${e://Field/ResponseID}"
 *              style="width:100%;height:900px;border:0" title="Flight booking task"></iframe>
 *
 * Works in both the Simple and Classic layouts: it uses setJSEmbeddedData when available
 * (Simple layout, which prefixes fields with __js_) and setEmbeddedData otherwise.
 */
Qualtrics.SurveyEngine.addOnload(function () {
  var APP_ORIGIN = 'https://YOUR-APP.vercel.app';
  var q = this;
  q.hideNextButton();

  function setED(key, value) {
    if (typeof Qualtrics.SurveyEngine.setJSEmbeddedData === 'function') {
      Qualtrics.SurveyEngine.setJSEmbeddedData(key, value);
    } else {
      Qualtrics.SurveyEngine.setEmbeddedData(key, value);
    }
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== APP_ORIGIN || !e.data || typeof e.data.type !== 'string') return;
    var frame = document.getElementById('b4c-frame');

    if (e.data.type === 'btps4c-resize' && frame && e.data.payload) {
      frame.style.height = Math.max(600, e.data.payload.height + 20) + 'px';
    }

    if (e.data.type === 'btps4c-complete') {
      var p = e.data.payload;
      setED('b4c_json', JSON.stringify(p.data));
      Object.keys(p.flat).forEach(function (k) { setED(k, p.flat[k]); });
      q.showNextButton();
    }
  });
});
