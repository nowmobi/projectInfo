const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const XLSX = require('xlsx');

// 配置文件路径
const configPath = path.join(__dirname, 'config.json');
const excelPath = path.join(__dirname, 'web.xlsx');

// 读取 Excel 文件
function readExcelFile() {
    try {
        if (!fs.existsSync(excelPath)) {
            throw new Error(`Excel 文件不存在: ${excelPath}`);
        }

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 将工作表转换为 JSON 数组
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`✓ 成功读取 Excel 文件: ${excelPath}`);
        console.log(`  工作表: ${sheetName}`);
        console.log(`  共 ${data.length} 条记录\n`);
        
        return data;
    } catch (error) {
        console.error('读取 Excel 文件失败:', error.message);
        throw error;
    }
}

// 更新 config.json
function updateConfig(domain, color, color1, color2) {
    try {
        // 确定使用的颜色值
        // 优先使用 color，如果 color 为空或无效，则使用 color1
        let finalColor = color;
        
        if (!finalColor || finalColor.trim() === '') {
            if (color1 && color1.trim() !== '') {
                finalColor = color1.trim();
            } else if (color2 && color2.trim() !== '') {
                finalColor = color2.trim();
            } else {
                throw new Error(`域名 ${domain} 没有有效的颜色值`);
            }
        } else {
            finalColor = finalColor.trim();
        }
        
        // 处理 color1 和 color2
        // 如果 color1 为空，使用 finalColor
        let finalColor1 = (color1 && color1.trim() !== '') ? color1.trim() : finalColor;
        // 如果 color2 为空，使用 finalColor1
        let finalColor2 = (color2 && color2.trim() !== '') ? color2.trim() : finalColor1;
        
        // 验证颜色格式（简单的十六进制颜色验证）
        const colorValues = [finalColor, finalColor1, finalColor2];
        colorValues.forEach(colorValue => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                console.warn(`警告: 颜色值 "${colorValue}" 可能不是有效的十六进制颜色格式`);
            }
        });
        
        const config = {
            color: finalColor,
            color1: finalColor1,
            color2: finalColor2,
            domain: domain.trim()
        };
        
        // 写入配置文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        
        console.log(`✓ 配置文件已更新:`);
        console.log(`  域名: ${config.domain}`);
        console.log(`  color: ${config.color}`);
        console.log(`  color1: ${config.color1}`);
        console.log(`  color2: ${config.color2}`);
        
        return config;
    } catch (error) {
        console.error('更新配置文件失败:', error.message);
        throw error;
    }
}

// 清空所有压缩包
function clearAllZipFiles() {
    try {
        console.log('='.repeat(60));
        console.log('清空所有压缩包');
        console.log('='.repeat(60));
        console.log('');
        console.log('正在查找压缩包文件...');
        
        const files = fs.readdirSync(__dirname);
        const zipFiles = files.filter(file => {
            // 匹配 z_*.zip 格式的压缩包文件
            return file.startsWith('z_') && file.endsWith('.zip') && fs.statSync(path.join(__dirname, file)).isFile();
        });
        
        if (zipFiles.length === 0) {
            console.log('✓ 没有找到压缩包文件');
            console.log('='.repeat(60));
            return 0;
        }
        
        console.log(`找到 ${zipFiles.length} 个压缩包文件:\n`);
        
        let deletedCount = 0;
        zipFiles.forEach(file => {
            try {
                const filePath = path.join(__dirname, file);
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`  ✓ 删除: ${file}`);
            } catch (error) {
                console.error(`  ✗ 删除失败: ${file} - ${error.message}`);
            }
        });
        
        console.log('');
        console.log('='.repeat(60));
        console.log(`✓ 清空完成！共删除 ${deletedCount} 个压缩包文件`);
        console.log('='.repeat(60));
        return deletedCount;
    } catch (error) {
        console.error('清空压缩包失败:', error.message);
        throw error;
    }
}

// 执行命令
function executeCommand(command, description) {
    try {
        console.log(`\n执行: ${description}`);
        console.log(`命令: ${command}`);
        
        execSync(command, {
            cwd: __dirname,
            stdio: 'inherit',
            encoding: 'utf8'
        });
        
        console.log(`✓ ${description} 完成`);
        return true;
    } catch (error) {
        console.error(`✗ ${description} 失败:`, error.message);
        throw error;
    }
}

// 主函数
async function main() {
    // 检查命令行参数
    const args = process.argv.slice(2);
    
    // 如果传入 --clear 参数，只执行清空操作
    if (args.includes('--clear')) {
        try {
            clearAllZipFiles();
            process.exit(0);
        } catch (error) {
            console.error('\n✗ 清空压缩包失败:', error.message);
            process.exit(1);
        }
    }
    
    // 正常批量处理流程
    console.log('='.repeat(60));
    console.log('开始批量处理域名和生成压缩包');
    console.log('='.repeat(60));
    console.log('');
    
    try {
        // 1. 读取 Excel 文件
        const rows = readExcelFile();
        
        if (rows.length === 0) {
            console.log('Excel 文件中没有数据');
            return;
        }
        
        // 2. 验证 Excel 文件结构
        const requiredFields = ['domain'];
        const firstRow = rows[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
            throw new Error(`Excel 文件缺少必需的列: ${missingFields.join(', ')}`);
        }
        
        console.log('开始处理每个域名...\n');
        console.log('='.repeat(60));
        
        // 3. 遍历每一行，处理每个域名
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const domain = row.domain;
            
            if (!domain || domain.trim() === '') {
                console.log(`\n跳过第 ${i + 1} 行: 域名为空`);
                continue;
            }
            
            console.log(`\n${'='.repeat(60)}`);
            console.log(`处理第 ${i + 1}/${rows.length} 个域名: ${domain}`);
            console.log(`${'='.repeat(60)}`);
            
            try {
                // 获取颜色值
                const color = row.color || '';
                const color1 = row.color1 || '';
                const color2 = row.color2 || '';
                
                console.log(`颜色配置:`);
                console.log(`  color: ${color || '(空)'}`);
                console.log(`  color1: ${color1 || '(空)'}`);
                console.log(`  color2: ${color2 || '(空)'}`);
                
                // 3.1 更新 config.json
                updateConfig(domain, color, color1, color2);
                
                // 3.2 执行 node_templete.js
                executeCommand('node node_templete.js', '生成模板和更新文件');
                
                // 3.3 执行 node_compress.js
                executeCommand('node node_compress.js', '打包压缩');
                
                successCount++;
                console.log(`\n✓ 域名 ${domain} 处理完成！`);
                
            } catch (error) {
                failCount++;
                console.error(`\n✗ 域名 ${domain} 处理失败:`, error.message);
                console.error('继续处理下一个域名...\n');
            }
        }
        
        // 4. 输出总结
        console.log('\n' + '='.repeat(60));
        console.log('批量处理完成！');
        console.log('='.repeat(60));
        console.log(`总计: ${rows.length} 个域名`);
        console.log(`成功: ${successCount} 个`);
        console.log(`失败: ${failCount} 个`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n✗ 批量处理失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main().catch(error => {
    console.error('\n✗ 执行失败:', error.message);
    process.exit(1);
});

