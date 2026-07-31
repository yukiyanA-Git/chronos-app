import React, { useState, useEffect } from 'react';
import { X, Edit2, FolderSearch } from 'lucide-react';

const SLOT_COUNT = 8;
const STORAGE_KEY = 'chronos_shortcuts';

// カラーパレット（スロットの●色）
const COLOR_PALETTE = [
    '#6366f1', // インディゴ
    '#3b82f6', // ブルー
    '#06b6d4', // シアン
    '#10b981', // エメラルド
    '#f59e0b', // アンバー
    '#ef4444', // レッド
    '#ec4899', // ピンク
    '#8b5cf6', // バイオレット
    '#f97316', // オレンジ
    '#14b8a6', // ティール
    '#84cc16', // ライム
    '#a78bfa', // ラベンダー
];

// スロット番号に対してデフォルト色を循環割り当て
function defaultColor(idx: number): string {
    return COLOR_PALETTE[idx % COLOR_PALETTE.length];
}

interface Shortcut {
    id: string;
    label: string;
    path: string;
    ext: string;
    color: string; // ●の色
}

interface ShortcutSlotsProps {
    sidebar?: boolean;
}

function loadShortcuts(): (Shortcut | null)[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return Array(SLOT_COUNT).fill(null);
        const arr = JSON.parse(raw);
        while (arr.length < SLOT_COUNT) arr.push(null);
        // color フィールドが無い古いデータに色を補完
        return arr.slice(0, SLOT_COUNT).map((s: Shortcut | null, i: number) =>
            s && !s.color ? { ...s, color: defaultColor(i) } : s
        );
    } catch {
        return Array(SLOT_COUNT).fill(null);
    }
}

function saveShortcuts(slots: (Shortcut | null)[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

async function openFile(filePath: string): Promise<boolean> {
    const trimmed = filePath.trim();
    if (!trimmed) return false;

    // Web URL (http:// または https:// または www.) の場合は直接別タブで開く
    if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
        const url = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
        window.open(url, '_blank', 'noopener,noreferrer');
        return true;
    }

    // ms-excel: や ms-word: などのプロトコル
    if (/^ms-[a-z]+:/i.test(trimmed)) {
        try {
            window.location.href = trimmed;
            return true;
        } catch {
            return false;
        }
    }

    // ローカルAPI試行（ローカル環境の場合）
    try {
        const res = await fetch('/api/open-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: trimmed })
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok === true) return true;
    } catch {
        // バックエンドが無いWeb環境
    }

    // ドメイン風の入力（例: google.com, mail.google.com）をWeb URLとして自動オープン
    if (trimmed.includes('.') && !trimmed.includes('\\')) {
        window.open(`https://${trimmed}`, '_blank', 'noopener,noreferrer');
        return true;
    }

    return false;
}

function extractPath(e: React.DragEvent): { path: string; name: string } | null {
    const textPlain = e.dataTransfer.getData('text/plain');
    if (textPlain && textPlain.trim()) {
        const line = textPlain.trim().split('\n')[0].trim();
        if (line) {
            const name = line.split('\\').pop() || line.split('/').pop() || line;
            return { path: line, name };
        }
    }
    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList && uriList.trim()) {
        const uri = uriList.trim().split('\n')[0].trim();
        if (uri.startsWith('file:///')) {
            const decoded = decodeURIComponent(uri.replace(/^file:\/\/\//, '').replace(/\//g, '\\'));
            const name = decoded.split('\\').pop() || decoded;
            return { path: decoded, name };
        }
        return { path: uri, name: uri };
    }
    if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        return { path: file.name, name: file.name };
    }
    return null;
}

// ────────────────────────────────────────────
// パス・色 編集モーダル
// ────────────────────────────────────────────
const PathEditModal: React.FC<{
    slot: Shortcut;
    slotIdx: number;
    isNew?: boolean;
    onSave: (label: string, path: string, color: string) => void;
    onClose: () => void;
}> = ({ slot, slotIdx, isNew, onSave, onClose }) => {
    const [label, setLabel] = useState(slot.label);
    const [path, setPath] = useState(slot.path);
    const [color, setColor] = useState(slot.color || defaultColor(slotIdx));

    return (
        <div className="path-modal-overlay" onClick={onClose}>
            <div className="path-modal" onClick={e => e.stopPropagation()}>
                <div className="path-modal-header">
                    {/* プレビュー ● */}
                    <span
                        style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: color, display: 'inline-block', flexShrink: 0
                        }}
                    />
                    <span style={{ flex: 1, marginLeft: 8 }}>
                        {isNew ? 'ショートカットの追加' : 'ショートカットを編集'}
                    </span>
                    <button className="path-modal-close" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="path-modal-body">
                    {/* ●カラー選択 */}
                    <label className="path-modal-label">アイコンカラー（●）</label>
                    <div className="color-swatch-row">
                        {COLOR_PALETTE.map(c => (
                            <button
                                key={c}
                                className={`color-swatch-btn ${color === c ? 'selected' : ''}`}
                                style={{ background: c }}
                                onClick={() => setColor(c)}
                                title={c}
                            />
                        ))}
                        {/* カスタムカラー */}
                        <input
                            type="color"
                            className="color-swatch-picker"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            title="カスタムカラー"
                        />
                    </div>

                    {/* 表示名 */}
                    <label className="path-modal-label" style={{ marginTop: '14px' }}>表示名</label>
                    <input
                        className="path-modal-input"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder="例: Excel, Gmail, Yahoo"
                        autoFocus
                    />

                    {/* パス */}
                    <label className="path-modal-label" style={{ marginTop: '12px' }}>
                        WebサイトのURL
                        <span className="path-modal-hint">（例: https://excel.new や https://google.com）</span>
                    </label>
                    <input
                        className="path-modal-input path-mono"
                        value={path}
                        onChange={e => setPath(e.target.value)}
                        placeholder="例: https://excel.new や https://mail.google.com"
                    />
                    <div className="path-modal-examples">
                        <strong>Office / スプレッドシート：</strong>
                        <button className="path-example-btn" onClick={() => { setPath('https://excel.new'); setLabel(l => l || 'Excel Web'); }}>Excel Web(新規)</button>
                        <button className="path-example-btn" onClick={() => { setPath('https://sheets.new'); setLabel(l => l || 'Googleスプレッドシート'); }}>スプレッドシート</button>
                        <button className="path-example-btn" onClick={() => { setPath('https://word.new'); setLabel(l => l || 'Word Web'); }}>Word Web(新規)</button>
                    </div>
                    <div className="path-modal-examples" style={{ marginTop: '6px' }}>
                        <strong>よく使うWebツール：</strong>
                        <button className="path-example-btn" onClick={() => { setPath('https://mail.google.com'); setLabel(l => l || 'Gmail'); }}>Gmail</button>
                        <button className="path-example-btn" onClick={() => { setPath('https://calendar.google.com'); setLabel(l => l || 'Googleカレンダー'); }}>Googleカレンダー</button>
                        <button className="path-example-btn" onClick={() => { setPath('https://www.yahoo.co.jp'); setLabel(l => l || 'Yahoo!'); }}>Yahoo!</button>
                    </div>
                </div>
                <div className="path-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
                    <button
                        className="btn btn-primary"
                        onClick={() => { if (path.trim()) onSave(label.trim() || slot.label, path.trim(), color); }}
                        disabled={!path.trim()}
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────
export const ShortcutSlots: React.FC<ShortcutSlotsProps> = (_props) => {
    const [slots, setSlots] = useState<(Shortcut | null)[]>(loadShortcuts);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const [editingSlot, setEditingSlot] = useState<{ idx: number; slot: Shortcut; isNew?: boolean } | null>(null);
    const [openingIdx, setOpeningIdx] = useState<number | null>(null);

    useEffect(() => { saveShortcuts(slots); }, [slots]);

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault(); e.stopPropagation();
        setDragOverIdx(idx);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        setDragOverIdx(null);
    };
    const handleDrop = (e: React.DragEvent, idx: number) => {
        e.preventDefault(); e.stopPropagation();
        setDragOverIdx(null);
        const result = extractPath(e);
        if (!result) return;
        const { path: filePath, name: fileName } = result;
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? '.' + parts[parts.length - 1] : '';
        const label = parts.length > 1 ? parts.slice(0, -1).join('.') : fileName;
        const newSlot: Shortcut = {
            id: `sc-${Date.now()}`,
            label,
            path: filePath,
            ext,
            color: defaultColor(idx),
        };
        setSlots(prev => { const next = [...prev]; next[idx] = newSlot; return next; });
    };

    const handleRemove = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        setSlots(prev => { const next = [...prev]; next[idx] = null; return next; });
    };

    const handleClick = async (idx: number) => {
        const slot = slots[idx];
        if (!slot) return;
        setOpeningIdx(idx);
        const ok = await openFile(slot.path);
        setOpeningIdx(null);
        if (!ok) {
            if (confirm(`「${slot.label}」を開けませんでした。\n設定パス: ${slot.path}\n\n※Web公開アプリ版からは、セキュリティの制限によりPC内のローカルファイル（C:\\... や .lnk）を直接起動できません。\nWebサービス（例: https://excel.new や Gmailなど）のURLを登録してご活用ください。\n\nURLを編集しますか？`)) {
                setEditingSlot({ idx, slot });
            }
        }
    };

    const handleEditClick = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        const slot = slots[idx];
        if (!slot) return;
        setEditingSlot({ idx, slot });
    };

    const handleEditSave = (label: string, path: string, color: string) => {
        if (!editingSlot) return;
        const { idx, slot } = editingSlot;
        const parts = path.split('\\').pop()?.split('.') || [];
        const ext = parts.length > 1 ? '.' + parts[parts.length - 1] : slot.ext;
        setSlots(prev => {
            const next = [...prev];
            next[idx] = {
                id: slot.id || `sc-${Date.now()}`,
                label,
                path,
                ext,
                color
            };
            return next;
        });
        setEditingSlot(null);
    };

    const handleEmptyClick = (idx: number) => {
        const emptySlot: Shortcut = {
            id: `sc-${Date.now()}`,
            label: '',
            path: '',
            ext: '',
            color: defaultColor(idx)
        };
        setEditingSlot({ idx, slot: emptySlot, isNew: true });
    };

    const renderSlot = (slot: Shortcut | null, idx: number) => {
        const isOver = dragOverIdx === idx;
        const isOpening = openingIdx === idx;
        const dotColor = slot?.color || defaultColor(idx);

        return (
            <div
                key={idx}
                className={`sidebar-slot ${slot ? 'filled' : 'empty'} ${isOver ? 'drag-over' : ''} ${isOpening ? 'opening' : ''}`}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => slot ? handleClick(idx) : handleEmptyClick(idx)}
                title={slot ? `${slot.label}\nパス: ${slot.path}\nクリック: 開く` : 'クリックまたはドロップで追加'}
            >
                {slot ? (
                    <>
                        {/* 削除ボタン */}
                        <button className="sidebar-slot-remove" onClick={(e) => handleRemove(idx, e)} title="削除">
                            <X size={8} />
                        </button>
                        {/* 編集ボタン */}
                        <button className="sidebar-slot-edit" onClick={(e) => handleEditClick(idx, e)} title="色・パスを編集">
                            <Edit2 size={8} />
                        </button>
                        {/* ● カラードット */}
                        <div
                            className="slot-dot"
                            style={{ background: dotColor, boxShadow: `0 2px 8px ${dotColor}88` }}
                        />
                        {/* ラベル */}
                        <div className="sidebar-slot-label">{slot.label}</div>
                    </>
                ) : (
                    <div className="sidebar-slot-empty">＋</div>
                )}
            </div>
        );
    };

    return (
        <>
            {editingSlot && (
                <PathEditModal
                    slot={editingSlot.slot}
                    slotIdx={editingSlot.idx}
                    isNew={editingSlot.isNew}
                    onSave={handleEditSave}
                    onClose={() => setEditingSlot(null)}
                />
            )}
            <div className="sidebar-shortcuts">
                <div className="sidebar-shortcuts-title">
                    <FolderSearch size={12} style={{ display: 'inline', marginRight: 4 }} />
                    ショートカット
                </div>
                <div className="sidebar-shortcuts-grid">
                    {slots.map((slot, idx) => renderSlot(slot, idx))}
                </div>
            </div>
        </>
    );
};
