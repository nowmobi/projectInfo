import { ad_code_identifier } from "./ads.js";

console.log("Loading detailgg_ads.js...");

export function initAdsense() {
    const adConf = ad_code_identifier;

    // load GA4 gtag
    loadGtag(adConf.gtag);

    // adsense
    if (adConf.cate !== "ads" || adConf.status !== 1) {
        console.log("close ad status");
        return;
    }

    const clientId = adConf.client;
    // adunit
    const adUnitList = Object.values(adConf.adunit);
    if (adUnitList.length === 0) {
        console.warn("adunit none, exit");
        return;
    }
    const firstAdUnit = adUnitList[0];
    const rawDetailSlots = firstAdUnit.detail || [];

    // Adsense SDK
    loadAdSenseSDK(clientId, function () {
        // ========== detail ==========
        let detailSlots = rawDetailSlots.map(item => item.slot);
        if (adConf.randad !== 0) {
            detailSlots = shuffleArray(detailSlots);
            console.log("detail ad is rand", detailSlots);
        }
        detailSlots.forEach((slot, index) => {
            const targetId = `div-gpt-ad-detail${index + 1}`;
            const wrapDom = document.getElementById(targetId);
            if (!wrapDom) {
                console.warn(`can not found detail div #${targetId}`);
                return;
            }
            buildAdSlot(wrapDom, clientId, slot);
        });
    });
}

/**
 * Fisher-Yates
 */
function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * GA4 gtag.js
 */
function loadGtag(measurementId) {
    if (!measurementId || window.gtagLoaded) return;
    window.gtagLoaded = true;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
    `;
    document.head.appendChild(script2);
}

/**
 * Adsense SDK
 */
function loadAdSenseSDK(clientId, onReady) {
    if (window.adsSdkLoaded) {
        onReady();
        return;
    }
    window.adsSdkLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.onload = function () {
        setTimeout(onReady, 80);
    };
    document.head.appendChild(script);
}

/**
 * 构建单个广告位：清空目标 div，插入 ins 元素，延迟 push
 */
function buildAdSlot(wrapDom, client, slot) {
    wrapDom.innerHTML = "";

    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.style.width = "100%";
    ins.dataset.adClient = client;
    ins.dataset.adSlot = slot;
    ins.dataset.adFormat = "auto";
    ins.dataset.fullWidthResponsive = "true";

    wrapDom.appendChild(ins);

    setTimeout(() => {
        tryPushAd(ins);
    }, 160);
}

function tryPushAd(adEl) {
    const rect = adEl.getBoundingClientRect();
    if (rect.width <= 30) {
        setTimeout(() => tryPushAd(adEl), 200);
        return;
    }
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`ad slot[${adEl.dataset.adSlot}] push succ`);
    } catch (err) {
        console.warn(`push error:`, err.message);
    }
}

// detailgg_ads.js 由 detail.html 内联模块脚本动态创建，
// 此时 DOMContentLoaded 早已触发，需要直接调用
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdsense);
} else {
    initAdsense();
}

console.log("✅ detailgg_ads.js loaded successfully");