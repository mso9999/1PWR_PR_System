import pandas as pd

def analyze_excel():
    file_path = '1PWR PR MASTER TRACKING_New.xlsx'
    xl = pd.ExcelFile(file_path)
    
    print("\nSheet Names:")
    print("-" * 50)
    for sheet in xl.sheet_names:
        print(f"- {sheet}")
    
    print("\nDetailed Sheet Analysis:")
    print("-" * 50)
    for sheet in xl.sheet_names:
        print(f"\n=== {sheet} ===")
        df = pd.read_excel(xl, sheet)
        print(f"Columns ({len(df.columns)}):")
        for idx, col in enumerate(df.columns):
            col_letter = chr(65 + (idx // 26) - 1) + chr(65 + (idx % 26)) if idx >= 26 else chr(65 + idx)
            print(f"{col_letter}: {col}")

if __name__ == '__main__':
    analyze_excel()
