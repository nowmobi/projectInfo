const fs = require('fs');
const path = require('path');

// 读取配置文件
function readConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);

        const color1 = config.color1 || config.color;
        const color2 = config.color2 || color1;

        if (!color1 || !config.domain) {
            throw new Error('配置文件中缺少 color1 或 domain 字段');
        }

        return { ...config, color1, color2 };
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

// 更新CSS中的主题色变量（只更新color1和color2）
function updateCSSColors(color1, color2) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');

        // 确保存在 :root 代码块
        if (!/:root\s*\{/.test(cssContent)) {
            cssContent = `:root {\n}\n\n${cssContent}`;
        }

        const setCSSVar = (name, value) => {
            const varRegex = new RegExp(`(--${name}\\s*:\\s*)([^;]+)(;)`);
            if (varRegex.test(cssContent)) {
                cssContent = cssContent.replace(varRegex, `$1${value}$3`);
            } else {
                cssContent = cssContent.replace(/(:root\s*\{)/, `$1\n  --${name}: ${value};`);
            }
        };

        // 只更新color1和color2，不更新透明度变量
        setCSSVar('color1', color1);
        setCSSVar('color2', color2 || color1);

        fs.writeFileSync(cssPath, cssContent, 'utf8');
        console.log(`✓ CSS颜色已更新: ${cssPath}`);
        console.log(`  color1: ${color1}`);
        console.log(`  color2: ${color2 || color1}`);
    } catch (error) {
        console.error('更新CSS颜色变量失败:', error.message);
        throw error;
    }
}

// 更新 theme-variables.css 文件
function updateThemeVariables(primaryColor) {
    try {
        const themeVarsPath = path.join(__dirname, 'theme-variables.css');
        
        // 将十六进制颜色转换为 RGB
        const rgb = hexToRgb(primaryColor);
        let rgba10 = 'rgba(176, 231, 164, 0.1)';
        let rgba30 = 'rgba(176, 231, 164, 0.3)';
        
        if (rgb) {
            rgba10 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
            rgba30 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
        }
        
        const themeVarsContent = `:root {
  --primary-theme-color: ${primaryColor};
  --primary-background-alpha-10: ${rgba10};
  --primary-background-alpha-30: ${rgba30};
}
`;
        
        fs.writeFileSync(themeVarsPath, themeVarsContent, 'utf8');
        console.log(`✓ theme-variables.css 已更新: ${themeVarsPath}`);
        console.log(`  主题色: ${primaryColor}`);
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

// 选择主色（优先 color2，其次 color1）
function getPrimaryColor(config) {
    return config.color2 || config.color1 || config.color;
}

// 更新所有HTML文件中的域名
function updateDomainInHTML(domain) {
    try {
        // 查找所有HTML文件
        const htmlFiles = [
            path.join(__dirname, 'index.html'),
            path.join(__dirname, 'dd.html'),
            path.join(__dirname, 'pages', 'about.html'),
            path.join(__dirname, 'pages', 'privacy.html'),
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
                const titleRegex = /(<title>)([^<]*)(<\/title>)/gi;
                htmlContent = htmlContent.replace(titleRegex, (match, openTag, titleContent, closeTag) => {
                    // 查找title中的域名
                    const domainMatch = titleContent.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + titleContent.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });
                
                // 2. 更新header中logo的域名
                const logoRegex = /(<div\s+class=["']logo[^"']*["']>\s*<p>)([^<]+)(<\/p>\s*<\/div>)/gi;
                htmlContent = htmlContent.replace(logoRegex, (match, openTag, oldDomain, closeTag) => {
                    const domainMatch = oldDomain.match(/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/);
                    if (domainMatch) {
                        modified = true;
                        return openTag + oldDomain.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });
                
                // 3. 更新footer中的域名（只更新包含footer的文件）
                if (htmlContent.includes('footer-copyright') || htmlContent.includes('footer')) {
                    // 更新 .footer-title 标签内的域名
                    // 匹配 <h3 class="footer-title">域名</h3>
                    const footerTitleRegex = /(<h3\s+class=["']footer-title["']>)([^<]+)(<\/h3>)/gi;
                    htmlContent = htmlContent.replace(footerTitleRegex, (match, openTag, oldDomain, closeTag) => {
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
        console.log(`  color1: ${config.color1}`);
        console.log(`  color2: ${config.color2}`);
        console.log(`  域名: ${config.domain}\n`);
        
        // 2. 更新CSS变量（color1和color2）
        updateCSSColors(config.color1, config.color2);
        console.log('');
        
        // 3. 更新HTML文件中的域名（包括title和footer）
        updateDomainInHTML(config.domain);
        console.log('');
        
        console.log('✓ 更新完成！');
        
    } catch (error) {
        console.error('\n✗ 执行失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();

