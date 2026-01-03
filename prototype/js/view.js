// Supabase設定をインポート
import { getMandalart, submitDeleteRequest, incrementLikeCount, decrementLikeCount } from './supabase-config.js';

// ========================================
// グローバル変数
// ========================================

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
// いいね機能
// ========================================

export async function toggleLike() {
    const mandalartId = window.currentMandalartId;
    
    if (!mandalartId) {
        alert('マンダラートIDが見つかりません');
        return;
    }
    
    const likeBtn = document.getElementById('like-btn');
    const likeIcon = document.getElementById('like-icon');
    const likeCountMeta = document.getElementById('like-count');
    const likeCountBtn = document.getElementById('like-count-btn');
    
    try {
        if (isLiked(mandalartId)) {
            // いいね取り消し
            await decrementLikeCount(mandalartId);
            removeLike(mandalartId);
            likeBtn.classList.remove('liked');
            likeIcon.textContent = '❤️';
            
            const newCount = Math.max(0, parseInt(likeCountBtn.textContent) - 1);
            likeCountMeta.textContent = newCount;
            likeCountBtn.textContent = newCount;
        } else {
            // いいねする
            await incrementLikeCount(mandalartId);
            addLike(mandalartId);
            likeBtn.classList.add('liked');
            likeIcon.textContent = '💗';
            
            const newCount = parseInt(likeCountBtn.textContent) + 1;
            likeCountMeta.textContent = newCount;
            likeCountBtn.textContent = newCount;
        }
    } catch (error) {
        console.error('いいね処理エラー:', error);
        alert('いいね処理に失敗しました。');
    }
}

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMandalart();
});

// ========================================
// マンダラート読み込み
// ========================================

async function loadMandalart() {
    // URLパラメータからIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const mandalartId = urlParams.get('id');
    
    let data;
    let userName = '匿名さん';  // デフォルト値
    let ogImageUrl = '';  // OG画像URL
    let likeCount = 0;  // いいね数
    
    if (mandalartId) {
        // SupabaseからデータをID取得
        try {
            console.log('Supabaseからデータ取得中...', mandalartId);
            const mandalart = await getMandalart(mandalartId);
            
            // Supabaseのデータ形式から変換
            data = {
                center: mandalart.center,
                themes: mandalart.themes,
                createdAt: mandalart.created_at
            };
            
            // ユーザー名を取得
            userName = mandalart.user_display_name || '匿名さん';
            
            // OG画像URLを取得
            ogImageUrl = mandalart.og_image_url || '';
            
            // いいね数を取得
            likeCount = mandalart.like_count || 0;
            
            console.log('データ取得成功:', data);
            console.log('OG画像URL:', ogImageUrl);
            console.log('いいね数:', likeCount);
            
            // OGPメタタグを更新
            updateOGPMetaTags(data.center, userName, ogImageUrl);
            
            // いいねボタンの状態を設定
            updateLikeButtonState(mandalartId, likeCount);
        } catch (error) {
            console.error('データ取得エラー:', error);
            alert('マンダラートの読み込みに失敗しました');
            window.location.href = 'index.html';
            return;
        }
    } else {
        // フォールバック: ローカルストレージからデータを取得（後方互換性）
        const savedData = localStorage.getItem('current-mandalart');
        
        if (!savedData) {
            alert('マンダラートが見つかりません');
            window.location.href = 'create.html';
            return;
        }
        
        data = JSON.parse(savedData);
    }
    
    // メタ情報を表示
    document.getElementById('mandalart-title').textContent = data.center;
    document.getElementById('user-name').textContent = userName;
    
    const createdDate = new Date(data.createdAt);
    document.getElementById('created-date').textContent = 
        `${createdDate.getFullYear()}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(createdDate.getDate()).padStart(2, '0')}`;
    
    // 9x9マンダラートを表示
    displayFullMandalart(data);
    
    // スマホ版では画像も生成
    if (window.innerWidth < 768) {
        generateMandalartImage(data);
    }
    
    // グローバルに保存（画像ダウンロード・Twitter投稿・削除リクエスト・いいね用）
    window.currentMandalartData = data;
    window.currentMandalartId = mandalartId;
    window.currentOGImageUrl = ogImageUrl;
}

// ========================================
// いいねボタンの状態を更新
// ========================================

function updateLikeButtonState(mandalartId, likeCount) {
    const likeBtn = document.getElementById('like-btn');
    const likeIcon = document.getElementById('like-icon');
    
    if (isLiked(mandalartId)) {
        likeBtn.classList.add('liked');
        likeIcon.textContent = '💗';
    }
}

// ========================================
// OGPメタタグ更新
// ========================================

function updateOGPMetaTags(title, userName, ogImageUrl) {
    const currentUrl = window.location.href;
    const description = `${userName}さんの目標「${title}」- みんなのマンダラートで作成`;
    
    // OGPタグ更新
    document.getElementById('og-title').setAttribute('content', `${title} - みんなのマンダラート`);
    document.getElementById('og-description').setAttribute('content', description);
    document.getElementById('og-url').setAttribute('content', currentUrl);
    
    if (ogImageUrl) {
        document.getElementById('og-image').setAttribute('content', ogImageUrl);
    }
    
    // Twitter Cardタグ更新
    document.getElementById('twitter-title').setAttribute('content', `${title} - みんなのマンダラート`);
    document.getElementById('twitter-description').setAttribute('content', description);
    
    if (ogImageUrl) {
        document.getElementById('twitter-image').setAttribute('content', ogImageUrl);
    }
    
    // HTMLタイトルも更新
    document.title = `${title} - みんなのマンダラート`;
}

// ========================================
// 9x9マンダラート表示
// ========================================

function displayFullMandalart(data) {
    const container = document.getElementById('mandalart-display');
    container.innerHTML = '';

    // 9x9 = 81セルを正しく生成
    for (let i = 0; i < 81; i++) {
        const cellData = getCellData(data, i);
        const cell = document.createElement('div');
        cell.className = 'mandalart-cell';
        cell.style.setProperty('--cell-index', i);
        
        // セルのタイプに応じてクラスを追加
        if (cellData.type === 'center') {
            cell.classList.add('center');
        } else if (cellData.type === 'sub-theme') {
            cell.classList.add('sub-theme');
        } else if (cellData.type === 'detail') {
            cell.classList.add('detail');
        }
        
        cell.textContent = cellData.content;
        container.appendChild(cell);
    }
}

// ========================================
// セルデータ取得（create.jsと同じロジック）
// ========================================

function getCellData(data, index) {
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
// モバイル用: 画像生成
// ========================================

function generateMandalartImage(data) {
    const cellSize = 100;
    const gap = 2;
    const canvasSize = cellSize * 9 + gap * 10;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    
    // 背景色（白）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // 各セルを描画
    for (let i = 0; i < 81; i++) {
        const cellData = getCellData(data, i);
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
        }
        
        // テキスト
        const text = cellData.content.trim();
        if (text) {
            if (cellData.type === 'center' || cellData.type === 'sub-theme') {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 14px sans-serif';
            } else {
                ctx.fillStyle = '#333333';
                ctx.font = '12px sans-serif';
            }
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const maxWidth = cellSize - 10;
            const lines = wrapText(ctx, text, maxWidth);
            const lineHeight = 18;
            const totalHeight = lines.length * lineHeight;
            const startY = y + (cellSize - totalHeight) / 2 + lineHeight / 2;
            
            lines.forEach((line, i) => {
                ctx.fillText(line, x + cellSize / 2, startY + i * lineHeight);
            });
        }
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
    ctx.lineWidth = 3;
    
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
    
    // 画像をimgタグに設定
    const img = document.getElementById('mandalart-image');
    img.src = canvas.toDataURL('image/png');
}

// ========================================
// シェア機能
// ========================================

export function shareMandalart() {
    const shareData = {
        title: 'みんなのマンダラート',
        text: document.getElementById('mandalart-title').textContent,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('共有成功'))
            .catch((error) => console.log('共有エラー:', error));
    } else {
        // Web Share API非対応の場合はURLをコピー
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert('URLをクリップボードにコピーしました！'))
            .catch(() => alert('URLのコピーに失敗しました'));
    }
}

// ========================================
// Twitter投稿機能
// ========================================

export function shareToTwitter() {
    const title = document.getElementById('mandalart-title').textContent;
    const url = window.location.href;
    
    // ツイート本文を作成
    const text = `私の目標は「${title}」です！\n #みんなのマンダラート ${url}`;
    
    // Twitter Web Intent URL（URLはテキストに含まれているのでurlパラメータは不要）
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    // 新しいウィンドウでTwitterを開く
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// ========================================
// 削除リクエスト機能
// ========================================

export async function requestDelete(reason) {
    try {
        const mandalartId = window.currentMandalartId;
        
        if (!mandalartId) {
            alert('マンダラートIDが見つかりません');
            return;
        }
        
        await submitDeleteRequest(mandalartId, reason);
        
        alert('削除リクエストを送信しました。\n管理者が確認後、削除されます。');
    } catch (error) {
        console.error('削除リクエスト送信エラー:', error);
        alert('削除リクエストの送信に失敗しました。');
    }
}

// ========================================
// 画像保存機能（Canvas API直接描画）
// ========================================

export async function downloadImage() {
    try {
        // グローバルに保存されたデータを使用
        const data = window.currentMandalartData;
        if (!data) {
            alert('データが読み込まれていません');
            return;
        }
        
        const cellSize = 100;
        const gap = 2;
        const canvasSize = cellSize * 9 + gap * 10;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        // 背景色（白）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // 各セルを描画
        for (let i = 0; i < 81; i++) {
            const cellData = getCellData(data, i);
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
            }
            
            // テキスト
            const text = cellData.content.trim();
            if (text) {
                if (cellData.type === 'center' || cellData.type === 'sub-theme') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 14px sans-serif';
                } else {
                    ctx.fillStyle = '#333333';
                    ctx.font = '12px sans-serif';
                }
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const maxWidth = cellSize - 10;
                const lines = wrapText(ctx, text, maxWidth);
                const lineHeight = 18;
                const totalHeight = lines.length * lineHeight;
                const startY = y + (cellSize - totalHeight) / 2 + lineHeight / 2;
                
                lines.forEach((line, i) => {
                    ctx.fillText(line, x + cellSize / 2, startY + i * lineHeight);
                });
            }
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
        ctx.lineWidth = 3;
        
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
        
        // 画像をダウンロード
        const link = document.createElement('a');
        const title = document.getElementById('mandalart-title').textContent;
        link.download = `mandalart_${title}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('画像の保存が完了しました！');
    } catch (error) {
        console.error('画像の保存に失敗:', error);
        alert('画像の保存に失敗しました。');
    }
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
    
    return lines;
}

// ========================================
// キーボードショートカット
// ========================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S で画像保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadImage();
    }
    
    // Ctrl/Cmd + K でシェア
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        shareMandalart();
    }
});
