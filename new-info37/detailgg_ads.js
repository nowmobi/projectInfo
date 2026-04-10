
import { ad_code_identifier } from "./ads.js";

console.log("Loading detailgg_ads.js...");
console.log("Ad Code Identifier:", ad_code_identifier);


const clientId = ad_code_identifier.client;
const gtagId = ad_code_identifier.gtag;


const adsenseScript = document.createElement("script");
adsenseScript.async = true;
adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
adsenseScript.crossOrigin = "anonymous";
document.head.appendChild(adsenseScript);

console.log(`✅ AdSense script injected with client: ${clientId}`);


const gtagScript = document.createElement("script");
gtagScript.async = true;
gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
document.head.appendChild(gtagScript);

console.log(`✅ Google Analytics script injected with gtag: ${gtagId}`);


const gtagConfigScript = document.createElement("script");
gtagConfigScript.textContent = `
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "${gtagId}");
`;
document.head.appendChild(gtagConfigScript);

console.log("✅ Google Analytics configuration injected");


const urlParams = new URLSearchParams(window.location.search);
const urlChannel = urlParams.get("channel");
const storedChannel = sessionStorage.getItem("channel");


if (urlChannel) {
  sessionStorage.setItem("channel", urlChannel);
}


const channelParam = storedChannel || urlChannel;


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


function insertAdsToContainers() {
  
  const adsContainers = document.querySelectorAll(".ads");
  console.log(`Found ${adsContainers.length} ad containers with class "ads"`);

  if (!selectedAdunit || !selectedAdunit.detail) {
    console.warn("⚠️ No detail ads found in selected adunit");
    return;
  }

  let detailAds = [...selectedAdunit.detail]; 
  console.log(`Found ${detailAds.length} detail ads in configuration`);

  
  const randadParam = ad_code_identifier.randad;
  if (randadParam == 1 || randadParam == 3) {
    console.log("🎲 Randad is 1 or 3, shuffling detail ads...");

    
    for (let i = detailAds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [detailAds[i], detailAds[j]] = [detailAds[j], detailAds[i]];
    }

    console.log("✅ Detail ads shuffled:", detailAds);
  }

  
  let detailAdIndex = 0;
  adsContainers.forEach((container, index) => {
    
    if (container.className.trim() !== "ads") {
      console.log(
        `⏭️ Skipping container ${index + 1}: has additional classes (${
          container.className
        })`
      );
      return;
    }

    
    const isInFooter = container.closest("footer.footer");
    if (isInFooter) {
      console.log(`⏭️ Skipping container ${index + 1}: it's in footer (anchor ad)`);
      return;
    }

    
    if (detailAdIndex < detailAds.length) {
      
      container.innerHTML = "";
      console.log(`🧹 Cleared content of ads container ${index + 1}`);

      const ad = detailAds[detailAdIndex];
      
      const insElement = document.createElement("ins");
      insElement.className = "adsbygoogle";
      insElement.style.display = "block";
      insElement.setAttribute("data-ad-client", clientId);
      insElement.setAttribute("data-ad-slot", ad.slot);
      insElement.setAttribute("data-ad-format", "auto");
      insElement.setAttribute("data-full-width-responsive", "true");

      
      container.appendChild(insElement);

      
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log(
          `✅ Inserted ad ${detailAdIndex + 1} into container ${index + 1} with slot: ${
            ad.slot
          }`
        );
      } catch (error) {
        console.error(`❌ Error pushing ad ${detailAdIndex + 1}:`, error);
      }
      
      detailAdIndex++;
    } else {
      console.log(`⚠️ Container ${index + 1}: no corresponding ad data available`);
      
    }
  });

  console.log("✅ All detail ads inserted successfully");
}


function insertAnchorAd() {
  console.log("🔍 insertAnchorAd function called");
  console.log("🔍 selectedAdunit:", selectedAdunit);
  
  if (!selectedAdunit) {
    console.error("❌ selectedAdunit is null or undefined");
    return;
  }

  if (!selectedAdunit.detail_anchor) {
    console.log("⚠️ No detail_anchor ads found in selected adunit");
    console.log("🔍 selectedAdunit keys:", Object.keys(selectedAdunit));
    return;
  }

  const anchorAds = selectedAdunit.detail_anchor;
  console.log("🔍 anchorAds:", anchorAds);
  console.log("🔍 Is array?", Array.isArray(anchorAds));
  
  let anchorAd = null;
  
  
  if (Array.isArray(anchorAds)) {
    
    if (anchorAds.length === 0) {
      console.log("⚠️ detail_anchor array is empty");
      return;
    }
    anchorAd = anchorAds[0];
    console.log("🔍 anchorAd (from array):", anchorAd);
  } else {
    
    anchorAd = anchorAds;
    console.log("🔍 anchorAd (direct object):", anchorAd);
  }

  if (!anchorAd || !anchorAd.slot) {
    console.warn("⚠️ Invalid anchor ad data:", anchorAd);
    return;
  }

  console.log(`📍 Found anchor ad with slot: ${anchorAd.slot}`);

  
  const footer = document.querySelector("footer.footer");
  if (!footer) {
    console.warn("⚠️ Footer not found");
    return;
  }
  console.log("✅ Footer element found");

  
  const anchorAdContainer = footer.querySelector(".ads");
  if (!anchorAdContainer) {
    console.warn("⚠️ Anchor ad container (.ads) not found in footer");
    console.log("🔍 Footer innerHTML:", footer.innerHTML.substring(0, 200));
    return;
  }
  console.log("✅ Anchor ad container found:", anchorAdContainer);

  
  anchorAdContainer.innerHTML = "";
  console.log(`🧹 Cleared anchor ad container`);

  
  const insElement = document.createElement("ins");
  insElement.className = "adsbygoogle";
  insElement.style.display = "block";
  insElement.setAttribute("data-ad-client", clientId);
  insElement.setAttribute("data-ad-slot", anchorAd.slot);
  insElement.setAttribute("data-ad-format", "auto");
  insElement.setAttribute("data-full-width-responsive", "true");

  anchorAdContainer.appendChild(insElement);
  console.log(`✅ Created and appended ins element for anchor ad`);
  console.log(`🔍 Container now has ${anchorAdContainer.children.length} children`);

  
  setTimeout(() => {
    try {
      console.log(`🚀 Pushing anchor ad to adsbygoogle...`);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log(`✅ Anchor ad pushed successfully with slot: ${anchorAd.slot}`);
    } catch (error) {
      console.error(`❌ Error pushing anchor ad:`, error);
    }
  }, 100);
}


function insertInterstitialAd() {
  console.log("🔍 insertInterstitialAd function called");
  console.log("🔍 selectedAdunit:", selectedAdunit);
  
  if (!selectedAdunit) {
    console.error("❌ selectedAdunit is null or undefined");
    return;
  }

  if (!selectedAdunit.interstitial) {
    console.log("⚠️ No interstitial ads found in selected adunit");
    console.log("🔍 selectedAdunit keys:", Object.keys(selectedAdunit));
    return;
  }

  const interstitialAds = selectedAdunit.interstitial;
  console.log("🔍 interstitialAds:", interstitialAds);
  console.log("🔍 Is array?", Array.isArray(interstitialAds));
  
  let interstitialAd = null;
  
  
  if (Array.isArray(interstitialAds)) {
    
    if (interstitialAds.length === 0) {
      console.log("⚠️ interstitial array is empty");
      return;
    }
    interstitialAd = interstitialAds[0];
    console.log("🔍 interstitialAd (from array):", interstitialAd);
  } else {
    
    interstitialAd = interstitialAds;
    console.log("🔍 interstitialAd (direct object):", interstitialAd);
  }

  if (!interstitialAd || !interstitialAd.slot) {
    console.warn("⚠️ Invalid interstitial ad data:", interstitialAd);
    return;
  }

  console.log(`📍 Found interstitial ad with slot: ${interstitialAd.slot}`);

  
  const interstitialContainer = document.querySelector(".ads.interstitial-ad");
  if (!interstitialContainer) {
    console.warn("⚠️ Interstitial ad container (.ads.interstitial-ad) not found");
    return;
  }
  console.log("✅ Interstitial ad container found:", interstitialContainer);

  
  interstitialContainer.innerHTML = "";
  console.log(`🧹 Cleared interstitial ad container`);

  
  const insElement = document.createElement("ins");
  insElement.className = "adsbygoogle";
  insElement.style.display = "block";
  insElement.setAttribute("data-ad-client", clientId);
  insElement.setAttribute("data-ad-slot", interstitialAd.slot);
  insElement.setAttribute("data-ad-format", "auto");
  insElement.setAttribute("data-full-width-responsive", "true");

  interstitialContainer.appendChild(insElement);
  console.log(`✅ Created and appended ins element for interstitial ad`);
  console.log(`🔍 Container now has ${interstitialContainer.children.length} children`);

  
  setTimeout(() => {
    try {
      console.log(`🚀 Pushing interstitial ad to adsbygoogle...`);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log(`✅ Interstitial ad pushed successfully with slot: ${interstitialAd.slot}`);
    } catch (error) {
      console.error(`❌ Error pushing interstitial ad:`, error);
    }
  }, 100);
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    
    setTimeout(insertInterstitialAd, 300);
    setTimeout(insertAdsToContainers, 500);
    setTimeout(insertAnchorAd, 600);
  });
} else {
  setTimeout(insertInterstitialAd, 300);
  setTimeout(insertAdsToContainers, 500);
  setTimeout(insertAnchorAd, 600);
}

console.log("✅ detailgg_ads.js loaded successfully");
