// --- 設定情報 ---
const SUPABASE_URL = 'https://vaxlifsrimttefjevpbx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheGxpZnNyaW10dGVmamV2cGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzYyMTgsImV4cCI6MjA4NDAxMjIxOH0.AnffwtWCoprPdwgqKeThGBUclWUaJbh5ZemzM-CwK4Q';
const LIFF_ID = '2008902635-5DQbjvmz';

// --- グローバル変数 ---
let currentMachineId = null;
let currentSiteId = new URLSearchParams(window.location.search).get('site_id');
let currentInspectionId = new URLSearchParams(window.location.search).get('id');
let lineUserInfo = null;
let deleteTargetId = null; // for site/inspection deletion
let deleteTargetSiteId = null; // for machine deletion
let deleteTargetMachineId = null; // for machine deletion
let deleteType = null; // 'site', 'inspection', or 'machine'

const statusOptions = [
    { code: 'good', mark: 'レ', label: '良好' },
    { code: 'adjust', mark: 'A', label: '調整' },
    { code: 'repair', mark: '△', label: '修理' },
    { code: 'replace', mark: 'X', label: '取替' },
    { code: 'oil', mark: 'L', label: '給油水' },
    { code: 'clean', mark: 'C', label: '清掃' },
    { code: 'none', mark: '／', label: '該当なし' }
];

const dailyStatusOptions = [
    { code: 'none', mark: '　', label: '未点検' },
    { code: 'good', mark: '○', label: '良好' },
    { code: 'repair', mark: '×', label: '不良' },
    { code: 'done', mark: '●', label: '処置済' }
];

const dailyMonthlyTypes = [
    'shovel_daily', 'sandbag', 'power_tool', 'generator', 'dist_board',
    'pump', 'arc_welder', 'elec_equip', 'hanging_tools', 'iron_plate',
    'security_daily', 'excavation_daily', 'crane_daily', 'tractor_daily'
];

// Supabaseクライアントの初期化
const supabaseClient = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// 機械マスターデータ
// ここに頻繁に使用する機械の情報を登録しておくと、現場管理No選時に自動入力されます

// 補助関数: 点検タイプからベース機種名を取得 (例: shovel_daily -> shovel)
function getBaseMachineType(type) {
    if (!type) return null;
    if (type.endsWith('_daily')) return type.replace('_daily', '');
    return type;
}

// 補助関数: 車両系の日常点検タイプ名を取得
function getDailyMachineType(baseType) {
    if (['shovel', 'tractor', 'crane'].includes(baseType)) return baseType + '_daily';
    return null;
}



// 機械マスターデータ (Shovel)
const shovelMachineList = [
    { name: "コベルコバックホー", model: "SK200-10", company_id: "41" },
    { name: "コマツバックホー", model: "HB205-1", company_id: "42" },
    { name: "コベルコバックホー", model: "SK125SR-2", company_id: "43" },
    { name: "コベルコバックホー", model: "SK225SR-5", company_id: "45" },
    { name: "コベルコバックホー", model: "SK200-8", company_id: "46" },
    { name: "コベルコバックホー", model: "SK200-9", company_id: "47" },
    { name: "コベルコバックホー", model: "SK200-10", company_id: "49" },
    { name: "コベルコバックホー", model: "SK200-10", company_id: "51" },
    { name: "コベルコバックホー", model: "SK330-10", company_id: "52" },
    { name: "コベルコバックホー", model: "SK200-10", company_id: "53" },
    { name: "コベルコバックホー", model: "SK330-10", company_id: "54" },
    { name: "コベルコバックホー", model: "SK225SR-5", company_id: "59" },
    { name: "コベルコバックホー", model: "SK55SR-6E", company_id: "100" },
    { name: "コベルコバックホー", model: "SK50UR", company_id: "102" },
    { name: "コベルコバックホー", model: "SK80UR-6E", company_id: "103" },
    { name: "コベルコバックホー", model: "SK75SR-7", company_id: "105" },
    { name: "コベルコバックホー", model: "SK200H-9", company_id: "64" },
    { name: "コベルコバックホー", model: "SK225SR-3", company_id: "66" },
    { name: "コマツバックホー", model: "PC200i-11", company_id: "67" },
    { name: "コマツバックホー", model: "PC200i-12", company_id: "68" },
    { name: "コベルコバックホー", model: "SK200-8", company_id: "T-2" },
    { name: "コベルコバックホー", model: "SK200-10", company_id: "T-3" },
    { name: "コベルコバックホー", model: "SK260LC-10", company_id: "T-5" },
    { name: "コベルコバックホー", model: "SK125SR", company_id: "T-6" },
    { name: "コベルコバックホー", model: "SK200-8", company_id: "T-7" },
    { name: "コベルコバックホー", model: "SK200-8", company_id: "T-9" },
    { name: "コベルコバックホー", model: "SK135SR-3", company_id: "T-10" },
    { name: "コベルコバックホー", model: "SK330-10", company_id: "T-11" }
];

// 機械マスターデータ (Tractor)
const tractorMachineList = [
    { name: "小松ブルドーザー", model: "D20P-6", company_id: "72" },
    { name: "小松ブルドーザー", model: "D31PX-22", company_id: "74" },
    { name: "三菱ブルドーザー", model: "D3C4HJ994", company_id: "76" },
    { name: "小松ブルドーザー", model: "D65PX-12E", company_id: "81" },
    { name: "小松ブルドーザー", model: "D85P21E", company_id: "82" },
    { name: "小松ブルドーザー", model: "D37PX-23", company_id: "83" },
    { name: "小松ブルドーザー", model: "D65PX-17", company_id: "84" },
    { name: "小松ブルドーザー", model: "D31Q-16", company_id: "90" },
    { name: "クローラーダンプ", model: "MST1500", company_id: "91" },
    { name: "クローラーダンプ", model: "MST2200", company_id: "92" },
    { name: "クローラーダンプ", model: "IC-100", company_id: "93" },
    { name: "小松ブルドーザー", model: "DR450-1", company_id: "000" },
    { name: "小松クローラダンプ 11 t", model: "CD110R-2", company_id: "T-8" }
];

// 現在のアクティブな機械マスターリスト
let activeMasterList = shovelMachineList;

function setupMachineAutoFillListener() {
    const idInput = document.getElementById('machine-id');
    const modelInput = document.getElementById('model-type');
    const companyInput = document.getElementById('company-machine-id');
    const nameInput = document.getElementById('machine-name');

    // 会社管理No -> その他を自動入力
    if (companyInput) {
        companyInput.addEventListener('change', () => {
            const val = companyInput.value;
            // 現在のアクティブリストから検索
            const match = activeMasterList.find(m => m.company_id === val);
            if (match) {
                if (modelInput) modelInput.value = match.model;
                if (nameInput) nameInput.value = match.name;
            }
        });
    }
}

function updateMachineMasterList(machineType) {
    console.log(`DEBUG: updateMachineMasterList called with type: ${machineType}`);

    // タイプに応じてリストを切り替え
    if (machineType === 'tractor') {
        console.log("DEBUG: Switching to TRACTOR list");
        activeMasterList = tractorMachineList;
    } else {
        console.log("DEBUG: Switching to SHOVEL list (default)");
        // shovel, shovel_daily, crane, etc. (デフォルトはショベルリストで良いか、あるいは各機種ごとに空にするか)
        // ここではショベルとトラクタ以外はショベルリスト（または空）にする想定だが、
        // ひとまずショベル以外でトラクタ指定されたもの以外はショベルリストを使う実装にする
        activeMasterList = shovelMachineList;
    }

    // リストの再レンダリング
    const machineMasterList = document.getElementById('machine-master-list');
    const machineNameList = document.getElementById('machine-name-list');

    if (machineMasterList) {
        console.log(`DEBUG: Populating machine-master-list with ${activeMasterList.length} items`);
        machineMasterList.innerHTML = '';
        activeMasterList.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.company_id;
            opt.innerText = `${m.model} (${m.name})`;
            machineMasterList.appendChild(opt);
        });
    } else {
        // console.warn("DEBUG: machine-master-list element NOT found (Skipping)"); // Benign on index.html
    }

    if (machineNameList) {
        machineNameList.innerHTML = '';
        const uniqueNames = [...new Set(activeMasterList.map(m => m.name))];
        uniqueNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            machineNameList.appendChild(opt);
        });
    }
}
// 点検データの定義
const inspectionData = {
    shovel: {
        title: "車両系建設機械(整地・運搬・積込・掘削用) 定期自主検査表",
        columns: [
            [{ category: "エンジン本体", items: ["始動・回転具合、排気色", "エアクリーナの汚れ・詰まり", "ファン・ベルトの損傷・張り", "ラジエータの水漏れ・水量・汚れ", "油・燃料・水漏れ"] }, { category: "動力伝達装置", items: ["メインクラッチの滑り・切れ", "トランスミッションの油漏れ・油量", "プロペラシャフト・ユニバーサルジョイント", "デファレンシャルの油漏れ・異音"] }, { category: "走行装置", items: ["トラックフレーム・シュー・リンクの損傷", "アイドラ・スプロケットの摩耗", "ローラ・ガードの損傷・緩み", "タイヤの空気圧・摩耗・損傷", "ホイール・ナットの緩み"] }],
            [{ category: "作業装置", items: ["ブーム・アーム・バケットの損傷", "リンク・ピン・ガタ", "シリンダの油漏れ・損傷", "配管・ホースの油漏れ・損傷", "ツース・カッティングエッジの摩耗"] }, { category: "油圧装置", items: ["油圧ポンプ・モータの異音・油漏れ", "コントロールバルブの油漏れ・作動", "タンクの油量・油漏れ", "油温上昇・リリーフ圧"] }, { category: "操縦装置", items: ["レバー・ペダルの作動・遊び", "ロック装置の機能", "シート・ベルトの損傷"] }],
            [{ category: "電気系統", items: ["バッテリーの液量・比重・端子", "ライト・ウインカー・ワイパーের作動", "警音器・バックブザーの作動", "計器類・モニタの作動"] }, { category: "車体・安全装置", items: ["フレーム・ボディの亀裂・変形", "安全弁・逆止弁の機能", "バックミラー・後方確認装置", "消火器の有無・点検期限"] }, { category: "その他", items: ["給脂状況", "取扱説明書の有無"] }]
        ]
    },
    tractor: {
        title: "車両系建設機械(整地・運搬・積込・掘削用)(トラクタ系) 定期自主検査表",
        columns: [
            [{ category: "本体", items: ["本体、フレームのき裂、損傷", "本体各部のボルト・ナットのゆるみ", "ヘッドガード及びキャノピ、損傷"] }, { category: "エンジン", items: ["ラジエータ、ポンプの水もれ、損傷", "ファン、ベルトの損傷、張り", "シリンダヘッド、ブロックの油もれ", "オイルパン、配管の油もれ", "燃料タンク、フィルタのもれ、損傷"] }, { category: "動力伝達", items: ["メインクラッチ、コンバータの作動", "トランスミッションの作動、油もれ", "ベベルギヤ、ドライブの油量、異音", "シャフト、リンク、ピンの損傷", "減速機の作動、損傷"] }],
            [{ category: "走行装置", items: ["トラックフレームの歪、損傷", "トラックローラの摩耗、ゆるみ", "起動輪、遊動輪の摩耗、損傷", "履帯(シュー、リンク)の摩耗", "シューボルトのゆるみ、損傷", "タイヤの摩耗、損傷、エア圧力"] }, { category: "作業装置", items: ["フレーム、アームの損傷、シリンダ作動", "ブレード、バケットの摩耗、変形", "エンドビットの摩耗、変形", "ボウル、エプロン器具の損傷", "リッパ装置の作動、損傷"] }, { category: "油圧関係", items: ["油圧ポンプ、シリンダの油もれ、作動", "油圧モータの油もれ、作動", "バルブ、配管、ホースの油もれ", "タンクの損傷、油量"] }],
            [{ category: "電気関係", items: ["スイッチ、リレーの作動、損傷", "バッテリの比重、損傷、液量", "配線の損傷、取付け状態"] }, { category: "その他", items: ["エアモータの作動、損傷", "エアバルブ、足踏みバルブの作動", "ホイスト用ブレーキの作動", "バケットケーブル、チェーン等の損傷"] }, { category: "保安・その他", items: ["前照灯、制動灯、方向指示灯", "各ロック装置の作動", "警報装置の作動", "排気処理装置の機能", "ドローバ取付け部の状態"] }]
        ]
    },
    crane: {
        title: "移動式クレーン(クローラ、トラック、油圧) 定期自主検査表",
        columns: [
            [{ category: "本体", items: ["運転席、ハウス等の変形、損傷", "カウンタウェイトの取付状態", "ボルト、ナットのゆるみ"] }, { category: "エンジン", items: ["ラジエータ、水漏れ", "ファンベルトの損傷", "燃料系統の漏れ", "排気色、異音"] }, { category: "動力伝達", items: ["クラッチ、コンバータの作動", "トランスミッションの作動", "減速機の作動、油漏れ", "旋回軸、ギヤの摩耗"] }],
            [{ category: "走行体", items: ["クローラ、タイヤの損傷、空気圧", "ブレーキの効き、摩耗", "ハンドル、リンクのガタ", "サスペンションの作動"] }, { category: "作業装置", items: ["ブーム、ジブの変形、損傷", "フック、ブロックの損傷", "ワイヤロープの摩耗、損傷", "シーブ、ガイドの回転、摩耗"] }, { category: "油圧装置", items: ["ポンプ、モータの油漏れ、作動", "バルブ類の機能、油漏れ", "タンク油量、汚れ", "配管、ホースの損傷"] }],
            [{ category: "電気・計器", items: ["計器類の作動", "ライト、ワイパーの作動", "バッテリー状態", "配線のショート、被覆"] }, { category: "安全装置", items: ["過負荷防止装置の作動", "巻過防止装置の作動", "警報装置の作動", "フックはずれ止め装置"] }, { category: "その他", items: ["アウトリガの作動、損傷", "旋回ロックの機能", "車載工具、標識"] }]
        ]
    },
    // --- 日常始業点検簿 ---
    sandbag: {
        title: "大型土のう 始業点検表",
        columns: [
            [{ category: "点検事項", items: ["土のう袋の破損はないか", "土のうが転倒してないか", "土のうに傾きはないか", "シートのめくれはないか"] }]
        ]
    },
    power_tool: {
        title: "電動工具 始業点検表",
        columns: [
            [{ category: "点検事項", items: ["配線の損傷はないか。", "コネクターの破損はないか。", "アースは確実にとってあるか。", "操作スイッチ、手元スイッチの作動はよいか。", "十分な太さのキャブタイヤケーブルを使用しているか。"] }],
            [{ category: "点検事項(続き)", items: ["各部のボルト・ナットの弛みはないか。", "回転部のカバーはよいか。", "鋸歯、鉋歯の安全カバーは確実に作動するか。", "鋸歯、鉋歯（回転体）は確実に取付けてあるか。", "取扱責任者の表示はよいか。"] }]
        ]
    },
    generator: {
        title: "発電機 始業点検表",
        columns: [
            [{ category: "点検事項", items: ["発電機の過熱、異音、振動、異臭はないか。", "制御盤の損傷はないか、作動はよいか。", "アースは確実に取付けてあるか。", "ラジエーターの水量はよいか。"] }],
            [{ category: "点検事項(続き)", items: ["ラジエーターの漏れはないか。", "燃料の量はよいか、又、漏れはないか。", "オイル量はよいか。", "オイルの漏れはないか。"] }],
            [{ category: "点検事項(続き)", items: ["ファンブーリー、ベルトの摩耗、損傷はないか。", "ベルトの張はよいか。", "計器、スイッチの指度、作用はよいか。", "持込み受理証、取扱責任者の表示はしてあるか。"] }]
        ]
    },
    dist_board: {
        title: "分電盤 始業点検表",
        columns: [
            [{ category: "点検事項", items: ["スイッチのカバーを外して使用していないか。", "端子接続部の心線は裸になっていないか。", "盤内にドライバー、スパナ等の不要なものをおいていないか。", "組込んである感電防止用漏電遮断器の作動は確実か。", "アース線は正規のものを使用し接続不良はないか。", "たこ足配線をしていないか。"] }]
        ]
    },
    pump: {
        title: "水中ポンプ 始業点検表",
        columns: [
            [{ category: "点検事項", items: ["キャブタイヤケーブルのつなぎが水についてないか。", "キャブタイヤケーブルは破損、劣化していないか。", "接続部に泥、ゴミの詰まりはないか。", "吊り込み、吊り上げ時にキャブタイヤケーブルをつかんでやっていないか。"] }],
            [{ category: "点検事項(続き)", items: ["分電盤には漏電遮断器が組み込まれ作動しているか。", "ポンプ本体に損傷、異常音、発熱はないか。", "ホースに損傷はないか、接続部はよいか。"] }]
        ]
    },
    arc_welder: {
        title: "アーク溶接機 始業点検表",
        columns: [
            [{ category: "点検事項", items: ["ホルダーの絶縁防護及びホルダー用ケーブル接続部の損傷の有無", "溶接機外箱の接地", "溶接機と一次配線及び二次配線の接続状態及び接続部の絶縁", "電線は溶接用キャブタイヤケーブルを使用しているか"] }],
            [{ category: "点検事項(続き)", items: ["溶接資格者の表示はあるか", "点検用スイッチによる電防装置の作動状態", "異音、異臭の発生の有無", "電防装置が溶接機の外箱への取付の状態"] }],
            [{ category: "点検事項(続き)", items: ["外箱内に組み込まれ電防装置と溶接機との配線の状態", "ふたの破損及び開閉状態及びパッキン劣化の状態"] }]
        ]
    },
    elec_equip: {
        title: "電気設備・機器 始業点検表",
        columns: [
            [{ category: "配電路・受変電", items: ["電柱、腕金の傾きはないか", "電線と重機、建物の離隔はよいか", "周辺は整理されているか", "電気主任技術者の表示はあるか", "キュービクルの施錠はよいか", "防護柵、扉の標語はあるか"] }, { category: "分電盤", items: ["漏電ブレーカの設備及び動作はよいか", "とびらの開放、破損はないか及び施錠装置はよいか", "スイッチの過熱、変形、破損はないか", "スイッチのカバーはついているか"] }],
            [{ category: "分電盤(続き)", items: ["スイッチに適正なヒューズがついているか", "スイッチの用途の明示はあるか", "タコ足配線はないか", "電気取扱者の表示はあるか"] }, { category: "移動機器・照明", items: ["外装又は外装の破損はないか", "路面上を横断していないか", "ソケット、ガードの破損はないか", "可燃物と接近していないか", "機械器具の操作に必要な照度はあるか"] }],
            [{ category: "アーク溶接・電設", items: ["自動電撃防止装置の設備及び動作", "ホルダーの絶縁防護部分の損傷はないか", "電線は溶接用キャブタイヤケーブルを使用しているか", "分電盤、電気機械器具にアースはあるか", "アース線の切断、アース極の浮上りはないか"] }, { category: "その他", items: ["配線にビニール電線を使用していないか", "その他電気機械器具に異常はないか", "既設接地器具の損傷の有無", "活線作業用器具、絶縁用防護具等のひびわれ、損傷の有無"] }]
        ]
    },
    shovel_daily: {
        title: "ショベル系掘削機械 始業点検表",
        columns: [
            [{ category: "エンジン・作動", items: ["エンジンのかかり具合、音、排気色はよいか", "エンジンの作動油（量、汚れ、漏れ）はよいか", "灯火装置、方向指示器、警報装置はよいか"] }],
            [{ category: "駆動・制御", items: ["ブレーキ（主巻、補巻、旋回、走行）の作動はよいか", "クラッチ（主巻、補巻、ブーム巻、旋回、走行）の作動はよいか", "ロック装置は確実に作動するか"] }],
            [{ category: "装置・安全", items: ["ブーム、バケット、吊り具、シリンダ等機構の状態はよいか", "安全装置およびリミットスイッチ等の作動はよいか", "フックの外れ止め、過巻防止装置はよいか"] }]
        ]
    },
    hanging_tools: {
        title: "玉掛け用具 始業点検表",
        columns: [
            [{ category: "ワイヤロープ", items: ["玉掛けワイヤに素線切れがないか", "玉掛けワイヤがすり減っていないか", "キンク、型くずれ、腐食がないか", "端末止めに異常はないか"] }],
            [{ category: "チェーン・フック", items: ["吊りチェーンに亀裂、変形はないか", "吊りチェーンに伸び、断面の減少がないか", "フック、シャックル等の変形、磨耗、亀裂はないか", "ピン穴の平行、ピンの曲がりはないか"] }],
            [{ category: "繊維・その他", items: ["繊維維裏面のすり傷、破断はないか", "ストランドの破断・切断はないか", "著しい損傷、型くずれ、腐食はないか", "縫い合わせた部分に糸切れはないか"] }]
        ]
    },
    iron_plate: {
        title: "敷鉄板 点検表",
        columns: [
            [{ category: "点検事項", items: ["敷鉄板がズレていないか", "敷鉄板に浮きはないか", "連結金具が外れていないか", "搬入枚数と敷設枚数はあっているか", "作業終了時、盗難防止措置をしているか"] }]
        ]
    },
    security_daily: {
        title: "保安点検表",
        columns: [
            [{ category: "点検事項", items: ["現場出入口のバリケードは確実に閉じられてるか", "現場の安全施設(立入禁止ロープ)に異常はないか", "通行止め区間のバリケードは確実に閉じられているか", "通行止め区間のバリケードは夜間開放されているか", "通行止め区間に異常はないか（降雨時等）"] }],
            [{ category: "点検事項(続き)", items: ["作業通路は確保されているか", "機械の施錠はよいか", "仮設道路の補修は必要ないか", "仮締切(大型土のう)に異常はないか(傾き、崩れ)", "現場内に引火物(燃料等)を置いてないか"] }],
            [{ category: "点検事項(続き)", items: ["機械とのセット作業時はカラーコーン等で作業立入場所を区切っているか", "現場内は整理整頓できているか", "警戒標識のノボリが倒れ、飛ばされがないか", "架空線のある場所に切断防止の門構えは設置されているか", "工事車両が第三者の出入りに支障になる場所に駐車されていないか", "工事車両駐車時に歯止めはしてあるか", "資材に掛けてある養生シートにめくれ、飛ばされはないか"] }]
        ]
    },
    excavation_daily: {
        title: "地山掘削・土止め支保工始業点検表",
        columns: [
            [{ category: "共通事項・地山", items: ["作業主任者、立ち入り禁止等の表示は良いか", "深さ1.5m以上のとき、昇降設備はあるか", "埋設物防護はよいか", "周辺地盤に沈下、き裂等はないか", "地山の勾配は適正か、及び湧水等の措置はよいか", "崩壊のおそれはないか", "すかし掘りをしていないか", "周辺の塀、擁壁等への影響はないか", "掘削箇所の立入禁止措置はよいか", "開口部の防護柵（高さ90cm）はよいか"] }],
            [{ category: "地山・掘削・土止め", items: ["掘削土を法肩に積んでいないか", "重機等の位置、通路が法肩に近すぎないか", "運搬車両等の進入、退出に誘導員をつけているか", "機械の運行経路、出入の方法、信号合図の方法を作業者に周知させているか", "計画通りに組立てられているか", "部材の損傷、変形、腐食はないか", "部材の変位はないか"] }],
            [{ category: "土止め支保工", items: ["切梁、腹おこしは脱落防止のために矢板、くい等に確実に取り付けてあるか", "切梁の緊圧の度合いはよいか", "部材の接続部、取付部、交叉部に異常はないか", "中間支持柱があるときは、切梁を中間支持柱に確実に取り付けてあるか", "材料を切梁上に乗せるときは、切梁を補強して緊結しているか"] }]
        ]
    },
    crane_daily: {
        title: "移動式クレーン始業時自主点検表",
        columns: [
            [{ category: "エンジン・計器・駆動", items: ["エンジンのかかり具合、排気は良いか、異常音、異臭はないか", "計器(油圧・水温・油温・電流)は正常か", "ブレーキ、クラッチの効きはよいか（油圧式・巻上、旋回）（機械式・巻上、起伏、旋回、走行）", "ブームの起伏、伸縮装置の作動はよいか（油圧式）"] }],
            [{ category: "装置・油脂・走行", items: ["ブームとブームのジョイント部等主要箇所のボルト締めつけ部に異常はないか", "注油箇所の注油（グリース等）はよいか", "アウトリガーの張り出し、効きはよいか", "タイヤ（傷、エアー抜け）はよいか（ホイールクレーン）", "点火装置、方向指示器はよいか（ホイールクレーン）"] }],
            [{ category: "ワイヤ・フック・安全装置", items: ["ワイヤーロープ（主管・起伏）に損傷、乱巻き等はないか、またシーブからの外れはないか", "フックのワイヤ外れ止め、過巻防止装置はよいか", "角度計、荷重指示計、過負荷防止装置、起伏制限装置の作動はよいか、また警報装置はよいか"] }]
        ]
    },
    tractor_daily: {
        title: "車両系(トラクタ系) 始業点検表",
        columns: [
            [{ category: "エンジン・作動", items: ["エンジンのかかり具合、音、排気色はよいか", "エンジンの作動油（量、汚れ、漏れ）はよいか", "灯火装置、方向指示器、警報装置はよいか"] }],
            [{ category: "駆動・制御", items: ["ブレーキ（主巻、補巻、旋回、走行）の作動はよいか", "クラッチ（主巻、補巻、ブーム巻、旋回、走行）の作動はよいか", "ロック装置は確実に作動するか"] }],
            [{ category: "装置・安全", items: ["ブーム、ブレード、シリンダ等機構の状態はよいか", "安全装置およびリミットスイッチ等の作動はよいか", "ボルト・ナットの緩みはないか"] }]
        ]
    }
};

function updateDateDisplay() {
    const el = document.getElementById('global-date-display');
    if (!el) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');

    // 曜日 (英語)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[now.getDay()];

    // Format: 2026.01.26 (Mon)
    el.innerText = `${y}.${m}.${d} (${day})`;
}

// --- 印刷用タイトル動的更新 ---
function updateDocumentTitle() {
    // 1. 日付の取得 (inspection-month 優先、なければ inspection-date)
    const monthVal = document.getElementById('inspection-month')?.value;
    const dateVal = document.getElementById('inspection-date')?.value;

    let dateStr = "";
    if (monthVal) {
        dateStr = monthVal; // YYYY-MM
    } else if (dateVal) {
        // YYYY-MM-DD -> 必要に応じて短縮するかそのままか。
        // リクエスト例は "2026-02" なので、月次なら年月、日時なら年月日が良いかも
        dateStr = dateVal;
    } else {
        // 未入力時は現在年月
        const now = new Date();
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        dateStr = `${y}-${m}`;
    }

    // 2. 型式の取得
    const modelByKey = document.getElementById('model-type')?.value || "";
    // 入力がなければ "型式未定" などにするか、空文字にするか。今回は空文字で詰める。

    // 3. 現場管理Noの取得
    const machineId = document.getElementById('machine-id')?.value || "";

    // 結合: [日付]_[型式]_[現場管理No]
    // 空の要素は除外して結合
    const parts = [dateStr, modelByKey, machineId].filter(p => p && p.trim() !== "");

    if (parts.length > 0) {
        document.title = parts.join('_');
    } else {
        // デフォルト
        document.title = "点検表";
    }

    updatePrintMonth();
}

function updatePrintMonth() {
    const monthVal = document.getElementById('inspection-month')?.value;
    const dateVal = document.getElementById('inspection-date')?.value;
    const displayEl = document.getElementById('print-month-display');
    if (!displayEl) return;

    let month = "";
    if (monthVal) {
        // YYYY-MM
        const parts = monthVal.split('-');
        if (parts.length === 2) month = parts[1];
    } else if (dateVal) {
        // YYYY-MM-DD
        const parts = dateVal.split('-');
        if (parts.length === 3) month = parts[1];
    }

    if (month) {
        const m = parseInt(month, 10);
        displayEl.innerText = `${m}月`;
    } else {
        displayEl.innerText = "";
    }
}

// --- ラベル印刷用 (A5) ---
function printLabel() {
    document.body.classList.add('print-mode-label');
    window.print();
}

window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-mode-label');
});

// --- 共通初期化 ---

// --- インデックス画面 (現場管理) ---
function initIndex() {
    renderSiteList();
    if (window.renderRepresentativeList) window.renderRepresentativeList();
    if (window.renderStaffList) window.renderStaffList();

    const siteModal = document.getElementById('site-modal');
    const newSiteBtn = document.getElementById('new-site-btn');
    const closeSiteModal = document.getElementById('close-site-modal');
    const saveSiteBtn = document.getElementById('save-site-btn');
    const backToSites = document.getElementById('back-to-sites');

    newSiteBtn?.addEventListener('click', () => {
        document.getElementById('edit-site-id').value = '';
        document.getElementById('site-modal-title').innerText = '新規現場登録';
        document.getElementById('new-site-name').value = '';
        document.getElementById('new-site-start').value = '';
        document.getElementById('new-site-end').value = '';
        document.getElementById('new-site-status').value = '施工中';
        document.getElementById('new-site-representative').value = '';
        document.getElementById('new-site-inspector').value = '';
        document.getElementById('new-site-safety-manager').value = '';
        siteModal.style.display = 'flex';
    });


    closeSiteModal?.addEventListener('click', () => siteModal.style.display = 'none');
    backToSites?.addEventListener('click', () => {
        showView('site-list-view');
        // 戻る時はURLからsite_idを消す
        const url = new URL(window.location);
        url.searchParams.delete('site_id');
        window.history.pushState({}, '', url);
        currentSiteId = null;
    });

    saveSiteBtn?.addEventListener('click', async () => {
        const id = document.getElementById('edit-site-id').value;
        const name = document.getElementById('new-site-name').value;
        const start = document.getElementById('new-site-start').value;
        const end = document.getElementById('new-site-end').value;
        const status = document.getElementById('new-site-status').value;

        if (!name) { alert("現場名は必須です"); return; }

        const payload = {
            name,
            start_date: start || null,
            end_date: end || null,
            status: status,
            representative: document.getElementById('new-site-representative').value,
            site_inspector: document.getElementById('new-site-inspector').value,
            safety_manager: document.getElementById('new-site-safety-manager').value,
            last_updated: new Date().toISOString()
        };

        let result;
        if (id) {
            result = await supabaseClient.from('sites').update(payload).eq('id', id);
        } else {
            result = await supabaseClient.from('sites').insert([payload]);
        }

        if (result.error) { alert("保存失敗: " + result.error.message); }
        else {
            siteModal.style.display = 'none';
            renderSiteList();
        }
    });

    // --- Filters Removed ---
    /*
    document.getElementById('site-search')?.addEventListener('input', renderSiteList);
    document.getElementById('status-filter')?.addEventListener('change', renderSiteList);
    document.getElementById('date-from')?.addEventListener('change', renderSiteList);
    document.getElementById('date-to')?.addEventListener('change', renderSiteList);
    */

    document.getElementById('cancel-delete')?.addEventListener('click', () => {
        document.getElementById('delete-modal').style.display = 'none';
    });

    document.getElementById('confirm-delete')?.addEventListener('click', async () => {
        if (!supabaseClient) return;

        if (deleteType === 'machine') {
            if (!deleteTargetSiteId || !deleteTargetMachineId) return;
            // machine_id と site_id が一致するものを全て論理削除
            const { error } = await supabaseClient
                .from('inspections')
                .update({ is_deleted: true })
                .eq('site_id', deleteTargetSiteId)
                .eq('machine_id', deleteTargetMachineId);

            if (error) {
                alert("削除に失敗しました: " + error.message);
            } else {
                document.getElementById('delete-modal').style.display = 'none';
                renderMachineList(currentSiteId);
            }
            return;
        }

        if (!deleteTargetId) return;
        const table = deleteType === 'site' ? 'sites' : 'inspections';
        const { error } = await supabaseClient.from(table).update({ is_deleted: true }).eq('id', deleteTargetId);

        if (error) {
            alert("削除に失敗しました: " + error.message);
        } else {
            document.getElementById('delete-modal').style.display = 'none';
            if (deleteType === 'site') renderSiteList();
            else renderMachineList(currentSiteId);
        }
    });

    window.confirmDeleteSite = (id) => {
        deleteTargetId = id;
        deleteType = 'site';
        document.getElementById('delete-modal').style.display = 'flex';
    };

    window.confirmDeleteInspection = (id) => {
        deleteTargetId = id;
        deleteType = 'inspection';
        document.getElementById('delete-modal').style.display = 'flex';
    };

    window.confirmDeleteMachine = (siteId, machineId) => {
        deleteTargetSiteId = siteId;
        deleteTargetMachineId = machineId;
        deleteType = 'machine';
        document.getElementById('delete-modal').style.display = 'flex';
    };

    window.openEditSite = async (id) => {
        const { data, error } = await supabaseClient.from('sites').select('*').eq('id', id).single();
        if (error || !data) return;
        document.getElementById('edit-site-id').value = data.id;
        document.getElementById('site-modal-title').innerText = '現場情報の編集';
        document.getElementById('new-site-name').value = data.name;
        document.getElementById('new-site-start').value = data.start_date || '';
        document.getElementById('new-site-end').value = data.end_date || '';
        document.getElementById('new-site-status').value = data.status;
        document.getElementById('new-site-representative').value = data.representative || '';
        document.getElementById('new-site-inspector').value = data.site_inspector || '';
        document.getElementById('new-site-safety-manager').value = data.safety_manager || '';
        siteModal.style.display = 'flex';
    };

    // 履歴モーダル関連
    document.getElementById('close-history-modal')?.addEventListener('click', () => {
        document.getElementById('history-modal').style.display = 'none';
    });

    // QRモーダル関連
    document.getElementById('close-qr-modal')?.addEventListener('click', () => {
        document.getElementById('qr-modal').style.display = 'none';
    });
}

function showView(viewId) {
    document.getElementById('site-list-view').style.display = viewId === 'site-list-view' ? 'block' : 'none';
    document.getElementById('site-detail-view').style.display = viewId === 'site-detail-view' ? 'block' : 'none';
}

async function renderSiteList() {
    const listBody = document.getElementById('site-list-body');
    if (!listBody || !supabaseClient) return;

    // List sites (fetch valid sites: is_deleted is null OR is_deleted is false)
    let query = supabaseClient.from('sites').select('*').or('is_deleted.is.null,is_deleted.eq.false');

    const { data: sites, error } = await query.order('last_updated', { ascending: false });


    if (error) {
        console.error("Data fetch error:", error);
        // Optionally show a subtle toast or keep silent if not critical
    }

    listBody.innerHTML = '';

    if (sites?.length === 0) {
        document.getElementById('no-site-message').style.display = 'block';
        return;
    }
    document.getElementById('no-site-message').style.display = 'none';

    sites.forEach(site => {
        const row = document.createElement('tr');
        const badgeClass = site.status === '施工中' ? 'badge-active' : 'badge-done';
        const dateStr = site.start_date ? `${site.start_date.replace(/-/g, '/')} 〜 ${site.end_date ? site.end_date.replace(/-/g, '/') : '未定'}` : '-';

        let updatedAt = '-';
        try {
            updatedAt = site.last_updated ? new Date(site.last_updated).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : '-';
        } catch (e) {
            console.warn('Date parse error', e);
        }

        row.innerHTML = `
            <td><div class="site-name">${site.name}</div></td>
            <td><div class="site-period">${dateStr}</div></td>
            <td><span class="badge ${badgeClass}">${site.status}</span></td>
            <td><div class="last-updated">${updatedAt}</div></td>
            <td style="text-align:right;">
                <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                    <button class="secondary-btn" style="padding:0.4rem 0.8rem;" onclick="openEditSite('${site.id}')">編集</button>
                    <button class="ghost-btn" style="color:var(--danger-color); padding:0.4rem;" onclick="confirmDeleteSite('${site.id}')">削除</button>
                    <button class="primary-btn" onclick="openSiteDetail('${site.id}', '${site.name}')">開く</button>
                </div>
            </td>
        `;
        listBody.appendChild(row);
    });
}

async function openSiteDetail(siteId, siteName) {
    currentSiteId = siteId;
    document.getElementById('current-site-title').innerText = siteName;
    showView('site-detail-view');
    renderMachineList(siteId);

    document.getElementById('register-machine-btn').onclick = () => {
        window.location.href = `inspection.html?site_id=${siteId}`;
    };

    // URLにsite_idを付与（リロード時などの復元用）
    const url = new URL(window.location);
    url.searchParams.set('site_id', siteId);
    window.history.pushState({}, '', url);
}

async function renderMachineList(siteId) {
    const listBodyVehicle = document.getElementById('machine-list-body-vehicle');
    const listBodyOther = document.getElementById('machine-list-body-other');

    // 要素がない場合は終了（詳細画面以外など）
    if (!listBodyVehicle || !listBodyOther) return;

    const { data: list, error } = await supabaseClient
        .from('inspections')
        .select('*')
        .eq('site_id', siteId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('inspection_date', { ascending: false });

    listBodyVehicle.innerHTML = '';
    listBodyOther.innerHTML = '';

    document.getElementById('no-data-message-vehicle').style.display = 'none';
    document.getElementById('no-data-message-other').style.display = 'none';

    if (!list || list.length === 0) {
        document.getElementById('no-data-message-vehicle').style.display = 'block';
        document.getElementById('no-data-message-other').style.display = 'block';
        return;
    }

    const machineMap = {};
    list.forEach(item => {
        if (!machineMap[item.machine_id]) {
            machineMap[item.machine_id] = { monthly: null, daily: null, base: null };
        }

        // 日常点検タイプ（shovel_dailyなど）か判定
        // dailyMonthlyTypesには 'shovel_daily' 等が含まれている前提だが、念のため明示的にもチェック
        const isDailyType = dailyMonthlyTypes.includes(item.machine_type) || item.machine_type === 'shovel_daily' || item.machine_type === 'crane_daily';

        if (isDailyType) {
            // 降順ソートされているため、最初に来たもの（最新）を採用し、以降は無視（上書きしない）
            if (!machineMap[item.machine_id].daily) {
                machineMap[item.machine_id].daily = item;
            }
        } else {
            // 月次点検
            if (!machineMap[item.machine_id].monthly) {
                machineMap[item.machine_id].monthly = item;
            }
        }

        // ベース情報の保持（まだセットされていなければセット）
        if (!machineMap[item.machine_id].base) {
            machineMap[item.machine_id].base = item;
        } else {
            // base更新なし
        }
    });

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const todayDayStr = now.getDate().toString().padStart(2, '0');

    // 管理No.順にソートして描画
    Object.values(machineMap)
        .sort((a, b) => {
            const noA = parseInt(a.base.machine_id) || 9999;
            const noB = parseInt(b.base.machine_id) || 9999;
            return noA - noB;
        })
        .forEach(m => {
            if (!m.base) return;

            // 月次の点検者情報を取得 (monthly優先、なければbase)
            // statuses._inspector_main / _inspector_sub に入っている前提
            const sourceRecord = m.monthly || m.base;
            const inspectorMain = (sourceRecord.statuses && sourceRecord.statuses._inspector_main) || "";
            const inspectorSub = (sourceRecord.statuses && sourceRecord.statuses._inspector_sub) || "";

            // --- 車両系 (Shovel/Vehicle) の行生成 ---
            // isVehicle判定: machineListにあるかどうかで簡易判定、またはmachine_typeで判定
            // ショベル系は machine_type が shovel, tractor, crane など
            const isVehicle = ['shovel', 'tractor', 'crane'].includes(m.base.machine_type);

            const row = document.createElement('tr');

            // --- ステータス表示ロジック ---
            let statusHtml = '';

            if (isVehicle) {
                // 月次ステータス (m.monthly)
                let monthlyStatus = '-';
                let monthlyClass = '';
                if (m.monthly) {
                    // 月次点検の該当月判定は？とりあえず最新があれば「済」とするか、月を見て判定するか
                    // ここではシンプルに最新の月を表示
                    const d = new Date(m.monthly.inspection_date);
                    monthlyStatus = `${d.getMonth() + 1}月: 済`;
                    monthlyClass = 'badge-active';
                } else {
                    monthlyStatus = '未実施';
                    monthlyClass = 'badge-done';
                }

                // 日常ステータス (m.daily) -> 今日の分があるか？
                let dailyStatus = '-';
                if (m.daily) {
                    // m.daily はその月のレコード。今日のチェックがあるか探す
                    const key = `day-${todayDayStr}-`;
                    // statusesのキーに day-{today}-... があり、かつ none でないものがあるか
                    if (m.daily.statuses) {
                        const hasCheck = Object.entries(m.daily.statuses).some(([k, v]) => k.startsWith(key) && v !== 'none');
                        if (hasCheck) dailyStatus = '本日: 済';
                        else dailyStatus = '本日: 未';
                    } else {
                        dailyStatus = '本日: 未';
                    }
                } else {
                    // 日常点検レコード自体がない
                    dailyStatus = '本日: 未';
                }

                statusHtml = `
                    <div style="display:flex; flex-direction:column; gap:0.2rem; font-size:0.8rem;">
                        <span class="badge ${monthlyClass}">${monthlyStatus}</span>
                        <span class="badge" style="background:#f1f5f9; color:#64748b;">${dailyStatus}</span>
                    </div>
                `;
            } else {
                // その他の機器 (月次のみ、または日常のみ)
                // dailyMonthlyTypes に含まれるものは 日常点検のみ
                // ここでは省略気味に 実装
                statusHtml = '<span class="badge badge-done">-</span>';
            }


            // Common Params (Machine Info) from source record (Monthly or Base)
            const cmidVal = (sourceRecord.statuses && sourceRecord.statuses._company_machine_id) || '';
            const modelVal = sourceRecord.model_type || m.base.model_type || '';
            const commonParams = `&mo=${encodeURIComponent(modelVal)}&cmid=${encodeURIComponent(cmidVal)}`;

            // --- アクションボタン ---
            // 月次点検ボタン
            let monthlyBtns = '';
            if (isVehicle) {
                // 月次点検へ (編集 or 新規)
                const mid = m.monthly ? m.monthly.id : '';
                // 既存でもパラメータを付与して補完できるようにする
                const action = mid
                    ? `id=${mid}&mode=check${commonParams}`
                    : `action=new&mt=${m.base.machine_type}&id=${m.base.machine_id}${commonParams}`;

                const label = mid ? '月次点検' : '月次作成';
                const style = mid ? 'background:#dcfce7; color:#166534; border-color:#86efac;' : '';
                monthlyBtns = `<button class="secondary-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; ${style}" onclick="location.href='inspection.html?${action}&site_id=${siteId}'">${label}</button>`;
            }

            // 日常点検ボタン
            let dailyBtns = '';
            // 車両系、または日常点検専用タイプ
            if (isVehicle) {
                // ショベル等の日常点検 (タイプ + _daily)
                const dailyType = m.base.machine_type + '_daily';
                const did = m.daily ? m.daily.id : '';

                // 新規作成時: main/sub をURLパラメータに含める
                // 既存時: commonParams を含める
                let baseAction = did
                    ? `id=${did}&mode=check${commonParams}`
                    : `action=new&mt=${dailyType}&id=${m.base.machine_id}${commonParams}`;

                const action = `${baseAction}&main=${encodeURIComponent(inspectorMain)}&sub=${encodeURIComponent(inspectorSub)}`;

                const label = did ? '日常点検' : '日常作成';
                const style = did ? 'background:#e0f2fe; color:#075985; border-color:#7dd3fc;' : '';

                dailyBtns = `<button class="secondary-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; ${style}" onclick="location.href='inspection.html?${action}&site_id=${siteId}'">${label}</button>`;
            } else {
                // その他の機器はそれ自体が日常点検
                const did = m.base ? m.base.id : ''; // baseそのものが点検記録
                // ... (略: 既存ロジック通りだが、今回は車両系メインの修正)
                // 簡易実装: 詳細ボタンのみ
            }

            const targetIdForEdit = m.base.id;

            row.innerHTML = `
                <td style="text-align:center;">${getMachineIcon(m.base.machine_type)}</td>
                <td style="font-weight:bold;">
                    ${m.base.machine_id}
                </td>
                <td>${m.base.model_type || '-'}</td>
                <td>${(m.base.statuses && m.base.statuses._company_machine_id) || '-'}</td>
                <td>
                    ${statusHtml}
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:0.3rem; align-items:flex-end;">
                        <div style="display:flex; gap:0.3rem;">
                            <!-- Ver30: Restore Inspection Entry Buttons, Keep Book Button -->
                            <div style="display:flex; gap:0.3rem;">
                                ${monthlyBtns}
                                ${dailyBtns}
                            </div>
                            <!-- Ver29: Inspection Book (Prominent) -->
                            <button class="primary-btn" style="padding:0.4rem 0.8rem; font-size:0.9rem; background-color:#4f46e5; border-color:#4338ca;" onclick="window.open('inspection.html?mode=book&site_id=${siteId}&machine_id=${m.base.machine_id}&mt=${m.base.machine_type}', '_blank')">📖 点検簿</button>
                        </div>
                        <div style="display:flex; gap:0.3rem;">
                             <button class="secondary-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; background: #fffbeb; border-color: #fbbf24; color: #d97706;" onclick='showQrCode("${siteId}", "${m.base.machine_type}", "${m.base.machine_id}", "${m.base.model_type}", "${(m.base.statuses && m.base.statuses._company_machine_id) || ''}", "${inspectorMain}", "${inspectorSub}")'>QR</button>
                            <button class="secondary-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="location.href='inspection.html?id=${targetIdForEdit}&site_id=${siteId}'">詳細</button>
                            <button class="secondary-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="openMachineHistory('${siteId}', '${m.base.machine_id}')">履歴</button>
                            <button class="ghost-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; color:var(--danger-color);" onclick="confirmDeleteMachine('${siteId}', '${m.base.machine_id}')">削除</button>
                        </div>
                    </div>
                </td>
            `;
            // --- 行の追加先決定 ---

            if (isVehicle) {
                listBodyVehicle.appendChild(row);
            } else {
                listBodyOther.appendChild(row);
            }
        });

    // データ有無判定
    if (listBodyVehicle.children.length === 0) {
        document.getElementById('no-data-message-vehicle').style.display = 'block';
    }
    if (listBodyOther.children.length === 0) {
        document.getElementById('no-data-message-other').style.display = 'block';
    }
}

function showQrCode(siteId, machineType, machineId, modelType, companyMachineId, inspectorMain, inspectorSub) {
    const modal = document.getElementById('qr-modal');
    // const container = document.getElementById('qrcode-container'); // Changed: dynamic generation

    if (!modal) return;

    // A5 Label Layout Generation
    // We will inject the HTML dynamically into modal-content

    // Machine Name lookup
    let machineName = "（不明）";
    // Combine lists to search
    const allMachines = [...(typeof shovelMachineList !== 'undefined' ? shovelMachineList : []), ...(typeof tractorMachineList !== 'undefined' ? tractorMachineList : [])];
    const match = allMachines.find(m => m.company_id === companyMachineId);
    if (match) machineName = match.name;
    else if (!companyMachineId) machineName = ""; // If no ID, leave empty or logic?

    // Site Name
    const siteName = document.getElementById('current-site-title')?.innerText || "";

    const contentHtml = `
        <div class="print-label-container">
            <div class="label-header">
                株式会社山内組 管理機械
            </div>
            <div class="label-body">
                <div class="label-info-col">
                    <div class="label-row">
                        <span class="label-key">現場名</span>
                        <span class="label-val">${siteName}</span>
                    </div>
                    <div class="label-row">
                        <span class="label-key">機械名</span>
                        <span class="label-val">${machineName}</span>
                    </div>
                    <div class="label-row half">
                        <div class="split-item">
                            <span class="label-key">型式</span>
                            <span class="label-val text-lg">${modelType}</span>
                        </div>
                        <div class="split-item">
                            <span class="label-key">社内No.</span>
                            <span class="label-val text-lg">${companyMachineId || '-'}</span>
                        </div>
                    </div>
                    <div class="label-row">
                        <span class="label-key">現場管理No.</span>
                        <span class="label-val text-xl em-text">${machineId}</span>
                    </div>
                    <div class="label-row half">
                        <div class="split-item">
                            <span class="label-key">点検者(正)</span>
                            <input type="text" class="print-input" placeholder="氏名記入" value="${inspectorMain || ''}">
                        </div>
                        <div class="split-item">
                            <span class="label-key">点検者(副)</span>
                            <input type="text" class="print-input" placeholder="氏名記入" value="${inspectorSub || ''}">
                        </div>
                    </div>
                </div>
                <div class="label-qr-col">
                    <div id="qrcode-target"></div>
                    <div class="qr-note">スマホで読取</div>
                </div>
            </div>
        </div>
        
        <div class="modal-actions" style="justify-content: center; margin-top: 1rem;">
             <button class="secondary-btn" id="close-qr-btn">閉じる</button>
             <button class="primary-btn" onclick="printLabel()">🖨️ 印刷 (A5)</button>
        </div>
        
        <p style="text-align:center; font-size:0.8rem; color:#666; margin-top:0.5rem;">
            ※印刷設定で「A5」「横」「倍率100%」等に調整してください
        </p>
    `;

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = contentHtml;
        // Re-attach close handler since we wiped it
        document.getElementById('close-qr-btn').onclick = () => modal.style.display = 'none';
    }

    // Generate QR
    const container = document.getElementById('qrcode-target');
    if (container) {
        container.innerHTML = '';
        // ベースURLを取得 (現在のパスからinspection.htmlへのパスを構築)
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/inspection.html';
        const url = `${baseUrl}?action=new&s=${encodeURIComponent(siteId)}&mt=${encodeURIComponent(machineType)}&id=${encodeURIComponent(machineId)}&mo=${encodeURIComponent(modelType)}&cmid=${encodeURIComponent(companyMachineId || '')}&main=${encodeURIComponent(inspectorMain || '')}&sub=${encodeURIComponent(inspectorSub || '')}`;

        new QRCode(container, {
            text: url,
            width: 160, // Smaller for label? or Big enough
            height: 160,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    modal.style.display = 'flex';
}


// 履歴カレンダー用変数
let historyCurrentYear = new Date().getFullYear(); // 月次点検履歴用 (YYYY)
let historyCurrentMonth = new Date().toISOString().slice(0, 7); // 日常点検履歴用 (YYYY-MM)
let historyDataCache = []; // 取得した履歴データのキャッシュ
let historyTargetSiteId = null;
let historyTargetMachineId = null;
let historyTargetMachineType = null;

async function openMachineHistory(siteId, machineId) {
    historyTargetSiteId = siteId;
    historyTargetMachineId = machineId;

    // 機械情報を取得してタイプを特定する（リストデータから逆引きするのは大変なので、Supabaseから最新1件取ってタイプを特定するか、
    // あるいは renderMachineList で呼び出すときにタイプも渡すように変更するのがベストだが、
    // ここでは簡易的に、一旦点検データを検索してタイプを特定する）

    // UI初期化
    document.getElementById('history-modal').style.display = 'flex';
    document.getElementById('history-modal-title').innerText = `${machineId} の点検履歴`;
    document.getElementById('history-calendar-container').innerHTML = '';
    document.getElementById('history-loading').style.display = 'block';
    document.getElementById('history-controls').style.display = 'none';

    // データ取得
    const { data: list, error } = await supabaseClient
        .from('inspections')
        .select('*')
        .eq('site_id', siteId)
        .eq('machine_id', machineId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('inspection_date', { ascending: false });

    document.getElementById('history-loading').style.display = 'none';

    if (!list || list.length === 0) {
        document.getElementById('history-calendar-container').innerHTML = '<div style="text-align:center;">履歴がありません</div>';
        return;
    }

    historyDataCache = list;

    // データ内の主要なタイプを優先するロジック
    // ショベル系なら 'shovel' を優先（月次ベース）。
    const hasMonthly = list.some(i => !dailyMonthlyTypes.includes(i.machine_type) || i.machine_type === 'shovel');
    if (hasMonthly) {
        const m = list.find(i => !dailyMonthlyTypes.includes(i.machine_type) || i.machine_type === 'shovel');
        historyTargetMachineType = m ? m.machine_type : list[0].machine_type;
    } else {
        historyTargetMachineType = list[0].machine_type;
    }

    // コントロール表示
    document.getElementById('history-controls').style.display = 'flex';

    // 初期表示
    if (dailyMonthlyTypes.includes(historyTargetMachineType)) {
        // 日常点検 (月間カレンダー)
        historyCurrentMonth = new Date().toISOString().slice(0, 7);
        renderMonthlyHistory();
    } else {
        // 月次点検 (年間カレンダー)
        historyCurrentYear = new Date().getFullYear();
        renderYearlyHistory();
    }

    // イベントリスナー設定 (重複防止のため一旦削除してから追加すべきだが、簡易実装)
    document.getElementById('history-prev-btn').onclick = () => changeHistoryPeriod(-1);
    document.getElementById('history-next-btn').onclick = () => changeHistoryPeriod(1);
}

function changeHistoryPeriod(delta) {
    if (dailyMonthlyTypes.includes(historyTargetMachineType)) {
        // 月単位移動
        const d = new Date(historyCurrentMonth + "-01");
        d.setMonth(d.getMonth() + delta);
        historyCurrentMonth = d.toISOString().slice(0, 7);
        renderMonthlyHistory();
    } else {
        // 年単位移動
        historyCurrentYear += delta;
        renderYearlyHistory();
    }
}

// 年間カレンダー (月次点検用)
function renderYearlyHistory() {
    const container = document.getElementById('history-calendar-container');
    const label = document.getElementById('history-current-period');

    label.innerText = `${historyCurrentYear}年`;

    let html = `<div class="yearly-calendar-grid">`;

    // 1月〜12月
    for (let m = 1; m <= 12; m++) {
        const monthStr = `${historyCurrentYear}-${m.toString().padStart(2, '0')}`;

        // その月の月次データを探す
        // shovelの場合は machine_type='shovel' を探す
        const monthlyData = historyDataCache.find(i => i.inspection_date && i.inspection_date.startsWith(monthStr) && !dailyMonthlyTypes.includes(i.machine_type));

        // その月の日常データも探す (ショベルの場合など)
        const dailyData = historyDataCache.find(i => i.inspection_date && i.inspection_date.startsWith(monthStr) && dailyMonthlyTypes.includes(i.machine_type));

        const isDone = !!monthlyData;
        const isDailyDone = !!dailyData;

        let bg = '#f8fafc';
        let border = '#e2e8f0';
        let text = '';

        if (isDone) {
            bg = '#dcfce7'; // 緑
            border = '#22c55e';
            text += '<div style="color:#15803d; font-weight:bold; font-size:0.8rem;">月次:済</div>';
        } else {
            text += '<div style="color:#94a3b8; font-size:0.8rem;">月次:-</div>';
        }

        if (isDailyDone) {
            text += '<div style="color:#0369a1; font-weight:bold; font-size:0.8rem;">日常:有</div>';
        } else if (dailyMonthlyTypes.includes(historyTargetMachineType) || historyTargetMachineType === 'shovel') { // ショベルなどの場合のみ日常ステータスを表示
            // text += '<div style="color:#94a3b8; font-size:0.8rem;">日常:-</div>'; // スペースとるので表示しない、あるいは空で
        }

        // クリック時の挙動: 月次があれば月次を開く。日常しかなければ日常を開く。
        let onClick = '';
        if (monthlyData) {
            onClick = `location.href='inspection.html?id=${monthlyData.id}&site_id=${historyTargetSiteId}&mode=check'`;
        } else if (dailyData) {
            onClick = `location.href='inspection.html?id=${dailyData.id}&site_id=${historyTargetSiteId}&mode=check'`;
        }

        html += `<div class="history-cell-year" style="background:${bg}; border-color:${border}; cursor:${onClick ? 'pointer' : 'default'};" onclick="${onClick}">
            <div class="month-label">${m}月</div>
            <div class="status-cell-content" style="display:flex; flex-direction:column; gap:2px;">
                ${text}
            </div>
        </div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// 月間カレンダー (日常点検用)
function renderMonthlyHistory() {
    const container = document.getElementById('history-calendar-container');
    const label = document.getElementById('history-current-period');

    const [y, m] = historyCurrentMonth.split('-');
    label.innerText = `${y}年${m}月`;

    // その月のデータを取得 (日常点検は月単位で1レコード)
    const record = historyDataCache.find(r => r.inspection_date && r.inspection_date.startsWith(historyCurrentMonth));

    let html = `
        <div style="text-align:right; margin-bottom:0.5rem;">
            ${record ? `<button class="secondary-btn" onclick="location.href='inspection.html?id=${record.id}&site_id=${historyTargetSiteId}'">詳細・編集</button>` : '<span style="color:#94a3b8;">データなし</span>'}
        </div>
        <div class="monthly-calendar-grid">
    `;

    // 日付 (1〜31)
    const daysInMonth = new Date(y, m, 0).getDate();

    for (let d = 1; d <= 31; d++) {
        if (d > daysInMonth) {
            html += `<div></div>`; // 空セル
            continue;
        }

        const dayStr = d.toString().padStart(2, '0');
        let isDone = false;

        if (record && record.statuses) {
            // ステータスチェック: day-{DD}- で始まるキーがあり、かつ none でない
            const prefix = `day-${dayStr}-`;
            isDone = Object.entries(record.statuses).some(([k, v]) => k.startsWith(prefix) && v !== 'none');
        }

        const cellClass = isDone ? 'day-cell-history done-day' : 'day-cell-history';
        const mark = isDone ? '<span class="done-mark">済</span>' : '';

        html += `
            <div class="${cellClass}">
                <span class="day-num">${d}</span>
                ${mark}
            </div>
        `;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// --- 点検表画面 (inspection.html) ---
async function initInspection() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("DEBUG: initInspection called. Params:", Object.fromEntries(urlParams.entries()));

    const action = urlParams.get('action');
    const copyFromId = urlParams.get('copy_from_id');

    // グローバル変数更新
    currentSiteId = urlParams.get('site_id') || urlParams.get('s');
    currentInspectionId = null; // 初期化

    // パラメータ取得
    const mType = urlParams.get('mt') || urlParams.get('machine_type');
    const mId = urlParams.get('id') || urlParams.get('machine_id');
    const model = urlParams.get('mo') || urlParams.get('model_type');
    const cmid = urlParams.get('cmid');
    const mode = urlParams.get('mode');

    // New Params for Inspectors
    const mainInsp = urlParams.get('main');
    const subInsp = urlParams.get('sub');

    console.log("DEBUG: Parsed params -> mType:", mType, ", mId:", mId, ", action:", action);

    // 1. レコードID (既存データの詳細・編集用) の特定
    let recordId = null;
    if (action !== 'new') {
        // mt (機種名) がない場合に限り、id をレコードUUIDとみなす
        if (urlParams.has('id') && !mType && (!mId || mId.length > 20)) {
            recordId = urlParams.get('id');
        }
    }

    // 早期表示制御: 何らかの指定がある場合はモーダルを隠す
    if (recordId || copyFromId || mType) {
        const modal = document.getElementById('machine-modal');
        if (modal) modal.style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    }

    // 入力項目の初期化 (日付・月)
    const monthInput = document.getElementById('inspection-month');
    if (monthInput && !monthInput.value) {
        monthInput.value = new Date().toISOString().slice(0, 7);
    }
    const dateInput = document.getElementById('inspection-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // --- 各種パスによる分岐 ---
    if (recordId) {
        // A. 既存レコードの編集・詳細表示
        await loadInspectionData(recordId);

        // Fallback sync for Inspectors
        const mainEl = document.getElementById('inspector-main');
        if (mainEl && !mainEl.value && mainInsp) mainEl.value = mainInsp;
        const subEl = document.getElementById('inspector-sub');
        if (subEl && !subEl.value && subInsp) subEl.value = subInsp;

        // Fallback sync for Machine Data (Name, Model, CMID)
        const modelEl = document.getElementById('model-type');
        if (modelEl && !modelEl.value && model) modelEl.value = model;

        const cmidEl = document.getElementById('company-machine-id');
        if (cmidEl && !cmidEl.value && cmid) cmidEl.value = cmid;

        const nameEl = document.getElementById('machine-name');
        if (nameEl && !nameEl.value && cmid) {
            const allMachines = [...(typeof shovelMachineList !== 'undefined' ? shovelMachineList : []), ...(typeof tractorMachineList !== 'undefined' ? tractorMachineList : [])];
            const match = allMachines.find(m => m.company_id === cmid);
            if (match) nameEl.value = match.name;
        }

        // Lock Machine Fields for Existing Records
        lockMachineFields();

        // 親(月次)点検からの点検者同期 (Dailyの場合)
        await syncInspectorFromParent(currentMachineId, document.getElementById('machine-id').value, currentSiteId);

    } else if (copyFromId) {
        // B. 既存レコードをベースにしたコピー作成
        await loadInspectionData(copyFromId);
        currentInspectionId = null; // 新規扱いにする
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        const titleEl = document.getElementById('form-title');
        if (titleEl) titleEl.innerText += " (再点検)";

        // Lock Machine Fields for Copy
        lockMachineFields();

    } else if (mType) {
        // C. QRコードやボタンからの新規作成 (機種・ID指定あり)

        // 先にフォーム内の値をセット (loadMonthlyDataで使用するため)
        const midEl = document.getElementById('machine-id');
        if (midEl && mId) midEl.value = mId;
        const modelEl = document.getElementById('model-type');
        if (modelEl && model) modelEl.value = model;
        const cmidEl = document.getElementById('company-machine-id');
        if (cmidEl && cmid) cmidEl.value = cmid;

        // Machine Name Lookup & Set
        const nameEl = document.getElementById('machine-name');
        if (nameEl && cmid) {
            const allMachines = [...(typeof shovelMachineList !== 'undefined' ? shovelMachineList : []), ...(typeof tractorMachineList !== 'undefined' ? tractorMachineList : [])];
            const match = allMachines.find(m => m.company_id === cmid);
            if (match) nameEl.value = match.name;
        }

        // Inspectors Pre-fill (Initial set)
        const mainEl = document.getElementById('inspector-main');
        if (mainEl && mainInsp) mainEl.value = mainInsp;
        const subEl = document.getElementById('inspector-sub');
        if (subEl && subInsp) subEl.value = subInsp;

        // Lock Machine Fields for New (Param-based)
        lockMachineFields();

        // 次に機種選択を実行
        updateMachineMasterList(mType); // ★ここに追加: URLパラメータからの初期化時にもリストを更新
        selectMachine(mType);

        // 日常点検などの月間シート形式の場合、既存の同一月レコードを探して読み込む
        if (dailyMonthlyTypes.includes(mType) && mId) {
            await loadMonthlyData();

            // Fallback sync for Inspectors
            if (mainEl && !mainEl.value && mainInsp) mainEl.value = mainInsp;
            if (subEl && !subEl.value && subInsp) subEl.value = subInsp;

            // Fallback sync for Machine Data (Name, Model, CMID) - Critical for existing records or if cleared
            if (midEl && !midEl.value && mId) midEl.value = mId;
            if (modelEl && !modelEl.value && model) modelEl.value = model;
            if (cmidEl && !cmidEl.value && cmid) cmidEl.value = cmid;

            if (nameEl && !nameEl.value && cmid) {
                const allMachines = [...(typeof shovelMachineList !== 'undefined' ? shovelMachineList : []), ...(typeof tractorMachineList !== 'undefined' ? tractorMachineList : [])];
                const match = allMachines.find(m => m.company_id === cmid);
                if (match) nameEl.value = match.name;
            }

            // Re-lock
            lockMachineFields();

            // 親(月次)点検からの点検者同期
            await syncInspectorFromParent(currentMachineId, mId, currentSiteId);

            // 点検モード制御 (読み取り専用化)
            if (mode === 'check') {
                const lockFields = ['machine-id', 'company-machine-id', 'model-type', 'site-name'];
                lockFields.forEach(fid => {
                    const el = document.getElementById(fid);
                    // 値が入っている場合のみロックする（未入力の場合は入力させる）
                    if (el && el.value) {
                        el.readOnly = true;
                        el.style.backgroundColor = '#f1f5f9';
                        el.style.color = '#64748b';
                        el.tabIndex = -1;
                    }
                });
                const changeBtn = document.getElementById('change-machine-btn');
                if (changeBtn) changeBtn.style.display = 'none';
            }




            const monthIn = document.getElementById('inspection-month');
            if (monthIn) {
                monthIn.onchange = () => { if (currentMachineId) loadMonthlyData(); };
            }
            const midIn = document.getElementById('machine-id');
            if (midIn) {
                midIn.onblur = () => {
                    if (currentMachineId && dailyMonthlyTypes.includes(currentMachineId)) {
                        loadMonthlyData();
                    }
                };
            }
        }
    } else {
        // D. 真っさらな新規作成 (メニューから)
        const modal = document.getElementById('machine-modal');
        if (modal) modal.style.display = 'flex';
    }

    // イベントリスナー設定 (保存・リセット・機種変更・印刷)
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.onclick = () => saveInspection();

    const changeMBtn = document.getElementById('change-machine-btn');
    if (changeMBtn) changeMBtn.onclick = () => {
        if (confirm("機種を変更しますか？ 入力内容がクリアされます。")) location.reload();
    };

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.onclick = () => {
        if (confirm("入力をリセットしますか？")) renderForm(currentMachineId);
    };

    const printBtn = document.getElementById('print-btn');
    if (printBtn) printBtn.onclick = () => {
        document.body.classList.remove('print-mode-label'); // Safety: Ensure label mode is off
        updateDocumentTitle(); // 印刷直前に更新
        window.print();
    };

    // タイトル更新用のイベントリスナー
    const titleTriggerIds = ['inspection-month', 'inspection-date', 'model-type', 'machine-id'];
    titleTriggerIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', updateDocumentTitle);
            el.addEventListener('input', updateDocumentTitle);
        }
    });

    // 初期化時にも一度実行
    updateDocumentTitle();

    // 共通後処理
    if (currentSiteId && typeof fetchSiteInfo === 'function') fetchSiteInfo(currentSiteId);
}

async function fetchSiteInfo(siteId) {
    if (!supabaseClient) return;
    const { data: site, error } = await supabaseClient
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();

    if (error || !site) return;

    const siteNameEl = document.getElementById('site-name');
    const representativeEl = document.getElementById('representative');
    // const inspectorEl = document.getElementById('inspector-name'); // Removed
    const safetyEl = document.getElementById('safety-manager');

    if (siteNameEl) siteNameEl.value = site.name || '';
    if (representativeEl) representativeEl.value = site.representative || '';
    // if (inspectorEl && !inspectorEl.value) inspectorEl.value = site.site_inspector || '';
    if (safetyEl) safetyEl.value = site.safety_manager || '';
}

function selectMachine(id) {
    currentMachineId = id;
    document.getElementById('machine-modal').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';

    // 機械のタイプに応じて自動入力リストを更新
    updateMachineMasterList(id);

    renderForm(id);
}

function renderForm(machineId) {
    const data = inspectionData[machineId];
    if (!data) return;
    document.getElementById('form-title').innerText = data.title;

    if (dailyMonthlyTypes.includes(machineId)) {
        // 日常始業点検（月間シート）の場合
        document.body.classList.add('print-mode-daily'); // Add print class
        document.getElementById('inspection-form').style.display = 'none';
        document.getElementById('monthly-grid-view').style.display = 'block';

        // 凡例切り替え
        document.getElementById('legend-section').style.display = 'none';
        const dailyLegend = document.getElementById('daily-legend-section');
        if (dailyLegend) dailyLegend.style.display = 'flex';

        document.getElementById('month-selector-group').style.display = 'block';
        document.getElementById('inspection-date-group').style.display = 'none';
        document.getElementById('operating-hours-group').style.display = 'none';
        renderMonthlyGrid(machineId);
        loadMonthlyData(); // 月間データを読み込む
    } else {
        // 通常の月次点検の場合
        document.body.classList.remove('print-mode-daily'); // Remove print class
        document.getElementById('inspection-form').style.display = 'grid';
        document.getElementById('monthly-grid-view').style.display = 'none';

        // 凡例切り替え
        document.getElementById('legend-section').style.display = 'flex';
        const dailyLegend = document.getElementById('daily-legend-section');
        if (dailyLegend) dailyLegend.style.display = 'none';

        document.getElementById('month-selector-group').style.display = 'none';
        document.getElementById('inspection-date-group').style.display = 'block';
        document.getElementById('operating-hours-group').style.display = 'block';

        // 全てのカラムを一旦クリア
        [1, 2, 3].forEach(i => document.getElementById(`col-${i}`).innerHTML = '');

        data.columns.forEach((col, idx) => {
            const container = document.getElementById(`col-${idx + 1}`);
            if (!container) return; // col-1, 2, 3 以外は無視
            col.forEach(group => {
                const groupEl = document.createElement('div');
                groupEl.className = 'category-group';
                groupEl.innerHTML = `<div class="category-title">${group.category}</div>`;
                group.items.forEach((item, i) => {
                    const uid = `${machineId}-${group.category}-${i}`;
                    const itemEl = document.createElement('div');
                    itemEl.className = 'inspection-item';
                    itemEl.innerHTML = `
                        <span class="item-name">${item}</span>
                        <div class="current-status good" id="status-${uid}" data-status="good" onclick="toggleStatus('${uid}')">レ</div>
                    `;
                    groupEl.appendChild(itemEl);
                });
                container.appendChild(groupEl);
            });
        });
    }
    updateDocumentTitle();
}

function renderMonthlyGrid(machineId) {
    const data = inspectionData[machineId];
    const head = document.getElementById('monthly-table-head');
    const body = document.getElementById('monthly-table-body');
    if (!head || !body) return;

    // ヘッダー生成 (項目名 + 1〜31日)
    let headHtml = '<th>点検項目</th>';

    // 年月を取得
    const monthVal = document.getElementById('inspection-month').value;
    const [yearStr, monthStr] = monthVal ? monthVal.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1];
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Calculate days in month
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        // 曜日判定
        const date = new Date(year, month - 1, i);
        let classStr = "";
        let styleStr = ""; // Style for Th

        // 月が替わっている場合（例: 2月30日）は曜日判定しない
        if (date.getMonth() === month - 1) {
            const dayOfWeek = date.getDay(); // 0:Sun, 6:Sat
            if (dayOfWeek === 0) {
                classStr = "sun";
                styleStr = "background-color: #fee2e2 !important; color: #b91c1c;";
            } else if (dayOfWeek === 6) {
                classStr = "sat";
                styleStr = "background-color: #e0f2fe !important; color: #0369a1;";
            }
        }

        headHtml += `<th class="${classStr}" style="${styleStr}">${i}</th>`;
    }
    head.innerHTML = headHtml;

    // ボディ生成
    const today = new Date();
    const isCurrentMonth = monthVal === `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const todayDate = today.getDate();

    let bodyHtml = '';
    let itemIdx = 0;
    data.columns.forEach(col => {
        col.forEach(group => {
            group.items.forEach(item => {
                bodyHtml += `<tr><td>${item}</td>`;
                for (let d = 1; d <= daysInMonth; d++) {
                    const dayStr = d.toString().padStart(2, '0');
                    const uid = `day-${dayStr}-item-${itemIdx}`;

                    // 曜日判定 (再度)
                    const date = new Date(year, month - 1, d);
                    let classStr = "";
                    let bgStyle = "";

                    if (date.getMonth() === month - 1) {
                        const dayOfWeek = date.getDay();
                        if (dayOfWeek === 0) {
                            classStr = "sun";
                            bgStyle = "background-color: #fee2e2 !important;";
                        } else if (dayOfWeek === 6) {
                            classStr = "sat";
                            bgStyle = "background-color: #e0f2fe !important;";
                        }
                    }

                    // 当日の列をハイライト (薄い黄色など) -> 優先度: 当日 > 土日 (ただし土日背景は透過で重ねる想定)
                    // CSS側で .day-cell.sat, .day-cell.sun を定義する
                    let style = bgStyle;
                    if (isCurrentMonth && d === todayDate) {
                        // 当日枠線 (既存スタイルと結合)
                        style += "border-left: 2px solid #fbbf24; border-right: 2px solid #fbbf24;";
                    }

                    // day-cellに加えて sat/sun クラスを追加
                    bodyHtml += `<td class="day-cell ${classStr}" id="status-${uid}" data-status="none" onclick="toggleDailyStatus('${uid}')" style="${style}"></td>`;
                }
                bodyHtml += '</tr>';
                itemIdx++;
            });
        });
    });
    body.innerHTML = bodyHtml;
}

function toggleDailyStatus(uid) {
    const el = document.getElementById(`status-${uid}`);
    if (!el) return;
    const curr = el.getAttribute('data-status') || 'none';
    const idx = dailyStatusOptions.findIndex(o => o.code === curr);
    const next = dailyStatusOptions[(idx + 1) % dailyStatusOptions.length];

    el.className = `day-cell status-cell-${next.code}`;
    el.innerText = next.mark;
    el.setAttribute('data-status', next.code);
}


async function loadMonthlyData(targetScope = null, idSuffix = '') {
    if (!targetScope) updateDocumentTitle();

    const month = document.getElementById('inspection-month').value;
    let mid = document.getElementById('machine-id').value;
    if (mid) mid = mid.trim();

    console.log(`DEBUG: loadMonthlyData -> month:${month}, mid:${mid}, curMach:${currentMachineId}, curSite:${currentSiteId}`);

    if (!month || !mid || !currentMachineId) return;

    // --- Clear Statuses Logic (Ver53) ---
    try {
        const isDaily = dailyMonthlyTypes.includes(currentMachineId);
        let scope = targetScope;
        if (!scope) {
            scope = document.getElementById(isDaily ? 'monthly-grid-page' : 'inspection-form-page');
        }

        if (scope) {
            if (isDaily) {
                scope.querySelectorAll('.day-cell').forEach(el => {
                    const keep = ['day-cell', 'sat', 'sun'];
                    el.classList.forEach(c => {
                        if (!keep.includes(c)) el.classList.remove(c);
                    });
                    el.innerText = '';
                    el.setAttribute('data-status', 'none');
                });
            } else {
                scope.querySelectorAll('.current-status').forEach(el => {
                    el.className = 'current-status good';
                    el.innerText = 'レ';
                    el.setAttribute('data-status', 'good');
                });
                if (!targetScope) {
                    const rem = document.getElementById('remarks');
                    const rep = document.getElementById('repairs');
                    if (rem) rem.value = '';
                    if (rep) rep.value = '';
                }
            }
        }

        // --- Fetch Data ---
        // Calculate date range for the month
        const [y, m] = month.split('-').map(Number);
        const startDate = `${month}-01`;
        // Next month calculation
        const nextMonthDate = new Date(y, m, 1); // JS Month is 0-indexed, so 'm' is already next month
        const nm = nextMonthDate.getMonth() + 1;
        const ny = nextMonthDate.getFullYear();
        const nextMonthStr = `${ny}-${String(nm).padStart(2, '0')}-01`;

        let query = supabaseClient
            .from('inspections')
            .select('*')
            .eq('machine_type', currentMachineId)
            .eq('machine_id', mid)
            .or('is_deleted.is.null,is_deleted.eq.false')
            .gte('inspection_date', startDate)
            .lt('inspection_date', nextMonthStr)
            .order('created_at', { ascending: false });

        if (currentSiteId) {
            const sid = currentSiteId.trim();
            query = query.eq('site_id', sid);
        } else {
            query = query.is('site_id', null);
        }

        console.log("DEBUG: Executing Supabase Query...");
        const { data: list, error } = await query;

        if (error) {
            console.error("DEBUG: loadMonthlyData Supabase Error:", error);
            // alert("読み込みエラー: " + error.message);
            return;
        }

        console.log("DEBUG: Load result:", list);
        if (list && list.length > 0) {
            console.log("DEBUG: Latest Record:", list[0]);
            console.log("DEBUG: Latest Statuses:", list[0]?.statuses);
            console.log("DEBUG: Status Keys:", list[0]?.statuses ? Object.keys(list[0].statuses) : "No statuses");

            const latest = list[0];
            if (!targetScope) currentInspectionId = latest.id;

            const setG = (id, val) => {
                let el = targetScope ? targetScope.querySelector(`[id$="${id}"]`) : document.getElementById(id);
                if (el) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') el.value = val || '';
                    else el.innerText = val || '';
                }
            };

            setG('model-type', latest.model_type);
            setG('remarks', latest.remarks);
            setG('repairs', latest.repairs);
            setG('inspector-main', latest.statuses?._inspector_main);
            setG('inspector-sub', latest.statuses?._inspector_sub);
            setG('company-machine-id', latest.statuses?._company_machine_id);
            setG('operating-hours', latest.operating_hours);
            setG('site-representative', latest.statuses?._site_representative);

            if (latest.statuses && scope) {
                const options = isDaily ? dailyStatusOptions : statusOptions;
                Object.keys(latest.statuses).forEach(uid => {
                    if (uid.startsWith('_')) return;
                    let el = targetScope ? scope.querySelector(`[id$="status-${uid}"]`) : scope.querySelector(`#status-${uid}`);
                    if (el) {
                        const code = latest.statuses[uid];
                        const opt = options.find(o => o.code === code);
                        if (opt) {
                            el.className = isDaily ? `day-cell status-cell-${code}` : `current-status ${code}`;
                            el.innerText = opt.mark;
                            el.setAttribute('data-status', code);
                        }
                    }
                });
            }
            if (!targetScope) updateDocumentTitle();
            return latest;
        } else {
            if (!targetScope) currentInspectionId = null;
            return null;
        }
    } catch (e) {
        console.error("DEBUG: loadMonthlyData Exception:", e);
        // alert("読み込み例外: " + e.message);
    }
}

function toggleStatus(uid) {
    const el = document.getElementById(`status-${uid}`);
    if (!el) return;
    const curr = el.getAttribute('data-status');
    const idx = statusOptions.findIndex(o => o.code === curr);
    const next = statusOptions[(idx + 1) % statusOptions.length];
    el.className = `current-status ${next.code}`;
    el.innerText = next.mark;
    el.setAttribute('data-status', next.code);
}

async function saveInspection() {
    const btn = document.getElementById('save-btn');
    const model = document.getElementById('model-type').value;
    const mid = document.getElementById('machine-id').value;
    const companyMid = document.getElementById('company-machine-id').value;
    const isDaily = dailyMonthlyTypes.includes(currentMachineId);

    const hoursEl = document.getElementById('operating-hours');
    const hours = hoursEl.value;

    if (!model || !mid || !companyMid || (!isDaily && !hours)) {
        alert("必須項目(*印)を入力してください");
        return;
    }

    btn.disabled = true;
    btn.innerText = "保存中...";

    try {
        const statuses = {};
        const selector = isDaily ? '.day-cell' : '.current-status';

        // Debug: Log Scraping
        console.log(`DEBUG: saveInspection - isDaily:${isDaily}, Selector:${selector}`);
        console.log(`DEBUG: Found elements: ${document.querySelectorAll(selector).length}`);
        console.log(`DEBUG: Captured Statuses:`, statuses);

        document.querySelectorAll(selector).forEach(el => {
            const id = el.id.replace('status-', '');
            const stat = el.getAttribute('data-status');
            if (isDaily) {
                if (stat !== 'none') statuses[id] = stat;
            } else {
                statuses[id] = stat;
            }
        });

        const inspectionDate = isDaily
            ? document.getElementById('inspection-month').value + "-01"
            : document.getElementById('inspection-date').value;

        statuses['_company_machine_id'] = companyMid;
        statuses['_inspector_main'] = document.getElementById('inspector-main')?.value || '';
        statuses['_inspector_sub'] = document.getElementById('inspector-sub')?.value || '';

        const payload = {
            site_id: currentSiteId || null,
            machine_type: currentMachineId,
            model_type: model,
            machine_id: mid,
            inspection_date: inspectionDate,
            operating_hours: hours ? parseFloat(hours) : 0,
            inspector_name: "",
            remarks: document.getElementById('remarks').value,
            repairs: document.getElementById('repairs').value,
            statuses: statuses,
            line_user_id: lineUserInfo?.userId || null,
            site_name: document.getElementById('site-name')?.value || '',
            representative: document.getElementById('representative')?.value || '',
            safety_manager: document.getElementById('safety-manager')?.value || ''
        };

        console.log("DEBUG: Save Payload:", payload);

        // Upsert Check
        let checkQuery = supabaseClient
            .from('inspections')
            .select('id')
            .eq('machine_type', payload.machine_type)
            .eq('machine_id', payload.machine_id);

        // Ver60: Use Range Query for Daily to match loadMonthlyData logic
        if (isDaily) {
            // Calculate range
            const [y, m] = document.getElementById('inspection-month').value.split('-').map(Number);
            const startDate = `${document.getElementById('inspection-month').value}-01`;
            const nextMonthDate = new Date(y, m, 1);
            const nm = nextMonthDate.getMonth() + 1;
            const ny = nextMonthDate.getFullYear();
            const nextMonthStr = `${ny}-${String(nm).padStart(2, '0')}-01`;

            checkQuery = checkQuery
                .gte('inspection_date', startDate)
                .lt('inspection_date', nextMonthStr);
        } else {
            checkQuery = checkQuery.eq('inspection_date', payload.inspection_date);
        }

        checkQuery = checkQuery
            .or('is_deleted.is.null,is_deleted.eq.false')
            .order('created_at', { ascending: false }) // Get latest if multiple
            .limit(1);

        if (payload.site_id) {
            checkQuery = checkQuery.eq('site_id', payload.site_id);
        } else {
            checkQuery = checkQuery.is('site_id', null);
        }

        const checkResult = await checkQuery;
        console.log("DEBUG: Check Result:", checkResult);

        if (checkResult.error) throw new Error("CheckQuery Error: " + checkResult.error.message);

        let targetId = null;
        if (checkResult.data && checkResult.data.length > 0) {
            targetId = checkResult.data[0].id;
        }

        let result;
        if (targetId) {
            result = await supabaseClient.from('inspections').update(payload).eq('id', targetId).select();
        } else {
            result = await supabaseClient.from('inspections').insert([payload]).select();
        }

        if (result.error) throw new Error("Save Error: " + result.error.message);

        // Success Handling
        const newId = result.data[0].id;
        currentInspectionId = newId;
        const url = new URL(window.location);
        url.searchParams.set('id', newId);
        url.searchParams.delete('action');
        window.history.replaceState({}, '', url);

        if (isDaily) await loadMonthlyData();

        // Auto-create Daily if needed
        let autoCreatedMsg = "";
        const baseType = getBaseMachineType(currentMachineId);
        const dailyType = getDailyMachineType(baseType);

        if (dailyType && currentMachineId === baseType) {
            // Calculate range for auto-create check
            const [y, m] = inspMonth.split('-').map(Number);
            const startDate = `${inspMonth}-01`;
            const nextMonthDate = new Date(y, m, 1);
            const nm = nextMonthDate.getMonth() + 1;
            const ny = nextMonthDate.getFullYear();
            const nextMonthStr = `${ny}-${String(nm).padStart(2, '0')}-01`;

            const { data: existingDaily } = await supabaseClient
                .from('inspections')
                .select('id')
                .eq('site_id', payload.site_id)
                .eq('machine_type', dailyType)
                .eq('machine_id', String(mid))
                .gte('inspection_date', startDate)
                .lt('inspection_date', nextMonthStr)
                .or('is_deleted.is.null,is_deleted.eq.false')
                .limit(1)
                .maybeSingle();

            if (!existingDaily) {
                const dailyPayload = { ...payload };
                dailyPayload.machine_type = dailyType;
                dailyPayload.inspection_date = `${inspMonth}-01`;
                dailyPayload.operating_hours = 0;
                dailyPayload.statuses = {};
                dailyPayload.remarks = '';
                dailyPayload.repairs = '';

                const { error: dailyErr } = await supabaseClient.from('inspections').insert([dailyPayload]);
                if (!dailyErr) autoCreatedMsg = "\n(日常点検表も自動作成しました)";
            }
        }

        alert("保存しました" + autoCreatedMsg);

        if (typeof liff !== 'undefined' && liff.isInClient()) {
            liff.closeWindow();
        } else {
            const redirectUrl = currentSiteId ? `index.html?site_id=${currentSiteId}` : 'index.html';
            // window.location.href = redirectUrl; // Stay checking
        }

    } catch (e) {
        console.error(e);
        alert("予期せぬエラー: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "保存";
    }

    if (typeof liff !== 'undefined' && liff.isInClient()) {
        liff.closeWindow();
    } else {
        const redirectUrl = currentSiteId ? `index.html?site_id=${currentSiteId}` : 'index.html';
        window.location.href = redirectUrl;
    }
}

async function loadInspectionData(id) {
    const { data: i, error } = await supabaseClient.from('inspections').select('*').eq('id', id).single();
    if (error || !i) return;

    currentInspectionId = i.id;
    currentMachineId = i.machine_type;
    currentSiteId = i.site_id; // site_idも確実にセット

    // 先に値をセットしておく（自動ロード時にmid等が必要になるため）
    const modelEl = document.getElementById('model-type');
    const midEl = document.getElementById('machine-id');
    // const inspectorEl = document.getElementById('inspector-name'); // Removed
    const remarksEl = document.getElementById('remarks');
    const repairsEl = document.getElementById('repairs');

    if (modelEl) modelEl.value = i.model_type || '';
    if (midEl) midEl.value = i.machine_id || '';
    // if (inspectorEl) inspectorEl.value = i.inspector_name || '';

    // Add Main/Sub Inspector
    const inspectorMainEl = document.getElementById('inspector-main');
    const inspectorSubEl = document.getElementById('inspector-sub');
    if (inspectorMainEl) inspectorMainEl.value = (i.statuses && i.statuses._inspector_main) || '';
    if (inspectorSubEl) inspectorSubEl.value = (i.statuses && i.statuses._inspector_sub) || '';

    if (remarksEl) remarksEl.value = i.remarks || '';
    if (repairsEl) repairsEl.value = i.repairs || '';

    const companyMidEl = document.getElementById('company-machine-id');
    // statusesの中に保存されている場合があるためそこから取得
    if (companyMidEl) {
        companyMidEl.value = i.company_machine_id || (i.statuses && i.statuses._company_machine_id) || '';
    }

    const representativeEl = document.getElementById('representative');
    const safetyEl = document.getElementById('safety-manager');
    const headerSiteNameEl = document.getElementById('header-site-name');

    // if (siteNameEl) siteNameEl.value = i.site_name || ''; // Removed from input
    if (headerSiteNameEl) headerSiteNameEl.innerText = i.site_name || ''; // Set header text
    if (representativeEl) representativeEl.value = i.representative || '';
    if (safetyEl) safetyEl.value = i.safety_manager || '';

    // 日常点検の場合は月指定も復元
    if (dailyMonthlyTypes.includes(i.machine_type)) {
        const monthStr = i.inspection_date.slice(0, 7);
        const monthInput = document.getElementById('inspection-month');
        if (monthInput) monthInput.value = monthStr;
    } else {
        const dateInput = document.getElementById('inspection-date');
        const hourInput = document.getElementById('operating-hours');
        if (dateInput) dateInput.value = i.inspection_date;
        if (hourInput) hourInput.value = i.operating_hours;
    }

    // 画面構成を切り替え
    updateMachineMasterList(i.machine_type); // ★ここに追加: 保存データ読み込み時にもリストを更新
    selectMachine(i.machine_type);

    // 日常点検の場合は、selectMachine内のrenderFormから呼ばれるloadMonthlyDataが
    // 終わるのを待ってから（あるいは明示的に呼び出してから）値をセットする
    if (dailyMonthlyTypes.includes(i.machine_type)) {
        await loadMonthlyData();
    }

    if (i.statuses) {
        Object.keys(i.statuses).forEach(key => {
            if (key.startsWith('_')) return; // メタデータはスキップ
            const isDaily = dailyMonthlyTypes.includes(i.machine_type);
            const el = document.getElementById(`status-${key}`);
            if (el) {
                const code = i.statuses[key];
                const options = isDaily ? dailyStatusOptions : statusOptions;
                const opt = options.find(o => o.code === code);
                if (opt) {
                    el.className = (isDaily ? 'day-cell status-cell-' : 'current-status ') + code;
                    el.innerText = opt.mark;
                    el.setAttribute('data-status', code);
                }
            }
        });
    }
    updateDocumentTitle();
}

function goDashBoard() {
    const url = currentSiteId ? `index.html?site_id=${currentSiteId}` : 'index.html';
    window.location.href = url;
}

function getMachineIcon(type) {
    // 1. 画像がある機種
    const imgMap = {
        'shovel': 'assets/icons/backhoe.png',
        'shovel_daily': 'assets/icons/backhoe.png',
        'tractor': 'assets/icons/trailer.png',
        'crane': 'assets/icons/crane.png',
        'crane_daily': 'assets/icons/crane.png'
    };

    if (imgMap[type]) {
        return `<img src="${imgMap[type]}" class="machine-icon-img">`;
    }

    // 2. その他の日常点検用SVGアイコン
    let svg = '';
    let color = '#64748b'; // default gray

    switch (type) {
        case 'sandbag': // 大型土のう -> 茶色のBox
            svg = '<path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>';
            color = '#8d6e63';
            break;
        case 'power_tool': // 電動工具 -> オレンジの工具
            svg = '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>';
            color = '#f97316';
            break;
        case 'generator': // 発電機 -> 黄色のカミナリ
            svg = '<path d="M7 2v11h3v9l7-12h-4l4-8z"/>';
            color = '#eab308';
            break;
        case 'pump': // ポンプ -> 青の水滴
            svg = '<path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.88 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/>';
            color = '#3b82f6';
            break;
        case 'dist_board': // 分電盤 -> グレーの盤
            svg = '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z M7 7h10v2H7zm0 4h10v2H7zm0 4h6v2H7z"/>';
            color = '#475569';
            break;
        case 'arc_welder': // 溶接機 -> 赤の火
            svg = '<path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>';
            color = '#ef4444';
            break;
        case 'elec_equip': // 電気設備 -> 黄色の電球
            svg = '<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>';
            color = '#f59e0b';
            break;
        case 'hanging_tools': // 玉掛け -> フック
            svg = '<path d="M17 11c0-2.76-2.24-5-5-5s-5 2.24-5 5h2c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3v2c2.76 0 5-2.24 5-5zM11 16h2v6h-2z"/>';
            color = '#64748b';
            break;
        case 'iron_plate': // 敷鉄板 -> 濃いグレー
            svg = '<path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>';
            color = '#1f2937';
            break;
        case 'security_daily': // 保安 -> 赤の警告
            svg = '<path d="M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>';
            color = '#dc2626';
            break;
        case 'excavation_daily': // 掘削 -> 茶色の道具
            svg = '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>';
            color = '#795548';
            break;
        default:
            // デフォルト (四角)
            return '<span style="font-size:24px; line-height:30px;">⬜</span>';
    }

    return `<svg viewBox="0 0 24 24" fill="${color}" style="vertical-align:middle;">${svg}</svg>`;
}

// DatalistのUX改善用関数
function setupDatalistUX(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // オリジナルのプレースホルダーを保存
        if (!el.dataset.defaultPlaceholder) {
            el.dataset.defaultPlaceholder = el.placeholder || '';
        }

        el.addEventListener('focus', function () {
            // 値が入っている場合のみ処理
            if (this.value) {
                this.dataset.originalValue = this.value; // 値を退避
                this.placeholder = this.value;           // プレースホルダーに現在の値を表示（空に見えないように）
                this.value = '';                         // 値を空にしてリストを強制的に表示させる（多くのブラウザ用）
            }
        });

        el.addEventListener('blur', function () {
            // 何も入力せずに（空のまま）フォーカスが外れた場合、元の値を復元
            if (this.value === '' && this.dataset.originalValue) {
                this.value = this.dataset.originalValue;
            }
            // プレースホルダーを元に戻す
            this.placeholder = this.dataset.defaultPlaceholder;
        });
    });
}

// 初期化実行 (ファイルの最後に移動して全ての関数が定義されてから実行されるようにする)
document.addEventListener('DOMContentLoaded', async () => {
    // --- UI系の初期化を最優先で行う ---
    // 日付表示の更新
    updateDateDisplay();
    renderStaffList(); renderRepresentativeList();
    fetchDynamicStaffList(); // 非同期で最新リスト取得
    // populateMachineDatalist(); // Removed: handled by setupMachineAutoFill


    setupDatalistUX([
        'new-site-representative', 'new-site-inspector', 'new-site-safety-manager', // 現場登録モーダル
        'representative', 'inspector-main', 'inspector-sub', 'safety-manager', // 点検表画面
        'company-machine-id' // 会社管理No.に対象を変更
    ]);
    setupMachineAutoFillListener(); // 自動入力リスナー設定（初回のみ）
    updateMachineMasterList('shovel'); // 初期リストセット

    // 現場名の取得・表示 (ヘッダー用)
    if (currentSiteId) {
        const headerSiteNameEl = document.getElementById('header-site-name');
        if (headerSiteNameEl) {
            // 初期表示はロード中...とかにする？あるいはDB取得する
            supabaseClient.from('sites').select('name').eq('id', currentSiteId).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        headerSiteNameEl.innerText = data.name;
                    }
                });
        }
    }

    // --- 外部SDK系の初期化 (エラーや遅延の影響を受けないように後に実行) ---
    // LIFF初期化
    if (typeof liff !== 'undefined') {
        try {
            await liff.init({ liffId: LIFF_ID });
            if (liff.isLoggedIn()) {
                lineUserInfo = await liff.getProfile();
            } else if (window.location.pathname.includes('inspection.html') && liff.isInClient()) {
                liff.login();
            }
        } catch (err) { console.error("LIFF err", err); }
    }

    if (document.getElementById('site-list-view')) {
        initIndex();
        // URLにsite_idがある場合は直接詳細を開く
        if (currentSiteId) {
            setTimeout(() => {
                const siteRow = document.querySelector(`button[onclick*="openSiteDetail('${currentSiteId}'"]`);
                if (siteRow) {
                    siteRow.click();
                } else {
                    openSiteDetail(currentSiteId, "現場詳細");
                }
            }, 500);
        }
    } else if (document.getElementById('inspection-form')) {
        // Initialization for Inspection Page
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const isDemo = urlParams.get('demo') === 'true';

        if (mode === 'book') {
            document.body.classList.add('print-mode-book');
            const machineId = urlParams.get('machine_id');
            const machineType = urlParams.get('mt');

            if (isDemo) {
                populateMockData();
            } else if (machineId && currentSiteId) {
                // Ver29: Real Data Book Mode
                loadBookDataReal(currentSiteId, machineId, machineType);
            }
        } else {
            initInspection();
        }
    }
});

// --- Inspection Book & Mock Data ---

async function loadBookDataReal(siteId, machineId, machineType) {
    if (!supabaseClient) return;
    console.log("Loading Real Book Data...", siteId, machineId);

    const container = document.getElementById('book-container');
    if (!container) return; // Should be added in HTML if missing, but assuming it exists from Ver26

    // Hide default views
    document.getElementById('inspection-form').style.display = 'none';
    document.getElementById('monthly-grid-view').style.display = 'none';
    document.getElementById('inspection-form-page').style.display = 'none';
    document.getElementById('monthly-grid-page').style.display = 'none';

    container.innerHTML = '<div style="text-align:center; padding:50px; font-size:1.5rem;">データを読み込んでいます...</div>';
    container.style.display = 'block';

    // 1. Fetch ALL distinct months for this machine (Ascending)
    // Supabase doesn't support 'distinct' easily on select directly with order in one go sometimes, 
    // but let's try fetching all inspection_date and processing.
    const { data: inspections, error } = await supabaseClient
        .from('inspections')
        .select('inspection_date, machine_type')
        .eq('site_id', siteId)
        .eq('machine_id', machineId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('inspection_date', { ascending: true });

    if (error || !inspections || inspections.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:50px;">表示するデータがありません。</div>';
        return;
    }

    // Extract unique YYYY-MM
    const months = [...new Set(inspections.map(i => i.inspection_date.slice(0, 7)))];
    console.log("Months to render:", months);

    container.innerHTML = ''; // Clear loading message

    // Base elements to clone
    const baseFormPage = document.getElementById('inspection-form-page');
    const baseGridPage = document.getElementById('monthly-grid-page');

    // Determine Base and Daily Types
    const baseType = getBaseMachineType(machineType);
    const dailyType = getDailyMachineType(baseType);

    console.log(`DEBUG: Book Mode Context - Base: ${baseType}, Daily: ${dailyType}`);


    // Helper to process sequentially
    for (const month of months) {
        console.log(`Rendering ${month}...`);

        // --- 1. Load Monthly Data ---
        document.getElementById('inspection-month').value = month;
        document.getElementById('machine-id').value = machineId;
        currentSiteId = siteId;

        // Render Base Form (Original) -> Creates the structure but we won't fill it
        currentMachineId = baseType;
        renderForm(baseType);

        // --- CLONE FIRST (Empty) ---
        const cloneFormPage = baseFormPage.cloneNode(true);
        cloneFormPage.id = `inspection-form-page-${month}`;
        cloneFormPage.style.display = 'block';
        const internalForm = cloneFormPage.querySelector('#inspection-form');
        if (internalForm) internalForm.style.display = 'grid';

        // Rename IDs
        cloneFormPage.querySelectorAll('[id]').forEach(el => {
            if (el.id !== cloneFormPage.id) el.id = `bk-f-${month}-${el.id}`;
        });
        container.appendChild(cloneFormPage);

        // --- LOAD DATA INTO CLONE ---
        // Pass the clone as targetScope
        const monthlyData = await loadMonthlyData(cloneFormPage, `bk-f-${month}-`);

        // --- Generate Header from Data ---
        // We use the returned data (monthlyData) instead of reading DOM
        // Note: machine_name might not be in the record if not joined, but model is.
        // However, the original code read from #machine-name. loadMonthlyData sets #model-type etc.
        // Wait, loadMonthlyData sets values on the clone now. We can read from the clone!

        const getVal = (suffix) => {
            const el = cloneFormPage.querySelector(`[id$="${suffix}"]`);
            return el ? el.value : '';
        };
        const mModel = getVal('model-type');
        // machine-name is usually read-only and coming from master data. 
        // We should trigger the machine selection change logic? No, too complex.
        // Let's assume the user selected the machine before opening the book.
        // If so, the global #machine-name has the correct value!
        const globalMName = document.getElementById('machine-name').value;

        // Section Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'book-section-label';
        const yearStr = month.split('-')[0];
        const monthStr = month.split('-')[1];
        headerDiv.innerHTML = `
            <span class="header-item header-month">${yearStr}年${parseInt(monthStr)}月度</span>
            <span class="header-separator">|</span>
            <span class="header-item header-machine">${globalMName || '名称未設定'}</span>
            <span class="header-separator">|</span>
            <span class="header-item header-model">型式: ${mModel || '-'}</span>
            <span class="header-separator">|</span>
            <span class="header-item header-id">管理No: ${machineId}</span>
        `;
        // Insert header before the form page
        container.insertBefore(headerDiv, cloneFormPage);


        // --- 2. Load Daily Data (if applicable) ---
        if (dailyType) {
            currentMachineId = dailyType;
            renderForm(dailyType); // Re-renders original execution grid (empty)

            // Clone Grid
            const cloneGridPage = baseGridPage.cloneNode(true);
            cloneGridPage.id = `monthly-grid-page-${month}`;
            cloneGridPage.style.display = 'block';
            const internalGrid = cloneGridPage.querySelector('#monthly-grid-view');
            if (internalGrid) internalGrid.style.display = 'block';

            // Rename IDs
            cloneGridPage.querySelectorAll('[id]').forEach(el => {
                if (el.id !== cloneGridPage.id) el.id = `bk-g-${month}-${el.id}`;
            });
            container.appendChild(cloneGridPage);

            // Load Data into Clone
            await loadMonthlyData(cloneGridPage, `bk-g-${month}-`);

            // Wait for DOM updates to settle
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    // Restore Global State
    currentMachineId = machineType;
    currentSiteId = siteId;

    // Cleanup: Hide originals again (since renderForm unhides them)
    document.getElementById('inspection-form').style.display = 'none';
    document.getElementById('monthly-grid-view').style.display = 'none';
    document.getElementById('inspection-form-page').style.display = 'none';
    document.getElementById('monthly-grid-page').style.display = 'none';
}

function populateMockData() {
    console.log("Starting Multi-Month Mock Data Generation (Ver26)...");

    const months = ['2026-01', '2026-02', '2026-03'];
    const container = document.getElementById('book-container');
    if (!container) return;

    // Clear container
    container.innerHTML = '';
    container.style.display = 'block';

    // Base elements to clone
    const baseFormPage = document.getElementById('inspection-form-page');
    const baseGridPage = document.getElementById('monthly-grid-page');

    // Hide originals
    baseFormPage.style.display = 'none';
    baseGridPage.style.display = 'none';
    document.getElementById('inspection-form').style.display = 'none';
    document.getElementById('monthly-grid-view').style.display = 'none';

    // Helper async function to process sequentially
    const processMonth = async () => {
        for (let i = 0; i < months.length; i++) {
            const month = months[i];
            console.log(`Generating data for ${month}...`);

            // 1. Set Header Info for this month (on the hidden original form)
            const yearStr = month.split('-')[0];
            const monthStr = month.split('-')[1];
            document.getElementById('header-site-name').innerText = `デモ現場 (${yearStr}年${parseInt(monthStr)}月)`;

            document.getElementById('inspection-date').value = `${month}-01`;
            document.getElementById('inspection-month').value = month;
            document.getElementById('machine-name').value = "PC200-11 (デモ機)";
            document.getElementById('model-type').value = "PC200-11";
            document.getElementById('company-machine-id').value = "D-001";
            document.getElementById('machine-id').value = "999999";
            document.getElementById('representative').value = "山内 太郎";
            document.getElementById('inspector-main').value = "点検 次郎";

            // Randomize hours
            const hours = 1234.5 + (i * 150) + Math.floor(Math.random() * 50);
            document.getElementById('operating-hours').value = hours.toFixed(1);

            // 2. Render Forms (on the hidden original elements)
            renderForm('shovel');
            renderMonthlyGrid('shovel_daily');

            // 3. Randomize Checkboxes & Grid content
            await new Promise(r => setTimeout(r, 10));
            randomizeMockData(month);

            // 4. Clone and Append

            // Ver28: Inject Section Header (Refined)
            const headerDiv = document.createElement('div');
            headerDiv.className = 'book-section-label';
            // Format: [ 2026年1月度 | PC200-11 (デモ機) | 型式: PC200-11 | 管理No: D-001 ]
            headerDiv.innerHTML = `
                <span class="header-item header-month">${yearStr}年${parseInt(monthStr)}月度</span>
                <span class="header-separator">|</span>
                <span class="header-item header-machine">PC200-11 (デモ機)</span>
                <span class="header-separator">|</span>
                <span class="header-item header-model">型式: PC200-11</span>
                <span class="header-separator">|</span>
                <span class="header-item header-id">管理No: D-001</span>
            `;
            container.appendChild(headerDiv);

            // Clone Form Page
            const cloneFormPage = baseFormPage.cloneNode(true);
            cloneFormPage.id = `inspection-form-page-${month}`;
            cloneFormPage.style.display = 'block';

            // Re-enable visibility of internal grid (it was hidden on original)
            const internalForm = cloneFormPage.querySelector('#inspection-form');
            if (internalForm) internalForm.style.display = 'grid';

            container.appendChild(cloneFormPage);

            const cloneGridPage = baseGridPage.cloneNode(true);
            cloneGridPage.id = `monthly-grid-page-${month}`;
            cloneGridPage.style.display = 'block';

            const internalGrid = cloneGridPage.querySelector('#monthly-grid-view');
            if (internalGrid) internalGrid.style.display = 'block';

            container.appendChild(cloneGridPage);
        }
    };

    processMonth();

    // Force Book Mode styles
    document.body.classList.add('print-mode-book');
}

function randomizeMockData(month) {
    // 1. Monthly Checklist - Target ONLY the original Hidden Form
    const form = document.getElementById('inspection-form');
    if (form) {
        form.querySelectorAll('.current-status').forEach(el => {
            el.className = 'current-status good';
            el.innerText = 'レ';
            el.setAttribute('data-status', 'good');
        });
    }

    // 2. Daily Grid - Target ONLY the original Hidden Grid
    const gridBody = document.getElementById('monthly-table-body');
    if (gridBody) {
        gridBody.querySelectorAll('.day-cell').forEach(el => {
            // Reset first
            el.className = 'day-cell';
            el.innerHTML = '';
            el.removeAttribute('data-status');

            // Random status
            if (Math.random() > 0.85) return; // 15% empty

            const r = Math.random();
            let code = 'good';
            let mark = '○';
            if (r > 0.98) { code = 'repair'; mark = '×'; }
            else if (r > 0.95) { code = 'done'; mark = '●'; }

            el.className = `day-cell status-cell-${code}`;
            el.innerHTML = mark;
            el.setAttribute('data-status', code);
        });
    }
}


// グローバル公開
window.selectMachine = selectMachine;
window.toggleStatus = toggleStatus;
window.openSiteDetail = openSiteDetail;
window.openMachineHistory = openMachineHistory;
window.openEditSite = (id) => window.openEditSite(id);
window.confirmDeleteSite = (id) => window.confirmDeleteSite(id);
window.confirmDeleteInspection = (id) => window.confirmDeleteInspection(id);
window.goDashBoard = goDashBoard;
window.printLabel = printLabel;

// Removed old setupMachineAutoFill



const representativeList = [
    "杉本 鉄也",
    "林 成司",
    "佐藤 光一",
    "辻 成人",
    "白戸 嘉人",
    "庄司 明",
    "十河 弘樹",
    "林 真人",
    "金田 大作"
];

const staffList = [
    "杉本 鉄也", "林 成司", "佐藤 光一", "辻 成人", "白戸 嘉人", "庄司 明", "十河 弘樹", "林 真人", "金田 大作", "宮本 晴都", "五十嵐 友人", "広島 慶大",
    "若林 哲也", "曽我 澄男", "平本 健太", "越谷 武司", "堀田 淳介", "及川 真実", "松本 宏幸", "山本 喜昭", "高野 智行", "上井 昌樹",
    "高野 公彰", "平野 弥", "横田 裕輝", "宇佐美 剛", "鹿戸 文夫", "鳥本 全利", "宮井 仁志", "藤井 満浩", "橘井 哲也", "大羅 飛雄馬", "小玉 迅",
    "増田 均", "坂本 隆洋", "大岡 弘志", "林 邦彦",
    "堀 邦寿",
    "郷 樹美"
];


async function fetchDynamicStaffList() {
    if (!supabaseClient) return;

    // Fetch from Sites (Representatives, etc)
    const { data: sites } = await supabaseClient
        .from('sites')
        .select('representative, site_inspector, safety_manager')
        .order('last_updated', { ascending: false })
        .limit(50);

    // Fetch from Inspections (Inspectors)
    const { data: inspections } = await supabaseClient
        .from('inspections')
        .select('statuses')
        .order('created_at', { ascending: false })
        .limit(50);

    const newStaff = new Set();
    const newRep = new Set();

    if (sites) {
        sites.forEach(s => {
            if (s.representative && s.representative.trim()) newRep.add(s.representative.trim());
            if (s.site_inspector && s.site_inspector.trim()) newStaff.add(s.site_inspector.trim());
            if (s.safety_manager && s.safety_manager.trim()) newStaff.add(s.safety_manager.trim());
        });
    }

    if (inspections) {
        inspections.forEach(i => {
            if (i.statuses) {
                if (i.statuses._inspector_main && i.statuses._inspector_main.trim()) newStaff.add(i.statuses._inspector_main.trim());
                if (i.statuses._inspector_sub && i.statuses._inspector_sub.trim()) newStaff.add(i.statuses._inspector_sub.trim());
            }
        });
    }

    // Merge into arrays
    let updated = false;
    newRep.forEach(name => {
        if (!representativeList.includes(name)) {
            representativeList.push(name);
            updated = true;
        }
    });

    newStaff.forEach(name => {
        if (!staffList.includes(name)) {
            staffList.push(name);
            updated = true;
        }
    });

    if (updated) {
        renderRepresentativeList();
        renderStaffList();
    }
}

function renderRepresentativeList() {
    const dataList = document.getElementById('representative-list');
    if (!dataList) return;
    dataList.innerHTML = '';
    representativeList.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

function renderStaffList() {
    const dataList = document.getElementById('staff-list');
    if (!dataList) return;
    dataList.innerHTML = '';
    staffList.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

window.renderRepresentativeList = renderRepresentativeList;
window.renderStaffList = renderStaffList;

async function syncInspectorFromParent(mType, mId, siteId) {
    if (!mType || !mType.endsWith('_daily')) return;
    const parentType = mType.replace('_daily', '');
    const monthEl = document.getElementById('inspection-month');
    const month = monthEl ? monthEl.value : null;
    if (!month || !siteId || !mId) return;

    // Calculate date range
    const [y, m] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const nextMonthDate = new Date(y, m, 1);
    const nm = nextMonthDate.getMonth() + 1;
    const ny = nextMonthDate.getFullYear();
    const nextMonthStr = `${ny}-${String(nm).padStart(2, '0')}-01`;

    const { data: parent } = await supabaseClient
        .from('inspections')
        .select('statuses')
        .eq('site_id', siteId)
        .eq('machine_type', parentType)
        .eq('machine_id', mId)
        .gte('inspection_date', startDate)
        .lt('inspection_date', nextMonthStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (parent && parent.statuses) {
        const pMain = parent.statuses._inspector_main;
        const pSub = parent.statuses._inspector_sub;

        const mainEl = document.getElementById('inspector-main');
        const subEl = document.getElementById('inspector-sub');

        if (pMain && mainEl) mainEl.value = pMain;
        if (pSub && subEl) subEl.value = pSub;
    }
}

// Helper to lock fields
function lockMachineFields() {
    const fields = ['machine-name', 'model-type', 'company-machine-id', 'machine-id'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.readOnly = true;
            el.style.backgroundColor = '#f1f5f9';
            el.style.color = '#64748b';
            el.style.borderColor = '#e2e8f0';
        }
    });
}
