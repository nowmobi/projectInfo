const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const archiver = require('archiver');

// 需要打包的文件和文件夹
const filesToPack = [
    'pages',
    'public',
    'index.html',
    'detail.html',
    'robots.txt',
    'homegg_ads.js',
    'detailgg_ads.js',
    'detailgg.js',
    'homegg.js'
];

// 临时目录用于存放混淆后的文件
const tempDir = path.join(__dirname, '.temp_obfuscated');

// 读取配置文件获取域名
function getDomain() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('config.json 文件不存在');
        }
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (!config.domain) {
            throw new Error('配置文件中缺少 domain 字段');
        }
        
        return config.domain;
    } catch (error) {
        console.error('读取域名失败:', error.message);
        throw error;
    }
}

// 生成基于域名的压缩包文件名
function getOutputZipPath() {
    const domain = getDomain();
    // 清理域名，移除不合法字符（保留字母、数字、点和连字符）
    const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // 扫描当前目录，查找已存在的同名压缩文件
    const files = fs.readdirSync(__dirname);
    const baseFileName = `z_${safeDomain}.zip`;
    
    // 转义域名中的特殊字符，用于正则表达式
    const escapedDomain = safeDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 检查是否存在基础文件（域名.zip）
    const baseFileExists = files.includes(baseFileName);
    
    // 查找所有编号文件（域名_数字.zip）
    const numberedFileRegex = new RegExp(`^${escapedDomain}_(\\d+)\\.zip$`);
    const numberedFiles = files.filter(file => numberedFileRegex.test(file));
    
    // 如果基础文件不存在，优先使用基础文件名（第一次打包）
    if (!baseFileExists) {
        return path.join(__dirname, baseFileName);
    }
    
    // 基础文件存在，需要生成编号文件
    // 提取所有编号并找到最大值
    const numbers = numberedFiles
        .map(file => {
            const match = file.match(numberedFileRegex);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);
    
    // 计算下一个编号
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    
    return path.join(__dirname, `z_${safeDomain}_${nextNumber}.zip`);
}

// 递归删除目录（兼容旧版本 Node.js）
function removeDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return;
    }
    
    try {
        // 优先使用新版本的 rmSync
        if (fs.rmSync) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            return;
        }
    } catch (e) {
        // 如果失败，使用旧方法
    }
    
    // 兼容旧版本：使用递归删除
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const curPath = path.join(dirPath, file);
        const stat = fs.statSync(curPath);
        if (stat.isDirectory()) {
            removeDir(curPath);
        } else {
            fs.unlinkSync(curPath);
        }
    }
    fs.rmdirSync(dirPath);
}

// 清理临时目录（只清理，不重新创建）
function cleanTempDir() {
    if (fs.existsSync(tempDir)) {
        removeDir(tempDir);
    }
}

// 初始化临时目录（清理并重新创建）
function initTempDir() {
    if (fs.existsSync(tempDir)) {
        removeDir(tempDir);
    }
    fs.mkdirSync(tempDir, { recursive: true });
}

// 混淆 JS 文件
function obfuscateJS(filePath, outputPath) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            debugProtectionInterval: 0,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChunkCallsTransform: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: 'function',
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false
        });

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, obfuscationResult.getObfuscatedCode(), 'utf8');
        return true;
    } catch (error) {
        console.error(`  混淆失败: ${filePath}`, error.message);
        return false;
    }
}

// 递归处理目录，混淆所有 JS 文件
function processDirectory(srcDir, destDir, basePath = '') {
    if (!fs.existsSync(srcDir)) {
        console.log(`  跳过不存在的目录: ${srcDir}`);
        return;
    }

    const items = fs.readdirSync(srcDir);
    
    for (const item of items) {
        const srcPath = path.join(srcDir, item);
        const relativePath = path.join(basePath, item);
        const destPath = path.join(destDir, relativePath);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            // 递归处理子目录
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            processDirectory(srcPath, destDir, relativePath);
        } else if (stat.isFile()) {
            // 处理文件
            if (item.endsWith('.js')) {
                // JS 文件需要混淆
                console.log(`  混淆 JS: ${relativePath}`);
                obfuscateJS(srcPath, destPath);
            } else {
                // 其他文件直接复制
                const destFileDir = path.dirname(destPath);
                if (!fs.existsSync(destFileDir)) {
                    fs.mkdirSync(destFileDir, { recursive: true });
                }
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

// 处理单个文件或目录
function processFile(itemPath, baseDir) {
    if (!fs.existsSync(itemPath)) {
        console.log(`  跳过不存在的项: ${itemPath}`);
        return;
    }

    const relativePath = path.relative(baseDir, itemPath);
    const destPath = path.join(tempDir, relativePath);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
        // 处理目录，保留目录结构
        processDirectory(itemPath, tempDir, relativePath);
    } else if (stat.isFile()) {
        // 确保目标目录存在
        const destFileDir = path.dirname(destPath);
        if (!fs.existsSync(destFileDir)) {
            fs.mkdirSync(destFileDir, { recursive: true });
        }

        if (itemPath.endsWith('.js')) {
            // JS 文件需要混淆
            console.log(`  混淆 JS: ${relativePath}`);
            obfuscateJS(itemPath, destPath);
        } else {
            // 其他文件直接复制
            fs.copyFileSync(itemPath, destPath);
        }
    }
}

// 打包为 ZIP 文件
function createZip() {
    return new Promise((resolve, reject) => {
        const outputZipPath = getOutputZipPath();
        
        console.log('\n开始打包压缩...');
        console.log(`  输出文件: ${path.basename(outputZipPath)}`);

        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // 最高压缩级别
        });

        output.on('close', () => {
            const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`✓ 打包完成: ${path.basename(outputZipPath)}`);
            console.log(`  压缩包大小: ${sizeMB} MB`);
            console.log(`  完整路径: ${outputZipPath}`);
            resolve(outputZipPath);
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // 添加临时目录中的所有文件到压缩包
        archive.directory(tempDir, false);

        archive.finalize();
    });
}

// 主函数
async function main() {
    console.log('开始执行打包和混淆...\n');
    
    // 读取域名信息
    try {
        const domain = getDomain();
        console.log(`当前域名: ${domain}`);
        console.log(`压缩文件将使用域名命名\n`);
    } catch (error) {
        console.error('无法读取域名:', error.message);
        process.exit(1);
    }
    
    console.log('步骤 1: 初始化临时目录');
    initTempDir();
    console.log('✓ 临时目录已初始化\n');

    console.log('步骤 2: 混淆 JS 文件并准备打包文件');
    const baseDir = __dirname;
    
    let processedCount = 0;
    for (const item of filesToPack) {
        const itemPath = path.join(baseDir, item);
        console.log(`\n处理: ${item}`);
        processFile(itemPath, baseDir);
        processedCount++;
    }

    console.log(`\n✓ 已处理 ${processedCount} 个项目\n`);

    // 步骤 3: 打包压缩
    let zipPath;
    try {
        zipPath = await createZip();
    } catch (error) {
        console.error('\n✗ 打包失败:', error.message);
        process.exit(1);
    }

    // 步骤 4: 清理临时目录（完全删除）
    console.log('\n步骤 4: 清理临时文件');
    cleanTempDir();
    console.log('✓ 临时文件已清理');

    console.log('\n✅ 所有操作完成！');
    console.log(`压缩包已保存: ${path.basename(zipPath)}`);
    console.log(`完整路径: ${zipPath}`);
    console.log(`说明: 如果同一域名打包多次，会自动递增编号（域名.zip, 域名_1.zip, 域名_2.zip...）`);
}

// 运行主函数
main().catch(error => {
    console.error('\n✗ 执行失败:', error.message);
    process.exit(1);
});

