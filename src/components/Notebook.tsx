import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { NotebookType } from '../types';
import {
    BookOpen, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight,
    Plus, Lock, Unlock, Search, Trash2, Image, ExternalLink,
    Printer, CalendarDays, X
} from 'lucide-react';

interface NotebookProps {
    onViewChange?: (view: string) => void;
}

// 用紙カラープリセット
export const NOTEBOOK_PAPERS = [
    { id: 'white', label: '白紙 (クラシック)', color: '#ffffff', textColor: '#1e293b', lineColor: 'rgba(59, 130, 246, 0.2)' },
    { id: 'ivory', label: '生成り (アイボリー)', color: '#fefcf3', textColor: '#292524', lineColor: 'rgba(217, 119, 6, 0.2)' },
    { id: 'yellow', label: 'リーガルパッド (黄)', color: '#fef9c3', textColor: '#292524', lineColor: 'rgba(202, 138, 4, 0.25)' },
    { id: 'green', label: 'ミント (薄緑)', color: '#dcfce7', textColor: '#14532d', lineColor: 'rgba(22, 163, 74, 0.22)' },
    { id: 'blue', label: 'スカイ (薄青)', color: '#e0f2fe', textColor: '#0c4a6e', lineColor: 'rgba(2, 132, 199, 0.22)' },
    { id: 'pink', label: 'サクラ (薄桃)', color: '#fce7f3', textColor: '#831843', lineColor: 'rgba(219, 39, 119, 0.22)' },
    { id: 'purple', label: 'ラベンダー (薄紫)', color: '#f3e8ff', textColor: '#581c87', lineColor: 'rgba(147, 51, 234, 0.22)' },
    { id: 'dark', label: 'ダークスレート (黒板)', color: '#1e293b', textColor: '#f8fafc', lineColor: 'rgba(148, 163, 184, 0.2)' },
];

export const Notebook: React.FC<NotebookProps> = ({ onViewChange }) => {
    const {
        data, addNotebookNote, updateNotebookNote, deleteNotebookNote,
        targetNotebookDate, setTargetNotebookDate
    } = useApp();

    const notes = data.notebookNotes || [];

    // モード切替: 'daily' (日付順ログ) / 'free' (自由帳)
    const [currentType, setCurrentType] = useState<NotebookType>('daily');

    // 検索キーワード
    const [searchQuery, setSearchQuery] = useState('');

    // 現在選択中のノートID
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

    // カレンダー貼付用ダイアログ (自由帳用)
    const [showDateModal, setShowDateModal] = useState(false);
    const [attachDateInput, setAttachDateInput] = useState('');

    // タイプと検索でフィルタリングしたノート一覧
    const filteredNotes = notes.filter(n => {
        // タイプ一致 (古いデータなどでtypeが無い場合はdaily扱い)
        const noteType = n.type || 'daily';
        if (noteType !== currentType) return false;

        // 検索ワード判定 (タイトル、本文、日付)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = (n.title || '').toLowerCase().includes(q);
            const matchContent = (n.content || '').toLowerCase().includes(q);
            const matchDate = (n.date || '').toLowerCase().includes(q);
            return matchTitle || matchContent || matchDate;
        }
        return true;
    }).sort((a, b) => {
        if (currentType === 'daily') {
            // 日付順（新しい順）
            return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
        } else {
            // 自由帳: order順または更新順
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            return b.updatedAt.localeCompare(a.updatedAt);
        }
    });

    // カレンダーから特定の日付が指定されて遷移してきた場合の自動同期
    useEffect(() => {
        if (targetNotebookDate) {
            setCurrentType('daily');
            const targetNote = notes.find(n => n.type === 'daily' && n.date === targetNotebookDate);
            if (targetNote) {
                setActiveNoteId(targetNote.id);
            } else {
                // その日のノートがまだない場合は新規作成
                const newId = addNotebookNote({
                    title: `${targetNotebookDate} デイリーログ`,
                    content: '',
                    type: 'daily',
                    date: targetNotebookDate,
                    color: '#ffffff',
                    isLocked: false // 新規時はすぐに書けるようロック解除
                });
                setActiveNoteId(newId);
            }
            setTargetNotebookDate(null);
        }
    }, [targetNotebookDate]);

    // アクティブノートの選択（リスト変更時に範囲外なら先頭を選択）
    useEffect(() => {
        if (filteredNotes.length > 0) {
            if (!activeNoteId || !filteredNotes.some(n => n.id === activeNoteId)) {
                setActiveNoteId(filteredNotes[0].id);
            }
        } else {
            setActiveNoteId(null);
        }
    }, [filteredNotes, activeNoteId]);

    const activeIndex = filteredNotes.findIndex(n => n.id === activeNoteId);
    const activeNote = filteredNotes.find(n => n.id === activeNoteId);

    // 新規ページ作成
    const handleCreatePage = () => {
        const todayStr = new Date().toLocaleDateString('sv-SE');
        let newTitle = '';
        if (currentType === 'daily') {
            // 同じ日付のページ数をカウント
            const sameDayNotes = notes.filter(n => n.type === 'daily' && n.date === todayStr);
            newTitle = sameDayNotes.length > 0
                ? `${todayStr} デイリーログ (#${sameDayNotes.length + 1})`
                : `${todayStr} デイリーログ`;
        } else {
            const freeCount = notes.filter(n => n.type === 'free').length;
            newTitle = `無題のノート ${freeCount + 1}`;
        }

        const newId = addNotebookNote({
            title: newTitle,
            content: '',
            type: currentType,
            date: todayStr,
            color: '#ffffff',
            isLocked: false // 作成直後は入力できるようにロック解除状態
        });
        setActiveNoteId(newId);
    };

    // ページ送り (前へ / 次へ)
    const handlePrevPage = () => {
        if (activeIndex > 0) {
            setActiveNoteId(filteredNotes[activeIndex - 1].id);
        }
    };

    const handleNextPage = () => {
        if (activeIndex < filteredNotes.length - 1) {
            setActiveNoteId(filteredNotes[activeIndex + 1].id);
        }
    };

    // ロック切り替え (閲覧モード ⇄ 編集モード)
    const handleToggleLock = () => {
        if (!activeNote) return;
        updateNotebookNote(activeNote.id, { isLocked: !activeNote.isLocked });
    };

    // 本文変更 (自動保存)
    const handleContentChange = (content: string) => {
        if (!activeNote || activeNote.isLocked) return;
        updateNotebookNote(activeNote.id, { content });
    };

    // タイトル変更
    const handleTitleChange = (title: string) => {
        if (!activeNote || activeNote.isLocked) return;
        updateNotebookNote(activeNote.id, { title });
    };

    // 用紙色変更
    const handleColorChange = (color: string) => {
        if (!activeNote || activeNote.isLocked) return;
        updateNotebookNote(activeNote.id, { color });
    };

    // 削除
    const handleDelete = () => {
        if (!activeNote) return;
        if (window.confirm(`「${activeNote.title || 'このページ'}」を削除してもよろしいですか？`)) {
            deleteNotebookNote(activeNote.id);
        }
    };

    // 画像ファイルアップロード (Base64)
    const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeNote) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
                const currentImages = activeNote.images || [];
                updateNotebookNote(activeNote.id, { images: [...currentImages, base64] });
            }
        };
        reader.readAsDataURL(file);
    };

    // 添付画像の削除
    const handleDeleteImage = (index: number) => {
        if (!activeNote || activeNote.isLocked) return;
        const currentImages = activeNote.images || [];
        const nextImages = currentImages.filter((_, idx) => idx !== index);
        updateNotebookNote(activeNote.id, { images: nextImages });
    };

    // 自由帳の日付貼付更新
    const handleAttachDateSubmit = () => {
        if (!activeNote) return;
        updateNotebookNote(activeNote.id, { date: attachDateInput });
        setShowDateModal(false);
    };

    // 印刷
    const handlePrint = () => {
        window.print();
    };

    // ハイパーリンクを自動リンク化してレンダリングする関数 (閲覧モード用)
    const renderContentWithLinks = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split('\n').map((line, lineIdx) => {
            const parts = line.split(urlRegex);
            return (
                <div key={lineIdx} className="notebook-line-text">
                    {parts.map((part, partIdx) => {
                        if (part.match(urlRegex)) {
                            return (
                                <a
                                    key={partIdx}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="notebook-inline-link"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {part} <ExternalLink size={12} style={{ display: 'inline' }} />
                                </a>
                            );
                        }
                        return part;
                    })}
                    {line === '' && <br />}
                </div>
            );
        });
    };

    const currentPaper = NOTEBOOK_PAPERS.find(p => p.color === activeNote?.color) || NOTEBOOK_PAPERS[0];

    return (
        <section id="view-notebook" className="view-section active">
            {/* 上部ヘッダー */}
            <header className="view-header notebook-view-header">
                <div className="notebook-title-area">
                    <h1><BookOpen size={22} /> ノート</h1>
                    <span className="notebook-beta-badge">A4ルーズリーフ調 (Beta)</span>
                </div>

                {/* モード切替タブ */}
                <div className="notebook-mode-tabs">
                    <button
                        className={`notebook-mode-btn ${currentType === 'daily' ? 'active' : ''}`}
                        onClick={() => { setCurrentType('daily'); setSearchQuery(''); }}
                        title="日付順に時系列で綴る業務日誌・タイムラインログ"
                    >
                        <CalendarIcon size={15} /> 日付ログ (タイムライン)
                    </button>
                    <button
                        className={`notebook-mode-btn ${currentType === 'free' ? 'active' : ''}`}
                        onClick={() => { setCurrentType('free'); setSearchQuery(''); }}
                        title="テーマやタイトルごとに自由にまとめる思考ノート"
                    >
                        <FileText size={15} /> 自由帳 (トピック別)
                    </button>
                </div>

                {/* 検索バー */}
                <div className="notebook-search-box">
                    <Search size={14} className="search-icon" />
                    <input
                        type="text"
                        placeholder="ノート内を検索..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="notebook-search-input"
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                            <X size={13} />
                        </button>
                    )}
                </div>
            </header>

            {/* ナビゲーションバー (1枚ずつのページ送り ＆ ページインジケーター) */}
            <div className="notebook-page-toolbar glass">
                <div className="page-nav-controls">
                    <button
                        className="btn btn-sm btn-secondary page-arrow-btn"
                        onClick={handlePrevPage}
                        disabled={activeIndex <= 0}
                        title="前のページへ"
                    >
                        <ChevronLeft size={16} /> 前へ
                    </button>

                    <div className="page-indicator">
                        {filteredNotes.length > 0 ? (
                            <span>
                                <strong>{activeIndex + 1}</strong> / {filteredNotes.length} ページ
                                {searchQuery && <small style={{ marginLeft: '6px', color: '#6366f1' }}>(検索中)</small>}
                            </span>
                        ) : (
                            <span>0 / 0 ページ</span>
                        )}
                    </div>

                    <button
                        className="btn btn-sm btn-secondary page-arrow-btn"
                        onClick={handleNextPage}
                        disabled={activeIndex >= filteredNotes.length - 1}
                        title="次のページへ"
                    >
                        次へ <ChevronRight size={16} />
                    </button>
                </div>

                <div className="page-actions-controls">
                    {/* クイックページ切り替えドロップダウン */}
                    {filteredNotes.length > 0 && (
                        <select
                            className="page-select-dropdown"
                            value={activeNoteId || ''}
                            onChange={e => setActiveNoteId(e.target.value)}
                        >
                            {filteredNotes.map((n, idx) => (
                                <option key={n.id} value={n.id}>
                                    P.{idx + 1} : {n.date} - {n.title || '(無題)'}
                                </option>
                            ))}
                        </select>
                    )}

                    <button className="btn btn-sm btn-primary add-page-btn" onClick={handleCreatePage}>
                        <Plus size={15} /> 新しいページを追加
                    </button>
                </div>
            </div>

            {/* A4ノート画面本体 (画面に1枚ずつ表示) */}
            <div className="notebook-stage">
                {activeNote ? (
                    <div
                        className="notebook-sheet-a4"
                        style={{
                            backgroundColor: currentPaper.color,
                            color: currentPaper.textColor,
                            // ルーズリーフ風罫線
                            backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, ${currentPaper.lineColor} 31px, ${currentPaper.lineColor} 32px)`
                        }}
                    >
                        {/* シート上部: 用紙メタ情報・保護ロックバー */}
                        <div className="sheet-header-bar">
                            <div className="sheet-header-left">
                                {currentType === 'daily' ? (
                                    <div className="sheet-date-badge">
                                        <CalendarDays size={14} />
                                        <span>{activeNote.date}</span>
                                        {onViewChange && (
                                            <button
                                                className="jump-to-calendar-btn"
                                                onClick={() => onViewChange('calendar')}
                                                title="カレンダーでこの日の予定を確認"
                                            >
                                                カレンダーへ ↗
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="sheet-date-badge" onClick={() => { setAttachDateInput(activeNote.date); setShowDateModal(true); }} style={{ cursor: 'pointer' }}>
                                        <CalendarDays size={14} />
                                        <span>{activeNote.date ? `連動日: ${activeNote.date}` : '日付を紐付ける'}</span>
                                    </div>
                                )}
                            </div>

                            {/* ツール群: ロック切替、用紙色、画像添付、印刷、削除 */}
                            <div className="sheet-header-tools">
                                {/* 保護ロック切り替え (要件⑥: 基本ロック・誤消去防止) */}
                                <button
                                    className={`sheet-lock-btn ${activeNote.isLocked ? 'locked' : 'unlocked'}`}
                                    onClick={handleToggleLock}
                                    title={activeNote.isLocked ? '編集ロック中。クリックして解除' : '編集中。クリックしてロック（保存）'}
                                >
                                    {activeNote.isLocked ? (
                                        <>
                                            <Lock size={13} /> <span>保護中 (閲覧)</span>
                                        </>
                                    ) : (
                                        <>
                                            <Unlock size={13} /> <span>編集中 (解除中)</span>
                                        </>
                                    )}
                                </button>

                                {/* 用紙カラーピッカー (要件①: 下地の色変更) */}
                                {!activeNote.isLocked && (
                                    <div className="sheet-color-picker" title="用紙の色を変更">
                                        {NOTEBOOK_PAPERS.map(p => (
                                            <button
                                                key={p.id}
                                                className={`paper-color-dot ${activeNote.color === p.color ? 'active' : ''}`}
                                                style={{ backgroundColor: p.color, borderColor: p.textColor }}
                                                onClick={() => handleColorChange(p.color)}
                                                title={p.label}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* 画像添付 */}
                                {!activeNote.isLocked && (
                                    <label className="sheet-tool-btn" title="画像をアップロードして添付">
                                        <Image size={15} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleImageFileUpload}
                                        />
                                    </label>
                                )}

                                {/* 印刷 */}
                                <button className="sheet-tool-btn" onClick={handlePrint} title="A4印刷・PDF出力">
                                    <Printer size={15} />
                                </button>

                                {/* 削除 */}
                                {!activeNote.isLocked && (
                                    <button className="sheet-tool-btn danger" onClick={handleDelete} title="このページを削除">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 保護ロック中のインジケーターメッセージ */}
                        {activeNote.isLocked && (
                            <div className="sheet-locked-notice">
                                <Lock size={12} />
                                <span>誤操作・誤消去を防ぐため閲覧モードになっています。内容を編集する場合は右上の「保護中」ボタンを押してロックを解除してください。</span>
                            </div>
                        )}

                        {/* タイトル入力エリア */}
                        <div className="sheet-title-wrapper">
                            {activeNote.isLocked ? (
                                <h2 className="sheet-title-display">{activeNote.title || '(無題のノート)'}</h2>
                            ) : (
                                <input
                                    type="text"
                                    className="sheet-title-input"
                                    value={activeNote.title}
                                    onChange={e => handleTitleChange(e.target.value)}
                                    placeholder="ノートのタイトルを入力..."
                                />
                            )}
                        </div>

                        {/* 添付画像ギャラリー */}
                        {activeNote.images && activeNote.images.length > 0 && (
                            <div className="sheet-images-container">
                                {activeNote.images.map((imgSrc, imgIdx) => (
                                    <div key={imgIdx} className="sheet-image-card">
                                        <img src={imgSrc} alt={`添付画像 ${imgIdx + 1}`} />
                                        {!activeNote.isLocked && (
                                            <button
                                                className="image-delete-btn"
                                                onClick={() => handleDeleteImage(imgIdx)}
                                                title="画像を削除"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 本文エリア (横罫線に沿ったタイピング) */}
                        <div className="sheet-body-area">
                            {activeNote.isLocked ? (
                                <div className="sheet-content-readonly">
                                    {activeNote.content ? (
                                        renderContentWithLinks(activeNote.content)
                                    ) : (
                                        <p className="sheet-empty-text">内容がありません。「保護中」を解除してメモを書き始められます。</p>
                                    )}
                                </div>
                            ) : (
                                <textarea
                                    className="sheet-content-textarea"
                                    value={activeNote.content}
                                    onChange={e => handleContentChange(e.target.value)}
                                    placeholder="ここにA4ノートのメモを記入... (リンクや箇条書きも自由に入力できます)"
                                    rows={25}
                                    autoFocus
                                />
                            )}
                        </div>

                        {/* 用紙フッター */}
                        <div className="sheet-footer-bar">
                            <span className="sheet-meta-time">
                                作成: {new Date(activeNote.createdAt).toLocaleString('ja-JP')}
                            </span>
                            <span className="sheet-a4-stamp">A4 FORMAT • CHRONOS NOTEBOOK</span>
                        </div>
                    </div>
                ) : (
                    /* ページが1枚もない場合のガイド */
                    <div className="notebook-empty-stage glass">
                        <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <h3>{currentType === 'daily' ? '日付ログノートがありません' : '自由帳がありません'}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                            「新しいページを追加」ボタンから最初の1ページを作成してメモや議事録を書き始めましょう。
                        </p>
                        <button className="btn btn-primary" onClick={handleCreatePage}>
                            <Plus size={16} /> 最初のページを作成
                        </button>
                    </div>
                )}
            </div>

            {/* 自由帳の日付紐付けモーダル */}
            {showDateModal && (
                <div className="modal-backdrop" onClick={() => setShowDateModal(false)}>
                    <div className="modal-container glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
                        <div className="modal-header">
                            <h3>カレンダー連動日の設定</h3>
                            <button className="btn-close" onClick={() => setShowDateModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>
                                このノートをカレンダーの特定の日付に紐付けます。カレンダー側からも開けるようになります。
                            </p>
                            <input
                                type="date"
                                className="form-input"
                                value={attachDateInput}
                                onChange={e => setAttachDateInput(e.target.value)}
                                style={{ width: '100%', marginBottom: '16px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowDateModal(false)}>キャンセル</button>
                                <button className="btn btn-primary btn-sm" onClick={handleAttachDateSubmit}>設定する</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
