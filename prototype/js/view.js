// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMandalart();
});

// ========================================
// マンダラート読み込み
// ========================================

function loadMandalart() {
    // ローカルストレージからデータを取得
    const savedData = localStorage.getItem('current-mandalart');
    
    if (!savedData) {
        alert('マンダラートが見つかりません');
        window.location.href = 'create.html';
        return;
    }

    const data = JSON.parse(savedData);
    
    // メタ情報を表示
    document.getElementById('mandalart-title').textContent = data.center;
    document.getElementById('author-name').textContent = '匿名ユーザー';
    
    const createdDate = new Date(data.createdAt);
    document.getElementById('created-date').textContent = 
        `${createdDate.getFullYear()}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(createdDate.getDate()).padStart(2, '0')}`;
    
    // 9x9マンダラートを表示
    displayFullMandalart(data);
    
    // モバイル用セクション別表示
    displayMobileSections(data);
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
// モバイル用セクション別表示
// ========================================

function displayMobileSections(data) {
    const container = document.getElementById('mobile-sections');
    container.innerHTML = '';

    // 中央のメインゴール
    const centerSection = document.createElement('div');
    centerSection.className = 'mobile-section';
    centerSection.innerHTML = `
        <div class="mobile-center">
            ${data.center}
        </div>
    `;
    container.appendChild(centerSection);

    // 各テーマごとのセクション
    data.themes.forEach((theme, index) => {
        if (!theme.title.trim()) return;

        const section = document.createElement('div');
        section.className = 'mobile-section';

        const header = document.createElement('div');
        header.className = 'mobile-section-header';
        header.textContent = `${index + 1}. ${theme.title}`;

        const details = document.createElement('div');
        details.className = 'mobile-details';

        theme.details.forEach((detail, detailIndex) => {
            if (!detail.trim()) return;

            const item = document.createElement('div');
            item.className = 'mobile-detail-item';
            item.innerHTML = `
                <span class="mobile-detail-number">${detailIndex + 1}</span>
                ${detail}
            `;
            details.appendChild(item);
        });

        section.appendChild(header);
        section.appendChild(details);
        container.appendChild(section);
    });
}

// ========================================
// シェア機能
// ========================================

function shareMandalart() {
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
// 画像保存機能（Canvas API直接描画）
// ========================================

async function downloadImage() {
    try {
        // セルデータを取得
        const cells = document.querySelectorAll('.mandalart-cell');
        const cellSize = 100; // 各セルのサイズ（ピクセル）
        const gap = 2; // セル間の隙間
        const canvasSize = cellSize * 9 + gap * 10; // 9x9グリッド + 隙間
        
        // Canvasを作成
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        // 背景色（白）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // 各セルを描画
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const x = gap + col * (cellSize + gap);
            const y = gap + row * (cellSize + gap);
            
            // セルの背景色（色付きセルのみ描画）
            if (cell.classList.contains('center')) {
                ctx.fillStyle = '#DC143C'; // 紅白の赤
                ctx.fillRect(x, y, cellSize, cellSize);
            } else if (cell.classList.contains('sub-theme')) {
                ctx.fillStyle = '#317873'; // 松葉色
                ctx.fillRect(x, y, cellSize, cellSize);
            }
            // detail（白）は塗りつぶさない
            
            // テキスト
            const text = cell.textContent.trim();
            if (text) {
                // テキスト色
                if (cell.classList.contains('center') || cell.classList.contains('sub-theme')) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
                } else {
                    ctx.fillStyle = '#333333';
                    ctx.font = '12px "Noto Sans JP", sans-serif';
                }
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 改行処理
                const maxWidth = cellSize - 10;
                const lines = wrapText(ctx, text, maxWidth);
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
        for (let i = 0; i <= 9; i++) {
            // 縦線
            const x = gap + i * (cellSize + gap) - gap / 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasSize);
            ctx.stroke();
            
            // 横線
            const y = gap + i * (cellSize + gap) - gap / 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasSize, y);
            ctx.stroke();
        }
        
        // 3x3ブロックの境界線（太い赤）
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 3;
        
        // 縦線
        for (let i = 0; i <= 3; i++) {
            const x = gap + i * 3 * (cellSize + gap) - gap / 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasSize);
            ctx.stroke();
        }
        
        // 横線
        for (let i = 0; i <= 3; i++) {
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
