// --- 設定情報 (既存のscript.jsを踏襲) ---
const SUPABASE_URL = 'https://vaxlifsrimttefjevpbx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheGxpZnNyaW10dGVmamV2cGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzYyMTgsImV4cCI6MjA4NDAxMjIxOH0.AnffwtWCoprPdwgqKeThGBUclWUaJbh5ZemzM-CwK4Q';

// Supabaseクライアントの初期化
const supabaseClient = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

document.addEventListener('DOMContentLoaded', async () => {
    // 日付の初期設定
    const today = new Date();
    document.getElementById('ky-date-year').value = today.getFullYear();
    document.getElementById('ky-date-month').value = today.getMonth() + 1;
    document.getElementById('ky-date-day').value = today.getDate();

    // 現場リストの読み込み
    await loadSites();

    // 現場が変更されたらデータを読み込む
    const siteSelect = document.getElementById('site-select');
    siteSelect.addEventListener('change', () => {
        loadData(siteSelect.value);
    });

    // 印刷時にタイトルを変更
    window.addEventListener('beforeprint', () => {
        const y = document.getElementById('ky-date-year').value;
        const m = document.getElementById('ky-date-month').value;
        const d = document.getElementById('ky-date-day').value;
        const wc = document.getElementById('work-content').value;
        const sName = siteSelect.options[siteSelect.selectedIndex]?.text || '';
        document.title = `KY活動表_${y}${m}${d}_${sName.replace(/ /g, '')}_${wc}`;
    });

    // 危険度の自動計算機能の初期化
    initAutoCalculateDanger();

    // テキストエリア自動リサイズ・中央寄せ初期化
    initAutoResize();

    // 〇マークのクリック機能初期化
    initCircleMarks();

    // 参加者サイン用モーダルの初期化処理を開始する
    initSignatureModal();
});

// --- 〇マークのクリック・トグル処理 ---
function initCircleMarks() {
    const marks = document.querySelectorAll('.circle-mark');
    marks.forEach(mark => {
        mark.addEventListener('click', function () {
            const group = this.getAttribute('data-group');
            if (group) {
                // data-groupがある（あり・なし等）場合はグループ内で排他選択
                document.querySelectorAll(`.circle-mark[data-group="${group}"]`).forEach(el => el.classList.remove('active'));
                this.classList.add('active');
            } else {
                // グループ指定がない（複数選択可の「種類」等）場合はトグル
                this.classList.toggle('active');
            }
        });
    });
}

// --- テキストエリア自動リサイズと中央寄せ ---
function initAutoResize() {
    const textareas = document.querySelectorAll('.auto-resize-textarea');

    const adjust = (ta) => {
        // 現在の指定高さを保存
        const originalHeight = ta.style.height;

        // 基本設定にリセットして targetHeight（枠の高さ）を取得
        ta.style.fontSize = '1.1cqw';
        ta.style.paddingTop = '2px';
        const targetHeight = ta.clientHeight;

        // 実際の「文字だけの高さ（scrollHeight）」を測るため、一時的に高さを0にする
        let fs = 1.1;
        ta.style.height = '0px';

        // 枠の高さ（targetHeight）をはみ出す場合はフォントサイズを縮小
        while (ta.scrollHeight > targetHeight && fs > 0.6) {
            fs -= 0.1;
            ta.style.fontSize = fs.toFixed(1) + 'cqw';
        }

        // 縮小完了後の文字の高さ
        const textHeight = ta.scrollHeight;

        // 元の高さ（%等）に戻す
        ta.style.height = originalHeight;

        // 縦方向の余白（枠の高さ - 文字の高さ）を計算し中央寄せ
        const free = targetHeight - textHeight;
        if (free > 0) {
            ta.style.paddingTop = Math.floor(free / 2 + 2) + 'px'; // 元のpadding 2px に余白の半分を足す
        }
    };

    textareas.forEach(ta => {
        ta.addEventListener('input', () => adjust(ta));
        // 初期状態も反映
        setTimeout(() => adjust(ta), 200);
    });

    window.addEventListener('resize', () => {
        textareas.forEach(ta => adjust(ta));
    });
}

// --- 危険度評価の自動計算処理 ---
function initAutoCalculateDanger() {
    for (let i = 1; i <= 4; i++) {
        // [対策前]の入力と出力
        const probInput = document.getElementById(`danger-prob-${i}`);
        const sevInput = document.getElementById(`danger-sev-${i}`);
        const evalInput = document.getElementById(`danger-eval-${i}`);
        const levelInput = document.getElementById(`danger-level-${i}`);

        // [対策後]の入力と出力
        const afterEvalInput = document.getElementById(`danger-after-eval-${i}`);
        const afterLevelInput = document.getElementById(`danger-after-level-${i}`);

        if (probInput && sevInput && evalInput && levelInput) {
            const calcAndSet = () => {
                const prob = parseInt(probInput.value, 10);
                const sev = parseInt(sevInput.value, 10);

                if (!isNaN(prob) && !isNaN(sev)) {
                    // 評価値の計算（掛け算）
                    const evalVal = prob * sev;
                    evalInput.value = evalVal;

                    // 危険度レベルの判定
                    let levelStr = "";
                    if (evalVal === 9) levelStr = "Ⅴ";
                    else if (evalVal === 6) levelStr = "Ⅳ";
                    else if (evalVal === 3 || evalVal === 4) levelStr = "Ⅲ";
                    else if (evalVal === 2) levelStr = "Ⅱ";
                    else if (evalVal === 1) levelStr = "Ⅰ";

                    levelInput.value = levelStr;
                } else {
                    // 片方または両方が空（または数値でない）場合はクリアする
                    evalInput.value = "";
                    levelInput.value = "";
                }
            };
            // 入力のたびに計算を実行
            probInput.addEventListener('input', calcAndSet);
            sevInput.addEventListener('input', calcAndSet);
        }

        if (afterEvalInput && afterLevelInput) {
            const updateAfterLevel = () => {
                const afterEval = parseInt(afterEvalInput.value, 10);

                if (!isNaN(afterEval)) {
                    // 危険度レベルの判定
                    let levelStr = "";
                    if (afterEval === 9) levelStr = "Ⅴ";
                    else if (afterEval === 6) levelStr = "Ⅳ";
                    else if (afterEval === 3 || afterEval === 4) levelStr = "Ⅲ";
                    else if (afterEval === 2) levelStr = "Ⅱ";
                    else if (afterEval === 1) levelStr = "Ⅰ";

                    afterLevelInput.value = levelStr;
                } else {
                    afterLevelInput.value = "";
                }
            };
            // 入力のたびに判定を実行
            afterEvalInput.addEventListener('input', updateAfterLevel);
        }
    }
}

// --- 手書きキャンバス（モーダル版）の処理 ---
function initSignatureModal() {
    const mainCanvas = document.getElementById('signature-pad');
    const modalCanvas = document.getElementById('modal-signature-pad');
    const modal = document.getElementById('signature-modal');
    
    if (!mainCanvas || !modalCanvas || !modal) return;

    const mainCtx = mainCanvas.getContext('2d');
    const modalCtx = modalCanvas.getContext('2d');

    // 本紙側キャンバスのリサイズ（表示用）
    function resizeMainCanvas() {
        const signatureImage = mainCanvas.toDataURL();
        const rect = mainCanvas.parentElement.getBoundingClientRect();
        mainCanvas.width = rect.width;
        mainCanvas.height = rect.height;
        mainCtx.strokeStyle = 'black'; // 黒に変更
        mainCtx.lineWidth = 2;
        mainCtx.lineCap = 'round';
        mainCtx.lineJoin = 'round';

        if (signatureImage && signatureImage.length > 50) {
            const img = new Image();
            img.onload = () => mainCtx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
            img.src = signatureImage;
        }
    }

    resizeMainCanvas();
    window.addEventListener('resize', resizeMainCanvas);

    // 本紙キャンバスの親ラッパー（またはキャンバス自体）をクリック/タップしたらモーダルを開く
    const wrapper = document.getElementById('signature-wrapper');
    if (!wrapper && !mainCanvas) return;
    
    const triggerEl = wrapper || mainCanvas;

    // ガイドライン（縦8分割の半透明点線）を描画する関数
    function drawGridLines() {
        modalCtx.save();
        modalCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // 半透明の黒
        modalCtx.lineWidth = 1;
        modalCtx.setLineDash([5, 5]); // 点線
        
        const w = modalCanvas.width;
        const h = modalCanvas.height;
        
        modalCtx.beginPath();
        
        // 横線なし、縦に8分割（縦線7本）
        for (let i = 1; i <= 7; i++) {
            modalCtx.moveTo((w / 8) * i, 0);
            modalCtx.lineTo((w / 8) * i, h);
        }
        
        modalCtx.stroke();
        modalCtx.restore(); // 線種の設定などを元に戻す
    }

    function openSignatureModal(e) {
        // クリアボタンが押された場合はイベントを無視する
        if (e && e.target && (e.target.id === 'btn-clear-signature' || e.target.closest('#btn-clear-signature'))) {
            return;
        }
        
        if (e) e.preventDefault();
        
        modal.style.display = 'flex';
        
        // モーダル表示後にキャンバスサイズを確定させる
        setTimeout(() => {
            const rect = modalCanvas.parentElement.getBoundingClientRect();
            modalCanvas.width = rect.width;
            modalCanvas.height = rect.height;
            modalCtx.strokeStyle = 'black'; // 黒に変更
            modalCtx.lineWidth = 4;
            modalCtx.lineCap = 'round';
            modalCtx.lineJoin = 'round';
            
            // 8分割の点線ガイドを描画
            drawGridLines();
            
            // 本紙からコピー
            const currentImg = mainCanvas.toDataURL();
            if (currentImg && currentImg.length > 50) {
                const img = new Image();
                img.onload = () => modalCtx.drawImage(img, 0, 0, modalCanvas.width, modalCanvas.height);
                img.src = currentImg;
            }
        }, 50);
    }

    triggerEl.addEventListener('click', openSignatureModal);
    triggerEl.addEventListener('touchstart', openSignatureModal, { passive: false });

    // --- モーダル内の描画処理 ---
    let drawing = false;
    let isEraser = false; // 消しゴムモードかどうかのフラグ
    let undoStack = [];   // 描画履歴(DataURL)を保存する配列

    // 現在のキャンバス状態をスタックに保存する
    function saveState() {
        if (undoStack.length > 20) undoStack.shift(); // 最大戻り回数を20に制限
        undoStack.push(modalCanvas.toDataURL());
    }

    function getPos(e) {
        const rect = modalCanvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        // 描画開始直前の状態を保存する
        saveState();

        const pos = getPos(e);
        modalCtx.beginPath();
        modalCtx.moveTo(pos.x, pos.y);

        // ペンか消しゴムかで線の設定を変える
        if (isEraser) {
            modalCtx.globalCompositeOperation = 'destination-out';
            modalCtx.lineWidth = 20; // 消しゴムは太め
        } else {
            modalCtx.globalCompositeOperation = 'source-over';
            modalCtx.strokeStyle = 'black';
            modalCtx.lineWidth = 4;
            modalCtx.lineCap = 'round';
            modalCtx.lineJoin = 'round';
        }
    }

    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        modalCtx.lineTo(pos.x, pos.y);
        modalCtx.stroke();
    }

    function endDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        drawing = false;
        modalCtx.closePath();
    }

    // マウス
    modalCanvas.addEventListener('mousedown', startDraw);
    modalCanvas.addEventListener('mousemove', draw);
    modalCanvas.addEventListener('mouseup', endDraw);
    modalCanvas.addEventListener('mouseout', endDraw);
    // タッチ
    modalCanvas.addEventListener('touchstart', startDraw, { passive: false });
    modalCanvas.addEventListener('touchmove', draw, { passive: false });
    modalCanvas.addEventListener('touchend', endDraw);
    modalCanvas.addEventListener('touchcancel', endDraw);

    // モーダル内ボタン処理
    document.getElementById('modal-signature-clear').addEventListener('click', () => {
        // スタックを保存してから全消去する（全消去自体もUndoできるようにする）
        saveState();
        modalCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
        drawGridLines(); // やり直し時にガイドラインを再描画
    });

    document.getElementById('modal-signature-undo').addEventListener('click', () => {
        if (undoStack.length === 0) {
            // 履歴がなければ何もしない（全消去状態にするかそのまま）
            return;
        }
        // 1つ前の状態を取得して描画
        const prevState = undoStack.pop();
        const img = new Image();
        img.onload = () => {
            modalCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
            modalCtx.drawImage(img, 0, 0, modalCanvas.width, modalCanvas.height);
            // ※必要に応じてガイドラインの再描画を追加してもよいが、画像ごと戻るのでそのままにするか、状況次第
            // 背景透過キャンバスなので消した部分のガイドラインも戻る
        };
        img.src = prevState;
    });

    const btnEraser = document.getElementById('modal-signature-eraser');
    btnEraser.addEventListener('click', () => {
        isEraser = !isEraser;
        if (isEraser) {
            btnEraser.textContent = 'ペンに戻す';
            btnEraser.style.background = '#475569'; // 少し暗く
            modalCanvas.style.cursor = 'crosshair'; // または他のアイコン
        } else {
            btnEraser.textContent = '消しゴム';
            btnEraser.style.background = '#64748b'; // 元の色
            modalCanvas.style.cursor = 'crosshair';
        }
    });

    document.getElementById('modal-signature-cancel').addEventListener('click', () => {
        modal.style.display = 'none';
        // キャンセル時はペンモードに戻しておく
        isEraser = false;
        btnEraser.textContent = '消しゴム';
        btnEraser.style.background = '#64748b';
    });

    document.getElementById('modal-signature-save').addEventListener('click', () => {
        // モーダルの内容を本紙側にコピーして閉じる
        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        
        // --- ガイドラインを消して（無視して）保存したいが、今回は表示状態をそのまま画像化する ---
        // (厳密には再描画からやり直す方法もあるが現状維持)
        
        const signedImg = modalCanvas.toDataURL();
        if (signedImg && signedImg.length > 50) {
            const img = new Image();
            img.onload = () => mainCtx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
            img.src = signedImg;
        }
        modal.style.display = 'none';
        
        // 次回のためにペンモードに戻す
        isEraser = false;
        btnEraser.textContent = '消しゴム';
        btnEraser.style.background = '#64748b';
        
        // 入力イベントを発火させて保存フラグを立てる等のため（必要に応じ）
        mainCanvas.dispatchEvent(new Event('input'));
    });

    // 本紙側のクリアボタン連携（一応残す）
    const clearBtn = document.getElementById('btn-clear-signature');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        });
    }
}

async function loadSites() {
    if (!supabaseClient) {
        alert("Supabaseクライアントが初期化されていません。");
        return;
    }
    const select = document.getElementById('site-select');

    // 施工中の現場のみ取得
    const { data: sites, error } = await supabaseClient
        .from('sites')
        .select('id, name')
        .eq('status', '施工中')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('last_updated', { ascending: false });

    select.innerHTML = '<option value="">-- 現場を選択してください --</option>';

    if (error) {
        console.error("現場データの取得に失敗", error);
        alert("現場データの取得に失敗しました。");
        return;
    }

    sites.forEach(site => {
        const opt = document.createElement('option');
        opt.value = site.id;
        opt.textContent = site.name;
        select.appendChild(opt);
    });

    // URLにsite_idがあれば自動選択
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('site_id');
    if (siteId) {
        select.value = siteId;
        loadData(siteId);
    }
}

// フォームの入力値を集める
function collectFormData() {
    const data = {
        kyDateYear: document.getElementById('ky-date-year').value,
        kyDateMonth: document.getElementById('ky-date-month').value,
        kyDateDay: document.getElementById('ky-date-day').value,
        sign1: document.getElementById('sign1').value,
        sign2: document.getElementById('sign2').value,
        sign3: document.getElementById('sign3').value,
        constructionName: document.getElementById('construction-name') ? document.getElementById('construction-name').value : '',
        workContent: document.getElementById('work-content').value,
        todayGoal: document.getElementById('today-goal').value,

        lifeOverheadExist: document.querySelector('input[name="overhead_exist"]:checked')?.value || 'なし',
        lifeOverheadType: document.getElementById('life-overhead-type').value,
        lifeOverheadMeasure: document.getElementById('life-overhead-measure').value,
        lifeOverheadGuide: document.getElementById('life-overhead-guide').value,

        lifeBuriedExist: document.querySelector('input[name="buried_exist"]:checked')?.value || 'なし',
        lifeBuriedType: document.getElementById('life-buried-type').value,
        lifeBuriedMeasure: document.getElementById('life-buried-measure').value,
        lifeBuriedGuide: document.getElementById('life-buried-guide').value,

        companyName: document.getElementById('company-name').value,
        leaderName: document.getElementById('leader-name').value,
        memberCount: document.getElementById('member-count').value,

        signatureImage: document.getElementById('signature-pad') ? document.getElementById('signature-pad').toDataURL('image/png') : null,
        circleMarks: Array.from(document.querySelectorAll('.circle-mark.active')).map(el => el.id),

        dangers: []
    };

    for (let i = 1; i <= 4; i++) {
        data.dangers.push({
            point: document.getElementById(`danger-point-${i}`).value,
            prob: document.getElementById(`danger-prob-${i}`).value,
            sev: document.getElementById(`danger-sev-${i}`).value,
            eval: document.getElementById(`danger-eval-${i}`).value,
            level: document.getElementById(`danger-level-${i}`).value,
            resp: document.getElementById(`danger-resp-${i}`).value,
            afterEval: document.getElementById(`danger-after-eval-${i}`).value,
            afterLevel: document.getElementById(`danger-after-level-${i}`).value,
        });
    }

    return data;
}

// フォームに入力値をセットする
function populateFormData(data) {
    if (!data) return;

    if (data.kyDateYear) document.getElementById('ky-date-year').value = data.kyDateYear;
    if (data.kyDateMonth) document.getElementById('ky-date-month').value = data.kyDateMonth;
    if (data.kyDateDay) document.getElementById('ky-date-day').value = data.kyDateDay;
    if (data.sign1) document.getElementById('sign1').value = data.sign1;
    if (data.sign2) document.getElementById('sign2').value = data.sign2;
    if (data.sign3) document.getElementById('sign3').value = data.sign3;
    if (data.constructionName && document.getElementById('construction-name')) {
        document.getElementById('construction-name').value = data.constructionName;
    }
    if (data.workContent) document.getElementById('work-content').value = data.workContent;
    if (data.todayGoal) document.getElementById('today-goal').value = data.todayGoal;

    if (data.lifeOverheadExist) {
        document.querySelector(`input[name="overhead_exist"][value="${data.lifeOverheadExist}"]`).checked = true;
    }
    if (data.lifeOverheadType) document.getElementById('life-overhead-type').value = data.lifeOverheadType;
    if (data.lifeOverheadMeasure) document.getElementById('life-overhead-measure').value = data.lifeOverheadMeasure;
    if (data.lifeOverheadGuide) document.getElementById('life-overhead-guide').value = data.lifeOverheadGuide;

    if (data.lifeBuriedExist) {
        document.querySelector(`input[name="buried_exist"][value="${data.lifeBuriedExist}"]`).checked = true;
    }
    if (data.lifeBuriedType) document.getElementById('life-buried-type').value = data.lifeBuriedType;
    if (data.lifeBuriedMeasure) document.getElementById('life-buried-measure').value = data.lifeBuriedMeasure;
    if (data.lifeBuriedGuide) document.getElementById('life-buried-guide').value = data.lifeBuriedGuide;

    if (data.companyName) document.getElementById('company-name').value = data.companyName;
    if (data.leaderName) document.getElementById('leader-name').value = data.leaderName;
    if (data.memberCount) document.getElementById('member-count').value = data.memberCount;

    // 〇マークの復元
    if (data.circleMarks && Array.isArray(data.circleMarks)) {
        // 保存データがあれば一旦すべての active を解除し、保存されているIDのみ付与
        document.querySelectorAll('.circle-mark').forEach(el => el.classList.remove('active'));
        data.circleMarks.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('active');
        });
    }

    if (data.signatureImage) {
        const canvas = document.getElementById('signature-pad');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = data.signatureImage;
        }
    }

    if (data.dangers && Array.isArray(data.dangers)) {
        data.dangers.forEach((d, index) => {
            const i = index + 1;
            if (i > 4) return;
            document.getElementById(`danger-point-${i}`).value = d.point || '';
            document.getElementById(`danger-prob-${i}`).value = d.prob || '';
            document.getElementById(`danger-sev-${i}`).value = d.sev || '';
            document.getElementById(`danger-eval-${i}`).value = d.eval || '';
            document.getElementById(`danger-level-${i}`).value = d.level || '';
            document.getElementById(`danger-resp-${i}`).value = d.resp || '';
            document.getElementById(`danger-after-eval-${i}`).value = d.afterEval || '';
            document.getElementById(`danger-after-level-${i}`).value = d.afterLevel || '';
        });
    }

    // 値セット後、リサイズと再計算をトリガー
    setTimeout(() => {
        document.querySelectorAll('.auto-resize-textarea').forEach(el => el.dispatchEvent(new Event('input')));
        document.querySelectorAll('[id^=danger-prob-], [id^=danger-sev-], [id^=danger-after-eval-]').forEach(el => el.dispatchEvent(new Event('input')));
    }, 100);
}

// データの保存（ローカルストレージとSupabase両方）
async function saveData() {
    const siteId = document.getElementById('site-select').value;
    if (!siteId) {
        alert("現場を選択してください。");
        return;
    }

    const formData = collectFormData();

    // 1. LocalStorageに一時保存（オフライン対策・素早い復元のため）
    const storageKey = `ky_form_${siteId}`;
    localStorage.setItem(storageKey, JSON.stringify(formData));

    // 2. Supabase(inspectionsテーブル)へ保存
    // 既存システムの設計を活かし、ky_formという特殊なmachine_typeとして保存する
    const y = formData.kyDateYear.padStart(4, '20');
    const m = String(formData.kyDateMonth).padStart(2, '0');
    const d = String(formData.kyDateDay).padStart(2, '0');
    const inspectionDate = `${y}-${m}-${d}`;

    const btn = document.querySelector('.primary-btn');
    const originalText = btn.innerText;
    btn.innerText = "保存中...";
    btn.disabled = true;

    try {
        // 同じ現場・同じ日付にKY用紙データがあるか確認
        const { data: existing } = await supabaseClient
            .from('inspections')
            .select('id')
            .eq('site_id', siteId)
            .eq('machine_type', 'ky_form')
            .eq('inspection_date', inspectionDate)
            .or('is_deleted.is.null,is_deleted.eq.false')
            .single();

        const payload = {
            site_id: siteId,
            machine_type: 'ky_form',
            model_type: 'ky_form_v1',
            machine_id: 'KY-01', // 固定ID
            inspection_date: inspectionDate,
            operating_hours: 0,
            inspector_name: formData.leaderName, // リーダー名を点検者名に入れる
            statuses: formData
        };

        let result;
        if (existing && existing.id) {
            // 更新
            result = await supabaseClient.from('inspections').update(payload).eq('id', existing.id);
        } else {
            // 新規作成
            result = await supabaseClient.from('inspections').insert([payload]);
        }

        if (result.error) throw result.error;
        alert("保存しました。");
    } catch (err) {
        console.error("保存エラー", err);
        alert("サーバーへの保存に失敗しました。一時保存は完了しています。");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// データの読み込み
async function loadData(siteId) {
    if (!siteId) return;

    // フォームを一旦クリア
    document.querySelectorAll('input[type="text"]').forEach(el => {
        // デフォルト値があるものは消さない（光・水道など）
        if (el.id.includes('type') && el.value) return;
        if (!el.id.includes('ky-date')) el.value = '';
    });

    const y = document.getElementById('ky-date-year').value.padStart(4, '20');
    const m = String(document.getElementById('ky-date-month').value).padStart(2, '0');
    const d = String(document.getElementById('ky-date-day').value).padStart(2, '0');
    const inspectionDate = `${y}-${m}-${d}`;

    try {
        // 1. まずサーバーから最新データを取得試みる
        const { data, error } = await supabaseClient
            .from('inspections')
            .select('statuses')
            .eq('site_id', siteId)
            .eq('machine_type', 'ky_form')
            .eq('inspection_date', inspectionDate)
            .or('is_deleted.is.null,is_deleted.eq.false')
            .single();

        if (data && data.statuses) {
            populateFormData(data.statuses);
            console.log("Supabaseからデータをロードしました");
            return;
        }
    } catch (err) {
        // レコードがない、またはオフライン
        console.log("サーバー上にデータなし。ローカルフォールバック");
    }

    // 2. サーバーになければLocalStorageから過去の入力を復元（日付など関係なく最新の形として復元）
    const localDataStr = localStorage.getItem(`ky_form_${siteId}`);
    if (localDataStr) {
        try {
            const formData = JSON.parse(localDataStr);
            // 日付は今のままにしておく（今日の日付で自動入力されるため）
            const keepYear = document.getElementById('ky-date-year').value;
            const keepMonth = document.getElementById('ky-date-month').value;
            const keepDay = document.getElementById('ky-date-day').value;

            populateFormData(formData);

            document.getElementById('ky-date-year').value = keepYear;
            document.getElementById('ky-date-month').value = keepMonth;
            document.getElementById('ky-date-day').value = keepDay;
            console.log("LocalStorageからデータをロードしました");
        } catch (e) {
            console.error("LocalStorageパースエラー", e);
        }
    }

    // 工事名が空の場合、選択中の現場名を初期値として自動設定する
    const cNameInput = document.getElementById('construction-name');
    if (cNameInput && !cNameInput.value) {
        const selectEl = document.getElementById('site-select');
        const selectedText = selectEl.options[selectEl.selectedIndex]?.text;
        if (selectedText && selectedText !== '-- 現場を選択してください --') {
            cNameInput.value = selectedText;
        }
    }
}
