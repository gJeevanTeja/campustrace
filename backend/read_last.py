import os

def read_last_lines(file_path, num_lines=300):
    if not os.path.exists(file_path):
        print("File not found.")
        return
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        for line in lines[-num_lines:]:
            print(line.strip())

if __name__ == "__main__":
    read_last_lines('deep_debug_traceback.txt', 300)
