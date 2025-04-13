// 画面録画アプリ - Aro Software Group
// エクスポート機能ユーティリティ - MP4専用版

/**
 * エクスポート機能ユーティリティクラス
 * 録画データの保存を管理
 */
class ExportManager {
    /**
     * 録画データをエクスポート
     * @param {Blob} blob - 録画データのBlob
     * @param {string} fileName - ファイル名（拡張子なし）
     */
    static async exportRecording(blob, fileName) {
        try {
            // ステータス表示
            this.updateStatus('エクスポート処理中...', 'processing');
            
            // 進捗表示用の要素を作成
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            progressContainer.style.margin = '10px 0';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            
            progressContainer.appendChild(progressBar);
            
            // ステータス要素の後に進捗バーを追加
            const statusElement = document.getElementById('status');
            if (statusElement && statusElement.parentNode) {
                statusElement.parentNode.insertBefore(progressContainer, statusElement.nextSibling);
            }
            
            // 進捗更新コールバック
            const updateProgress = (percent) => {
                progressBar.style.width = `${percent}%`;
                progressBar.textContent = `${percent}%`;
            };
            
            // BAKUSOKUモードの状態を取得
            const isBakusoku = document.getElementById('bakusoku').checked;
            
            // BAKUSOKUモードが有効な場合はステータス表示
            if (isBakusoku) {
                this.updateStatus('BAKUSOKUモード: 有効 - 高速処理中...', 'processing');
            }
            
            // MP4メタデータを処理
            this.updateStatus('MP4形式で処理中...', 'processing');
            const processedBlob = await processMP4(blob, {
                progressCallback: updateProgress
            });
            
            // 進捗バーを削除
            if (progressContainer.parentNode) {
                progressContainer.parentNode.removeChild(progressContainer);
            }
            
            // MIMEタイプを適切に設定
            const finalBlob = new Blob([processedBlob], { type: 'video/mp4' });
            
            // ダウンロード
            this.downloadBlob(finalBlob, `${fileName}.mp4`);
            
            // 完了ステータス
            this.updateStatus('エクスポート完了', 'success');
            
            return true;
        } catch (error) {
            console.error('エクスポートエラー:', error);
            this.updateStatus('エクスポートに失敗しました', 'error');
            return false;
        }
    }
    
    /**
     * Blobをダウンロード
     * @param {Blob} blob - ダウンロードするBlob
     * @param {string} fileName - ファイル名
     */
    static downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // クリーンアップ
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    /**
     * ステータス更新
     * @param {string} message - ステータスメッセージ
     * @param {string} type - ステータスタイプ
     */
    static updateStatus(message, type) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            
            // スタイル設定
            switch (type) {
                case 'error':
                    statusElement.style.color = 'var(--danger-color)';
                    break;
                case 'success':
                    statusElement.style.color = 'var(--success-color)';
                    break;
                case 'processing':
                    statusElement.style.color = 'var(--primary-color)';
                    break;
                default:
                    statusElement.style.color = 'var(--secondary-color)';
            }
        }
    }
    
    /**
     * 録画リストに追加
     * @param {Blob} blob - 録画データのBlob
     * @param {HTMLElement} recordingsList - 録画リスト要素
     */
    static addToRecordingsList(blob, recordingsList) {
        if (!recordingsList) return;
        
        // 空のメッセージを削除
        const emptyMessage = recordingsList.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        // 現在の日時
        const now = new Date();
        const dateString = now.toLocaleDateString();
        const timeString = now.toLocaleTimeString();
        
        // ファイル名
        const fileName = `録画_${dateString.replace(/\//g, '-')}_${timeString.replace(/:/g, '-')}`;
        
        // URL作成
        const url = URL.createObjectURL(blob);
        
        // 録画アイテム要素の作成
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        recordingItem.style.animation = 'slideInUp 0.3s ease-out forwards';
        
        // プレビュー
        const previewContainer = document.createElement('div');
        previewContainer.className = 'recording-preview';
        
        const videoPreview = document.createElement('video');
        videoPreview.src = url;
        videoPreview.controls = true;
        
        previewContainer.appendChild(videoPreview);
        
        // 情報
        const infoContainer = document.createElement('div');
        infoContainer.className = 'recording-info';
        
        const title = document.createElement('h3');
        title.textContent = fileName;
        
        const details = document.createElement('p');
        details.textContent = `形式: MP4 | 日時: ${dateString} ${timeString}`;
        
        // アクション
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'recording-actions';
        
        // ダウンロードボタン
        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn primary';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> ダウンロード';
        downloadButton.addEventListener('click', () => {
            this.exportRecording(blob, fileName);
        });
        
        // 削除ボタン
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn danger';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> 削除';
        deleteButton.addEventListener('click', () => {
            // 削除アニメーション
            recordingItem.style.animation = 'fadeOut 0.3s ease-out forwards';
            
            setTimeout(() => {
                recordingItem.remove();
                URL.revokeObjectURL(url);
                
                // リストが空の場合、メッセージを表示
                if (recordingsList.children.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-message';
                    emptyMessage.textContent = '録画ファイルはまだありません';
                    recordingsList.appendChild(emptyMessage);
                }
            }, 300);
        });
        
        actionsContainer.appendChild(downloadButton);
        actionsContainer.appendChild(deleteButton);
        
        infoContainer.appendChild(title);
        infoContainer.appendChild(details);
        infoContainer.appendChild(actionsContainer);
        
        // 要素の追加
        recordingItem.appendChild(previewContainer);
        recordingItem.appendChild(infoContainer);
        
        // リストに追加
        recordingsList.appendChild(recordingItem);
        
        return recordingItem;
    }
}

// スタイル
const style = document.createElement('style');
style.textContent = `
@keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
}

@media (prefers-color-scheme: dark) {
    .recording-actions button {
        background-color: #3a3a3a;
        color: #f5f5f5;
    }
    
    .recording-actions button:hover {
        background-color: #444;
    }
}
`;

document.head.appendChild(style);
