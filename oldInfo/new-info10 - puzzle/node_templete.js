const fs = require('fs');
const path = require('path');

// 计算最佳文字颜色（黑色或白色）基于背景色
function calculateTextColor(backgroundColor) {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000' : '#fff';
}

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
// 更新CSS中的 --color-primary 和 --text-color 变量值
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        const textColor = calculateTextColor(color);
        
        const colorPrimaryRegex = /(--color-primary:\s*)([^;]+)/;
        const newColorPrimaryValue = `$1${color}`;
        
        const textColorRegex = /(--text-color:\s*)([^;]+)/;
        const newTextColorValue = `$1${textColor}`;
        
        let modified = false;
        
        if (colorPrimaryRegex.test(cssContent)) {
            cssContent = cssContent.replace(colorPrimaryRegex, newColorPrimaryValue);
            modified = true;
            console.log(`✓ CSS变量 --color-primary 已更新: ${cssPath}`);
            console.log(`  新值: --color-primary: ${color}`);
        } else {
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --color-primary: ${color};`
                );
            } else {
                cssContent = `:root {\n  --color-primary: ${color};\n}\n\n${cssContent}`;
            }
            modified = true;
            console.log(`✓ CSS变量 --color-primary 已添加: ${cssPath}`);
            console.log(`  新值: --color-primary: ${color}`);
        }
        
        if (textColorRegex.test(cssContent)) {
            cssContent = cssContent.replace(textColorRegex, newTextColorValue);
            console.log(`✓ CSS变量 --text-color 已更新: ${cssPath}`);
            console.log(`  新值: --text-color: ${textColor}`);
        } else {
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --text-color: ${textColor};`
                );
            } else {
                cssContent = `:root {\n  --text-color: ${textColor};\n}\n\n${cssContent}`;
            }
            console.log(`✓ CSS变量 --text-color 已添加: ${cssPath}`);
            console.log(`  新值: --text-color: ${textColor}`);
        }
        
        if (modified) {
            fs.writeFileSync(cssPath, cssContent, 'utf8');
        }
    } catch (error) {
        console.error('更新CSS变量失败:', error.message);
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
                
                // 1. 更新 <title> 标签中的域名
                // 匹配 <title>域名</title> 或 <title>其他文本 域名</title>
                const titleRegex = /(<title>)([^<]*?)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})([^<]*?)(<\/title>)/gi;
                htmlContent = htmlContent.replace(titleRegex, (match, openTag, prefix, oldDomain, suffix, closeTag) => {
                    modified = true;
                    return openTag + prefix + cleanDomain + suffix + closeTag;
                });

                // 2. 更新首页顶部 .logo 标签内的域名
                // 匹配 <div class="logo"><p>域名</p></div> 或 <div class="logo">域名</div>
                const logoRegex1 = /(<div\s+class=["']logo["']>\s*<p>)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex1, (match, openTag, oldDomain, closeTag) => {
                    modified = true;
                    return openTag + cleanDomain + closeTag;
                });
                
                const logoRegex2 = /(<div\s+class=["']logo["']>)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex2, (match, openTag, oldDomain, closeTag) => {
                    modified = true;
                    return openTag + cleanDomain + closeTag;
                });
                
                // 3. 更新footer中的域名（如果存在）
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
        
        // 2. 更新CSS变量 --color-primary
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

