// public/js/ad_loader_logic.js

async function loadCryptoJS() {
    return new Promise((resolve, reject) => {
        if (window.CryptoJS) {
            resolve(window.CryptoJS);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js';
        script.onload = () => resolve(window.CryptoJS);
        script.onerror = () => reject(new Error('Failed to load CryptoJS'));
        document.head.appendChild(script);
    });
}

export async function loadAdsScript(pageType) {
    try {
        const CryptoJS = await loadCryptoJS();
        const domain = window.location.hostname;
        const md5 = CryptoJS.MD5(domain).toString();
        const scriptName = `/${md5.slice(-8)}_ads.js`;

        let scriptToLoad = '';
        let fallbackScript = '';

        switch (pageType) {
            case 'home':
                scriptToLoad = '/homegg.js';
                fallbackScript = '/homegg_ads.js';
                break;
            case 'detail':
                scriptToLoad = '/detailgg.js';
                fallbackScript = '/detailgg_ads.js';
                break;
            case 'category':
                scriptToLoad = '/categorygg.js';
                fallbackScript = '/categorygg_ads.js';
                break;
            default:
                console.error('Unknown page type:', pageType);
                return;
        }

        try {
            const module = await import(scriptName);
            window.ad_code_identifier = module.ad_code_identifier;
            const ad_code_identifier = module.ad_code_identifier;

            if (ad_code_identifier.cate === "adx" && ad_code_identifier.status === 1) {
                const script = document.createElement("script");
                script.type = "module";
                script.src = scriptToLoad;
                document.body.appendChild(script);
            } else {
                const script = document.createElement("script");
                script.type = "module";
                script.src = fallbackScript;
                document.body.appendChild(script);
            }
        } catch (error) {
            console.warn(`Failed to load ${scriptName}, trying /ads.js`);
            try {
                const defaultModule = await import('/ads.js');
                window.ad_code_identifier = defaultModule.ad_code_identifier;
                const ad_code_identifier = defaultModule.ad_code_identifier;

                if (ad_code_identifier.cate === "adx" && ad_code_identifier.status === 1) {
                    const script = document.createElement("script");
                    script.type = "module";
                    script.src = scriptToLoad;
                    document.body.appendChild(script);
                } else {
                    const script = document.createElement("script");
                    script.type = "module";
                    script.src = fallbackScript;
                    document.body.appendChild(script);
                }
            } catch (fallbackError) {
                console.error('Failed to load ads configuration:', fallbackError);
                const script = document.createElement("script");
                script.type = "module";
                script.src = fallbackScript;
                document.body.appendChild(script);
            }
        }
    } catch (error) {
        console.error('Error loading ads module:', error);
        let fallbackScript = '';
        switch (pageType) {
            case 'home':
                fallbackScript = '/homegg_ads.js';
                break;
            case 'detail':
                fallbackScript = '/detailgg_ads.js';
                break;
            case 'category':
                fallbackScript = '/categorygg_ads.js';
                break;
            default:
                console.error('Unknown page type for fallback:', pageType);
                return;
        }
        const script = document.createElement("script");
        script.type = "module";
        script.src = fallbackScript;
        document.body.appendChild(script);
    }
}