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
    
    // サムネイル画像を生成（3x3のみ）
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
// サムネイル生成（3x3の中央ブロックのみ）
// ========================================

function generateThumbnail(mandalart) {
    const cellSize = 80;  // セルサイズを大きく
    const gap = 2;
    const canvasSize = cellSize * 3 + gap * 4;  // 3x3グリッド
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.className = 'thumbnail-canvas';
    const ctx = canvas.getContext('2d');
    
    // 背景色（白）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // 中央3x3ブロックのレイアウト
    // [0, 1, 2]
    // [3, 中央, 4]
    // [5, 6, 7]
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
        
        let bgColor, textColor, text, isBold;
        
        if (themeIndex === -1) {
            // 大目標（中央）
            bgColor = '#DC143C';
            textColor = '#FFFFFF';
            text = mandalart.center;
            isBold = true;
        } else {
            // 中目標
            bgColor = '#317873';
            textColor = '#FFFFFF';
            text = mandalart.themes[themeIndex]?.title || '';
            isBold = true;
        }
        
        // セルの背景色
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // テキスト
        if (text && text.trim()) {
            ctx.fillStyle = textColor;
            ctx.font = isBold ? 'bold 14px sans-serif' : '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const maxWidth = cellSize - 10;
            const lines = wrapText(ctx, text.trim(), maxWidth);
            const lineHeight = 18;
            const totalHeight = lines.length * lineHeight;
            const startY = y + (cellSize - totalHeight) / 2 + lineHeight / 2;
            
            lines.forEach((line, i) => {
                ctx.fillText(line, x + cellSize / 2, startY + i * lineHeight);
            });
        }
    });
    
    // グリッド線（薄いグレー）
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
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
    
    // 外枠（太い赤）
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, canvasSize - 3, canvasSize - 3);
    
    return canvas.outerHTML;
}

// テキストを折り返す関数
function wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    // 最大3行まで
    return lines.slice(0, 3);
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
