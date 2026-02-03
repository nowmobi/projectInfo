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

// 计算对比色（根据背景色亮度返回黑色或白色）
function calculateContrastColor(hexColor) {
    // 移除可能的 # 前缀
    const color = hexColor.replace('#', '');
    
    // 解析RGB值
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // 计算亮度（使用标准亮度公式）
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 如果亮度大于128，背景较亮，返回黑色；否则返回白色
    return brightness > 128 ? '#000000' : '#ffffff';
}

// 更新CSS中的 --color-primary 变量值
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 计算对比色
        const contrastColor = calculateContrastColor(color);
        
        // 使用正则表达式替换 --color-primary 的值
        const colorPrimaryRegex = /(--color-primary:\s*)([^;]+)/;
        const newColorPrimaryValue = `$1${color}`;
        
        // 使用正则表达式替换 --text-logo 的值
        const textLogoRegex = /(--text-logo:\s*)([^;]+)/;
        const newTextLogoValue = `$1${contrastColor}`;
        
        if (colorPrimaryRegex.test(cssContent)) {
            cssContent = cssContent.replace(colorPrimaryRegex, newColorPrimaryValue);
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --color-primary 已更新: ${cssPath}`);
            console.log(`  新值: --color-primary: ${color}`);
        } else {
            // 如果没有找到 --color-primary，在:root中添加
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --color-primary: ${color};`
                );
            } else {
                cssContent = `:root {\n  --color-primary: ${color};\n}\n\n${cssContent}`;
            }
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --color-primary 已添加: ${cssPath}`);
            console.log(`  新值: --color-primary: ${color}`);
        }
        
        // 更新 --text-logo
        if (textLogoRegex.test(cssContent)) {
            cssContent = fs.readFileSync(cssPath, 'utf8');
            cssContent = cssContent.replace(textLogoRegex, newTextLogoValue);
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --text-logo 已更新: ${cssPath}`);
            console.log(`  新值: --text-logo: ${contrastColor}`);
        } else {
            // 如果没有找到 --text-logo，在:root中添加
            cssContent = fs.readFileSync(cssPath, 'utf8');
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --text-logo: ${contrastColor};`
                );
            } else {
                cssContent = `:root {\n  --text-logo: ${contrastColor};\n}\n\n${cssContent}`;
            }
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --text-logo 已添加: ${cssPath}`);
            console.log(`  新值: --text-logo: ${contrastColor}`);
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
            path.join(__dirname, 'de.html'),
            path.join(__dirname, 'pages', 'ab.html'),
            path.join(__dirname, 'pages', 'pr.html'),
            path.join(__dirname, 'pages', 'ca.html')
        ];
        
        // 清理域名，移除协议和路径
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        
        let updatedCount = 0;
        
        htmlFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                let htmlContent = fs.readFileSync(filePath, 'utf8');
                let modified = false;
                
                // 1. 更新 title 标签中的域名
                // 匹配 <title>域名</title> 或 <title> 域名</title> 格式
                const titleRegex = /(<title>)(\s*)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*)(<\/title>)/gi;
                htmlContent = htmlContent.replace(titleRegex, (match, openTag, spaceBefore, oldDomain, spaceAfter, closeTag) => {
                    modified = true;
                    return openTag + spaceBefore + cleanDomain + spaceAfter + closeTag;
                });

                // 2. 更新 header logo 中的域名
                // 匹配 <div class="logo..."><p>域名</p></div> 或 <div class="logo..."><p> 域名</p></div> 格式
                const logoRegex = /(<div\s+class=["']logo[^"']*["']>\s*<p>)(\s*)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*)(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, spaceBefore, oldDomain, spaceAfter, closeTag) => {
                    modified = true;
                    return openTag + spaceBefore + cleanDomain + spaceAfter + closeTag;
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

