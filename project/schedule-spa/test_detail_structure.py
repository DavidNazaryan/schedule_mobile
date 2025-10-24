"""
Test script to inspect detail page HTML structure
"""
import requests
from bs4 import BeautifulSoup

# Use the URL from the first article
url = "https://stud.spa.msu.ru/ii-mezhdunarodnyj-simpozium-sozdavaya-budushhee/"

response = requests.get(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

soup = BeautifulSoup(response.content, 'html.parser')

print("=" * 80)
print("Looking for metadata on detail page:")
print("=" * 80)

# Try to find metadata
meta_container = soup.find('div', class_=lambda x: x and ('blog-meta' in str(x) or 'post-meta' in str(x)))
if meta_container:
    print(f"Found meta container: {meta_container.get('class')}")
    print(meta_container.prettify()[:500])
else:
    print("No blog-meta or post-meta container found")

# Look for h-blog-meta specifically
h_blog_meta = soup.find('div', class_='h-blog-meta')
if h_blog_meta:
    print("\nFound h-blog-meta:")
    print(h_blog_meta.prettify()[:500])
else:
    print("\nNo h-blog-meta found")

# Look for metadata-item
metadata_items = soup.find_all('div', class_='metadata-item')
if metadata_items:
    print(f"\nFound {len(metadata_items)} metadata-item elements:")
    for item in metadata_items[:3]:
        print(f"  - {item.get_text(strip=True)}")
else:
    print("\nNo metadata-item elements found")

# Try to find any element containing date-like text
print("\n" + "=" * 80)
print("Looking for elements containing 'by' or 'on':")
print("=" * 80)

for elem in soup.find_all(string=lambda text: text and ('by' in text.lower() or 'on' in text.lower())):
    parent = elem.parent
    if parent and len(str(elem).strip()) < 100:
        print(f"{parent.name}.{parent.get('class', [])}: {str(elem).strip()[:80]}")




