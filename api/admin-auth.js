/**
 * 管理者認証API
 * POST /api/admin-auth
 */
export default async function handler(req, res) {
    // POSTリクエストのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）の処理
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { password } = req.body;

        // 環境変数からパスワードを取得
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (!correctPassword) {
            console.error('ADMIN_PASSWORD環境変数が設定されていません');
            return res.status(500).json({ 
                error: 'サーバー設定エラー',
                authenticated: false 
            });
        }

        // パスワード検証
        const isAuthenticated = password === correctPassword;

        return res.status(200).json({
            authenticated: isAuthenticated
        });

    } catch (error) {
        console.error('認証エラー:', error);
        return res.status(500).json({ 
            error: 'サーバーエラー',
            authenticated: false 
        });
    }
}
