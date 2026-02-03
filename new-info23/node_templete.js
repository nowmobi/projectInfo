const fs = require('fs');
const path = require('path');

// 读取配置文件
function readConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (!config.color1 || !config.domain) {
            throw new Error('配置文件中缺少 color1 或 domain 字段');
        }
        
        return config;
    } catch (error) {
        console.error('读取配置文件失败:', error.message);
        process.exit(1);
    }
}

// 更新CSS中的 --color1 和 --color2 变量值
function updateCSSColor(color1, color2) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 使用正则表达式替换 --color1 的值
        const color1Regex = /(--color1:\s*)([^;]+)/;
        const newColor1Value = `$1${color1}`;
        
        if (color1Regex.test(cssContent)) {
            cssContent = cssContent.replace(color1Regex, newColor1Value);
            console.log(`✓ CSS变量 --color1 已更新: ${cssPath}`);
            console.log(`  新值: --color1: ${color1}`);
        } else {
            // 如果没有找到 --color1，在:root中添加
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --color1: ${color1};`
                );
            } else {
                cssContent = `:root {\n  --color1: ${color1};\n}\n\n${cssContent}`;
            }
            console.log(`✓ CSS变量 --color1 已添加: ${cssPath}`);
            console.log(`  新值: --color1: ${color1}`);
        }
        
        // 使用正则表达式替换 --color2 的值
        const color2Regex = /(--color2:\s*)([^;]+)/;
        const newColor2Value = `$1${color2}`;
        
        if (color2Regex.test(cssContent)) {
            cssContent = cssContent.replace(color2Regex, newColor2Value);
            console.log(`✓ CSS变量 --color2 已更新: ${cssPath}`);
            console.log(`  新值: --color2: ${color2}`);
        } else {
            // 如果没有找到 --color2，在:root中添加
            if (cssContent.includes(':root')) {
                cssContent = cssContent.replace(
                    /(:root\s*\{[^}]*)/,
                    `$1\n  --color2: ${color2};`
                );
            } else {
                cssContent = `:root {\n  --color2: ${color2};\n}\n\n${cssContent}`;
            }
            console.log(`✓ CSS变量 --color2 已添加: ${cssPath}`);
            console.log(`  新值: --color2: ${color2}`);
        }
        
        // 写入文件
        fs.writeFileSync(cssPath, cssContent, 'utf8');
        
    } catch (error) {
        console.error('更新CSS变量 --color1 和 --color2 失败:', error.message);
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
                
                // 只更新包含footer的文件
                if (htmlContent.includes('footer-copyright') || htmlContent.includes('footer') || htmlContent.includes('logo')) {
                    // 1. 更新顶部logo中的域名 (针对 <div class="logo"> <p>域名</p> </div> 结构)
                    const logoPRegex = /(<div\s+class=["']logo[^>]*>[\s\n]*<p>)([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})(<\/p>[\s\n]*<\/div>)/gi;
                    htmlContent = htmlContent.replace(logoPRegex, (match, openTag, oldDomain, closeTag) => {
                        modified = true;
                        return openTag + cleanDomain + closeTag;
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
        console.log('读取配置:');
        console.log(`  颜色1: ${config.color1}`);
        console.log(`  颜色2: ${config.color2 || '未设置'}`);
        console.log(`  域名: ${config.domain}\n`);
        
        // 2. 更新CSS变量 --color1 和 --color2
        if (config.color2) {
            updateCSSColor(config.color1, config.color2);
        } else {
            console.log('○ 跳过CSS颜色更新（未设置color2）');
        }
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
