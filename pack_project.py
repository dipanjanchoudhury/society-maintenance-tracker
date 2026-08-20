import os
import zipfile

def pack_project():
    zip_filename = "society-maintenance-tracker.zip"
    
    # Excluded patterns or folders
    exclude_folders = {
        "node_modules",
        "__pycache__",
        ".git",
        ".idea",
        ".vscode",
        "dist",
        "build",
        "postgres_data",
        "uploads" # Exclude uploads inside dev to avoid archiving uploaded images
    }
    
    exclude_extensions = {
        ".pyc",
        ".pyo",
        ".pyd",
        ".zip",
        ".tar.gz"
    }

    print(f"Creating archive: {zip_filename}...")
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk('.'):
            # Modify dirs in-place to skip excluded directories in traversal
            dirs[:] = [d for d in dirs if d not in exclude_folders]
            
            for file in files:
                file_path = os.path.join(root, file)
                
                # Check extension exclusion
                _, ext = os.path.splitext(file)
                if ext.lower() in exclude_extensions:
                    continue
                    
                # Do not zip the target zip file itself if it exists
                if file == zip_filename:
                    continue
                
                # Relativize path for proper archiving structure
                archive_name = os.path.relpath(file_path, '.')
                print(f"Adding: {archive_name}")
                zip_file.write(file_path, archive_name)

    print(f"\nSuccessfully archived project to: {zip_filename}")

if __name__ == "__main__":
    pack_project()
