import os

def find_latest_traceback(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    # Search backwards for "Internal Server Error"
    for i in range(len(lines) - 1, -1, -1):
        if "Internal Server Error:" in lines[i] or "500" in lines[i]:
            # Print some context around it
            start = max(0, i - 10)
            end = min(len(lines), i + 50)
            print("--- TRACEBACK SNAPSHOT ---")
            for j in range(start, end):
                print(lines[j].strip())
            break

if __name__ == "__main__":
    find_latest_traceback('deep_debug_traceback.txt')
