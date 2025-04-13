// 画面録画アプリ - Aro Software Group
// メインアプリケーションスクリプト

// グローバル変数
let mediaRecorder;
let recordedChunks = [];
let stream;
let startTime;
let timerInterval;
let videoElement;
let placeholderElement;
let recordingsList;
let recordingsCount = 0;

// DOM要素
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    videoElement = document.getElementById('preview');
    placeholderElement = document.getElementById('placeholder');
    recordingsList = document.getElementById('recordings-list');
    
    // ボタン要素
    const startPCButton = document.getElementById('startPC');
    const startMobileButton = document.getElementById('startMobile');
    const stopButton = document.getElementById('stop');
    
    // 設定要素
    const resolutionSelect = document.getElementById('resolution');
    const formatSelect = document.getElementById('format');
    const audioToggle = document.getElementById('audio');
    
    // 情報表示要素
    const timerElement = document.getElementById('timer');
    const statusElement = document.getElementById('status');
    
    // モーダル要素
    const mobileGuideModal = document.getElementById('mobile-guide');
    const closeModalButton = document.querySelector('.close');
    
    // フッター年表示
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // イベントリスナーの設定
    startPCButton.addEventListener('click', () => startRecording('desktop'));
    startMobileButton.addEventListener('click', showMobileGuide);
    stopButton.addEventListener('click', stopRecording);
    closeModalButton.addEventListener('click', () => mobileGuideModal.style.display = 'none');
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        if (event.target === mobileGuideModal) {
            mobileGuideModal.style.display = 'none';
        }
    });
    
    // ブラウザ対応チェック
    checkBrowserCompatibility();
});

// ブラウザ対応チェック
function checkBrowserCompatibility() {
    const statusElement = document.getElementById('status');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        statusElement.textContent = 'お使いのブラウザは画面録画に対応していません';
        statusElement.style.color = 'var(--danger-color)';
        document.getElementById('startPC').disabled = true;
        document.getElementById('startMobile').disabled = true;
        return false;
    }
    
    return true;
}

// モバイルガイド表示
function showMobileGuide() {
    // モバイルデバイスチェック
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // モバイルデバイスの場合は直接録画開始
        startRecording('mobile');
    } else {
        // PCの場合はガイドモーダルを表示
        document.getElementById('mobile-guide').style.display = 'block';
    }
}

// 録画開始
async function startRecording(mode) {
    // ブラウザ対応チェック
    if (!checkBrowserCompatibility()) return;
    
    // 設定の取得
    const resolution = document.getElementById('resolution').value;
    const withAudio = document.getElementById('audio').checked;
    
    try {
        // 解像度設定
        const constraints = getResolutionConstraints(resolution);
        
        // 画面キャプチャの取得
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: constraints,
            audio: withAudio
        });
        
        // 音声トラックの追加（オプション）
        if (withAudio && mode === 'desktop') {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch (err) {
                console.warn('音声の取得に失敗しました:', err);
            }
        }
        
        // プレビュー表示
        videoElement.srcObject = stream;
        placeholderElement.style.display = 'none';
        
        // MediaRecorderの設定
        const options = getRecorderOptions();
        mediaRecorder = new MediaRecorder(stream, options);
        
        // データ取得イベント
        mediaRecorder.ondataavailable = handleDataAvailable;
        
        // 録画停止イベント
        mediaRecorder.onstop = handleRecordingStopped;
        
        // 録画開始
        mediaRecorder.start(1000); // 1秒ごとにデータを取得
        
        // UI更新
        updateUIForRecording(true);
        
        // タイマー開始
        startTimer();
        
    } catch (err) {
        console.error('録画の開始に失敗しました:', err);
        updateStatus('録画の開始に失敗しました', 'error');
    }
}

// 録画停止
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        
        // タイマー停止
        clearInterval(timerInterval);
        
        // UI更新
        updateUIForRecording(false);
        updateStatus('録画を停止しました', 'success');
    }
}

// データ取得ハンドラ
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

// 録画停止ハンドラ
function handleRecordingStopped() {
    // 録画データの処理
    const format = document.getElementById('format').value;
    const blob = createVideoBlob(format);
    
    // 録画リストに追加
    addRecordingToList(blob, format);
    
    // リセット
    recordedChunks = [];
    videoElement.srcObject = null;
    placeholderElement.style.display = 'flex';
}

// ビデオBlobの作成
function createVideoBlob(format) {
    let mimeType;
    
    switch (format) {
        case 'mp4':
            mimeType = 'video/mp4';
            break;
        case 'gif':
            mimeType = 'image/gif';
            break;
        case 'webm':
        default:
            mimeType = 'video/webm';
    }
    
    return new Blob(recordedChunks, { type: mimeType });
}

// 録画リストに追加
function addRecordingToList(blob, format) {
    // 空のメッセージを削除
    const emptyMessage = document.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // 録画カウントを増加
    recordingsCount++;
    
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
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'btn primary';
    downloadButton.innerHTML = '<i class="fas fa-download"></i> ダウンロード';
    downloadButton.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${format}`;
        a.click();
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn danger';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> 削除';
    deleteButton.addEventListener('click', () => {
        recordingItem.remove();
        URL.revokeObjectURL(url);
        
        // リストが空の場合、メッセージを表示
        if (recordingsList.children.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = '録画ファイルはまだありません';
            recordingsList.appendChild(emptyMessage);
        }
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
    
    // ステータス更新
    updateStatus('録画が完了しました', 'success');
}

// タイマー開始
function startTimer() {
    startTime = Date.now();
    const timerElement = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        timerElement.textContent = formatTime(elapsedTime);
    }, 1000);
}

// 時間フォーマット
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

// UI更新（録画中/停止中）
function updateUIForRecording(isRecording) {
    const startPCButton = document.getElementById('startPC');
    const startMobileButton = document.getElementById('startMobile');
    const stopButton = document.getElementById('stop');
    const resolutionSelect = document.getElementById('resolution');
    const formatSelect = document.getElementById('format');
    const audioToggle = document.getElementById('audio');
    
    startPCButton.disabled = isRecording;
    startMobileButton.disabled = isRecording;
    stopButton.disabled = !isRecording;
    resolutionSelect.disabled = isRecording;
    formatSelect.disabled = isRecording;
    audioToggle.disabled = isRecording;
    
    if (isRecording) {
        updateStatus('録画中...', 'recording');
    } else {
        document.getElementById('timer').textContent = '00:00:00';
    }
}

// ステータス更新
function updateStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    
    // スタイル設定
    switch (type) {
        case 'error':
            statusElement.style.color = 'var(--danger-color)';
            break;
        case 'success':
            statusElement.style.color = 'var(--success-color)';
            break;
        case 'recording':
            statusElement.style.color = 'var(--danger-color)';
            break;
        default:
            statusElement.style.color = 'var(--secondary-color)';
    }
}

// 解像度制約の取得
function getResolutionConstraints(resolution) {
    switch (resolution) {
        case '480p':
            return {
                width: { ideal: 854 },
                height: { ideal: 480 },
                frameRate: { ideal: 35 }
            };
        case '720p':
            return {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            };
        case '1080p':
            return {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            };
        case '1080p60':
            return {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 60 }
            };
        default:
            return {};
    }
}

// レコーダーオプションの取得
function getRecorderOptions() {
    const format = document.getElementById('format').value;
    let options = {};
    
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
    
    // ビットレート設定
    const resolution = document.getElementById('resolution').value;
    
    switch (resolution) {
        case '480p':
            options.videoBitsPerSecond = 1000000; // 1 Mbps
            break;
        case '720p':
            options.videoBitsPerSecond = 2500000; // 2.5 Mbps
            break;
        case '1080p':
            options.videoBitsPerSecond = 5000000; // 5 Mbps
            break;
        case '1080p60':
            options.videoBitsPerSecond = 8000000; // 8 Mbps
            break;
    }
    
    return options;
}
