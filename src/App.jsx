import React, { useEffect, useMemo, useState } from "react";

// ==============================
// オーシャン・ブリーズ号 船内コンパニオン（日本語のみ）
// スケジュール / 施設案内 / 連絡・お知らせ
// - ダークモード、マイプラン、検索・絞り込み
// - 施設案内はユーザー提供のデッキプランに更新済み
// ==============================

// UIテキスト（日本語固定）
const t = {
  title: "オーシャン・ブリーズ号 船内ガイド",
  schedule: "スケジュール",
  facilities: "施設案内",
  messages: "連絡・お知らせ",
  filters: "フィルター",
  all: "すべて",
  deck: "デッキ",
  category: "カテゴリ",
  searchPlaceholder: "イベント名・会場を検索...",
  add: "追加",
  remove: "削除",
  details: "詳細",
  myPlan: "マイプラン",
  hours: "営業時間",
  location: "場所",
  contact: "連絡",
  newMessage: "メッセージ送信",
  subject: "件名",
  content: "内容",
  send: "送信",
  quickContacts: "クイック連絡",
  guidance: "ご案内",
  help: "ヘルプ",
  shipTime: "船内時間",
  clear: "クリア",
  notAdded: "まだ追加されていません。",
};

// ----------------------
// データ（デモ）
// ----------------------
const EVENT_CATEGORIES = [
  "ショー",
  "スポーツ",
  "キッズ",
  "グルメ",
  "ラウンジ",
  "セミナー",
  "メンテ",
  "その他",
];

function todayAt(hhmm, dayOffset = 0) {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h, m, 0);
  return d.toISOString();
}

function nowISO() {
  return new Date().toISOString();
}

function fmtTime(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

// ----------------------
// ★ スケジュール：あなたの提示内容に合わせて差し替え（day プロパティ付き）
// ----------------------
const sampleEvents = [
  // --- 1日目 (day: 1) ---
  { id: "d1_01", day: 1, title: "乗船受付＆ウェルカムドリンク", deck: 8, venue: "オーシャン・プロムナード", start: todayAt("15:00", 0), end: todayAt("17:00", 0), category: "ラウンジ", description: "乗船手続き後、スパークリングワインやジュースを提供。" },
  { id: "d1_02", day: 1, title: "出航セレモニー", deck: 12, venue: "スターライト・デッキ", start: todayAt("17:30", 0), end: todayAt("18:00", 0), category: "ショー", description: "船長挨拶とシャンパントースト。汽笛と共に出航。" },
  { id: "d1_03", day: 1, title: "避難訓練（全員参加）", deck: 8, venue: "各避難集合所", start: todayAt("18:15", 0), end: todayAt("18:45", 0), category: "セミナー", description: "安全案内と救命胴衣の着用訓練。" },
  { id: "d1_04", day: 1, title: "夕食（1回目）", deck: 9, venue: "メインダイニング『マリナーズ・テーブル』", start: todayAt("19:00", 0), end: todayAt("20:30", 0), category: "グルメ", description: "正装推奨のコースディナー。" },
  { id: "d1_05", day: 1, title: "マジックショー（前半）", deck: 10, venue: "セレナーデ・ラウンジ", start: todayAt("20:45", 0), end: todayAt("21:15", 0), category: "ショー", description: "コメディマジシャンによるステージ。" },
  { id: "d1_06", day: 1, title: "夕食（2回目）", deck: 9, venue: "メインダイニング『マリナーズ・テーブル』", start: todayAt("21:00", 0), end: todayAt("22:30", 0), category: "グルメ", description: "2交代制の後半組。" },
  { id: "d1_07", day: 1, title: "サンセット・ライブ", deck: 12, venue: "スカイライン・ステージ", start: todayAt("21:30", 0), end: todayAt("22:00", 0), category: "ショー", description: "アコースティックギター演奏。" },
  { id: "d1_08", day: 1, title: "マジックショー（後半）", deck: 10, venue: "セレナーデ・ラウンジ", start: todayAt("22:15", 0), end: todayAt("23:00", 0), category: "ショー", description: "前半と別内容。" },
  { id: "d1_09", day: 1, title: "カクテルナイト", deck: 10, venue: "ルミナス・クラブ", start: todayAt("22:30", 0), end: todayAt("23:59", 0), category: "ラウンジ", description: "生演奏＋カクテルフェア。" },
  { id: "d1_10", day: 1, title: "星座観察会", deck: 12, venue: "オーシャンビュー・デッキ", start: todayAt("23:00", 0), end: todayAt("23:45", 0), category: "セミナー", description: "航海士による星空ガイド。" },

  // --- 2日目 (day: 2) ---
  { id: "d2_01", day: 2, title: "朝ヨガ", deck: 12, venue: "スターライト・デッキ", start: todayAt("06:30", 1), end: todayAt("07:15", 1), category: "スポーツ", description: "海風を感じながらのストレッチ。" },
  { id: "d2_02", day: 2, title: "朝食", deck: 9, venue: "ビュッフェ『サンセット・ガーデン』", start: todayAt("07:00", 1), end: todayAt("09:00", 1), category: "グルメ", description: "和洋中の朝食ビュッフェ。" },
  { id: "d2_03", day: 2, title: "カクテル作り教室", deck: 10, venue: "セレナーデ・ラウンジ", start: todayAt("09:30", 1), end: todayAt("10:15", 1), category: "セミナー", description: "バーテンダーが直伝。試飲あり。" },
  { id: "d2_04", day: 2, title: "写真教室", deck: 10, venue: "オーシャンフォトスタジオ", start: todayAt("09:30", 1), end: todayAt("10:30", 1), category: "セミナー", description: "船内での写真撮影のコツ。" },
  { id: "d2_05", day: 2, title: "ダンスレッスン（サルサ）", deck: 10, venue: "ルミナス・クラブ", start: todayAt("10:45", 1), end: todayAt("11:30", 1), category: "スポーツ", description: "インストラクター指導の初心者向け。" },
  { id: "d2_06", day: 2, title: "トリビアクイズ大会", deck: 8, venue: "ブルーホール", start: todayAt("11:00", 1), end: todayAt("12:00", 1), category: "セミナー", description: "チーム対抗で賞品あり。" },
  { id: "d2_07", day: 2, title: "昼食（自由席）", deck: 9, venue: "各レストラン", start: todayAt("12:00", 1), end: todayAt("13:30", 1), category: "グルメ", description: "お好きな場所で昼食を。" },
  { id: "d2_08", day: 2, title: "ワインテイスティング", deck: 9, venue: "タパス＆ワイン『ソル・デ・エスパーニャ』", start: todayAt("13:30", 1), end: todayAt("14:15", 1), category: "グルメ", description: "ソムリエによる解説付き。" },
  { id: "d2_09", day: 2, title: "カジノ体験（非営利）", deck: 10, venue: "カラオケパラダイス前特設", start: todayAt("13:45", 1), end: todayAt("14:30", 1), category: "その他", description: "ポーカー・ブラックジャック入門。" },
  { id: "d2_10", day: 2, title: "ミニ演劇『海の伝説』", deck: 10, venue: "グランド・オーシャンシアター", start: todayAt("15:00", 1), end: todayAt("15:45", 1), category: "ショー", description: "船を舞台にした短編演劇。" },
  { id: "d2_11", day: 2, title: "チョコレート・ワークショップ", deck: 9, venue: "ブリーズカフェ", start: todayAt("15:00", 1), end: todayAt("16:00", 1), category: "グルメ", description: "パティシエと一緒に作る。" },
  { id: "d2_12", day: 2, title: "大抽選会", deck: 10, venue: "セレナーデ・ラウンジ", start: todayAt("16:15", 1), end: todayAt("17:00", 1), category: "その他", description: "船内クーポンやグッズが当たる。" },
  { id: "d2_13", day: 2, title: "カクテルタイム・ピアノ演奏", deck: 8, venue: "シーサイド・ラウンジ", start: todayAt("17:15", 1), end: todayAt("17:45", 1), category: "ラウンジ", description: "ピアノの生演奏とカナッペ。" },
  { id: "d2_14", day: 2, title: "夕食（1回目）", deck: 9, venue: "メインダイニング『マリナーズ・テーブル』", start: todayAt("18:00", 1), end: todayAt("19:30", 1), category: "グルメ", description: "この日はカジュアルテーマ。" },
  { id: "d2_15", day: 2, title: "メインショー『ブロードウェイナイト』前半", deck: 10, venue: "グランド・オーシャンシアター", start: todayAt("19:45", 1), end: todayAt("20:15", 1), category: "ショー", description: "迫力の歌とダンス。" },
  { id: "d2_16", day: 2, title: "夕食（2回目）", deck: 9, venue: "メインダイニング『マリナーズ・テーブル』", start: todayAt("20:00", 1), end: todayAt("21:30", 1), category: "グルメ", description: "後半組。" },
  { id: "d2_17", day: 2, title: "サンセット・ギターライブ", deck: 12, venue: "スカイライン・ステージ", start: todayAt("20:30", 1), end: todayAt("21:00", 1), category: "ショー", description: "波音と共に。" },
  { id: "d2_18", day: 2, title: "メインショー後半", deck: 10, venue: "グランド・オーシャンシアター", start: todayAt("21:30", 1), end: todayAt("22:00", 1), category: "ショー", description: "フィナーレ。" },
  { id: "d2_19", day: 2, title: "ホワイトパーティー", deck: 10, venue: "ルミナス・クラブ", start: todayAt("22:15", 1), end: todayAt("23:59", 1), category: "ラウンジ", description: "白をテーマにした船内最大のパーティー。" },
  { id: "d2_20", day: 2, title: "ナイトプール＆DJ", deck: 11, venue: "アクア・テラス", start: todayAt("23:00", 1), end: todayAt("23:45", 1), category: "ラウンジ", description: "水中ライトアップ付き。" },

  // --- 3日目 (day: 3) ---
  { id: "d3_01", day: 3, title: "朝ラン", deck: 12, venue: "シーブリーズ・トラック", start: todayAt("06:30", 2), end: todayAt("07:15", 2), category: "スポーツ", description: "最後の朝日を見ながら。" },
  { id: "d3_02", day: 3, title: "朝食", deck: 9, venue: "ビュッフェ『サンセット・ガーデン』", start: todayAt("07:00", 2), end: todayAt("08:30", 2), category: "グルメ", description: "簡単な軽食も用意。" },
  { id: "d3_03", day: 3, title: "フォトスライドショー", deck: 8, venue: "ブルーホール", start: todayAt("08:45", 2), end: todayAt("09:15", 2), category: "ショー", description: "船内カメラマンが撮った旅の記録。" },
  { id: "d3_04", day: 3, title: "お別れコーヒータイム", deck: 8, venue: "シーサイド・ラウンジ", start: todayAt("09:30", 2), end: todayAt("10:00", 2), category: "ラウンジ", description: "クルーと最後の交流を。" },
  { id: "d3_05", day: 3, title: "下船案内開始", deck: 8, venue: "オーシャン・プロムナード", start: todayAt("10:15", 2), end: todayAt("12:00", 2), category: "その他", description: "案内順に下船。" },
];

// 施設案内（ユーザー提供のデッキプラン）
const sampleFacilities = [
  // --- デッキ12 ---
  { id: "d12_1", name: "スターライト・デッキ", deck: 12, category: "展望", hours: "—", location: "船首側・屋外", description: "朝日や満天の星空が楽しめる静かな展望エリア。", amenities: ["屋外"] },
  { id: "d12_2", name: "オーシャンビュー・デッキ", deck: 12, category: "展望", hours: "—", location: "船尾側・屋外", description: "夕日鑑賞や航跡を眺めながらのんびり過ごせます。", amenities: ["屋外"] },
  { id: "d12_3", name: "シーブリーズ・トラック", deck: 12, category: "スポーツ", hours: "06:00–22:00", location: "屋外", description: "1周400mのジョギング＆ウォーキングコース。", amenities: ["ランニング"] },
  { id: "d12_4", name: "スカイライン・ステージ", deck: 12, category: "イベント/ステージ", hours: "イベント時のみ", location: "屋外", description: "屋外イベント専用の小ステージ。", amenities: ["ライブ"] },
  { id: "d12_5", name: "スモーキングテラス", deck: 12, category: "喫煙", hours: "06:00–24:00", location: "屋外（防風パネル）", description: "喫煙専用エリア。", amenities: ["分煙"] },
  { id: "d12_6", name: "ライフセーフ・ゾーン", deck: 12, category: "安全", hours: "—", location: "立入制限エリア", description: "救命設備・訓練エリア（通常時は立入制限あり）。" },

  // --- デッキ11 ---
  { id: "d11_1", name: "アクア・テラス（メインプール）", deck: 11, category: "プール/スパ", hours: "09:00–21:00", location: "中央", description: "ファミリー向け大型プール。監視員常駐。" },
  { id: "d11_2", name: "インフィニティ・ブルー（インフィニティプール）", deck: 11, category: "プール/スパ", hours: "09:00–21:00", location: "海側", description: "海に面した小型プール。" },
  { id: "d11_3", name: "サーフリング・プールバー", deck: 11, category: "バー/ラウンジ", hours: "10:00–22:00", location: "プールサイド", description: "水着のまま利用できるテイクアウト式バー。" },
  { id: "d11_4", name: "サロン・オーシャンブリーズ", deck: 11, category: "スパ/サロン", hours: "09:00–22:00", location: "中央", description: "フルサービスのスパ・マッサージ施設。美容室併設。" },
  { id: "d11_5", name: "海雲サウナ", deck: 11, category: "サウナ", hours: "09:00–22:00", location: "海側", description: "海を眺めながら汗を流せるガラス張りサウナ。" },
  { id: "d11_6", name: "大浴場『潮の湯』", deck: 11, category: "大浴場", hours: "06:00–23:00", location: "海側", description: "露天風呂風の展望浴場（男女別）。" },

  // --- デッキ10 ---
  { id: "d10_1", name: "グランド・オーシャンシアター", deck: 10, category: "シアター", hours: "イベント時のみ", location: "中央", description: "650席規模のメイン劇場。大型ショーを上演。" },
  { id: "d10_2", name: "セレナーデ・ラウンジ", deck: 10, category: "ラウンジ", hours: "10:00–24:00", location: "中央", description: "多目的ショーラウンジ。昼夜で演目が変わります。" },
  { id: "d10_3", name: "ルミナス・クラブ", deck: 10, category: "ナイトクラブ", hours: "20:00–翌2:00", location: "中央", description: "生演奏やダンスが楽しめるナイトクラブ。" },
  { id: "d10_4", name: "カラオケパラダイス", deck: 10, category: "カラオケ", hours: "12:00–24:00", location: "中央", description: "個室＋オープンステージ併設。" },
  { id: "d10_5", name: "マリナ・ブティック", deck: 10, category: "ショップ", hours: "10:00–22:00", location: "プロムナード沿い", description: "船内限定お土産や衣類のショップ街。" },
  { id: "d10_6", name: "オーシャンフォトスタジオ", deck: 10, category: "フォト", hours: "18:00–22:30", location: "中央", description: "船内カメラマンによる記念写真の販売。" },
  { id: "d10_7", name: "アーケード『ネプチューンズ・プレイランド』", deck: 10, category: "アーケード", hours: "10:00–24:00", location: "中央", description: "最新アーケード〜レトロまで揃うゲームセンター。" },

  // --- デッキ9 ---
  { id: "d9_1", name: "ビュッフェ『サンセット・ガーデン』", deck: 9, category: "レストラン", hours: "06:30–21:30", location: "中央", description: "ライブキッチンが名物のセルフ式レストラン。" },
  { id: "d9_2", name: "メインダイニング『マリナーズ・テーブル』", deck: 9, category: "レストラン", hours: "朝 07:00–09:30 / 夕 17:30–21:00", location: "中央", description: "フォーマルなコース料理（2交代制）。" },
  { id: "d9_3", name: "地中海レストラン『ラ・ベッラ・ルーナ』", deck: 9, category: "レストラン", hours: "11:30–14:30 / 17:30–22:00", location: "中央", description: "地中海ダイニング。ワインペアリングが好評。" },
  { id: "d9_4", name: "ステーキハウス『アンカーズ・グリル』", deck: 9, category: "レストラン", hours: "17:30–22:00", location: "中央", description: "炭火で焼き上げるアメリカンスタイル。" },
  { id: "d9_5", name: "アジアンビストロ『ロータス＆タイガー』", deck: 9, category: "レストラン", hours: "11:30–14:30 / 17:30–22:00", location: "中央", description: "タイ・ベトナム・マレーシアのスパイス香る料理。" },
  { id: "d9_6", name: "シーフードバー『ポセイドン』", deck: 9, category: "バー/シーフード", hours: "11:00–22:30", location: "中央", description: "オイスターやロブスターなど海鮮尽くし。" },
  { id: "d9_7", name: "タパス＆ワイン『ソル・デ・エスパーニャ』", deck: 9, category: "バー/レストラン", hours: "17:00–24:00", location: "中央", description: "スペイン風小皿料理とワイン。" },
  { id: "d9_8", name: "カフェ＆ベーカリー『ブリーズカフェ』(24時間)", deck: 9, category: "カフェ", hours: "24時間", location: "中央", description: "焼きたてパンや軽食を終日提供。夜食メニューも。" },

  // --- デッキ8 ---
  { id: "d8_1", name: "オーシャン・プロムナード", deck: 8, category: "プロムナード", hours: "—", location: "外周回廊", description: "屋内回廊で外周を1周できる散歩コース。" },
  { id: "d8_2", name: "マリン・ライブラリ", deck: 8, category: "図書室", hours: "09:00–21:00", location: "静域", description: "海や航海に関する蔵書を揃えた図書室。" },
  { id: "d8_3", name: "シーサイド・ラウンジ", deck: 8, category: "ラウンジ", hours: "10:00–22:00", location: "海側", description: "アフタヌーンティーや軽食に最適。" },
  { id: "d8_4", name: "トラベル・コンシェルジュ", deck: 8, category: "サービス", hours: "10:00–18:00", location: "中央", description: "観光案内カウンター（今回は寄港なし）。" },
  { id: "d8_5", name: "ゲストサービスデスク", deck: 8, category: "サービス", hours: "24時間", location: "中央", description: "フロント業務・各種手配受付。", amenities: ["両替", "落とし物"] },
  { id: "d8_6", name: "カードルーム『ハート・オブ・ザ・シー』", deck: 8, category: "カードルーム", hours: "10:00–22:00", location: "静域", description: "トランプやボードゲーム専用ルーム。" },
  { id: "d8_7", name: "ブルーホール（小ホール）", deck: 8, category: "ホール", hours: "イベント時のみ", location: "中央", description: "講座やミニイベント用の小会場。" },
  { id: "d8_8", name: "メディカルセンター", deck: 8, category: "医療", hours: "08:00–11:00 / 16:00–18:00 (緊急時24h)", location: "船尾側", description: "医務室・隔離室を備えた診療エリア。", amenities: ["AED", "車椅子対応"], phone: "3000" },

  // --- デッキ7 ---
  { id: "d7_1", name: "ロイヤル・スイートルーム群", deck: 7, category: "客室", hours: "—", location: "船首・中央・船尾", description: "広々とした最上級客室。専用ラウンジ/ダイニング利用可。" },
  { id: "d7_2", name: "スイート専用ラウンジ『シーホライズン』", deck: 7, category: "ラウンジ", hours: "07:00–22:00", location: "中央", description: "限定メニューとドリンクを提供。" },
  { id: "d7_3", name: "チャペル『セレナの鐘』", deck: 7, category: "チャペル", hours: "予約制", location: "中央", description: "船上結婚式や記念撮影用の礼拝堂。" },

  // --- デッキ6〜4（代表） ---
  { id: "d6_1", name: "一般客室（バルコニー/海側/内側）", deck: 6, category: "客室", hours: "—", location: "全域", description: "ファミリー向け連結客室あり。" },
  { id: "d5_1", name: "小ラウンジ『カームウェーブ』", deck: 5, category: "ラウンジ", hours: "07:00–23:00", location: "中央", description: "静かに寛げる小ラウンジ。" },
  { id: "d5_2", name: "セルフ式ランドリー", deck: 5, category: "ランドリー", hours: "07:00–23:00", location: "各所", description: "洗濯機/乾燥機（有料）。" },
  { id: "d5_3", name: "バリアフリー対応客室", deck: 5, category: "客室", hours: "—", location: "各所", description: "車椅子対応の設備を備えています。" },
  { id: "d5_4", name: "軽食ステーション", deck: 5, category: "軽食", hours: "07:00–24:00", location: "各所", description: "コーヒーやスナックを提供。" },
  { id: "d5_5", name: "小型ジム『シーサイド・ジム』", deck: 5, category: "スポーツ", hours: "06:00–22:00", location: "中央", description: "コンパクトなトレーニングエリア。" },
  { id: "d4_1", name: "一般客室（バルコニー/海側/内側）", deck: 4, category: "客室", hours: "—", location: "全域", description: "ファミリー向け連結客室あり。" },

  // --- デッキ3（バックオブハウス＆医務） ---
  { id: "d3_1", name: "メインギャレー", deck: 3, category: "バックヤード", hours: "—", location: "関係者専用", description: "全レストランの料理を支える大規模厨房。立入禁止。" },
  { id: "d3_2", name: "乗務員食堂『クルーメス』", deck: 3, category: "クルー", hours: "—", location: "関係者専用", description: "クルー用ダイニング。立入禁止。" },
  { id: "d3_3", name: "ランドリールーム（大容量）", deck: 3, category: "バックヤード", hours: "—", location: "関係者専用", description: "大容量ランドリー。立入禁止。" },
  { id: "d3_4", name: "ゴミ処理室", deck: 3, category: "バックヤード", hours: "—", location: "関係者専用", description: "廃棄物の保管/処理エリア。立入禁止。" },
  { id: "d3_5", name: "医務室本部（重症対応・感染隔離室）", deck: 3, category: "医療", hours: "—", location: "関係者専用", description: "重症対応の医務本部。緊急時のみ対応。" },
  { id: "d3_6", name: "保安室・拘束室", deck: 3, category: "セキュリティ", hours: "—", location: "関係者専用", description: "船内保安の中枢。立入禁止。" },

  // --- デッキ2（乗員区画＆機械補助） ---
  { id: "d2_1", name: "乗組員寝室・福利施設", deck: 2, category: "クルー", hours: "—", location: "関係者専用", description: "クルー専用区画。立入禁止。" },
  { id: "d2_2", name: "託児室・娯楽室", deck: 2, category: "クルー", hours: "—", location: "関係者専用", description: "クルー向け設備。立入禁止。" },
  { id: "d2_3", name: "ワークショップ（電気・配管整備）", deck: 2, category: "バックヤード", hours: "—", location: "関係者専用", description: "整備工房。立入禁止。" },
  { id: "d2_4", name: "空調・油圧室", deck: 2, category: "バックヤード", hours: "—", location: "関係者専用", description: "設備室。立入禁止。" },

  // --- デッキ1（機関室＆貨物） ---
  { id: "d1_1", name: "機関室・発電室", deck: 1, category: "バックヤード", hours: "—", location: "関係者専用", description: "船の心臓部。立入禁止。" },
  { id: "d1_2", name: "燃料タンク", deck: 1, category: "バックヤード", hours: "—", location: "関係者専用", description: "燃料保管。立入禁止。" },
  { id: "d1_3", name: "長期保管用食料庫", deck: 1, category: "バックヤード", hours: "—", location: "関係者専用", description: "ストアエリア。立入禁止。" },
  { id: "d1_4", name: "貨物室", deck: 1, category: "バックヤード", hours: "—", location: "関係者専用", description: "荷物/物資の保管。立入禁止。" },
];

const sampleAnnouncements = [
  {
    id: "a1",
    ts: nowISO(),
    title: "【案内】救命訓練の実施",
    body: "本日16:00より全乗客参加の救命訓練を行います。船内放送の指示に従い、集合場所へお集まりください。",
    level: "info",
  },
  {
    id: "a2",
    ts: todayAt("09:00", 0),
    title: "【注意】デッキ12 一部通行止め",
    body: "09:30–11:00に救命設備点検のため、デッキ12後方の通行を制限します。",
    level: "urgent",
  },
];

// ----------------------
// LocalStorage Keys
// ----------------------
const LS_PLAN = "onboard_plan_v1";
const LS_DARK = "onboard_dark_v1";

// ----------------------
// ルートコンポーネント
// ----------------------
export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(LS_DARK) === "1");

  const [tab, setTab] = useState("schedule");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("すべて");
  const [deck, setDeck] = useState("all");
  const [plan, setPlan] = useState(() => JSON.parse(localStorage.getItem(LS_PLAN) || "[]"));
  const [nowStr, setNowStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  const [openFacility, setOpenFacility] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowStr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => localStorage.setItem(LS_DARK, dark ? "1" : "0"), [dark]);
  useEffect(() => localStorage.setItem(LS_PLAN, JSON.stringify(plan)), [plan]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const deckOptions = Array.from(new Set(sampleFacilities.map(f => f.deck).concat(sampleEvents.map(e => e.deck)))).sort((a, b) => a - b);

  const eventsFiltered = useMemo(() => {
    return sampleEvents
      .filter(e => (cat === "すべて" ? true : e.category === cat))
      .filter(e => (deck === "all" ? true : e.deck === Number(deck)))
      .filter(e => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          e.title.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          String(e.deck).includes(q) ||
          (e.category || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [query, cat, deck]);

  const plannedEvents = sampleEvents.filter(e => plan.includes(e.id)).sort((a, b) => new Date(a.start) - new Date(b.start));

  // 重複検出
  const conflictIds = useMemo(() => {
    const ids = new Set();
    for (let i = 0; i < plannedEvents.length; i++) {
      for (let j = i + 1; j < plannedEvents.length; j++) {
        if (overlaps(plannedEvents[i].start, plannedEvents[i].end, plannedEvents[j].start, plannedEvents[j].end)) {
          ids.add(plannedEvents[i].id);
          ids.add(plannedEvents[j].id);
        }
      }
    }
    return ids;
  }, [plannedEvents]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🛳️</span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex-1">{t.title}</h1>

          <span className="text-xs sm:text-sm px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
            ⏱ {t.shipTime}: {nowStr}
          </span>

          <label className="ml-3 text-sm flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
            <span>🌙</span>
          </label>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Urgent Alerts */}
        {sampleAnnouncements.filter(a => a.level === "urgent").map(a => (
          <div key={a.id} className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200">
            <strong>🔔 {a.title}</strong>
            <div className="text-sm mt-1">{a.body}</div>
          </div>
        ))}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <TabButton active={tab === "schedule"} onClick={() => setTab("schedule")}>📅 {t.schedule}</TabButton>
          <TabButton active={tab === "facilities"} onClick={() => setTab("facilities")}>📍 {t.facilities}</TabButton>
          <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>📣 {t.messages}</TabButton>
        </div>

        {tab === "schedule" && (
          <section className="mt-6">
            {/* Filters */}
            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
              <div className="font-semibold mb-2">⚙️ {t.filters}</div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <input
                    className="w-full border rounded-md px-3 py-2 bg-white dark:bg-slate-900"
                    placeholder={t.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t.category}</label>
                  <select className="w-full border rounded-md px-2 py-2 bg-white dark:bg-slate-900" value={cat} onChange={(e) => setCat(e.target.value)}>
                    <option value="すべて">{t.all}</option>
                    {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t.deck}</label>
                  <select className="w-full border rounded-md px-2 py-2 bg-white dark:bg-slate-900" value={deck} onChange={(e) => setDeck(e.target.value)}>
                    <option value="all">{t.all}</option>
                    {deckOptions.map(d => <option key={d} value={String(d)}>Deck {d}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-right mt-2">
                <button className="text-sm underline" onClick={() => { setQuery(""); setCat("すべて"); setDeck("all"); }}>{t.clear}</button>
              </div>
            </div>

            {/* Event List + Plan */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                {eventsFiltered.map(e => (
                  <div key={e.id} className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-2 text-sm mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">⏰ {fmtTime(e.start)}–{fmtTime(e.end)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">🏷️ {e.category}</span>
                    </div>
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">📍 Deck {e.deck} ・ {e.venue}</div>
                    {e.description && <div className="text-sm mt-2">{e.description}</div>}
                    <div className="mt-3 flex items-center gap-2">
                      {!plan.includes(e.id) ? (
                        <button className="px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" onClick={() => setPlan(p => [...p, e.id])}>⭐ {t.add}</button>
                      ) : (
                        <button className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800" onClick={() => setPlan(p => p.filter(id => id !== e.id))}>★ {t.remove}</button>
                      )}
                      <details className="ml-1">
                        <summary className="cursor-pointer select-none">ℹ️ {t.details}</summary>
                        <div className="text-sm mt-2">{e.description || ""}</div>
                      </details>
                    </div>
                    {plan.includes(e.id) && conflictIds.has(e.id) && (
                      <div className="mt-3 text-sm px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">⚠️ 他の予定と時間が重複しています。</div>
                    )}
                  </div>
                ))}
              </div>

              {/* My Plan */}
              <div className="md:col-span-1">
                <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-semibold mb-1">⭐ {t.myPlan}</div>
                  <div className="text-xs text-slate-500 mb-3">お気に入りに追加したイベント</div>
                  <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                    {plannedEvents.length === 0 && (
                      <div className="text-sm text-slate-500">{t.notAdded}</div>
                    )}
                    {plannedEvents.map(e => (
                      <div key={e.id} className="p-3 rounded-lg border bg-white dark:bg-slate-900">
                        <div className="text-sm font-medium">{e.title}</div>
                        <div className="text-xs text-slate-500">{fmtTime(e.start)}–{fmtTime(e.end)} ・ Deck {e.deck}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{e.category}</span>
                          <button className="text-xs underline" onClick={() => setPlan(p => p.filter(id => id !== e.id))}>{t.remove}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "facilities" && (
          <section className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {/* Facility Filters */}
              <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="font-semibold mb-2">📍 {t.facilities}</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input className="border rounded-md px-3 py-2 bg-white dark:bg-slate-900" placeholder="例: スパ / ラウンジ" value={query} onChange={e => setQuery(e.target.value)} />
                  <select className="border rounded-md px-2 py-2 bg-white dark:bg-slate-900" onChange={e => setQuery(e.target.value)}>
                    <option value="">{t.all}</option>
                    {[...new Set(sampleFacilities.map(f => f.category))].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="border rounded-md px-2 py-2 bg-white dark:bg-slate-900" onChange={e => setQuery(`Deck ${e.target.value}`)}>
                    <option value="">{t.all}</option>
                    {deckOptions.map(d => <option key={d} value={String(d)}>Deck {d}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                {sampleFacilities
                  .filter(f => {
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      f.name.toLowerCase().includes(q) ||
                      (f.description || "").toLowerCase().includes(q) ||
                      (f.location || "").toLowerCase().includes(q) ||
                      f.category.toLowerCase().includes(q) ||
                      `deck ${f.deck}`.includes(q)
                    );
                  })
                  .map(f => (
                    <button key={f.id} onClick={() => setOpenFacility(f)} className="text-left border rounded-xl p-4 bg-white dark:bg-slate-900 hover:shadow">
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-xs text-slate-500 mb-1">Deck {f.deck} ・ {f.location || "—"}</div>
                      <div className="text-sm line-clamp-2">{f.description}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(f.amenities || []).map((a, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{a}</span>
                        ))}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Quick contacts */}
            <div className="md:col-span-1">
              <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="font-semibold mb-1">📞 {t.quickContacts}</div>
                <div className="text-xs text-slate-500 mb-3">内線・担当部署</div>
                {[{ name: "ゲストサービス", phone: "5000" }, { name: "客室係", phone: "5001" }, { name: "メディカルセンター", phone: "3000" }, { name: "セキュリティ", phone: "7000" }].map(c => (
                  <div key={c.phone} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-900 mb-2">
                    <div className="text-sm font-medium">{c.name}</div>
                    <a className="text-sm underline" href={`tel:${c.phone}`}>{c.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "messages" && (
          <section className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                <div className="font-semibold mb-1">📣 お知らせ</div>
                <div className="text-xs text-slate-500 mb-3">最新の案内や注意事項を表示します</div>
                <div className="space-y-3">
                  {sampleAnnouncements.map(a => (
                    <div key={a.id} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <strong>{a.title}</strong>
                        {a.level === "urgent" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">URGENT</span>}
                      </div>
                      <div className="text-sm mt-1 whitespace-pre-wrap">{a.body}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(a.ts).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <MessageForm t={t} />
            </div>

            <div className="md:col-span-1">
              <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="font-semibold mb-1">ℹ️ {t.guidance}</div>
                <ul className="text-sm list-disc ml-5 space-y-2">
                  <li>キッズ向けイベントは混雑時に入場制限があります。</li>
                  <li>一部レストランはドレスコードがあります。開始10分前のご来場をおすすめします。</li>
                  <li>指定場所以外は全館禁煙です。喫煙はスモーキングテラスをご利用ください。</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-12 pt-6 text-xs text-slate-500 flex items-center justify-between">
        <div>© {new Date().getFullYear()} Cruise Companion</div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full border">PWA</span>
          <span className="px-2 py-0.5 rounded-full border">Offline</span>
        </div>
      </footer>

      {/* Facility Modal */}
      {openFacility && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpenFacility(null)}>
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-lg">{openFacility.name}</div>
            <div className="mt-1 text-sm">{openFacility.description}</div>
            <div className="mt-2 text-sm">⏰ {t.hours}: {openFacility.hours || "—"}</div>
            <div className="mt-1 text-sm">📍 {t.location}: Deck {openFacility.deck} ・ {openFacility.location || "—"}</div>
            {openFacility.phone && <div className="mt-1 text-sm">☎️ 内線: <a className="underline" href={`tel:${openFacility.phone}`}>{openFacility.phone}</a></div>}
            <div className="text-right mt-4">
              <button className="px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" onClick={() => setOpenFacility(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border ${active ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-white dark:bg-slate-900"}`}
    >
      {children}
    </button>
  );
}

function MessageForm({ t }) {
  const [subject, setSubject] = useState("");
  const [to, setTo] = useState("ゲストサービス");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    // 実運用ではAPIへPOST。ここでは送信済フラグのみ
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setSubject("");
    setBody("");
  }

  return (
    <form onSubmit={onSubmit} className="border rounded-xl p-4 bg-white dark:bg-slate-900">
      <div className="font-semibold mb-1">💬 {t.newMessage}</div>
      <div className="text-xs text-slate-500 mb-3">船内スタッフへテキストで連絡（デモ）</div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm block mb-1">{t.subject}</label>
          <input className="w-full border rounded-md px-3 py-2 bg-white dark:bg-slate-900" value={subject} onChange={e => setSubject(e.target.value)} placeholder="例: 枕の追加をお願いします" />
        </div>
        <div>
          <label className="text-sm block mb-1">宛先</label>
          <select className="w-full border rounded-md px-2 py-2 bg-white dark:bg-slate-900" value={to} onChange={e => setTo(e.target.value)}>
            <option>ゲストサービス</option>
            <option>客室係</option>
            <option>メディカルセンター</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="text-sm block mb-1">{t.content}</label>
        <textarea className="w-full border rounded-md px-3 py-2 bg-white dark:bg-slate-900" rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="ご用件をご記入ください（このデモでは保存のみ）" />
      </div>

      <div className="flex justify-end mt-3">
        <button type="submit" className="px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">📨 {t.send}</button>
      </div>

      {sent && (
        <div className="mt-3 text-sm px-3 py-2 rounded-md bg-green-50 text-green-800">
          ✅ 送信（デモ保存）しました。
        </div>
      )}
    </form>
  );
}
