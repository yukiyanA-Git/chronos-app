import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, Shield, Clock, Calendar, CheckSquare } from 'lucide-react';

export const ChronosKnowledgeFooter: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <footer className="chronos-knowledge-footer glass" style={{
            marginTop: '2rem',
            marginBottom: '1.5rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            color: '#cbd5e1'
        }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <BookOpen size={18} style={{ color: '#38bdf8' }} />
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                        Chronos 活用ナレッジ ＆ 生産性向上のためのスケジュール・タスク管理術
                    </h3>
                </div>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8rem'
                }}>
                    <span>{isExpanded ? '折りたたむ' : '解説を読む'}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: isExpanded ? 'block' : 'none'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    fontSize: '0.83rem',
                    lineHeight: '1.6',
                    color: '#94a3b8'
                }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                            <Calendar size={16} /> 1. タイムブロック法による時間管理
                        </h4>
                        <p style={{ margin: 0 }}>
                            Chronosのカレンダーおよびタイムテーブル機能を活用し、1日の時間をブロック単位で区切る手法です。マルチタスクを防ぎ、特定の重要業務（ディープワーク）に集中できる時間を確保することで、作業効率を大幅に向上させます。
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                            <CheckSquare size={16} /> 2. 付箋メモ（Kanbanボード）による視覚化
                        </h4>
                        <p style={{ margin: 0 }}>
                            頭の中にあるタスクやアイデアを即座にデジタル付箋へ書き出すことで、脳のワーキングメモリを解放します。カラー整理やカテゴリ分類を活用し、優先順位の高いタスクから順にカレンダーへ割り当てて処理しましょう。
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                            <Clock size={16} /> 3. 週間定例枠と自動連携
                        </h4>
                        <p style={{ margin: 0 }}>
                            毎週発生する定例会議や講義・習慣化したい日課は「タイムテーブル」に登録しておくことで、個別のカレンダーにも自動反映されます。毎週の入力負担を減らし、スケジュールの重複を未然に防ぎます。
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                            <Shield size={16} /> 4. データ保護とマルチデバイス同期
                        </h4>
                        <p style={{ margin: 0 }}>
                            ChronosはPC・スマートフォンの全ブラウザでレスポンシブに動作します。Googleログインによる無料クラウド同期を有効にすることで、外出先のスマホとデスクのPCでリアルタイムにスケジュールが安全に暗号化同期されます。
                        </p>
                    </div>
                </div>

                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(56, 189, 248, 0.06)',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    fontSize: '0.78rem',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={14} style={{ color: '#38bdf8' }} />
                        Chronos は個人のプライバシーを尊重し、安心・快適に利用できる無料高機能Webツールを提供しています。
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        © Chronos Productivity Platform
                    </span>
                </div>
            </div>
        </footer>
    );
};
