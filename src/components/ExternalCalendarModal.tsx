import React, { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, Upload, Check, AlertCircle, HelpCircle, Trash2 } from 'lucide-react';
import type { ExternalCalendarConfig, ExternalCalendarEvent } from '../types';
import { fetchIcsFeed, parseIcsContent } from '../utils/icalParser';

interface ExternalCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigUpdated: (config: ExternalCalendarConfig, events: ExternalCalendarEvent[]) => void;
}

const STORAGE_CONFIG_KEY = 'chronos_external_calendar_config';
const STORAGE_EVENTS_KEY = 'chronos_external_calendar_events';

export const getStoredExternalCalendarConfig = (): ExternalCalendarConfig => {
    try {
        const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return {
        enabled: false,
        url: '',
        name: 'Google カレンダー',
        color: '#4285F4',
        lastSyncedAt: undefined,
        eventsCount: 0
    };
};

export const getStoredExternalCalendarEvents = (): ExternalCalendarEvent[] => {
    try {
        const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
};

export const ExternalCalendarModal: React.FC<ExternalCalendarModalProps> = ({
    isOpen,
    onClose,
    onConfigUpdated
}) => {
    const [config, setConfig] = useState<ExternalCalendarConfig>(getStoredExternalCalendarConfig);
    const [urlInput, setUrlInput] = useState('');
    const [nameInput, setNameInput] = useState('Google カレンダー');
    const [colorInput, setColorInput] = useState('#4285F4');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const current = getStoredExternalCalendarConfig();
            setConfig(current);
            setUrlInput(current.url || '');
            setNameInput(current.name || 'Google カレンダー');
            setColorInput(current.color || '#4285F4');
            setStatusMessage(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // URLからの同期取得
    const handleSyncFromUrl = async () => {
        const targetUrl = urlInput.trim();
        if (!targetUrl) {
            setStatusMessage({ type: 'error', text: 'カレンダーの iCal URL を入力してください。' });
            return;
        }

        setIsLoading(true);
        setStatusMessage({ type: 'info', text: '外部カレンダーから予定を取得・解析中...' });

        try {
            const icsText = await fetchIcsFeed(targetUrl);
            const events = parseIcsContent(icsText, nameInput.trim() || 'Google カレンダー', colorInput);

            const nowStr = new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const newConfig: ExternalCalendarConfig = {
                enabled: true,
                url: targetUrl,
                name: nameInput.trim() || 'Google カレンダー',
                color: colorInput,
                lastSyncedAt: nowStr,
                eventsCount: events.length
            };

            localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
            localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
            setConfig(newConfig);
            onConfigUpdated(newConfig, events);

            setStatusMessage({
                type: 'success',
                text: `✅ ${events.length} 件の予定を取得し、カレンダー上に重ねて表示しました！`
            });
        } catch (err: any) {
            setStatusMessage({
                type: 'error',
                text: err.message || '取得に失敗しました。URLをご確認いただくか、下部のファイル取込をお試しください。'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // .ics ファイルからの直接インポート
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setStatusMessage({ type: 'info', text: 'ファイルを解析中...' });

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const icsText = event.target?.result as string;
                if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
                    throw new Error('有効な iCalendar (.ics) ファイルではありません。');
                }

                const events = parseIcsContent(icsText, nameInput.trim() || file.name.replace(/\.ics$/i, ''), colorInput);
                const nowStr = new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const newConfig: ExternalCalendarConfig = {
                    enabled: true,
                    url: urlInput.trim(),
                    name: nameInput.trim() || file.name.replace(/\.ics$/i, ''),
                    color: colorInput,
                    lastSyncedAt: `${nowStr} (ファイル取込)`,
                    eventsCount: events.length
                };

                localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
                localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
                setConfig(newConfig);
                onConfigUpdated(newConfig, events);

                setStatusMessage({
                    type: 'success',
                    text: `✅ ファイルから ${events.length} 件の予定を取り込みました！`
                });
            } catch (err: any) {
                setStatusMessage({
                    type: 'error',
                    text: err.message || 'ファイルの読み込みに失敗しました。'
                });
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setStatusMessage({ type: 'error', text: 'ファイルの読み込みエラーが発生しました。' });
            setIsLoading(false);
        };
        reader.readAsText(file);
    };

    // 連携データの全消去
    const handleClearData = () => {
        if (!confirm('外部カレンダーの重ね合わせ設定および取り込んだ予定を消去しますか？')) return;
        const resetConfig: ExternalCalendarConfig = {
            enabled: false,
            url: '',
            name: 'Google カレンダー',
            color: '#4285F4',
            lastSyncedAt: undefined,
            eventsCount: 0
        };
        localStorage.removeItem(STORAGE_CONFIG_KEY);
        localStorage.removeItem(STORAGE_EVENTS_KEY);
        setConfig(resetConfig);
        setUrlInput('');
        onConfigUpdated(resetConfig, []);
        setStatusMessage({ type: 'info', text: '外部カレンダーの連携を解除しました。' });
    };

    // 表示ON/OFF切り替え
    const handleToggleEnabled = (enabled: boolean) => {
        const newConfig = { ...config, enabled };
        setConfig(newConfig);
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
        const events = getStoredExternalCalendarEvents();
        onConfigUpdated(newConfig, events);
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1250 }}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={20} style={{ color: '#4285F4' }} /> 外部カレンダー重ね合わせ設定
                    </h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* 概要バナー */}
                    <div style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(66, 133, 244, 0.08)',
                        border: '1px solid rgba(66, 133, 244, 0.25)',
                        marginBottom: '16px',
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        color: '#cbd5e1'
                    }}>
                        <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#60a5fa' }}>
                            💡 予定を壊さず「重ねて見るだけ」の安全設計
                        </p>
                        Googleカレンダー等の予定を読み取り専用レイヤーとしてChronos上に重ねて可視化します。Chronos側のデータとは完全に独立しており、誤削除や二重登録の心配がありません。
                    </div>

                    {/* 表示 ON/OFF スイッチ */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '18px'
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>カレンダー上の重ね合わせ表示</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {config.enabled ? '🟢 現在「表示中」です' : '⚪ 現在「非表示（OFF）」です'}
                            </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={e => handleToggleEnabled(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                inset: 0,
                                backgroundColor: config.enabled ? '#4285F4' : '#475569',
                                borderRadius: '26px',
                                transition: '0.2s'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '""',
                                    height: '20px',
                                    width: '20px',
                                    left: config.enabled ? '25px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    transition: '0.2s'
                                }} />
                            </span>
                        </label>
                    </div>

                    {/* 連携設定フォーム */}
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="form-label" style={{ margin: 0 }}>
                                外部カレンダー iCal URL (非公開URL)
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowGuide(!showGuide)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: 0
                                }}
                            >
                                <HelpCircle size={13} /> {showGuide ? '説明を閉じる' : 'Google URLの調べ方'}
                            </button>
                        </div>

                        {showGuide && (
                            <div style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid #334155',
                                marginBottom: '10px',
                                fontSize: '0.78rem',
                                color: '#94a3b8',
                                lineHeight: 1.6
                            }}>
                                <strong style={{ color: '#f8fafc' }}>🔍 Googleカレンダー iCal非公開URLの取得手順:</strong>
                                <ol style={{ paddingLeft: '18px', margin: '4px 0 0 0' }}>
                                    <li>PCで Googleカレンダー を開く</li>
                                    <li>左側「マイカレンダー」から対象カレンダーの <strong>︙（メニュー）</strong> ＞「設定と共有」</li>
                                    <li>下部「カレンダーの統合」セクションまでスクロール</li>
                                    <li><strong>「iCal 形式の非公開 URL」</strong> をコピーして下記に貼り付け</li>
                                </ol>
                            </div>
                        )}

                        <input
                            type="url"
                            className="form-input"
                            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">カレンダー名</label>
                            <input
                                type="text"
                                className="form-input"
                                value={nameInput}
                                onChange={e => setNameInput(e.target.value)}
                                placeholder="例: Google カレンダー"
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">タグ表示色</label>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {['#4285F4', '#0F9D58', '#F4B400', '#DB4437', '#8B5CF6', '#EC4899', '#06B6D4'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColorInput(c)}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: c,
                                            border: colorInput === c ? '2px solid white' : 'none',
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* URL同期実行ボタン */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSyncFromUrl}
                            disabled={isLoading}
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
                            {isLoading ? '通信中...' : 'URLから予定を取得・更新'}
                        </button>
                    </div>

                    {/* 代替手段: .ics ファイル取り込み */}
                    <div style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: '#cbd5e1' }}>
                            📁 または .ics ファイルを直接取り込む
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                            Google/Appleカレンダーからエクスポートした .ics ファイルを直接読み込みます。通信制限やURL非公開でも安全に重ね合わせ表示が可能です。
                        </p>
                        <label className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <Upload size={13} /> .ics ファイルを選択
                            <input
                                type="file"
                                accept=".ics,text/calendar"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* ステータスメッセージ */}
                    {statusMessage && (
                        <div style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: statusMessage.type === 'success' ? '#10b981' : statusMessage.type === 'error' ? '#f87171' : '#38bdf8',
                            border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : statusMessage.type === 'error' ? '#ef4444' : '#38bdf8'}`
                        }}>
                            {statusMessage.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                            <span>{statusMessage.text}</span>
                        </div>
                    )}

                    {/* 現在の連携状態サマリー */}
                    {config.lastSyncedAt && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            paddingTop: '10px'
                        }}>
                            <div>
                                最終同期: <strong>{config.lastSyncedAt}</strong> ({config.eventsCount || 0} 件保持)
                            </div>
                            <button
                                type="button"
                                onClick={handleClearData}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#f87171',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <Trash2 size={12} /> 連携解除
                            </button>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
