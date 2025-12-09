<#
PowerShell 脚本：git-ssh-setup.ps1
用途：在 Windows 上生成 SSH key、启动 ssh-agent、添加 key、写入 ~/.ssh/config、加入 known_hosts、并（可选）切换 remote 为 SSH 并推送。
用法示例：
  PowerShell -ExecutionPolicy Bypass -File .\scripts\git-ssh-setup.ps1
  PowerShell -ExecutionPolicy Bypass -File .\scripts\git-ssh-setup.ps1 -Push
#>
param(
    [switch]$Push
)

# 基本路径
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }
$keyFileName = "id_ed25519_cherry_studio"
$keyPath = Join-Path $sshDir $keyFileName
$pubKeyPath = "$keyPath.pub"

Write-Output "== 1) 当前目录: $(Get-Location)"
Write-Output "== 2) 检查或生成 SSH Key: $keyPath"
if (-not (Test-Path $keyPath)) {
    ssh-keygen -t ed25519 -f $keyPath -C "$env:USERNAME@$(Split-Path -Leaf (Get-Location))" -N "" | Out-Null
    Write-Output "  已生成私钥： $keyPath"
} else {
    Write-Output "  私钥已存在： $keyPath"
}

Write-Output "== 3) 启动 ssh-agent 并添加密钥"
# 启动 ssh-agent（Windows 服务），若失败则忽略
try {
    Start-Service ssh-agent -ErrorAction Stop
} catch {
    # 可能已运行或权限不够
}
# 把 key 加到 agent
ssh-add $keyPath 2>$null | Out-Null

Write-Output "== 4) 写入 SSH config（为 github.com 指定该密钥）"
$configPath = Join-Path $sshDir "config"
$configEntry = @(
    "Host github.com",
    "  HostName github.com",
    "  User git",
    "  IdentityFile $keyPath",
    "  IdentitiesOnly yes"
)
# 如果 config 中已经包含 Host github.com，先移除旧的块（简单策略：追加并提示）
if (-not (Get-Content $configPath -ErrorAction SilentlyContinue | Select-String -Pattern "Host github.com")) {
    Add-Content -Path $configPath -Value $configEntry
    Write-Output "  已写入 $configPath"
} else {
    Write-Output "  $configPath 已存在 github.com 配置，请手动核对（脚本未覆盖）"
}

Write-Output "== 5) 添加 GitHub 到 known_hosts（用 ssh-keyscan）"
try {
    ssh-keyscan github.com >> $env:USERPROFILE + "\\.ssh\\known_hosts" 2>$null
    Write-Output "  已把 github.com 添加到 known_hosts"
} catch {
    Write-Output "  ssh-keyscan 执行失败，请手动运行：ssh-keyscan github.com >> $env:USERPROFILE\\.ssh\\known_hosts"
}

Write-Output "== 6) 输出公钥（请复制到 GitHub -> Settings -> SSH and GPG keys -> New SSH key）"
if (Test-Path $pubKeyPath) {
    Get-Content $pubKeyPath | ForEach-Object { Write-Output $_ }
} else {
    Write-Output "  公钥文件不存在： $pubKeyPath"
}

# 尝试获取当前 origin，如果是 https，构造 ssh URL
$originUrl = (git remote get-url origin 2>$null) -as [string]
if ($originUrl) { Write-Output "== 当前 origin: $originUrl" } else { Write-Output "== 未检测到 origin 远程" }

# 如果用户请求 Push，则尝试切换 remote 并推送
if ($Push) {
    if (-not $originUrl) { Write-Output "无法找到 origin，脚本不会设置 remote。"; exit 1 }
    # 支持 https://github.com/owner/repo(.git) -> git@github.com:owner/repo.git
    if ($originUrl -match "https://github.com/([^/]+)/(.+?)(?:\.git)?$") {
        $owner = $matches[1]
        $repo = $matches[2]
        $sshUrl = "git@github.com:$owner/$repo.git"
        Write-Output "== 将 origin 切换为： $sshUrl"
        git remote set-url origin $sshUrl
        Write-Output "== 尝试推送： git push -u origin main"
        git push -u origin main
    } else {
        Write-Output "origin 不是标准的 GitHub HTTPS URL，手动设置 remote：git remote set-url origin git@github.com:OWNER/REPO.git"
    }
}

Write-Output "== 完成。若你已在 GitHub 上添加公钥，运行本脚本并加上 -Push 参数将自动切换 remote 并推送。"
