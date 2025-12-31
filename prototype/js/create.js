// Supabase設定をインポート
import { signInAnonymously, createMandalart, getCurrentUser } from './supabase-config.js';

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
const ZERO_WIDTH_SPACE = '\u200B'; // カーソル位置制御用の不可視文字

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 匿名ログイン（自動）
    await ensureAuthenticated();
    
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
// 認証
// ========================================

async function ensureAuthenticated() {
    const user = await getCurrentUser();
    
    if (!user) {
        console.log('匿名ログイン中...');
        await signInAnonymously();
        console.log('匿名ログイン完了');
    }
}

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
        cell.setAttribute('data-placeholder', '大目標');
        
        // 初期状態でhas-contentクラスを設定
        if (!mandalartData.center.trim()) {
            cell.classList.remove('has-content');
        } else {
            cell.classList.add('has-content');
        }
        
        cell.addEventListener('focus', () => {
            handleCellFocus(cell);
        });
        
        cell.addEventListener('input', () => {
            updatePlaceholderClass(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.center = cleanText(cell.textContent);
            cell.textContent = mandalartData.center;
            saveToStorage();
            updateThemeCells();
            updatePlaceholderClass(cell);
        });
    } else if (isCenterBlock) {
        // 中目標（中央ブロック）
        const themeIndex = getThemeIndexFromInner(innerRow, innerCol);
        cell.classList.add('cell-theme');
        cell.contentEditable = true;
        cell.textContent = mandalartData.themes[themeIndex].title;
        cell.setAttribute('data-placeholder', `中目標${themeIndex + 1}`);
        cell.dataset.themeIndex = themeIndex;
        
        if (!mandalartData.themes[themeIndex].title.trim()) {
            cell.classList.remove('has-content');
        } else {
            cell.classList.add('has-content');
        }
        
        cell.addEventListener('focus', () => {
            handleCellFocus(cell);
        });
        
        cell.addEventListener('input', () => {
            updatePlaceholderClass(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.themes[themeIndex].title = cleanText(cell.textContent);
            cell.textContent = mandalartData.themes[themeIndex].title;
            saveToStorage();
            updateThemeCells();
            updatePlaceholderClass(cell);
        });
    } else if (isCenterCell) {
        // 中目標（周辺ブロックの中心）
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        cell.classList.add('cell-theme');
        cell.contentEditable = true;
        cell.textContent = mandalartData.themes[themeIndex].title;
        cell.setAttribute('data-placeholder', `中目標${themeIndex + 1}`);
        cell.dataset.themeIndex = themeIndex;
        
        if (!mandalartData.themes[themeIndex].title.trim()) {
            cell.classList.remove('has-content');
        } else {
            cell.classList.add('has-content');
        }
        
        cell.addEventListener('focus', () => {
            handleCellFocus(cell);
        });
        
        cell.addEventListener('input', () => {
            updatePlaceholderClass(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.themes[themeIndex].title = cleanText(cell.textContent);
            cell.textContent = mandalartData.themes[themeIndex].title;
            saveToStorage();
            updateThemeCells();
            updatePlaceholderClass(cell);
        });
    } else {
        // 個別目標
        const themeIndex = getThemeIndexFromBlock(blockRow, blockCol);
        const detailIndex = getDetailIndexFromInner(innerRow, innerCol);
        cell.classList.add('cell-detail');
        cell.contentEditable = true;
        cell.textContent = mandalartData.themes[themeIndex].details[detailIndex];
        cell.setAttribute('data-placeholder', '個別目標');
        cell.dataset.themeIndex = themeIndex;
        cell.dataset.detailIndex = detailIndex;
        
        if (!mandalartData.themes[themeIndex].details[detailIndex].trim()) {
            cell.classList.remove('has-content');
        } else {
            cell.classList.add('has-content');
        }
        
        cell.addEventListener('focus', () => {
            handleCellFocus(cell);
        });
        
        cell.addEventListener('input', () => {
            updatePlaceholderClass(cell);
        });
        
        cell.addEventListener('blur', () => {
            mandalartData.themes[themeIndex].details[detailIndex] = cleanText(cell.textContent);
            cell.textContent = mandalartData.themes[themeIndex].details[detailIndex];
            saveToStorage();
            updatePlaceholderClass(cell);
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

function handleCellFocus(cell) {
    const text = cleanText(cell.textContent);
    
    if (text) {
        // テキストがある場合は全選択
        setTimeout(() => {
            const range = document.createRange();
            range.selectNodeContents(cell);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }, 0);
    } else {
        // 空の場合は不可視文字を挿入してカーソルを中央に
        cell.classList.add('has-content');
        cell.textContent = ZERO_WIDTH_SPACE;
        
        // カーソルを不可視文字の後ろに配置
        setTimeout(() => {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(cell.firstChild, 1);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }, 0);
    }
}

function cleanText(text) {
    // 不可視文字を削除してトリム
    return text.replace(/\u200B/g, '').trim();
}

function updatePlaceholderClass(cell) {
    const text = cleanText(cell.textContent);
    if (text) {
        cell.classList.add('has-content');
    } else {
        cell.classList.remove('has-content');
    }
}

function updateThemeCells() {
    // 全ての中目標セルを更新
    const cells = document.querySelectorAll('.mandalart-cell.cell-theme');
    cells.forEach(cell => {
        const themeIndex = parseInt(cell.dataset.themeIndex);
        if (document.activeElement !== cell) {
            cell.textContent = mandalartData.themes[themeIndex].title;
            updatePlaceholderClass(cell);
        }
    });
}

// ========================================
// スマホ版: アコーディオン展開型（改善版）
// ========================================

function initMobileView() {
    document.getElementById('desktop-view').style.display = 'none';
    document.getElementById('mobile-view').style.display = 'block';
    
    renderMobileCenterBlock();
    
    // イベントリスナー
    document.getElementById('btn-close-accordion').addEventListener('click', closeAccordion);
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
            input.placeholder = `中目標${themeIndex + 1}`;
            input.dataset.themeIndex = themeIndex;
            input.addEventListener('input', (e) => {
                mandalartData.themes[themeIndex].title = e.target.value;
                saveToStorage();
            });
            
            // 展開ボタンを常に表示（パッと見てわかる）
            const expandBtn = document.createElement('div');
            expandBtn.className = 'expand-indicator';
            expandBtn.innerHTML = '⊕';
            expandBtn.dataset.themeIndex = themeIndex;
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openAccordion(themeIndex);
            });
            
            cell.appendChild(expandBtn);
        }
        
        cell.appendChild(input);
        container.appendChild(cell);
    });
}

function openAccordion(themeIndex) {
    currentThemeIndex = themeIndex;
    const accordion = document.getElementById('mobile-details-accordion');
    const theme = mandalartData.themes[themeIndex];
    
    // タイトルを設定
    document.getElementById('accordion-theme-title').textContent = theme.title || `中目標${themeIndex + 1}`;
    
    // 3x3グリッドを作成（中央は中目標タイトル）
    const container = document.getElementById('accordion-details-list');
    container.innerHTML = '';
    
    // 9セルのレイアウト（中央は中目標タイトル）
    const layout = [0, 1, 2, 3, -1, 4, 5, 6, 7];
    
    layout.forEach((detailIndex) => {
        const cell = document.createElement('div');
        cell.className = 'detail-grid-cell';
        
        if (detailIndex === -1) {
            // 中央セル：中目標タイトル
            cell.classList.add('detail-center');
            cell.textContent = theme.title || `中目標${themeIndex + 1}`;
        } else {
            // 個別目標セル
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 50;
            input.value = theme.details[detailIndex];
            input.placeholder = `目標${detailIndex + 1}`;
            input.addEventListener('input', (e) => {
                mandalartData.themes[currentThemeIndex].details[detailIndex] = e.target.value;
                saveToStorage();
            });
            
            cell.appendChild(input);
        }
        
        container.appendChild(cell);
    });
    
    // アコーディオンを表示
    accordion.classList.remove('hidden');
    
    // スムーズスクロール
    setTimeout(() => {
        accordion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function closeAccordion() {
    const accordion = document.getElementById('mobile-details-accordion');
    accordion.classList.add('hidden');
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
    if (confirm('入力内容をリセットしますか?\nこの操作は取り消せません。')) {
        mandalartData.center = '';
        mandalartData.themes.forEach(theme => {
            theme.title = '';
            theme.details = ['', '', '', '', '', '', '', ''];
        });
        localStorage.removeItem('current-mandalart');
        location.reload();
    }
}

async function completeMandalart() {
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
    
    // ローカルストレージに保存
    saveToStorage();
    
    try {
        // Supabaseに保存
        console.log('Supabaseに保存中...');
        const savedMandalart = await createMandalart({
            center: mandalartData.center,
            themes: mandalartData.themes,
            isPublic: true
        });
        
        console.log('保存成功:', savedMandalart);
        
        // URLパラメータでIDを渡してview.htmlに移動
        if (confirm('マンダラートが完成しました!\n表示ページに移動しますか？')) {
            window.location.href = `view.html?id=${savedMandalart.id}`;
        }
    } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました。ネットワーク接続を確認してください。\n\nローカルには保存されているので、後で再度「完成」ボタンを押してください。');
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
