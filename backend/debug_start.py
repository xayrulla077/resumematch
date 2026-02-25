import sys
import traceback

try:
    print("Importing auth_router...")
    from api import auth_router
    print("Importing resumes_router...")
    from routers import resumes_router
    print("Importing jobs_router...")
    from routers import jobs_router
    print("Importing applications_router...")
    from routers import applications_router
    print("Importing app from simple_main...")
    from simple_main import app
    print("App imported successfully!")
except Exception as e:
    print("\n--- ERROR DURING IMPORT ---")
    traceback.print_exc()
    sys.exit(1)
