# WhatsApp Web Interface

A React-based interface that mimics WhatsApp Web, designed to work with the WhatsApp API backend.

## Features

- 📱 WhatsApp-like design and user interface
- 🌐 Bilingual support (English & Hebrew) with RTL text support
- 💬 Real-time chat functionality
- 📝 Message sending and receiving
- 👥 Chat list with search functionality
- 📷 QR code authentication display
- 📱 Responsive design for mobile and desktop
- ⚡ Real-time connection status monitoring

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Running WhatsApp API server (should be running on port 3001)

## Installation

1. Navigate to the WEBsite directory:
```bash
cd WEBsite
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Make sure your WhatsApp API server is running on port 3001.

## Project Structure

```
WEBsite/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── Sidebar.js
│   │   ├── Sidebar.css
│   │   ├── ChatWindow.js
│   │   ├── ChatWindow.css
│   │   ├── ChatItem.js
│   │   ├── ChatItem.css
│   │   ├── MessageList.js
│   │   ├── MessageList.css
│   │   ├── QRCodeWindow.js
│   │   └── QRCodeWindow.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## API Integration

The interface connects to the WhatsApp API server via the following endpoints:

- `GET /whatsapp/status` - Check connection status
- `GET /whatsapp/qr` - Get QR code for authentication
- `GET /whatsapp/get-chats` - Fetch chat list
- `GET /whatsapp/get-messages` - Fetch messages for a chat
- `POST /whatsapp/send-message` - Send a text message
- `POST /whatsapp/click-chat` - Click on a chat in WhatsApp interface

## Language Support

The interface supports both English and Hebrew languages:

- Click the language toggle button (🌐) to switch between languages
- Hebrew text is automatically displayed with RTL (right-to-left) support
- All UI elements adapt to the selected language

## Key Features

### QR Code Authentication
- Displays QR code when WhatsApp is not connected
- Auto-refreshes QR code every 30 seconds
- Shows step-by-step instructions in both languages

### Chat Interface
- Real-time chat list with search functionality
- Message bubbles styled like WhatsApp
- Support for text messages and media previews
- Message status indicators (sent, delivered, read)
- Typing indicators

### Responsive Design
- Works on desktop and mobile devices
- Touch-friendly interface for mobile users
- Adaptive layout based on screen size

## Troubleshooting

### Connection Issues
- Ensure the WhatsApp API server is running on port 3001
- Check that the proxy setting in package.json points to the correct API server
- Verify WhatsApp Web is properly authenticated

### QR Code Not Loading
- Check API server logs for authentication errors
- Try refreshing the QR code manually
- Ensure your phone has an internet connection

### Messages Not Loading
- Verify the selected chat has messages
- Check browser console for API errors
- Ensure the chat ID is valid

## Development

To modify or extend the interface:

1. Components are modular and can be easily customized
2. CSS uses WhatsApp's color scheme and styling
3. Add new features by creating additional components
4. API calls are centralized and easy to modify

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `build` directory and can be served by any static file server.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is part of the WhatsApp Web.js MCP Server project. 