/**
 * 前端埋点追踪模块
 * 功能：统计页面访问量（PV）、完成次数和完成率，以及 UV（独立访客）统计
 * 
 * 统计指标说明：
 * - PV（进来次数）：每次页面加载算一次
 * - 完成次数：满足停留时间要求算一次
 * - 完成率：完成次数 / PV 次数 * 100%
 * - UV（独立访客数）：基于设备号的独立访客数量
 * - 进来人数（visitInCount）：按设备号统计的访问次数总和（每个设备的 visitCount 累加）
 * 
 * UV 统计维度：
 * 1. 分国家：按国家代码分组统计
 * 2. 分任务：同域名不同参数归档到不同任务
 * 3. 分链接：按完整 URL 统计
 */

// 配置项
const TRACKING_CONFIG = {
  // 完成标准：用户在页面停留的最短时间（秒），满足此时间才算"完成"
  minStayTime: 5,
  // 是否启用本地存储保存统计数据
  enableStorage: true,
  // 数据存储的 key 前缀
  storageKeyPrefix: 'tracking_stats_',
  // UV 数据存储的 key 前缀
  uvStorageKeyPrefix: 'tracking_uv_',
  // 设备指纹存储 key
  deviceFingerprintKey: 'tracking_device_id',
  // 是否打印日志到控制台
  debug: true,
  // IP 地理定位 API（可选，用于获取国家信息）
  ipApiUrl: 'https://ipapi.co/json/'
};

// 设备指纹生成工具
class DeviceFingerprint {
  // 生成设备指纹
  static generate() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown'
    ];
    
    const fingerprintString = components.join('|');
    return this.hashCode(fingerprintString);
  }
  
  // 简单的哈希算法生成设备 ID
  static hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).toUpperCase();
  }
  
  // 获取或创建设备 ID
  static getDeviceId() {
    let deviceId = localStorage.getItem(TRACKING_CONFIG.deviceFingerprintKey);
    
    if (!deviceId) {
      deviceId = this.generate();
      localStorage.setItem(TRACKING_CONFIG.deviceFingerprintKey, deviceId);
    }
    
    return deviceId;
  }
}

// 国家信息获取工具
class CountryResolver {
  constructor() {
    this.countryCode = 'UNKNOWN';
    this.countryName = 'Unknown';
  }
  
  // 通过 IP API 获取国家信息
  async fetchCountryByIP() {
    try {
      const response = await fetch(TRACKING_CONFIG.ipApiUrl);
      const data = await response.json();
      
      if (data && data.country_code) {
        this.countryCode = data.country_code;
        this.countryName = data.country_name || data.country_code;
      }
    } catch (error) {
      console.error('[CountryResolver] 获取国家信息失败:', error);
      // 降级方案：通过语言推断
      this.inferCountryFromLanguage();
    }
    
    return this;
  }
  
  // 通过浏览器语言推断国家
  inferCountryFromLanguage() {
    const language = navigator.language || navigator.userLanguage;
    
    // 常见语言与国家的映射
    const languageCountryMap = {
      'zh-CN': { code: 'CN', name: 'China' },
      'zh-TW': { code: 'TW', name: 'Taiwan' },
      'en-US': { code: 'US', name: 'United States' },
      'en-GB': { code: 'GB', name: 'United Kingdom' },
      'ja-JP': { code: 'JP', name: 'Japan' },
      'ko-KR': { code: 'KR', name: 'South Korea' },
      'fr-FR': { code: 'FR', name: 'France' },
      'de-DE': { code: 'DE', name: 'Germany' },
      'es-ES': { code: 'ES', name: 'Spain' },
      'pt-BR': { code: 'BR', name: 'Brazil' },
      'ru-RU': { code: 'RU', name: 'Russia' },
      'ar-SA': { code: 'SA', name: 'Saudi Arabia' },
      'hi-IN': { code: 'IN', name: 'India' }
    };
    
    const mapping = languageCountryMap[language];
    if (mapping) {
      this.countryCode = mapping.code;
      this.countryName = mapping.name;
    } else {
      // 提取语言代码作为国家代码的近似
      const langParts = language.split('-');
      if (langParts.length > 1) {
        this.countryCode = langParts[1].toUpperCase();
        this.countryName = langParts[1].toUpperCase();
      } else {
        this.countryCode = 'UNKNOWN';
        this.countryName = 'Unknown';
      }
    }
  }
  
  // 同步获取国家信息（使用缓存或默认值）
  getCountrySync() {
    const cachedCountry = localStorage.getItem('tracking_country_cache');
    if (cachedCountry) {
      const countryData = JSON.parse(cachedCountry);
      // 检查缓存是否过期（24 小时）
      if (Date.now() - countryData.timestamp < 24 * 60 * 60 * 1000) {
        this.countryCode = countryData.code;
        this.countryName = countryData.name;
      }
    }
    
    return {
      countryCode: this.countryCode,
      countryName: this.countryName
    };
  }
  
  // 保存国家信息到缓存
  saveToCache() {
    const countryData = {
      code: this.countryCode,
      name: this.countryName,
      timestamp: Date.now()
    };
    localStorage.setItem('tracking_country_cache', JSON.stringify(countryData));
  }
}

// UV 统计数据结构
class UVStats {
  constructor(deviceId, countryCode, taskKey) {
    this.deviceId = deviceId;           // 设备号（UV 标识）
    this.countryCode = countryCode;     // 国家代码
    this.taskKey = taskKey;             // 任务键（域名 + 参数）
    this.fullUrl = window.location.href; // 完整链接
    this.firstVisit = Date.now();       // 首次访问时间
    this.lastVisit = Date.now();        // 最后访问时间
    this.visitCount = 1;                // 进来人数（该设备的访问次数，每次页面加载 +1）
    this.completed = false;             // 是否完成
  }
  
  // 增加进来人数（每次访问）
  incrementVisit() {
    this.visitCount++;
    this.lastVisit = Date.now();
  }
  
  // 标记为完成
  markComplete() {
    this.completed = true;
  }
  
  // 转换为对象
  toObject() {
    return {
      deviceId: this.deviceId,          // 设备号
      countryCode: this.countryCode,    // 国家代码
      taskKey: this.taskKey,            // 任务键
      fullUrl: this.fullUrl,            // 完整链接
      firstVisit: this.firstVisit,      // 首次访问时间
      lastVisit: this.lastVisit,        // 最后访问时间
      visitCount: this.visitCount,      // 进来人数（该设备访问了多少次）
      completed: this.completed         // 是否完成
    };
  }
  
  // 从对象创建
  static fromObject(obj) {
    const stats = new UVStats(obj.deviceId, obj.countryCode, obj.taskKey);
    stats.fullUrl = obj.fullUrl || window.location.href;
    stats.firstVisit = obj.firstVisit || Date.now();
    stats.lastVisit = obj.lastVisit || Date.now();
    stats.visitCount = obj.visitCount || 1;
    stats.completed = obj.completed || false;
    return stats;
  }
}

// 统计数据结构
class TrackingStats {
  constructor(pageName = 'default') {
    this.pageName = pageName;
    this.pvCount = 0;        // 进来次数（PV）
    this.completeCount = 0;  // 完成次数
    this.completeRate = 0;   // 完成率
    this.lastUpdateTime = Date.now();
  }

  // 增加 PV
  incrementPV() {
    this.pvCount++;
    console.log(this.updateCompleteRate,'000000000000')
    this.updateCompleteRate();
    this.lastUpdateTime = Date.now();
  }

  // 增加完成次数
  incrementComplete() {
    this.completeCount++;
    this.updateCompleteRate();
    this.lastUpdateTime = Date.now();
  }

  // 更新完成率
  updateCompleteRate() {
    if (this.pvCount > 0) {
      this.completeRate = (this.completeCount / this.pvCount) * 100;
    } else {
      this.completeRate = 0;
    }
  }

  // 转换为对象
  toObject() {
    return {
      pageName: this.pageName,
      pvCount: this.pvCount,
      completeCount: this.completeCount,
      completeRate: parseFloat(this.completeRate.toFixed(2)),
      lastUpdateTime: this.lastUpdateTime
    };
  }

  // 从对象创建
  static fromObject(obj) {
    const stats = new TrackingStats(obj.pageName);
    stats.pvCount = obj.pvCount || 0;
    stats.completeCount = obj.completeCount || 0;
    stats.completeRate = obj.completeRate || 0;
    stats.lastUpdateTime = obj.lastUpdateTime || Date.now();
    return stats;
  }
}

// 埋点追踪器主类
class PageTracker {
  constructor(config = {}) {
    this.config = { ...TRACKING_CONFIG, ...config };
    this.currentPageName = this.getPageName();
    this.stats = null;
    this.uvStats = null;
    this.startTime = null;
    this.hasCompleted = false;
    this.timer = null;
    this.deviceId = null;
    this.countryCode = 'UNKNOWN';
    this.taskKey = null;
    
    this.init();
  }

  // 获取页面名称
  getPageName() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop() || 'index';
    return pageName.replace('.html', '');
  }
  
  // 生成任务键（用于区分同域名不同参数）
  generateTaskKey() {
    const url = new URL(window.location.href);
    const domain = url.hostname;
    const params = url.searchParams.toString();
    
    // 如果有参数，则将参数加入任务键
    if (params) {
      // 对参数排序以确保一致性
      const sortedParams = new URLSearchParams(params);
      const sortedParamString = Array.from(sortedParams.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      return `${domain}?${sortedParamString}`;
    }
    
    return domain;
  }

  // 初始化
  init() {
    // 初始化设备 ID
    this.deviceId = DeviceFingerprint.getDeviceId();
    
    // 生成任务键
    this.taskKey = this.generateTaskKey();
    
    // 获取国家信息（异步）
    this.initializeCountryInfo();
    
    // 加载统计数据
    this.loadStats();
    
    // 记录 PV
    this.recordPV();
    
    // 设置完成追踪
    this.setupCompletionTracking();
    
    // 设置页面卸载前的处理
    this.setupBeforeUnload();
    
    if (this.config.debug) {
      console.log('[Tracking] 埋点初始化完成', {
        page: this.currentPageName,
        deviceId: this.deviceId,
        taskKey: this.taskKey,
        config: this.config
      });
    }
  }
  
  // 初始化国家信息
  async initializeCountryInfo() {
    // 先使用缓存的国家信息
    const cachedCountry = new CountryResolver().getCountrySync();
    this.countryCode = cachedCountry.countryCode;
    
    // 异步获取最新的国家信息
    try {
      const resolver = await new CountryResolver().fetchCountryByIP();
      this.countryCode = resolver.countryCode;
      resolver.saveToCache();
      
      // 重新加载 UV 统计数据（使用正确的国家代码）
      this.loadUVStats();
      
      if (this.config.debug) {
        console.log('[Tracking] 国家信息已更新:', this.countryCode);
      }
    } catch (error) {
      if (this.config.debug) {
        console.log('[Tracking] 使用缓存的国家信息:', this.countryCode);
      }
    }
  }

  // 加载统计数据
  loadStats() {
    if (!this.config.enableStorage) {
      this.stats = new TrackingStats(this.currentPageName);
      return;
    }

    try {
      const storageKey = this.config.storageKeyPrefix + this.currentPageName;
      const savedStats = localStorage.getItem(storageKey);
      
      if (savedStats) {
        const statsObj = JSON.parse(savedStats);
        this.stats = TrackingStats.fromObject(statsObj);
      } else {
        this.stats = new TrackingStats(this.currentPageName);
      }
    } catch (error) {
      console.error('[Tracking] 加载统计数据失败:', error);
      this.stats = new TrackingStats(this.currentPageName);
    }
    
    // 加载 UV 统计数据
    this.loadUVStats();
  }
  
  // 加载 UV 统计数据
  loadUVStats() {
    if (!this.config.enableStorage) {
      this.uvStats = new UVStats(this.deviceId, this.countryCode, this.taskKey);
      return;
    }
    
    try {
      const uvStorageKey = this.getUVStorageKey();
      const savedUVStats = localStorage.getItem(uvStorageKey);
      
      if (savedUVStats) {
        const uvStatsObj = JSON.parse(savedUVStats);
        this.uvStats = UVStats.fromObject(uvStatsObj);
      } else {
        this.uvStats = new UVStats(this.deviceId, this.countryCode, this.taskKey);
      }
    } catch (error) {
      console.error('[Tracking] 加载 UV 统计数据失败:', error);
      this.uvStats = new UVStats(this.deviceId, this.countryCode, this.taskKey);
    }
  }
  
  // 生成 UV 存储键
  getUVStorageKey() {
    // 格式：tracking_uv_{countryCode}_{taskKey_hash}
    const taskKeyHash = this.hashCode(this.taskKey);
    return `${this.config.uvStorageKeyPrefix}${this.countryCode}_${taskKeyHash}`;
  }
  
  // 简单的哈希函数
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).toUpperCase();
  }

  // 保存统计数据
  saveStats() {
    if (!this.config.enableStorage) {
      return;
    }

    try {
      const storageKey = this.config.storageKeyPrefix + this.currentPageName;
      localStorage.setItem(storageKey, JSON.stringify(this.stats.toObject()));
      
      if (this.config.debug) {
        console.log('[Tracking] 统计数据已保存', this.stats.toObject());
      }
    } catch (error) {
      console.error('[Tracking] 保存统计数据失败:', error);
    }
    
    // 保存 UV 统计数据
    this.saveUVStats();
  }
  
  // 保存 UV 统计数据
  saveUVStats() {
    if (!this.config.enableStorage || !this.uvStats) {
      return;
    }
    
    try {
      const uvStorageKey = this.getUVStorageKey();
      localStorage.setItem(uvStorageKey, JSON.stringify(this.uvStats.toObject()));
      
      if (this.config.debug) {
        console.log('[Tracking] UV 统计数据已保存', this.uvStats.toObject());
      }
    } catch (error) {
      console.error('[Tracking] 保存 UV 统计数据失败:', error);
    }
  }

  // 记录 PV（进来次数）
  recordPV() {
    console.log('进来了')
    this.stats.incrementPV();
    this.saveStats();
    this.startTime = Date.now();
    this.hasCompleted = false;
    
    // 记录 UV 进来人数（每次访问都累加，按设备号统计）
    if (this.uvStats) {
      this.uvStats.incrementVisit();
      this.saveUVStats();
    }
    
    if (this.config.debug) {
      console.log('[Tracking] 记录 PV - 当前统计:', this.stats.toObject());
      console.log('[Tracking] UV 信息 - 进来人数:', {
        deviceId: this.deviceId,
        countryCode: this.countryCode,
        taskKey: this.taskKey,
        visitInCount: this.uvStats ? this.uvStats.visitCount : 0,  // 该设备的进来人数
        completed: this.uvStats ? this.uvStats.completed : false
      });
    }
  }

  // 设置完成追踪
  setupCompletionTracking() {
    // 使用 visibilitychange 事件检测用户是否认真浏览页面
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.hasCompleted) {
        this.checkAndRecordComplete();
      }
    });

    // 定时检查是否满足完成条件
    this.timer = setInterval(() => {
      if (!this.hasCompleted && document.visibilityState === 'visible') {
        this.checkAndRecordComplete();
      }
    }, 1000);
  }

  // 检查并记录完成
  checkAndRecordComplete() {
    if (!this.startTime || this.hasCompleted) {
      return;
    }

    const stayTime = (Date.now() - this.startTime) / 1000; // 停留时间（秒）
    
    if (stayTime >= this.config.minStayTime) {
      this.recordComplete(stayTime);
    }
  }

  // 记录完成次数
  recordComplete(stayTime) {
    this.hasCompleted = true;
    this.stats.incrementComplete();
    this.saveStats();
    
    // 标记 UV 为完成
    if (this.uvStats) {
      this.uvStats.markComplete();
      this.saveUVStats();
    }
    
    if (this.config.debug) {
      console.log('[Tracking] 记录完成 - 停留时间:', stayTime.toFixed(2), '秒');
      console.log('[Tracking] 当前统计:', this.stats.toObject());
    }
  }

  // 设置页面卸载前的处理
  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      // 如果已经满足完成条件但还没来得及保存，在这里保存
      if (this.hasCompleted) {
        this.saveStats();
      }
      
      // 清除定时器
      if (this.timer) {
        clearInterval(this.timer);
      }
    });
  }

  // 手动标记为完成（可以在特定事件触发时调用）
  markAsComplete() {
    if (!this.hasCompleted) {
      this.recordComplete((Date.now() - this.startTime) / 1000);
    }
  }

  // 获取当前统计数据
  getStats() {
    return {
      pv: this.stats.toObject(),
      uv: this.uvStats ? this.uvStats.toObject() : null
    };
  }

  // 获取所有页面的统计数据
  static getAllStats(storageKeyPrefix = 'tracking_stats_') {
    const allStats = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(storageKeyPrefix)) {
        try {
          const value = localStorage.getItem(key);
          const stats = JSON.parse(value);
          allStats.push(stats);
        } catch (error) {
          console.error('[Tracking] 读取统计数据失败:', error);
        }
      }
    }
    
    return allStats;
  }
  
  // 获取所有 UV 统计数据
  static getAllUVStats(uvStorageKeyPrefix = 'tracking_uv_') {
    const allUVStats = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(uvStorageKeyPrefix)) {
        try {
          const value = localStorage.getItem(key);
          const uvStats = JSON.parse(value);
          allUVStats.push(uvStats);
        } catch (error) {
          console.error('[Tracking] 读取 UV 统计数据失败:', error);
        }
      }
    }
    
    return allUVStats;
  }
  
  // 按国家分组获取 UV 统计
  static getUVStatsByCountry(uvStorageKeyPrefix = 'tracking_uv_') {
    const allUVStats = this.getAllUVStats(uvStorageKeyPrefix);
    const groupedByCountry = {};
    
    allUVStats.forEach(uvStat => {
      const countryCode = uvStat.countryCode || 'UNKNOWN';
      
      if (!groupedByCountry[countryCode]) {
        groupedByCountry[countryCode] = {
          countryCode: countryCode,
          uniqueVisitors: new Set(),
          visitInCount: 0,        // 进来人数（所有设备的访问次数总和）
          completedVisits: 0
        };
      }
      
      groupedByCountry[countryCode].uniqueVisitors.add(uvStat.deviceId);
      groupedByCountry[countryCode].visitInCount += uvStat.visitCount || 0;  // 累加进来人数
      if (uvStat.completed) {
        groupedByCountry[countryCode].completedVisits++;
      }
    });
    
    // 转换为数组格式
    return Object.values(groupedByCountry).map(country => ({
      countryCode: country.countryCode,
      uvCount: country.uniqueVisitors.size,     // UV 数（独立设备数）
      visitInCount: country.visitInCount,       // 进来人数（总访问次数）
      completedVisits: country.completedVisits, // 完成次数
      completeRate: country.visitInCount > 0 
        ? ((country.completedVisits / country.visitInCount) * 100).toFixed(2) 
        : 0
    }));
  }
  
  // 按任务分组获取 UV 统计
  static getUVStatsByTask(uvStorageKeyPrefix = 'tracking_uv_') {
    const allUVStats = this.getAllUVStats(uvStorageKeyPrefix);
    const groupedByTask = {};
    
    allUVStats.forEach(uvStat => {
      const taskKey = uvStat.taskKey || 'unknown';
      
      if (!groupedByTask[taskKey]) {
        groupedByTask[taskKey] = {
          taskKey: taskKey,
          uniqueVisitors: new Set(),
          visitInCount: 0,        // 进来人数（所有设备的访问次数总和）
          completedVisits: 0,
          countries: new Set()
        };
      }
      
      groupedByTask[taskKey].uniqueVisitors.add(uvStat.deviceId);
      groupedByTask[taskKey].visitInCount += uvStat.visitCount || 0;  // 累加进来人数
      if (uvStat.completed) {
        groupedByTask[taskKey].completedVisits++;
      }
      groupedByTask[taskKey].countries.add(uvStat.countryCode);
    });
    
    // 转换为数组格式
    return Object.values(groupedByTask).map(task => ({
      taskKey: task.taskKey,
      uvCount: task.uniqueVisitors.size,      // UV 数（独立设备数）
      visitInCount: task.visitInCount,        // 进来人数（总访问次数）
      completedVisits: task.completedVisits,  // 完成次数
      completeRate: task.visitInCount > 0 
        ? ((task.completedVisits / task.visitInCount) * 100).toFixed(2) 
        : 0,
      countryCount: task.countries.size,
      countries: Array.from(task.countries)
    }));
  }
  
  // 按链接获取 UV 统计
  static getUVStatsByLink(uvStorageKeyPrefix = 'tracking_uv_') {
    const allUVStats = this.getAllUVStats(uvStorageKeyPrefix);
    const groupedByLink = {};
    
    allUVStats.forEach(uvStat => {
      const fullUrl = uvStat.fullUrl || 'unknown';
      
      if (!groupedByLink[fullUrl]) {
        groupedByLink[fullUrl] = {
          fullUrl: fullUrl,
          uniqueVisitors: new Set(),
          visitInCount: 0,        // 进来人数（所有设备的访问次数总和）
          completedVisits: 0
        };
      }
      
      groupedByLink[fullUrl].uniqueVisitors.add(uvStat.deviceId);
      groupedByLink[fullUrl].visitInCount += uvStat.visitCount || 0;  // 累加进来人数
      if (uvStat.completed) {
        groupedByLink[fullUrl].completedVisits++;
      }
    });
    
    // 转换为数组格式
    return Object.values(groupedByLink).map(link => ({
      fullUrl: link.fullUrl,
      uvCount: link.uniqueVisitors.size,      // UV 数（独立设备数）
      visitInCount: link.visitInCount,        // 进来人数（总访问次数）
      completedVisits: link.completedVisits,  // 完成次数
      completeRate: link.visitInCount > 0 
        ? ((link.completedVisits / link.visitInCount) * 100).toFixed(2) 
        : 0
    }));
  }

  // 清空统计数据
  static clearAllStats(storageKeyPrefix = 'tracking_stats_') {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(storageKeyPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[Tracking] 已清空所有统计数据');
  }
  
  // 清空所有 UV 统计数据
  static clearAllUVStats(uvStorageKeyPrefix = 'tracking_uv_') {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(uvStorageKeyPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[Tracking] 已清空所有 UV 统计数据');
  }

  // 销毁追踪器
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.saveStats();
  }
}

// 导出全局方法
window.TrackingUtils = {
  // 创建追踪器实例
  createTracker(config) {
    return new PageTracker(config);
  },

  // 获取指定页面的统计数据
  getPageStats(pageName) {
    const storageKey = 'tracking_stats_' + pageName;
    const savedStats = localStorage.getItem(storageKey);
    if (savedStats) {
      return JSON.parse(savedStats);
    }
    return null;
  },

  // 获取所有页面统计数据
  getAllPageStats() {
    return PageTracker.getAllStats();
  },
  
  // 获取所有 UV 统计数据
  getAllUVStats() {
    return PageTracker.getAllUVStats();
  },
  
  // 获取按国家分组的 UV 统计
  getUVStatsByCountry() {
    return PageTracker.getUVStatsByCountry();
  },
  
  // 获取按任务分组的 UV 统计
  getUVStatsByTask() {
    return PageTracker.getUVStatsByTask();
  },
  
  // 获取按链接分组的 UV 统计
  getUVStatsByLink() {
    return PageTracker.getUVStatsByLink();
  },

  // 清空所有统计数据
  clearAllData() {
    PageTracker.clearAllStats();
    PageTracker.clearAllUVStats();
  },

  // 计算总体的完成率
  calculateOverallCompleteRate() {
    const allStats = this.getAllPageStats();
    let totalPV = 0;
    let totalComplete = 0;
    
    allStats.forEach(stats => {
      totalPV += stats.pvCount || 0;
      totalComplete += stats.completeCount || 0;
    });
    
    return {
      totalPV,
      totalComplete,
      overallRate: totalPV > 0 ? ((totalComplete / totalPV) * 100).toFixed(2) : 0
    };
  },
  
  // 获取当前设备 ID
  getDeviceId() {
    return DeviceFingerprint.getDeviceId();
  },
  
  // 获取当前国家代码
  getCountryCode() {
    return new CountryResolver().getCountrySync().countryCode;
  },
  
  // 获取当前任务键
  getTaskKey() {
    const url = new URL(window.location.href);
    const domain = url.hostname;
    const params = url.searchParams.toString();
    
    if (params) {
      const sortedParams = new URLSearchParams(params);
      const sortedParamString = Array.from(sortedParams.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      return `${domain}?${sortedParamString}`;
    }
    
    return domain;
  }
};

// 自动初始化（页面加载时）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pageTracker = new PageTracker();
  });
} else {
  window.pageTracker = new PageTracker();
}


// navigator.getBattery().then(battery => {
//   console.log(battery,'电量')

// });
function handleBattery(battery) {
  if (battery.level < 0.2) {
    showWarning();
  } else if (battery.level < 0.4) {
    showReminder(); 
  }

  if (battery.charging) {
    showCharging();
  } else {
    showLevel(battery.level);
  }
}

// 监听电池状态变化
navigator.getBattery().then(battery => {
   console.log(battery,'电量')
  battery.addEventListener('chargingchange', () => {
    handleBattery(battery);
    console.log(battery,'电量')

  });
  
  // ...其他事件监听
})


// 示例用法（在 HTML 页面中可以通过以下方式调用）：
// 1. 自动追踪：页面加载时自动开始追踪
// 2. 手动获取数据：window.TrackingUtils.getPageStats('index')
// 3. 获取所有数据：window.TrackingUtils.getAllPageStats()
// 4. 计算总体完成率：window.TrackingUtils.calculateOverallCompleteRate()
// 5. 自定义配置：window.TrackingUtils.createTracker({ minStayTime: 10, debug: true })

// ==================== UV 统计使用示例 ====================

// 6. 获取当前设备 ID（UV 标识）
const deviceId = window.TrackingUtils.getDeviceId();
console.log('当前设备号:', deviceId);

// 7. 获取所有 UV 统计数据（包含进来人数）
const allUVStats = window.TrackingUtils.getAllUVStats();
console.log('所有 UV 统计:', allUVStats);
// 返回格式：[{ deviceId, countryCode, taskKey, visitCount(进来人数), completed }]

// 8. 按国家分组查看 UV 统计（包含进来人数）
const uvByCountry = window.TrackingUtils.getUVStatsByCountry();
console.log('按国家统计:', uvByCountry);
// 返回格式：[
//   { 
//     countryCode: 'CN', 
//     uvCount: 10,           // UV 数（独立设备数）
//     visitInCount: 50,      // 进来人数（总访问次数）
//     completedVisits: 30,   // 完成次数
//     completeRate: 60.00    // 完成率
//   }
// ]

// 9. 按任务分组查看 UV 统计（同域名不同参数会分开统计）
const uvByTask = window.TrackingUtils.getUVStatsByTask();
console.log('按任务统计:', uvByTask);
// 返回格式：[
//   { 
//     taskKey: 'example.com?id=123&type=game', 
//     uvCount: 5,            // UV 数（独立设备数）
//     visitInCount: 20,      // 进来人数（总访问次数）
//     completedVisits: 15,   // 完成次数
//     completeRate: 75.00,   // 完成率
//     countryCount: 3,       // 涉及国家数
//     countries: ['CN', 'US', 'JP']
//   }
// ]

// 10. 按链接分组查看 UV 统计
const uvByLink = window.TrackingUtils.getUVStatsByLink();
console.log('按链接统计:', uvByLink);
// 返回格式：[
//   { 
//     fullUrl: 'https://example.com?id=123', 
//     uvCount: 3,            // UV 数（独立设备数）
//     visitInCount: 12,      // 进来人数（总访问次数）
//     completedVisits: 10,   // 完成次数
//     completeRate: 83.33    // 完成率
//   }
// ]

// ==================== 关键概念说明 ====================
// - deviceId: 设备唯一标识（基于浏览器指纹生成）
// - countryCode: 国家代码（通过 IP API 或浏览器语言推断）
// - taskKey: 任务键 = 域名 + 排序后的参数（例：example.com?id=1&name=abc）
// - visitCount: 单个设备的访问次数（该设备进来了多少次）
// - visitInCount: 所有设备的访问次数总和（总共进来了多少人/次）
// - uvCount: 独立设备数量（有多少个不同的设备）
// - completed: 是否完成（停留时间达到阈值）