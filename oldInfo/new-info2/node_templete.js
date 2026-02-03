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

// 更新CSS中的 --primary-color 变量值
function updateCSSColor(color) {
    try {
        const cssPath = path.join(__dirname, 'public', 'style', 'inpublic.css');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        const regex = /(--primary-color:\s*)([^;]+)/;
        if (regex.test(cssContent)) {
            cssContent = cssContent.replace(regex, `$1${color}`);
        } else {
            cssContent = cssContent.includes(':root') 
                ? cssContent.replace(/(:root\s*\{[^}]*)/, `$1\n  --primary-color: ${color};`)
                : `:root {\n  --primary-color: ${color};\n}\n\n${cssContent}`;
        }
        fs.writeFileSync(cssPath, cssContent, 'utf8');
        console.log(`✓ CSS变量 --primary-color 已更新: ${color}`);
    } catch (error) {
        console.error('更新CSS变量 --primary-color 失败:', error.message);
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
            path.join(__dirname, 'pages', 'category.html')
        ];
        
        const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
        const domainPattern = /[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/;
        
        let updatedCount = 0;
        
        htmlFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                let htmlContent = fs.readFileSync(filePath, 'utf8');
                let modified = false;
                const originalContent = htmlContent;
                
                // 替换 footer-copyright 标签内的域名
                const footerRegex = /(<div\s+class=["']footer-copyright["']>)([^<]+)(<\/div>)/gi;
                htmlContent = htmlContent.replace(footerRegex, (match, openTag, content, closeTag) => {
                    const domainMatch = content.match(domainPattern);
                    if (domainMatch && domainMatch[0] !== cleanDomain) {
                        modified = true;
                        return openTag + content.replace(domainMatch[0], cleanDomain) + closeTag;
                    }
                    return match;
                });
                
                // 替换版权文本中的域名
                const copyrightRegex = /((?:Copyright\s+)?©\s+\d{4}(?:-\d{4})?\s+)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,})(\s*\.?\s*All\s+rights?\s+reserved\.?)/gi;
                htmlContent = htmlContent.replace(copyrightRegex, (match, prefix, oldDomain, suffix) => {
                    if (oldDomain !== cleanDomain) {
                        modified = true;
                        return prefix + cleanDomain + suffix;
                    }
                    return match;
                });
                
                if (modified && htmlContent !== originalContent) {
                    fs.writeFileSync(filePath, htmlContent, 'utf8');
                    updatedCount++;
                    console.log(`✓ ${path.basename(filePath)}`);
                }
            } else {
                console.log(`○ 文件不存在: ${path.relative(__dirname, filePath)}`);
            }
        });
        
        console.log(`✓ 更新了 ${updatedCount} 个HTML文件`);
        
    } catch (error) {
        console.error('更新HTML域名失败:', error.message);
        throw error;
    }
}

async function main() {
    console.log('开始执行主题配置更新...\n');
    try {
        const config = readConfig();
        console.log(`颜色: ${config.color} | 域名: ${config.domain}\n`);
        
        updateCSSColor(config.color);
        updateDomainInHTML(config.domain);
        
        console.log('\n✓ 所有更新完成！');
    } catch (error) {
        console.error('\n✗ 执行失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();
