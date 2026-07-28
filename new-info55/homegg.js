

import { ad_code_identifier } from "./ads.js";
console.log("Ad Code Identifier:", ad_code_identifier);


let bannerAdList = [];


let anchorAdList = [];


let interstitialAdList = [];

(function () {
  

  
  const status = ad_code_identifier.status;
  console.log("Ad status:", status);

  if (status != 1) {
    console.log("⚠️ Status is not 1, skipping ad initialization");
    return; 
  }

  console.log("✅ Status is 1, proceeding with ad initialization");

  
  const gtagId = ad_code_identifier.gtag;

  
  const gptScript = document.createElement("script");
  gptScript.async = true;
  gptScript.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
  gptScript.crossOrigin = "anonymous";
  document.head.appendChild(gptScript);

  
  const gtagScript = document.createElement("script");
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
  document.head.appendChild(gtagScript);

  
  const gtagConfigScript = document.createElement("script");
  gtagConfigScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gtagId}');
  `;
  document.head.appendChild(gtagConfigScript);

  console.log("✅ Scripts injected into head");

  
  const urlParams = new URLSearchParams(window.location.search);
  const urlChannel = urlParams.get("channel");
  const storedChannel = sessionStorage.getItem("channel");

  
  if (urlChannel) {
    sessionStorage.setItem("channel", urlChannel);
  }

  
  const channelParam = storedChannel || urlChannel;

  
  const randadParam = ad_code_identifier.randad;

  console.log("URL channel parameter:", channelParam);
  console.log("Ad randad parameter:", randadParam);

  
  const adunits = ad_code_identifier.adunit;
  let selectedAdunit = null;

  
  if (channelParam && adunits[channelParam]) {
    selectedAdunit = adunits[channelParam];
    console.log(`✅ Found matching channel: ${channelParam}`);
  } else {
    
    const firstKey = Object.keys(adunits)[0];
    selectedAdunit = adunits[firstKey];
    console.log(`⚠️ No matching channel, using first adunit: ${firstKey}`);
  }

  
  if (selectedAdunit && selectedAdunit.home) {
    bannerAdList = selectedAdunit.home.map((item, index) => ({
      id: `div-gpt-ad-home${index + 1}`,
      size: [item.width, item.height],
      slot: item.slot,
      divId: `div-gpt-ad-home${index + 1}`,
    }));
    console.log("✅ Banner ad list created:", bannerAdList);
  }

  
  if (
    selectedAdunit &&
    selectedAdunit.home_anchor &&
    selectedAdunit.home_anchor.length > 0
  ) {
    anchorAdList = selectedAdunit.home_anchor.map((item) => ({
      slot: item.slot,
    }));
    console.log("✅ Anchor ad list created:", anchorAdList);
  }

  
  if (
    selectedAdunit &&
    selectedAdunit.interstitial &&
    selectedAdunit.interstitial.length > 0
  ) {
    interstitialAdList = selectedAdunit.interstitial.map((item) => ({
      slot: item.slot,
    }));
    console.log("✅ Interstitial ad list created:", interstitialAdList);
  }

  
  if (randadParam == 2 || randadParam == 3) {
    console.log("🎲 Randad is 2 or 3, shuffling ad slots...");

    
    function shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }


    if (bannerAdList.length > 0) {
      const originalSlots = bannerAdList.map((ad) => ad.slot);
      const shuffledSlots = shuffleArray(originalSlots);

      bannerAdList = bannerAdList.map((ad, index) => ({
        ...ad,
        slot: shuffledSlots[index],
      }));

      console.log("✅ Banner ad slots shuffled:", bannerAdList);
    }
  }
})();


const checkGoogleAdSenseLoaded = () => {
  return (
    window.googletag &&
    typeof window.googletag.defineSlot === "function" &&
    typeof window.googletag.pubads === "function" &&
    typeof window.googletag.enableServices === "function" &&
    typeof window.googletag.display === "function"
  );
};


const loadBannerAd = (slotName, size, divId) => {
  try {
    if (!slotName) return;
    const slot = window.googletag.defineSlot(slotName, size, divId);
    if (slot) {
      slot.addService(window.googletag.pubads());
    }
  } catch (error) {
    console.error("Error loading banner ad:", error);
  }
};

const loadAnchorAd = (slotName) => {
  if (!slotName) return;
  try {
    const anchorSlot = googletag.defineOutOfPageSlot(
      slotName,
      googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR
    );
    if (anchorSlot) {
      anchorSlot.setTargeting("test", "anchor").addService(googletag.pubads());
    }
  } catch (error) {
    console.error("Error loading anchor ad:", error);
  }
};

const loadInterstitialAd = (slotName) => {
  if (!slotName) return;
  try {
    const interstitialSlot = window.googletag.defineOutOfPageSlot(
      slotName,
      googletag.enums.OutOfPageFormat.INTERSTITIAL
    );
    if (interstitialSlot) {
      interstitialSlot.addService(googletag.pubads()).setConfig({
        interstitial: { triggers: { navBar: true, unhideWindow: true } },
      });
    }
  } catch (error) {
    console.error("Error loading interstitial ad:", error);
  }
};

const initializeAllAds = () => {
  if (!checkGoogleAdSenseLoaded()) {
    setTimeout(initializeAllAds, 100);
    return;
  }

  bannerAdList.forEach((ad) => loadBannerAd(ad.slot, ad.size, ad.divId));

  
  anchorAdList.forEach((ad) => loadAnchorAd(ad.slot));

  
  interstitialAdList.forEach((ad) => loadInterstitialAd(ad.slot));

  window.googletag.pubads().enableSingleRequest();
  window.googletag.enableServices();

  
  bannerAdList.forEach((ad) => {
    const element = document.getElementById(ad.id);
    if (element) {
      try {
        window.googletag.display(ad.id);
      } catch (error) {
        console.error("Error displaying home ad:", ad.id, error);
      }
    } else {
      console.log("⏳ Skip non-existent home page ad container:", ad.id);
    }
  });
};

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAllAds);
  } else {
    initializeAllAds();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { bannerAdList, anchorAdList, interstitialAdList };
}
