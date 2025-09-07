# AI Chat Assistant

A modern, visually appealing chatbot web page designed for GitHub Pages hosting. Features a clean and professional design with seamless ActivePieces webhook integration.

## 🌟 Features

- **Modern Design**: Clean, professional interface with gradient backgrounds and glass-morphism effects
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Interactive Elements**: Conversation starters to guide user engagement
- **Real-time Chat**: Smooth messaging interface with typing indicators
- **ActivePieces Integration**: Easy webhook configuration for AI responses
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance Optimized**: Fast loading and smooth animations

## 🚀 Quick Start

### 1. GitHub Pages Setup

1. Fork or download this repository
2. Go to your repository settings
3. Navigate to "Pages" section
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Your site will be available at `https://yourusername.github.io/repository-name`

### 2. Configure ActivePieces Webhook

1. Open `script.js`
2. Find the `CONFIG` object at the top of the file
3. Replace the placeholder webhook URL with your actual ActivePieces webhook:

```javascript
const CONFIG = {
    WEBHOOK_URL: 'https://your-actual-activepieces-webhook-url.com/webhook',
    // ... other config options
};
```

### 3. ActivePieces Webhook Setup

Your ActivePieces webhook should expect a POST request with this JSON structure:

```json
{
    "message": "User's message text",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "sessionId": "session_1234567890_abc123",
    "userAgent": "Mozilla/5.0..."
}
```

And should respond with:

```json
{
    "response": "AI assistant's reply message"
}
```

Alternative response format:
```json
{
    "message": "AI assistant's reply message"
}
```

## 🎨 Customization

### Colors and Branding

The design uses CSS custom properties for easy customization. Main colors are defined in the gradient:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Logo and Title

Update the logo and title in `index.html`:

```html
<div class="logo">
    <div class="logo-icon">
        <i class="fas fa-robot"></i> <!-- Change icon here -->
    </div>
    <h1 class="logo-text">Your App Name</h1> <!-- Change title here -->
</div>
<p class="tagline">Your custom tagline</p> <!-- Change tagline here -->
```

### Conversation Starters

Modify the conversation starters in `index.html`:

```html
<button class="starter-card" data-message="Your custom message">
    <div class="starter-icon">
        <i class="fas fa-your-icon"></i>
    </div>
    <h3>Your Title</h3>
    <p>Your description</p>
</button>
```

## 📱 Mobile Optimization

The interface is fully responsive with:
- Flexible grid layouts
- Touch-friendly buttons
- Optimized text sizes
- Smooth scrolling

## 🔧 Advanced Features

### Keyboard Shortcuts

- **Enter**: Send message
- **Ctrl+K**: Clear chat history
- **Tab**: Navigate through interface elements

### Error Handling

- Network timeout protection (30 seconds)
- Graceful error messages
- Automatic retry suggestions
- Offline detection (future feature)

### Performance Features

- Lazy loading animations
- Efficient DOM updates
- Memory leak prevention
- Performance monitoring

## 🛠️ Development

### Local Development

1. Clone the repository
2. Open `index.html` in your browser
3. For local server (recommended):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

### File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript functionality
└── README.md          # Documentation
```

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- Feature enhancements
- UI/UX improvements
- Documentation updates

## 📞 Support

If you encounter any issues or need help with setup:
1. Check the browser console for error messages
2. Verify your ActivePieces webhook URL is correct
3. Test the webhook independently to ensure it's working
4. Open an issue in this repository with details

---

Built with ❤️ for modern web experiences
