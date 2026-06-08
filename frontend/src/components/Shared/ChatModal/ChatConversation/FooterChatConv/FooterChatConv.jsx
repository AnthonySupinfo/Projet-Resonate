import { useState } from 'react';
import './FooterChatConv.css';
import { useLanguage } from '../../../../../context/LanguageContext.jsx';

export default function FooterChatConv({ onSend }) {
    const [text, setText] = useState("");
    const { t } = useLanguage();

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="footer-chat-conv">
            <div className="footer-input-wrapper">
                <textarea
                    className="footer-textarea"
                    placeholder={t('social.yourMessagePlaceholder')}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows="1"
                />

                {text.length > 0 && (
                    <button
                        className="footer-clear-btn"
                        onClick={() => setText("")}
                        title={t('social.clearTooltip')}
                    >
                        ✕
                    </button>
                )}
            </div>

            <button
                className="footer-send-btn"
                onClick={handleSend}
                disabled={!text.trim()}
            >
                {t('social.submit')}
            </button>
        </div>
    );
}