// 画面録画アプリ - Aro Software Group
// メインアプリケーションスクリプト - MP4専用版

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
    console.log('DOMContentLoaded event fired');
    
    // DOM要素の取得
    videoElement = document.getElementById('preview');
    placeholderElement = document.getElementById('placeholder');
    recordingsList = document.getElementById('recordings-list');
    
    console.log('DOM elements:', {
        videoElement: !!videoElement,
        placeholderElement: !!placeholderElement,
        recordingsList: !!recordingsList
    });
    
    // ボタン要素
    const startPCButton = document.getElementById('startPC');
    const startMobileButton = document.getElementById('startMobile');
    const stopButton = document.getElementById('stop');
    
    console.log('Button elements:', {
        startPCButton: !!startPCButton,
        startMobileButton: !!startMobileButton,
        stopButton: !!stopButton
    });
    
    // 設定要素
    const resolutionSelect = document.getElementById('resolution');
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
    console.log('Setting up event listeners');
    
    if (startPCButton) {
        startPCButton.addEventListener('click', () => {
            console.log('PC録画ボタンがクリックされました');
            startRecording('desktop');
        });
    }
    
    if (startMobileButton) {
        startMobileButton.addEventListener('click', () => {
            console.log('スマホ録画ボタンがクリックされました');
            showMobileGuide();
        });
    }
    
    if (stopButton) {
        stopButton.addEventListener('click', () => {
            console.log('録画停止ボタンがクリックされました');
            stopRecording();
        });
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            console.log('モーダル閉じるボタンがクリックされました');
            mobileGuideModal.style.display = 'none';
        });
    }
    
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
    console.log('Checking browser compatibility');
    const statusElement = document.getElementById('status');
    
    if (!navigator.mediaDevices) {
        console.error('navigator.mediaDevices is not available');
        if (statusElement) {
            statusElement.textContent = 'お使いのブラウザは画面録画に対応していません';
            statusElement.style.color = 'var(--danger-color)';
        }
        const startPCButton = document.getElementById('startPC');
        const startMobileButton = document.getElementById('startMobile');
        if (startPCButton) startPCButton.disabled = true;
        if (startMobileButton) startMobileButton.disabled = true;
        return false;
    }
    
    if (!navigator.mediaDevices.getDisplayMedia) {
        console.error('navigator.mediaDevices.getDisplayMedia is not available');
        if (statusElement) {
            statusElement.textContent = 'お使いのブラウザは画面録画に対応していません';
            statusElement.style.color = 'var(--danger-color)';
        }
        const startPCButton = document.getElementById('startPC');
        const startMobileButton = document.getElementById('startMobile');
        if (startPCButton) startPCButton.disabled = true;
        if (startMobileButton) startMobileButton.disabled = true;
        return false;
    }
    
    console.log('Browser compatibility check passed');
    return true;
}

// モバイルガイド表示
function showMobileGuide() {
    console.log('Showing mobile guide');
    // モバイルデバイスチェック
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Is mobile device:', isMobile);
    
    if (isMobile) {
        // モバイルデバイスの場合は直接録画開始
        startRecording('mobile');
    } else {
        // PCの場合はガイドモーダルを表示
        const mobileGuideModal = document.getElementById('mobile-guide');
        if (mobileGuideModal) {
            mobileGuideModal.style.display = 'block';
        } else {
            console.error('Mobile guide modal element not found');
        }
    }
}

// 録画開始
async function startRecording(mode) {
    console.log(`Starting recording in ${mode} mode`);
    
    // ブラウザ対応チェック
    if (!checkBrowserCompatibility()) {
        console.error('Browser compatibility check failed');
        return;
    }
    
    // 設定の取得
    const resolutionSelect = document.getElementById('resolution');
    const audioToggle = document.getElementById('audio');
    const bakusokuToggle = document.getElementById('bakusoku');
    
    if (!resolutionSelect || !audioToggle || !bakusokuToggle) {
        console.error('Settings elements not found', {
            resolutionSelect: !!resolutionSelect,
            audioToggle: !!audioToggle,
            bakusokuToggle: !!bakusokuToggle
        });
        return;
    }
    
    const resolution = resolutionSelect.value;
    const withAudio = audioToggle.checked;
    const isBakusoku = bakusokuToggle.checked;
    
    console.log('Recording settings:', {
        resolution,
        withAudio,
        isBakusoku,
        mode
    });
    
    try {
        // 解像度設定
        console.log('Getting resolution constraints');
        let resolutionObj;
        
        // ResolutionManagerが定義されているか確認
        if (typeof ResolutionManager !== 'undefined') {
            resolutionObj = ResolutionManager.getResolutionById(resolution);
            console.log('Resolution object from ResolutionManager:', resolutionObj);
        } else {
            // フォールバック: 解像度設定を直接定義
            console.warn('ResolutionManager not available, using fallback resolution settings');
            const resolutionMap = {
                '480p': { id: '480p', width: 854, height: 480, frameRate: 35 },
                '720p': { id: '720p', width: 1280, height: 720, frameRate: 30 },
                '1080p': { id: '1080p', width: 1920, height: 1080, frameRate: 30 },
                '1080p60': { id: '1080p60', width: 1920, height: 1080, frameRate: 60 }
            };
            resolutionObj = resolutionMap[resolution] || resolutionMap['720p'];
            console.log('Fallback resolution object:', resolutionObj);
        }
        
        // 画面キャプチャの制約を設定
        const videoConstraints = {
            width: { ideal: resolutionObj.width },
            height: { ideal: resolutionObj.height },
            frameRate: { ideal: resolutionObj.frameRate }
        };
        
        console.log('Video constraints:', videoConstraints);
        
        // 画面キャプチャの取得
        console.log('Requesting display media with constraints:', { video: videoConstraints, audio: withAudio });
        
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: videoConstraints,
                audio: withAudio
            });
            console.log('Display media stream obtained:', stream);
            
            // 音声トラックの追加（オプション）
            if (withAudio && mode === 'desktop') {
                try {
                    console.log('Requesting user audio');
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    console.log('Audio stream obtained:', audioStream);
                    audioStream.getAudioTracks().forEach(track => {
                        console.log('Adding audio track to stream:', track);
                        stream.addTrack(track);
                    });
                } catch (err) {
                    console.warn('Failed to get audio:', err);
                }
            }
            
            // プレビュー表示
            console.log('Setting preview video source');
            videoElement.srcObject = stream;
            placeholderElement.style.display = 'none';
            
            // BAKUSOKUモードの場合は解像度とフレームレートを下げる
            if (isBakusoku) {
                console.log('Applying BAKUSOKU mode constraints');
                // ビデオトラックの設定を変更
                stream.getVideoTracks().forEach(track => {
                    const settings = track.getSettings();
                    console.log('Current track settings:', settings);
                    const constraints = {
                        width: Math.round(settings.width * 0.6),
                        height: Math.round(settings.height * 0.6),
                        frameRate: 30
                    };
                    console.log('Applying constraints:', constraints);
                    track.applyConstraints(constraints).catch(e => console.warn('BAKUSOKU mode setting error:', e));
                });
            }
            
            // ビットレート設定
            const bitrate = isBakusoku ? 2500000 : getBitrateForResolution(resolutionObj);
            console.log('Using bitrate:', bitrate);
            
            // MediaRecorderの設定 - MP4専用
            console.log('Creating MediaRecorder for MP4');
            
            // MP4用のMIMEタイプとオプション
            let options = {
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
                    'video/mp4; codecs="avc1.42E01E"',
                    'video/x-matroska; codecs="avc1.42E01E, opus"'
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
                    options = { videoBitsPerSecond: bitrate };
                }
            }
            
            console.log('MediaRecorder options:', options);
            
            mediaRecorder = new MediaRecorder(stream, options);
            console.log('MediaRecorder created:', mediaRecorder);
            
            // データ取得イベント
            mediaRecorder.ondataavailable = handleDataAvailable;
            
            // 録画停止イベント
            mediaRecorder.onstop = handleRecordingStopped;
            
            // 録画開始
            mediaRecorder.start(1000); // 1秒ごとにデータを取得
            console.log('MediaRecorder started');
            
            // UI更新
            updateUIForRecording(true);
            
            // タイマー開始
            startTimer();
            
        } catch (displayMediaError) {
            console.error('Failed to get display media:', displayMediaError);
            
            // ユーザーがキャンセルした場合のエラーメッセージを表示
            if (displayMediaError.name === 'NotAllowedError') {
                updateStatus('画面共有が許可されませんでした', 'error');
            } else {
                updateStatus('画面キャプチャの取得に失敗しました', 'error');
            }
        }
        
    } catch (err) {
        console.error('Failed to start recording:', err);
        updateStatus('録画の開始に失敗しました', 'error');
    }
}

// 解像度に基づいたビットレートを取得
function getBitrateForResolution(resolution) {
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

// 録画停止
function stopRecording() {
    console.log('Stopping recording');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        console.log('MediaRecorder state before stop:', mediaRecorder.state);
        mediaRecorder.stop();
        console.log('MediaRecorder stopped');
        
        if (stream) {
            console.log('Stopping all tracks');
            stream.getTracks().forEach(track => {
                console.log('Stopping track:', track);
                track.stop();
            });
        }
        
        // タイマー停止
        clearInterval(timerInterval);
        console.log('Timer stopped');
        
        // UI更新
        updateUIForRecording(false);
        updateStatus('録画を停止しました', 'success');
    } else {
        console.warn('No active recording to stop');
    }
}

// データ取得ハンドラ
function handleDataAvailable(event) {
    console.log('Data available event:', event);
    if (event.data && event.data.size > 0) {
        console.log('Adding chunk of size:', event.data.size);
        recordedChunks.push(event.data);
    }
}

// 録画停止ハンドラ
function handleRecordingStopped() {
    console.log('Recording stopped handler');
    // ステータス更新
    updateStatus('録画データを処理中...', 'processing');
    
    // 録画データを処理
    processRecording()
        .then(blob => {
            console.log('Recording processed successfully, blob size:', blob.size);
            // 録画リストに追加
            addRecordingToList(blob);
            
            // リセット
            recordedChunks = [];
            videoElement.srcObject = null;
            placeholderElement.style.display = 'flex';
        })
        .catch(error => {
            console.error('Recording processing error:', error);
            updateStatus('録画処理に失敗しました', 'error');
            
            // リセット
            recordedChunks = [];
            videoElement.srcObject = null;
            placeholderElement.style.display = 'flex';
        });
}

// 録画データの処理 - MP4専用
async function processRecording() {
    console.log('Processing recording');
    try {
        updateStatus('MP4形式で保存中...', 'processing');
        
        // 録画データをMP4形式で取得
        console.log('Creating MP4 blob from recorded chunks');
        const mp4Blob = new Blob(recordedChunks, { type: 'video/mp4' });
        console.log('MP4 blob created, size:', mp4Blob.size);
        
        // MP4メタデータの処理
        console.log('Processing MP4 metadata');
        
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
        
        // MP4メタデータを処理
        const processedBlob = await processMP4(mp4Blob, {
            progressCallback: updateProgress
        });
        
        // 進捗バーを削除
        if (progressContainer.parentNode) {
            progressContainer.parentNode.removeChild(progressContainer);
        }
        
        return processedBlob;
    } catch (error) {
        console.error('Error in processRecording:', error);
        throw error;
    }
}

// 録画リストに追加
function addRecordingToList(blob) {
    console.log('Adding recording to list');
    recordingsCount++;
    const timestamp = new Date().toLocaleString();
    const fileName = `screen-recording-${recordingsCount}.mp4`;
    
    // 空のメッセージを削除
    const emptyMessage = document.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // 録画アイテムの作成
    const recordingItem = document.createElement('div');
    recordingItem.className = 'recording-item new-recording';
    
    // URLの作成
    const blobUrl = URL.createObjectURL(blob);
    console.log('Blob URL created:', blobUrl);
    
    // HTML構造の作成
    recordingItem.innerHTML = `
        <div class="recording-preview">
            <video controls src="${blobUrl}"></video>
            <div class="enhanced-controls">
                <button class="control-btn" data-action="skip-backward">-10秒</button>
                <button class="control-btn" data-action="skip-forward">+30秒</button>
                <select class="speed-control">
                    <option value="0.5">0.5x</option>
                    <option value="1" selected>1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                </select>
            </div>
        </div>
        <div class="recording-info">
            <h3>${fileName}</h3>
            <p>録画日時: ${timestamp}</p>
            <p>形式: MP4</p>
            <div class="recording-actions">
                <a href="${blobUrl}" download="${fileName}" class="btn primary">
                    <i class="fas fa-download"></i> ダウンロード
                </a>
                <button class="btn danger" data-action="delete">
                    <i class="fas fa-trash"></i> 削除
                </button>
            </div>
        </div>
    `;
    
    // リストに追加
    recordingsList.appendChild(recordingItem);
    console.log('Recording item added to list');
    
    // 拡張コントロールの設定
    setupEnhancedControls(recordingItem);
    
    // 削除ボタンの設定
    const deleteButton = recordingItem.querySelector('[data-action="delete"]');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            console.log('Delete button clicked');
            // 削除アニメーション
            recordingItem.style.animation = 'fadeOut 0.3s ease-out forwards';
            
            setTimeout(() => {
                recordingItem.remove();
                URL.revokeObjectURL(blobUrl);
                
                // リストが空の場合、メッセージを表示
                if (recordingsList.children.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-message';
                    emptyMessage.textContent = '録画ファイルはまだありません';
                    recordingsList.appendChild(emptyMessage);
                }
            }, 300);
        });
    }
    
    // 完了ステータス
    updateStatus('録画が完了しました', 'success');
}

// 拡張コントロールの設定
function setupEnhancedControls(recordingItem) {
    console.log('Setting up enhanced controls');
    const video = recordingItem.querySelector('video');
    const skipBackward = recordingItem.querySelector('[data-action="skip-backward"]');
    const skipForward = recordingItem.querySelector('[data-action="skip-forward"]');
    const speedControl = recordingItem.querySelector('.speed-control');
    
    if (!video || !skipBackward || !skipForward || !speedControl) {
        console.error('Enhanced control elements not found', {
            video: !!video,
            skipBackward: !!skipBackward,
            skipForward: !!skipForward,
            speedControl: !!speedControl
        });
        return;
    }
    
    // 動画の読み込み完了時にメタデータを確認
    video.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded:', {
            duration: video.duration,
            seekable: video.seekable.length > 0
        });
        
        // シーク可能かどうかを確認
        if (video.seekable.length === 0) {
            console.warn('Video is not seekable');
            skipBackward.disabled = true;
            skipForward.disabled = true;
        }
    });
    
    // 巻き戻しボタン
    skipBackward.addEventListener('click', () => {
        console.log('Skip backward clicked');
        if (video) {
            video.currentTime = Math.max(0, video.currentTime - 10);
        }
    });
    
    // 早送りボタン
    skipForward.addEventListener('click', () => {
        console.log('Skip forward clicked');
        if (video) {
            video.currentTime = Math.min(video.duration, video.currentTime + 30);
        }
    });
    
    // 再生速度
    speedControl.addEventListener('change', () => {
        console.log('Speed control changed:', speedControl.value);
        if (video) {
            video.playbackRate = parseFloat(speedControl.value);
        }
    });
}

// UI更新（録画中/停止中）
function updateUIForRecording(isRecording) {
    console.log('Updating UI for recording state:', isRecording);
    const startPCButton = document.getElementById('startPC');
    const startMobileButton = document.getElementById('startMobile');
    const stopButton = document.getElementById('stop');
    const statusElement = document.getElementById('status');
    
    if (startPCButton) startPCButton.disabled = isRecording;
    if (startMobileButton) startMobileButton.disabled = isRecording;
    if (stopButton) stopButton.disabled = !isRecording;
    
    if (statusElement) {
        if (isRecording) {
            statusElement.textContent = '録画中...';
            statusElement.className = 'status-recording';
        } else {
            statusElement.textContent = '準備完了';
            statusElement.className = '';
        }
    }
}

// ステータス更新
function updateStatus(message, type = '') {
    console.log('Updating status:', message, type);
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = '';
        
        if (type) {
            statusElement.classList.add(`status-${type}`);
        }
    }
}

// タイマー開始
function startTimer() {
    console.log('Starting timer');
    const timerElement = document.getElementById('timer');
    startTime = new Date().getTime();
    
    // 既存のタイマーをクリア
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // タイマー更新
    timerInterval = setInterval(() => {
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - startTime;
        
        const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
        
        const formattedTime = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');
        
        if (timerElement) {
            timerElement.textContent = formattedTime;
        }
    }, 1000);
}

// 直接イベントリスナーを追加（DOMContentLoadedが既に発生している場合のため）
window.addEventListener('load', () => {
    console.log('Window load event fired - adding direct event listeners');
    
    const startPCButton = document.getElementById('startPC');
    const startMobileButton = document.getElementById('startMobile');
    const stopButton = document.getElementById('stop');
    
    if (startPCButton) {
        console.log('Adding direct click listener to PC recording button');
        startPCButton.onclick = () => {
            console.log('PC録画ボタンが直接クリックされました');
            startRecording('desktop');
        };
    }
    
    if (startMobileButton) {
        console.log('Adding direct click listener to mobile recording button');
        startMobileButton.onclick = () => {
            console.log('スマホ録画ボタンが直接クリックされました');
            showMobileGuide();
        };
    }
    
    if (stopButton) {
        console.log('Adding direct click listener to stop button');
        stopButton.onclick = () => {
            console.log('録画停止ボタンが直接クリックされました');
            stopRecording();
        };
    }
});
