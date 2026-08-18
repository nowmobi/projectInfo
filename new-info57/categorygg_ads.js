
import { ad_code_identifier } from "./ads.js";

console.log("Loading categorygg_ads.js...");
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

  if (!selectedAdunit || !selectedAdunit.category) {
    console.warn("⚠️ No category ads found in selected adunit");
    return;
  }

  let categoryAds = [...selectedAdunit.category]; 
  console.log(`Found ${categoryAds.length} category ads in configuration`);

  
  const randadParam = ad_code_identifier.randad;
  if (randadParam == 2 || randadParam == 3) {
    console.log("🎲 Randad is 2 or 3, shuffling category ads...");

    
    for (let i = categoryAds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [categoryAds[i], categoryAds[j]] = [categoryAds[j], categoryAds[i]];
    }

    console.log("✅ Category ads shuffled:", categoryAds);
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

    
    container.innerHTML = "";
    console.log(`🧹 Cleared content of ads container ${index + 1}`);

    
    categoryAds.forEach((ad, adIndex) => {
      
      const insElement = document.createElement("ins");
      insElement.className = "adsbygoogle";
      insElement.style.display = "block";
      insElement.setAttribute("data-ad-client", clientId);
      insElement.setAttribute("data-ad-slot", ad.slot);
      insElement.setAttribute("data-ad-format", "auto");
      insElement.setAttribute("data-full-width-responsive", "true");

      
      container.appendChild(insElement);

      
      const script = document.createElement("script");
      script.textContent = "(adsbygoogle = window.adsbygoogle || []).push({});";
      container.appendChild(script);

      console.log(
        `✅ Inserted ad ${adIndex + 1} into container ${index + 1} with slot: ${
          ad.slot
        }`
      );
    });
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

console.log("✅ categorygg_ads.js loaded successfully");
