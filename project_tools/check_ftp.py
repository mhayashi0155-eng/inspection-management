import ftplib
import os
import sys

FTP_HOST = 'sv12.static.ne.jp'
FTP_USER = 'yama522133'
FTP_PASS = 'yama522311'

def check_ftp():
    try:
        print(f"Connecting to {FTP_HOST}...")
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        print("Login successful.")
        
        print("Current directory:", ftp.pwd())
        print("Directory listing:")
        ftp.dir()
        
        ftp.quit()
    except Exception as e:
        print(f"FTP Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    check_ftp()
