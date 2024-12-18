import os
import sys
import fitz  # PyMuPDF

# Get input and output folders from command-line arguments
if len(sys.argv) != 3:
    print("Usage: python convert_pdfs_to_jpg.py <input_folder> <output_folder>")
    sys.exit(1)

input_folder = sys.argv[1]
output_folder = sys.argv[2]

# Ensure the output folder exists
if not os.path.exists(output_folder):
    os.makedirs(output_folder)


# Function to convert PDF to JPG
def convert_pdf_to_jpg(pdf_path, output_folder):
    pdf_document = fitz.open(pdf_path)
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[
        0
    ]  # PDF name without extension

    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        pix = page.get_pixmap(dpi=300)
        image_path = os.path.join(output_folder, f"{pdf_name}_page_{page_num + 1}.jpg")
        pix.save(image_path)
        print(f"Saved: {image_path}")

    pdf_document.close()


# Process all PDFs in the input folder
for file_name in os.listdir(input_folder):
    if file_name.lower().endswith(".pdf"):
        pdf_path = os.path.join(input_folder, file_name)
        print(f"Converting {file_name}...")
        convert_pdf_to_jpg(pdf_path, output_folder)

print("All PDFs have been converted to JPGs.")
