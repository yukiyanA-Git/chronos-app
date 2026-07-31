import React from 'react';
import { X, LayoutDashboard, Calendar, StickyNote, Grid, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
    onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content glass export-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>💡 Chronos 簡易仕様書・使い方ガイド</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body export-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    {/* 機能一覧 */}
                    <div className="export-section">
                        <div className="date-modal-item" style={{ borderLeftColor: '#3b82f6', marginBottom: '8px' }}>
                            <div className="date-modal-item-info">
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <LayoutDashboard size={16} /> 1. ダッシュボード
                                </strong>
                                <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                                    本日の予定・タイムテーブル・近日の予定・クイック付箋メモを一画面で素早く確認・管理できます。不要な付箋は「📦」ボタンで付箋ボードに保存可能。
                                </span>
                            </div>
                        </div>

                        <div className="date-modal-item" style={{ borderLeftColor: '#10b981', marginBottom: '8px' }}>
                            <div className="date-modal-item-info">
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={16} /> 2. カレンダー機能
                                </strong>
                                <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                                    日付をクリックすると「日付管理モーダル」が開き、予定の追加・編集や付箋メモの貼り付け・解除が独立して安全に行えます。
                                </span>
                            </div>
                        </div>

                        <div className="date-modal-item" style={{ borderLeftColor: '#f59e0b', marginBottom: '8px' }}>
                            <div className="date-modal-item-info">
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <StickyNote size={16} /> 3. 付箋ボード
                                </strong>
                                <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                                    長期保存付箋をフォルダーごとに色分け・分類管理。付箋の「📅」ボタンからカレンダーの指定日に貼り付けできます。
                                </span>
                            </div>
                        </div>

                        <div className="date-modal-item" style={{ borderLeftColor: '#8b5cf6', marginBottom: '8px' }}>
                            <div className="date-modal-item-info">
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Grid size={16} /> 4. タイムテーブル・定例枠
                                </strong>
                                <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                                    曜日・タイムスロットごとに定期的な会議や講義・業務枠を登録。登録データはカレンダーの対応曜日に自動連携されます。
                                </span>
                            </div>
                        </div>

                        <div className="date-modal-item" style={{ borderLeftColor: '#ec4899', marginBottom: '8px' }}>
                            <div className="date-modal-item-info">
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileSpreadsheet size={16} /> 5. Excel / スプレッドシート連携
                                </strong>
                                <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                                    CSV形式の保存、Excel・スプレッドシートへの一発貼り付け用コピー（TSV）、日報メール用の箇条書きテキスト生成をサポート。
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="share-info-box" style={{ marginTop: '8px' }}>
                        <h3><CheckCircle2 size={16} /> データ保管と文字色切り替え</h3>
                        <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.85 }}>
                          * 左下の「文字色切り替え」ボタンで、背景色に合わせた文字色の白/黒をワンタップで切り替えられます。<br />
                          * 全データは安全に自動保存されています。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
