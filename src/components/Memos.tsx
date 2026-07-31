import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    StickyNote, RotateCcw, CalendarDays, Trash2,
    FolderPlus, Folder, FolderOpen, ChevronDown, ChevronRight,
    Pencil, Check, X, FolderInput, Plus, FileSpreadsheet
} from 'lucide-react';

const FOLDER_COLORS = [
    '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

const STICKY_COLORS = [
    '#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'
];

interface MemosProps {
    onExportClick?: () => void;
}

export const Memos: React.FC<MemosProps> = ({ onExportClick }) => {
    const {
        data, addSticky, deleteSticky, unarchiveSticky, attachStickyToDate, updateSticky,
        addStickyFolder, renameStickyFolder, deleteStickyFolder, moveStickyToFolder
    } = useApp();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [attachTarget, setAttachTarget] = useState<string | null>(null);
    const [attachDate, setAttachDate] = useState('');

    // 新規付箋作成
    const [showCreateSticky, setShowCreateSticky] = useState(false);
    const [newStickyText, setNewStickyText] = useState('');
    const [newStickyColor, setNewStickyColor] = useState(STICKY_COLORS[0]);

    // フォルダー作成
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

    // フォルダー名編集
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');

    // 展開中フォルダー
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // 付箋移動ドロップダウン
    const [movingSticky, setMovingSticky] = useState<string | null>(null);

    // 付箋ボードに表示する付箋（すべての付箋を対象）
    const archivedStickies = data.stickies || [];
    const folders = data.stickyFolders || [];

    const handleCreateSticky = () => {
        if (!newStickyText.trim()) return;
        addSticky(newStickyText.trim(), newStickyColor, true);
        setNewStickyText('');
        setNewStickyColor(STICKY_COLORS[0]);
        setShowCreateSticky(false);
    };

    const handleEditSave = (id: string) => {
        if (editContent.trim()) updateSticky(id, editContent.trim());
        setEditingId(null);
    };

    const handleAttachSubmit = (id: string) => {
        if (attachDate) attachStickyToDate(id, attachDate);
        setAttachTarget(null);
        setAttachDate('');
    };

    const handleDetach = (id: string) => {
        attachStickyToDate(id, undefined);
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        addStickyFolder(newFolderName.trim(), newFolderColor);
        setNewFolderName('');
        setNewFolderColor(FOLDER_COLORS[0]);
        setShowCreateFolder(false);
    };

    const handleRenameFolder = (id: string) => {
        if (editFolderName.trim()) renameStickyFolder(id, editFolderName.trim());
        setEditingFolderId(null);
    };

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // フォルダー内の付箋
    const getStickiesInFolder = (folderId: string) =>
        archivedStickies.filter(s => s.folderId === folderId);

    // フォルダーなしの付箋
    const uncategorized = archivedStickies.filter(s => !s.folderId);

    // 付箋カード（再利用）
    const StickyCard = ({ s }: { s: typeof archivedStickies[0] }) => (
        <div key={s.id} className="sticky-board-card-item" style={{ borderColor: s.color, borderLeftWidth: 5 }}>
            <div className="sticky-board-item-header" style={{ backgroundColor: s.color + '44' }}>
                <div className="sticky-color-dot" style={{ background: s.color }} />
                {s.attachedDate && (
                    <span className="sticky-board-date-tag">📅 {s.attachedDate}</span>
                )}
                <div className="sticky-board-actions">
                    {/* フォルダーに移動 */}
                    <div className="sticky-move-wrapper" onClick={e => e.stopPropagation()}>
                        <button
                            className="sticky-board-action-btn"
                            title="フォルダーに移動"
                            onClick={e => { e.stopPropagation(); setMovingSticky(movingSticky === s.id ? null : s.id); }}
                        >
                            <FolderInput size={14} />
                        </button>
                        {movingSticky === s.id && (
                            <div className="sticky-move-dropdown" onClick={e => e.stopPropagation()}>
                                <button
                                    className="sticky-move-option"
                                    onClick={e => { e.stopPropagation(); moveStickyToFolder(s.id, null); setMovingSticky(null); }}
                                >
                                    <StickyNote size={12} /> フォルダーなし
                                </button>
                                {folders.map(f => (
                                    <button
                                        key={f.id}
                                        className="sticky-move-option"
                                        onClick={() => { moveStickyToFolder(s.id, f.id); setMovingSticky(null); }}
                                    >
                                        <span className="sticky-move-folder-dot" style={{ background: f.color }} />
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* カレンダー連携 */}
                    <button
                        className="sticky-board-action-btn"
                        title={s.attachedDate ? '日付を変更・解除' : 'カレンダーに貼り付け'}
                        onClick={() => { setAttachTarget(s.id); setAttachDate(s.attachedDate || ''); }}
                    >
                        <CalendarDays size={14} />
                    </button>
                    {/* ダッシュボードに戻す */}
                    <button
                        className="sticky-board-action-btn"
                        title="ダッシュボードに戻す"
                        onClick={() => unarchiveSticky(s.id)}
                    >
                        <RotateCcw size={14} />
                    </button>
                    {/* 削除 */}
                    <button
                        className="sticky-board-action-btn danger"
                        title="削除"
                        onClick={() => deleteSticky(s.id)}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="sticky-board-item-body">
                {editingId === s.id ? (
                    <textarea
                        className="sticky-board-edit-area"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        onBlur={() => handleEditSave(s.id)}
                        onKeyDown={e => { if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                    />
                ) : (
                    <p
                        className="sticky-board-item-text"
                        onClick={() => { setEditingId(s.id); setEditContent(s.content); }}
                        title="クリックで編集"
                    >
                        {s.content}
                    </p>
                )}
            </div>

            <div className="sticky-board-item-footer">
                {new Date(s.createdAt).toLocaleDateString('ja-JP')}
            </div>

            {attachTarget === s.id && (
                <div className="sticky-attach-panel">
                    <input
                        type="date"
                        value={attachDate}
                        onChange={e => setAttachDate(e.target.value)}
                        className="sticky-attach-date-input"
                    />
                    <div className="sticky-attach-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => handleAttachSubmit(s.id)}>貼り付け</button>
                        {s.attachedDate && (
                            <button className="btn btn-sm btn-secondary" onClick={() => handleDetach(s.id)}>解除</button>
                        )}
                        <button className="btn btn-sm btn-secondary" onClick={() => setAttachTarget(null)}>キャンセル</button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <section id="view-memos" className="view-section active" onClick={() => setMovingSticky(null)}>
            <header className="view-header">
                <h1>付箋ボード</h1>
                <div className="view-actions">
                    {onExportClick && (
                        <button
                            className="btn btn-secondary"
                            onClick={e => { e.stopPropagation(); onExportClick(); }}
                            title="Excel・スプレッドシート連携"
                        >
                            <FileSpreadsheet size={16} /> エクスポート
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={e => { e.stopPropagation(); setShowCreateSticky(v => !v); setShowCreateFolder(false); }}
                    >
                        <Plus size={16} /> 付箋を作成
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={e => { e.stopPropagation(); setShowCreateFolder(v => !v); setShowCreateSticky(false); }}
                    >
                        <FolderPlus size={16} /> フォルダーを作成
                    </button>
                </div>
            </header>

            {/* 新規付箋作成パネル */}
            {showCreateSticky && (
                <div className="folder-create-panel glass" onClick={e => e.stopPropagation()} style={{ marginBottom: '16px' }}>
                    <h4>新規付箋を作成</h4>
                    <textarea
                        className="folder-name-input"
                        placeholder="付箋のメッセージ内容..."
                        value={newStickyText}
                        onChange={e => setNewStickyText(e.target.value)}
                        rows={2}
                        style={{ width: '100%', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}
                        autoFocus
                    />
                    <div className="folder-color-row" style={{ marginBottom: '12px' }}>
                        {STICKY_COLORS.map(c => (
                            <button
                                key={c}
                                className={`folder-color-chip ${newStickyColor === c ? 'selected' : ''}`}
                                style={{ background: c }}
                                onClick={() => setNewStickyColor(c)}
                            />
                        ))}
                    </div>
                    <div className="folder-create-actions">
                        <button className="btn btn-primary btn-sm" onClick={handleCreateSticky} disabled={!newStickyText.trim()}>作成する</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateSticky(false)}>キャンセル</button>
                    </div>
                </div>
            )}

            {/* フォルダー作成パネル */}
            {showCreateFolder && (
                <div className="folder-create-panel glass" onClick={e => e.stopPropagation()} style={{ marginBottom: '16px' }}>
                    <h4>新規フォルダーを作成</h4>
                    <input
                        className="folder-name-input"
                        placeholder="フォルダー名"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
                        autoFocus
                    />
                    <div className="folder-color-row" style={{ marginBottom: '12px' }}>
                        {FOLDER_COLORS.map(c => (
                            <button
                                key={c}
                                className={`folder-color-chip ${newFolderColor === c ? 'selected' : ''}`}
                                style={{ background: c }}
                                onClick={() => setNewFolderColor(c)}
                            />
                        ))}
                    </div>
                    <div className="folder-create-actions">
                        <button className="btn btn-primary btn-sm" onClick={handleCreateFolder}>作成</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateFolder(false)}>キャンセル</button>
                    </div>
                </div>
            )}

            {archivedStickies.length === 0 && folders.length === 0 ? (
                <div className="sticky-board-empty">
                    <StickyNote size={56} style={{ opacity: 0.2 }} />
                    <p>保存された付箋がありません</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>「+ 付箋を作成」ボタンから作成するか、ダッシュボードの付箋から長期保存してください</p>
                </div>
            ) : (
                <div className="sticky-board-content">

                    {/* フォルダーセクション */}
                    {folders.length > 0 && (
                        <div className="folder-section">
                            {folders.map(folder => {
                                const isOpen = expandedFolders.has(folder.id);
                                const folderStickies = getStickiesInFolder(folder.id);
                                return (
                                    <div key={folder.id} className={`folder-card ${isOpen ? 'open' : ''}`}>
                                        {/* フォルダータブ */}
                                        <div
                                            className="folder-tab"
                                            style={{ background: folder.color }}
                                            onClick={() => toggleFolder(folder.id)}
                                        >
                                            {isOpen
                                                ? <FolderOpen size={16} />
                                                : <Folder size={16} />
                                            }
                                            {editingFolderId === folder.id ? (
                                                <input
                                                    className="folder-rename-input"
                                                    value={editFolderName}
                                                    onChange={e => setEditFolderName(e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                                                        if (e.key === 'Escape') setEditingFolderId(null);
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="folder-tab-name">{folder.name}</span>
                                            )}
                                            <span className="folder-count-badge">{folderStickies.length}</span>
                                            <div className="folder-tab-actions" onClick={e => e.stopPropagation()}>
                                                {editingFolderId === folder.id ? (
                                                    <>
                                                        <button className="folder-action-btn" onClick={() => handleRenameFolder(folder.id)}><Check size={13} /></button>
                                                        <button className="folder-action-btn" onClick={() => setEditingFolderId(null)}><X size={13} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="folder-action-btn" title="フォルダー名を変更" onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}>
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button className="folder-action-btn danger" title="フォルダーを削除" onClick={() => deleteStickyFolder(folder.id)}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="folder-chevron">
                                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        </div>

                                        {/* フォルダー本体 */}
                                        <div className="folder-body" style={{ borderColor: folder.color + '66' }}>
                                            {isOpen && (
                                                folderStickies.length === 0 ? (
                                                    <div className="folder-empty">
                                                        <StickyNote size={28} style={{ opacity: 0.3 }} />
                                                        <p>付箋がありません</p>
                                                        <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>付箋の <FolderInput size={11} style={{ display: 'inline' }} /> からここへ移動できます</p>
                                                    </div>
                                                ) : (
                                                    <div className="sticky-board-grid">
                                                        {folderStickies.map(s => <StickyCard key={s.id} s={s} />)}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* フォルダーなしの付箋 */}
                    {uncategorized.length > 0 && (
                        <div className="uncategorized-section">
                            {folders.length > 0 && (
                                <div className="uncategorized-label">
                                    <StickyNote size={14} /> 未分類
                                </div>
                            )}
                            <div className="sticky-board-grid">
                                {uncategorized.map(s => <StickyCard key={s.id} s={s} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
