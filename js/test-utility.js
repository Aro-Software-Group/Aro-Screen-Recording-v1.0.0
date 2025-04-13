// 画面録画アプリ - Aro Software Group
// テスト・デバッグユーティリティ

/**
 * テスト・デバッグユーティリティクラス
 * アプリケーションの機能テストとエラーハンドリングを提供
 */
class TestUtility {
    /**
     * ブラウザの互換性をチェック
     * @returns {Object} 互換性情報
     */
    static checkBrowserCompatibility() {
        const compatibility = {
            getDisplayMedia: false,
            mediaRecorder: false,
            webmSupport: false,
            mp4Support: false,
            audioCapture: false,
            overall: false
        };
        
        // getDisplayMedia対応チェック
        compatibility.getDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        
        // MediaRecorder対応チェック
        compatibility.mediaRecorder = typeof MediaRecorder !== 'undefined';
        
        // 形式サポートチェック
        if (compatibility.mediaRecorder) {
            compatibility.webmSupport = MediaRecorder.isTypeSupported('video/webm');
            compatibility.mp4Support = MediaRecorder.isTypeSupported('video/mp4');
        }
        
        // 音声キャプチャ対応チェック
        compatibility.audioCapture = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        // 全体的な互換性判定
        compatibility.overall = compatibility.getDisplayMedia && compatibility.mediaRecorder && compatibility.webmSupport;
        
        return compatibility;
    }
    
    /**
     * 互換性情報をコンソールに出力
     */
    static logCompatibilityInfo() {
        const compatibility = this.checkBrowserCompatibility();
        
        console.log('%c画面録画アプリ - 互換性チェック', 'font-weight: bold; font-size: 16px; color: #4a6cf7;');
        console.log('%c基本機能', 'font-weight: bold;');
        console.log(`getDisplayMedia API: ${compatibility.getDisplayMedia ? '✅ 対応' : '❌ 非対応'}`);
        console.log(`MediaRecorder API: ${compatibility.mediaRecorder ? '✅ 対応' : '❌ 非対応'}`);
        
        console.log('%c出力形式', 'font-weight: bold;');
        console.log(`WebM形式: ${compatibility.webmSupport ? '✅ 対応' : '❌ 非対応'}`);
        console.log(`MP4形式: ${compatibility.mp4Support ? '✅ 対応' : '❌ 非対応'}`);
        
        console.log('%cその他機能', 'font-weight: bold;');
        console.log(`音声キャプチャ: ${compatibility.audioCapture ? '✅ 対応' : '❌ 非対応'}`);
        
        console.log('%c総合判定', 'font-weight: bold;');
        console.log(`アプリケーション互換性: ${compatibility.overall ? '✅ 利用可能' : '❌ 利用不可'}`);
        
        return compatibility;
    }
    
    /**
     * エラーハンドラーを設定
     */
    static setupErrorHandlers() {
        // グローバルエラーハンドラー
        window.addEventListener('error', (event) => {
            console.error('グローバルエラー:', event.error);
            this.showErrorNotification('アプリケーションでエラーが発生しました');
            return false;
        });
        
        // Promise エラーハンドラー
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未処理のPromiseエラー:', event.reason);
            this.showErrorNotification('非同期処理でエラーが発生しました');
            return false;
        });
    }
    
    /**
     * エラー通知を表示
     * @param {string} message - エラーメッセージ
     */
    static showErrorNotification(message) {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.error-notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-icon"><i class="fas fa-exclamation-circle"></i></div>
            <div class="error-message">${message}</div>
            <div class="error-close"><i class="fas fa-times"></i></div>
        `;
        
        // スタイルを適用
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'var(--danger-color)';
        notification.style.color = 'white';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = 'var(--border-radius)';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.zIndex = '9999';
        notification.style.animation = 'slideInUp 0.3s ease-out forwards';
        
        // 閉じるボタンのイベント
        const closeButton = notification.querySelector('.error-close');
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
        
        // 自動的に閉じる
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        // ボディに追加
        document.body.appendChild(notification);
    }
    
    /**
     * 機能テストを実行
     */
    static async runFunctionalTests() {
        console.log('%c画面録画アプリ - 機能テスト開始', 'font-weight: bold; font-size: 16px; color: #4a6cf7;');
        
        // 互換性チェック
        const compatibility = this.checkBrowserCompatibility();
        if (!compatibility.overall) {
            console.error('ブラウザが必要な機能に対応していないため、テストを中止します');
            return false;
        }
        
        try {
            // 解像度マネージャーのテスト
            console.log('解像度マネージャーのテスト...');
            const resolutions = ResolutionManager.getAvailableResolutions();
            console.log(`利用可能な解像度: ${resolutions.length}種類`);
            
            // コンバーターのテスト
            console.log('コンバーターのテスト...');
            if (typeof VideoConverter !== 'undefined') {
                console.log('VideoConverterクラスが正常に読み込まれています');
            } else {
                throw new Error('VideoConverterクラスが見つかりません');
            }
            
            // エクスポートマネージャーのテスト
            console.log('エクスポートマネージャーのテスト...');
            if (typeof ExportManager !== 'undefined') {
                console.log('ExportManagerクラスが正常に読み込まれています');
            } else {
                throw new Error('ExportManagerクラスが見つかりません');
            }
            
            console.log('%c機能テスト完了 - すべてのテストに合格しました', 'color: green; font-weight: bold;');
            return true;
        } catch (error) {
            console.error('機能テスト失敗:', error);
            return false;
        }
    }
    
    /**
     * パフォーマンスモニタリングを開始
     */
    static startPerformanceMonitoring() {
        console.log('%c画面録画アプリ - パフォーマンスモニタリング開始', 'font-weight: bold; font-size: 16px; color: #4a6cf7;');
        
        // メモリ使用量のモニタリング
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memoryInfo = window.performance.memory;
                console.log(`メモリ使用量: ${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`);
            }, 10000); // 10秒ごとに出力
        }
        
        // FPSモニタリング
        let frameCount = 0;
        let lastTime = performance.now();
        
        function countFrame() {
            frameCount++;
            const now = performance.now();
            
            if (now - lastTime >= 1000) { // 1秒ごとに計測
                const fps = Math.round(frameCount * 1000 / (now - lastTime));
                console.log(`現在のFPS: ${fps}`);
                frameCount = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(countFrame);
        }
        
        requestAnimationFrame(countFrame);
    }
}

// アプリケーション起動時にテストを実行
document.addEventListener('DOMContentLoaded', () => {
    // エラーハンドラーを設定
    TestUtility.setupErrorHandlers();
    
    // 互換性情報をログ出力
    const compatibility = TestUtility.logCompatibilityInfo();
    
    // 互換性に問題がある場合は警告を表示
    if (!compatibility.overall) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'お使いのブラウザは一部機能に対応していません';
            statusElement.style.color = 'var(--danger-color)';
        }
        
        TestUtility.showErrorNotification('お使いのブラウザは画面録画機能に完全対応していません。一部機能が制限される場合があります。');
    }
    
    // 機能テストを実行
    TestUtility.runFunctionalTests();
    
    // 開発モードの場合はパフォーマンスモニタリングを開始
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        TestUtility.startPerformanceMonitoring();
    }
});
