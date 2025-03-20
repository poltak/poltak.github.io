# Dead Simple RAG

## Setup Instructions

1. Make sure you have Python 3.10 or newer installed

2. Create a virtual environment:

```bash
# Navigate to the python directory
cd dead-simple-rag/

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate
```

3. Install dependencies:

```bash
venv/bin/pip install -r requirements.txt
```

## Usage

The script can process individual files, multiple files, directories, or a combination of both:

```bash
# Process a single file
./rag.py path/to/document.pdf

# Process multiple files
./rag.py path/to/document1.pdf path/to/document2.pdf

# Process an entire directory (including subdirectories)
./rag.py path/to/documents/

# Process a mix of files and directories
./rag.py path/to/document1.pdf path/to/documents/ path/to/document2.pdf
```

The script currently supports the following file types:

- PDF (.pdf)

## Deactivating the Virtual Environment

When you're done, you can deactivate the virtual environment:

```bash
deactivate
```
