# TunedUp On-Site Widget - Embed Guide

## Overview

The TunedUp On-Site widget allows users to generate custom car images with AI using Gemini 2.5 Flash. Users can select car specifications, choose from preset themes (location, time, palette), and generate downloadable images with optional model additions.

**Current Implementation**: The widget includes a sophisticated placeholder system while Gemini 2.5 Flash Image preview becomes available. The server-side API is ready to integrate with the actual image generation model when available.

## Widget URL

```
https://your-deployment.vercel.app/w/on-site/embed
```

## Basic Embed Code

```html
<iframe 
  src="https://your-deployment.vercel.app/w/on-site/embed"
  id="tuned-up-onsite"
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
</iframe>

<script>
// Listen for resize messages from the widget
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'TU_RESIZE') {
    const iframe = document.getElementById('tuned-up-onsite');
    if (iframe) {
      iframe.style.height = event.data.height + 'px';
    }
  }
}, false);
</script>
```

## Themed Embed Example

You can customize the widget appearance using URL parameters:

```html
<iframe 
  src="https://your-deployment.vercel.app/w/on-site/embed?primary=%23dc2626&bg=%23f9fafb&text=%231f2937&radius=12px"
  id="tuned-up-onsite-themed"
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
</iframe>

<script>
// Auto-resize handler for themed widget
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'TU_RESIZE') {
    const iframe = document.getElementById('tuned-up-onsite-themed');
    if (iframe) {
      iframe.style.height = event.data.height + 'px';
    }
  }
}, false);
</script>
```

## Theme Parameters

| Parameter | Description | Example | Default |
|-----------|-------------|---------|---------|
| `primary` | Primary color (URL encoded) | `%23dc2626` (red) | `#3b82f6` (blue) |
| `bg` | Background color | `%23f9fafb` (light gray) | `#ffffff` (white) |
| `text` | Text color | `%231f2937` (dark gray) | `#1f2937` (dark gray) |
| `radius` | Border radius | `12px` | `8px` |

### URL Encoding Colors

Remember to URL encode the `#` symbol in hex colors:
- `#dc2626` becomes `%23dc2626`
- `#3b82f6` becomes `%233b82f6`

## Environment Setup

Both widgets require API keys to function properly. All API keys are kept secure on the server-side:
- **Performance Calculator**: Uses OpenAI API for performance estimations
- **On-Site Widget**: Uses Gemini API for image generation

### For Development
1. Create a `.env.local` file in your project root
2. Add both API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### For Production (Vercel)
1. Go to your Vercel project settings
2. Add these environment variables (all server-side only):
   - `OPENAI_API_KEY` - For Performance Calculator widget
   - `GEMINI_API_KEY` - For On-Site widget
3. Set the values to your respective API keys
4. Redeploy your application

**Security Note**: All API keys are only used server-side and never exposed to the client, ensuring maximum security.

## Features

### Car Specifications
- Year, Make, Model selection
- Car color and wheel color customization
- Front/back positioning
- Optional model addition

### Scene Presets
- **Location**: Scottish Hills, US Canyons, Italian Cobblestone, Japanese Nightlife, German City
- **Time**: Dusk, Dawn, Midnight, Midday  
- **Palette**: Cool Teal, Warm Sunset, Monochrome Slate, Neo-Tokyo, Vintage Film

### Advanced Options
- Camera settings (angle, focal length, motion)
- Style controls (realism, grain)
- Output dimensions (512px to 1536px)
- Optional seed for reproducible results

### Image Gallery
- Displays last 3 generated images
- Download functionality for all images
- PNG format download

## Complete Integration Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with TunedUp On-Site</title>
    <style>
        .widget-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .widget-header {
            text-align: center;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="widget-container">
        <div class="widget-header">
            <h2>Generate Your Dream Car</h2>
            <p>Create custom AI-generated car images with our interactive widget</p>
        </div>
        
        <iframe 
            src="https://your-deployment.vercel.app/w/on-site/embed?primary=%23dc2626&bg=%23ffffff&text=%231f2937&radius=8px"
            id="tuned-up-widget"
            width="100%" 
            height="800px" 
            frameborder="0"
            style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        </iframe>
    </div>

    <script>
        // Auto-resize functionality
        window.addEventListener('message', function(event) {
            // Verify origin for security (replace with your actual domain)
            if (event.origin !== 'https://your-deployment.vercel.app') return;
            
            if (event.data && event.data.type === 'TU_RESIZE') {
                const iframe = document.getElementById('tuned-up-widget');
                if (iframe) {
                    iframe.style.height = event.data.height + 'px';
                }
            }
        }, false);
        
        // Optional: Track widget usage
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'TU_GENERATE_COMPLETE') {
                console.log('User generated an image:', event.data);
                // Add your analytics tracking here
            }
        }, false);
    </script>
</body>
</html>
```

## Security Considerations

1. **Origin Verification**: Always verify the iframe origin in your message listener for security
2. **API Keys**: Never expose API keys in client-side code
3. **Content Policy**: The widget includes content filtering to prevent inappropriate image generation

## Support

For issues or feature requests, please contact support or check the project documentation.

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

The widget uses modern web APIs and requires JavaScript to be enabled.