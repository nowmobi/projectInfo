// 主题颜色测试和应用脚本
// 用于测试图片压缩和主题色应用功能

console.log("🎨 主题颜色系统已加载");

// 测试主题色应用函数
function testThemeApplication() {
  console.log("🧪 开始测试主题色应用...");

  if (typeof ThemeApplier !== "undefined") {
    const applier = new ThemeApplier();
    applier.applyThemeColor();
    console.log("✅ 主题色应用测试完成");
  } else {
    console.warn("⚠️ ThemeApplier 类未找到");
  }
}

// 如果在浏览器环境中，且DOM已加载完成
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", testThemeApplication);
  } else {
    testThemeApplication();
  }
}

// 导出测试函数（如果在Node.js环境中）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testThemeApplication };
}
