const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

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

// 生成新的logo图
async function generateLogo(color, domain) {
    try {
        // 确保public目录存在
        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        
        const canvas = createCanvas(400, 100);
        const ctx = canvas.getContext('2d');
        
        // 清除画布
        ctx.clearRect(0, 0, 400, 100);
        
        // 绘制背景（使用主题色，无圆角）
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 400, 100);
        
        // 设置文字样式
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制域名文字（只显示主域名部分，去掉协议和路径）
        const displayDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        
        // 根据域名长度调整字体大小 - 增大字体让域名更醒目
        let fontSize;
        if (displayDomain.length <= 8) {
            // 短域名使用更大字体
            fontSize = 64;
        } else if (displayDomain.length <= 12) {
            fontSize = 56;
        } else if (displayDomain.length <= 16) {
            fontSize = 48;
        } else if (displayDomain.length <= 20) {
            fontSize = 42;
        } else if (displayDomain.length <= 25) {
            fontSize = 36;
        } else {
            fontSize = 32;
        }
        
        ctx.font = `bold ${fontSize}px Arial`;
        
        // 如果域名很长，可能需要换行显示
        if (displayDomain.length > 25) {
            const parts = displayDomain.split('.');
            if (parts.length >= 2) {
                const mainPart = parts.slice(0, -1).join('.');
                const tld = '.' + parts[parts.length - 1];
                ctx.fillText(mainPart, 200, 40);
                ctx.font = 'bold 32px Arial';
                ctx.fillText(tld, 200, 65);
            } else {
                ctx.fillText(displayDomain.substring(0, 25), 200, 50);
            }
        } else {
            ctx.fillText(displayDomain, 200, 50);
        }
        
        // 保存logo
        const logoPath = path.join(publicDir, 'logo.png');
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(logoPath, buffer);
        
        console.log(`✓ Logo已生成: ${logoPath}`);
        console.log(`  颜色: ${color}`);
        console.log(`  域名: ${domain}`);
        
    } catch (error) {
        console.error('生成logo失败:', error.message);
        // 如果canvas有问题，提供替代方案提示
        if (error.message.includes('canvas') || error.message.includes('native')) {
            console.error('提示: 如果遇到canvas依赖问题，请尝试运行: npm rebuild canvas');
        }
        throw error;
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
        const colorPrimaryRegex = /(--color-primary:\s*)([^;]+)/;
        const newColorPrimaryValue = `$1${color}`;
        
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
                
                // 1. 更新 <title> 标签中的域名
                // 匹配 <title>域名</title> 或 <title>其他文本 域名</title>
                const titleRegex = /(<title>)([^<]*?)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})([^<]*?)(<\/title>)/gi;
                htmlContent = htmlContent.replace(titleRegex, (match, openTag, prefix, oldDomain, suffix, closeTag) => {
                    modified = true;
                    return openTag + prefix + cleanDomain + suffix + closeTag;
                });
                
                // 2. 更新顶部logo部分的域名
                // 使用[\s\S]*?来匹配包括换行符在内的任意字符
                const logoRegex = /(<div\s+class=["']logo(?:\s+logo-center)?["']>[\s\S]*?<p>)([^<]+)(<\/p>[\s\S]*?<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, oldDomain, closeTag) => {
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
                    // 匹配 "© 2026 域名. All Rights Reserved." 格式
                    const copyrightRegex1 = /(©\s+\d{4}\s+)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(\s*\.\s*All\s+Rights?\s+Reserved\.)/gi;
                    htmlContent = htmlContent.replace(copyrightRegex1, (match, prefix, oldDomain, suffix) => {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    });
                    
                    // 匹配 "Copyright © 2021-2026 域名. All rights Reserved." 格式
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
        
        // 2. 生成新logo
        await generateLogo(config.color, config.domain);
        console.log('');
        
        // 3. 更新CSS变量 --color-primary
        updateCSSColor(config.color);
        console.log('');
        
        // 4. 更新HTML域名
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

