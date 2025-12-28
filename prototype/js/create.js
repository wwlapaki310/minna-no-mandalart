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

let currentThemeIndex = 0;

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // ローカルストレージから読み込み
    loadFromStorage();
    
    // デバイス判定とUI初期化
    if (window.innerWidth >= 768) {
        initDesktopView();
    } else {
        initMobileView();
    }
    
    // リサイズ時の処理
    window.addEventListener('resize', handleResize);
});

// ========================================
// ローカルストレージ
// ========================================

function loadFromStorage() {
    const saved = localStorage.getItem('current-mandalart');
    if (saved) {
        const data = JSON.parse(saved);
        mandalartData.center = data.center || '';
        data.themes.forEach((theme, i) => {
            mandalartData.themes[i].title = theme.title || '';
            theme.details.forEach((detail, j) => {
                mandalartData.themes[i].details[j] = detail || '';
            });
        });
    }
}

function saveToStorage() {
    localStorage.setItem('current-mandalart', JSON.stringify({
        ...mandalartData,
        createdAt: new Date().toISOString()
    }));
}

// ========================================
// PC版: 9x9フルグリッド
// ========================================

function initDesktopView() {
    document.getElementById('desktop-view').style.display = 'block';
    document.getElementById('mobile-view').style.display = 'none';
    
    renderDesktopGrid();
    
    // イベントリスナー
    document.getElementById('reset-btn').addEventListener('click', resetMandalart);
    document.getElementById('complete-btn').addEventListener('click', completeMandalart);
}

function renderDesktopGrid() {
    const container = document.getElementById('mandalart-fullgrid');
    container.innerHTML = '';
    
    // 9x9 = 81セルを生成
    for (let i = 0; i < 81; i++) {
        const cell = createDesktopCell(i);
        container.appendChild(cell);
    }
}

function createDesktopCell(index) {
    const cell = document.createElement('div');
    cell.className = 'mandalart-cell';
    cell.dataset.index = index;
    
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
        cell.classList.add('cell-main');
        cell.contentEditable = true;
        cell.textContent = mandalartData.center;
        cell.setAttribute('placeholder', '大目標');
        
        cell.addEventListener('focus', () => {
            selectAllText(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.center = cell.textContent.trim();
            saveToStorage();
            updateThemeCells();
        });
    } else if (isCenterBlock) {
        // 中目標（中央ブロック）
        const themeIndex = getThemeIndexFromInner(innerRow, innerCol);
        cell.classList.add('cell-theme');
        cell.contentEditable = true;
        cell.textContent = mandalartData.themes[themeIndex].title;
        cell.setAttribute('placeholder', '');
        cell.dataset.themeIndex = themeIndex;
        
        cell.addEventListener('focus', () => {
            selectAllText(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.themes[themeIndex].title = cell.textContent.trim();
            saveToStorage();
            updateThemeCells();
        });
    } else if (isCenterCell) {
        // 中目標（周辺ブロックの中心）- 編集可能
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        cell.classList.add('cell-theme');
        cell.contentEditable = true;
        cell.textContent = mandalartData.themes[themeIndex].title;
        cell.setAttribute('placeholder', '');
        cell.dataset.themeIndex = themeIndex;
        
        cell.addEventListener('focus', () => {
            selectAllText(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.themes[themeIndex].title = cell.textContent.trim();
            saveToStorage();
            updateThemeCells();
        });
    } else {
        // 個別目標
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        const detailIndex = getDetailIndexFromInner(innerRow, innerCol);
        cell.classList.add('cell-detail');
        cell.contentEditable = true;
        cell.textContent = mandalartData.themes[themeIndex].details[detailIndex];
        cell.setAttribute('placeholder', '');
        cell.dataset.themeIndex = themeIndex;
        cell.dataset.detailIndex = detailIndex;
        
        cell.addEventListener('focus', () => {
            selectAllText(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.themes[themeIndex].details[detailIndex] = cell.textContent.trim();
            saveToStorage();
        });
    }
    
    // Enterキーで次のセルに
    cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            cell.blur();
        }
    });
    
    return cell;
}

function selectAllText(element) {
    // テキストが空の場合は何もしない
    if (!element.textContent.trim()) {
        return;
    }
    
    // テキストを全選択
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function updateThemeCells() {
    // 全ての中目標セルを更新
    const cells = document.querySelectorAll('.mandalart-cell.cell-theme');
    cells.forEach(cell => {
        const themeIndex = parseInt(cell.dataset.themeIndex);
        if (document.activeElement !== cell) {
            cell.textContent = mandalartData.themes[themeIndex].title;
        }
    });
}

// ========================================
// スマホ版: 段階的入力
// ========================================

function initMobileView() {
    document.getElementById('desktop-view').style.display = 'none';
    document.getElementById('mobile-view').style.display = 'block';
    
    renderMobileCenterBlock();
    
    // イベントリスナー
    document.getElementById('mobile-next-btn').addEventListener('click', showMobileDetails);
    document.getElementById('mobile-prev-btn').addEventListener('click', () => navigateMobileTheme(-1));
    document.getElementById('mobile-next-theme').addEventListener('click', () => navigateMobileTheme(1));
    document.getElementById('mobile-back-center').addEventListener('click', showMobileCenterBlock);
    document.getElementById('mobile-complete-btn').addEventListener('click', completeMandalart);
}

function renderMobileCenterBlock() {
    const container = document.getElementById('mobile-center-grid');
    container.innerHTML = '';
    
    const layout = [0, 1, 2, 3, -1, 4, 5, 6, 7];
    
    layout.forEach(themeIndex => {
        const cell = document.createElement('div');
        cell.className = 'mobile-cell';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 30;
        
        if (themeIndex === -1) {
            // 大目標
            cell.classList.add('mobile-cell-main');
            input.value = mandalartData.center;
            input.placeholder = '大目標';
            input.addEventListener('input', (e) => {
                mandalartData.center = e.target.value;
                saveToStorage();
            });
        } else {
            // 中目標
            cell.classList.add('mobile-cell-theme');
            input.value = mandalartData.themes[themeIndex].title;
            input.placeholder = '';
            input.dataset.themeIndex = themeIndex;
            input.addEventListener('input', (e) => {
                mandalartData.themes[themeIndex].title = e.target.value;
                saveToStorage();
            });
        }
        
        cell.appendChild(input);
        container.appendChild(cell);
    });
}

function showMobileDetails() {
    // 検証
    if (!mandalartData.center.trim()) {
        alert('大目標を入力してください');
        return;
    }
    
    const filledThemes = mandalartData.themes.filter(t => t.title.trim()).length;
    if (filledThemes < 8) {
        alert(`8つ全ての中目標を入力してください（現在${filledThemes}/8）`);
        return;
    }
    
    currentThemeIndex = 0;
    document.getElementById('mobile-center-block').classList.add('hidden');
    document.getElementById('mobile-details').classList.remove('hidden');
    renderMobileThemeDetails();
}

function showMobileCenterBlock() {
    document.getElementById('mobile-center-block').classList.remove('hidden');
    document.getElementById('mobile-details').classList.add('hidden');
}

function renderMobileThemeDetails() {
    const theme = mandalartData.themes[currentThemeIndex];
    
    // タイトルと進捗
    document.getElementById('mobile-theme-title').textContent = theme.title;
    document.getElementById('mobile-progress-text').textContent = `中目標 ${currentThemeIndex + 1}/8`;
    document.getElementById('mobile-progress-fill').style.width = `${((currentThemeIndex + 1) / 8) * 100}%`;
    
    // 個別目標リスト
    const container = document.getElementById('mobile-details-list');
    container.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        const item = document.createElement('div');
        item.className = 'mobile-detail-item';
        
        const label = document.createElement('label');
        label.textContent = `個別目標 ${i + 1}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 50;
        input.value = theme.details[i];
        input.placeholder = '';
        input.addEventListener('input', (e) => {
            mandalartData.themes[currentThemeIndex].details[i] = e.target.value;
            saveToStorage();
        });
        
        item.appendChild(label);
        item.appendChild(input);
        container.appendChild(item);
    }
    
    // ナビゲーションボタンの表示制御
    document.getElementById('mobile-prev-btn').style.display = currentThemeIndex === 0 ? 'none' : 'inline-block';
    document.getElementById('mobile-next-theme').style.display = currentThemeIndex === 7 ? 'none' : 'inline-block';
    document.getElementById('mobile-complete-btn').style.display = currentThemeIndex === 7 ? 'block' : 'none';
}

function navigateMobileTheme(direction) {
    currentThemeIndex += direction;
    currentThemeIndex = Math.max(0, Math.min(7, currentThemeIndex));
    renderMobileThemeDetails();
}

// ========================================
// ヘルパー関数
// ========================================

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
// 共通機能
// ========================================

function resetMandalart() {
    if (confirm('入力内容をリセットしますか？\nこの操作は取り消せません。')) {
        mandalartData.center = '';
        mandalartData.themes.forEach(theme => {
            theme.title = '';
            theme.details = ['', '', '', '', '', '', '', ''];
        });
        localStorage.removeItem('current-mandalart');
        location.reload();
    }
}

function completeMandalart() {
    // 検証
    if (!mandalartData.center.trim()) {
        alert('大目標を入力してください');
        return;
    }
    
    const filledThemes = mandalartData.themes.filter(t => t.title.trim()).length;
    if (filledThemes < 8) {
        alert(`8つ全ての中目標を入力してください（現在${filledThemes}/8）`);
        return;
    }
    
    const totalDetails = mandalartData.themes.reduce((sum, t) => {
        return sum + t.details.filter(d => d.trim()).length;
    }, 0);
    
    if (totalDetails < 32) {
        alert('各中目標の個別目標をもっと入力してください（最低でも各テーマ4つずつ）');
        return;
    }
    
    saveToStorage();
    
    if (confirm('マンダラートが完成しました！\n表示ページに移動しますか？')) {
        window.location.href = 'view.html';
    }
}

function handleResize() {
    const isDesktop = window.innerWidth >= 768;
    const currentIsDesktop = document.getElementById('desktop-view').style.display !== 'none';
    
    if (isDesktop !== currentIsDesktop) {
        if (isDesktop) {
            initDesktopView();
        } else {
            initMobileView();
        }
    }
}
