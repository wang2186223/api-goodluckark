export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // 根据请求来源域名确定访问权限和转接比例
  const host = req.headers.host || '';
  
  // 只允许 api.advertisingreport.net 访问，其他域名拒绝
  if (!host.includes('api.advertisingreport.net')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // api.advertisingreport.net 使用 50% 转接比例
  const REVENUE_ADJUSTMENT_FACTOR = 0.5;
  
  // 检查是否是浏览器请求（Accept 头包含 text/html）
  const acceptHeader = req.headers.accept || '';
  const isBrowserRequest = acceptHeader.includes('text/html');
  
  try {
    // 从查询参数中获取参数
    const { username, password, from_date, to_date } = req.query;
    
    // 如果是浏览器请求且没有参数，显示空白页面
    if (isBrowserRequest && (!username || !password || !from_date || !to_date)) {
      const blankPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advertising Report</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: white;
            height: 100vh;
        }
    </style>
</head>
<body>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(blankPage);
    }
    
    // 验证必需参数
    if (!username || !password || !from_date || !to_date) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['username', 'password', 'from_date', 'to_date'],
        received: { username, password, from_date, to_date }
      });
    }
    
    // 构建目标 API URL
    const targetUrl = new URL('https://api.adoptima.net/get_app_data/get_adx');
    targetUrl.searchParams.set('username', username);
    targetUrl.searchParams.set('password', password);
    targetUrl.searchParams.set('from_date', from_date);
    targetUrl.searchParams.set('to_date', to_date);
    
    // 发起请求到目标 API
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Advertising-Report-Proxy/1.0',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Data source temporarily unavailable',
        status: response.status
      });
    }
    
    // 获取响应数据
    const rawData = await response.json();
    
    // 数据过滤处理函数
    const processData = (data) => {
      if (!Array.isArray(data)) return data;
      
      return data.map(item => {
        // 处理 revenue: 乘以调整系数
        const originalRevenue = parseFloat(item.revenue || 0);
        const adjustedRevenue = originalRevenue * REVENUE_ADJUSTMENT_FACTOR;
        
        // 处理 ecpm: 使用调整后的 revenue 计算
        const impressions = parseInt(item.impressions || 0);
        let adjustedEcpm = '0';
        if (impressions > 0) {
          adjustedEcpm = (adjustedRevenue / impressions * 1000).toFixed(6);
        }
        
        return {
          ...item,
          revenue: adjustedRevenue.toFixed(6),
          ecpm: adjustedEcpm
        };
      });
    };
    
    // 处理数据
    const data = processData(rawData);
    
    // 如果是浏览器请求，返回简化的表格
    if (isBrowserRequest) {
      // 对敏感数据进行混淆处理
      const obfuscatedData = data.map((item, index) => {
        const row = {};
        // 使用随机顺序和混淆字段名
        const fieldMap = {
          'dt': item.date,
          'st': item.site,
          'ul': item.url,
          'au': item.adunit,
          'u1': item.ad_unit_1,
          'uc': item.ad_unit_code,
          'ck': item.clicks,
          'im': item.impressions,
          'ec': item.ecpm,
          'rq': item.ad_request,
          'rs': item.responses_served,
          'mr': item.match_rate,
          'av': item.total_active_view_measurable_imp,
          'rv': item.revenue,
          'co': item.country
        };
        return fieldMap;
      });
      
      // 动态生成混淆的HTML，避免暴露数据结构
      const tableRows = data.map((item, idx) => 
        `<tr>${[
          item.date || '',
          item.site || '', 
          item.url || '',
          item.adunit || '',
          item.ad_unit_1 || '',
          item.ad_unit_code || '',
          item.clicks || '',
          item.impressions || '',
          item.ecpm || '',
          item.ad_request || '',
          item.responses_served || '',
          item.match_rate || '',
          item.total_active_view_measurable_imp || '',
          item.revenue || '',
          item.country || ''
        ].map(val => `<td>${val}</td>`).join('')}</tr>`
      ).join('');
      
      // 生成CSV数据用于下载
      const csvData = [
        // CSV 表头
        ['date','site','url','adunit','ad_unit_1','ad_unit_code','clicks','impressions','ecpm','ad_request','responses_served','match_rate','total_active_view_measurable_imp','revenue','country'].join(','),
        // CSV 数据行
        ...data.map(item => [
          item.date || '',
          `"${(item.site || '').replace(/"/g, '""')}"`,
          `"${(item.url || '').replace(/"/g, '""')}"`, 
          `"${(item.adunit || '').replace(/"/g, '""')}"`,
          `"${(item.ad_unit_1 || '').replace(/"/g, '""')}"`,
          `"${(item.ad_unit_code || '').replace(/"/g, '""')}"`,
          item.clicks || '',
          item.impressions || '',
          item.ecpm || '',
          item.ad_request || '',
          item.responses_served || '',
          item.match_rate || '',
          item.total_active_view_measurable_imp || '',
          item.revenue || '',
          `"${(item.country || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\\n');
      
      const htmlResult = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Report - ${from_date} to ${to_date}</title><style>body{font-family:Arial,sans-serif;margin:20px;background:#f8f9fa;color:#333}.container{max-width:100%;margin:0 auto;background:white;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow-x:auto}.header{text-align:center;padding:20px 0;border-bottom:2px solid #007bff;margin-bottom:30px}.header h1{color:#007bff;margin:0;font-size:24px}.period{color:#666;margin-top:5px}.data-table{width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #dee2e6;font-size:12px}.data-table th,.data-table td{border:1px solid #dee2e6;padding:8px;text-align:left;white-space:nowrap}.data-table th{background:#007bff;color:white;font-weight:600;position:sticky;top:0}.data-table tr:nth-child(even){background:#f8f9fa}.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #dee2e6;color:#666;font-size:14px}.record-count{text-align:center;margin-bottom:20px;font-size:16px;font-weight:bold;color:#007bff}.download-btn{background:#28a745;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin:10px;text-decoration:none;display:inline-block}.download-btn:hover{background:#218838}</style></head><body><div class="container"><div class="header"><h1>📊 Advertising Report</h1><div class="period">Period: ${from_date} - ${to_date}</div></div><div class="record-count">Total Records: ${Array.isArray(data) ? data.length : 0} <button class="download-btn" onclick="downloadCSV()">📥 Download CSV</button></div>${Array.isArray(data) && data.length > 0 ? `<table class="data-table"><thead><tr><th>date</th><th>site</th><th>url</th><th>adunit</th><th>ad_unit_1</th><th>ad_unit_code</th><th>clicks</th><th>impressions</th><th>ecpm</th><th>ad_request</th><th>responses_served</th><th>match_rate</th><th>total_active_view_measurable_imp</th><th>revenue</th><th>country</th></tr></thead><tbody>${tableRows}</tbody></table>` : `<div style="text-align:center;padding:40px;color:#666"><h3>📭 No Data</h3><p>No data found for the specified date range</p></div>`}<div class="footer">Report generated at ${new Date().toLocaleString('zh-CN')}</div></div><script>function downloadCSV(){const csvContent="${csvData.replace(/"/g, '\\"')}";const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});const link=document.createElement('a');if(link.download!==undefined){const url=URL.createObjectURL(blob);link.setAttribute('href',url);link.setAttribute('download','advertising-report-${from_date}-${to_date}.csv');link.style.visibility='hidden';document.body.appendChild(link);link.click();document.body.removeChild(link);}}</script></body></html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(htmlResult);
    }
    
    // 对于 API 请求，返回原始 JSON 数据
    res.setHeader('X-Proxy-By', 'Report-Service');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Service temporarily unavailable'
    });
  }
}