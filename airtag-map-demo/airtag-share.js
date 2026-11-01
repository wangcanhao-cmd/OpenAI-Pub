/* Official Apple Find Lost Item share-link launcher.
 * The share URL does NOT expose a supported coordinate API to this static page.
 * This module deliberately never fetches, frames, scrapes, or sends the URL elsewhere.
 */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const memoryKey = "airtag-map-demo-apple-share-url-v1";
  const field = $("liveShareUrl");
  const status = $("liveShareStatus");
  if (!field || !status) return;
  let cached = "";
  function message(str){status.textContent=str;}
  function parseOfficialShareLink(input) {
    const raw=String(input || "").trim();
    let parsed;
    try {parsed=new URL(raw);} catch(err){throw Error("请输入完整的 Apple「共享物品位置」链接。");}
    if(parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hostname.toLowerCase() !== "find.apple.com") {
      throw Error("仅接受 https://find.apple.com/ 官方共享位置链接，不接受其他网站。");
    }
    if(parsed.pathname === "/" || parsed.pathname.length<5) throw Error("这看起来不是具体物品的共享链接。请从「查找 → 共享物品位置」复制完整链接。");
    return parsed.href;
  }
  function getLink() {
    const value=field.value.trim() || cached;
    return parseOfficialShareLink(value);
  }
  function showState(){
    $("openLiveShare").disabled = !field.value.trim() && !cached;
    $("clearLiveShare").disabled = !field.value.trim() && !cached;
  }
  function cacheValue(url) {
    cached=url;
    try {sessionStorage.setItem(memoryKey,url);}catch(e){}
    // Long-term retention is explicitly opt-in due to sensitive location-access URL.
    if($("rememberLiveShare").checked) {
      try {localStorage.setItem(memoryKey,url);}catch(e){message("仅保存在当前会话：浏览器禁止长期本地存储。");}
    } else {
      try {localStorage.removeItem(memoryKey);}catch(e){}
    }
  }
  function save() {
    try {
      const url=parseOfficialShareLink(field.value);
      cacheValue(url);
      message($("rememberLiveShare").checked ?
        "共享链接已保存在此浏览器。有效期最多 7 天；访问仍需按 Apple 要求验证身份。" :
        "共享链接已保存在当前标签页会话；关闭该标签页后可能需要再次粘贴。");
      showState();
    }catch(err){message("保存失败："+err.message);}
  }
  function openOfficial() {
    try {
      const url=getLink();
      // Perform navigation directly inside click handler: important for iOS popup blockers.
      cacheValue(url);
      $("manualOpenLiveShare").href=url;
      $("manualOpenLiveShare").hidden=false;
      message("正在跳转到 Apple 官方共享位置视图。该视图可以显示新的报告，但本站无法读取其经纬度。");
      // Same-tab navigation works reliably with Safari universal links and avoids popup-blocker behavior.
      window.location.assign(url);
    }catch(err){message("无法打开："+err.message);}
  }
  $("saveLiveShare").addEventListener("click",save);
  $("openLiveShare").addEventListener("click",openOfficial);
  $("manualOpenLiveShare").addEventListener("click",()=>{
    try{$("manualOpenLiveShare").href=getLink();}catch(err){message(err.message);}
  });
  $("pasteLiveShare").addEventListener("click",async()=>{
    try {
      if(!navigator.clipboard?.readText)throw Error("请长按输入框并选择「粘贴」。");
      const text=await navigator.clipboard.readText();
      field.value=parseOfficialShareLink(text);
      showState();
      message("已粘贴官方共享链接。点击「保存」后可重复查看 Apple 的最新位置。");
    }catch(err){message("粘贴失败："+err.message);}
  });
  $("clearLiveShare").addEventListener("click",()=>{
    field.value="";cached="";
    $("rememberLiveShare").checked=false;
    $("manualOpenLiveShare").hidden=true;
    $("manualOpenLiveShare").removeAttribute("href");
    try{localStorage.removeItem(memoryKey);sessionStorage.removeItem(memoryKey);}catch(err){}
    showState();message("已清除当前浏览器保存的共享链接。Apple 上已经生成的共享不会因此停止，需在「查找」中停止共享。");
  });
  field.addEventListener("input",()=>{$("manualOpenLiveShare").hidden=true;showState();});
  $("rememberLiveShare").addEventListener("change",()=>{
    if(cached){cacheValue(cached);message($("rememberLiveShare").checked?"已切换为此浏览器长期保留共享链接。":"长期保存已关闭，当前标签页仍保留链接。");}
  });
  try {
    const fromLocal=localStorage.getItem(memoryKey);
    const fromSession=sessionStorage.getItem(memoryKey);
    const loaded=fromSession||fromLocal;
    if(loaded) {
      cached=parseOfficialShareLink(loaded);
      field.value=cached;
      $("rememberLiveShare").checked=Boolean(fromLocal);
    }
  } catch(e) {cached="";}
  showState();
  message(cached?"已恢复保存的共享链接。点击「查看／刷新 Apple 位置」即可重新查看官方最新报告。":"尚未连接 Apple 共享链接。仅当 AirTag 不在你的设备附近时，才可能创建「共享物品位置」链接。");
})();