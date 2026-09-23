# 支持助手可上传文件

这些文件是支持助手允许上传的示例，已经放在本仓库里。

页面地址：`/support-assistant/`

| 文件 | 类型 | 用途 |
| --- | --- | --- |
| `uploadable/screenshot.png` | 图片 | 问题截图 |
| `uploadable/issue-log.txt` | 文本日志 | 错误日志 |
| `uploadable/repro-steps.md` | Markdown | 复现步骤 |
| `uploadable/context.json` | JSON | 环境与上传限制 |
| `uploadable/note.pdf` | PDF | 补充说明 |

允许的扩展名：`.png` `.jpg` `.jpeg` `.gif` `.webp` `.txt` `.log` `.md` `.json` `.pdf`。

一次最多 5 个文件，单个文件不超过 10 MB。这是 GitHub Pages 静态页，浏览器里新选择的文件只会在本地检查，不会写回仓库。
