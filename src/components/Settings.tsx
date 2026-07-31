import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, AlertTriangle, Download, Upload, Trash2, Palette, FileSpreadsheet, FileText } from 'lucide-react';

// プリセット背景色（ダーク系）
const BG_PRESETS_DARK = [
    { label: 'デフォルト', value: '', preview: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)' },
    { label: 'ディープオーシャン', value: 'linear-gradient(135deg, #0c1445 0%, #0a2a4a 50%, #0d3b6e 100%)', preview: 'linear-gradient(135deg, #0c1445 0%, #0a2a4a 50%, #0d3b6e 100%)' },
    { label: 'フォレスト', value: 'linear-gradient(135deg, #0a1f0e 0%, #0d2b1a 50%, #1a3a2a 100%)', preview: 'linear-gradient(135deg, #0a1f0e 0%, #0d2b1a 50%, #1a3a2a 100%)' },
    { label: 'ミッドナイト', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
    { label: 'サンセット', value: 'linear-gradient(135deg, #2d1b33 0%, #3d2240 50%, #4a1942 100%)', preview: 'linear-gradient(135deg, #2d1b33 0%, #3d2240 50%, #4a1942 100%)' },
    { label: 'ガンメタル', value: 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 50%, #3a3a3c 100%)', preview: 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 50%, #3a3a3c 100%)' },
];

// プリセット背景色（ライト系）
const BG_PRESETS_LIGHT = [
    { label: 'デフォルト', value: '__light__', preview: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)' },
    { label: 'ミントフレッシュ', value: 'linear-gradient(135deg, #d4f5e9 0%, #c8e6c9 100%)', preview: 'linear-gradient(135deg, #d4f5e9 0%, #c8e6c9 100%)' },
    { label: 'サンシャイン', value: 'linear-gradient(135deg, #fff9c4 0%, #ffe082 100%)', preview: 'linear-gradient(135deg, #fff9c4 0%, #ffe082 100%)' },
    { label: 'ローズクォーツ', value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', preview: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)' },
    { label: 'ラベンダー', value: 'linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%)', preview: 'linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%)' },
    { label: 'ピュアホワイト', value: '#f8f9fa', preview: '#f8f9fa' },
];

interface SettingsProps {
    onExportClick?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onExportClick }) => {
    const { data, importFromJSON, resetAllData, bgColor, setBgColor, theme, toggleTheme, currentUser, loginWithGoogle, logout, forceUploadToCloud, forceFetchFromCloud, cloudSyncInfo } = useApp();

    const handleDirectUpload = async () => {
        try {
            await forceUploadToCloud();
            alert(`📤 クラウドへ保存完了！ (予定 ${(data.events || []).length} 件 / 付箋 ${(data.stickies || []).length} 件)`);
        } catch (e: any) {
            alert(`送信エラー: ${e?.message || '失敗しました'}`);
        }
    };

    const handleDirectFetch = async () => {
        try {
            await forceFetchFromCloud();
            alert('📥 クラウドから最新データを受領・読み込みました！');
        } catch (e: any) {
            alert(`受信エラー: ${e?.message || '失敗しました'}`);
        }
    };

    const [customColor1, setCustomColor1] = useState('#1e3a5f');
    const [customColor2, setCustomColor2] = useState('#0a1628');


    const handleClearCacheAndReload = async () => {
        if (typeof window !== 'undefined') {
            if ('caches' in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => caches.delete(name));
                });
            }
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (let registration of registrations) registration.unregister();
                });
            }
        }
        await forceFetchFromCloud();
        window.location.reload();
    };

    const handleExport = () => {
        const exportData = JSON.stringify(data, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chronos_backup_${new Date().toLocaleDateString('sv-SE')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (importFromJSON(text)) {
                alert('データをインポートしました！');
                window.location.reload();
            } else {
                alert('インポートに失敗しました。ファイル形式を確認してください。');
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm('すべてのデータ（業務時間割、予定、付箋）を消去し、初期設定に戻します。よろしいですか？')) {
            resetAllData();
            alert('初期状態にリセットしました。');
            window.location.reload();
        }
    };

    const handlePresetClick = (value: string) => {
        if (value === '') {
            if (theme !== 'dark') toggleTheme();
            setBgColor('');
        } else if (value === '__light__') {
            if (theme !== 'light') toggleTheme();
            setBgColor('');
        } else {
            setBgColor(value);
        }
    };

    const handleApplyCustomGradient = () => {
        const grad = `linear-gradient(135deg, ${customColor1} 0%, ${customColor2} 100%)`;
        setBgColor(grad);
    };

    const handleApplyCustomSolid = () => {
        setBgColor(customColor1);
    };

    const handleResetBg = () => {
        setBgColor('');
    };

    // 現在適用中のプリセットを判定
    const activePreset = bgColor === ''
        ? (theme === 'dark' ? '' : '__light__')
        : bgColor;

    return (
        <section id="view-settings" className="view-section active">
            <header className="view-header">
                <h1>設定・データ連携</h1>
            </header>
            <div className="settings-grid">

                {/* クラウド連携・アカウント状態カード */}
                <div className="settings-card glass">
                    <h2><Database size={20} /> クラウド連携 ＆ アカウント状態</h2>
                    <p className="description">
                        Googleアカウントでサインインすると、データがGoogleの安全なクラウド（Firestore）に自動保存され、スマホや別のPCからでも常に自動で同期されます。
                    </p>

                    {currentUser ? (
                        <div className="share-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                    ) : (
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {currentUser.displayName ? currentUser.displayName.slice(0, 1) : 'U'}
                                        </div>
                                    )}
                                    <div>
                                        <strong style={{ display: 'block', color: '#10b981', fontSize: '1rem' }}>🟢 クラウド同期中</strong>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.email || currentUser.displayName}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={handleClearCacheAndReload} title="最新プログラムに更新">🔄 最新更新</button>
                                    <button className="btn btn-secondary btn-sm" onClick={logout}>ログアウト</button>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', lineHeight: 1.7 }}>
                                🆔 同期アカウントID (UID): <strong>{currentUser.uid}</strong><br />
                                ☁️ クラウド通信状態: {cloudSyncInfo.status === 'success' ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 接続・同期完了 ({cloudSyncInfo.lastSyncedAt || '最新'})</span> : cloudSyncInfo.status === 'syncing' ? <span style={{ color: '#f59e0b' }}>🟡 通信中...</span> : cloudSyncInfo.status === 'error' ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 通信エラー: {cloudSyncInfo.errorMessage}</span> : <span>⚪ 未接続</span>}<br />
                                📊 アカウント同期中の実データ数: 予定 <strong>{(data.events || []).length}</strong> 件 / 付箋 <strong>{(data.stickies || []).length}</strong> 件
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleDirectUpload} style={{ flex: 1, justifyContent: 'center', background: '#10b981', borderColor: '#059669', color: '#ffffff', fontWeight: 'bold' }}>
                                        📤 クラウドへ保存(送信)
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={handleDirectFetch} style={{ flex: 1, justifyContent: 'center', background: '#3b82f6', borderColor: '#2563eb', color: '#ffffff', fontWeight: 'bold' }}>
                                        📥 クラウドから読込(受信)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="share-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '12px' }}>
                            <div>
                                <strong style={{ display: 'block', color: '#f59e0b', fontSize: '0.95rem' }}>現在ローカル保存モードです</strong>
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>サインインするとデータがクラウドにバックアップされ、スマホ等からアクセス可能になります。</span>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={loginWithGoogle}>Googleでサインイン</button>
                        </div>
                    )}
                </div>

                {/* 背景カラー設定 */}
                <div className="settings-card glass">
                    <h2><Palette size={20} /> 背景カラー設定</h2>
                    <p className="description">アプリの背景色を自由にカスタマイズできます。各項目の色やデザインはそのままです。</p>

                    {/* ダーク系 */}
                    <div className="bg-preset-group-label">🌙 ダークモード</div>
                    <div className="bg-presets-grid">
                        {BG_PRESETS_DARK.map(preset => (
                            <button
                                key={preset.label}
                                className={`bg-preset-btn ${activePreset === preset.value ? 'active' : ''}`}
                                onClick={() => handlePresetClick(preset.value)}
                                title={preset.label}
                            >
                                <span className="bg-preset-swatch" style={{ background: preset.preview }} />
                                <span className="bg-preset-label">{preset.label}</span>
                                {activePreset === preset.value && <span className="bg-preset-check">✓</span>}
                            </button>
                        ))}
                    </div>

                    {/* ライト系 */}
                    <div className="bg-preset-group-label" style={{ marginTop: '16px' }}>☀️ ライトモード</div>
                    <div className="bg-presets-grid">
                        {BG_PRESETS_LIGHT.map(preset => (
                            <button
                                key={preset.label}
                                className={`bg-preset-btn ${activePreset === preset.value ? 'active' : ''}`}
                                onClick={() => handlePresetClick(preset.value)}
                                title={preset.label}
                            >
                                <span className="bg-preset-swatch" style={{ background: preset.preview }} />
                                <span className="bg-preset-label">{preset.label}</span>
                                {activePreset === preset.value && <span className="bg-preset-check">✓</span>}
                            </button>
                        ))}
                    </div>

                    <div className="bg-custom-section">
                        <div className="bg-custom-title">🎨 カスタムカラー</div>
                        <div className="bg-custom-row">
                            <label>色1</label>
                            <input
                                type="color"
                                value={customColor1}
                                onChange={e => setCustomColor1(e.target.value)}
                                className="color-input"
                            />
                            <label>色2（グラデーション用）</label>
                            <input
                                type="color"
                                value={customColor2}
                                onChange={e => setCustomColor2(e.target.value)}
                                className="color-input"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleApplyCustomGradient}>
                                グラデーションで適用
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleApplyCustomSolid}>
                                単色（色1）で適用
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={handleResetBg}>
                                デフォルトに戻す
                            </button>
                        </div>
                        {bgColor && (
                            <div className="bg-current-preview" style={{ background: bgColor }}>
                                現在の背景プレビュー
                            </div>
                        )}
                    </div>
                </div>

                {/* データエクスポート・Excel連携カード */}
                <div className="settings-card glass">
                    <h2><FileSpreadsheet size={20} /> データのエクスポート ＆ Excel連携</h2>
                    <p className="description">
                        保存されている付箋メモやカレンダーの予定・タスクを、CSVファイルで保存したり、ExcelやGoogleスプレッドシートにワンタップで貼り付け・日報用に書き出すことができます。
                    </p>

                    <div className="share-section">
                        {onExportClick && (
                            <button className="btn btn-primary" onClick={onExportClick} style={{ gap: '10px', padding: '12px 20px' }}>
                                <FileSpreadsheet size={18} /> データのエクスポート・Excel連携画面を開く
                            </button>
                        )}
                    </div>

                    <div className="share-info-box">
                        <h3><FileText size={16} /> サポートしている連携機能</h3>
                        <ul>
                            <li>
                                <strong>CSV形式保存</strong>: 文字化けのない標準フォーマットでExcelで直接開けます。
                            </li>
                            <li>
                                <strong>スプレッドシート用コピー</strong>: クリック後、スプレッドシート上で Ctrl+V するだけでセルに綺麗に展開。
                            </li>
                            <li>
                                <strong>日報・文章用コピー</strong>: メールの文章や報告書にそのまま使える箇条書きテキストを出力。
                            </li>
                        </ul>
                    </div>
                </div>

                {/* インポート / エクスポート */}
                <div className="settings-card glass">
                    <h2><Database size={20} /> データのバックアップと復元</h2>
                    <p className="description">
                        アプリの全データを安全なバックアップファイル（JSON）として保存したり、保管したファイルを読み込んで復元することができます。
                    </p>

                    <div className="backup-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={handleExport}>
                            <Download size={16} /> データをエクスポート
                        </button>
                        <div className="import-wrapper">
                            <label htmlFor="import-file-input" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                <Upload size={16} /> データをインポート
                            </label>
                            <input
                                type="file"
                                id="import-file-input"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={handleImportFileChange}
                            />
                        </div>
                    </div>
                </div>



                {/* リセット */}
                <div className="settings-card glass">
                    <h2><AlertTriangle size={20} className="text-danger" /> データの初期化</h2>
                    <p className="description text-danger">
                        すべての時間割、予定、メモを完全に削除し、初期状態に戻します。この操作は取り消せません。
                    </p>
                    <button className="btn btn-danger" onClick={handleReset}>
                        <Trash2 size={16} /> 全データを消去
                    </button>
                </div>
            </div>
        </section>
    );
};
