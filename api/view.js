import { createClient } from '@supabase/supabase-js';

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
    
    // OGPメタタグ用のデータ
    const title = `${data.center} - みんなのマンダラート`;
    const description = `${data.user_display_name || '匿名さん'}さんの目標「${data.center}」- みんなのマンダラートで作成`;
    const url = `https://${req.headers.host}/prototype/view.html?id=${id}`;
    const ogImage = data.og_image_url || '';
    
    // HTMLテンプレート（view.htmlをベースに、OGPメタタグを埋め込む）
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- OGP設定 -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="みんなのマンダラート">
    <meta property="og:title" content="${title}" id="og-title">
    <meta property="og:description" content="${description}" id="og-description">
    <meta property="og:url" content="${url}" id="og-url">
    <meta property="og:image" content="${ogImage}" id="og-image">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}" id="twitter-title">
    <meta name="twitter:description" content="${description}" id="twitter-description">
    <meta name="twitter:image" content="${ogImage}" id="twitter-image">
    
    <link rel="stylesheet" href="/prototype/css/style.css">
    <link rel="stylesheet" href="/prototype/css/view.css">
    
    <style>
        /* 削除リクエストモーダル用のスタイル */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background-color: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
            margin-bottom: 1.5rem;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #DC143C;
        }
        
        .modal-body textarea {
            width: 100%;
            min-height: 120px;
            padding: 0.75rem;
            border: 1px solid #E0E0E0;
            border-radius: 8px;
            font-size: 1rem;
            resize: vertical;
            font-family: inherit;
        }
        
        .modal-footer {
            margin-top: 1.5rem;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        .btn-danger {
            background-color: #DC143C;
            color: white;
        }
        
        .btn-danger:hover {
            background-color: #B01030;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <h1 class="logo">
                <span class="logo-icon">🎍</span>
                みんなのマンダラート
            </h1>
            <nav class="nav">
                <a href="/prototype/index.html" class="nav-link">ホーム</a>
                <a href="/prototype/list.html" class="nav-link">一覧</a>
                <a href="/prototype/create.html" class="nav-link">作成</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <!-- マンダラート情報 -->
            <div class="mandalart-header">
                <h2 class="mandalart-title" id="mandalart-title">Loading...</h2>
                <div class="mandalart-meta">
                    <span class="meta-item">
                        <span class="meta-icon">👤</span>
                        <span id="user-name">匿名さん</span>
                    </span>
                    <span class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span id="created-date">2025/01/01</span>
                    </span>
                </div>
            </div>

            <!-- PC版: 9x9マンダラート表示 -->
            <div class="mandalart-container desktop-only">
                <div class="mandalart-full" id="mandalart-display">
                    <!-- JavaScriptで動的生成 -->
                </div>
            </div>

            <!-- スマホ版: 9x9画像表示（ズーム可能） -->
            <div class="mandalart-image-container mobile-only">
                <p class="image-hint">💡 画像をピンチしてズームできます</p>
                <img id="mandalart-image" alt="マンダラート完成図" class="mandalart-image">
            </div>

            <!-- アクションボタン -->
            <div class="actions">
                <button class="btn btn-secondary" onclick="window.location.href='/prototype/create.html'">
                    ✏️ 新しく作成
                </button>
                <button class="btn btn-primary" id="share-btn">
                    🔗 シェア
                </button>
                <button class="btn btn-secondary" id="download-btn">
                    📸 画像保存
                </button>
                <button class="btn btn-twitter" id="twitter-btn">
                    🐦 Xに投稿
                </button>
                <button class="btn btn-danger" id="delete-request-btn">
                    🗑️ 削除リクエスト
                </button>
            </div>
        </div>
    </main>

    <!-- 削除リクエストモーダル -->
    <div id="delete-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>削除リクエスト</h3>
            </div>
            <div class="modal-body">
                <p>このマンダラートの削除をリクエストします。管理者が確認後、削除されます。</p>
                <label for="delete-reason">削除理由（必須）:</label>
                <textarea id="delete-reason" placeholder="例: 不適切な内容が含まれている、個人情報が掲載されている、など"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-delete-btn">キャンセル</button>
                <button class="btn btn-danger" id="submit-delete-btn">送信</button>
            </div>
        </div>
    </div>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 みんなのマンダラート</p>
        </div>
    </footer>

    <script type="module">
        import { shareMandalart, downloadImage, shareToTwitter, requestDelete } from '/prototype/js/view.js';
        
        // グローバル関数として公開
        window.shareMandalart = shareMandalart;
        window.downloadImage = downloadImage;
        window.shareToTwitter = shareToTwitter;
        window.requestDelete = requestDelete;
        
        // ボタンにイベントリスナーを追加
        document.getElementById('share-btn').addEventListener('click', shareMandalart);
        document.getElementById('download-btn').addEventListener('click', downloadImage);
        document.getElementById('twitter-btn').addEventListener('click', shareToTwitter);
        
        // 削除リクエストモーダル
        const modal = document.getElementById('delete-modal');
        const deleteReqBtn = document.getElementById('delete-request-btn');
        const cancelBtn = document.getElementById('cancel-delete-btn');
        const submitBtn = document.getElementById('submit-delete-btn');
        
        deleteReqBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.getElementById('delete-reason').value = '';
        });
        
        submitBtn.addEventListener('click', async () => {
            const reason = document.getElementById('delete-reason').value.trim();
            if (!reason) {
                alert('削除理由を入力してください');
                return;
            }
            
            await requestDelete(reason);
            modal.classList.remove('active');
            document.getElementById('delete-reason').value = '';
        });
        
        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.getElementById('delete-reason').value = '';
            }
        });
    </script>
</body>
</html>`;
    
    // HTMLを返す
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
}
