#!/usr/bin/env bash
# Bash 脚本：git-ssh-setup.sh
# 用途：在类 Unix 系统（或 Git Bash）上生成 SSH key、启动 ssh-agent、添加 key、写入 ~/.ssh/config、加入 known_hosts、并（可选）切换 remote 为 SSH 并推送。
# 用法：
#   bash scripts/git-ssh-setup.sh    # 只生成并显示公钥
#   bash scripts/git-ssh-setup.sh push   # 生成并尝试切换 remote 并推送

set -euo pipefail
push=false
if [ "${1:-}" = "push" ]; then
  push=true
fi

SSH_DIR="$HOME/.ssh"
mkdir -p "$SSH_DIR"
KEY_FILE="$SSH_DIR/id_ed25519_cherry_studio"
PUB_FILE="$KEY_FILE.pub"

if [ ! -f "$KEY_FILE" ]; then
  ssh-keygen -t ed25519 -f "$KEY_FILE" -C "$(whoami)@$(basename "$PWD")" -N ""
  echo "生成私钥： $KEY_FILE"
else
  echo "私钥已存在： $KEY_FILE"
fi

# 启动 agent（如果存在）并添加 key
if [ -n "$(command -v ssh-agent)" ]; then
  eval "$(ssh-agent -s)" >/dev/null
  ssh-add "$KEY_FILE" || true
fi

# 写入 config
CONFIG_FILE="$SSH_DIR/config"
if ! grep -q "Host github.com" "$CONFIG_FILE" 2>/dev/null; then
  cat >> "$CONFIG_FILE" <<-EOF
Host github.com
  HostName github.com
  User git
  IdentityFile $KEY_FILE
  IdentitiesOnly yes
EOF
  echo "已写入 $CONFIG_FILE"
else
  echo "$CONFIG_FILE 中已存在 github.com 配置，请手动核对。"
fi

# 添加 known_hosts
ssh-keyscan github.com >> "$SSH_DIR/known_hosts" 2>/dev/null || true

# 输出公钥
echo "\n== 公钥（复制并粘贴到 GitHub：Settings -> SSH and GPG keys -> New SSH key） =="
cat "$PUB_FILE"

# 如果 push 参数被传入，则尝试把 origin 切换为 SSH 并推送
if [ "$push" = true ]; then
  origin_url=$(git remote get-url origin 2>/dev/null || true)
  if [ -z "$origin_url" ]; then
    echo "未检测到 origin 远程，请手动设置后再推送。"
    exit 1
  fi
  if echo "$origin_url" | grep -qE "https://github.com/[^/]+/.+"; then
    owner_repo=$(echo "$origin_url" | sed -E 's#https://github.com/([^/]+/.+?)(\.git)?$#\1#')
    ssh_url="git@github.com:$owner_repo.git"
    git remote set-url origin "$ssh_url"
    echo "已把 origin 设置为 $ssh_url，尝试推送 main..."
    git push -u origin main
  else
    echo "origin 不是标准 GitHub HTTPS URL，请手动设置为 git@github.com:OWNER/REPO.git"
  fi
fi
