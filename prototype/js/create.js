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
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('input');
        cell.type = 'text';
        cell.className = 'grid-cell';
        cell.placeholder = '';
        cell.maxLength = 30;
        
        // 中央のセル(40番目)を強調
        if (i === 40) {
            cell.classList.add('center-cell');
            cell.placeholder = 'メインゴール';
        }

        gridContainer.appendChild(cell);
    }
}

// ========================================
// プレビュー更新
// ========================================

function updatePreview() {
    const previewContainer = document.getElementById('mandalart-preview');
    previewContainer.innerHTML = '';

    // 簡易プレビュー: 中心とテーマのみ表示
    const preview = document.createElement('div');
    preview.className = 'preview-grid';

    // 中央
    const centerDiv = document.createElement('div');
    centerDiv.className = 'preview-cell preview-center';
    centerDiv.textContent = mandalartData.center || '未入力';
    preview.appendChild(centerDiv);

    // 8つのテーマ
    mandalartData.themes.forEach(theme => {
        const themeDiv = document.createElement('div');
        themeDiv.className = 'preview-cell preview-theme';
        themeDiv.textContent = theme.title || '未入力';
        preview.appendChild(themeDiv);
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
        alert('メインゴールを入力してください');
        return;
    }

    if (filledThemes < 8) {
        alert('8つ全てのテーマを入力してください');
        return;
    }

    if (totalDetails < 32) { // 最低でも各テーマ4つずつ
        alert('各テーマの具体的行動をもっと入力してください');
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
// スタイルを追加（Step 3用）
// ========================================

// Step 3のスタイルをCSSに追加する必要があります
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
    }

    .preview-center {
        background: linear-gradient(135deg, var(--color-gold), var(--color-red));
        color: white;
        font-weight: bold;
        font-size: 1rem;
    }

    .preview-theme {
        background: white;
        color: var(--color-text);
    }

    .grid-cell {
        padding: 0.5rem;
        border: 1px solid var(--color-border);
        font-size: 0.9rem;
    }

    .grid-cell.center-cell {
        background: var(--color-gold);
        font-weight: bold;
    }

    #mandalart-grid {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        gap: 2px;
        max-width: 800px;
        margin: 0 auto 2rem;
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
            font-size: 0.7rem;
        }
    }
`;
document.head.appendChild(style);
