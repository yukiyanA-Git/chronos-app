import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { NotebookType } from '../types';
import {
    BookOpen, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight,
    Plus, Lock, Unlock, Search, Trash2, Image, ExternalLink,
    Printer, CalendarDays, X, Bookmark, Edit3
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
        targetNotebookDate, setTargetNotebookDate, isPremium
    } = useApp();

    const notes = data.notebookNotes || [];
    const MAX_FREE_BOOKS = 10; // 無料プラン時の自由帳上限 (プレミアムプラン時は無制限)

    // モード切替: 'daily' (日付順ログ) / 'free' (自由帳) - 直前に開いていた状態を記憶
    const [currentType, setCurrentType] = useState<NotebookType>(() => {
        const saved = localStorage.getItem('chronos_last_notebook_type');
        return (saved === 'free' || saved === 'daily') ? saved : 'daily';
    });

    // 自由帳のノート冊子(本)の並び順状態
    const [freeBooksOrder, setFreeBooksOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('chronos_notebook_books_order');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // ノート（冊）名の標準化 (旧「自由 (メイン)」「自由帳 (メイン)」「自由ノート (メイン)」を「無題」に移行)
    const normalizeBookTitle = (title?: string) => {
        if (!title || title === '自由帳 (メイン)' || title === '自由 (メイン)' || title === '自由ノート (メイン)') {
            return '無題';
        }
        return title;
    };

    // ページタイトルのクリーンアップ (旧デフォルト「自由 (メイン) - 1ページ」等を「1ページ」等に整える)
    const cleanLegacyPageTitle = (title: string, pageNum?: number) => {
        const trimmed = (title || '').trim();
        if (!trimmed) return pageNum ? `${pageNum}ページ` : '';
        const legacyPattern = /^(?:自由(?:\s*\(メイン\)|帳\s*\(メイン\)|ノート\s*\(メイン\))?|無題(?:\d+)?)\s*-\s*(\d+ページ)$/;
        const match = trimmed.match(legacyPattern);
        if (match) {
            return match[1];
        }
        return trimmed;
    };

    // 自由ノートのリスト (並び替え対応)
    const freeBooks = useMemo(() => {
        const allBookTitles = new Set<string>();
        notes.filter(n => n.type === 'free').forEach(n => {
            allBookTitles.add(normalizeBookTitle(n.bookTitle));
        });
        if (allBookTitles.size === 0) allBookTitles.add('無題');

        const result: string[] = [];
        freeBooksOrder.forEach(title => {
            const normTitle = normalizeBookTitle(title);
            if (allBookTitles.has(normTitle) && !result.includes(normTitle)) {
                result.push(normTitle);
                allBookTitles.delete(normTitle);
            }
        });
        allBookTitles.forEach(title => result.push(title));
        return result;
    }, [notes, freeBooksOrder]);

    // 次の新規ノートのデフォルト名（無題、無題２、無題３...）
    const nextDefaultBookTitle = useMemo(() => {
        if (!freeBooks.includes('無題')) return '無題';
        let num = 2;
        while (freeBooks.includes(`無題${num}`) || freeBooks.includes(`無題 ${num}`)) {
            num++;
        }
        return `無題${num}`;
    }, [freeBooks]);

    // ノート作成上限（10冊）到達判定 (無料プラン時10冊、プレミアム時は無制限)
    const isBookLimitReached = !isPremium && freeBooks.length >= MAX_FREE_BOOKS;

    // 選択中のノート名 - 直前の選択を記憶
    const [selectedBook, setSelectedBook] = useState<string>(() => {
        const saved = localStorage.getItem('chronos_last_notebook_book');
        return normalizeBookTitle(saved || undefined);
    });

    // 新規ノート(冊)作成ダイアログ
    const [showNewBookModal, setShowNewBookModal] = useState(false);
    const [newBookTitleInput, setNewBookTitleInput] = useState('');

    // ノート名変更ダイアログ
    const [showRenameBookModal, setShowRenameBookModal] = useState(false);
    const [renameBookInput, setRenameBookInput] = useState('');

    // ノート作成上限案内・プレミアム案内モーダル
    const [showBookLimitModal, setShowBookLimitModal] = useState(false);

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

            // 自由ノートモード時は選択中のノートで絞り込み (検索中以外)
            if (currentType === 'free' && !searchQuery.trim()) {
                const book = normalizeBookTitle(n.bookTitle);
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

    // 新規ノートの作成
    const handleConfirmCreateNewBook = () => {
        if (isBookLimitReached) {
            setShowNewBookModal(false);
            setShowBookLimitModal(true);
            return;
        }
        const title = newBookTitleInput.trim() || nextDefaultBookTitle;
        setSelectedBook(title);
        setShowNewBookModal(false);
        setNewBookTitleInput('');

        // 作成したノートの第1ページ目を即座に生成
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const newId = addNotebookNote({
            title: '1ページ',
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

    // 選択中ノートの名前変更
    const handleOpenRenameBook = () => {
        setRenameBookInput(selectedBook);
        setShowRenameBookModal(true);
    };

    const handleConfirmRenameBook = () => {
        const newTitle = renameBookInput.trim();
        if (!newTitle || newTitle === selectedBook) {
            setShowRenameBookModal(false);
            return;
        }
        if (freeBooks.includes(newTitle)) {
            alert(`「${newTitle}」という名前のノートは既に存在します。別の名前を入力してください。`);
            return;
        }

        // このノートに属する全ページのbookTitleを一括更新
        notes.filter(n => n.type === 'free' && normalizeBookTitle(n.bookTitle) === selectedBook).forEach(n => {
            updateNotebookNote(n.id, { bookTitle: newTitle });
        });

        // 並び順リストの更新
        const newOrder = freeBooksOrder.map(b => normalizeBookTitle(b) === selectedBook ? newTitle : b);
        if (!newOrder.includes(newTitle)) newOrder.push(newTitle);
        setFreeBooksOrder(newOrder);
        localStorage.setItem('chronos_notebook_books_order', JSON.stringify(newOrder));

        setSelectedBook(newTitle);
        localStorage.setItem('chronos_last_notebook_book', newTitle);
        setShowRenameBookModal(false);
    };

    // 新規ページ作成 (今日のページ、または次のページを追加)
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
            // 自由ノート: 現在選択中のノートの末尾に次のページを追加
            const currentBookNotes = notes.filter(n => n.type === 'free' && normalizeBookTitle(n.bookTitle) === selectedBook);
            const nextPageNum = currentBookNotes.length + 1;
            newTitle = `${nextPageNum}ページ`;

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

    // 自由帳: ページの順番入れ替え (前へ / 後ろへ)
    const handleMovePage = (direction: 'prev' | 'next') => {
        if (!activeNote || currentType !== 'free') return;
        const currIdx = filteredNotes.findIndex(n => n.id === activeNote.id);
        if (currIdx === -1) return;
        const targetIdx = direction === 'prev' ? currIdx - 1 : currIdx + 1;
        if (targetIdx < 0 || targetIdx >= filteredNotes.length) return;

        const newNotes = [...filteredNotes];
        const temp = newNotes[currIdx];
        newNotes[currIdx] = newNotes[targetIdx];
        newNotes[targetIdx] = temp;

        newNotes.forEach((n, idx) => {
            updateNotebookNote(n.id, { pageNumber: idx + 1 });
        });
    };

    // 自由帳: 冊子(本)の並び順入れ替え (左へ / 右へ)
    const handleMoveBook = (direction: 'left' | 'right') => {
        const currIdx = freeBooks.indexOf(selectedBook);
        if (currIdx === -1) return;
        const targetIdx = direction === 'left' ? currIdx - 1 : currIdx + 1;
        if (targetIdx < 0 || targetIdx >= freeBooks.length) return;

        const newBooks = [...freeBooks];
        const temp = newBooks[currIdx];
        newBooks[currIdx] = newBooks[targetIdx];
        newBooks[targetIdx] = temp;

        setFreeBooksOrder(newBooks);
        localStorage.setItem('chronos_notebook_books_order', JSON.stringify(newBooks));
    };

    // モード切替: 日付ログへ（本日が優先、なければ直近）
    const handleSwitchToDaily = () => {
        setCurrentType('daily');
        setSearchQuery('');
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const todayNote = notes.find(n => (n.type || 'daily') === 'daily' && n.date === todayStr);
        if (todayNote) {
            setActiveNoteId(todayNote.id);
        } else {
            const sortedDaily = notes
                .filter(n => (n.type || 'daily') === 'daily')
                .sort((a, b) => b.date.localeCompare(a.date) || a.createdAt.localeCompare(b.createdAt));
            if (sortedDaily.length > 0) {
                setActiveNoteId(sortedDaily[0].id);
            }
        }
    };

    // モード切替: 自由ノートへ
    const handleSwitchToFree = () => {
        setCurrentType('free');
        setSearchQuery('');
        const bookNotes = notes
            .filter(n => n.type === 'free' && normalizeBookTitle(n.bookTitle) === selectedBook)
            .sort((a, b) => {
                if (a.pageNumber !== undefined && b.pageNumber !== undefined) {
                    return a.pageNumber - b.pageNumber;
                }
                return a.createdAt.localeCompare(b.createdAt);
            });
        if (bookNotes.length > 0) {
            const savedId = localStorage.getItem('chronos_last_notebook_note_id');
            const matched = bookNotes.find(n => n.id === savedId);
            setActiveNoteId(matched ? matched.id : bookNotes[0].id);
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

                {/* モード切替タブ (日付ログ vs 自由ノート) */}
                <div className="notebook-mode-tabs">
                    <button
                        className={`notebook-mode-btn ${currentType === 'daily' ? 'active' : ''}`}
                        onClick={handleSwitchToDaily}
                        title="日付順に時系列で綴る業務日誌・タイムラインログ (本日優先)"
                    >
                        <CalendarIcon size={15} /> 日付ログ (タイムライン)
                    </button>
                    <button
                        className={`notebook-mode-btn ${currentType === 'free' ? 'active' : ''}`}
                        onClick={handleSwitchToFree}
                        title="テーマやタイトルごとに自由にまとめるノート (10冊まで)"
                    >
                        <FileText size={15} /> 自由ノート
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

            {/* 自由ノート時: ノート選択バー */}
            {currentType === 'free' && (
                <div className="notebook-bookshelf-bar glass">
                    <div className="bookshelf-header">
                        <span className="bookshelf-label">
                            <Bookmark size={15} /> <strong>ノートを選択:</strong>
                            <span style={{
                                fontSize: '0.75rem',
                                marginLeft: '8px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: isPremium ? 'rgba(16, 185, 129, 0.15)' : isBookLimitReached ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                color: isPremium ? '#10b981' : isBookLimitReached ? '#ef4444' : 'inherit',
                                fontWeight: 600
                            }}>
                                {isPremium ? '👑 無制限 (プレミアム)' : `${freeBooks.length}/${MAX_FREE_BOOKS}冊`}
                            </span>
                        </span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={handleOpenRenameBook}
                                title="選択中のノートの名前を変更"
                                style={{ padding: '3px 9px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                                <Edit3 size={13} /> 名前変更
                            </button>
                            {freeBooks.length > 1 && (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '4px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleMoveBook('left')}
                                        disabled={freeBooks.indexOf(selectedBook) <= 0}
                                        title="選択中のノートを左へ並び替え"
                                        style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    >
                                        <ChevronLeft size={13} /> 左へ移動
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleMoveBook('right')}
                                        disabled={freeBooks.indexOf(selectedBook) >= freeBooks.length - 1}
                                        title="選択中のノートを右へ並び替え"
                                        style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                    >
                                        右へ移動 <ChevronRight size={13} />
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                className={`btn btn-sm ${isBookLimitReached ? 'btn-secondary' : 'btn-outline-primary'} add-book-btn`}
                                onClick={() => {
                                    if (isBookLimitReached) {
                                        setShowBookLimitModal(true);
                                    } else {
                                        setNewBookTitleInput('');
                                        setShowNewBookModal(true);
                                    }
                                }}
                                title={isBookLimitReached ? "上限（10冊）に達しています" : "新しいノートを作成"}
                            >
                                <Plus size={14} /> 新しいノートを作成
                            </button>
                        </div>
                    </div>
                    <div className="bookshelf-tabs-row">
                        {freeBooks.map(book => {
                            const count = notes.filter(n => n.type === 'free' && normalizeBookTitle(n.bookTitle) === book).length;
                            const isSelected = selectedBook === book;
                            return (
                                <button
                                    key={book}
                                    type="button"
                                    className={`book-pill-tab ${isSelected ? 'active' : ''}`}
                                    onClick={() => { setSelectedBook(book); }}
                                    onDoubleClick={handleOpenRenameBook}
                                    title={isSelected ? "ダブルクリックまたは「名前変更」でノート名を編集" : `「${book}」に切り替え`}
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
                                    title={`P.${idx + 1}: ${n.date} - ${cleanLegacyPageTitle(n.title, idx + 1) || '(タイトルなし)'}`}
                                >
                                    <span className="chip-pnum">P.{idx + 1}</span>
                                    <span className="chip-title">
                                        {currentType === 'daily'
                                            ? `${n.date}${n.title && n.title.includes('(#') ? ` ${n.title.slice(n.title.indexOf('(#'))}` : ''}`
                                            : (cleanLegacyPageTitle(n.title, idx + 1) || `${idx + 1}ページ`)
                                        }
                                    </span>
                                </button>
                            ))
                        )}
                        <button
                            type="button"
                            className="page-chip add-page-chip"
                            onClick={handleCreatePage}
                            title={currentType === 'daily' ? "本日の新しいページを追加" : "このノートに次のページを追加"}
                        >
                            <Plus size={13} /> {currentType === 'daily' ? '今日のページ' : '次のページを追加'}
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
                                <CalendarIcon size={12} /> 日付を指定して作成
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

                    {/* 自由帳: ページの並び替え (前へ / 後ろへ) */}
                    {currentType === 'free' && filteredNotes.length > 1 && (
                        <div className="page-reorder-nav-group" style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '0.72rem', opacity: 0.75, whiteSpace: 'nowrap' }}>順序入替:</span>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleMovePage('prev')}
                                disabled={activeIndex <= 0}
                                title="このページを1つ前へ入れ替え"
                                style={{ padding: '2px 7px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
                            >
                                <ChevronLeft size={12} /> 前へ入替
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleMovePage('next')}
                                disabled={activeIndex >= filteredNotes.length - 1}
                                title="このページを1つ後へ入れ替え"
                                style={{ padding: '2px 7px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
                            >
                                後へ入替 <ChevronRight size={12} />
                            </button>
                        </div>
                    )}
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
                                        <span style={{ fontWeight: 700 }}>{normalizeBookTitle(activeNote.bookTitle || selectedBook)}</span>
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
                                <h2 className="sheet-title-display">{cleanLegacyPageTitle(activeNote.title, activeNote.pageNumber) || '(タイトルなし)'}</h2>
                            ) : (
                                <input
                                    type="text"
                                    className="sheet-title-input"
                                    value={cleanLegacyPageTitle(activeNote.title, activeNote.pageNumber)}
                                    onChange={e => handleTitleChange(e.target.value)}
                                    placeholder="ページのタイトルを入力（例: 企画メモ、議事録）..."
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
                                    <>
                                        <span className="sheet-book-tag">📖 {selectedBook}</span>
                                        {filteredNotes.length > 1 && (
                                            <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '6px' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleMovePage('prev')}
                                                    disabled={activeIndex <= 0}
                                                    title="このページを前に移動"
                                                    style={{ padding: '1px 6px', fontSize: '0.7rem' }}
                                                >
                                                    ◀ 順序前へ
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleMovePage('next')}
                                                    disabled={activeIndex >= filteredNotes.length - 1}
                                                    title="このページを後に移動"
                                                    style={{ padding: '1px 6px', fontSize: '0.7rem' }}
                                                >
                                                    順序後へ ▶
                                                </button>
                                            </span>
                                        )}
                                    </>
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
                                        <Plus size={14} /> 次のページを追加
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
                                        <CalendarIcon size={13} /> 日付を指定して作成
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

            {/* 新しいノート作成モーダル */}
            {showNewBookModal && (
                <div className="modal-overlay" onClick={() => setShowNewBookModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3><BookOpen size={18} /> 新しいノートを作成</h3>
                            <button className="btn-close" onClick={() => setShowNewBookModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '4px 0 0 0' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
                                用途やテーマごとに新しいノートを作成します。<br />
                                （例: 企画アイデア、業務マニュアル、読書メモ、議事録など）
                            </p>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                                ノート名:
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={`例: ${nextDefaultBookTitle}、企画アイデア、議事録`}
                                value={newBookTitleInput}
                                onChange={e => setNewBookTitleInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleConfirmCreateNewBook(); }}
                                autoFocus
                                style={{ width: '100%', marginBottom: '6px' }}
                            />
                            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '16px' }}>
                                ※ 未入力の場合は「<strong>{nextDefaultBookTitle}</strong>」になります。
                            </p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewBookModal(false)}>キャンセル</button>
                                <button className="btn btn-primary btn-sm" onClick={handleConfirmCreateNewBook}>作成して開く</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ノート名変更モーダル */}
            {showRenameBookModal && (
                <div className="modal-overlay" onClick={() => setShowRenameBookModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3><Edit3 size={18} /> ノート名の変更</h3>
                            <button className="btn-close" onClick={() => setShowRenameBookModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '4px 0 0 0' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
                                ノートの名前を変更します。（例: 企画アイデア、業務マニュアル、議事録など）
                            </p>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                                新しいノート名:
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={renameBookInput}
                                onChange={e => setRenameBookInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleConfirmRenameBook(); }}
                                autoFocus
                                style={{ width: '100%', marginBottom: '16px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowRenameBookModal(false)}>キャンセル</button>
                                <button className="btn btn-primary btn-sm" onClick={handleConfirmRenameBook}>変更を保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 過去日付・指定日付でのノート作成モーダル */}
            {showCustomDateModal && (
                <div className="modal-overlay" onClick={() => setShowCustomDateModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
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

            {/* カレンダー連動日の設定モーダル */}
            {showDateModal && (
                <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
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

            {/* ノート10冊上限＆プレミアム案内モーダル */}
            {showBookLimitModal && (
                <div className="modal-overlay" onClick={() => setShowBookLimitModal(false)}>
                    <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                                📕 ノート作成上限 (10冊)
                            </h3>
                            <button className="btn-close" onClick={() => setShowBookLimitModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                                <strong style={{ color: '#f59e0b', fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>
                                    無料プランのノート作成上限（10冊）に達しています
                                </strong>
                                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
                                    無料プランでは、ノートは<strong>最大10冊まで</strong>作成可能です。<br />
                                    ※ 各ノート内の<strong>ページ数は無制限</strong>で何ページでも追加できます。<br />
                                    ※ <strong>日付ノートも無制限</strong>で毎日何ページでも記録できます。
                                </p>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '14px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>👑</span>
                                    <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>プレミアムプランで無制限に</strong>
                                </div>
                                <p style={{ fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.8, margin: 0 }}>
                                    今後提供される「広告非表示＆無制限プラン」をご利用いただくと、ノートを上限なく何冊でも作成・整理できるようになります。
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                {onViewChange && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => {
                                            setShowBookLimitModal(false);
                                            onViewChange('settings');
                                        }}
                                    >
                                        👑 プラン設定を見る
                                    </button>
                                )}
                                <button className="btn btn-primary btn-sm" onClick={() => setShowBookLimitModal(false)}>
                                    了解しました
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
