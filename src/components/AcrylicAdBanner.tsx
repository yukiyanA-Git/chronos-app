import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AcrylicAdBannerProps {
    position?: 'top' | 'bottom';
}

declare global {
    interface Window {
        adsbygoogle?: any[];
    }
}

export const AcrylicAdBanner: React.FC<AcrylicAdBannerProps> = ({ position = 'top' }) => {
    useEffect(() => {
        try {
            if (window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            // AdSense プレースホルダー表示用
        }
    }, []);

    return (
        <div className={`acrylic-ad-frame ${position === 'bottom' ? 'bottom-ad' : 'top-ad'}`}>
            <div className="acrylic-ad-inner">
                {/* 広告コンテンツ (Google AdSense ディスプレイ広告) */}
                <div className="acrylic-ad-content">
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        data-ad-client="ca-pub-5012440476019514"
                        data-ad-format="horizontal"
                        data-full-width-responsive="false"
                    ></ins>
                    <div className="ad-placeholder-text" style={{ pointerEvents: 'none' }}>
                        <Sparkles size={13} className="ad-sparkle-icon" />
                        <span style={{ fontSize: position === 'top' ? '0.75rem' : '0.8rem' }}>
                            {position === 'top' ? 'PREMIUM SPONSOR' : 'PREMIUM PARTNER / 広告掲載スペース'}
                        </span>
                    </div>
                </div>

                {/* スポンサーラベル */}
                <div className="acrylic-ad-footer">
                    <span className="sponsored-label">{position === 'top' ? 'AD' : 'S P O N S O R E D'}</span>
                </div>
            </div>
        </div>
    );
};

