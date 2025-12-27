// マンダラートデータ構造
const mandalartData = {
    center: '',
    themes: [
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] },
        { title: '', details: ['', '', '', '', '', '', '', ''] }
    ]
};

let currentStep = 1;
let currentTheme = 0;

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updatePreview();
});

// ========================================
// イベントリスナー設定
// ========================================

function initializeEventListeners() {
    // モード切替
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            switchMode(mode);
        });
    });

    // Step 1: 中心目標
    const centerInput = document.getElementById('center-goal');
    const centerCount = document.getElementById('center-count');
    
    centerInput.addEventListener('input', (e) => {
        const value = e.target.value;
        centerCount.textContent = value.length;
        mandalartData.center = value;
        updatePreview();
    });

    document.getElementById('step1-next').addEventListener('click', () => {
        if (mandalartData.center.trim()) {
            goToStep(2);
        } else {
            alert('メインゴールを入力してください');
        }
    });

    // Step 2: 8つのテーマ
    document.querySelectorAll('.theme-input input').forEach((input, index) => {
        input.addEventListener('input', (e) => {
            mandalartData.themes[index].title = e.target.value;
            updatePreview();
        });
    });

    document.getElementById('step2-back').addEventListener('click', () => {
        goToStep(1);
    });

    document.getElementById('step2-next').addEventListener('click', () => {
        const filledThemes = mandalartData.themes.filter(t => t.title.trim()).length;
        if (filledThemes >= 8) {
            initializeStep3();
            goToStep(3);
        } else {
            alert(`8つ全てのテーマを入力してください（現在${filledThemes}/8）`);
        }
    });

    // Step 3: 戻るボタン
    document.getElementById('step3-back').addEventListener('click', () => {
        goToStep(2);
    });

    // Step 3: 完成ボタン
    document.getElementById('step3-complete').addEventListener('click', () => {
        completeMandalart();
    });

    // グリッド完成ボタン
    document.getElementById('grid-complete').addEventListener('click', () => {
        saveGridData();
        completeMandalart();
    });
}

// ========================================
// モード切替
// ========================================

function switchMode(mode) {
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // モードの表示切替
    if (mode === 'guided') {
        document.getElementById('guided-mode').classList.remove('hidden');
        document.getElementById('grid-mode').classList.add('hidden');
    } else {
        document.getElementById('guided-mode').classList.add('hidden');
        document.getElementById('grid-mode').classList.remove('hidden');
        initializeGridMode();
    }
}

// ========================================
// ステップ遷移
// ========================================

function goToStep(step) {
    currentStep = step;

    // ステップインジケーターを更新
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 === step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // ステップコンテンツを更新
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`.step-content[data-step="${step}"]`).classList.add('active');

    // Step 2に移行する際、中心プレビューを更新
    if (step === 2) {
        document.getElementById('center-preview').textContent = mandalartData.center;
    }

    // スクロールをトップに
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// Step 3の初期化
// ========================================

function initializeStep3() {
    const tabsContainer = document.getElementById('theme-tabs');
    const detailsContainer = document.getElementById('details-container');

    // タブをクリア
    tabsContainer.innerHTML = '';
    detailsContainer.innerHTML = '';

    // 各テーマのタブと入力フォームを作成
    mandalartData.themes.forEach((theme, themeIndex) => {
        if (!theme.title.trim()) return;

        // タブを作成
        const tab = document.createElement('button');
        tab.className = `theme-tab ${themeIndex === 0 ? 'active' : ''}`;
        tab.textContent = theme.title;
        tab.dataset.theme = themeIndex;
        tab.addEventListener('click', () => switchTheme(themeIndex));
        tabsContainer.appendChild(tab);

        // 詳細入力フォームを作成
        const detailsDiv = document.createElement('div');
        detailsDiv.className = `details-grid ${themeIndex === 0 ? '' : 'hidden'}`;
        detailsDiv.dataset.theme = themeIndex;

        const themeTitle = document.createElement('h4');
        themeTitle.className = 'details-theme-title';
        themeTitle.textContent = `📌 ${theme.title}`;
        detailsDiv.appendChild(themeTitle);

        const grid = document.createElement('div');
        grid.className = 'details-inputs';

        for (let i = 0; i < 8; i++) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'detail-input';

            const label = document.createElement('label');
            label.textContent = `行動 ${i + 1}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `具体的な行動を入力`;
            input.maxLength = 50;
            input.value = theme.details[i] || '';
            input.addEventListener('input', (e) => {
                mandalartData.themes[themeIndex].details[i] = e.target.value;
                updatePreview();
            });

            inputDiv.appendChild(label);
            inputDiv.appendChild(input);
            grid.appendChild(inputDiv);
        }

        detailsDiv.appendChild(grid);
        detailsContainer.appendChild(detailsDiv);
    });
}

// ========================================
// テーマ切替
// ========================================

function switchTheme(themeIndex) {
    currentTheme = themeIndex;

    // タブのアクティブ状態を更新
    document.querySelectorAll('.theme-tab').forEach((tab, index) => {
        if (index === themeIndex) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // 詳細フォームの表示切替
    document.querySelectorAll('.details-grid').forEach((grid, index) => {
        if (parseInt(grid.dataset.theme) === themeIndex) {
            grid.classList.remove('hidden');
        } else {
            grid.classList.add('hidden');
        }
    });
}

// ========================================
// グリッドモード初期化
// ========================================

function initializeGridMode() {
    const gridContainer = document.getElementById('mandalart-grid');
    gridContainer.innerHTML = '';

    // 9x9のグリッドを作成
    // グリッドの配置：
    // [0-8]   [9-17]   [18-26]
    // [27-35] [36-44]  [45-53]
    // [54-62] [63-71]  [72-80]
    
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('input');
        cell.type = 'text';
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        cell.placeholder = '';
        cell.maxLength = 30;
        
        // 各3x3ブロックの中心セル（中目標と大目標）を判定
        const blockRow = Math.floor(i / 27); // 0, 1, 2
        const blockCol = Math.floor((i % 9) / 3); // 0, 1, 2
        const innerRow = Math.floor((i % 27) / 9); // 0, 1, 2
        const innerCol = (i % 9) % 3; // 0, 1, 2
        
        // 各ブロック内の中心セル（innerRow=1, innerCol=1）
        if (innerRow === 1 && innerCol === 1) {
            if (blockRow === 1 && blockCol === 1) {
                // 中央ブロックの中心 = 大目標
                cell.classList.add('center-cell');
                cell.placeholder = '大目標';
            } else {
                // 周辺ブロックの中心 = 中目標
                cell.classList.add('sub-theme-cell');
                cell.placeholder = '中目標';
            }
        }
        
        // 既存データがあれば設定
        const cellData = getGridCellData(i);
        if (cellData) {
            cell.value = cellData;
        }

        gridContainer.appendChild(cell);
    }
}

// ========================================
// グリッドセルのデータ取得
// ========================================

function getGridCellData(index) {
    // インデックスから位置を計算
    const blockRow = Math.floor(index / 27);
    const blockCol = Math.floor((index % 9) / 3);
    const innerRow = Math.floor((index % 27) / 9);
    const innerCol = (index % 9) % 3;
    
    // 中央ブロック
    if (blockRow === 1 && blockCol === 1) {
        if (innerRow === 1 && innerCol === 1) {
            return mandalartData.center;
        } else {
            // 中目標の位置を計算
            const themeIndex = getThemeIndexFromInner(innerRow, innerCol);
            return mandalartData.themes[themeIndex]?.title || '';
        }
    } else {
        // 周辺ブロック
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        if (innerRow === 1 && innerCol === 1) {
            return mandalartData.themes[themeIndex]?.title || '';
        } else {
            const detailIndex = getDetailIndexFromInner(innerRow, innerCol);
            return mandalartData.themes[themeIndex]?.details[detailIndex] || '';
        }
    }
}

// ========================================
// インデックス変換ヘルパー
// ========================================

function getThemeIndexFromInner(innerRow, innerCol) {
    // 中央ブロック内の位置から中目標インデックスを取得
    const positions = [
        [0, 1, 2],
        [3, -1, 4],
        [5, 6, 7]
    ];
    return positions[innerRow][innerCol];
}

function getThemeIndexFromBlock(blockRow, blockCol) {
    // ブロック位置から中目標インデックスを取得
    if (blockRow === 1 && blockCol === 1) return -1; // 中央
    
    const blockPositions = [
        [0, 1, 2],
        [3, -1, 4],
        [5, 6, 7]
    ];
    return blockPositions[blockRow][blockCol];
}

function getDetailIndexFromInner(innerRow, innerCol) {
    // ブロック内の位置から個別目標インデックスを取得
    const positions = [
        [0, 1, 2],
        [3, -1, 4],
        [5, 6, 7]
    ];
    return positions[innerRow][innerCol];
}

// ========================================
// グリッドデータの保存
// ========================================

function saveGridData() {
    const cells = document.querySelectorAll('.grid-cell');
    
    cells.forEach((cell, index) => {
        const value = cell.value.trim();
        const blockRow = Math.floor(index / 27);
        const blockCol = Math.floor((index % 9) / 3);
        const innerRow = Math.floor((index % 27) / 9);
        const innerCol = (index % 9) % 3;
        
        // 中央ブロック
        if (blockRow === 1 && blockCol === 1) {
            if (innerRow === 1 && innerCol === 1) {
                mandalartData.center = value;
            } else {
                const themeIndex = getThemeIndexFromInner(innerRow, innerCol);
                if (themeIndex >= 0) {
                    mandalartData.themes[themeIndex].title = value;
                }
            }
        } else {
            // 周辺ブロック
            const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
            if (themeIndex >= 0) {
                if (innerRow === 1 && innerCol === 1) {
                    mandalartData.themes[themeIndex].title = value;
                } else {
                    const detailIndex = getDetailIndexFromInner(innerRow, innerCol);
                    if (detailIndex >= 0) {
                        mandalartData.themes[themeIndex].details[detailIndex] = value;
                    }
                }
            }
        }
    });
}

// ========================================
// プレビュー更新（編集可能版）
// ========================================

function updatePreview() {
    const previewContainer = document.getElementById('mandalart-preview');
    previewContainer.innerHTML = '';

    // 編集可能なプレビュー: 中央ブロック（3x3）
    const preview = document.createElement('div');
    preview.className = 'preview-grid';

    // 3x3のレイアウト
    const layout = [
        0, 1, 2,
        3, -1, 4,
        5, 6, 7
    ];
    
    layout.forEach(themeIndex => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell editable';
        
        // インライン編集用のcontenteditable
        const input = document.createElement('div');
        input.contentEditable = true;
        input.className = 'preview-input';
        
        if (themeIndex === -1) {
            // 大目標
            cell.classList.add('preview-center');
            input.textContent = mandalartData.center || '';
            input.setAttribute('placeholder', '大目標');
            input.dataset.type = 'center';
            
            input.addEventListener('blur', (e) => {
                const newValue = e.target.textContent.trim();
                mandalartData.center = newValue;
                // Step 1の入力欄も更新
                const centerInput = document.getElementById('center-goal');
                if (centerInput) {
                    centerInput.value = newValue;
                    document.getElementById('center-count').textContent = newValue.length;
                }
            });
        } else {
            // 中目標
            cell.classList.add('preview-theme');
            input.textContent = mandalartData.themes[themeIndex]?.title || '';
            input.setAttribute('placeholder', `中目標${themeIndex + 1}`);
            input.dataset.type = 'theme';
            input.dataset.index = themeIndex;
            
            input.addEventListener('blur', (e) => {
                const newValue = e.target.textContent.trim();
                mandalartData.themes[themeIndex].title = newValue;
                // Step 2の入力欄も更新
                const themeInputs = document.querySelectorAll('.theme-input input');
                if (themeInputs[themeIndex]) {
                    themeInputs[themeIndex].value = newValue;
                }
            });
        }
        
        // Enterキーで次のセルに移動
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
        
        cell.appendChild(input);
        preview.appendChild(cell);
    });

    previewContainer.appendChild(preview);
}

// ========================================
// 完成処理
// ========================================

function completeMandalart() {
    // データ検証
    const hasCenter = mandalartData.center.trim();
    const filledThemes = mandalartData.themes.filter(t => t.title.trim()).length;
    const totalDetails = mandalartData.themes.reduce((sum, t) => {
        return sum + t.details.filter(d => d.trim()).length;
    }, 0);

    if (!hasCenter) {
        alert('大目標を入力してください');
        return;
    }

    if (filledThemes < 8) {
        alert('8つ全ての中目標を入力してください');
        return;
    }

    if (totalDetails < 32) {
        alert('各中目標の個別目標をもっと入力してください（最低でも各テーマ4つずつ）');
        return;
    }

    // ローカルストレージに保存
    const savedData = {
        ...mandalartData,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('current-mandalart', JSON.stringify(savedData));

    // 確認メッセージ
    if (confirm('マンダラートが完成しました！\n表示ページに移動しますか？')) {
        window.location.href = 'view.html';
    }
}

// ========================================
// スタイルを追加
// ========================================

const style = document.createElement('style');
style.textContent = `
    .theme-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
    }

    .theme-tab {
        padding: 0.75rem 1.5rem;
        background: white;
        border: 2px solid var(--color-pine);
        color: var(--color-pine);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        font-weight: 600;
    }

    .theme-tab.active {
        background: var(--color-pine);
        color: white;
    }

    .details-theme-title {
        font-size: 1.2rem;
        color: var(--color-red);
        margin-bottom: 1rem;
    }

    .details-inputs {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .detail-input label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--color-pine);
        margin-bottom: 0.25rem;
    }

    .detail-input input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 2px solid var(--color-border);
        border-radius: 4px;
        transition: all 0.3s ease;
    }

    .detail-input input:focus {
        outline: none;
        border-color: var(--color-pine);
        box-shadow: 0 0 0 3px rgba(49, 120, 115, 0.1);
    }

    .preview-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        max-width: 600px;
        margin: 0 auto;
    }

    .preview-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border: 2px solid var(--color-border);
        border-radius: 8px;
        font-size: 0.85rem;
        text-align: center;
        word-break: break-word;
        position: relative;
        transition: all 0.3s ease;
    }

    .preview-cell.editable {
        cursor: text;
    }

    .preview-cell.editable:hover {
        border-color: var(--color-pine);
        box-shadow: 0 0 0 3px rgba(49, 120, 115, 0.1);
    }

    .preview-input {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        padding: 0.25rem;
    }

    .preview-input:empty:before {
        content: attr(placeholder);
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
    }

    .preview-center {
        background: linear-gradient(135deg, var(--color-gold), var(--color-red));
        color: white;
        font-weight: bold;
        font-size: 1rem;
    }

    .preview-center .preview-input:empty:before {
        color: rgba(255, 255, 255, 0.6);
    }

    .preview-theme {
        background: var(--color-pine-light);
        color: white;
        font-weight: 600;
    }

    .preview-theme .preview-input:empty:before {
        color: rgba(255, 255, 255, 0.5);
    }

    #mandalart-grid {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        gap: 2px;
        max-width: 900px;
        margin: 0 auto 2rem;
        background: var(--color-border);
        padding: 2px;
        border: 3px solid var(--color-red);
        border-radius: 8px;
    }

    .grid-cell {
        padding: 0.5rem;
        border: none;
        font-size: 0.75rem;
        background: white;
        text-align: center;
    }

    .grid-cell:focus {
        outline: 2px solid var(--color-pine);
        z-index: 10;
    }

    .grid-cell.center-cell {
        background: linear-gradient(135deg, var(--color-gold), var(--color-red));
        color: white;
        font-weight: bold;
    }

    .grid-cell.sub-theme-cell {
        background: var(--color-pine-light);
        color: white;
        font-weight: 600;
    }

    /* 3x3ブロックの境界を強調 */
    .grid-cell:nth-child(3n) {
        border-right: 2px solid var(--color-red);
    }

    .grid-cell:nth-child(n+19):nth-child(-n+27),
    .grid-cell:nth-child(n+46):nth-child(-n+54) {
        border-bottom: 2px solid var(--color-red);
    }

    @media (max-width: 768px) {
        .details-inputs {
            grid-template-columns: 1fr;
        }

        .theme-tabs {
            flex-wrap: wrap;
        }

        .preview-grid {
            font-size: 0.75rem;
        }

        #mandalart-grid {
            font-size: 0.6rem;
        }
        
        .grid-cell {
            padding: 0.25rem;
        }
    }
`;
document.head.appendChild(style);
