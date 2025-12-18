#!/bin/bash

# 获取当前时间
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "Starting synchronization to GitHub..."

# 添加所有修改
git add .

# 检查是否有需要提交的更改
if git diff-index --quiet HEAD --; then
    echo "No changes to commit from diff-index."
    # 有时候 diff-index 不够准确，双重检查 status
    if [ -z "$(git status --porcelain)" ]; then
        echo "Really no changes."
    else
         if [ -n "$1" ]; then
            MSG="$1"
        else
            MSG="Auto-sync: $TIMESTAMP"
        fi
        git commit -m "$MSG"
        echo "Files committed with message: $MSG"
        echo "Pushing to remote repository..."
        git push origin main
    fi
else
    # 提交更改
    if [ -n "$1" ]; then
        MSG="$1"
    else
        MSG="Auto-sync: $TIMESTAMP"
    fi
    
    git commit -m "$MSG"
    echo "Files committed with message: $MSG"
    
    # 推送到远程仓库
    echo "Pushing to remote repository..."
    git push origin main
fi

echo "Synchronization check complete!"
