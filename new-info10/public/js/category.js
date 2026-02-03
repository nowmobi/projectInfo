
import { Category_URL, fetchApiData } from './BaseURL.js';


const REMOTE_DB_URL = Category_URL;
class CategoryPage {
    constructor() {
        this.articles = [];
        this.categories = [];
        this.init();
    }

  
    async init() {
       
        this.showLoadingState();
        
        await this.loadData();
       
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type) {
           
            const decodedType = decodeURIComponent(type);
            this.showArticlesByType(decodedType);
        } else {
            this.renderCategories();
        }
    }

   
    async loadData() {
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                
                const data = await fetchApiData();
                
               
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('Invalid or empty data received');
                }
                
               
                const categoryOrder = this.extractCategoryOrder(data);
                const processed = this.processData(data, categoryOrder);

                if (processed.articles.length === 0) {
                    throw new Error('No articles found in dataset');
                }

                this.articles = processed.articles;
                this.categories = processed.categories;
                
               
                try {
                    localStorage.setItem('cachedArticles', JSON.stringify(data));
                    localStorage.setItem('cachedArticlesTimestamp', Date.now());
                } catch (e) {
                    
                }
                
               
                break;
                
            } catch (error) {
                retryCount++;
                
                
                if (retryCount >= maxRetries) {
                   
                    this.showError(`Failed to load articles after ${maxRetries} attempts. Please check your connection and refresh the page.`);
                    
                   
                    this.loadFallbackData();
                } else {
                   
                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                }
            }
        }
    }

   
    showError(message) {
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">${message}</div>
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            
           
            const retryBtn = categoryGrid.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.refreshData());
            }
        }
    }
    
   
    showLoadingState() {
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-text">Loading articles...</div>
                </div>
            `;
        }
    }
    
  
    async loadFallbackData() {
       
        const cachedData = localStorage.getItem('cachedArticles');
        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
               
                const categoryOrder = this.extractCategoryOrder(parsedData);
                const processed = this.processData(parsedData, categoryOrder);
                if (processed.articles.length > 0) {
                    this.articles = processed.articles;
                    this.categories = processed.categories;
                    
                   
                    this.showCacheNotice();
                    return;
                }
            } catch (e) {
                
            }
        }
        
       
        this.showDefaultCategories();
    }
    
   
    showCacheNotice() {
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = `
                <div class="cache-notice">
                    <div class="notice-icon">📋</div>
                    <div class="notice-text">Showing cached data</div>
                    <div class="notice-subtext">Some content may be outdated</div>
                    <button class="refresh-btn">Refresh Now</button>
                </div>
            `;
            
           
            const refreshBtn = categoryGrid.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refreshData());
            }
        }
        
       
        this.renderCategories();
    }
    
   
    showDefaultCategories() {
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = `
                <div class="default-categories">
                    <div class="default-icon">📚</div>
                    <div class="default-text">Default Categories</div>
                    <div class="default-subtext">Please check your connection and try again</div>
                    <button class="refresh-btn">Refresh Now</button>
                </div>
            `;
            
           
            const refreshBtn = categoryGrid.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refreshData());
            }
        }
    }
    
    
    async refreshData() {
        this.showLoadingState();
        await this.loadData();
        
       
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        if (type) {
            this.showArticlesByType(decodeURIComponent(type));
        } else {
            this.renderCategories();
        }
    }

   
    extractCategoryOrder(data) {
        if (!Array.isArray(data) || data.length === 0 || !data[0]) {
            return [];
        }
        
        const meta = data[0];
        
       
       
        for (let i = 1; i <= 10; i++) {
            const fieldName = `info${i}`;
            if (meta[fieldName] && Array.isArray(meta[fieldName])) {
                return meta[fieldName];
            }
        }
        
       
        for (const key in meta) {
            if (key.startsWith('info') && Array.isArray(meta[key])) {
                return meta[key];
            }
        }
        
        return [];
    }

   
    extractCategoriesFromArticles(articles = this.articles) {
        const categoryMap = new Map();
        
        articles.forEach(article => {
            if (article.type && !categoryMap.has(article.type)) {
                categoryMap.set(article.type, {
                    id: article.type,
                    name: article.type,
                    count: 1
                });
            } else if (article.type) {
                categoryMap.get(article.type).count++;
            }
        });
        
        return Array.from(categoryMap.values());
    }

   
    processData(data, categoryOrder = []) {
        if (!Array.isArray(data) || data.length === 0) {
            return { articles: [], categories: [] };
        }

        const [meta, ...rest] = data;
        const articles = Array.isArray(rest) ? rest.filter(item => item && item.id) : [];

        const extractedCategories = this.extractCategoriesFromArticles(articles);

       
        if (Array.isArray(categoryOrder) && categoryOrder.length > 0) {
            const extractedMap = new Map(extractedCategories.map(item => [item.name, item]));
            const ordered = categoryOrder
                .map(name => extractedMap.get(name))
                .filter(item => item && item.count > 0);

            if (ordered.length > 0) {
                return { articles, categories: ordered };
            }
        }

        return { articles, categories: extractedCategories };
    }

   
    showArticlesByType(type) {
       
        const decodedType = type.includes('%') ? decodeURIComponent(type) : type;
        
        let filteredArticles = this.articles.filter(article => article.type === decodedType);
        
       
        if (filteredArticles.length === 0) {
            filteredArticles = this.articles.filter(article => 
                article.type && article.type.toLowerCase() === decodedType.toLowerCase()
            );
        }
        
        this.renderArticles(filteredArticles, decodedType);
    }

   
    renderArticles(articles, categoryName) {
       
        document.querySelector('.category-grid').style.display = 'none';

       
        const articlesSection = document.getElementById('currentCategoryArticles');
        const articlesGrid = document.getElementById('categoryArticlesGrid');
        
        if (!articlesSection || !articlesGrid) {
            console.error('Required elements not found:', {
                articlesSection: !!articlesSection,
                articlesGrid: !!articlesGrid
            });
            return;
        }

       
        articlesSection.style.display = 'block';

       
        if (articles.length === 0) {
            articlesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No articles in this category</div>
                    <div class="empty-state-subtext">Please select another category or check back later</div>
                </div>
            `;
            return;
        }

       
        const sortedArticles = articles.sort((a, b) => b.id - a.id);

       
        articlesGrid.innerHTML = sortedArticles.map(article => 
            window.Utils.createArticleCard(article)
        ).join('');

       
        this.bindArticleEvents();
    }

   
    renderCategories() {
        const categoryGrid = document.querySelector('.category-grid');
        if (!categoryGrid) return;

        const orderedCategories = this.categories;

        if (!orderedCategories || orderedCategories.length === 0) {
            categoryGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No categories available</div>
                    <div class="empty-state-subtext">Please check back later</div>
                </div>
            `;
            return;
        }

        categoryGrid.innerHTML = orderedCategories.map(category => `
            <div class="category-card" data-category="${category.name}">
                <div class="category-card-content">
                    <h3 class="category-card-title">${category.name}</h3>
                    <p class="category-card-count">
                        ${category.count} articles
                    </p>
                </div>
                <div class="category-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                     </svg>
                 </div>
             </div>
         `).join('');

       
        this.bindCategoryEvents();
    }

   
    bindCategoryEvents() {
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryName = card.dataset.category;
                this.showArticlesByType(categoryName);
            });
        });
    }

    
    bindArticleEvents() {
        window.Utils.bindArticleCardEvents('../detail.html');
    }

}


document.addEventListener('DOMContentLoaded', () => {
    new CategoryPage();
});

