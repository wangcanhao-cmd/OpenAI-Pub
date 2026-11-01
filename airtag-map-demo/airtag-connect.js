/* AirTag map link importer: manual, on-device only. No Find My login or cloud scraping. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function validPair(lat, lng) {
    lat = Number(lat); lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return {lat, lng};
  }
  function parsePair(value) {
    if (!value) return null;
    const cleaned = String(value).trim().replace(/^loc:/i, "");
    const match = cleaned.match(/^([-+]?(?:\d+(?:\.\d+)?|\.\d+))\s*[,，]\s*([-+]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s|$)/);
    return match ? validPair(match[1], match[2]) : null;
  }
  function parseMapLocation(raw) {
    const str = String(raw || "").trim();
    if (!str) throw Error("请粘贴 Apple 地图链接或经纬度。");
    const plain = parsePair(str);
    if (plain) return {...plain, kind:"coordinates"};
    let url;
    try { url = new URL(str); } catch (e) { throw Error("不是有效链接。可直接输入纬度,经度。"); }
    if (!["https:","http:"].includes(url.protocol)) throw Error("只支持 HTTPS 地图链接。");
    const host = url.hostname.toLowerCase();
    if (/(^|\.)icloud\.com$/.test(host) || /(^|\.)findmy\.apple\.com$/.test(host)) {
      throw Error("这是 Find My 共享位置页面，不包含可直接读取的经纬度。请从「查找 → 路线 → Apple 地图」分享目的地。");
    }
    const apple = host === "maps.apple.com" || host === "maps.apple";
    const google = host === "maps.google.com" || host === "google.com" || host === "www.google.com" || host.endsWith(".google.com");
    if (!apple && !google) throw Error("目前只支持 Apple Maps / Google Maps 的坐标链接，不能直接读取 Find My 共享网页。");
    if (host === "maps.apple") throw Error("Apple 短链接未包含明文坐标。请在地图中打开后，复制完整目的地链接。");
    const p = url.searchParams;
    let result = null;
    if (apple) {
      // Apple Map Links (legacy) and unified URLs. Never use sll (search bias) as the destination.
      for (const field of ["coordinate","destination-coordinate","ll","daddr","destination","q"]) {
        result = parsePair(p.get(field));
        if (result) break;
      }
      if (!result && url.pathname.startsWith("/place/")) {
        const segments = decodeURIComponent(url.pathname).split("/");
        result = parsePair(segments.find(s => /^[-+]?\d+(?:\.\d+)?\s*,/.test(s)));
      }
    } else {
      for (const field of ["query","q","destination","daddr"]) {
        result = parsePair(p.get(field));
        if (result) break;
      }
      if (!result) {
        const at = url.pathname.match(/@([-+]?\d+(?:\.\d+)?),([-+]?\d+(?:\.\d+)?)/);
        if (at) result = validPair(at[1],at[2]);
      }
      if (!result) {
        const marker = (url.pathname + url.search).match(/!3d([-+]?\d+(?:\.\d+)?)!4d([-+]?\d+(?:\.\d+)?)/);
        if (marker) result = validPair(marker[1],marker[2]);
      }
    }
    if (!result) throw Error("地图链接没有公开的经纬度，可能只含地点 ID、地址或短链接。请打开目的地后复制坐标链接，或手动填写坐标。");
    return {...result,kind:apple?"apple-map-link":"google-map-link"};
  }
  // Exposed only for easy browser-console testing, not for credential access.
  window.AirTagMapImporter = Object.freeze({parseMapLocation});

  const form = $("airtagLinkForm");
  if (!form) return;

  function capture() {
    try {
      const result = parseMapLocation($("airtagLink").value);
      const given = $("airtagReportAt").value;
      if (given && Number.isNaN(new Date(given).getTime())) throw Error("报告时间格式无效");
      const hasRealReportTime = Boolean(given);
      const now = new Date();
      const point = {
        label: $("airtagName").value.trim() || "AirTag · Apple 地图位置",
        lat: result.lat,
        lng: result.lng,
        timestamp: hasRealReportTime ? new Date(given).toISOString() : now.toISOString(),
        capturedAt: now.toISOString(),
        timestampKind: hasRealReportTime ? "reported" : "captured",
        source: "findmy-map-link"
      };
      addPoint(point);
      notify(hasRealReportTime ? "已保存通过地图链接获取的坐标及你填写的 Find My 报告时间。" :
        "已保存地图链接坐标。因未提供 Find My 的报告时间，列表标记为「采集时间」，不作为实时定位。");
      $("airtagLink").value = "";
    } catch (e) { notify("无法导入 AirTag 地图点：" + e.message); }
  }
  form.addEventListener("submit", (e) => {e.preventDefault();capture();});
  $("pasteAirTagLink").addEventListener("click", async () => {
    if (!navigator.clipboard?.readText) {notify("当前浏览器不支持读取剪贴板，请长按输入框粘贴。");return;}
    try {
      const value = await navigator.clipboard.readText();
      $("airtagLink").value = value;
      notify("已从剪贴板粘贴。确认链接来自「查找 → 路线」后点击导入。");
    } catch (e) { notify("Safari 未允许读取剪贴板，请长按输入框选择「粘贴」。"); }
  });
})();