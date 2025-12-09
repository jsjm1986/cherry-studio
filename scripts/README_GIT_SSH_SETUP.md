**Git+SSH 自动设置说明**

- 文件位置：`scripts/git-ssh-setup.ps1`（Windows PowerShell）
- 可选：`scripts/git-ssh-setup.sh`（类 Unix / Git Bash）

主要功能：
- 生成 ed25519 SSH 密钥（默认文件名 `id_ed25519_cherry_studio`）
- 启动并使用 `ssh-agent` 将私钥加入 agent
- 将 `github.com` 的 hostkey 加入 `~/.ssh/known_hosts`
- 在 `~/.ssh/config` 添加 `github.com` 的配置，指向该私钥
- 输出公钥内容，便于复制粘贴到 GitHub -> Settings -> SSH and GPG keys
- 可选（带 `-Push` 或 `push` 参数）将 `origin` 从 HTTPS 切换为 SSH 并尝试 `git push -u origin main`

使用示例（Windows PowerShell）：

```powershell
# 生成并显示公钥（不推送）
PowerShell -ExecutionPolicy Bypass -File .\scripts\git-ssh-setup.ps1

# 生成并在配置好 GitHub 上添加公钥后，自动切换 remote 并推送
PowerShell -ExecutionPolicy Bypass -File .\scripts\git-ssh-setup.ps1 -Push
```

使用示例（类 Unix / Git Bash）：

```bash
# 生成并显示公钥
bash scripts/git-ssh-setup.sh

# 生成并在配置好 GitHub 上添加公钥后，自动切换 remote 并推送
bash scripts/git-ssh-setup.sh push
```

注意事项：
- 脚本不会把私钥或公钥上传到 GitHub；你需手动把脚本输出的公钥粘贴到 GitHub。
- 如果你的 `~/.ssh/config` 已有 github.com 的条目，脚本会保守处理（不会覆盖已有条目），建议人工检查合并。
- 推送操作会把 `origin` 改为 SSH 地址（`git@github.com:OWNER/REPO.git`），请确保该仓库存在且你有权限。
- 如果你在公司网络/代理环境，可能需要先允许 SSH（端口 22）或使用公司代理策略。

如果你希望我把这些脚本加入到仓库根的 `package.json` 或建立一个更安全的交互式脚本（例如提示是否覆盖 config、备份等），告诉我我会继续改进。
