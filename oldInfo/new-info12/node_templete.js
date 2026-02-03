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




// 更新CSS中的 --primary-theme-color 变量值
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 使用正则表达式替换 --primary-theme-color 的值
        const colorPrimaryRegex = /(--primary-theme-color:\s*)([^;]+)/;
        const newColorPrimaryValue = `$1${color}`;
        
        if (colorPrimaryRegex.test(cssContent)) {
            cssContent = cssContent.replace(colorPrimaryRegex, newColorPrimaryValue);
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --primary-theme-color 已更新: ${cssPath}`);
            console.log(`  新值: --primary-theme-color: ${color}`);
        } else {
            // 如果没有找到 --primary-theme-color，在:root中添加
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --primary-theme-color: ${color};`
                );
            } else {
                cssContent = `:root {\n  --primary-theme-color: ${color};\n}\n\n${cssContent}`;
            }
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --primary-theme-color 已添加: ${cssPath}`);
            console.log(`  新值: --primary-theme-color: ${color}`);
        }
    } catch (error) {
        console.error('更新CSS变量 --primary-theme-color 失败:', error.message);
        throw error;
    }
}

// 更新所有HTML文件中的域名
function updateDomainInHTML(domain) {
    try {
        // 查找所有HTML文件
        const htmlFiles = [
            path.join(__dirname, 'index.html'),
            path.join(__dirname, 'detail.html'),
            path.join(__dirname, 'pages', 'about.html'),
            path.join(__dirname, 'pages', 'privacy.html'),
            path.join(__dirname, 'pages', 'terms.html'),
            path.join(__dirname, 'pages', 'category.html')
        ];
        
        // 清理域名，移除协议和路径
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        
        let updatedCount = 0;
        
        htmlFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                let htmlContent = fs.readFileSync(filePath, 'utf8');
                let modified = false;
                
                // 1. 更新顶部 logo 域名
                // 匹配 <div class="logo"> 或 <div class="logo logo-center"> 中的 <p> 标签内的域名
                const logoRegex = /(<div\s+class=["']logo(?:\s+logo-center)?["']>\s*<p>)([^<]+)(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, oldDomain, closeTag) => {
                    const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + oldDomain.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });
                
                // 2. 更新footer中的域名（如果存在）
                if (htmlContent.includes('footer-copyright') || htmlContent.includes('footer')) {
                    // 更新 .footer-brand 标签内的域名
                    // 匹配 <div class="footer-brand">域名</div>
                    const brandRegex = /(<div\s+class=["']footer-brand["']>)([^<]+)(<\/div>)/gi;
                    htmlContent = htmlContent.replace(brandRegex, (match, openTag, oldDomain, closeTag) => {
                        // 只替换域名部分，保留其他可能的文本
                        const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                        if (domainMatch) {
                            modified = true;
                            return openTag + oldDomain.replace(domainMatch[0], cleanDomain) + closeTag;
                        }
                        return match;
                    });
                    
                    // 更新版权文本中的域名
                    // 匹配 "© 2025 域名. All Rights Reserved." 格式
                    const copyrightRegex1 = /(©\s+\d{4}\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+Rights?\s+Reserved\.)/gi;
                    htmlContent = htmlContent.replace(copyrightRegex1, (match, prefix, oldDomain, suffix) => {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                    
                    // 匹配 "Copyright © 2021-2025 域名. All rights Reserved." 格式
                    const copyrightRegex2 = /(Copyright\s+©\s+\d{4}-\d{4}\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+rights?\s+Reserved\.)/gi;
                    htmlContent = htmlContent.replace(copyrightRegex2, (match, prefix, oldDomain, suffix) => {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                    
                    // 匹配其他可能的版权格式（更通用的匹配）
                    const copyrightRegex3 = /(Copyright\s+©\s+\d{4}(?:-\d{4})?\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+rights?\s+Reserved\.)/gi;
                    htmlContent = htmlContent.replace(copyrightRegex3, (match, prefix, oldDomain, suffix) => {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                }
                
                // 保存文件（如果有修改）
                if (modified) {
                    fs.writeFileSync(filePath, htmlContent, 'utf8');
                    updatedCount++;
                    console.log(`✓ 已更新: ${path.relative(__dirname, filePath)}`);
                } else {
                    console.log(`○ 未找到域名（已是最新）: ${path.relative(__dirname, filePath)}`);
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

// 主函数
async function main() {
    console.log('开始执行主题配置更新...\n');
    
    try {
        // 1. 读取配置
        const config = readConfig();
        console.log('读取配置:');
        console.log(`  颜色: ${config.color}`);
        console.log(`  域名: ${config.domain}\n`);
        
        // 2. 更新CSS变量 --primary-theme-color
        updateCSSColor(config.color);
        console.log('');
        
        // 3. 更新HTML域名
        updateDomainInHTML(config.domain);
        console.log('');
        
        console.log('✓ 所有更新完成！');
        
    } catch (error) {
        console.error('\n✗ 执行失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();

