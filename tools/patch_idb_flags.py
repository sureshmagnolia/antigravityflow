import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    app = app.replace('\r\n', '\n')

    # 1. ⚡ BUG FIX: Stop Infinite Cloud Bounce for Storage
    t1 = """                if (students && students.length > 0) {
                    allStudentData = students;
                    await saveExamDataIDB(students);"""
    r1 = """                if (students && students.length > 0) {
                    allStudentData = students;
                    await saveExamDataIDB(students, true); // ⚡ BUG FIX: TRUE prevents it from uselessly uploading back to the cloud"""
    
    if t1 in app:
        app = app.replace(t1, r1)
        print("Patched 1")

    # 2. ⚡ BUG FIX: Stop Infinite Cloud Bounce for parsed data
    t2 = """                                    const parsedStudents = JSON.parse(bulkData['examBaseData']);
                                    allStudentData = parsedStudents; // <-- Hydrate Memory
                                    await saveExamDataIDB(parsedStudents);"""
    r2 = """                                    const parsedStudents = JSON.parse(bulkData['examBaseData']);
                                    allStudentData = parsedStudents; // <-- Hydrate Memory
                                    await saveExamDataIDB(parsedStudents, true); // ⚡ BUG FIX: Stop Infinite Cloud Bounce"""
    
    if t2 in app:
        app = app.replace(t2, r2)
        print("Patched 2")

    # 3. idbChanged Logic
    t3 = """                        }
                    }

                    if (idbChanged) {
                        // wait does this exist?"""
    
    # Wait, let's just do a string replace for the missing idbChanged logic
    # Actually, I'll just find the exact block using python find instead
    t3_start = app.find("                    if (idbChanged")
    if t3_start != -1:
        pass # Not sure what it looks like in app.js. I'll print it to be safe.

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)

if __name__ == '__main__':
    patch()
