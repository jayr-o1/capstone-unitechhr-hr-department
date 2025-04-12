import os
import pandas as pd
import codecs

"""
Debug script to investigate why synthetic_career_path_data.csv isn't loading correctly
"""

def check_file_encodings():
    """Check the file encodings and content"""
    file_path = os.path.join('data', 'synthetic_career_path_data.csv')
    print(f"File exists: {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        file_path = os.path.join('..', 'data', 'synthetic_career_path_data.csv')
        print(f"Checking alternate path: {file_path}")
        print(f"File exists: {os.path.exists(file_path)}")
    
    # Try to read raw bytes
    with open(file_path, 'rb') as f:
        raw_data = f.read(1000)  # Read first 1000 bytes
        print(f"First few bytes: {raw_data[:50]}")
        
        # Check for common BOMs
        if raw_data.startswith(b'\xef\xbb\xbf'):
            print("Found UTF-8 BOM")
        elif raw_data.startswith(b'\xff\xfe'):
            print("Found UTF-16 LE BOM")
        elif raw_data.startswith(b'\xfe\xff'):
            print("Found UTF-16 BE BOM")
    
    # Try different encoding approaches
    encodings = ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin1']
    
    for encoding in encodings:
        try:
            # Try to open and read the first few lines
            with codecs.open(file_path, 'r', encoding=encoding) as f:
                first_lines = [next(f) for _ in range(5)]
                print(f"\nEncoding: {encoding} - First few lines:")
                for line in first_lines:
                    print(f"  {line.strip()}")
        except Exception as e:
            print(f"\nEncoding: {encoding} - Error: {str(e)}")
    
    # Try pandas direct approach
    for encoding in encodings:
        try:
            df = pd.read_csv(file_path, encoding=encoding, nrows=5)
            print(f"\nPandas read with {encoding}:")
            print(df.head())
            print(f"Columns: {df.columns.tolist()}")
            return df  # Return the first successful dataframe
        except Exception as e:
            print(f"\nPandas read with {encoding} failed: {str(e)}")
    
    return None

if __name__ == "__main__":
    print("Debugging career path data loading...")
    df = check_file_encodings()
    
    if df is not None:
        print("\nSuccessfully loaded data!")
        print(f"Columns: {df.columns.tolist()}")
        print(f"First few rows:")
        print(df.head().to_string())
    else:
        print("\nFailed to load data with all attempted methods.") 