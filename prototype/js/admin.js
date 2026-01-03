import { getDeleteRequests, updateDeleteRequestStatus, deleteMandalart } from './supabase-config.js';

// ========================================
// 設定
// ========================================

let currentStatus = 'pending';

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // ログイン状態を確認
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    
    if (isLoggedIn) {
        showAdminSection();
    }
    
    // イベントリスナー
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // タブ切り替え
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            loadRequests();
        });
    });
});

// ========================================
// 認証
// ========================================

async function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const loginBtn = document.getElementById('login-btn');
    
    // ボタン無効化
    loginBtn.disabled = true;
    loginBtn.textContent = '認証中...';
    
    try {
        // APIで認証
        const response = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
            sessionStorage.setItem('admin_logged_in', 'true');
            showAdminSection();
        } else {
            alert('パスワードが正しくありません');
            document.getElementById('admin-password').value = '';
        }
    } catch (error) {
        console.error('認証エラー:', error);
        alert('認証に失敗しました。もう一度お試しください。');
    } finally {
        // ボタン有効化
        loginBtn.disabled = false;
        loginBtn.textContent = 'ログイン';
    }
}

function handleLogout() {
    sessionStorage.removeItem('admin_logged_in');
    location.reload();
}

function showAdminSection() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');
    document.getElementById('logout-btn').style.display = 'inline-block';
    loadRequests();
    loadStats();
}

// ========================================
// データ読み込み
// ========================================

async function loadStats() {
    try {
        const pending = await getDeleteRequests('pending');
        const approved = await getDeleteRequests('approved');
        const rejected = await getDeleteRequests('rejected');
        
        document.getElementById('pending-count').textContent = pending.length;
        document.getElementById('approved-count').textContent = approved.length;
        document.getElementById('rejected-count').textContent = rejected.length;
    } catch (error) {
        console.error('統計情報の読み込みエラー:', error);
    }
}

async function loadRequests() {
    const container = document.getElementById('requests-list');
    container.innerHTML = '<div class="empty-state">読み込み中...</div>';
    
    try {
        const requests = await getDeleteRequests(currentStatus);
        
        if (requests.length === 0) {
            container.innerHTML = '<div class="empty-state">リクエストがありません</div>';
            return;
        }
        
        container.innerHTML = '';
        
        requests.forEach(request => {
            const card = createRequestCard(request);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('リクエストの読み込みエラー:', error);
        container.innerHTML = '<div class="empty-state">エラーが発生しました</div>';
    }
}

// ========================================
// UI作成
// ========================================

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';
    
    const mandalart = request.mandalarts;
    const statusBadge = getStatusBadge(request.status);
    const createdDate = new Date(request.created_at).toLocaleString('ja-JP');
    
    card.innerHTML = `
        <div class="request-header">
            <div>
                <div class="request-title">
                    ${mandalart ? mandalart.center : '（削除済み）'}
                </div>
                <div class="request-meta">
                    作成者: ${mandalart ? mandalart.user_display_name : '不明'} | 
                    作成日: ${mandalart ? new Date(mandalart.created_at).toLocaleDateString('ja-JP') : '不明'} | 
                    リクエスト日: ${createdDate}
                </div>
            </div>
            <div>
                ${statusBadge}
            </div>
        </div>
        
        <div class="request-reason">
            <strong>削除理由:</strong><br>
            ${request.reason}
        </div>
        
        ${mandalart ? `
            <div>
                <a href="/api/view?id=${mandalart.id}" target="_blank" class="mandalart-link">
                    📄 マンダラートを表示
                </a>
            </div>
        ` : ''}
        
        ${request.status === 'pending' ? `
            <div class="request-actions">
                <button class="btn btn-approve" onclick="approveRequest('${request.id}', '${request.mandalart_id}')">
                    ✅ 承認して削除
                </button>
                <button class="btn btn-reject" onclick="rejectRequest('${request.id}')">
                    ❌ 却下
                </button>
            </div>
        ` : ''}
    `;
    
    return card;
}

function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge badge-pending">保留中</span>',
        approved: '<span class="badge badge-approved">承認済み</span>',
        rejected: '<span class="badge badge-rejected">却下済み</span>'
    };
    return badges[status] || '';
}

// ========================================
// アクション
// ========================================

window.approveRequest = async function(requestId, mandalartId) {
    if (!confirm('このマンダラートを削除しますか？\nこの操作は取り消せません。')) {
        return;
    }
    
    try {
        // マンダラートを削除
        await deleteMandalart(mandalartId);
        
        // リクエストのステータスを更新
        await updateDeleteRequestStatus(requestId, 'approved');
        
        alert('マンダラートを削除しました');
        
        // 再読み込み
        await loadRequests();
        await loadStats();
    } catch (error) {
        console.error('承認エラー:', error);
        alert('削除に失敗しました: ' + error.message);
    }
};

window.rejectRequest = async function(requestId) {
    if (!confirm('この削除リクエストを却下しますか？')) {
        return;
    }
    
    try {
        // リクエストのステータスを更新
        await updateDeleteRequestStatus(requestId, 'rejected');
        
        alert('リクエストを却下しました');
        
        // 再読み込み
        await loadRequests();
        await loadStats();
    } catch (error) {
        console.error('却下エラー:', error);
        alert('却下に失敗しました: ' + error.message);
    }
};
