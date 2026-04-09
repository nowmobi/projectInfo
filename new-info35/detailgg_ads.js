
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

  
  adsContainers.forEach((container, index) => {
    
    if (container.className.trim() !== "ads") {
      console.log(
        `⏭️ Skipping container ${index + 1}: has additional classes (${
          container.className
        })`
      );
      return;
    }

    
    if (index < detailAds.length) {
      
      container.innerHTML = "";
      console.log(`🧹 Cleared content of ads container ${index + 1}`);

      const ad = detailAds[index];
      
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
          `✅ Inserted ad ${index + 1} into container ${index + 1} with slot: ${
            ad.slot
          }`
        );
      } catch (error) {
        console.error(`❌ Error pushing ad ${index + 1}:`, error);
      }
    } else {
      console.log(`⚠️ Container ${index + 1}: no corresponding ad data available`);
      
    }
  });

  console.log("✅ All ads inserted successfully");
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    
    setTimeout(insertAdsToContainers, 500);
  });
} else {
  setTimeout(insertAdsToContainers, 500);
}

console.log("✅ detailgg_ads.js loaded successfully");
