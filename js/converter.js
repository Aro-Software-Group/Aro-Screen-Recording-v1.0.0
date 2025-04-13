// 画面録画アプリ - Aro Software Group
// MP4専用処理ユーティリティ

/**
 * MP4ファイルを適切なメタデータで処理する関数
 * @param {Blob} mp4Blob - MP4形式のBlob
 * @param {Object} options - 処理オプション
 * @returns {Promise<Blob>} - 処理済みのMP4形式のBlob
 */
async function processMP4(mp4Blob, options = {}) {
    console.log('processMP4関数が呼び出されました', mp4Blob);
    
    // 進捗コールバック
    const progressCallback = options.progressCallback || null;
    if (progressCallback) progressCallback(0);
    
    try {
        // MP4ファイルのメタデータを適切に設定
        // シーク可能なMP4ファイルを生成
        
        // ArrayBufferに変換
        const arrayBuffer = await mp4Blob.arrayBuffer();
        if (progressCallback) progressCallback(30);
        
        // MP4のメタデータを確認
        const hasValidMetadata = checkMP4Metadata(arrayBuffer);
        console.log('MP4メタデータ確認結果:', hasValidMetadata);
        
        if (hasValidMetadata) {
            // メタデータが正常な場合はそのまま返す
            if (progressCallback) progressCallback(100);
            return mp4Blob;
        }
        
        // メタデータが不十分な場合は修正
        // 注: 実際のメタデータ修正は複雑なため、ここではMIMEタイプの再設定のみ行う
        const processedBlob = new Blob([arrayBuffer], { 
            type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' 
        });
        
        if (progressCallback) progressCallback(100);
        console.log('処理済みMP4 Blobを作成しました', processedBlob);
        return processedBlob;
    } catch (error) {
        console.error('MP4処理エラー:', error);
        if (progressCallback) progressCallback(100);
        // エラー時は元のBlobを返す
        return mp4Blob;
    }
}

/**
 * MP4メタデータをチェックする関数
 * @param {ArrayBuffer} arrayBuffer - MP4ファイルのArrayBuffer
 * @returns {boolean} - メタデータが有効かどうか
 */
function checkMP4Metadata(arrayBuffer) {
    try {
        // MP4ファイルのシグネチャをチェック
        const view = new DataView(arrayBuffer);
        
        // MP4ファイルの最初の8バイトをチェック
        // ftyp boxが存在するかどうか
        const size = view.getUint32(0);
        const type = new TextDecoder().decode(new Uint8Array(arrayBuffer, 4, 4));
        
        if (type !== 'ftyp') {
            console.warn('MP4ファイルのシグネチャが不正です');
            return false;
        }
        
        // moov boxを探す (メタデータを含むボックス)
        let offset = size;
        let moovFound = false;
        
        while (offset < arrayBuffer.byteLength) {
            if (offset + 8 > arrayBuffer.byteLength) break;
            
            const boxSize = view.getUint32(offset);
            const boxType = new TextDecoder().decode(new Uint8Array(arrayBuffer, offset + 4, 4));
            
            if (boxType === 'moov') {
                moovFound = true;
                break;
            }
            
            offset += boxSize;
            if (boxSize === 0) break; // 無限ループ防止
        }
        
        return moovFound;
    } catch (error) {
        console.error('MP4メタデータチェックエラー:', error);
        return false;
    }
}

// グローバルスコープで関数を公開
window.processMP4 = processMP4;
