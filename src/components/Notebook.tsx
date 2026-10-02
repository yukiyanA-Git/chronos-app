import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { NotebookType } from '../types';
import {
    BookOpen, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight,
    Plus, Lock, Unlock, Search, Trash2, Image, ExternalLink,
    Printer, CalendarDays, X, Bookmark
} from 'lucide-react';

interface NotebookProps {
    onViewChange?: (view: string) => void;
}

// 用紙カラープリセット (下地色と罫線色)
export const NOTEBOOK_PAPERS = [
    { id: 'white', label: '白紙 (クラシック)', color: '#ffffff', textColor: '#1e293b', lineColor: 'rgba(59, 130, 246, 0.22)' },
    { id: 'ivory', label: '生成り (アイボリー)', color: '#fefcf3', textColor: '#292524', lineColor: 'rgba(217, 119, 6, 0.22)' },
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

    // モード切替: 'daily' (日付順ログ) / 'free' (自由帳) - 直前に開いていた状態を記憶
    const [currentType, setCurrentType] = useState<NotebookType>(() => {
        const saved = localStorage.getItem('chronos_last_notebook_type');
        return (saved === 'free' || saved === 'daily') ? saved : 'daily';
    });

    // 自由帳のノート冊子(本)リスト
    const freeBooks = useMemo(() => {
        const set = new Set<string>();
        notes.filter(n => n.type === 'free').forEach(n => {
            set.add(n.bookTitle || '自由帳 (メイン)');
        });
        if (set.size === 0) set.add('自由帳 (メイン)');
        return Array.from(set);
    }, [notes]);

    // 選択中のノート冊子(本)名 - 直前の選択を記憶
    const [selectedBook, setSelectedBook] = useState<string>(() => {
        return localStorage.getItem('chronos_last_notebook_book') || '自由帳 (メイン)';
    });

    // 新規ノート(冊)作成ダイアログ
    const [showNewBookModal, setShowNewBookModal] = useState(false);
    const [newBookTitleInput, setNewBookTitleInput] = useState('');

    // 過去・指定日付での新規ページ作成ダイアログ
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [customDateInput, setCustomDateInput] = useState(() => new Date().toLocaleDateString('sv-SE'));

    // 検索キーワード
    const [searchQuery, setSearchQuery] = useState('');

    // 現在選択中のノートID - 直前の開いていたページを記憶
    const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
        return localStorage.getItem('chronos_last_notebook_note_id') || null;
    });

    // 状態変更時にローカル記憶へ同期保存 (カレンダー等に移動しても戻った時に直前の状態を完全復元)
    useEffect(() => {
        localStorage.setItem('chronos_last_notebook_type', currentType);
    }, [currentType]);

    useEffect(() => {
        localStorage.setItem('chronos_last_notebook_book', selectedBook);
    }, [selectedBook]);

    useEffect(() => {
        if (activeNoteId) {
            localStorage.setItem('chronos_last_notebook_note_id', activeNoteId);
        }
    }, [activeNoteId]);

    // カレンダー貼付用ダイアログ (自由帳用)
    const [showDateModal, setShowDateModal] = useState(false);
    const [attachDateInput, setAttachDateInput] = useState('');

    // 現在の選択冊子がfreeBooksにない場合は先頭にフォールバック
    useEffect(() => {
        if (freeBooks.length > 0 && !freeBooks.includes(selectedBook)) {
            setSelectedBook(freeBooks[0]);
        }
    }, [freeBooks, selectedBook]);

    // タイプと検索・冊子でフィルタリングしたノート一覧
    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            const noteType = n.type || 'daily';
            if (noteType !== currentType) return false;

            // 自由帳モード時は選択中の本(冊)で絞り込み (検索中以外)
            if (currentType === 'free' && !searchQuery.trim()) {
                const book = n.bookTitle || '自由帳 (メイン)';
                if (book !== selectedBook) return false;
            }

            // 検索ワード判定 (タイトル、本文、日付、本名)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (n.title || '').toLowerCase().includes(q);
                const matchContent = (n.content || '').toLowerCase().includes(q);
                const matchDate = (n.date || '').toLowerCase().includes(q);
                const matchBook = (n.bookTitle || '').toLowerCase().includes(q);
                return matchTitle || matchContent || matchDate || matchBook;
            }
            return true;
        }).sort((a, b) => {
            if (currentType === 'daily') {
                // 日付順（新しい日付順、同日内は作成日昇順）
                return b.date.localeCompare(a.date) || a.createdAt.localeCompare(b.createdAt);
            } else {
                // 自由帳: ページ番号順 (作成日時昇順)
                if (a.pageNumber !== undefined && b.pageNumber !== undefined) {
                    return a.pageNumber - b.pageNumber;
                }
                return a.createdAt.localeCompare(b.createdAt);
            }
        });
    }, [notes, currentType, selectedBook, searchQuery]);

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

    // アクティブノートの選択（リスト変更時に範囲外なら保存済みIDまたは先頭を選択）
    useEffect(() => {
        if (filteredNotes.length > 0) {
            if (!activeNoteId || !filteredNotes.some(n => n.id === activeNoteId)) {
                const savedId = localStorage.getItem('chronos_last_notebook_note_id');
                const matched = filteredNotes.find(n => n.id === savedId);
                setActiveNoteId(matched ? matched.id : filteredNotes[0].id);
            }
        } else {
            setActiveNoteId(null);
        }
    }, [filteredNotes, activeNoteId]);

    const activeIndex = filteredNotes.findIndex(n => n.id === activeNoteId);
    const activeNote = filteredNotes.find(n => n.id === activeNoteId);

    // 新規ノート冊子(本)の作成
    const handleConfirmCreateNewBook = () => {
        const title = newBookTitleInput.trim() || `新しいノート ${freeBooks.length + 1}`;
        setSelectedBook(title);
        setShowNewBookModal(false);
        setNewBookTitleInput('');

        // 作成した冊子の第1ページ目を即座に生成
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const newId = addNotebookNote({
            title: `${title} - 1ページ`,
            content: '',
            type: 'free',
            bookTitle: title,
            pageNumber: 1,
            date: todayStr,
            color: '#ffffff',
            isLocked: false
        });
        setActiveNoteId(newId);
    };

    // 新規ページ作成 (今日のページ、または自由帳の次のページを追加)
    const handleCreatePage = () => {
        const todayStr = new Date().toLocaleDateString('sv-SE');
        let newTitle = '';
        if (currentType === 'daily') {
            const sameDayNotes = notes.filter(n => n.type === 'daily' && n.date === todayStr);
            newTitle = sameDayNotes.length > 0
                ? `${todayStr} デイリーログ (#${sameDayNotes.length + 1})`
                : `${todayStr} デイリーログ`;

            const newId = addNotebookNote({
                title: newTitle,
                content: '',
                type: 'daily',
                date: todayStr,
                color: activeNote?.color || '#ffffff',
                isLocked: false
            });
            setActiveNoteId(newId);
        } else {
            // 自由帳: 現在選択中の本(冊)の末尾に次のページを追加
            const currentBookNotes = notes.filter(n => n.type === 'free' && (n.bookTitle || '自由帳 (メイン)') === selectedBook);
            const nextPageNum = currentBookNotes.length + 1;
            newTitle = `${selectedBook} - ${nextPageNum}ページ`;

            const newId = addNotebookNote({
                title: newTitle,
                content: '',
                type: 'free',
                bookTitle: selectedBook,
                pageNumber: nextPageNum,
                date: todayStr,
                color: activeNote?.color || '#ffffff',
                isLocked: false
            });
            setActiveNoteId(newId);
        }
    };

    // 過去日付・指定日付での新規ページ作成
    const handleCreatePageWithDate = (targetDate: string) => {
        if (!targetDate) return;
        const sameDayNotes = notes.filter(n => n.type === 'daily' && n.date === targetDate);
        const newTitle = sameDayNotes.length > 0
            ? `${targetDate} デイリーログ (#${sameDayNotes.length + 1})`
            : `${targetDate} デイリーログ`;

        const newId = addNotebookNote({
            title: newTitle,
            content: '',
            type: 'daily',
            date: targetDate,
            color: activeNote?.color || '#ffffff',
            isLocked: false
        });
        setActiveNoteId(newId);
        setShowCustomDateModal(false);
    };

    // 既存ノートの日付変更 (連動処理: タイムライン自動挿入・再整列、カレンダー連動、タイトル調整)
    const handleDateChange = (newDate: string) => {
        if (!activeNote || !newDate || newDate === activeNote.date) return;
        const oldDate = activeNote.date;
        let newTitle = activeNote.title;

        // 日付ログでタイトルに旧日付が含まれている場合、新日付に更新
        if (activeNote.type === 'daily' && (!activeNote.title || activeNote.title.includes(oldDate))) {
            const otherNotesOnNewDate = notes.filter(n => n.id !== activeNote.id && n.type === 'daily' && n.date === newDate);
            if (otherNotesOnNewDate.length > 0) {
                newTitle = `${newDate} デイリーログ (#${otherNotesOnNewDate.length + 1})`;
            } else {
                newTitle = `${newDate} デイリーログ`;
            }
        }
        updateNotebookNote(activeNote.id, { date: newDate, title: newTitle });
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

    // 用紙カラー変更
    const handleColorChange = (color: string) => {
        if (!activeNote || activeNote.isLocked) return;
        updateNotebookNote(activeNote.id, { color });
    };

    // ページ削除
    const handleDelete = () => {
        if (!activeNote || activeNote.isLocked) return;
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

    // 印刷・PDF出力
    const handlePrint = () => {
        window.print();
    };

    // ハイパーリンク描画ヘルパー
    const renderLineContent = (line: string) => {
        if (!line) return <span>&nbsp;</span>;
        const parts = line.split(/(https?:\/\/[^\s]+)/g);
        return parts.map((part, pIdx) => {
            if (part.match(/^https?:\/\//)) {
                return (
                    <a
                        key={pIdx}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="notebook-inline-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part} <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </a>
                );
            }
            return <span key={pIdx}>{part}</span>;
        });
    };

    const currentPaper = NOTEBOOK_PAPERS.find(p => p.color === activeNote?.color) || NOTEBOOK_PAPERS[0];

    return (
        <section id="view-notebook" className="view-section active">
            {/* 上部ヘッダー */}
            <header className="view-header notebook-view-header">
                <div className="notebook-title-area">
                    <h1><BookOpen size={22} /> ノート</h1>
                    <span className="notebook-beta-badge">A4ルーズリーフ調</span>
                </div>

                {/* モード切替タブ (日付ログ vs 自由帳) */}
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
                        title="テーマやタイトルごとに自由にまとめる思考ノート (冊数管理)"
                    >
                        <FileText size={15} /> 自由帳 (ノート冊子別)
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

            {/* 自由帳モード時: 本(冊)の選択シェルフ (要件②: 冊数と見たい本・書きたい本の選び方) */}
            {currentType === 'free' && (
                <div className="notebook-bookshelf-bar glass">
                    <div className="bookshelf-header">
                        <span className="bookshelf-label">
                            <Bookmark size={15} /> <strong>ノート冊子 (本) を選択:</strong>
                        </span>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary add-book-btn"
                            onClick={() => { setNewBookTitleInput(''); setShowNewBookModal(true); }}
                            title="新しいノート(冊)を追加"
                        >
                            <Plus size={14} /> ＋ 新しいノート(冊)を作成
                        </button>
                    </div>
                    <div className="bookshelf-tabs-row">
                        {freeBooks.map(book => {
                            const count = notes.filter(n => n.type === 'free' && (n.bookTitle || '自由帳 (メイン)') === book).length;
                            const isSelected = selectedBook === book;
                            return (
                                <button
                                    key={book}
                                    type="button"
                                    className={`book-pill-tab ${isSelected ? 'active' : ''}`}
                                    onClick={() => { setSelectedBook(book); }}
                                >
                                    <span className="book-pill-icon">{isSelected ? '📖' : '📕'}</span>
                                    <span className="book-pill-title">{book}</span>
                                    <span className="book-pill-badge">{count}P</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ページ一覧タブ ＆ ページ送りツールバー (要件①: 次のページへの移り方・ページ送り) */}
            <div className="notebook-page-strip-container glass">
                <div className="page-strip-nav">
                    <button
                        className="btn btn-sm btn-secondary page-arrow-btn"
                        onClick={handlePrevPage}
                        disabled={activeIndex <= 0}
                        title="前のページへ"
                    >
                        <ChevronLeft size={16} /> 前へ
                    </button>

                    {/* クリックで直接ジャンプできるページチップ一覧 */}
                    <div className="page-strip-pills">
                        {filteredNotes.length === 0 ? (
                            <span className="page-strip-empty">ページがありません</span>
                        ) : (
                            filteredNotes.map((n, idx) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={`page-chip ${activeNoteId === n.id ? 'active' : ''}`}
                                    onClick={() => setActiveNoteId(n.id)}
                                    title={`P.${idx + 1}: ${n.date} - ${n.title || '(無題)'}`}
                                >
                                    <span className="chip-pnum">P.{idx + 1}</span>
                                    <span className="chip-title">
                                        {currentType === 'daily'
                                            ? `${n.date}${n.title && n.title.includes('(#') ? ` ${n.title.slice(n.title.indexOf('(#'))}` : ''}`
                                            : (n.title || `ページ ${idx + 1}`)
                                        }
                                    </span>
                                </button>
                            ))
                        )}
                        <button
                            type="button"
                            className="page-chip add-page-chip"
                            onClick={handleCreatePage}
                            title={currentType === 'daily' ? "本日の新しいページを追加" : "この本に次のページを追加"}
                        >
                            <Plus size={13} /> {currentType === 'daily' ? '＋ 今日のページ' : '＋ 次のページを追加'}
                        </button>
                        {currentType === 'daily' && (
                            <button
                                type="button"
                                className="page-chip add-date-page-chip"
                                onClick={() => {
                                    setCustomDateInput(new Date().toLocaleDateString('sv-SE'));
                                    setShowCustomDateModal(true);
                                }}
                                title="過去の日付や指定日を選んでノートを作成"
                            >
                                <CalendarIcon size={12} /> ＋ 日付を指定して作成
                            </button>
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
            </div>

            {/* A4ノート画面本体 (画面に1枚ずつ表示) */}
            <div className="notebook-stage">
                {activeNote ? (
                    <div
                        className="notebook-sheet-a4"
                        style={{
                            backgroundColor: currentPaper.color,
                            color: currentPaper.textColor,
                            // 下線用カラー変数を定義 (本文エリアのみで整列線を描画)
                            '--paper-line-color': currentPaper.lineColor
                        } as React.CSSProperties}
                    >
                        {/* シート上部: 用紙メタ情報・保護ロックバー */}
                        <div className="sheet-header-bar">
                            <div className="sheet-header-left">
                                {currentType === 'daily' ? (
                                    !activeNote.isLocked ? (
                                        /* 編集可能時は日付ピッカーで直接日付を変更可能 (過去日付変更・連動) */
                                        <div className="sheet-date-editor-box" title="クリックして日付を変更（カレンダーや時系列順も自動連動します）">
                                            <CalendarDays size={14} className="sheet-date-icon" />
                                            <input
                                                type="date"
                                                className="sheet-date-picker-input"
                                                value={activeNote.date}
                                                onChange={e => handleDateChange(e.target.value)}
                                            />
                                            <span className="sheet-date-hint">日付変更可</span>
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
                                    )
                                ) : (
                                    <div
                                        className="sheet-date-badge"
                                        onClick={() => { setAttachDateInput(activeNote.date || ''); setShowDateModal(true); }}
                                        style={{ cursor: 'pointer' }}
                                        title="クリックしてカレンダー連動日を設定・変更"
                                    >
                                        <BookOpen size={14} />
                                        <span style={{ fontWeight: 700 }}>{activeNote.bookTitle || selectedBook}</span>
                                        <span className="sheet-pnum-badge">Page {activeIndex + 1}/{filteredNotes.length}</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '6px' }}>
                                            {activeNote.date ? `(連動日: ${activeNote.date})` : 'カレンダー紐付け'}
                                        </span>
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

                        {/* 保護ロック中の案内メッセージ */}
                        {activeNote.isLocked && (
                            <div className="sheet-locked-notice">
                                <Lock size={12} />
                                <span>誤操作・誤消去を防ぐため閲覧モードになっています。内容や日付を編集する場合は右上の「保護中」ボタンを押してロックを解除してください。</span>
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

                        {/* 本文エリア (要件③: 下線と文字の位置ずれを完全に解消) */}
                        <div className="sheet-body-area">
                            {activeNote.isLocked ? (
                                <div className="sheet-content-readonly">
                                    {activeNote.content ? (
                                        activeNote.content.split('\n').map((line, lIdx) => (
                                            <div
                                                key={lIdx}
                                                className="sheet-ruled-line"
                                                style={{ borderBottomColor: currentPaper.lineColor }}
                                            >
                                                {renderLineContent(line)}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="sheet-empty-text">内容がありません。「保護中」を解除してメモを書き始められます。</p>
                                    )}
                                </div>
                            ) : (
                                <textarea
                                    className="sheet-content-textarea"
                                    value={activeNote.content}
                                    onChange={e => handleContentChange(e.target.value)}
                                    placeholder="文字を記入... (リンクや箇条書きも自由に入力できます)"
                                    rows={25}
                                    autoFocus
                                />
                            )}
                        </div>

                        {/* 用紙下部: ページめくりフッターバー (要件①: 次のページへの移り方が一目瞭然) */}
                        <div className="sheet-page-turn-footer">
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary sheet-page-btn"
                                onClick={handlePrevPage}
                                disabled={activeIndex <= 0}
                            >
                                <ChevronLeft size={16} /> 前のページ (P.{activeIndex})
                            </button>

                            <div className="sheet-page-center-info">
                                <strong>Page {activeIndex + 1}</strong> / {filteredNotes.length}
                                {currentType === 'free' ? (
                                    <span className="sheet-book-tag">📖 {selectedBook}</span>
                                ) : (
                                    <span className="sheet-book-tag">🗓️ {activeNote.date}</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                {activeIndex < filteredNotes.length - 1 ? (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary sheet-page-btn"
                                        onClick={handleNextPage}
                                    >
                                        次のページ (P.{activeIndex + 2}) <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary sheet-page-btn add-next-btn"
                                        onClick={handleCreatePage}
                                    >
                                        <Plus size={14} /> ＋ 次のページを追加
                                    </button>
                                )}
                                {currentType === 'daily' && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary sheet-page-btn"
                                        onClick={() => {
                                            setCustomDateInput(new Date().toLocaleDateString('sv-SE'));
                                            setShowCustomDateModal(true);
                                        }}
                                        title="過去の日付や指定日を選んでノートを作成"
                                    >
                                        <CalendarIcon size={13} /> ＋ 日付指定作成
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ページが1枚もない場合のガイド */
                    <div className="notebook-empty-stage glass">
                        <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <h3>{currentType === 'daily' ? '日付ログノートがありません' : `「${selectedBook}」にページがありません`}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                            「次のページを追加」ボタンから最初の1ページを作成してメモや議事録を書き始めましょう。
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={handleCreatePage}>
                                <Plus size={16} /> 最初のページを作成
                            </button>
                            {currentType === 'daily' && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setCustomDateInput(new Date().toLocaleDateString('sv-SE'));
                                        setShowCustomDateModal(true);
                                    }}
                                >
                                    <CalendarIcon size={16} /> 日付を指定して作成
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 新しいノート冊子(本)の作成モーダル */}
            {showNewBookModal && (
                <div className="modal-backdrop" onClick={() => setShowNewBookModal(false)}>
                    <div className="modal-container glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3><BookOpen size={18} /> 新しいノート（冊）を作成</h3>
                            <button className="btn-close" onClick={() => setShowNewBookModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
                                用途やテーマごとに新しいノート冊子を作成します。<br />
                                （例: 企画アイデア帳、業務マニュアル、読書メモ、議事録など）
                            </p>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                                ノートの名前（冊名）:
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="例: 企画アイデアノート"
                                value={newBookTitleInput}
                                onChange={e => setNewBookTitleInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleConfirmCreateNewBook(); }}
                                autoFocus
                                style={{ width: '100%', marginBottom: '16px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewBookModal(false)}>キャンセル</button>
                                <button className="btn btn-primary btn-sm" onClick={handleConfirmCreateNewBook}>作成して開く</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 過去日付・指定日付でのノート作成モーダル */}
            {showCustomDateModal && (
                <div className="modal-backdrop" onClick={() => setShowCustomDateModal(false)}>
                    <div className="modal-container glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3><CalendarDays size={18} /> 日付を指定してノートを作成</h3>
                            <button className="btn-close" onClick={() => setShowCustomDateModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
                                過去の付箋メモの転記や、過去の議事録・日誌を過去日付で作成できます。<br />
                                作成したページは時系列順に自動で既存ページの間へ挿入され、カレンダーにも反映されます。
                            </p>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                                    ノートの日付:
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={customDateInput}
                                    onChange={e => setCustomDateInput(e.target.value)}
                                    style={{ width: '100%', fontSize: '0.95rem' }}
                                />
                            </div>

                            {/* クイック選択ショートカット */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                    onClick={() => {
                                        const d = new Date();
                                        setCustomDateInput(d.toLocaleDateString('sv-SE'));
                                    }}
                                >
                                    今日
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 1);
                                        setCustomDateInput(d.toLocaleDateString('sv-SE'));
                                    }}
                                >
                                    昨日
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 2);
                                        setCustomDateInput(d.toLocaleDateString('sv-SE'));
                                    }}
                                >
                                    2日前
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 7);
                                        setCustomDateInput(d.toLocaleDateString('sv-SE'));
                                    }}
                                >
                                    1週間前
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowCustomDateModal(false)}>キャンセル</button>
                                <button className="btn btn-primary btn-sm" onClick={() => handleCreatePageWithDate(customDateInput)}>作成して開く</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                このノートページをカレンダーの特定の日付に紐付けます。カレンダー側からも開けるようになります。
                            </p>
                            <input
                                type="date"
                                className="form-input"
                                value={attachDateInput}
                                onChange={e => setAttachDateInput(e.target.value)}
                                style={{ width: '100%', marginBottom: '16px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {activeNote?.date && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginRight: 'auto', color: '#ef4444' }}
                                        onClick={() => {
                                            updateNotebookNote(activeNote.id, { date: '' });
                                            setShowDateModal(false);
                                        }}
                                    >
                                        連動を解除
                                    </button>
                                )}
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
