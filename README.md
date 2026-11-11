# 🕒 Chronos（クロノス）

**スマートなスケジュール ＆ デジタル付箋タスク・ノート管理プラットフォーム**

[![Firebase Hosting](https://img.shields.io/badge/Deploy-Firebase%20Hosting-FFCA28?logo=firebase&logoColor=black)](https://chronos-app-d149d.web.app)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🌟 アプリ概要

Chronos（クロノス）は、ビジネスパーソンや学生のための高機能なWeb生産性向上アプリケーションです。  
カレンダー、タイムテーブル（時間割）、デジタル付箋、そして思考をまとめるA4ルーズリーフ風ノートを一元管理できます。  
PC・タブレット・スマートフォンのマルチデバイス間で、Google Cloud（Firebase Firestore）を通じて安全に自動同期されます。

* **本番公開URL**: [https://chronos-app-d149d.web.app](https://chronos-app-d149d.web.app)

---

## ✨ 主な機能

### 1. 📊 ダッシュボード (Dashboard)
* **今日の予定・時間割**: 本日の業務・講義予定をリアルタイムに自動表示。
* **近日の予定リスト**: 直近のスケジュールをスムーズに俯瞰。
* **クイック付箋メモ**: サッと作れる直感メモ。ピン留め機能や、完了メモの「付箋ボード（保管庫）」への1タップ移動に対応。

### 2. 📅 カレンダー (Calendar)
* **月間スケジュール**: 予定と日付紐づき付箋をビジュアルに一覧表示。
* **日付管理モーダル**: 日付クリックで予定作成、付箋の貼り付け/解除、編集を完結。
* **外部カレンダー重畳表示**: GoogleカレンダーやiCal URLを連携し、ON/OFF切り替えで重ね合わせ表示が可能。
* **日本カレンダー対応**: 祝日名や六曜の表示、土日の色分けを標準サポート。

### 3. 📌 付箋ボード (Memos)
* **フォルダー整理**: カテゴリーごとのフォルダー作成＆ドラッグ操作で整理整頓。
* **カレンダー連携**: 付箋の「📅」アイコンから、カレンダーの特定日付へ直接貼り付け可能。
* **検索・アーカイブ**: 大量のメモから瞬時に目的の情報を検索。

### 4. ⏰ 業務・講義時間割 (Timetable)
* **週間タイムテーブル**: 曜日・時限ごとの定例会議や講義・日課枠を登録。
* **カレンダー自動連動**: 設定した時間割はカレンダーの各曜日に自動反映。

### 5. 📓 ノート機能 (Notebook)
* **A4ルーズリーフ風エディタ**: 美しい罫線と心地よい執筆体験を提供するドキュメント作成ツール。
* **日誌モード & フリーノート**: 日付ごとの日報・日誌記録と、テーマごとの複数冊・複数ページ管理に対応。
* **IME誤確定防止 & 自動保存**: 日本語入力の変換を邪魔しないComposition Guardとデバウンス自動保存を搭載。

### 6. 🔄 クラウド同期・セキュリティ (Sync & Security)
* **Firebase Firestore 同期**: Googleアカウント（UID）に紐づく安全な暗号化クラウド保管。
* **オフライン保護**: 通信断や未認証時もブラウザLocalStorageでデータを保護し、ログイン時に自動マージ。
* **セキュリティルール**: 本人のデータは本人だけがアクセスできる厳格なルールを設定。

### 7. 📤 データのエクスポート・Excel連携
* **CSVダウンロード**: Excelで直接開けるBOM付きUTF-8 CSV出力。
* **スプレッドシート用コピー**: ExcelやGoogleスプレッドシートへ `Ctrl + V` で綺麗に即展開。
* **日報・メール用コピー**: メールの報告文としてそのまま使える箇条書きテキスト出力。

---

## 🛠️ 技術スタック

* **フロントエンド**: React 19, TypeScript, Vite
* **スタイリング**: Vanilla CSS / CSS Modules / Lucide Icons
* **バックエンド・インフラ**: Firebase Hosting, Cloud Firestore, Firebase Authentication
* **PWA**: Service Worker, Web App Manifest（スマホホーム画面追加対応）

---

## 💻 開発・ビルド手順

### 必要環境
* Node.js v20 以上
* npm または pnpm

### インストールと起動
```bash
# 依存関係のインストール
npm install

# ローカル開発サーバーの起動 (http://localhost:5173)
npm run dev

# 本番用ビルド (TypeScriptチェック + Viteバンドル)
npm run build

# 本番ビルド成果物のローカルプレビュー
npm run preview
```

### デプロイ (Firebase Hosting)
```bash
# ビルド
npm run build

# Firebase Hostingへのデプロイ
npx firebase-tools deploy --only hosting
```

---

## 📁 ディレクトリ構成

```text
calendar-scheduler/
├── dist/                 # ビルド成果物
├── public/               # 静的アセット（PWAアイコン、manifest等）
├── src/
│   ├── assets/           # 画像・SVGアセット
│   ├── components/       # UIコンポーネント（Calendar, Notebook, Dashboard等）
│   ├── context/          # グローバル状態・Firestore同期ロジック (AppContext)
│   ├── types/            # TypeScript型定義
│   ├── utils/            # 祝日計算・iCalパーサー等のユーティリティ
│   ├── App.tsx           # メインコンポーネント
│   ├── firebase.ts       # Firebase初期化設定
│   └── main.tsx          # エントリーポイント
├── tools/                # Windows用起動・ショートカット・アイコン作成支援スクリプト
├── firebase.json         # Firebase Hosting & Firestore設定
├── firestore.rules       # Firestore セキュリティルール
└── vite.config.ts        # Vite設定
```

---

## 📄 ライセンス & 著作権

© yukiyanArt / Chronos Productivity Platform. All rights reserved.
