"""
Debug detail extraction
"""
import re
import requests
from bs4 import BeautifulSoup

url = "https://stud.spa.msu.ru/ii-mezhdunarodnyj-simpozium-sozdavaya-budushhee/"

response = requests.get(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

soup = BeautifulSoup(response.content, 'html.parser')

date_str = ""
author = ""

meta_container = soup.find('div', class_=re.compile(r'blog-meta|post-meta'))
if meta_container:
    print("Found meta container")
    meta_items = meta_container.find_all('div', class_='metadata-item')
    print(f"Found {len(meta_items)} metadata items")
    
    for i, item in enumerate(meta_items):
        print(f"\n--- Item {i} ---")
        
        # Check for prefix
        prefix = item.find('span', class_='metadata-prefix')
        if prefix:
            print(f"Has prefix: {prefix.get_text(strip=True)}")
        else:
            print("No prefix")
            
        # Get text
        text = item.get_text(strip=True).replace('|', '').strip()
        print(f"Text: '{text}'")
        print(f"Text length: {len(text)}")
        
        # Check for link
        a_tag = item.find('a')
        if a_tag:
            print(f"Has link, text: '{a_tag.get_text(strip=True)}'")
        
        # Check if it's a date
        if re.search(r'\d{1,2}\s+\w+|[А-Яа-я]+\s+\d{1,2}|\d{4}', text):
            print(f"Looks like a date!")
        
        # Apply logic
        if not prefix:
            if not author and i == 0:
                if a_tag:
                    author = a_tag.get_text(strip=True)
                    print(f"Set author from link: '{author}'")
                else:
                    author = text
                    print(f"Set author from text: '{author}'")
            elif not date_str and re.search(r'\d{1,2}\s+\w+|[А-Яа-я]+\s+\d{1,2}|\d{4}', text):
                date_str = text
                print(f"Set date: '{date_str}'")

print(f"\nFinal author: '{author}'")
print(f"Final date: '{date_str}'")




