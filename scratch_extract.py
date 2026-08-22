import urllib.request
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://webgencyinvitations.com/timelessgrace'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        html = response.read().decode('utf-8')
        
    with open('scratch_target.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Downloaded HTML length: {len(html)}")
    
    # Extract text contents
    clean_text = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    clean_text = re.sub(r'<script[^>]*>.*?</script>', '', clean_text, flags=re.DOTALL)
    clean_text = re.sub(r'<[^>]+>', '\n', clean_text)
    lines = [line.strip() for line in clean_text.split('\n') if line.strip()]
    
    with open('scratch_target_text.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
        
    print(f"Extracted {len(lines)} lines of text.")
    
    # Extract images, audio, video, custom CSS
    images = re.findall(r'(?:src|data-original)=["\']([^"\']+\.(?:png|jpg|jpeg|gif|webp|svg|mp4|mp3))["\']', html, re.IGNORECASE)
    print("Found assets:", len(images))
    for img in sorted(set(images)):
        print("Asset:", img)

    # Extract all custom CSS and Google Fonts
    css_links = re.findall(r'href=["\']([^"\']+\.css[^"\']*)["\']', html)
    print("CSS Links:", css_links)
    
    fonts = re.findall(r'https://fonts\.googleapis\.com/css2\?[^"\']+', html)
    print("Fonts:", fonts)

except Exception as e:
    print("Error:", e)
