"""
Test script to inspect HTML structure of MSU blog
"""
import requests
from bs4 import BeautifulSoup

url = "https://stud.spa.msu.ru/blog/"

response = requests.get(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

soup = BeautifulSoup(response.content, 'html.parser')

# Find first article
articles = soup.select('.post')
if articles:
    print(f"Found {len(articles)} articles\n")
    print("=" * 80)
    print("First article HTML structure:")
    print("=" * 80)
    
    first_article = articles[0]
    print(first_article.prettify()[:2000])  # First 2000 chars
    
    print("\n" + "=" * 80)
    print("Looking for date elements:")
    print("=" * 80)
    
    # Try to find date
    time_elem = first_article.find('time')
    if time_elem:
        print(f"Found <time>: {time_elem}")
        print(f"  datetime attribute: {time_elem.get('datetime')}")
        print(f"  text: {time_elem.get_text(strip=True)}")
    else:
        print("No <time> element found")
    
    # Try other date selectors
    for selector in ['.date', '.published', '.entry-date', '[class*="date"]']:
        date_elem = first_article.select_one(selector)
        if date_elem:
            print(f"Found with '{selector}': {date_elem.get_text(strip=True)}")
    
    print("\n" + "=" * 80)
    print("Looking for author elements:")
    print("=" * 80)
    
    # Try to find author
    for selector in ['.author', '.by-author', '[class*="author"]', '[class*="by"]']:
        author_elem = first_article.select_one(selector)
        if author_elem:
            print(f"Found with '{selector}': {author_elem.get_text(strip=True)}")
    
    print("\n" + "=" * 80)
    print("Looking for category elements:")
    print("=" * 80)
    
    # Try to find category
    for selector in ['.category', '.cat', '[class*="category"]', '[class*="tag"]']:
        cat_elem = first_article.select_one(selector)
        if cat_elem:
            print(f"Found with '{selector}': {cat_elem.get_text(strip=True)}")
    
    print("\n" + "=" * 80)
    print("All classes in article:")
    print("=" * 80)
    
    # Find all elements with classes
    for elem in first_article.find_all(class_=True):
        classes = ' '.join(elem.get('class', []))
        text = elem.get_text(strip=True)[:50]
        if text:
            print(f"{elem.name}.{classes}: {text}")
else:
    print("No articles found!")




