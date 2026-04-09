const fs = require('fs');
const path = require('path');
const https = require('https');

// 读取配置文件
function readConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (!config.domain) {
            throw new Error('配置文件中缺少 domain 字段');
        }
        
        // color1 的处理逻辑：
        // 1. 如果配置文件中明确指定了 color1，则使用它
        // 2. 如果只有 color 字段（向后兼容），则用它来设置 color1
        // 3. 如果都没有，使用默认值
        if (!config.color1) {
            if (config.color) {
                config.color1 = config.color;
            } else {
                config.color1 = '#def0f9';
            }
        }
        
        return config;
    } catch (error) {
        console.error('读取配置文件失败:', error.message);
        process.exit(1);
    }
}

// 更新CSS中的 --color1 变量值
function updateCSSColor1(color1) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        const color1Regex = /(--color1:\s*)([^;]+)/;
        if (color1Regex.test(cssContent)) {
            cssContent = cssContent.replace(color1Regex, `$1${color1}`);
            console.log(`✓ CSS变量 --color1 已更新: ${color1}`);
        } else {
            console.warn('未找到 --color1，跳过更新');
        }
        
        fs.writeFileSync(cssPath, cssContent, 'utf8');
        console.log(`✓ CSS变量已更新: ${cssPath}`);
        
    } catch (error) {
        console.error('更新CSS变量 --color1 失败:', error.message);
        throw error;
    }
}

// 更新 theme-variables.css 文件
function updateThemeVariables(color) {
    try {
        const themeVarsPath = path.join(__dirname, 'theme-variables.css');
        
        // 将十六进制颜色转换为 RGB
        const rgb = hexToRgb(color);
        let rgba10 = 'rgba(176, 231, 164, 0.1)';
        let rgba30 = 'rgba(176, 231, 164, 0.3)';
        
        if (rgb) {
            rgba10 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
            rgba30 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
        }
        
        const themeVarsContent = `:root {
  --primary-theme-color: ${color};
  --primary-background-alpha-10: ${rgba10};
  --primary-background-alpha-30: ${rgba30};
}
`;
        
        fs.writeFileSync(themeVarsPath, themeVarsContent, 'utf8');
        console.log(`✓ theme-variables.css 已更新: ${themeVarsPath}`);
        console.log(`  主题色: ${color}`);
    } catch (error) {
        console.error('更新 theme-variables.css 失败:', error.message);
        throw error;
    }
}

// 辅助函数：将十六进制颜色转换为 RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 辅助函数：将 RGB 转换为十六进制颜色
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
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
                
                // 1. 更新 <title> 标签中的域名（首页）
                const titleRegex = /(<title>)([^<]+)(<\/title>)/i;
                htmlContent = htmlContent.replace(titleRegex, (match, openTag, titleContent, closeTag) => {
                    const domainMatch = titleContent.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + titleContent.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });

                // 2. 更新 .logo 标签内的域名（顶部logo）
                const logoRegex = /(<div\s+class=["']logo["']>\s*<p>)([^<]+)(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, oldDomain, closeTag) => {
                    const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + oldDomain.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });

                // 3. 更新 .footer-title 标签内的域名
                const footerTitleRegex = /(<h3\s+class=["']footer-title["']>)([^<]+)(<\/h3>)/gi;
                htmlContent = htmlContent.replace(footerTitleRegex, (match, openTag, oldDomain, closeTag) => {
                    const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + oldDomain.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });
                
                // 4. 更新 .footer-brand 标签内的域名
                const brandRegex = /(<div\s+class=["']footer-brand["']>)([^<]+)(<\/div>)/gi;
                htmlContent = htmlContent.replace(brandRegex, (match, openTag, oldDomain, closeTag) => {
                    const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + oldDomain.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });
                
                // 5. 更新版权文本中的域名
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
        const config = readConfig();
        console.log('读取配置:');
        if (config.color) {
            console.log(`  颜色: ${config.color}`);
        }
        if (config.color1) {
            console.log(`  color1: ${config.color1}`);
        }
        console.log(`  域名: ${config.domain}\n`);
        
        updateCSSColor1(config.color1);
        console.log('');
        
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

