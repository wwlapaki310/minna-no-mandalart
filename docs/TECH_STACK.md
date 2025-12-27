# 技術構成検討ドキュメント

## 要件整理

### 機能要件

#### MVP(最小機能)
1. マンダラート作成
   - 9x9グリッドの入力フォーム
   - リアルタイムプレビュー
   - 作成者情報(ニックネーム等)

2. マンダラート投稿
   - 作成したマンダラートの保存
   - 公開/非公開設定

3. マンダラート閲覧
   - 投稿一覧表示
   - 個別マンダラート表示
   - 簡易検索・フィルタ

#### 今後の拡張候補
- ユーザー認証
- お気に入り機能
- コメント機能
- カテゴリ・タグ付け
- エクスポート機能(画像/PDF)

### 非機能要件

- **コスト**: 月額数百円程度での運用を目指す
- **パフォーマンス**: 快適な表示・操作感
- **スケーラビリティ**: 初期は小規模、必要に応じて拡張可能
- **メンテナンス性**: シンプルな構成で保守しやすく

## 技術構成案

### 案1: Vercel + Supabase(推奨)

#### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **ホスティング**: Vercel(無料枠)

#### バックエンド
- **データベース**: Supabase(PostgreSQL)
- **認証**: Supabase Auth(将来的に)
- **ストレージ**: Supabase Storage(画像保存時)

#### メリット
- Vercelの無料枠で十分運用可能
- Supabaseの無料枠も充実(500MB DB, 1GB Storage)
- TypeScriptで型安全
- Next.jsでSSR/SSG可能(SEO有利)
- Satoruさんの他プロジェクトとの親和性高い

#### コスト試算
- Vercel: 無料(Hobby プラン)
- Supabase: 無料(Free プラン)
- 合計: **0円/月** 🎉

---

### 案2: 完全静的サイト(超軽量)

#### フロントエンド
- **フレームワーク**: Vite + React
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **ホスティング**: GitHub Pages / Cloudflare Pages

#### バックエンド
- **データベース**: Supabase または Firebase
- **API**: Supabase REST API

#### メリット
- 最もシンプル
- デプロイが簡単
- ビルド不要な静的ホスティング

#### デメリット
- SSR/SSGができない(SEO若干不利)
- ルーティングが若干複雑

---

### 案3: Firebase 完全利用

#### フロントエンド
- **フレームワーク**: Vite + React
- **ホスティング**: Firebase Hosting

#### バックエンド
- **データベース**: Firestore
- **認証**: Firebase Auth
- **ストレージ**: Firebase Storage

#### メリット
- Googleエコシステムで統一
- リアルタイムDB
- 無料枠あり

#### デメリット
- Firestoreの料金体系が読みにくい
- PostgreSQLと比較してクエリが限定的

---

## データモデル案

### Mandalart テーブル

```sql
CREATE TABLE mandalarts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  author_name VARCHAR(100) NOT NULL,
  cells JSONB NOT NULL, -- 81マスのデータを格納
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);
```

### cells JSONBの構造例

```json
{
  "center": "メインゴール",
  "sub_themes": [
    "サブテーマ1",
    "サブテーマ2",
    ...
  ],
  "details": [
    [
      "具体的行動1-1",
      "具体的行動1-2",
      ...
    ],
    ...
  ]
}
```

## 推奨構成

**案1: Vercel + Supabase** を推奨します。

### 理由
1. 完全無料で運用可能
2. TypeScript + Next.jsで型安全な開発
3. Supabaseの管理画面でDBを直接確認可能
4. 将来の機能拡張に対応しやすい
5. Satoruさんの他プロジェクトとの技術スタック共通性

## 次のステップ

1. 技術スタックの最終決定
2. プロジェクト構造のセットアップ
3. Supabaseプロジェクト作成
4. 基本的なUI/コンポーネント設計
5. MVPの実装開始
