// 画面録画アプリ - Aro Software Group
// エクスポート機能ユーティリティ

/**
 * エクスポート機能ユーティリティクラス
 * 録画データの保存と変換を管理
 */
class ExportManager {
    /**
     * 録画データをエクスポート
     * @param {Blob} blob - 録画データのBlob
     * @param {string} format - 出力形式 ('webm', 'mp4', 'gif')
     * @param {string} fileName - ファイル名（拡張子なし）
     */
    static async exportRecording(blob, format, fileName) {
        try {
            // ステータス表示
            this.updateStatus('エクスポート処理中...', 'processing');
            
            // 形式に応じた変換処理
            const processedBlob = await VideoConverter.convertToFormat(blob, format);
            
            // ダウンロード
            this.downloadBlob(processedBlob, `${fileName}.${format}`);
            
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
     * @param {string} format - 出力形式
     * @param {HTMLElement} recordingsList - 録画リスト要素
     */
    static addToRecordingsList(blob, format, recordingsList) {
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
        details.textContent = `形式: ${format.toUpperCase()} | 日時: ${dateString} ${timeString}`;
        
        // アクション
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'recording-actions';
        
        // ダウンロードボタン
        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn primary';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> ダウンロード';
        downloadButton.addEventListener('click', () => {
            this.exportRecording(blob, format, fileName);
        });
        
        // 他の形式でエクスポートボタン
        const exportButton = document.createElement('button');
        exportButton.className = 'btn secondary';
        exportButton.innerHTML = '<i class="fas fa-file-export"></i> 他の形式で保存';
        exportButton.addEventListener('click', () => {
            this.showExportOptions(blob, fileName);
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
        actionsContainer.appendChild(exportButton);
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
    
    /**
     * エクスポートオプションを表示
     * @param {Blob} blob - 録画データのBlob
     * @param {string} fileName - ファイル名
     */
    static showExportOptions(blob, fileName) {
        // モーダルが既に存在する場合は削除
        let exportModal = document.getElementById('export-modal');
        if (exportModal) {
            document.body.removeChild(exportModal);
        }
        
        // モーダル作成
        exportModal = document.createElement('div');
        exportModal.id = 'export-modal';
        exportModal.className = 'modal';
        exportModal.style.display = 'block';
        
        // モーダルコンテンツ
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // 閉じるボタン
        const closeButton = document.createElement('span');
        closeButton.className = 'close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            exportModal.style.display = 'none';
            setTimeout(() => {
                document.body.removeChild(exportModal);
            }, 300);
        });
        
        // タイトル
        const title = document.createElement('h2');
        title.textContent = 'エクスポート形式を選択';
        
        // フォーマット選択
        const formatContainer = document.createElement('div');
        formatContainer.className = 'export-formats';
        
        const formats = [
            { id: 'webm', name: 'WebM', icon: 'fa-film' },
            { id: 'mp4', name: 'MP4', icon: 'fa-video' },
            { id: 'gif', name: 'GIF', icon: 'fa-image' }
        ];
        
        formats.forEach(format => {
            const formatButton = document.createElement('button');
            formatButton.className = 'format-button';
            formatButton.innerHTML = `<i class="fas ${format.icon}"></i> ${format.name}`;
            formatButton.addEventListener('click', async () => {
                // モーダルを閉じる
                exportModal.style.display = 'none';
                
                // エクスポート処理
                await this.exportRecording(blob, format.id, fileName);
                
                // モーダル削除
                setTimeout(() => {
                    document.body.removeChild(exportModal);
                }, 300);
            });
            
            formatContainer.appendChild(formatButton);
        });
        
        // モーダル組み立て
        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(formatContainer);
        exportModal.appendChild(modalContent);
        
        // ボディに追加
        document.body.appendChild(exportModal);
        
        // モーダル外クリックで閉じる
        exportModal.addEventListener('click', (event) => {
            if (event.target === exportModal) {
                exportModal.style.display = 'none';
                setTimeout(() => {
                    document.body.removeChild(exportModal);
                }, 300);
            }
        });
    }
}

// エクスポートモーダル用のスタイル
const style = document.createElement('style');
style.textContent = `
.export-formats {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 20px;
}

.format-button {
    flex: 1;
    min-width: 120px;
    padding: 15px;
    border: none;
    border-radius: var(--border-radius);
    background-color: #f5f5f5;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
}

.format-button i {
    font-size: 2rem;
    color: var(--primary-color);
}

.format-button:hover {
    background-color: #e9ecef;
    transform: translateY(-3px);
    box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
}

@keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
}

@media (prefers-color-scheme: dark) {
    .format-button {
        background-color: #3a3a3a;
        color: #f5f5f5;
    }
    
    .format-button:hover {
        background-color: #444;
    }
}
`;

document.head.appendChild(style);
