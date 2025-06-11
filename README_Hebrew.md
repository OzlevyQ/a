# 🚀 WhatsApp Web.js MCP Server 
## שרת MCP מתקדם לשליטה מלאה בוואטסאפ

<div align="center">

![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-FF6B6B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K&logoColor=white)

### 🌟 מערכת השליטה הכי מתקדמת ל-WhatsApp עם Claude AI

*שליטה מלאה בוואטסאפ ישירות מ-Claude - שליחת הודעות, ניהול צ'אטים, אנשי קשר ועוד*

[🎯 **התקנה מהירה**](#-התקנה-מהירה) • [📱 **יכולות**](#-יכולות-המערכת) • [🔧 **הגדרה**](#-הגדרת-mcp) • [🚀 **דוגמאות**](#-דוגמאות-שימוש)

</div>

---

## 🎯 במה מדובר?

זהו שרת **Model Context Protocol (MCP)** מתקדם המאפשר ל-**Claude AI** לשלוט בוואטסאפ שלך באופן מלא:

### ✨ **תכונות עיקריות:**
- 🔄 **חיבור אוטומטי** - זיהוי session קיים או QR חדש
- 🌐 **ממשק QR מתקדם** - דפדפן נפתח אוטומטית עם קוד QR יפה
- 📱 **20 כלים מתקדמים** לשליטה מלאה בוואטסאפ
- 🇮🇱 **תמיכה מלאה בעברית** - RTL, הודעות דו-לשוניות
- 💾 **שמירת session** - חיבור חד-פעמי, עובד לעד
- 🚀 **פשוט כמו שצריך** - התקנה ב-3 פקודות

---

## 📱 יכולות המערכת

### 📬 **שליחה וקבלה של הודעות**
- ✉️ **הודעות טקסט** עם תמיכה בעברית מלאה
- 🖼️ **מדיה** - תמונות, וידאו, אודיו, מסמכים
- 📝 **כיתובים** למדיה
- 💬 **תגובות** להודעות קיימות
- 👤 **אזכורים (@mentions)**
- 🔍 **חיפוש הודעות** בטקסט
- ↗️ **העברת הודעות** בין צ'אטים
- 🗑️ **מחיקת הודעות** (עבורך או עבור כולם)

### 💬 **ניהול צ'אטים מתקדם**
- 📋 **רשימת צ'אטים** (פרטיים/קבוצות/הכל)
- ℹ️ **מידע מפורט** על כל צ'אט
- 📦 **ארכוב/ביטול ארכוב** צ'אטים
- 📌 **נעיצה** לצ'אטים חשובים
- 🔇 **השתקה** עם זמן מותאם אישית
- ✅ **סימון נקרא/לא נקרא**
- 🧹 **ניקוי הודעות** מצ'אט
- ❌ **מחיקת צ'אט** מלאה

### 👥 **ניהול אנשי קשר**
- 📞 **רשימת אנשי קשר** מלאה
- 🔍 **חיפוש** לפי שם או מספר
- 👤 **מידע מפורט** על איש קשר
- 🚫 **חסימה/ביטול חסימה**
- 📸 **תמונת פרופיל**
- 📄 **הודעת About/סטטוס**
- 👥 **קבוצות משותפות**

---

## 🛠️ התקנה מהירה

### דרישות מערכת:
- **Node.js** 18+ 
- **npm** 
- **Chrome/Chromium** (לwhatsapp-web.js)

### 📦 התקנה ב-3 שלבים:

```bash
# 1. שכפול הפרויקט
git clone https://github.com/yourusername/whatsapp-webjs-mcp-server.git
cd whatsapp-webjs-mcp-server

# 2. התקנת תלויות
npm install

# 3. הפעלה - זהו!
npm start
```

**זהו!** 🎉 המערכת תעשה הכל אוטומטי:
- ✅ תבדוק אם יש session קיים
- 🌐 תפתח דפדפן עם QR אם צריך
- 📱 תתחבר לוואטסאפ
- 🚀 תהיה מוכנה לפקודות מ-Claude

---

## 🔧 הגדרת MCP

### ⚙️ הוספה ל-Claude Desktop:

**Windows:**
```json
{
  "whatsapp": {
    "command": "node",
    "args": ["C:\\Users\\YourName\\path\\to\\whatsapp-webjs-mcp-server\\dist\\index.js"]
  }
}
```

**Mac:**
```json
{
  "whatsapp": {
    "command": "node",
    "args": ["/Users/YourName/path/to/whatsapp-webjs-mcp-server/dist/index.js"]
  }
}
```

**Linux:**
```json
{
  "whatsapp": {
    "command": "node",
    "args": ["/home/YourName/path/to/whatsapp-webjs-mcp-server/dist/index.js"]
  }
}
```

### 📍 מיקום קובץ ההגדרות:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

---

## 🚀 דוגמאות שימוש

### 📱 **שליחת הודעה:**
```
תשלח ל-972501234567@c.us את ההודעה "שלום! איך אתה?"
```

### 📋 **קבלת צ'אטים:**
```
תראה לי את רשימת הצ'אטים שלי
```

### 🔍 **חיפוש איש קשר:**
```
תחפש איש קשר בשם "אבי"
```

### 📬 **קבלת הודעות אחרונות:**
```
תקבל את 10 ההודעות האחרונות מהקבוצה "חברים"
```

### 💬 **ניהול צ'אט:**
```
תארכב את הצ'אט עם יוסי
תנעץ את הקבוצה "עבודה"
תשתיק את הצ'אט עם מרים ל-24 שעות
```

---

## 🎨 ממשק QR מתקדם

<div align="center">

![QR Interface](https://via.placeholder.com/600x400/25D366/FFFFFF?text=QR+Code+Interface)

</div>

כשצריך להתחבר, המערכת:
- 🌐 פותחת דפדפן אוטומטית
- 🎨 מציגה ממשק יפה בעברית
- 🔄 מתעדכנת בזמן אמת
- ✅ מודיעה כשההתחברות הצליחה

---

## 🔧 פתרון בעיות

### ❓ **הדפדפן לא נפתח?**
פתח ידנית: `http://localhost:3000`

### ❓ **שגיאת "invalid wid"?**
השתמש בפורמט: `מספר@c.us` (לפרטי) או `מזהה@g.us` (לקבוצות)

### ❓ **לא מוצא צ'אטים?**
הרץ תחילה: `whatsapp_get_chats` לקבל מזהים נכונים

---

## 🤝 תמיכה ויצירת קשר

<div align="center">

**פותח על ידי:** [עוז לוי](mailto:ozlevy@yadbarzel.info)

📧 **אימייל:** ozlevy@yadbarzel.info  
📱 **טלפון:** 0532792278

</div>

### 🔄 סטטוס הפיתוח:
- ✅ **גרסה יציבה** - עובד מצוין
- 🚧 **בפיתוח מתמיד** - שיפורים קבועים
- 🆘 **תמיכה מלאה** - זמין לעזרה

---

## 📜 רישיון

MIT License - שימוש חופשי, שתף וחדש! 🎉

---

<div align="center">

### 🌟 אהבת את הפרויקט? תן כוכב! ⭐

**נשמח לפידבק, הצעות ושיפורים!**

Made with ❤️ in Israel 🇮🇱

</div> 