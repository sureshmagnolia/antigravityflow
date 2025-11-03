from js import document, console, localStorage, Blob, URL
import pdfplumber, io, json, pandas as pd

def start_extraction(event=None):
    console.log("✅ PyScript extraction started.")
    status_el = document.getElementById("status")
    spinner = document.getElementById("spinner")
    spinner.classList.remove("hidden")

    try:
        files = document.getElementById("pdf-file").files
        if not files.length:
            status_el.innerText = "Please select one or more PDF files."
            spinner.classList.add("hidden")
            return

        combined = []
        for i in range(files.length):
            f = files.item(i)
            status_el.innerText = f"Processing {f.name} ({i+1}/{files.length})..."
            console.log(f"Processing {f.name}")

            data = io.BytesIO(f.arrayBuffer().to_py())
            with pdfplumber.open(data) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue
                    for line in text.splitlines():
                        parts = line.strip().split()
                        if len(parts) < 3:
                            continue
                        regno = parts[0]
                        name = " ".join(parts[1:-1])
                        course = parts[-1]
                        combined.append({
                            "Register Number": regno,
                            "Name": name,
                            "Course": course,
                            "Date": "",
                            "Time": ""
                        })

        if not combined:
            status_el.innerText = "No data extracted."
            spinner.classList.add("hidden")
            return

        localStorage.setItem("examBaseData", json.dumps(combined))
        console.log(f"✅ Saved {len(combined)} records to localStorage (examBaseData).")

        # CSV download
        df = pd.DataFrame(combined)
        csv_data = df.to_csv(index=False)
        blob = Blob.new([csv_data], { "type": "text/csv" })
        url = URL.createObjectURL(blob)

        a = document.createElement("a")
        a.href = url
        a.download = "Combined_Nominal_Roll.csv"
        a.textContent = "📥 Download Combined_Nominal_Roll.csv"
        a.style.display = "block"
        status_el.innerHTML = f"Extraction complete. {len(combined)} records found.<br>"
        status_el.appendChild(a)

    except Exception as e:
        status_el.innerText = f"Error: {str(e)}"
        console.error(e)
    finally:
        spinner.classList.add("hidden")
        console.log("✅ Extraction complete.")
