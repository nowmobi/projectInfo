const fs = require('fs');
const path = require('path');

// 读取配置文件
function readConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (!config.color || !config.domain) {
            throw new Error('配置文件中缺少 color 或 domain 字段');
        }
        
        return config;
    } catch (error) {
        console.error('读取配置文件失败:', error.message);
        process.exit(1);
    }
}



// 辅助函数：根据背景色计算最佳对比色（黑色或白色）
function getContrastColor(hexColor) {
    // 移除 # 号
    const hex = hexColor.replace('#', '');
    
    // 解析RGB值
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 计算亮度（使用 sRGB 亮度公式）
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // 如果亮度大于 0.5（浅色背景），使用黑色文字
    // 如果亮度小于等于 0.5（深色背景），使用白色文字
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// 更新CSS中的primary-color颜色
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 计算最佳对比色
        const contrastColor = getContrastColor(color);
        
        // 使用正则表达式替换 --primary-color 的值
        const primaryColorRegex = /(--primary-color:\s*)([^;]+)/;
        const newPrimaryValue = `$1${color}`;
        
        // 使用正则表达式替换 --text-primary 的值
        const textPrimaryRegex = /(--text-primary:\s*)([^;]+)/;
        const newTextPrimaryValue = `$1${contrastColor}`;
        
        let hasChanges = false;
        
        if (primaryColorRegex.test(cssContent)) {
            cssContent = cssContent.replace(primaryColorRegex, newPrimaryValue);
            hasChanges = true;
        }
        
        if (textPrimaryRegex.test(cssContent)) {
            cssContent = cssContent.replace(textPrimaryRegex, newTextPrimaryValue);
            hasChanges = true;
        }
        
        if (hasChanges) {
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS颜色已更新: ${cssPath}`);
            console.log(`  primary-color: ${color}`);
            console.log(`  text-primary: ${contrastColor} (自动计算)`);
        } else {
            console.log(`○ 未找到需要更新的CSS变量`);
        }
    } catch (error) {
        console.error('更新CSS颜色失败:', error.message);
        throw error;
    }
}

// 更新所有HTML文件中的域名
function updateDomainInHTML(domain) {
    try {
        // 处理域名：去掉协议和路径，只保留主域名
        const displayDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        
        // 查找所有HTML文件
        const htmlFiles = [
            path.join(__dirname, 'index.html'),
            path.join(__dirname, 'detail.html'),
            path.join(__dirname, 'pages', 'about.html'),
            path.join(__dirname, 'pages', 'privacy.html'),
            path.join(__dirname, 'pages', 'terms.html'),
            path.join(__dirname, 'pages', 'category.html')
        ];
        
        let updatedCount = 0;
        
        htmlFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                let htmlContent = fs.readFileSync(filePath, 'utf8');
                let modified = false;
                
                // 更新页面顶部的 logo 域名
                const logoRegex = /(<a[^>]*class\s*=\s*["']logo["'][^>]*>\s*<p>)([^<]+)(<\/p>\s*<\/a>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, content, closeTag) => {
                    modified = true;
                    return `${openTag}${displayDomain}${closeTag}`;
                });
                
                // 检查是否包含footer-copyright-text
                if (htmlContent.includes('footer-copyright-text')) {
                    // 直接匹配并替换footer-copyright-text标签内的内容
                    // 匹配格式：<div class="footer-copyright-text">© 2025 Gameeden. All Rights Reserved.</div>
                    const footerTextRegex = /(<div[^>]*class\s*=\s*["']footer-copyright-text["'][^>]*>)([^<]+)(<\/div>)/gi;
                    
                    htmlContent = htmlContent.replace(footerTextRegex, (match, openTag, content, closeTag) => {
                        // 提取年份（匹配第一个4位数字）
                        const yearMatch = content.match(/\d{4}/);
                        const currentYear = yearMatch ? yearMatch[0] : new Date().getFullYear();
                        
                        // 匹配格式：© 2025 Gameeden. All Rights Reserved.
                        // 或者：Copyright © 2021-2025 domain.com All rights Reserved.
                        let newContent;
                        
                        // 尝试匹配标准格式：© 年份 域名. All Rights Reserved.
                        if (/©\s*\d{4}\s+[^\s.]+\.\s+All Rights Reserved\./i.test(content)) {
                            // 替换域名部分，保持格式
                            newContent = content.replace(/©\s*\d{4}\s+[^\s.]+/, `© ${currentYear} ${displayDomain}`);
                        }
                        // 尝试匹配：Copyright © 年份-年份 域名 All rights Reserved.
                        else if (/Copyright\s+©\s+\d{4}-\d{4}\s+[^\s]+\s+All rights Reserved\./i.test(content)) {
                            newContent = content.replace(/Copyright\s+©\s+\d{4}-\d{4}\s+[^\s]+/, `Copyright © 2021-${currentYear} ${displayDomain}`);
                        }
                        // 如果都不匹配，生成标准格式
                        else {
                            newContent = `© ${currentYear} ${displayDomain}. All Rights Reserved.`;
                        }
                        
                        modified = true;
                        return `${openTag}${newContent}${closeTag}`;
                    });
                }
                
                if (modified) {
                    fs.writeFileSync(filePath, htmlContent, 'utf8');
                    updatedCount++;
                    console.log(`✓ 已更新: ${path.relative(__dirname, filePath)}`);
                } else {
                    console.log(`○ 未找到匹配的域名格式: ${path.relative(__dirname, filePath)}`);
                }
            } else {
                console.log(`○ 文件不存在: ${path.relative(__dirname, filePath)}`);
            }
        });
        
        console.log(`✓ 共更新 ${updatedCount} 个HTML文件中的域名`);
        
    } catch (error) {
        console.error('更新HTML域名失败:', error.message);
        throw error;
    }
}


// 更新 BaseURL.js 中第1行的 json 数字和 infoType
function updateBaseURL(info, json) {
    try {
        const baseURLPath = path.join(__dirname, 'public', 'js', 'BaseURL.js');
        let jsContent = fs.readFileSync(baseURLPath, 'utf8');
        let hasChanges = false;

        // 修改第1行：export const BASE_URL = "...db数字.json"
        // 匹配第1行中的 db数字.json，只替换数字部分
        const firstLineRegex = /^(export\s+const\s+BASE_URL\s*=\s*["'])([^"']*\/db)(\d+)(\.json["'])/m;
        
        if (firstLineRegex.test(jsContent)) {
            jsContent = jsContent.replace(firstLineRegex, (match, prefix, urlPrefix, oldNumber, suffix) => {
                if (oldNumber !== String(json)) {
                    hasChanges = true;
                    return `${prefix}${urlPrefix}${json}${suffix}`;
                }
                return match;
            });
            
            if (hasChanges) {
                console.log(`✓ BaseURL.js 第1行已更新: db${json}.json`);
            }
        }

        // 根据 info 值修改 infoType
        const infoTypeRegex = /const\s+infoType\s*=\s*['"]info\d+['"]/;
        if (infoTypeRegex.test(jsContent)) {
            const oldInfoType = jsContent.match(/const\s+infoType\s*=\s*['"](info\d+)['"]/);
            if (oldInfoType && oldInfoType[1] !== `info${info}`) {
                jsContent = jsContent.replace(infoTypeRegex, `const infoType = 'info${info}'`);
                hasChanges = true;
                console.log(`✓ infoType 已更新为: info${info}`);
            }
        }

        if (hasChanges) {
            fs.writeFileSync(baseURLPath, jsContent, 'utf8');
            console.log(`✓ BaseURL.js 已更新: ${baseURLPath}`);
        } else {
            console.log(`○ BaseURL.js 无需更新`);
        }

        return hasChanges;
    } catch (error) {
        console.error('更新 BaseURL.js 失败:', error.message);
        throw error;
    }
}

// 主函数
async function main() {
    console.log('开始执行主题配置更新...\n');
    
    try {
        // 1. 读取配置
        const config = readConfig();
        console.log('读取配置:');
        console.log(`  颜色: ${config.color}`);
        console.log(`  域名: ${config.domain}`);
        console.log(`  info: ${config.info}`);
        console.log(`  json: ${config.json}\n`);
        
        // 2. 更新CSS颜色
        updateCSSColor(config.color);
        console.log('');
        
        // 3. 更新HTML域名
        updateDomainInHTML(config.domain);
        console.log('');
        updateBaseURL(config.info, config.json);
        console.log('');
        
        console.log('✓ 所有更新完成！');
        
    } catch (error) {
        console.error('\n✗ 执行失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();

