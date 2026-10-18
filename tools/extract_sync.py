import sys

def extract():
    with open('temp_app.js', 'r', encoding='utf-16') as f:
        v5 = f.read()

    start = v5.find('// [NEW] Use onSnapshot for live global synchronization')
    end_marker = '}); // End of sessions onSnapshot'
    end = v5.find(end_marker, start)
    
    if start != -1 and end != -1:
        block = v5[start:end + len(end_marker)]
        with open('sync_block_v5.js', 'w', encoding='utf-8') as out:
            out.write(block)
        print("Extracted V5 Block")
    else:
        print("Could not find markers in temp_app.js")

    with open('app.js', 'r', encoding='utf-8') as f:
        v2 = f.read()

    start2 = v2.find('// [NEW] Use onSnapshot for live global synchronization')
    end_marker2 = '}); // End of sessions onSnapshot'
    end2 = v2.find(end_marker2, start2)

    if start2 != -1 and end2 != -1:
        block2 = v2[start2:end2 + len(end_marker2)]
        with open('sync_block_v2.js', 'w', encoding='utf-8') as out:
            out.write(block2)
        print("Extracted V2 Block")
    else:
        print("Could not find markers in app.js")

if __name__ == '__main__':
    extract()
