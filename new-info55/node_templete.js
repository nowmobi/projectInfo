const fs = require('fs');
const path = require('path');


// 处理日期格式，将 Excel 日期转换为 YYYY-M-D 格式
function formatDate(excelDate) {
    if (!excelDate) return '';

    // 如果是字符串格式，统一使用 - 分隔符
    if (typeof excelDate === 'string') {
        return excelDate.replace(/\//g, '-');
    }

    // 如果是数字（Excel 序列号），转换为日期
    if (typeof excelDate === 'number') {
        // Excel 序列号转换公式
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${month}-${day}`;
    }

    return '';
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

// 更新 BaseURL.js 中的 categoryUrl
// 从 domain 提取第二个小数点前后的内容（如 sec.felicific.site → felicific.site）
function extractDomainParts(domain) {
    if (!domain) return '';
    
    const parts = domain.split('.');
    if (parts.length >= 3) {
        // 返回第二个小数点前后的内容（去掉第一个部分）
        return parts.slice(1).join('.');
    }
    // 如果只有两个部分，直接返回
    return domain;
}

function updateBaseURL(date, domain) {
    try {
        const baseUrlPath = path.join(__dirname, 'public', 'js', 'BaseURL.js');
        
        if (!fs.existsSync(baseUrlPath)) {
            throw new Error(`BaseURL.js 文件不存在: ${baseUrlPath}`);
        }
        
        let baseUrlContent = fs.readFileSync(baseUrlPath, 'utf8');
        
        // 更新 created_at
        const createdAtRegex = /(created_at=)([^&"']+)/;
        
        if (createdAtRegex.test(baseUrlContent)) {
            const oldDate = baseUrlContent.match(createdAtRegex)[2];
            baseUrlContent = baseUrlContent.replace(createdAtRegex, `$1${date}`);
            console.log(`  created_at: ${oldDate} → ${date}`);
        }
        
        // 更新域名（替换 baseUrl 和 categoryUrl 中的域名部分）
        if (domain) {
            const newDomainPart = extractDomainParts(domain);
            // 匹配 URL 中的域名部分（如 api.chiffonier.cloud → api.felicific.site）
            const domainRegex = /(https?:\/\/api\.)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\/)/g;
            
            if (domainRegex.test(baseUrlContent)) {
                baseUrlContent = baseUrlContent.replace(domainRegex, `$1${newDomainPart}$3`);
                console.log(`  域名: api.xxx → api.${newDomainPart}`);
            }
        }
        
        fs.writeFileSync(baseUrlPath, baseUrlContent, 'utf8');
        console.log(`✓ BaseURL.js 已更新: ${baseUrlPath}`);
        
    } catch (error) {
        console.error('更新 BaseURL.js 失败:', error.message);
        throw error;
    }
}

// 将十六进制颜色转换为RGB对象
function hexToRgb(hex) {
    // 移除可能的 # 号
    hex = hex.replace(/^#/, '');
    
    // 处理简写形式（如 #FFF）
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

// 将RGB对象转换为十六进制颜色
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// 将颜色变亮指定百分比
function lightenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    const factor = percent / 100;
    
    // 计算变亮后的RGB值
    const r = Math.round(rgb.r + (255 - rgb.r) * factor);
    const g = Math.round(rgb.g + (255 - rgb.g) * factor);
    const b = Math.round(rgb.b + (255 - rgb.b) * factor);
    
    return rgbToHex(r, g, b);
}

// 更新CSS中的 --color-primary 和 --color2 变量值
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 计算 color2：将 color-primary 变亮约 75%（基于原有颜色差值计算）
        const color2 = lightenColor(color, 75);
        
        console.log(`计算颜色:`);
        console.log(`  --color-primary: ${color}`);
        console.log(`  --color2 (自动计算): ${color2}\n`);
        
        // 更新 --color-primary
        const colorPrimaryRegex = /(--color-primary:\s*)([^;]+)/;
        if (colorPrimaryRegex.test(cssContent)) {
            cssContent = cssContent.replace(colorPrimaryRegex, `$1${color}`);
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
        }
        
        // 更新 --color2
        const color2Regex = /(--color2:\s*)([^;]+)/;
        if (color2Regex.test(cssContent)) {
            cssContent = cssContent.replace(color2Regex, `$1${color2}`);
        } else {
            // 如果没有找到 --color2，在:root中添加（在 --color-primary 之后）
            cssContent = cssContent.replace(
                /(--color-primary:\s*[^;]+;)/,
                `$1\n  --color2: ${color2};`
            );
        }
        
        fs.writeFileSync(cssPath, cssContent, 'utf8');
        console.log(`✓ CSS变量已更新: ${cssPath}`);
        console.log(`  --color-primary: ${color}`);
        console.log(`  --color2: ${color2}`);
        
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
            path.join(__dirname, 'pages', 'contact.html'),
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
                
                // 1. 更新首页顶部logo中的域名
                // 匹配 <div class="logo"><p>域名</p></div>
                const logoRegex = /(<div\s+class=["']logo["']>\s*<p>)([^<]+)(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, oldDomain, closeTag) => {
                    // 只替换域名部分
                    const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + cleanDomain + closeTag;
                    }
                    return match;
                });
                
                // 2. 更新 .footer-brand 标签内的域名
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
                
                // 3. 更新版权文本中的域名
                if (htmlContent.includes('footer-copyright') || htmlContent.includes('footer')) {
                    
                    // 3. 更新版权文本中的域名（匹配 "© 2025 域名. All Rights Reserved." 格式）
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
                    console.log(`○ 跳过（无footer）: ${path.relative(__dirname, filePath)}`);
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
        const dateString = formatDate(config.date);
        console.log('读取配置:');
        console.log(`  颜色: ${config.color}`);
        console.log(`  域名: ${config.domain}`);
        console.log(`  date: ${dateString || '(空)'}\n`);
        
        // 2. 更新CSS变量 --color-primary
        updateCSSColor(config.color);
        console.log('');
        
        // 3. 更新HTML域名
        updateDomainInHTML(config.domain);
        console.log('');

           // 5. 更新 BaseURL.js 中的 created_at 和域名
        if (dateString || config.domain) {
            updateBaseURL(dateString, config.domain);
            console.log('');
        } else {
            console.log('○ 未配置 date 和 domain，跳过更新 BaseURL.js');
            console.log('');
        }
        
        console.log('✓ 所有更新完成！');
        
    } catch (error) {
        console.error('\n✗ 执行失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();

