// Supabase設定をインポート
import { getPublicMandalarts, submitDeleteRequest, incrementLikeCount, decrementLikeCount } from './supabase-config.js';

// ========================================
// グローバル変数
// ========================================

let currentOffset = 0;
const ITEMS_PER_PAGE = 20;
let isLoading = false;
let hasMore = true;
let currentDeleteId = null; // 削除対象のマンダラートID

// LocalStorage キー
const LIKED_MANDALARTS_KEY = 'likedMandalarts';

// ========================================
// いいね管理（LocalStorage）
// ========================================

function getLikedMandalarts() {
    const liked = localStorage.getItem(LIKED_MANDALARTS_KEY);
    return liked ? JSON.parse(liked) : [];
}

function isLiked(mandalartId) {
    const liked = getLikedMandalarts();
    return liked.includes(mandalartId);
}

function addLike(mandalartId) {
    const liked = getLikedMandalarts();
    if (!liked.includes(mandalartId)) {
        liked.push(mandalartId);
        localStorage.setItem(LIKED_MANDALARTS_KEY, JSON.stringify(liked));
    }
}

function removeLike(mandalartId) {
    let liked = getLikedMandalarts();
    liked = liked.filter(id => id !== mandalartId);
    localStorage.setItem(LIKED_MANDALARTS_KEY, JSON.stringify(liked));
}

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMandalarts();
    
    // もっと見るボタン
    document.getElementById('load-more-btn').addEventListener('click', loadMore);
    
    // 削除リクエストモーダルのイベントリスナー
    setupDeleteModal();
});

// ========================================
// 削除リクエストモーダルのセットアップ
// ========================================

function setupDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const submitBtn = document.getElementById('submit-delete-btn');
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.getElementById('delete-reason').value = '';
        currentDeleteId = null;
    });
    
    submitBtn.addEventListener('click', async () => {
        const reason = document.getElementById('delete-reason').value.trim() || '（理由なし）';
        
        if (currentDeleteId) {
            await requestDelete(currentDeleteId, reason);
        }
        
        modal.classList.remove('active');
        document.getElementById('delete-reason').value = '';
        currentDeleteId = null;
    });
    
    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.getElementById('delete-reason').value = '';
            currentDeleteId = null;
        }
    });
}

// ========================================
// 削除リクエスト機能
// ========================================

function openDeleteModal(mandalartId) {
    currentDeleteId = mandalartId;
    const modal = document.getElementById('delete-modal');
    modal.classList.add('active');
}

async function requestDelete(mandalartId, reason) {
    try {
        await submitDeleteRequest(mandalartId, reason);
        alert('削除リクエストを送信しました。\n管理者が確認後、削除されます。');
    } catch (error) {
        console.error('削除リクエスト送信エラー:', error);
        alert('削除リクエストの送信に失敗しました。');
    }
}

// ========================================
// いいね機能
// ========================================

async function toggleLike(mandalartId, likeBtn, likeCount) {
    try {
        if (isLiked(mandalartId)) {
            // いいね取り消し
            await decrementLikeCount(mandalartId);
            removeLike(mandalartId);
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = `❤️ <span class="card-like-count">${parseInt(likeCount.textContent) - 1}</span>`;
        } else {
            // いいねする
            await incrementLikeCount(mandalartId);
            addLike(mandalartId);
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = `💗 <span class="card-like-count">${parseInt(likeCount.textContent) + 1}</span>`;
        }
    } catch (error) {
        console.error('いいね処理エラー:', error);
        alert('いいね処理に失敗しました。');
    }
}

// グローバルに公開
window.openDeleteModal = openDeleteModal;
window.toggleLike = toggleLike;

// ========================================
// マンダラート一覧読み込み
// ========================================

async function loadMandalarts() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    showLoading();
    
    try {
        console.log('マンダラート取得中...', { offset: currentOffset, limit: ITEMS_PER_PAGE });
        
        const mandalarts = await getPublicMandalarts(ITEMS_PER_PAGE, currentOffset);
        
        console.log('取得成功:', mandalarts.length, '件');
        
        if (mandalarts.length === 0) {
            if (currentOffset === 0) {
                showEmpty();
            }
            hasMore = false;
            hideLoadMore();
        } else {
            renderMandalarts(mandalarts);
            currentOffset += mandalarts.length;
            
            // 取得件数がITEMS_PER_PAGE未満なら、これ以上ない
            if (mandalarts.length < ITEMS_PER_PAGE) {
                hasMore = false;
                hideLoadMore();
            } else {
                showLoadMore();
            }
        }
        
        hideLoading();
    } catch (error) {
        console.error('マンダラート取得エラー:', error);
        showError();
        hideLoading();
    } finally {
        isLoading = false;
    }
}

// ========================================
// もっと見る
// ========================================

async function loadMore() {
    await loadMandalarts();
}

// ========================================
// マンダラートカード描画
// ========================================

function renderMandalarts(mandalarts) {
    const container = document.getElementById('mandalart-grid');
    
    mandalarts.forEach(mandalart => {
        const card = createMandalartCard(mandalart);
        container.appendChild(card);
    });
}

function createMandalartCard(mandalart) {
    const card = document.createElement('div');
    card.className = 'mandalart-card';
    card.onclick = (e) => {
        // アクションボタンをクリックした場合は遷移しない
        if (!e.target.closest('.card-actions')) {
            window.location.href = `/api/view?id=${mandalart.id}`;
        }
    };
    
    // サムネイル画像を生成（3x3のみ）
    const thumbnail = generateThumbnail(mandalart);
    
    // 日付フォーマット
    const date = new Date(mandalart.created_at);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    
    // ユーザー名（デフォルト：匿名さん）
    const userName = mandalart.user_display_name || '匿名さん';
    
    // いいね状態
    const liked = isLiked(mandalart.id);
    const likeEmoji = liked ? '💗' : '❤️';
    const likedClass = liked ? 'liked' : '';
    const likeCount = mandalart.like_count || 0;
    
    card.innerHTML = `
        <div class="card-image">
            ${thumbnail}
        </div>
        <div class="card-content">
            <h3 class="card-title">${escapeHtml(mandalart.center)}</h3>
            <div class="card-meta">
                <span class="meta-item">👤 ${escapeHtml(userName)}</span>
                <span class="meta-item">📅 ${dateStr}</span>
                <span class="meta-item">👁️ ${mandalart.view_count || 0}</span>
            </div>
        </div>
        <div class="card-actions">
            <button class="card-like-btn ${likedClass}" onclick="event.stopPropagation(); window.toggleLike('${mandalart.id}', this, this.querySelector('.card-like-count'))" title="いいね">
                ${likeEmoji} <span class="card-like-count">${likeCount}</span>
            </button>
            <button class="card-delete-btn" onclick="event.stopPropagation(); window.openDeleteModal('${mandalart.id}')" title="削除リクエスト">
                🗑️
            </button>
        </div>
    `;
    
    return card;
}

// ========================================
// サムネイル生成（3x3の中央ブロックのみ）
// ========================================

function generateThumbnail(mandalart) {
    const cellSize = 80;
    const gap = 2;
    const canvasSize = cellSize * 3 + gap * 4;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    
    // 背景色（白）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // 中央3x3ブロックのレイアウト
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
        const x = gap + col * (cellSize + gap);
        const y = gap + row * (cellSize + gap);
        
        let bgColor, textColor, text;
        
        if (themeIndex === -1) {
            // 大目標（中央）
            bgColor = '#DC143C';
            textColor = '#FFFFFF';
            text = mandalart.center;
        } else {
            // 中目標
            bgColor = '#317873';
            textColor = '#FFFFFF';
            text = mandalart.themes[themeIndex]?.title || '';
        }
        
        // セルの背景色
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // テキスト（シンプル版）
        if (text && text.trim()) {
            ctx.fillStyle = textColor;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // テキストを切り詰め（長すぎる場合）
            const maxWidth = cellSize - 10;
            let displayText = text;
            
            // 文字数制限（日本語は全角、英語は半角で判定）
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
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const pos = gap + i * (cellSize + gap) - gap / 2;
        
        // 縦線
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvasSize);
        ctx.stroke();
        
        // 横線
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvasSize, pos);
        ctx.stroke();
    }
    
    // 外枠（太い赤）
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, canvasSize - 3, canvasSize - 3);
    
    // CanvasをBase64画像に変換してimg要素を返す
    const dataUrl = canvas.toDataURL('image/png');
    return `<img src="${dataUrl}" class="thumbnail-canvas" alt="マンダラートサムネイル">`;
}

// ========================================
// UI制御
// ========================================

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError() {
    document.getElementById('error-message').style.display = 'block';
}

function showEmpty() {
    const container = document.getElementById('mandalart-grid');
    container.innerHTML = '<p class="empty-message">まだマンダラートがありません</p>';
}

function showLoadMore() {
    document.getElementById('load-more-container').style.display = 'block';
}

function hideLoadMore() {
    document.getElementById('load-more-container').style.display = 'none';
}

// ========================================
// ユーティリティ
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
