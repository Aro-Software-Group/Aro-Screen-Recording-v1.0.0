// 画面録画アプリ - Aro Software Group
// 解像度・FPS設定ユーティリティ

/**
 * 解像度・FPS設定ユーティリティクラス
 * 様々な解像度・FPS設定の管理と適用を行う
 */
class ResolutionManager {
    /**
     * 利用可能な解像度・FPS設定を取得
     * @returns {Array} 利用可能な設定の配列
     */
    static getAvailableResolutions() {
        return [
            {
                id: '480p',
                name: '480p (854x480) 35fps',
                width: 854,
                height: 480,
                frameRate: 35,
                bitrate: 1000000 // 1 Mbps
            },
            {
                id: '720p',
                name: '720p (1280x720) 30fps',
                width: 1280,
                height: 720,
                frameRate: 30,
                bitrate: 2500000 // 2.5 Mbps
            },
            {
                id: '1080p',
                name: '1080p (1920x1080) 30fps',
                width: 1920,
                height: 1080,
                frameRate: 30,
                bitrate: 5000000 // 5 Mbps
            },
            {
                id: '1080p60',
                name: '1080p (1920x1080) 60fps',
                width: 1920,
                height: 1080,
                frameRate: 60,
                bitrate: 8000000 // 8 Mbps
            }
        ];
    }

    /**
     * 指定されたIDの解像度設定を取得
     * @param {string} resolutionId - 解像度設定のID
     * @returns {Object} 解像度設定オブジェクト
     */
    static getResolutionById(resolutionId) {
        const resolutions = this.getAvailableResolutions();
        return resolutions.find(res => res.id === resolutionId) || resolutions[1]; // デフォルトは720p
    }

    /**
     * 解像度設定からMediaRecorderのオプションを生成
     * @param {Object} resolution - 解像度設定オブジェクト
     * @param {string} format - 出力形式
     * @returns {Object} MediaRecorderオプション
     */
    static createRecorderOptions(resolution, format) {
        const options = {
            videoBitsPerSecond: resolution.bitrate
        };

        // 形式に応じたMIMEタイプの設定
        switch (format) {
            case 'mp4':
                if (MediaRecorder.isTypeSupported('video/mp4')) {
                    options.mimeType = 'video/mp4';
                }
                break;
            case 'webm':
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    options.mimeType = 'video/webm;codecs=vp9';
                } else if (MediaRecorder.isTypeSupported('video/webm')) {
                    options.mimeType = 'video/webm';
                }
                break;
            case 'gif':
                // GIFはMediaRecorderで直接サポートされていないため、
                // 後処理で変換する必要があります
                if (MediaRecorder.isTypeSupported('video/webm')) {
                    options.mimeType = 'video/webm';
                }
                break;
        }

        return options;
    }

    /**
     * 解像度設定からgetDisplayMediaの制約を生成
     * @param {Object} resolution - 解像度設定オブジェクト
     * @returns {Object} メディア制約オブジェクト
     */
    static createDisplayMediaConstraints(resolution) {
        return {
            video: {
                width: { ideal: resolution.width },
                height: { ideal: resolution.height },
                frameRate: { ideal: resolution.frameRate }
            }
        };
    }

    /**
     * デバイスがサポートする最大解像度を検出
     * @returns {Promise<Object>} サポートされる最大解像度設定
     */
    static async detectMaxSupportedResolution() {
        try {
            const resolutions = this.getAvailableResolutions().reverse(); // 高解像度から試す
            
            for (const resolution of resolutions) {
                try {
                    const constraints = this.createDisplayMediaConstraints(resolution);
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: constraints.video
                    });
                    
                    // ストリームを停止
                    stream.getTracks().forEach(track => track.stop());
                    
                    // この解像度がサポートされている
                    return resolution;
                } catch (err) {
                    console.log(`解像度 ${resolution.name} はサポートされていません`);
                    // 次の低い解像度を試す
                }
            }
            
            // どの解像度もサポートされていない場合はデフォルト値を返す
            return this.getResolutionById('720p');
        } catch (err) {
            console.error('解像度検出エラー:', err);
            return this.getResolutionById('720p');
        }
    }

    /**
     * 解像度設定をUIに適用
     * @param {string} resolutionId - 解像度設定のID
     */
    static applyResolutionToUI(resolutionId) {
        const selectElement = document.getElementById('resolution');
        if (selectElement) {
            selectElement.value = resolutionId;
        }
    }

    /**
     * UIから選択された解像度設定を取得
     * @returns {Object} 選択された解像度設定
     */
    static getSelectedResolution() {
        const selectElement = document.getElementById('resolution');
        if (selectElement) {
            return this.getResolutionById(selectElement.value);
        }
        return this.getResolutionById('720p');
    }
}
