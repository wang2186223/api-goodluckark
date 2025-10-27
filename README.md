# Advertising Report 跳转网站 + API 代理服务

这是一个多功能网站，提供两个主要功能：

1. **域名跳转**: 将访问 `advertisingreport.net` 或 `www.advertisingreport.net` 的用户自动跳转到 Google Ad Manager
2. **API 代理**: 提供 API 数据转接服务，将请求代理到数据源 API

## 功能特性

### 🔄 域名跳转功能
- **自动跳转**: 使用多种方式确保可靠的跳转到 `https://admanager.google.com`
  - HTML meta refresh
  - JavaScript window.location
  - Vercel 301 重定向
- **双重保障**: 支持 www 和非 www 域名
- **用户友好**: 显示加载动画和备用链接
- **SEO 优化**: 使用 301 永久重定向

### 🔌 API 代理功能
- **数据转接**: 代理外部 API 数据请求
- **参数转发**: 自动转发查询参数
- **错误处理**: 完善的错误处理和状态码
- **CORS 支持**: 支持跨域请求
- **超时控制**: 30秒请求超时保护

## API 使用说明

### 接口地址
```
GET https://advertisingreport.net/api
```

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |
| from_date | string | ✅ | 开始日期 (YYYY-MM-DD) |
| to_date | string | ✅ | 结束日期 (YYYY-MM-DD) |

### 请求示例
```bash
curl "https://advertisingreport.net/api?username=popark&password=Netlink@123&from_date=2025-10-07&to_date=2025-10-14"
```

### 响应格式
返回 JSON 数组，包含广告数据：
```json
[
  {
    "date": "2025-10-13",
    "site": "(unknown)",
    "url": null,
    "adunit": "banner_1",
    "ad_unit_1": "poparknovel.com",
    "ad_unit_code": null,
    "clicks": "0",
    "impressions": "0",
    "ecpm": "0",
    "ad_request": "22",
    "responses_served": "0",
    "match_rate": "0",
    "total_active_view_measurable_imp": null,
    "revenue": "0",
    "country": null
  }
]
```

### 错误响应
```json
{
  "error": "Missing required parameters",
  "required": ["username", "password", "from_date", "to_date"],
  "received": { "username": "popark", "password": null, "from_date": "2025-10-07", "to_date": "2025-10-14" }
}
```

## 技术实现

### 跳转方式

1. **Vercel 重定向** (主要方式)
   - 使用 `vercel.json` 配置 301 永久重定向
   - 在服务器级别处理，速度最快
   - 排除 `/api` 路径以支持 API 功能

2. **HTML Meta Refresh** (备用方式)
   - 在 HTML head 中设置 meta refresh
   - 兼容性最好

3. **JavaScript 跳转** (备用方式)
   - 立即执行和延迟执行双重保障
   - 处理特殊情况

### API 代理实现

- **Vercel Serverless Functions**: 使用 Node.js 20.x 运行时
- **数据源**: `https://api.adoptima.net/get_app_data/get_adx`
- **安全特性**: 
  - CORS 支持
  - 请求超时控制
  - 参数验证
  - 错误处理

### 文件结构

```
├── api/
│   └── index.js        # API 代理函数
├── index.html          # 主页面文件
├── vercel.json         # Vercel 配置文件
└── README.md           # 项目说明文档
```

## 部署步骤

### 1. GitHub 设置

1. 确保代码已推送到 GitHub 仓库: `https://github.com/wang2186223/api-google-pop.git`

### 2. Vercel 部署

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 GitHub 仓库 `api-google-pop`
5. 保持默认设置，点击 "Deploy"

### 3. 域名配置

#### 在 Vercel 中添加自定义域名:

1. 进入项目设置 → Domains
2. 添加域名:
   - `advertisingreport.net`
   - `www.advertisingreport.net`

#### 在域名注册商处配置 DNS:

**对于根域名 (advertisingreport.net):**
```
类型: A
名称: @
值: 76.76.19.19
```

**对于 www 子域名:**
```
类型: CNAME
名称: www
值: cname.vercel-dns.com
```

### 4. SSL 证书

Vercel 会自动为你的域名配置 SSL 证书，通常在几分钟内完成。

## 验证

部署完成后，可以通过以下方式验证:

1. 访问 `http://advertisingreport.net` - 应该跳转到 Google Ad Manager
2. 访问 `http://www.advertisingreport.net` - 应该跳转到 Google Ad Manager
3. 访问 `https://advertisingreport.net` - 应该跳转到 Google Ad Manager
4. 访问 `https://www.advertisingreport.net` - 应该跳转到 Google Ad Manager

## 注意事项

- DNS 生效可能需要 24-48 小时
- 确保在域名注册商处正确配置了 DNS 记录
- 如果遇到问题，检查 Vercel 项目的 Functions 和 Deployments 日志

## 技术支持

如果遇到任何问题，可以:

1. 检查 Vercel 部署日志
2. 验证 DNS 配置是否正确
3. 确认域名已添加到 Vercel 项目中

---

**项目创建时间**: 2025年10月14日  
**GitHub 仓库**: https://github.com/wang2186223/api-google-pop.git






现在您的调整系数位置在代码的第 16 行：

const REVENUE_ADJUSTMENT_FACTOR = 0.7;