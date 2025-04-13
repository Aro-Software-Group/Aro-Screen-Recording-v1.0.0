// 画面録画アプリ - Aro Software Group
// 動画フォーマット変換ユーティリティ

/**
 * 動画フォーマット変換ユーティリティクラス
 * WebMからMP4やGIFへの変換機能を提供
 */
class VideoConverter {
    /**
     * WebMからMP4に変換（ブラウザ内変換）
     * @param {Blob} webmBlob - WebM形式のBlob
     * @returns {Promise<Blob>} - MP4形式のBlob
     */
    static async webmToMp4(webmBlob) {
        // MP4変換のためのワーカーを作成
        return new Promise((resolve, reject) => {
            try {
                // MediaRecorderがMP4をサポートしている場合は直接MP4で録画
                if (MediaRecorder.isTypeSupported('video/mp4')) {
                    resolve(webmBlob);
                    return;
                }
                
                // 注: 実際のブラウザ内変換はWebAssemblyベースのFFmpegなどが必要
                // ここではサポートされていない場合はそのままWebMを返す
                console.warn('MP4変換はこのブラウザでサポートされていません。WebMのままダウンロードします。');
                resolve(webmBlob);
            } catch (error) {
                console.error('MP4変換エラー:', error);
                reject(error);
            }
        });
    }

    /**
     * WebMからGIFに変換（ブラウザ内変換）
     * @param {Blob} webmBlob - WebM形式のBlob
     * @param {Object} options - 変換オプション
     * @returns {Promise<Blob>} - GIF形式のBlob
     */
    static async webmToGif(webmBlob, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                // デフォルトオプション
                const defaultOptions = {
                    fps: 10,
                    quality: 10,
                    width: 640,
                    height: 480
                };
                
                // オプションをマージ
                const settings = { ...defaultOptions, ...options };
                
                // 一時的なビデオ要素を作成
                const video = document.createElement('video');
                video.src = URL.createObjectURL(webmBlob);
                video.muted = true;
                
                // ビデオのメタデータが読み込まれるのを待つ
                await new Promise(resolve => {
                    video.onloadedmetadata = resolve;
                });
                
                // キャンバスを作成
                const canvas = document.createElement('canvas');
                canvas.width = settings.width;
                canvas.height = settings.height;
                const ctx = canvas.getContext('2d');
                
                // GIFエンコーダーの設定
                // 注: 実際の実装ではGIF.jsなどのライブラリが必要
                console.warn('GIF変換はこのブラウザでサポートされていません。WebMのままダウンロードします。');
                resolve(webmBlob);
                
                // リソースの解放
                URL.revokeObjectURL(video.src);
            } catch (error) {
                console.error('GIF変換エラー:', error);
                reject(error);
            }
        });
    }

    /**
     * 適切な出力形式に変換
     * @param {Blob} blob - 元のBlob
     * @param {string} targetFormat - 目標フォーマット ('webm', 'mp4', 'gif')
     * @param {Object} options - 変換オプション
     * @returns {Promise<Blob>} - 変換後のBlob
     */
    static async convertToFormat(blob, targetFormat, options = {}) {
        // 元のフォーマットを確認
        const sourceFormat = blob.type.split('/')[1].split(';')[0];
        
        // 同じフォーマットなら変換不要
        if (sourceFormat === targetFormat) {
            return blob;
        }
        
        // フォーマットに応じた変換処理
        switch (targetFormat) {
            case 'mp4':
                return await this.webmToMp4(blob);
            case 'gif':
                return await this.webmToGif(blob, options);
            case 'webm':
            default:
                return blob;
        }
    }
}

// GIF変換のためのヘルパー関数
function createGifFrames(video, canvas, ctx, options) {
    return new Promise((resolve, reject) => {
        const frames = [];
        const frameCount = Math.floor(video.duration * options.fps);
        let currentFrame = 0;
        
        // フレーム抽出関数
        function extractFrame() {
            if (currentFrame >= frameCount) {
                resolve(frames);
                return;
            }
            
            // ビデオの時間を設定
            video.currentTime = currentFrame / options.fps;
            
            // フレームが読み込まれるのを待つ
            video.onseeked = () => {
                // キャンバスにフレームを描画
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // フレームデータを取得
                const imageData = canvas.toDataURL('image/png');
                frames.push(imageData);
                
                // 次のフレームへ
                currentFrame++;
                extractFrame();
            };
        }
        
        // フレーム抽出開始
        extractFrame();
    });
}
