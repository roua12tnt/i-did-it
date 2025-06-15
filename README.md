# I did it! - 習慣化サポートアプリ

「I did it!」は、毎日の目標を達成して習慣化をサポートするシンプルなWebアプリケーションです。

## 🌟 主な機能

- **Do管理**: 最大3つまでの習慣化したい目標（Do）を登録・管理
- **カレンダー表示**: 月間カレンダーで達成状況を視覚的に確認
- **達成記録**: 日付を選択してDoの達成を簡単に記録
- **お祝い機能**: Doを達成すると励ましメッセージで祝福
- **テーマ切り替え**: ライトモード・ダークモードに対応
- **レスポンシブデザイン**: デスクトップ・モバイル両対応

## 🛠️ 技術スタック

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📋 事前準備

1. **Node.js** (v18以上) をインストール
2. **Supabase** アカウントを作成: https://supabase.com
3. Supabaseで新しいプロジェクトを作成

## 🚀 セットアップ

### 1. プロジェクトのクローン・移動

```bash
cd i-did-it
npm install
```

### 2. Supabaseの設定

#### 2.1 環境変数の設定

`.env.local` ファイルを編集し、SupabaseのURLとAPI Keyを設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2.2 データベーススキーマの作成

Supabaseのダッシュボードで「SQL Editor」を開き、`database/schema.sql` の内容を実行してください。

これにより以下のテーブルが作成されます：
- `profiles` - ユーザープロフィール
- `dos` - ユーザーの目標
- `achievements` - 達成記録
- `praise_messages` - お祝いメッセージ

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてアプリにアクセスしてください。

## 📖 使い方

### 1. アカウント作成・ログイン
- メールアドレスとパスワードでアカウントを作成
- 既存アカウントでログイン

### 2. Doの登録
- 「Do管理」タブで習慣化したい目標を最大3つまで登録
- タイトルと説明（オプション）を入力

### 3. 達成記録
- 「カレンダー」タブで日付を選択
- 達成したDoにチェックを入れる
- 達成すると「I did it!」のお祝い画面が表示

### 4. 設定
- 「設定」タブでプロフィール編集
- ライト・ダークモードの切り替え
- ログアウト

## 🎨 カラーテーマ

### ライトモード
- 背景色: `#F0F0F0`
- プライマリテキスト: `#333333`
- アクセント色: `#FF6600`
- セカンダリテキスト: `#666666`

### ダークモード
- 背景色: `#1A1A1A`
- プライマリテキスト: `#F0F0F0`
- アクセント色: `#FF6600`
- セカンダリテキスト: `#999999`

## 📁 プロジェクト構造

```
src/
├── app/
│   ├── globals.css          # グローバルスタイル
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # メインページ
├── components/
│   ├── Auth.tsx             # 認証コンポーネント
│   ├── Calendar.tsx         # カレンダーコンポーネント
│   ├── CelebrationModal.tsx # お祝いモーダル
│   ├── DoManager.tsx        # Do管理コンポーネント
│   └── Settings.tsx         # 設定コンポーネント
├── contexts/
│   └── ThemeContext.tsx     # テーマコンテキスト
├── hooks/
│   └── useAuth.ts           # 認証フック
└── lib/
    └── supabase.ts          # Supabaseクライアント
```

## 🚀 デプロイ

### Vercel でのデプロイ

1. GitHubリポジトリにプッシュ
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

## 🤝 開発への貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/new-feature`)
3. 変更をコミット (`git commit -am 'Add new feature'`)
4. ブランチにプッシュ (`git push origin feature/new-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Supabase](https://supabase.com/) - バックエンドサービス
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [Lucide React](https://lucide.dev/) - アイコンライブラリ
