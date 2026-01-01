import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // URLパラメータからIDを取得
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).send('ID parameter is required');
    }
    
    // Supabaseクライアント作成
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // マンダラートデータを取得
    const { data, error } = await supabase
      .from('mandalarts')
      .select('center, og_image_url, user_display_name, created_at')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return res.status(404).send('Mandalart not found');
    }
    
    // 元のview.htmlを読み込む
    const htmlPath = path.join(process.cwd(), 'prototype', 'view.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // OGPメタタグを置き換え
    const title = `${data.center} - みんなのマンダラート`;
    const description = `${data.user_display_name || '匿名さん'}さんの目標「${data.center}」- みんなのマンダラートで作成`;
    const url = `https://${req.headers.host}/prototype/view.html?id=${id}`;
    const ogImage = data.og_image_url || '';
    
    // タイトル更新
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${title}</title>`
    );
    
    // OGPメタタグ更新
    html = html.replace(
      /<meta property="og:title" content=".*?" id="og-title">/,
      `<meta property="og:title" content="${title}" id="og-title">`
    );
    
    html = html.replace(
      /<meta property="og:description" content=".*?" id="og-description">/,
      `<meta property="og:description" content="${description}" id="og-description">`
    );
    
    html = html.replace(
      /<meta property="og:url" content=".*?" id="og-url">/,
      `<meta property="og:url" content="${url}" id="og-url">`
    );
    
    html = html.replace(
      /<meta property="og:image" content=".*?" id="og-image">/,
      `<meta property="og:image" content="${ogImage}" id="og-image">`
    );
    
    // Twitter Cardメタタグ更新
    html = html.replace(
      /<meta name="twitter:title" content=".*?" id="twitter-title">/,
      `<meta name="twitter:title" content="${title}" id="twitter-title">`
    );
    
    html = html.replace(
      /<meta name="twitter:description" content=".*?" id="twitter-description">/,
      `<meta name="twitter:description" content="${description}" id="twitter-description">`
    );
    
    html = html.replace(
      /<meta name="twitter:image" content=".*?" id="twitter-image">/,
      `<meta name="twitter:image" content="${ogImage}" id="twitter-image">`
    );
    
    // HTMLを返す
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
