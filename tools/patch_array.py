import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    # 1. Add deletedSlotIds array
    t1 = """    let deletedCount = 0;
    let hasChanges = false;"""
    r1 = """    let deletedCount = 0;
    let hasChanges = false;
    let deletedSlotIds = [];"""
    
    # 2. Push to array
    t2 = """            delete slots[slotId];
            deletedCount++;
            hasChanges = true;"""
    r2 = """            delete slots[slotId];
            deletedCount++;
            hasChanges = true;
            deletedSlotIds.push(slotId);"""

    app = app.replace(t1, r1)
    app = app.replace(t2, r2)
    
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)
    print("Fixed deletedSlotIds array logic!")

if __name__ == '__main__':
    patch()
