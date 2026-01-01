// ========================================
// Supabase設定
// ========================================

// Supabase CDNから直接読み込み（npm不要）
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// プロジェクト設定
const SUPABASE_URL = 'https://qlymljocweviulwjwjou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HDdY-y9niRHFEvC-PH3bXA_o0A3BR3V';

// Supabaseクライアント作成
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// 認証ヘルパー関数
// ========================================

/**
 * 匿名ログイン
 */
export async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
        console.error('匿名ログインエラー:', error);
        return null;
    }
    
    return data.user;
}

/**
 * Googleログイン
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/prototype/'
        }
    });
    
    if (error) {
        console.error('Googleログインエラー:', error);
    }
}

/**
 * ログアウト
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('ログアウトエラー:', error);
    }
}

/**
 * 現在のユーザー取得
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * 認証状態の変更を監視
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChanged((event, session) => {
        callback(session?.user || null);
    });
}

// ========================================
// OG画像生成・アップロード
// ========================================

/**
 * OG画像を生成（1200x630px、Twitter推奨サイズ）
 */
export async function generateOGImage(mandalartData) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    
    // 背景（白）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1200, 630);
    
    // 3x3マスの設定
    const cellSize = 180;
    const gap = 4;
    const gridSize = cellSize * 3 + gap * 4;
    
    // 中央配置
    const startX = (1200 - gridSize) / 2;
    const startY = (630 - gridSize) / 2;
    
    // 3x3レイアウト
    const centerLayout = [
        { themeIndex: 0, row: 0, col: 0 },
        { themeIndex: 1, row: 0, col: 1 },
        { themeIndex: 2, row: 0, col: 2 },
        { themeIndex: 3, row: 1, col: 0 },
        { themeIndex: -1, row: 1, col: 1 },  // 大目標
        { themeIndex: 4, row: 1, col: 2 },
        { themeIndex: 5, row: 2, col: 0 },
        { themeIndex: 6, row: 2, col: 1 },
        { themeIndex: 7, row: 2, col: 2 }
    ];
    
    // 各セルを描画
    centerLayout.forEach(({ themeIndex, row, col }) => {
        const x = startX + gap + col * (cellSize + gap);
        const y = startY + gap + row * (cellSize + gap);
        
        let bgColor, textColor, text;
        
        if (themeIndex === -1) {
            // 大目標（中央）
            bgColor = '#DC143C';
            textColor = '#FFFFFF';
            text = mandalartData.center || '';
        } else {
            // 中目標
            bgColor = '#317873';
            textColor = '#FFFFFF';
            text = mandalartData.themes[themeIndex]?.title || '';
        }
        
        // セルの背景色
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // テキスト
        if (text && text.trim()) {
            ctx.fillStyle = textColor;
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // テキストを切り詰め（長すぎる場合）
            const maxWidth = cellSize - 20;
            let displayText = text;
            
            if (ctx.measureText(displayText).width > maxWidth) {
                while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
                    displayText = displayText.slice(0, -1);
                }
                displayText += '...';
            }
            
            ctx.fillText(displayText, x + cellSize / 2, y + cellSize / 2);
        }
    });
    
    // グリッド線（薄いグレー）
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 3; i++) {
        const offsetX = startX + gap + i * (cellSize + gap) - gap / 2;
        const offsetY = startY + gap + i * (cellSize + gap) - gap / 2;
        
        // 縦線
        ctx.beginPath();
        ctx.moveTo(offsetX, startY);
        ctx.lineTo(offsetX, startY + gridSize);
        ctx.stroke();
        
        // 横線
        ctx.beginPath();
        ctx.moveTo(startX, offsetY);
        ctx.lineTo(startX + gridSize, offsetY);
        ctx.stroke();
    }
    
    // 外枠（太い赤）
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 6;
    ctx.strokeRect(startX + 3, startY + 3, gridSize - 6, gridSize - 6);
    
    // 右下に「#みんなのマンダラート」
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('#みんなのマンダラート', 1150, 600);
    
    // Blobに変換
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

/**
 * OG画像をSupabase Storageにアップロード
 */
export async function uploadOGImage(imageBlob, mandalartId) {
    const fileName = `${mandalartId}.png`;
    
    const { data, error } = await supabase.storage
        .from('og-images')
        .upload(fileName, imageBlob, {
            contentType: 'image/png',
            upsert: true
        });
    
    if (error) {
        console.error('OG画像アップロードエラー:', error);
        throw error;
    }
    
    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
        .from('og-images')
        .getPublicUrl(fileName);
    
    return publicUrl;
}

// ========================================
// データベースヘルパー関数
// ========================================

/**
 * マンダラート作成
 */
export async function createMandalart(data) {
    const user = await getCurrentUser();
    
    if (!user) {
        throw new Error('ログインが必要です');
    }
    
    // まずマンダラートを作成
    const { data: mandalart, error } = await supabase
        .from('mandalarts')
        .insert({
            user_id: user.id,
            center: data.center,
            themes: data.themes,
            is_public: data.isPublic !== undefined ? data.isPublic : true,
            user_display_name: data.userDisplayName || '匿名さん',
            tags: data.tags || []
        })
        .select()
        .single();
    
    if (error) {
        console.error('マンダラート作成エラー:', error);
        throw error;
    }
    
    // OG画像を生成・アップロード
    try {
        const imageBlob = await generateOGImage({
            center: data.center,
            themes: data.themes
        });
        
        const ogImageUrl = await uploadOGImage(imageBlob, mandalart.id);
        
        // og_image_urlを更新
        const { data: updatedMandalart, error: updateError } = await supabase
            .from('mandalarts')
            .update({ og_image_url: ogImageUrl })
            .eq('id', mandalart.id)
            .select()
            .single();
        
        if (updateError) {
            console.error('OG画像URL更新エラー:', updateError);
        } else {
            return updatedMandalart;
        }
    } catch (ogError) {
        console.error('OG画像生成エラー:', ogError);
        // OG画像生成に失敗してもマンダラート自体は作成済み
    }
    
    return mandalart;
}

/**
 * 公開マンダラート一覧取得
 */
export async function getPublicMandalarts(limit = 20, offset = 0) {
    const { data, error } = await supabase
        .from('mandalarts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (error) {
        console.error('マンダラート取得エラー:', error);
        throw error;
    }
    
    return data;
}

/**
 * マンダラート詳細取得
 */
export async function getMandalart(id) {
    const { data, error } = await supabase
        .from('mandalarts')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('マンダラート取得エラー:', error);
        throw error;
    }
    
    // 閲覧数をインクリメント
    await supabase
        .from('mandalarts')
        .update({ view_count: data.view_count + 1 })
        .eq('id', id);
    
    return data;
}

/**
 * 自分のマンダラート一覧取得
 */
export async function getMyMandalarts() {
    const user = await getCurrentUser();
    
    if (!user) {
        return [];
    }
    
    const { data, error } = await supabase
        .from('mandalarts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('マンダラート取得エラー:', error);
        throw error;
    }
    
    return data;
}

/**
 * マンダラート更新
 */
export async function updateMandalart(id, data) {
    const { data: mandalart, error } = await supabase
        .from('mandalarts')
        .update({
            center: data.center,
            themes: data.themes,
            is_public: data.isPublic,
            tags: data.tags,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('マンダラート更新エラー:', error);
        throw error;
    }
    
    return mandalart;
}

/**
 * マンダラート削除
 */
export async function deleteMandalart(id) {
    const { error } = await supabase
        .from('mandalarts')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('マンダラート削除エラー:', error);
        throw error;
    }
}
