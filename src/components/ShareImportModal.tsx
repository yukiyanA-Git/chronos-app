import React from 'react';
import { X, Share2, RefreshCw, Eye } from 'lucide-react';

interface ShareImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportOverwrite: () => void;
    onImportViewOnly: () => void;
}

export const ShareImportModal: React.FC<ShareImportModalProps> = ({
    isOpen,
    onClose,
    onImportOverwrite,
    onImportViewOnly
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex' }}>
            <div className="modal glass">
                <div className="modal-header">
                    <h2><Share2 size={18} /> 共有されたデータの読み込み</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p>共有リンクからデータが検出されました。どのように読み込みますか？</p>
                    <div className="import-options">
                        <button className="btn btn-primary" onClick={onImportOverwrite}>
                            <RefreshCw size={14} style={{ marginRight: '6px', verticalAlign: '-1px' }} /> 現在のデータを上書きしてインポート
                        </button>
                        <button className="btn btn-secondary" onClick={onImportViewOnly}>
                            <Eye size={14} style={{ marginRight: '6px', verticalAlign: '-1px' }} /> インポートせずに閲覧のみ（一時表示）
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
