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

// 将十六进制颜色转换为 rgba 格式
function hexToRgba(hex, alpha) {
    // 移除 # 号
    hex = hex.replace('#', '');
    
    // 解析 RGB 值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 计算最佳文本颜色（根据背景色亮度决定黑色或白色）
function calculateTextColor(hexColor) {
    // 移除 # 号
    hex = hexColor.replace('#', '');
    
    // 解析 RGB 值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 计算亮度（使用标准亮度公式）
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    
    // 如果背景色较亮（亮度 > 128），使用黑色文本
    // 如果背景色较暗（亮度 <= 128），使用白色文本
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

// 更新CSS中的主题色变量值
function updateCSSColor(color, color1, color2) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 确定使用的颜色值
        let finalColor = color;
        if (!finalColor || finalColor.trim() === '') {
            if (color1 && color1.trim() !== '') {
                finalColor = color1.trim();
            } else if (color2 && color2.trim() !== '') {
                finalColor = color2.trim();
            } else {
                throw new Error('没有有效的主题色值');
            }
        } else {
            finalColor = finalColor.trim();
        }
        
        // 生成透明度变体
        const rgba10 = hexToRgba(finalColor, 0.1);
        const rgba30 = hexToRgba(finalColor, 0.3);
        const rgba50 = hexToRgba(finalColor, 0.5);
        const rgba70 = hexToRgba(finalColor, 0.7);
        
        // 计算最佳文本颜色
        const textColor = calculateTextColor(finalColor);
        
        // 更新 :root 块中的所有主题色变量
        // 使用更可靠的方式匹配 :root 块（支持多行和嵌套）
        const rootBlockRegex = /(:root\s*\{)([\s\S]*?)(\})/;
        
        if (rootBlockRegex.test(cssContent)) {
            // 替换现有的 :root 块中的变量值
            cssContent = cssContent.replace(rootBlockRegex, (match, openBrace, rootContent, closeBrace) => {
                // 更新主主题色
                rootContent = rootContent.replace(
                    /(--primary-theme-color:\s*)([^;]+)/,
                    `$1${finalColor}`
                );
                
                // 更新文本颜色（根据主题色计算）
                rootContent = rootContent.replace(
                    /(--text-color:\s*)([^;]+)/,
                    `$1${textColor}`
                );
                
                // 更新透明度变体
                rootContent = rootContent.replace(
                    /(--primary-background-alpha-10:\s*)([^;]+)/,
                    `$1${rgba10}`
                );
                rootContent = rootContent.replace(
                    /(--primary-background-alpha-30:\s*)([^;]+)/,
                    `$1${rgba30}`
                );
                rootContent = rootContent.replace(
                    /(--primary-background-alpha-50:\s*)([^;]+)/,
                    `$1${rgba50}`
                );
                rootContent = rootContent.replace(
                    /(--primary-background-alpha-70:\s*)([^;]+)/,
                    `$1${rgba70}`
                );
                
                return openBrace + rootContent + closeBrace;
            });
            
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS主题色变量已更新: ${cssPath}`);
            console.log(`  主色: --primary-theme-color: ${finalColor}`);
            console.log(`  文本色: --text-color: ${textColor}`);
        } else {
            // 如果没有 :root 块，创建一个
            const rootBlock = `:root {
  /* 主主题色（从 config.json 的 color 字段读取） */
  --primary-theme-color: ${finalColor};
  
  /* 文本颜色（根据主题色自动计算） */
  --text-color: ${textColor};
  
  /* 主题色透明度变体 */
  --primary-background-alpha-10: ${rgba10};
  --primary-background-alpha-30: ${rgba30};
  --primary-background-alpha-50: ${rgba50};
  --primary-background-alpha-70: ${rgba70};
}

`;
            cssContent = rootBlock + cssContent;
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS主题色变量已添加: ${cssPath}`);
            console.log(`  主色: --primary-theme-color: ${finalColor}`);
            console.log(`  文本色: --text-color: ${textColor}`);
        }
    } catch (error) {
        console.error('更新CSS主题色变量失败:', error.message);
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
                
                // 1. 更新 title 标签中的域名
                // 匹配 <title>域名</title> 或 <title>域名 - 其他文本</title>
                const titleRegex = /(<title>)([^<]*?)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})([^<]*?)(<\/title>)/gi;
                htmlContent = htmlContent.replace(titleRegex, (match, openTag, prefix, oldDomain, suffix, closeTag) => {
                    modified = true;
                    return openTag + prefix + cleanDomain + suffix + closeTag;
                });
                
                // 2. 更新顶部 logo 中的域名
                // 匹配 <div class="logo"><p>域名</p></div> 或 <div class="logo logo-center"><p>域名</p></div>
                const logoRegex = /(<div\s+class=["']logo(?:\s+logo-center)?["']>\s*<p>)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, oldDomain, closeTag) => {
                    modified = true;
                    return openTag + cleanDomain + closeTag;
                });
                
                // 只更新包含footer的文件
                if (htmlContent.includes('footer-copyright') || htmlContent.includes('footer')) {
                    // 3. 更新 .footer-brand 标签内的域名
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
                    
                    // 4. 更新版权文本中的域名
                    // 匹配 "© 2025 域名. All Rights Reserved." 格式
                    const copyrightRegex1 = /(©\s+\d{4}\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+Rights?\s+Reserved\.)/gi;
                    htmlContent = htmlContent.replace(copyrightRegex1, (match, prefix, oldDomain, suffix) => {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                    
                    // 5. 匹配 "Copyright © 2021-2025 域名. All rights Reserved." 格式
                    const copyrightRegex2 = /(Copyright\s+©\s+\d{4}-\d{4}\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+rights?\s+Reserved\.)/gi;
                    htmlContent = htmlContent.replace(copyrightRegex2, (match, prefix, oldDomain, suffix) => {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                    
                    // 6. 匹配其他可能的版权格式（更通用的匹配）
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
        
        // 2. 更新CSS主题色变量
        updateCSSColor(config.color, config.color1, config.color2);
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

