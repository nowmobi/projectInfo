
class CategoryPage {
    
    constructor() {
        this.currentCategory = null;
        this.articles = [];
        this.categories = [];
        this.sidebarMenu = null;
        this.init();
    }

    
    async init() {
       
        this.showLoadingState();
        
        await this.loadData();
        this.setupEventListeners();
        
       
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
                const response = await fetch(RemoteDataConfig.dbUrl, { cache: 'no-store' });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const rawData = await response.json();
                const articles = RemoteDataConfig.extractArticles(rawData);
                
                if (!Array.isArray(articles) || articles.length === 0) {
                    throw new Error('Invalid or empty data received');
                }
                
                this.articles = articles;
                this.categories = this.extractCategoriesFromArticles();
                this.initializeSidebarMenu();
                
                try {
                    localStorage.setItem('cachedArticles', JSON.stringify(this.articles));
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

    
    setupEventListeners() {

       
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((query) => {
                this.handleSearch(query);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
        
        this.initializeSidebarMenu();
    }
    
    
    initializeSidebarMenu() {
        if (typeof SidebarMenu === 'undefined') return;

        const sidebarCategories = this.categories.map(category => ({
            id: category.id,
            name: category.name
        }));

        if (!this.sidebarMenu) {
            this.sidebarMenu = new SidebarMenu({
                categories: sidebarCategories,
                fetchCategories: sidebarCategories.length === 0
            });
        } else {
            this.sidebarMenu.updateCategories(sidebarCategories);
        }
    }
    
    
    showError(message) {
        const categoryGrid = document.querySelector('.cat-grid');
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
                retryBtn.addEventListener('click', () => this.retryLoadData());
            }
        }
        
    }
    
    
    async retryLoadData() {
        this.showLoadingState();
        await this.loadData();
    }
    
    
    showLoadingState() {
        const categoryGrid = document.querySelector('.cat-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading articles...</div>
                </div>
            `;
        }
    }
    
    
    loadFallbackData() {
       
        const cachedData = localStorage.getItem('cachedArticles');
        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    this.articles = parsedData;
                    this.categories = this.extractCategoriesFromArticles();
                    this.initializeSidebarMenu();
                    this.showCacheNotice();
                    return;
                }
            } catch (e) {
                }
        }
        
       
        this.showDefaultCategories();
    }
    
    
    showCacheNotice() {
        const categoryGrid = document.querySelector('.cat-grid');
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
        const categoryGrid = document.querySelector('.cat-grid');
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
    }

    
    extractCategoriesFromArticles() {
        const categoryMap = new Map();
        
        this.articles.forEach(article => {
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
        
        const categories = Array.from(categoryMap.values());
        
        return categories;
    }

    
    showArticlesByType(type) {
       
        const filteredArticles = this.articles.filter(article => article.type === type);
        this.currentCategory = type;
        this.renderArticles(filteredArticles, type);
    }

    
    renderArticles(articles, categoryName, emptyStateOptions = {}) {
        const categoryGrid = document.querySelector('.cat-grid');
        if (categoryGrid) {
            categoryGrid.style.display = 'none';
        }

        const articlesSection = document.getElementById('currentCategoryArticles');
        const articlesContainer = document.getElementById('categoryArticlesContainer');
        const categoryHeader = document.getElementById('categoryHeader');
        const categoryTitle = document.getElementById('categoryTitle');
        
        if (!articlesSection || !articlesContainer) {
            return;
        }

        articlesSection.style.display = 'block';
        
       
        if (categoryHeader && categoryName) {
            categoryHeader.style.display = 'flex';
            if (categoryTitle) {
                categoryTitle.textContent = categoryName;
            }
            
           
            const categoryIcon = categoryHeader.querySelector('.category-section-icon');
            if (categoryIcon) {
                categoryIcon.remove();
            }
        } else if (categoryHeader) {
           
            categoryHeader.style.display = 'none';
        }
        
       
        Utils.setupArticlesContainerForGrid(articlesContainer);

        if (!articles.length) {
            const emptyIcon = emptyStateOptions.icon || '📭';
            const emptyText = emptyStateOptions.text || 'No articles found';
            const emptySubtext = emptyStateOptions.subtext || 'Please select another category or check back later';
            
            articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${emptyIcon}</div>
                    <div class="empty-state-text">${emptyText}</div>
                    <div class="empty-state-subtext">${emptySubtext}</div>
                </div>
            `;
            return;
        }

        const articlesHTML = Utils.generateArticleGridHTML(articles, 3);

        articlesContainer.innerHTML = articlesHTML;

       
        this.bindArticleEvents();
    }

    
    renderCategories() {
        const categoryGrid = document.querySelector('.cat-grid');
        const articlesSection = document.getElementById('currentCategoryArticles');
        const articlesContainer = document.getElementById('categoryArticlesContainer');
        const categoryHeader = document.getElementById('categoryHeader');
        
        if (!categoryGrid) {
            return;
        }
        
        categoryGrid.innerHTML = '';
        categoryGrid.style.display = 'grid';
        
        if (articlesSection) {
            articlesSection.style.display = 'none';
        }
        if (articlesContainer) {
            articlesContainer.innerHTML = '';
        }
        if (categoryHeader) {
            categoryHeader.style.display = 'none';
        }
        
        if (!this.categories.length) {
            categoryGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No categories found</div>
                    <div class="empty-state-subtext">Please try refreshing the page</div>
                </div>
            `;
            return;
        }

        const gridHTML = this.categories.map(category => `
            <div class="cat-card" data-category="${category.name}">
                <div class="cat-card-icon">
                    ${Utils.getCategoryIconByType(category.name)}
                </div>
                <h3 class="cat-card-title">${category.name}</h3>
                <p class="cat-card-count">${category.count} articles</p>
            </div>
        `).join('');

        categoryGrid.innerHTML = gridHTML;

       
        this.bindCategoryEvents();
    }

    
    bindCategoryEvents() {
        const categoryCards = document.querySelectorAll('.cat-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryName = card.dataset.category;
                if (categoryName) {
                    this.showArticlesByType(categoryName);
                }
            });
        });
    }


    
    bindArticleEvents() {
        const articleCards = document.querySelectorAll('.card-simple');
        articleCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const articleId = card.dataset.id;
                if (articleId) {
                    window.location.href = `../detail.html?id=${articleId}`;
                }
            });
        });
    }

    
    handleSearch(query) {
        if (!query.trim()) {
            if (this.currentCategory) {
                const filteredArticles = this.articles.filter(article => article.type === this.currentCategory);
                this.renderArticles(filteredArticles, this.currentCategory);
            } else {
                this.renderCategories();
            }
            return;
        }

        const searchTerm = query.toLowerCase();
        const filteredArticles = this.articles.filter(article => 
            (article.title || '').toLowerCase().includes(searchTerm) ||
            (article.summary && article.summary.toLowerCase().includes(searchTerm)) ||
            (article.type || '').toLowerCase().includes(searchTerm)
        );

        this.renderSearchResults(filteredArticles);
    }

    
    renderSearchResults(filteredArticles) {
       
       
        this.renderArticles(filteredArticles, null, {
            icon: '🔍',
            text: 'No related articles found',
            subtext: 'Please try other search keywords'
        });
    }

}


document.addEventListener('DOMContentLoaded', () => {
    new CategoryPage();
});

