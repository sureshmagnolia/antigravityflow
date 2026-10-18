import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    # The string to find
    t = "if (key === 'examInvigilatorMapping' || key === 'examRoomAllotment' || key === 'examAbsenteeList' || key === 'examScribeAllotment' || key === 'examQPCodes') {"
    r = "if (key === 'examInvigilationSlots' || key === 'examInvigilatorMapping' || key === 'examRoomAllotment' || key === 'examAbsenteeList' || key === 'examScribeAllotment' || key === 'examQPCodes') {"
    
    if t in app:
        app = app.replace(t, r)
        with open('app.js', 'w', encoding='utf-8') as f:
            f.write(app)
        print("Patched guard.")
    else:
        print("Target not found.")

if __name__ == '__main__':
    patch()
