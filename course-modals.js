/**
 * course-modals.js - אלגברה ליניארית 2 (20229)
 * מערכת מודאלים אוטונומית ב-Vanilla JS לניהול חוויית משתמש:
 * 1. מדריך כניסה ראשונה (Welcome Roadmap Modal) - מותאם אישית לפדגוגיה, לצבעי הסגול-ויולט (Purple/Violet) ולמפת הלימוד של לינארית 2.
 * 2. חלון שיתוף ומאגר הקורסים הראשי (Share Modal) - מופיע לגולשים חוזרים מעל 24 שעות וחוזר מדי 5 ימים בלבד.
 * 
 * הכל מנוהל בצורה פרטית ב-localStorage ללא מעקב חיצוני וללא שום שרת.
 */

(function () {
    'use strict';

    const STORAGE_KEYS = {
        FIRST_SEEN: 'lin2_modal_first_seen_ts',
        WELCOME_SHOWN: 'lin2_welcome_modal_shown',
        LAST_SHARE_POPUP: 'lin2_last_share_popup_ts',
        SHARE_DISMISSED: 'lin2_share_modal_dismissed'
    };

    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    function injectStyles() {
        if (document.getElementById('lin2-modals-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'lin2-modals-styles';
        styleEl.textContent = `
            /* אנימציות כניסה ויציאה */
            @keyframes lin2FadeInBackdrop {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes lin2ScaleInModal {
                from { opacity: 0; transform: scale(0.93) translateY(18px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes lin2PulseGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.22); }
                50% { box-shadow: 0 0 35px rgba(124, 58, 237, 0.35); }
            }
            @keyframes lin2RainbowSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes lin2ToastSlide {
                from { opacity: 0; transform: translate(-50%, -20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }

            /* מעטפת הרקע (Backdrop) */
            .lin2-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.68);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                opacity: 0;
                animation: lin2FadeInBackdrop 0.25s ease-out forwards;
                font-family: 'Heebo', 'Rubik', system-ui, -apple-system, sans-serif;
                direction: rtl;
                text-align: right;
                box-sizing: border-box;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            .lin2-backdrop * {
                box-sizing: border-box;
            }

            /* כרטיס המודאל - מותאם באופן מלא לפלטת הצבעים של הקורס */
            .lin2-modal-card {
                position: relative;
                width: 100%;
                background: #ffffff;
                border: 1.5px solid #ddd6fe;
                border-radius: 22px;
                box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.4), 0 0 25px rgba(124, 58, 237, 0.22);
                display: flex;
                flex-direction: column;
                max-height: 88vh;
                opacity: 0;
                animation: lin2ScaleInModal 0.3s ease-out forwards;
                overflow: hidden;
                transform: none !important;
            }

            /* גדלים מותאמים */
            .lin2-modal-card.welcome-size {
                max-width: 800px;
            }
            .lin2-modal-card.share-size {
                max-width: 520px;
            }

            /* כפתור סגירה X */
            .lin2-close-btn {
                position: absolute;
                top: 14px;
                left: 14px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                color: #334155;
                font-size: 18px;
                font-weight: 700;
                line-height: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 10;
            }
            .lin2-close-btn:hover {
                background: #ef4444;
                color: #ffffff;
                border-color: #ef4444;
                transform: rotate(90deg);
            }

            /* כותרת עליונה */
            .lin2-header {
                padding: 22px 26px 14px 26px;
                border-bottom: 1px solid #ddd6fe;
                background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%);
                position: relative;
                flex-shrink: 0;
            }

            .lin2-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 12.5px;
                font-weight: 800;
                background: #f5f3ff;
                color: #6d28d9;
                border: 1px solid #ddd6fe;
                margin-bottom: 8px;
            }

            .lin2-title {
                margin: 0 0 4px 0;
                font-size: 20px;
                font-weight: 900;
                color: #6d28d9;
                line-height: 1.3;
            }

            .lin2-subtitle {
                margin: 0;
                font-size: 13.5px;
                color: #475569;
                line-height: 1.45;
            }

            /* גוף המודאל עם גלילה נעימה */
            .lin2-body {
                padding: 18px 26px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                flex-grow: 1;
            }

            /* כרטיס מדריך ראשי מעוצב */
            .lin2-guide-card {
                background: linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%);
                border: 1px solid #ddd6fe;
                border-radius: 14px;
                padding: 14px 16px;
                margin-bottom: 18px;
            }

            .lin2-guide-title {
                font-size: 14.5px;
                font-weight: 800;
                color: #6d28d9;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .lin2-guide-text {
                font-size: 13.5px;
                color: #334155;
                line-height: 1.55;
                margin: 0;
            }

            /* רשימת האקורדיונים - פריטים סגורים במבנה מעטפה ("תיבת מכתב") */
            .lin2-acc-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 12px;
            }

            .lin2-acc-item {
                border: 1.5px solid #e2e8f0;
                background: #ffffff;
                border-radius: 14px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                overflow: hidden;
                flex-shrink: 0;
            }
            .lin2-acc-item:hover {
                border-color: #ddd6fe;
                background: #f5f3ff;
                box-shadow: 0 4px 14px rgba(124, 58, 237, 0.22);
            }
            .lin2-acc-item.open {
                border-color: #7c3aed;
                box-shadow: 0 4px 18px rgba(124, 58, 237, 0.22);
                background: #ffffff;
            }

            /* כפתור כותרת אקורדיון */
            .lin2-acc-header {
                width: 100%;
                background: none;
                border: none;
                padding: 13px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                text-align: right;
                gap: 12px;
                font-family: inherit;
                transition: background-color 0.15s ease;
            }

            .lin2-acc-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }

            .lin2-acc-icon {
                font-size: 20px;
                width: 38px;
                height: 38px;
                border-radius: 10px;
                background: #f5f3ff;
                border: 1px solid #ddd6fe;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .lin2-acc-header-text {
                flex: 1;
                min-width: 0;
            }

            .lin2-acc-name {
                font-size: 14.5px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.35;
                margin-bottom: 2px;
            }
            .lin2-acc-item.open .lin2-acc-name {
                color: #6d28d9;
            }

            .lin2-acc-snippet {
                font-size: 12.5px;
                color: #64748b;
                line-height: 1.4;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .lin2-acc-chevron {
                font-size: 12px;
                color: #94a3b8;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.25s ease, color 0.2s ease, background 0.2s ease;
                flex-shrink: 0;
            }
            .lin2-acc-item.open .lin2-acc-chevron {
                transform: rotate(180deg);
                color: #7c3aed;
                background: #f5f3ff;
            }

            /* תוכן אקורדיון מורחב */
            .lin2-acc-content {
                display: none;
                padding: 0 18px 16px 18px;
                animation: lin2FadeInBackdrop 0.2s ease-out forwards;
            }
            .lin2-acc-item.open .lin2-acc-content {
                display: block;
            }

            .lin2-acc-desc {
                font-size: 13.5px;
                color: #0f172a;
                line-height: 1.65;
                padding-top: 12px;
                border-top: 1px dashed #ddd6fe;
            }

            .lin2-acc-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin: 12px 0 8px 0;
            }

            .lin2-tag {
                font-size: 11.5px;
                font-weight: 700;
                background: #f5f3ff;
                color: #6d28d9;
                border: 1px solid #ddd6fe;
                padding: 2px 10px;
                border-radius: 9999px;
            }

            .lin2-acc-action-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 12.5px;
                font-weight: 800;
                color: #ffffff;
                background: #7c3aed;
                padding: 6px 14px;
                border-radius: 8px;
                text-decoration: none;
                margin-top: 6px;
                transition: background 0.15s ease, transform 0.15s ease;
            }
            .lin2-acc-action-btn:hover {
                background: #6d28d9;
                transform: translateX(-2px);
            }

            /* חלק תחתון (Footer) */
            .lin2-footer {
                padding: 14px 26px;
                border-top: 1px solid #e2e8f0;
                background: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
                flex-shrink: 0;
            }

            .lin2-footer-notice {
                font-size: 12.5px;
                color: #475569;
                font-weight: 600;
                line-height: 1.45;
                flex: 1;
                min-width: 220px;
            }

            .lin2-btn-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .lin2-btn-primary {
                background: #7c3aed;
                color: #ffffff;
                border: none;
                padding: 8px 18px;
                border-radius: 10px;
                font-size: 13.5px;
                font-weight: 800;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: background 0.15s ease, transform 0.15s ease;
            }
            .lin2-btn-primary:hover {
                background: #6d28d9;
                transform: translateY(-1px);
            }

            .lin2-btn-secondary {
                background: #ffffff;
                border: 1.5px solid #cbd5e1;
                color: #334155;
                padding: 8px 14px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.15s ease;
            }
            .lin2-btn-secondary:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
            }

            .lin2-btn-success {
                background: #10b981 !important;
                border-color: #10b981 !important;
                color: #ffffff !important;
            }

            /* כרטיס שיתוף מיוחד */
            .lin2-share-hub-card {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 14px 16px;
                background: #f5f3ff;
                border: 1.5px solid #ddd6fe;
                border-radius: 14px;
                text-decoration: none;
                margin-top: 14px;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .lin2-share-hub-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 18px rgba(124, 58, 237, 0.22);
            }

            /* הודעת טוסט (Toast) */
            .lin2-toast {
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: #0f172a;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
                border: 1px solid #7c3aed;
                z-index: 100000;
                animation: lin2ToastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* רספונסיביות למובייל */
            @media (max-width: 640px) {
                .lin2-header {
                    padding: 20px 20px 14px 20px;
                }
                .lin2-title {
                    font-size: 18px;
                }
                .lin2-body {
                    padding: 16px 18px;
                }
                .lin2-footer {
                    padding: 14px 18px 18px 18px;
                }
                .lin2-btn-row {
                    flex-direction: column;
                    width: 100%;
                }
                .lin2-btn-primary, .lin2-btn-secondary {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styleEl);
    }

    function showToast(message, emoji = '✓') {
        const existing = document.querySelector('.lin2-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'lin2-toast';
        toast.innerHTML = `<span>${emoji}</span> <span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    function copyCourseLink(btnElement) {
        // קישור ישיר לדף הראשי של האתר - נטו קישור בלבד ללא טקסט נלווה
        const baseUrl = 'https://linear2.pages.dev/';

        const handleSuccess = () => {
            showToast('הקישור הועתק ללוח: ' + baseUrl, '📋');
            if (btnElement) {
                const origHtml = btnElement.innerHTML;
                btnElement.classList.add('lin2-btn-success');
                btnElement.innerHTML = `<span>✓</span> <span>הקישור הועתק!</span>`;
                setTimeout(() => {
                    btnElement.classList.remove('lin2-btn-success');
                    btnElement.innerHTML = origHtml;
                }, 2500);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(baseUrl).then(handleSuccess).catch(() => {
                fallbackCopy(baseUrl, handleSuccess);
            });
        } else {
            fallbackCopy(baseUrl, handleSuccess);
        }
    }

    function fallbackCopy(text, callback) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (callback) callback();
        } catch (e) {
            alert('העתק את הקישור מטה:\n\n' + text);
        }
        document.body.removeChild(textArea);
    }

    function createWelcomeModal() {
        injectStyles();

        // הסרת מודאל קיים אם פתוח
        const existing = document.getElementById('lin2-welcome-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'lin2-welcome-backdrop';
        backdrop.className = 'lin2-backdrop';

        backdrop.innerHTML = `
            <div class="lin2-modal-card welcome-size" role="dialog" aria-modal="true" aria-labelledby="lin2-welcome-title">
                <button type="button" class="lin2-close-btn" id="lin2-welcome-close-x" aria-label="סגור חלון">✕</button>

                <div class="lin2-header">
                    <div class="lin2-badge">
                        <span>🧭</span>
                        <span>מדריך התמצאות ולמידה בקורס</span>
                    </div>
                    <h2 class="lin2-title" id="lin2-welcome-title">אלגברה ליניארית 2 (20229)</h2>
                    <p class="lin2-subtitle">הסבר על מבנה האתר, מצבי הלימוד ביחידות, תרגול השאלות ומאגרי הבחינות</p>
                </div>

                <div class="lin2-body">
                    <div class="lin2-guide-card">
                        <div class="lin2-guide-title">
                            <span>💡</span>
                            <span>איך ללמוד ולהצליח בקורס</span>
                        </div>
                        <p class="lin2-guide-text">
                            כל הסעיפים מטה מוצגים כתיבות מכתב סגורות ומסודרות. לחצו על כל סעיף כדי לפתוח אותו ולקבל פירוט מלא על אופן הפעולה, הכלים והיתרונות המובנים בו:
                        </p>
                    </div>

                    <div class="lin2-acc-container">
                        <!-- פריט 1: פרקי הלימוד (סגור בהתחלה) -->
                        <div class="lin2-acc-item" id="lin2-acc-1">
                            <button type="button" class="lin2-acc-header" onclick="window.__lin2ToggleAcc(1)">
                                <div class="lin2-acc-header-left">
                                    <div class="lin2-acc-icon">📚</div>
                                    <div class="lin2-acc-header-text">
                                        <div class="lin2-acc-name">1. פרקי הלימוד ואופן הלמידה המובנה</div>
                                        <div class="lin2-acc-snippet">כיסוי מלא של סילבוס הקורס, מצבי תצוגה מותאמים ושאלות הכוונה עצמית</div>
                                    </div>
                                </div>
                                <div class="lin2-acc-chevron">▼</div>
                            </button>
                            <div class="lin2-acc-content">
                                <div class="lin2-acc-desc">
                                    כיסוי של 11 יחידות לימוד (דטרמיננטות, ע"ע וו"ע, פולינום אופייני ומזערי, לכסון, מרחבי מכפלה פנימית, תהליך גרם-שמידט, היטל אורתוגונלי, העתקות צמודות, פירוק ספקטרלי וצורת ז'ורדן).
                                    
                                <div style="background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: 12px; padding: 12px 14px; margin: 10px 0;">
                                    <strong style="color: #6d28d9; font-size: 14px; display: block; margin-bottom: 6px;">🎚️ 3 מצבי התצוגה המובנים בראש כל פרק:</strong>
                                    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.55; color: #334155;">
                                        בראש כל פרק יש כפתור מעבר בין שלושה מצבי תצוגה שמותאמים לשלבי הלימוד השונים:
                                    </p>
                                    <ul style="margin: 0; padding-right: 18px; line-height: 1.7; font-size: 13px; color: #1e293b;">
                                        <li><strong>🏛️ מצב פורמלי:</strong> הגדרות מתמטיות ריגורוזיות, תנאי סף, ניסוחי משפטים מדויקים והוכחות מלאות שלב-אחר-שלב. <em>מתי להשתמש:</em> כשרוצים לדעת בדיוק איך לנסח תשובה תקנית ומלאה במבחן, עם כל התנאים והנימוקים שהבודקים דורשים.</li>
                                        <li><strong>📖 בגובה העיניים:</strong> פירוק הרעיונות המופשטים להסברים נגישים וברורים בגובה העיניים, בליווי אנלוגיות ותרשימים שמסבירים "מה זה בעצם אומר בתכל'ס". <em>איך לעבוד איתו:</em> במפגש ראשון עם הגדרה או משפט חדש כדי לבנות אינטואיציה פנימית מוצקה לפני הצלילה לנוסחאות.</li>
                                        <li><strong>⚡ משפטים נטו:</strong> תמצית חדה וממוקדת של כל המשפטים, הטענות, תנאי הבדיקה והנוסחאות בלבד, ללא הוכחות והסברים ארוכים. <em>מתי להשתמש:</em> בחזרות ממוקדות לפני מבחן, שינון מהיר ושליפת תבניות פתרון בזמן תרגול.</li>
                                    </ul>
                                </div>
                                </div>
                                <div class="lin2-acc-tags">
                                    <span class="lin2-tag">כיסוי מלא של הסילבוס</span>
                                    <span class="lin2-tag">מצבי תצוגה מובנים</span>
                                    <span class="lin2-tag">שאלות הכוונה עצמית ❓</span>
                                </div>
                                <a href="2_20229_1.html" class="lin2-acc-action-btn">
                                    <span>כניסה ליחידה 1: דטרמיננטות ושימושים</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 2: הסימולציות והעזרים הגרפיים (סגור בהתחלה) -->
                        <div class="lin2-acc-item" id="lin2-acc-2">
                            <button type="button" class="lin2-acc-header" onclick="window.__lin2ToggleAcc(2)">
                                <div class="lin2-acc-header-left">
                                    <div class="lin2-acc-icon">🌊</div>
                                    <div class="lin2-acc-header-text">
                                        <div class="lin2-acc-name">2. הסימולציות והעזרים הגרפיים — מה לומדים מהם ואיך לתפעל</div>
                                        <div class="lin2-acc-snippet">המחשת מנגנונים דינמיים, חקירת פרמטרים ומקרי קצה בזמן אמת במקום שינון יבש</div>
                                    </div>
                                </div>
                                <div class="lin2-acc-chevron">▼</div>
                            </button>
                            <div class="lin2-acc-content">
                                <div class="lin2-acc-desc">
                                    העזרים הוויזואליים והמעבדות האינטראקטיביות שזורים ישירות בתוך פרקי הלימוד:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>🎯 מה הערך הפדגוגי שלהם:</strong> הסימולציות נועדו להמחיש את המנגנונים הדינמיים (התנהגות תהליכים, תנועת נתונים, פעולת אלגוריתמים, שינויים במרחב וגבולות) שקשה לתפוס מטקסט סטטי בלבד.</li>
                                        <li><strong>💡 איך ללמוד מהם נכון:</strong> אל תסתפקו בהתבוננות פסיבית! שנו ערכים בסליידרים, הזינו קלטים שונים, הריצו תהליכים צעד-אחר-צעד, ובדקו מקרי קצה כדי לראות את התגובה בזמן אמת.</li>
                                        <li><strong>🔍 בקורס זה:</strong> המחשה ויזואלית של מתיחה וכיווץ בכיווני וקטורים עצמיים, אורתוגונליזציה של גרם-שמידט צעד-אחר-צעד, היטל על תת-מרחב ניצב, והמשמעות הגאומטרית של העתקות אוניטריות.</li>
                                    </ul>
                                </div>
                                <div class="lin2-acc-tags">
                                    <span class="lin2-tag">המחשה ויזואלית חיה</span>
                                    <span class="lin2-tag">שינוי פרמטרים ומקרי קצה</span>
                                    <span class="lin2-tag">הבנה אינטואיטיבית עמוקה</span>
                                </div>
                                <a href="2_20229_1.html" class="lin2-acc-action-btn">
                                    <span>למעבדות בפרק הראשון</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 3: תרגול שאלות ומצבי התשובה (סגור בהתחלה) -->
                        <div class="lin2-acc-item" id="lin2-acc-3">
                            <button type="button" class="lin2-acc-header" onclick="window.__lin2ToggleAcc(3)">
                                <div class="lin2-acc-header-left">
                                    <div class="lin2-acc-icon">🎯</div>
                                    <div class="lin2-acc-header-text">
                                        <div class="lin2-acc-name">3. תרגול שאלות, מצבי הפתרון וניתוח מסיחים</div>
                                        <div class="lin2-acc-snippet">שאלות הכוונה ❓ בפרקים, דרגות פתרון מדורגות (רמז, שלד, פתרון מלא) ופירוק מלכודות</div>
                                    </div>
                                </div>
                                <div class="lin2-acc-chevron">▼</div>
                            </button>
                            <div class="lin2-acc-content">
                                <div class="lin2-acc-desc">
                                    המערכת מעודדת תרגול אקטיבי ולא רק קריאה פסיבית:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>❓ שאלות הכוונה (Active Recall):</strong> לצד תת-סעיפים מוטמע כפתור ❓. לפני שאתם קוראים את ההסבר או הפתרון, לחצו עליו ונסו לנסח את התשובה בעצמכם כדי לוודא שאתם מסוגלים לשחזר את החומר לבד.</li>
                                        <li><strong>🎚️ מצבי התשובה והפתרון בשאלות:</strong>
                                            <div style="margin-top: 4px; padding: 6px 12px; background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: 8px; font-size: 12.5px; line-height: 1.6;">
                                                • <strong>רמז (Hint):</strong> כיוון מחשבה ראשוני להתמודדות עצמאית מבלי לחשוף את התשובה.<br>
                                                • <strong>שלד פתרון (Solution Outline):</strong> ראשי הפרקים ושלבי העבודה המרכזיים של התשובה.<br>
                                                • <strong>פתרון מלא ומנומק (Full Solution):</strong> פתרון פורמלי ומלא שלב-אחר-שלב ברמת בחינה.
                                            </div>
                                        </li>
                                        <li><strong>🧠 ניתוח מסיחים מעמיק:</strong> בשאלות רב-ברירה, המערכת מפרקת עבורכם כל אחד מהמסיחים השגויים: למה הוא נראה מפתה, איזו טעות חישוב או הנחה מוטעית הובילה אליו, ואיך להיזהר מהמלכודת של כותבי הבחינה.</li>
                                        
                                    </ul>
                                </div>
                                <div class="lin2-acc-tags">
                                    <span class="lin2-tag">שאלות הכוונה ❓</span>
                                    <span class="lin2-tag">רמז / שלד / פתרון מלא</span>
                                    <span class="lin2-tag">ניתוח מעמיק לכל מסיח</span>
                                </div>
                                <a href="2_20229_1.html" class="lin2-acc-action-btn">
                                    <span>לתרגול בפרקים</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 4: מאגר הבחינות והדרייב (סגור בהתחלה) -->
                        <div class="lin2-acc-item" id="lin2-acc-4">
                            <button type="button" class="lin2-acc-header" onclick="window.__lin2ToggleAcc(4)">
                                <div class="lin2-acc-header-left">
                                    <div class="lin2-acc-icon">📑</div>
                                    <div class="lin2-acc-header-text">
                                        <div class="lin2-acc-name">4. מאגר הבחינות, קובצי המקור ב-Google Drive ומחברות (91–100)</div>
                                        <div class="lin2-acc-snippet">82 בחינות משוחזרות, קישורים לטפסי מקור בדרייב, פתרונות רשמיים והשוואה למחברות שקיבלו 100</div>
                                    </div>
                                </div>
                                <div class="lin2-acc-chevron">▼</div>
                            </button>
                            <div class="lin2-acc-content">
                                <div class="lin2-acc-desc">
                                    הכנה מעשית ממוקדת לבחינת הגמר של האוניברסיטה הפתוחה:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>📁 מה כולל מאגר ה-Google Drive:</strong>
                                            <div style="margin-top: 4px; padding: 6px 12px; background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: 8px; font-size: 12.5px; line-height: 1.6;">
                                                • <strong>טפסי בחינה סרוקים מקוריים</strong> של האוניברסיטה הפתוחה ממועדי א', ב' ומיוחדים.<br>
                                                • <strong>פתרונות רשמיים</strong> מלאים ומפורטים.<br>
                                                • <strong>מחברות בחינה אמיתיות של סטודנטים שקיבלו ציונים 91–100:</strong> מאפשר להשוות את דרך הכתיבה, הפירוט והנימוק שלכם לכתיבה שקיבלה ניקוד מלא במבחן.
                                            </div>
                                        </li>
                                        <li><strong>🎯 מצב מיקוד לבחינה:</strong> בדפי המבחנים ניתן להפעיל מצב מיקוד (קיפול תפריטים והסחות דעת) ולתרגל עם שעון עצר כדי להתרגל לזמני הבחינה האמיתיים.</li>
                                    </ul>
                                </div>
                                <div class="lin2-acc-tags">
                                    <span class="lin2-tag">82 בחינות</span>
                                    <span class="lin2-tag">קובצי מקור ב-Google Drive</span>
                                    <span class="lin2-tag">מחברות מצטיינים (91–100)</span>
                                    <span class="lin2-tag">מצב מיקוד וטיימר</span>
                                </div>
                                <a href="exams.html" class="lin2-acc-action-btn">
                                    <span>מאגר הבחינות והדרייב</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>

                        <!-- פריט 5: חומרי הסיכום והעזרים המשלימים (סגור בהתחלה) -->
                        <div class="lin2-acc-item" id="lin2-acc-5">
                            <button type="button" class="lin2-acc-header" onclick="window.__lin2ToggleAcc(5)">
                                <div class="lin2-acc-header-left">
                                    <div class="lin2-acc-icon">📝</div>
                                    <div class="lin2-acc-header-text">
                                        <div class="lin2-acc-name">5. חומרי הסיכום והעזרים המשלימים</div>
                                        <div class="lin2-acc-snippet">מחברת סיכום מקיפה עם מרקרים פסטליים וטבלאות השוואה לחזרה מהירה לפני המבחן</div>
                                    </div>
                                </div>
                                <div class="lin2-acc-chevron">▼</div>
                            </button>
                            <div class="lin2-acc-content">
                                <div class="lin2-acc-desc">
                                    כלי עיון וחזרה מרוכזת לשלבי הסיום של הלמידה:
                                    <ul style="margin: 6px 0; padding-right: 20px; line-height: 1.65; font-size: 13.5px; color: #1e293b;">
                                        <li><strong>📝 סיכום הקורס המקיף:</strong> זמין בדף <a href="summary.html" style="color: #7c3aed; font-weight: bold; text-decoration: underline;">סיכום הקורס המקיף (מחברת דיגיטלית עם מרקרים)</a> — מחברת סיכום דיגיטלית מסודרת עם הדגשות צבעוניות וטבלאות השוואה מהירות.</li>
                                    <li><strong>🎮 משחק אימון אינטואיציה מהירה:</strong> זמין בדף <a href="game.html" style="color: #7c3aed; font-weight: bold; text-decoration: underline;">game.html</a> — אתגר מהיר נגד השעון לבדיקת אינסטינקטים ושליפה מיידית תחת לחץ זמנים.</li>
                                    </ul>
                                </div>
                                <div class="lin2-acc-tags">
                                    <span class="lin2-tag">סיכום מקיף ומסודר</span>
                                    <span class="lin2-tag">מרקרים פסטליים</span>
                                    <span class="lin2-tag">טבלאות השוואה מהירות</span>
                                </div>
                                <a href="summary.html" class="lin2-acc-action-btn">
                                    <span>לסיכום הקורס המקיף</span>
                                    <span>←</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- פוטר עם העתקת קישור בלבד -->
                    <div class="lin2-footer">
                        <div class="lin2-footer-notice">
                            💬 מכירים חברים שלומדים את הקורס? נשמח שתשתפו אותם בקישור הישיר לאתר.
                        </div>
                        <div class="lin2-btn-row">
                            <button type="button" class="lin2-btn-secondary" id="lin2-welcome-copy-btn">
                                📋 העתקת קישור לאתר
                            </button>
                            <button type="button" class="lin2-btn-primary" id="lin2-welcome-start-btn">
                                🚀 הבנתי, בואו נתחיל
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        const closeModal = () => {
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.25s ease';
            setTimeout(() => backdrop.remove(), 250);
        };

        // אירועים
        document.getElementById('lin2-welcome-close-x').addEventListener('click', closeModal);
        document.getElementById('lin2-welcome-start-btn').addEventListener('click', closeModal);
        document.getElementById('lin2-welcome-copy-btn').addEventListener('click', function () {
            copyCourseLink(this);
        });

        // סגירה בלחיצה על הרקע החיצוני
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // סגירה ב-Escape
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    function createShareModal() {
        injectStyles();

        const existing = document.getElementById('lin2-share-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'lin2-share-backdrop';
        backdrop.className = 'lin2-backdrop';

        backdrop.innerHTML = `
            <div class="lin2-modal-card share-size" role="dialog" aria-modal="true" aria-labelledby="lin2-share-title">
                <button class="lin2-close-btn" id="lin2-share-close-x" title="סגור חלון" aria-label="סגור חלון">✕</button>

                <div class="lin2-header" style="text-align: center;">
                    <div class="lin2-badge" style="margin: 0 auto 8px auto;">
                        <span>💙</span>
                        <span>אוהבים את האתר? עוזרים לחברים!</span>
                    </div>
                    <h2 class="lin2-title" id="lin2-share-title" style="font-size: 20px;">
                        נהנים מהלימוד בלינארית 2? שתפו והמליצו! 😊
                    </h2>
                    <p class="lin2-subtitle">
                        מאגר הקורסים והסיכומים שלנו מתעדכן באופן שוטף. אם האתר מסייע לכם בלמידה, או אם אתם מכירים סטודנטים שמחפשים דרך יעילה להבין את החומר ולהתכונן למבחן — נשמח שתשתפו אותם בקישור הישיר לאתר.
                    </p>
                </div>

                <div class="lin2-body" style="padding-top: 14px; padding-bottom: 14px; gap: 14px;">
                    <!-- כרטיס קישור ישיר להעתקה -->
                    <div style="background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 16px; padding: 14px 16px;">
                        <label style="display: block; font-size: 13px; font-weight: 800; color: #3b0764; margin-bottom: 8px;">
                            📋 קישור ישיר לאתר (נטו קישור):
                        </label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input id="lin2-share-link-input" type="text" readonly value="https://linear2.pages.dev/"
                                style="flex: 1; padding: 10px 14px; border: 1.5px solid #d8b4fe; border-radius: 10px; font-size: 13.5px; background: #faf5ff; color: #3b0764; direction: ltr; text-align: left; font-family: monospace; font-weight: 600; outline: none;">
                            <button type="button" class="lin2-btn-primary" id="lin2-share-copy-btn" style="min-width: unset; padding: 10px 18px; font-size: 13.5px; white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                                <span>📋</span>
                                <span>העתק קישור</span>
                            </button>
                        </div>
                    </div>

                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;">
                        <div style="font-weight: 800; color: #0f172a; font-size: 14.5px; margin-bottom: 4px; display: flex; items-center; gap: 6px;">
                            <span>🌐</span> <span>מאגר כל הקורסים הראשי:</span>
                        </div>
                        <p style="font-size: 12.5px; color: #475569; margin: 0 0 10px 0; line-height: 1.45;">
                            מחפשים קורסים נוספים במדעי המחשב ובמתמטיקה? היכנסו לפורטל הראשי המרכז את כל האתרים האינטראקטיביים שלנו.
                        </p>
                        <a href="https://all-the-courses.pages.dev/" target="_blank" rel="noopener noreferrer" class="lin2-btn-secondary" style="width: 100%; min-width: unset; padding: 10px 16px; font-size: 13.5px; text-decoration: none;">
                            <span>למעבר למאגר הקורסים הראשי</span>
                            <span>←</span>
                        </a>
                    </div>
                </div>

                <div class="lin2-footer" style="padding-top: 12px; padding-bottom: 14px;">
                    <button type="button" class="lin2-btn-secondary" id="lin2-share-dismiss-btn" style="width: 100%; min-width: unset; padding: 9px 16px; font-size: 13px; border-color: transparent; background: transparent; color: #64748b;">
                        <span>המשך בלימוד (סגור חלון)</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        const closeShare = () => {
            const now = Date.now();
            localStorage.setItem(STORAGE_KEYS.LAST_SHARE_POPUP, now.toString());
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.25s ease';
            setTimeout(() => backdrop.remove(), 250);
        };

        document.getElementById('lin2-share-close-x').addEventListener('click', closeShare);
        document.getElementById('lin2-share-dismiss-btn').addEventListener('click', closeShare);
        document.getElementById('lin2-share-copy-btn').addEventListener('click', function () {
            copyCourseLink(this);
        });

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeShare();
        });
    }

    window.__lin2ToggleAcc = function (index) {
        const item = document.getElementById(`lin2-acc-${index}`);
        if (!item) return;

        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.lin2-acc-item').forEach(el => el.classList.remove('open'));

        if (!isOpen) {
            item.classList.add('open');
        }
    };

    window.showCourseWelcomeModal = function () {
        createWelcomeModal();
    };
    window.showCourseShareModal = function () {
        createShareModal();
    };

    function checkAndTriggerModals() {
        const now = Date.now();

        let firstSeen = localStorage.getItem(STORAGE_KEYS.FIRST_SEEN);
        if (!firstSeen) {
            localStorage.setItem(STORAGE_KEYS.FIRST_SEEN, now.toString());
            firstSeen = now;
        } else {
            firstSeen = parseInt(firstSeen, 10);
        }

        const welcomeShown = localStorage.getItem(STORAGE_KEYS.WELCOME_SHOWN);
        const lastSharePopup = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SHARE_POPUP) || '0', 10);
        const timeSinceFirstSeen = now - firstSeen;

        if (!welcomeShown) {
            setTimeout(() => {
                createWelcomeModal();
            }, 800);
            return;
        }

        if (timeSinceFirstSeen >= TWENTY_FOUR_HOURS_MS) {
            const timeSinceLastShare = now - lastSharePopup;
            if (lastSharePopup === 0 || timeSinceLastShare >= FIVE_DAYS_MS) {
                setTimeout(() => {
                    createShareModal();
                }, 1200);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndTriggerModals);
    } else {
        checkAndTriggerModals();
    }

})();
