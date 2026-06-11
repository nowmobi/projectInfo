
export function initCommonSidebar() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const dropdownClose = document.getElementById("dropdownClose");
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (e) => {
      e.preventDefault();
      openDropdown();
    });
  }
  
  if (dropdownClose) {
    dropdownClose.addEventListener("click", () => {
      closeDropdown();
    });
  }

  bindDropdownNavigation();
}

export function openDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (dropdownMenu) {
    dropdownMenu.classList.add("active");
    dropdownMenu.style.top = "60px";
    dropdownMenu.style.display = "block";
    dropdownMenu.style.visibility = "visible";
    document.body.style.overflow = "hidden";
  }
  bindEscToClose();
}

export function closeDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (dropdownMenu) {
    dropdownMenu.classList.remove("active");
    dropdownMenu.style.top = "";
    dropdownMenu.style.display = "";
    dropdownMenu.style.visibility = "";
    document.body.style.overflow = "";
  }
  unbindEscToClose();
}

export function bindDropdownNavigation() {
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    const href = item.getAttribute("href");
    item.addEventListener("click", (e) => {
      e.preventDefault();
      if (href) {
        window.location.href = href;
      }
      setTimeout(() => {
        closeDropdown();
      }, 100);
    });
  });
}

export function bindEscToClose() {
  if (window._escHandler) return;
  window._escHandler = (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  };
  document.addEventListener("keydown", window._escHandler);
}

export function unbindEscToClose() {
  if (!window._escHandler) return;
  document.removeEventListener("keydown", window._escHandler);
  window._escHandler = null;
}


export function handleChannelParameter() {
  if (window.channel) {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (link.href && !link.href.includes("channel=")) {
        try {
          const url = new URL(link.href);
          url.searchParams.set("channel", window.channel);
          link.href = url.toString();
        } catch (e) {
          
        }
      }
    });
  }
}


export class SmartBackButton {
  constructor(options = {}) {
    this.basePath = options.basePath || "../";
    this.isDetailPage = options.isDetailPage || false;
    this.bindSmartBackButton();
  }

  bindSmartBackButton() {
    const backButton = document.getElementById("smartBackButton");
    if (backButton) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    }
  }

  handleSmartBack() {
    const referrer = document.referrer;
    const currentUrl = window.location.href;

    
    if (this.isDetailPage) {
      if (referrer.includes("category.html")) {
        window.location.href = referrer;
        return;
      }

      const urlParams = new URLSearchParams(currentUrl);
      const fromPage = urlParams.get("from");

      if (fromPage === "category") {
        window.location.href =
          `${this.basePath}pages/category.html` +
          (window.channel ? `?channel=${window.channel}` : "");
        return;
      }

      if (
        referrer.includes("index.html") ||
        referrer.includes("localhost") ||
        referrer.includes("127.0.0.1")
      ) {
        window.location.href =
          "index.html?fromDetail=true" +
          (window.channel ? `&channel=${window.channel}` : "");
        return;
      }

      window.location.href =
        "index.html?fromDetail=true" +
        (window.channel ? `&channel=${window.channel}` : "");
      return;
    }

    
    const urlParams = new URLSearchParams(currentUrl);
    const type = urlParams.get("type");

    if (type) {
      window.location.href =
        `${this.basePath}index.html` +
        (window.channel ? `?channel=${window.channel}` : "");
      return;
    }

    if (referrer.includes("category.html")) {
      window.location.href = referrer;
      return;
    }

    if (
      referrer.includes("index.html") ||
      referrer.includes("localhost") ||
      referrer.includes("127.0.0.1")
    ) {
      window.location.href =
        `${this.basePath}index.html` +
        (window.channel ? `?channel=${window.channel}` : "");
      return;
    }

    if (referrer.includes("detail.html")) {
      window.location.href = referrer;
      return;
    }

    
    window.location.href =
      `${this.basePath}index.html` +
      (window.channel ? `?channel=${window.channel}` : "");
  }
}


export function formatTime(timestamp) {
  if (!timestamp) return "-";
  const ts = Number(timestamp);
  if (isNaN(ts)) return "-";
  const msTimestamp = ts > 1000000000000 ? ts : ts * 1000;
  const date = new Date(msTimestamp);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}


export function formatDate(timestamp) {
  return formatTime(timestamp);
}


export function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}


export function initSimplePage(options = {}) {
  const basePath = options.basePath || "../";
  handleChannelParameter();
  if (!window._sidebarInitialized) {
    initCommonSidebar();
    window._sidebarInitialized = true;
  }
  
  const smartBack = new SmartBackButton({ basePath });
  if (window.themeApplier) {
    window.themeApplier.init();
  }
}



export function autoInitSimplePage(options = {}) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initSimplePage(options);
    });
  } else {
    
    initSimplePage(options);
  }
}


async function autoDetectAndInitSimplePages() {
  const currentPath = window.location.pathname;
  const isAboutPage = currentPath.includes("about.html");
  const isPrivacyPage = currentPath.includes("privacy.html");
  
  if (isAboutPage || isPrivacyPage) {
    const basePath = currentPath.includes("/pages/") ? "../" : "";
    
    if (!window.healthNewsApp) {
      const { HealthNewsApp } = await import("./index.js");
      window.healthNewsApp = new HealthNewsApp({ useHomePageLayout: false });
      
      let retries = 0;
      while (
        (!window.healthNewsApp.articles?.length || !window.healthNewsApp.categories?.length) &&
        retries < 50
      ) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
    }
    autoInitSimplePage({ basePath });
  }
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoDetectAndInitSimplePages);
} else {
  autoDetectAndInitSimplePages();
}


const Utils = {
  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

window.Utils = Utils;

