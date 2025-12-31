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
