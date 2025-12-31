// Supabase設定をインポート
import { getPublicMandalarts } from './supabase-config.js';

// ========================================
// グローバル変数
// ========================================

let currentOffset = 0;
const ITEMS_PER_PAGE = 20;
let isLoading = false;
let hasMore = true;

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMandalarts();
    
    // もっと見るボタン
    document.getElementById('load-more-btn').addEventListener('click', loadMore);
});

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
    card.onclick = () => {
        window.location.href = `view.html?id=${mandalart.id}`;
    };
    
    // サムネイル画像を生成
    const thumbnail = generateThumbnail(mandalart);
    
    // 日付フォーマット
    const date = new Date(mandalart.created_at);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    
    card.innerHTML = `
        <div class="card-image">
            ${thumbnail}
        </div>
        <div class="card-content">
            <h3 class="card-title">${escapeHtml(mandalart.center)}</h3>
            <div class="card-meta">
                <span class="meta-item">📅 ${dateStr}</span>
                <span class="meta-item">👁️ ${mandalart.view_count || 0}</span>
            </div>
        </div>
    `;
    
    return card;
}

// ========================================
// サムネイル生成（Canvas API）
// ========================================

function generateThumbnail(mandalart) {
    const cellSize = 30;
    const gap = 1;
    const canvasSize = cellSize * 9 + gap * 10;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.className = 'thumbnail-canvas';
    const ctx = canvas.getContext('2d');
    
    // 背景色（白）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // 各セルを描画
    for (let i = 0; i < 81; i++) {
        const cellData = getCellData(mandalart, i);
        const row = Math.floor(i / 9);
        const col = i % 9;
        const x = gap + col * (cellSize + gap);
        const y = gap + row * (cellSize + gap);
        
        // セルの背景色
        if (cellData.type === 'center') {
            ctx.fillStyle = '#DC143C';
            ctx.fillRect(x, y, cellSize, cellSize);
        } else if (cellData.type === 'sub-theme') {
            ctx.fillStyle = '#317873';
            ctx.fillRect(x, y, cellSize, cellSize);
        } else {
            // 個別目標は白背景のまま
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, y, cellSize, cellSize);
        }
        
        // 小さすぎるのでテキストは描画しない（色だけで判別）
    }
    
    // グリッド線（薄いグレー）
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i++) {
        const x = gap + i * (cellSize + gap) - gap / 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
        ctx.stroke();
        
        const y = gap + i * (cellSize + gap) - gap / 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
        ctx.stroke();
    }
    
    // 3x3ブロックの境界線（太い赤）
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= 3; i++) {
        const x = gap + i * 3 * (cellSize + gap) - gap / 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
        ctx.stroke();
        
        const y = gap + i * 3 * (cellSize + gap) - gap / 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
        ctx.stroke();
    }
    
    return canvas.outerHTML;
}

// ========================================
// セルデータ取得（view.jsと同じロジック）
// ========================================

function getCellData(mandalart, index) {
    const data = {
        center: mandalart.center,
        themes: mandalart.themes
    };
    
    // 位置情報を計算
    const blockRow = Math.floor(index / 27);
    const blockCol = Math.floor((index % 9) / 3);
    const innerRow = Math.floor((index % 27) / 9);
    const innerCol = (index % 9) % 3;
    
    // セルの種類を判定
    const isCenterBlock = (blockRow === 1 && blockCol === 1);
    const isCenterCell = (innerRow === 1 && innerCol === 1);
    
    if (isCenterBlock && isCenterCell) {
        // 大目標
        return {
            type: 'center',
            content: data.center
        };
    } else if (isCenterBlock) {
        // 中目標（中央ブロック）
        const themeIndex = getThemeIndexFromInner(innerRow, innerCol);
        return {
            type: 'sub-theme',
            content: data.themes[themeIndex]?.title || ''
        };
    } else if (isCenterCell) {
        // 中目標（周辺ブロックの中心）
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        return {
            type: 'sub-theme',
            content: data.themes[themeIndex]?.title || ''
        };
    } else {
        // 個別目標
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        const detailIndex = getDetailIndexFromInner(innerRow, innerCol);
        return {
            type: 'detail',
            content: data.themes[themeIndex]?.details[detailIndex] || ''
        };
    }
}

function getThemeIndexFromInner(innerRow, innerCol) {
    const positions = [
        [0, 1, 2],
        [3, -1, 4],
        [5, 6, 7]
    ];
    return positions[innerRow][innerCol];
}

function getThemeIndexFromBlock(blockRow, blockCol) {
    const positions = [
        [0, 1, 2],
        [3, -1, 4],
        [5, 6, 7]
    ];
    return positions[blockRow][blockCol];
}

function getDetailIndexFromInner(innerRow, innerCol) {
    const positions = [
        [0, 1, 2],
        [3, -1, 4],
        [5, 6, 7]
    ];
    return positions[innerRow][innerCol];
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
