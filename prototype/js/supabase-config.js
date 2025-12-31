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
    
    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#FFF9F0');
    gradient.addColorStop(1, '#FFE8CC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    
    // 装飾
    ctx.fillStyle = 'rgba(220, 20, 60, 0.05)';
    ctx.font = 'bold 200px sans-serif';
    ctx.fillText('🎍', 50, 200);
    ctx.fillText('🌸', 950, 550);
    
    // タイトル
    ctx.fillStyle = '#DC143C';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('みんなのマンダラート', 600, 80);
    
    // 大目標
    ctx.fillStyle = '#333';
    ctx.font = 'bold 56px sans-serif';
    const centerText = mandalartData.center || '大目標';
    ctx.fillText(centerText, 600, 170);
    
    // 中目標を表示（3x3レイアウト）
    const themes = mandalartData.themes || [];
    const positions = [
        [250, 280], [600, 280], [950, 280],
        [250, 420], [600, 420], [950, 420],
        [250, 560], [600, 560], [950, 560]
    ];
    
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#317873';
    
    themes.slice(0, 8).forEach((theme, i) => {
        if (theme.title) {
            const [x, y] = positions[i < 4 ? i : i + 1]; // 中央をスキップ
            
            // 背景ボックス
            const text = theme.title.length > 10 ? theme.title.slice(0, 10) + '...' : theme.title;
            const textWidth = ctx.measureText(text).width;
            
            ctx.fillStyle = 'rgba(49, 120, 115, 0.15)';
            ctx.fillRect(x - textWidth/2 - 15, y - 35, textWidth + 30, 50);
            
            // テキスト
            ctx.fillStyle = '#317873';
            ctx.fillText(text, x, y);
        }
    });
    
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
