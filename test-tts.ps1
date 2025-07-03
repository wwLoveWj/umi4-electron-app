# Windows TTS测试脚本
# 用于测试系统内置的文本朗读功能

Write-Host "🔊 Windows TTS测试脚本" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

try {
    # 加载System.Speech程序集
    Add-Type -AssemblyName System.Speech
    
    # 创建语音合成器
    $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
    
    Write-Host "✅ 语音合成器创建成功" -ForegroundColor Green
    
    # 获取可用音色
    Write-Host "📋 可用音色列表：" -ForegroundColor Yellow
    $voices = $synthesizer.GetInstalledVoices()
    foreach ($voice in $voices) {
        $voiceInfo = $voice.VoiceInfo
        Write-Host "  - $($voiceInfo.Name) ($($voiceInfo.Culture.DisplayName))" -ForegroundColor Cyan
    }
    
    # 测试朗读
    Write-Host "`n🎤 开始测试朗读..." -ForegroundColor Yellow
    
    # 设置音色（尝试使用中文音色）
    try {
        $synthesizer.SelectVoice("Microsoft Huihui")
        Write-Host "✅ 已选择音色：Microsoft Huihui" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  无法选择Microsoft Huihui，使用默认音色" -ForegroundColor Yellow
    }
    
    # 设置语速和音量
    $synthesizer.Rate = 0  # 正常语速
    $synthesizer.Volume = 100  # 最大音量
    
    # 朗读测试文本
    $testText = "你好，这是一个Windows TTS测试。如果您能听到这段语音，说明TTS功能正常工作。"
    Write-Host "📝 朗读文本：$testText" -ForegroundColor Cyan
    
    $synthesizer.Speak($testText)
    
    Write-Host "✅ 朗读测试完成" -ForegroundColor Green
    
    # 清理资源
    $synthesizer.Dispose()
    
} catch {
    Write-Host "❌ TTS测试失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请确保系统已安装语音功能" -ForegroundColor Yellow
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 
