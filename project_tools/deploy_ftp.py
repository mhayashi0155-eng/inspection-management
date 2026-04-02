import ftplib
import os
import sys

FTP_HOST = 'sv12.static.ne.jp'
FTP_USER = 'yama522133'
FTP_PASS = 'yama522311'

FILES_TO_UPLOAD = [
    'index.html',
    'inspection.html',
    'script.js',
    'style.css',
    'manual_pc.html',
    'manual_sp.html'
]

DIRS_TO_UPLOAD = [
    'ky_form',
    'pdf_tools'
]

def upload_file(ftp, local_path, remote_path):
    print(f"Uploading {local_path} to {remote_path}...")
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)

def ensure_directory(ftp, dir_name):
    try:
        ftp.cwd(dir_name)
        ftp.cwd('..')
    except ftplib.error_perm:
        print(f"Creating directory {dir_name}...")
        ftp.mkd(dir_name)

def deploy():
    try:
        print(f"Connecting to {FTP_HOST}...")
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        print("Login successful.")
        
        # Upload single files
        for filename in FILES_TO_UPLOAD:
            if os.path.exists(filename):
                upload_file(ftp, filename, filename)
            else:
                print(f"Warning: {filename} not found locally.")

        # Upload directories
        for dirname in DIRS_TO_UPLOAD:
            if os.path.isdir(dirname):
                ensure_directory(ftp, dirname)
                for root, _, files in os.walk(dirname):
                    # We assume shallow directory structure for ky_form based on previous tasks
                    for file in files:
                        local_file_path = os.path.join(root, file)
                        # Normalize path for FTP (use forward slash)
                        remote_file_path = local_file_path.replace(os.sep, '/')
                        upload_file(ftp, local_file_path, remote_file_path)
            else:
                print(f"Warning: Directory {dirname} not found locally.")

        print("Deployment completed successfully.")
        ftp.quit()

    except Exception as e:
        print(f"Deployment failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # Change to the correct local directory where the files are
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    # サブフォルダ(project_toolsなど)から実行された場合は親階層へ移動する
    if not os.path.exists('index.html'):
        os.chdir('..')
    deploy()
