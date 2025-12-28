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
// 画像保存機能
// ========================================

async function downloadImage() {
    const container = document.getElementById('mandalart-display');
    
    // html2canvasライブラリを動的に読み込み
    if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }

    try {
        // すべてのセルを取得
        const allCells = document.querySelectorAll('.mandalart-cell');
        
        // 元のスタイルを保存
        const originalData = new Map();
        
        // 全セルのスタイルを完全にリセットして再設定
        allCells.forEach(cell => {
            // 元のスタイルを保存
            originalData.set(cell, {
                cssText: cell.style.cssText,
                className: cell.className
            });
            
            // すべてのスタイルをクリア
            cell.style.cssText = '';
            
            // 共通スタイルを設定
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.padding = '8px';
            cell.style.fontSize = '0.85rem';
            cell.style.textAlign = 'center';
            cell.style.wordBreak = 'break-word';
            cell.style.aspectRatio = '1';
            cell.style.position = 'relative';
            cell.style.overflow = 'hidden';
            cell.style.minHeight = '0';
            cell.style.border = 'none';
            cell.style.boxSizing = 'border-box';
            
            // タイプ別の背景色とテキスト色を設定
            if (cell.classList.contains('center')) {
                cell.style.backgroundColor = '#DC143C';
                cell.style.color = 'white';
                cell.style.fontWeight = 'bold';
                cell.style.fontSize = '1.1rem';
            } else if (cell.classList.contains('sub-theme')) {
                cell.style.backgroundColor = '#317873';
                cell.style.color = 'white';
                cell.style.fontWeight = '600';
                cell.style.fontSize = '0.95rem';
            } else {
                cell.style.backgroundColor = 'white';
                cell.style.color = '#333';
            }
        });
        
        // レンダリング完了を待つ（複数回のrequestAnimationFrameで確実に）
        await new Promise(resolve => requestAnimationFrame(() => 
            requestAnimationFrame(() => 
                requestAnimationFrame(resolve)
            )
        ));
        
        const canvas = await html2canvas(container, {
            backgroundColor: '#FFF9F0',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: container.offsetWidth,
            height: container.offsetHeight
        });

        // スタイルとクラスを元に戻す
        originalData.forEach((data, cell) => {
            cell.style.cssText = data.cssText;
            cell.className = data.className;
        });

        // 画像をダウンロード
        const link = document.createElement('a');
        const title = document.getElementById('mandalart-title').textContent;
        link.download = `mandalart_${title}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('画像の保存が完了しました！');
    } catch (error) {
        console.error('画像の保存に失敗:', error);
        alert('画像の保存に失敗しました。スクリーンショットをお試しください。');
    }
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
