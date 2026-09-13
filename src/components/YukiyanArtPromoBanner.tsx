import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';

export interface PromoApp {
    id: string;
    name: string;
    subName?: string;
    category?: string;
    desc: string;
    imageIcon: string;
    color?: string;
}

const FALLBACK_LOGO_URL = 'https://yukiyanart-feedback-hub.web.app/assets/icons/yukiyanart_logo.jpg';

// 【yukiyanArt 公式10作品マスターリスト】 (全10作品 公式アイコンWeb URL完全適用)
const OFFICIAL_10_YUKIYANART_APPS: PromoApp[] = [
    {
        id: 'chronos',
        name: 'Chronos',
        subName: 'カレンダー＆付箋メモ',
        category: 'スケジュール・生産性',
        desc: 'タイムブロック型カレンダーとデジタル付箋を融合した yukiyanArt 旗艦アプリ',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/chronos.png',
        color: '#4F46E5'
    },
    {
        id: 'desk_chat',
        name: 'Desk Chat',
        subName: 'デスクチャット',
        category: 'コミュニケーション',
        desc: 'デスク上で作業しながら快適にメッセージ送受信できるスリムチャットツール',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/desk_chat.png',
        color: '#059669'
    },
    {
        id: 'login_manager',
        name: 'LoginManager',
        subName: 'ログイン＆パスワード管理',
        category: 'セキュリティ・管理',
        desc: '暗号化された安全なパスワード保管庫と一発ログインアシスタントツール',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/pass_manager.png',
        color: '#D97706'
    },
    {
        id: 'aura_gallery',
        name: 'AURAGALLERY',
        subName: 'デジタルアート美術室',
        category: 'アート・バーチャルギャラリー',
        desc: '作品を3Dアクリル額縁で飾る全公開個室ポータル＆バーチャル展示室アプリ',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/aura_gallery.jpg',
        color: '#EC4899'
    },
    {
        id: 'strategy_note',
        name: 'STRATEGYNOTE',
        subName: '戦略思考・マインドマップメモ',
        category: 'アイディア・思考整理',
        desc: '戦略的な思考整理とマインドマップ風ノート作成を行えるナレッジツール',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/strategy_note.jpg',
        color: '#8B5CF6'
    },
    {
        id: 'sub_monitor_manager',
        name: 'SubMonitorManager',
        subName: 'マルチモニター仮想画面管理',
        category: 'システム・ディスプレイ',
        desc: 'マルチディスプレイのレイアウトとサブモニター仮想画面配置を最適化するツール',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/sub_monitor_manager.png',
        color: '#6366F1'
    },
    {
        id: 'input_nexus',
        name: 'InputNexus',
        subName: '入力デバイス・キーバインド統合管理',
        category: 'ユーティリティ・入力',
        desc: 'キーボード・マウス・各種入力デバイスのカスタムマッピングと統合管理',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/input_nexus.jpg',
        color: '#0284C7'
    },
    {
        id: 'widget_de_news',
        name: 'widgetでnews',
        subName: '常駐ニュース＆雨雲・PCモニター',
        category: 'デスクトップ・ニュース',
        desc: 'デスクトップ上に常駐し、最新ニュース・リアルタイム雨雲レーダー・PC負荷状況を表示',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/widget_de_news.png',
        color: '#3B82F6'
    },
    {
        id: 'numpre_shift',
        name: '動くナンプレ',
        subName: 'スライド×数独 脳トレパズル',
        category: 'ゲーム・パズル',
        desc: 'スライドパズルと数独（ナンプレ）を組み合わせた新感覚の思考型脳トレパズルゲーム',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/numpre_shift.png',
        color: '#10B981'
    },
    {
        id: 'hex_bastion',
        name: 'HEX BASTION',
        subName: '六角形グリッド防衛戦略',
        category: 'ゲーム・ストラテジー',
        desc: 'ヘキサゴン（六角形）マップ上で繰り広げられるシミュレーション防衛ストラテジーゲーム',
        imageIcon: 'https://yukiyanart-feedback-hub.web.app/assets/icons/hex_bastion.jpg',
        color: '#EF4444'
    }
];

// 自アプリ (chronos) を自動除外した全9作品のプロモローテーションリスト
const DEFAULT_PROMO_APPS = OFFICIAL_10_YUKIYANART_APPS.filter(app => app.id !== 'chronos');

export const YukiyanArtPromoBanner: React.FC = () => {
    const [apps, setApps] = useState<PromoApp[]>(DEFAULT_PROMO_APPS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // クラウド一元配信マスターデータから自動取得 (自アプリ chronos は自動除外)
    useEffect(() => {
        const fetchPromoApps = async () => {
            try {
                const res = await fetch('https://yukiyanart-feedback-hub.web.app/data/promo_apps.json');
                if (res.ok) {
                    const data: PromoApp[] = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const filtered = data.filter(item => item.id && item.id.toLowerCase() !== 'chronos');
                        if (filtered.length > 0) {
                            setApps(filtered);
                        }
                    }
                }
            } catch (err) {
                // オフライン・通信エラー時は公式マスターリストを使用
                console.log('Using official fallback promo apps list:', err);
            }
        };

        fetchPromoApps();
    }, []);

    // 6秒ごとの自動スライド（マウスホバー時は一時停止）
    useEffect(() => {
        if (apps.length <= 1 || isHovered) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % apps.length);
        }, 6000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [apps.length, isHovered]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + apps.length) % apps.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % apps.length);
    };

    const currentApp = apps[currentIndex] || DEFAULT_PROMO_APPS[0];

    const handleOpenHub = (appId: string) => {
        const url = `https://yukiyanart-feedback-hub.web.app/?app_id=${encodeURIComponent(appId)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="yukiyanart-promo-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                marginTop: '1.75rem',
                marginBottom: '1rem',
                position: 'relative',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.88) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.36), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(16px)',
                padding: '14px 18px',
                color: '#f8fafc',
                overflow: 'hidden'
            }}
        >
            {/* 上部ヘッダーバッジ ＆ スライドインジケーター */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.5px' }}>
                    <Sparkles size={13} style={{ color: '#38bdf8' }} />
                    <span>yukiyanArt 公式プロダクト (他 {apps.length} 作品ローテーション中)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {apps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            style={{
                                width: idx === currentIndex ? '16px' : '6px',
                                height: '6px',
                                borderRadius: '3px',
                                background: idx === currentIndex ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                padding: 0
                            }}
                            title={`アプリ ${idx + 1} / ${apps.length}`}
                        />
                    ))}
                </div>
            </div>

            {/* スライダーメインコンテンツ */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                {/* 前へボタン */}
                <button
                    onClick={handlePrev}
                    className="promo-nav-btn"
                    title="前のアプリ"
                    style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        color: '#cbd5e1',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                {/* 中央：アプリ詳細カード */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flex: '1 1 300px',
                    minWidth: 0
                }}>
                    {/* 公式 Web アイコン */}
                    <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: currentApp.color ? `${currentApp.color}22` : 'rgba(56, 189, 248, 0.15)',
                        border: `1px solid ${currentApp.color || '#38bdf8'}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        <img
                            key={currentApp.id}
                            src={currentApp.imageIcon || FALLBACK_LOGO_URL}
                            alt={currentApp.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== FALLBACK_LOGO_URL) {
                                    target.src = FALLBACK_LOGO_URL;
                                }
                            }}
                        />
                    </div>

                    {/* アプリ名・テキスト */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#f8fafc', letterSpacing: '0.3px' }}>
                                {currentApp.name}
                            </span>
                            {currentApp.subName && (
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                    ({currentApp.subName})
                                </span>
                            )}
                            {currentApp.category && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    color: '#38bdf8',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    fontWeight: 600
                                }}>
                                    {currentApp.category}
                                </span>
                            )}
                        </div>
                        <p style={{
                            margin: '3px 0 0 0',
                            fontSize: '0.82rem',
                            color: '#cbd5e1',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {currentApp.desc}
                        </p>
                    </div>
                </div>

                {/* 右側：Hubで見るボタン ＆ 次へボタン */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button
                        onClick={() => handleOpenHub(currentApp.id)}
                        className="dark-glassmorphism-btn"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span>Hubで見る</span>
                        <ExternalLink size={13} style={{ opacity: 0.9 }} />
                    </button>

                    {/* 次へボタン */}
                    <button
                        onClick={handleNext}
                        className="promo-nav-btn"
                        title="次のアプリ"
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            color: '#cbd5e1',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
