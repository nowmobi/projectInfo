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

// 辅助函数：绘制圆角矩形（用于填充）
function roundRectFill(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// 更新CSS中的 --color-primary 变量值
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 使用正则表达式替换 --color-primary 的值
        // 匹配格式: --color-primary: 值; (支持空格、换行等)
        const colorPrimaryRegex = /(--color-primary\s*:\s*)([^;]+)(\s*;)/;
        
        if (colorPrimaryRegex.test(cssContent)) {
            // 替换现有的 --color-primary 值
            cssContent = cssContent.replace(colorPrimaryRegex, `$1${color}$3`);
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --color-primary 已更新: ${cssPath}`);
            console.log(`  新值: --color-primary: ${color};`);
        } else {
            // 如果没有找到 --color-primary，在:root中添加
            if (cssContent.includes(':root')) {
                // 在 :root { 后添加变量（保留注释和格式）
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*?)(\n\s*)(\})/,
                    `$1$2  --color-primary: ${color};$2$3`
                );
                // 如果上面的替换失败，尝试在 :root { 后直接添加
                if (!cssContent.includes('--color-primary')) {
                    cssContent = cssContent.replace(
                        /(:root\s*\{)/,
                        `$1\n  --color-primary: ${color};`
                    );
                }
            } else {
                // 如果连 :root 都没有，在文件开头添加
                cssContent = `:root {\n  --color-primary: ${color};\n}\n\n${cssContent}`;
            }
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`✓ CSS变量 --color-primary 已添加: ${cssPath}`);
            console.log(`  新值: --color-primary: ${color};`);
        }
    } catch (error) {
        console.error('更新CSS变量 --color-primary 失败:', error.message);
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

                let foundOldDomain = null;
                
                // 更新 footer-copyright 中的域名
                // 首先尝试匹配标准格式: Copyright © 2026 域名. All rights reserved.
                // 支持换行和空格
                const copyrightRegex = /(Copyright\s+©\s+\d{4}(?:-\d{4})?\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+rights?\s+reserved\.)/gis;
                htmlContent = htmlContent.replace(copyrightRegex, (match, prefix, oldDomain, suffix) => {
                    if (!foundOldDomain) foundOldDomain = oldDomain;
                    modified = true;
                    return prefix + cleanDomain + suffix;
                });
                
                // 如果上面的匹配失败，尝试匹配颜色代码格式: Copyright © 2026 #ba7ac7. All rights reserved.
                // 支持换行和空格
                if (!modified) {
                    const colorCodeRegex = /(Copyright\s+©\s+\d{4}(?:-\d{4})?\s+)(#[a-fA-F0-9]{6})(\s*\.\s*All\s+rights?\s+reserved\.)/gis;
                    htmlContent = htmlContent.replace(colorCodeRegex, (match, prefix, oldColorCode, suffix) => {
                        if (!foundOldDomain) foundOldDomain = oldColorCode;
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                }
                
                // 如果上面的匹配都失败，尝试更通用的匹配（匹配footer-copyright标签内的任何内容）
                // 支持换行和空格，匹配域名或颜色代码
                if (!modified) {
                    const footerCopyrightRegex = /(<div\s+class=["']footer-copyright["'][^>]*>)([\s\S]*?Copyright\s+©\s+\d{4}(?:-\d{4})?\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}|#[a-fA-F0-9]{6})([\s\S]*?All\s+rights?\s+reserved\.[\s\S]*?)(<\/div>)/gi;
                    htmlContent = htmlContent.replace(footerCopyrightRegex, (match, openTag, before, oldValue, after, closeTag) => {
                        if (!foundOldDomain) foundOldDomain = oldValue;
                        modified = true;
                        return openTag + before + cleanDomain + after + closeTag;
                    });
                }
                
                // 如果还是没匹配到，尝试匹配footer-copyright标签内的任何非空内容
                // 支持换行和空格
                if (!modified) {
                    const genericFooterRegex = /(<div\s+class=["']footer-copyright["'][^>]*>)([\s\S]*?Copyright\s+©\s+\d{4}(?:-\d{4})?\s+)([^\s\.<]+)([\s\S]*?\.\s*All\s+rights?\s+reserved\.[\s\S]*?)(<\/div>)/gi;
                    htmlContent = htmlContent.replace(genericFooterRegex, (match, openTag, before, oldValue, after, closeTag) => {
                        // 只替换看起来像域名或颜色代码的内容
                        if (oldValue.match(/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/) || oldValue.match(/^#[a-fA-F0-9]{6}$/)) {
                            if (!foundOldDomain) foundOldDomain = oldValue;
                            modified = true;
                            return openTag + before + cleanDomain + after + closeTag;
                        }
                        return match;
                    });
                }
                
                // 更新首页顶部logo中的域名
                const logoRegex = /(<div\s+class=["']logo["'][^>]*>)([\s\S]*?<p>)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(<\/p>[\s\S]*?<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openDiv, beforeP, oldDomain, afterP) => {
                    if (!foundOldDomain) foundOldDomain = oldDomain;
                    modified = true;
                    return openDiv + beforeP + cleanDomain + afterP;
                });
                
                // 更新 .footer-brand 标签内的域名（如果存在）
                const brandRegex = /(<div\s+class=["']footer-brand["'][^>]*>)([^<]*?)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}|#[a-fA-F0-9]{6})([^<]*?)(<\/div>)/gi;
                htmlContent = htmlContent.replace(brandRegex, (match, openTag, before, oldDomain, after, closeTag) => {
                    if (!foundOldDomain) foundOldDomain = oldDomain;
                    modified = true;
                    return openTag + before + cleanDomain + after + closeTag;
                });
                
                if (modified) {
                    fs.writeFileSync(filePath, htmlContent, 'utf8');
                    updatedCount++;
                    console.log(`✓ 已更新: ${path.relative(__dirname, filePath)}`);
                    if (foundOldDomain) {
                        console.log(`  域名: ${foundOldDomain} → ${cleanDomain}`);
                    }
                } else {
                    console.log(`○ 未找到域名（已是最新）: ${path.relative(__dirname, filePath)}`);
                }
            } else {
                console.log(`○ 文件不存在: ${path.relative(__dirname, filePath)}`);
            }
        });
        
        console.log(`\n✓ 共更新 ${updatedCount} 个HTML文件中的域名`);
        
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

