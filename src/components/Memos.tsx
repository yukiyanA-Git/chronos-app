import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    StickyNote, CalendarDays, Trash2,
    FolderPlus, Folder, FolderOpen, ChevronDown, ChevronRight,
    Pencil, Check, X, FolderInput, Plus, FileSpreadsheet, Pin
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
        data, addSticky, deleteSticky, attachStickyToDate, updateSticky, pinSticky,
        addStickyFolder, renameStickyFolder, deleteStickyFolder, moveStickyToFolder,
        draftStickyText, draftStickyColor, setDraftStickyText, setDraftStickyColor, clearDraftSticky
    } = useApp();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [attachTarget, setAttachTarget] = useState<string | null>(null);
    const [attachDate, setAttachDate] = useState('');

    // 新規付箋作成（下書きがある場合は自動的にフォームを開いた状態にする）
    const [showCreateSticky, setShowCreateSticky] = useState(() => !!draftStickyText.trim());
    const [notice, setNotice] = useState<string | null>(null);

    // フォルダー作成
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

    // フォルダー名編集
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');

    // 展開中フォルダー (初期状態でスマートフォルダーを展開)
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['smart-dashboard', 'smart-calendar']));

    // 付箋移動ドロップダウン
    const [movingSticky, setMovingSticky] = useState<string | null>(null);

    // 付箋ボードに表示する付箋（すべての付箋を対象）
    const archivedStickies = data.stickies || [];
    const folders = data.stickyFolders || [];

    const handleCreateSticky = () => {
        if (!draftStickyText.trim()) return;
        addSticky(draftStickyText.trim(), draftStickyColor, true);
        clearDraftSticky();
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

    // フォルダー内の付箋 (ユーザー作成フォルダー)
    const getStickiesInFolder = (folderId: string) =>
        archivedStickies.filter(s => s.folderId === folderId && !s.attachedDate);

    // 1. カレンダー連動スマートフォルダー（日付が貼られている付箋・上限なし）
    const calendarStickies = archivedStickies.filter(s => !!s.attachedDate);

    // 2. クイックデスク・スマートフォルダー（ダッシュボードに現在選抜・表示されている最大10枚）
    const candidateStickies = archivedStickies.filter(s => !s.attachedDate && !s.folderId);
    const pinnedStickies = candidateStickies.filter(s => s.pinned);
    const unpinnedStickies = candidateStickies.filter(s => !s.pinned);
    const dashboardStickies = [...pinnedStickies, ...unpinnedStickies.slice(0, Math.max(0, 10 - pinnedStickies.length))];
    const dashboardStickyIds = new Set(dashboardStickies.map(s => s.id));

    // 3. 未分類・保管ストック（どのフォルダーにも属さず、カレンダーにも貼られず、ダッシュボード上限からも押し出された付箋）
    const uncategorized = archivedStickies.filter(s => !s.folderId && !s.attachedDate && !dashboardStickyIds.has(s.id));

    const handleTogglePin = (s: typeof archivedStickies[0]) => {
        if (!s.pinned && pinnedStickies.length >= 10) {
            setNotice('ダッシュボードのピン留めは最大10件までです。他のピン留めを解除してからお試しください。');
            setTimeout(() => setNotice(null), 5000);
            return;
        }
        pinSticky(s.id, !s.pinned);
    };

    // 付箋カード（再利用）
    const StickyCard = ({ s }: { s: typeof archivedStickies[0] }) => (
        <div key={s.id} className="sticky-board-card-item" style={{ borderColor: s.color, borderLeftWidth: 5 }}>
            <div className="sticky-board-item-header" style={{ backgroundColor: s.color + '44' }}>
                <div className="sticky-color-dot" style={{ background: s.color }} />
                {s.attachedDate && (
                    <span className="sticky-board-date-tag">📅 {s.attachedDate}</span>
                )}
                {s.pinned && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', marginLeft: '4px' }}>📌 ピン留め中</span>
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
                    {/* ダッシュボードにピン留め / 解除 */}
                    <button
                        className="sticky-board-action-btn"
                        style={s.pinned ? { color: '#f59e0b', background: 'rgba(245, 158, 11, 0.2)' } : {}}
                        title={s.pinned ? 'ピン留め解除（ダッシュボード固定を外す）' : 'ピン留め（ダッシュボードに優先固定）'}
                        onClick={() => handleTogglePin(s)}
                    >
                        <Pin size={14} />
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

            {/* 案内トースト */}
            {notice && (
                <div className="sticky-overflow-toast" style={{ marginBottom: '16px' }}>
                    <span>📌 {notice}</span>
                    <button className="toast-close-btn" onClick={() => setNotice(null)}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* 新規付箋作成パネル */}
            {showCreateSticky && (
                <div className="folder-create-panel glass" onClick={e => e.stopPropagation()} style={{ marginBottom: '16px' }}>
                    <h4>新規付箋を作成</h4>
                    <textarea
                        className="folder-name-input"
                        placeholder="付箋のメッセージ内容..."
                        value={draftStickyText}
                        onChange={e => setDraftStickyText(e.target.value)}
                        rows={2}
                        style={{ width: '100%', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}
                        autoFocus
                    />
                    <div className="folder-color-row" style={{ marginBottom: '12px' }}>
                        {STICKY_COLORS.map(c => (
                            <button
                                key={c}
                                className={`folder-color-chip ${draftStickyColor === c ? 'selected' : ''}`}
                                style={{ background: c }}
                                onClick={() => setDraftStickyColor(c)}
                            />
                        ))}
                    </div>
                    <div className="folder-create-actions">
                        <button className="btn btn-primary btn-sm" onClick={handleCreateSticky} disabled={!draftStickyText.trim()}>作成する</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateSticky(false)}>閉じる</button>
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
                    {/* スマートフォルダーセクション (自動集約トレイ) */}
                    <div className="folder-section smart-folders-section" style={{ marginBottom: '16px' }}>
                        {/* 1. クイックデスク（ダッシュボード常駐・上限10枚） */}
                        <div className={`folder-card smart-folder ${expandedFolders.has('smart-dashboard') ? 'open' : ''}`} style={{ marginBottom: '12px' }}>
                            <div
                                className="folder-tab"
                                style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)' }}
                                onClick={() => toggleFolder('smart-dashboard')}
                            >
                                {expandedFolders.has('smart-dashboard') ? <FolderOpen size={16} /> : <Folder size={16} />}
                                <span className="folder-tab-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Pin size={14} style={{ color: '#fde047' }} />
                                    クイックデスク（ダッシュボード常駐）
                                </span>
                                <span className="folder-count-badge" style={{ background: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                                    {dashboardStickies.length}/10枚
                                </span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: 'auto', marginRight: '8px' }}>
                                    ピン優先・上限10枚
                                </span>
                                <div className="folder-chevron">
                                    {expandedFolders.has('smart-dashboard') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                            </div>
                            <div className="folder-body" style={{ borderColor: 'rgba(2, 132, 199, 0.4)' }}>
                                {expandedFolders.has('smart-dashboard') && (
                                    dashboardStickies.length === 0 ? (
                                        <div className="folder-empty">
                                            <StickyNote size={28} style={{ opacity: 0.3 }} />
                                            <p>ダッシュボードに表示中の付箋はありません</p>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>付箋の 📌 ピン留めを押すか、新規作成すると自動でここに集まります（最大10枚）</p>
                                        </div>
                                    ) : (
                                        <div className="sticky-board-grid">
                                            {dashboardStickies.map(s => <StickyCard key={s.id} s={s} />)}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* 2. カレンダー連動（スケジュール貼付・上限なし） */}
                        <div className={`folder-card smart-folder ${expandedFolders.has('smart-calendar') ? 'open' : ''}`} style={{ marginBottom: '12px' }}>
                            <div
                                className="folder-tab"
                                style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)' }}
                                onClick={() => toggleFolder('smart-calendar')}
                            >
                                {expandedFolders.has('smart-calendar') ? <FolderOpen size={16} /> : <Folder size={16} />}
                                <span className="folder-tab-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarDays size={14} style={{ color: '#a7f3d0' }} />
                                    カレンダー連動（スケジュール貼付）
                                </span>
                                <span className="folder-count-badge" style={{ background: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                                    {calendarStickies.length}枚
                                </span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: 'auto', marginRight: '8px' }}>
                                    上限なし
                                </span>
                                <div className="folder-chevron">
                                    {expandedFolders.has('smart-calendar') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                            </div>
                            <div className="folder-body" style={{ borderColor: 'rgba(5, 150, 105, 0.4)' }}>
                                {expandedFolders.has('smart-calendar') && (
                                    calendarStickies.length === 0 ? (
                                        <div className="folder-empty">
                                            <StickyNote size={28} style={{ opacity: 0.3 }} />
                                            <p>カレンダーに貼り付けられた付箋はありません</p>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>付箋の 📅 カレンダーアイコンから日付に貼り付けると、自動でここに集約されます</p>
                                        </div>
                                    ) : (
                                        <div className="sticky-board-grid">
                                            {calendarStickies.map(s => <StickyCard key={s.id} s={s} />)}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ユーザー作成フォルダーセクション */}
                    {folders.length > 0 && (
                        <div className="folder-section" style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Folder size={15} /> マイフォルダー
                            </div>
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

                    {/* 未分類・保管ストック（押し出された付箋やどこにも属さないメモ） */}
                    {uncategorized.length > 0 && (
                        <div className="uncategorized-section">
                            <div className="uncategorized-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
                                <StickyNote size={14} /> 未分類・保管ストック ({uncategorized.length}枚)
                            </div>
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
