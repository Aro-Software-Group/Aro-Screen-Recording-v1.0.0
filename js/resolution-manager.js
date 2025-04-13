// 画面録画アプリ - Aro Software Group
// 解像度・FPS設定管理 - MP4専用版

/**
 * 解像度・FPS設定を管理するクラス
 */
class ResolutionManager {
    /**
     * 利用可能な解像度設定を取得
     * @returns {Array} 解像度設定の配列
     */
    static getAvailableResolutions() {
        return [
            { id: '480p', name: '480p (854x480) 35fps', width: 854, height: 480, frameRate: 35 },
            { id: '720p', name: '720p (1280x720) 30fps', width: 1280, height: 720, frameRate: 30 },
            { id: '1080p', name: '1080p (1920x1080) 30fps', width: 1920, height: 1080, frameRate: 30 },
            { id: '1080p60', name: '1080p (1920x1080) 60fps', width: 1920, height: 1080, frameRate: 60 }
        ];
    }

    /**
     * IDから解像度設定を取得
     * @param {string} id - 解像度設定ID
     * @returns {Object} 解像度設定オブジェクト
     */
    static getResolutionById(id) {
        const resolutions = this.getAvailableResolutions();
        return resolutions.find(res => res.id === id) || resolutions[1]; // デフォルトは720p
    }

    /**
     * 解像度に基づいたビットレートを取得
     * @param {Object} resolution - 解像度設定オブジェクト
     * @param {boolean} isBakusoku - BAKUSOKUモードかどうか
     * @returns {number} ビットレート（bps）
     */
    static getBitrate(resolution, isBakusoku = false) {
        if (isBakusoku) {
            return 2500000; // 2.5 Mbps (BAKUSOKUモード)
        }

        // 解像度に基づいたビットレート設定
        switch (resolution.id) {
            case '480p':
                return 2500000; // 2.5 Mbps
            case '720p':
                return 5000000; // 5 Mbps
            case '1080p':
                return 8000000; // 8 Mbps
            case '1080p60':
                return 12000000; // 12 Mbps
            default:
                return 5000000; // デフォルト 5 Mbps
        }
    }

    /**
     * getDisplayMedia用の制約オブジェクトを作成
     * @param {Object} resolution - 解像度設定オブジェクト
     * @returns {Object} 制約オブジェクト
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
     * MediaRecorder用のオプションを作成 - MP4専用
     * @param {Object} resolution - 解像度設定オブジェクト
     * @param {boolean} isBakusoku - BAKUSOKUモードかどうか
     * @returns {Object} MediaRecorderオプション
     */
    static createMediaRecorderOptions(resolution, isBakusoku = false) {
        const bitrate = this.getBitrate(resolution, isBakusoku);
        
        // MP4形式専用のオプション
        const options = {
            mimeType: 'video/mp4',
            videoBitsPerSecond: bitrate
        };
        
        // MP4がサポートされているか確認
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn('MP4 is not directly supported, trying with specific codecs');
            
            // 様々なMP4コーデック組み合わせを試す
            const codecOptions = [
                'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                'video/mp4; codecs="avc1.4D401E, mp4a.40.2"',
                'video/mp4; codecs="avc1.42E01E"'
            ];
            
            for (const codecOption of codecOptions) {
                if (MediaRecorder.isTypeSupported(codecOption)) {
                    console.log('Found supported codec:', codecOption);
                    options.mimeType = codecOption;
                    break;
                }
            }
            
            // それでもサポートされていない場合は、ブラウザのデフォルト設定を使用
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn('No supported MP4 codec found, using browser default');
                return { videoBitsPerSecond: bitrate };
            }
        }
        
        return options;
    }
}

// グローバルスコープで公開
window.ResolutionManager = ResolutionManager;
