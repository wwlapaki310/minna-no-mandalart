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

    // 9x9 = 81セルを生成
    // レイアウト:
    // [0-8]   [9-17]   [18-26]
    // [27-35] [36-44]  [45-53]
    // [54-62] [63-71]  [72-80]

    const layout = buildFullLayout(data);
    
    layout.forEach((cellData, index) => {
        const cell = document.createElement('div');
        cell.className = 'mandalart-cell';
        cell.style.setProperty('--cell-index', index);
        
        // セルのタイプに応じてクラスを追加
        if (cellData.type === 'center') {
            cell.classList.add('center');
        } else if (cellData.type === 'sub-theme') {
            cell.classList.add('sub-theme');
        }
        
        cell.textContent = cellData.content;
        container.appendChild(cell);
    });
}

// ========================================
// 9x9レイアウト構築
// ========================================

function buildFullLayout(data) {
    const layout = [];
    
    // 3x3のブロック配置
    // ブロック番号:
    // [0] [1] [2]
    // [3] [4] [5]
    // [6] [7] [8]
    
    const blockOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    
    blockOrder.forEach(blockIndex => {
        const blockCells = buildBlock(data, blockIndex);
        layout.push(...blockCells);
    });
    
    return layout;
}

// ========================================
// 各3x3ブロックを構築
// ========================================

function buildBlock(data, blockIndex) {
    const cells = [];
    
    if (blockIndex === 4) {
        // 中央ブロック: メインゴールと8つのサブテーマ
        const centerLayout = [
            0, 1, 2,
            3, -1, 4,  // -1 = center
            5, 6, 7
        ];
        
        centerLayout.forEach(themeIndex => {
            if (themeIndex === -1) {
                cells.push({
                    type: 'center',
                    content: data.center
                });
            } else {
                cells.push({
                    type: 'sub-theme',
                    content: data.themes[themeIndex]?.title || ''
                });
            }
        });
    } else {
        // 周辺ブロック: 各サブテーマの詳細
        const themeIndex = blockIndex > 4 ? blockIndex - 1 : blockIndex;
        const theme = data.themes[themeIndex];
        
        if (theme) {
            // 中央にサブテーマタイトル
            const detailLayout = [
                0, 1, 2,
                3, -1, 4,  // -1 = sub-theme title
                5, 6, 7
            ];
            
            detailLayout.forEach(detailIndex => {
                if (detailIndex === -1) {
                    cells.push({
                        type: 'sub-theme',
                        content: theme.title
                    });
                } else {
                    cells.push({
                        type: 'detail',
                        content: theme.details[detailIndex] || ''
                    });
                }
            });
        } else {
            // データがない場合は空セル
            for (let i = 0; i < 9; i++) {
                cells.push({ type: 'empty', content: '' });
            }
        }
    }
    
    return cells;
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
        const canvas = await html2canvas(container, {
            backgroundColor: '#FFF9F0',
            scale: 2,
            logging: false
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
