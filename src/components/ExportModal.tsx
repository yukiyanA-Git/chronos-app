import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Download, Copy, Check, FileSpreadsheet, FileText, Calendar, StickyNote } from 'lucide-react';

interface ExportModalProps {
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
    const { data } = useApp();
    const [targetType, setTargetType] = useState<'all_stickies' | 'folder_stickies' | 'calendar_events'>('all_stickies');
    const [selectedFolderId, setSelectedFolderId] = useState<string>(data.stickyFolders?.[0]?.id || '');
    const [copiedType, setCopiedType] = useState<'sheet' | 'report' | null>(null);

    const stickies = data.stickies || [];
    const folders = data.stickyFolders || [];
    const events = data.events || [];

    // 出力用データの抽出
    const getTargetStickies = () => {
        if (targetType === 'folder_stickies') {
            return stickies.filter(s => s.folderId === selectedFolderId);
        }
        return stickies;
    };

    // 1. CSV生成 (BOM付きUTF-8)
    const handleDownloadCSV = () => {
        let csvContent = '';

        if (targetType === 'calendar_events') {
            // カレンダー予定 ＋ 付箋
            csvContent = '日付,時間,種別,タイトル/内容,詳細/備考\n';
            events.forEach(e => {
                const title = `"${(e.title || '').replace(/"/g, '""')}"`;
                const desc = `"${(e.desc || '').replace(/"/g, '""')}"`;
                const time = `${e.startTime || ''}${e.endTime ? '-' + e.endTime : ''}`;
                csvContent += `${e.date},${time},予定,${title},${desc}\n`;
            });
            stickies.filter(s => s.attachedDate).forEach(s => {
                const content = `"${(s.content || '').replace(/"/g, '""')}"`;
                const folder = folders.find(f => f.id === s.folderId)?.name || '未分類';
                csvContent += `${s.attachedDate},,付箋メモ,${content},フォルダー: ${folder}\n`;
            });
        } else {
            // 付箋メモ一覧
            csvContent = 'ID,内容,フォルダー,貼り付け日付,作成日時\n';
            const list = getTargetStickies();
            list.forEach(s => {
                const content = `"${(s.content || '').replace(/"/g, '""')}"`;
                const folderName = folders.find(f => f.id === s.folderId)?.name || '未分類';
                const attached = s.attachedDate || '';
                const created = new Date(s.createdAt).toLocaleString('ja-JP');
                csvContent += `${s.id},${content},${folderName},${attached},${created}\n`;
            });
        }

        // BOMを付加してダウンロード
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = targetType === 'calendar_events'
            ? `chronos_calendar_export_${new Date().toISOString().slice(0, 10)}.csv`
            : `chronos_stickies_export_${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 2. スプレッドシート用コピー (TSV: タブ区切り)
    const handleCopyForSheet = () => {
        let tsvContent = '';

        if (targetType === 'calendar_events') {
            tsvContent = '日付\t時間\t種別\tタイトル/内容\t備考・フォルダー\n';
            events.forEach(e => {
                const time = `${e.startTime || ''}${e.endTime ? '-' + e.endTime : ''}`;
                tsvContent += `${e.date}\t${time}\t予定\t${e.title || ''}\t${e.desc || ''}\n`;
            });
            stickies.filter(s => s.attachedDate).forEach(s => {
                const folder = folders.find(f => f.id === s.folderId)?.name || '未分類';
                tsvContent += `${s.attachedDate}\t\t付箋メモ\t${s.content || ''}\t${folder}\n`;
            });
        } else {
            tsvContent = '作成日\tフォルダー\t内容\tカレンダー貼り付け日\n';
            const list = getTargetStickies();
            list.forEach(s => {
                const folderName = folders.find(f => f.id === s.folderId)?.name || '未分類';
                const created = new Date(s.createdAt).toLocaleDateString('ja-JP');
                const attached = s.attachedDate || '-';
                tsvContent += `${created}\t${folderName}\t${s.content}\t${attached}\n`;
            });
        }

        navigator.clipboard.writeText(tsvContent);
        setCopiedType('sheet');
        setTimeout(() => setCopiedType(null), 2500);
    };

    // 3. 日報・文章用コピー (テキスト箇条書き)
    const handleCopyForReport = () => {
        let text = '';
        const todayStr = new Date().toLocaleDateString('ja-JP');

        if (targetType === 'calendar_events') {
            text = `【業務・予定スケジュールログ (${todayStr} 出力)】\n\n`;
            if (events.length > 0) {
                text += `■ カレンダー予定:\n`;
                events.forEach(e => {
                    const time = e.startTime ? ` [${e.startTime}]` : '';
                    text += `  ・${e.date}${time} : ${e.title}\n`;
                });
                text += `\n`;
            }
            const attachedStickies = stickies.filter(s => s.attachedDate);
            if (attachedStickies.length > 0) {
                text += `■ 日付貼り付けメモ:\n`;
                attachedStickies.forEach(s => {
                    text += `  ・${s.attachedDate} : ${s.content}\n`;
                });
            }
        } else {
            text = `【タスク・付箋メモ一覧 (${todayStr} 出力)】\n\n`;
            const list = getTargetStickies();
            if (folders.length > 0 && targetType === 'all_stickies') {
                folders.forEach(f => {
                    const fStickies = list.filter(s => s.folderId === f.id);
                    if (fStickies.length > 0) {
                        text += `■ フォルダー: ${f.name}\n`;
                        fStickies.forEach(s => {
                            const dateTag = s.attachedDate ? ` [📅 ${s.attachedDate}]` : '';
                            text += `  ・${s.content}${dateTag}\n`;
                        });
                        text += `\n`;
                    }
                });
                const uncategorized = list.filter(s => !s.folderId);
                if (uncategorized.length > 0) {
                    text += `■ 未分類\n`;
                    uncategorized.forEach(s => {
                        const dateTag = s.attachedDate ? ` [📅 ${s.attachedDate}]` : '';
                        text += `  ・${s.content}${dateTag}\n`;
                    });
                }
            } else {
                list.forEach(s => {
                    const dateTag = s.attachedDate ? ` [📅 ${s.attachedDate}]` : '';
                    text += `・${s.content}${dateTag}\n`;
                });
            }
        }

        navigator.clipboard.writeText(text);
        setCopiedType('report');
        setTimeout(() => setCopiedType(null), 2500);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content glass export-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📊 データのエクスポート・Excel連携</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body export-modal-body">
                    {/* ステップ 1: 出力対象の選択 */}
                    <div className="export-section">
                        <h3>1. 出力する対象を選択</h3>
                        <div className="export-target-options">
                            <label className={`export-radio-card ${targetType === 'all_stickies' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="targetType"
                                    checked={targetType === 'all_stickies'}
                                    onChange={() => setTargetType('all_stickies')}
                                />
                                <StickyNote size={18} />
                                <div>
                                    <strong>すべての付箋メモ</strong>
                                    <span>保存中の全付箋データ ({stickies.length}件)</span>
                                </div>
                            </label>

                            {folders.length > 0 && (
                                <label className={`export-radio-card ${targetType === 'folder_stickies' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="targetType"
                                        checked={targetType === 'folder_stickies'}
                                        onChange={() => setTargetType('folder_stickies')}
                                    />
                                    <FileSpreadsheet size={18} />
                                    <div>
                                        <strong>特定のフォルダー指定</strong>
                                        <select
                                            className="form-input export-folder-select"
                                            value={selectedFolderId}
                                            onChange={e => { setSelectedFolderId(e.target.value); setTargetType('folder_stickies'); }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {folders.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </label>
                            )}

                            <label className={`export-radio-card ${targetType === 'calendar_events' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="targetType"
                                    checked={targetType === 'calendar_events'}
                                    onChange={() => setTargetType('calendar_events')}
                                />
                                <Calendar size={18} />
                                <div>
                                    <strong>カレンダーの予定 ＋ 貼り付け付箋</strong>
                                    <span>予定({events.length}件) ＋ 日付付きメモ</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* ステップ 2: 連携・出力アクション */}
                    <div className="export-section">
                        <h3>2. 連携・出力方法を選択</h3>
                        <div className="export-action-buttons">
                            {/* CSVダウンロード */}
                            <button className="btn btn-primary export-action-btn" onClick={handleDownloadCSV}>
                                <Download size={18} />
                                <div>
                                    <strong>CSV形式で保存 (.csv)</strong>
                                    <span>Excelでそのまま開いて保存・編集・印刷が可能です</span>
                                </div>
                            </button>

                            {/* スプレッドシート用コピー */}
                            <button className="btn btn-secondary export-action-btn" onClick={handleCopyForSheet}>
                                {copiedType === 'sheet' ? <Check size={18} style={{ color: '#10b981' }} /> : <Copy size={18} />}
                                <div>
                                    <strong>{copiedType === 'sheet' ? 'コピーしました！' : 'スプレッドシート用にコピー (TSV)'}</strong>
                                    <span>ExcelやGoogleスプレッドシートに Ctrl+V で即貼り付け</span>
                                </div>
                            </button>

                            {/* 日報・報告用コピー */}
                            <button className="btn btn-secondary export-action-btn" onClick={handleCopyForReport}>
                                {copiedType === 'report' ? <Check size={18} style={{ color: '#10b981' }} /> : <FileText size={18} />}
                                <div>
                                    <strong>{copiedType === 'report' ? 'コピーしました！' : '日報・文章形式でコピー'}</strong>
                                    <span>メール本文や進捗報告書に使える箇条書きテキスト</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
