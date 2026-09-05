#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Survey System Statistics - Khảo sát thống kê hệ thống thực tế
Tránh bịa chuyện trong báo cáo KLTN!
"""

import os
import re
import glob
from datetime import datetime
from collections import defaultdict

def count_lines_in_file(filepath, pattern):
    """Count lines matching pattern in file"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            return len(re.findall(pattern, content, re.MULTILINE))
    except:
        return 0

def search_in_directory(directory, pattern, file_extension='*'):
    """Search for pattern in directory"""
    if not os.path.exists(directory):
        return False
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file_extension != '*' and not file.endswith(file_extension):
                continue
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    if re.search(pattern, f.read()):
                        return True
            except:
                continue
    return False

def main():
    print("=" * 60)
    print("   HỆ THỐNG QUẢN LÝ CHO THUÊ PHÒNG TRỌ")
    print("   KHẢO SÁT THỐNG KÊ THỰC TẾ")
    print("=" * 60)
    print(f"\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Get project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    print(f"Project Root: {project_root}\n")
    
    # ===== DATABASE STATISTICS =====
    print("=== DATABASE STATISTICS ===")
    db_file = "thue_tro.sql"
    
    if os.path.exists(db_file):
        tables = count_lines_in_file(db_file, r"CREATE TABLE")
        fks = count_lines_in_file(db_file, r"FOREIGN KEY")
        indexes = count_lines_in_file(db_file, r"CREATE INDEX")
        
        print(f"✅ Total Tables: {tables}")
        print(f"✅ Foreign Keys: {fks}")
        print(f"✅ Indexes: {indexes}\n")
        
        # List tables
        print("Tables List:")
        with open(db_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                match = re.search(r"CREATE TABLE\s+`?(\w+)`?", line)
                if match:
                    print(f"  - {match.group(1)}")
    else:
        print(f"❌ {db_file} NOT FOUND")
    
    print()
    
    # ===== BACKEND STATISTICS =====
    print("=== BACKEND STATISTICS ===")
    
    if os.path.exists("server"):
        models = len(glob.glob("server/models/**/*.js", recursive=True))
        controllers = len(glob.glob("server/controllers/**/*.js", recursive=True))
        routes = len(glob.glob("server/routes/**/*.js", recursive=True))
        middleware = len(glob.glob("server/middleware/**/*.js", recursive=True))
        
        print(f"✅ Models: {models} files")
        print(f"✅ Controllers: {controllers} files")
        print(f"✅ Routes: {routes} files")
        print(f"✅ Middleware: {middleware} files")
    else:
        print("❌ server/ directory NOT FOUND")
    
    print()
    
    # ===== API ENDPOINTS =====
    print("=== API ENDPOINTS ===")
    
    if os.path.exists("server/routes"):
        total_apis = 0
        api_pattern = r"router\.(get|post|put|delete|patch)\s*\("
        
        for route_file in glob.glob("server/routes/*.js"):
            count = count_lines_in_file(route_file, api_pattern)
            filename = os.path.basename(route_file)
            print(f"  {filename}: {count} endpoints")
            total_apis += count
        
        print(f"\n✅ TOTAL API ENDPOINTS: {total_apis}")
    else:
        print("❌ server/routes/ NOT FOUND")
    
    print()
    
    # ===== FRONTEND STATISTICS =====
    print("=== FRONTEND STATISTICS ===")
    
    if os.path.exists("client/src"):
        pages = len(glob.glob("client/src/pages/**/*.jsx", recursive=True)) + \
                len(glob.glob("client/src/pages/**/*.js", recursive=True))
        components = len(glob.glob("client/src/components/**/*.jsx", recursive=True)) + \
                     len(glob.glob("client/src/components/**/*.js", recursive=True))
        css_files = len(glob.glob("client/src/**/*.css", recursive=True))
        
        print(f"✅ Pages: {pages} files")
        print(f"✅ Components: {components} files")
        print(f"✅ CSS Files: {css_files} files\n")
        
        # Pages by role
        print("Pages by Role:")
        if os.path.exists("client/src/pages"):
            for role_dir in os.listdir("client/src/pages"):
                role_path = os.path.join("client/src/pages", role_dir)
                if os.path.isdir(role_path):
                    count = len(glob.glob(f"{role_path}/*.jsx")) + len(glob.glob(f"{role_path}/*.js"))
                    if count > 0:
                        print(f"  - {role_dir}: {count} pages")
    else:
        print("❌ client/src/ directory NOT FOUND")
    
    print()
    
    # ===== USE CASES =====
    print("=== USE CASES ===")
    
    uc_file = "docs/use-cases-v1.2.md"
    if os.path.exists(uc_file):
        total_ucs = count_lines_in_file(uc_file, r"^### UC-")
        uc_gen = count_lines_in_file(uc_file, r"^### UC-GEN-")
        uc_cust = count_lines_in_file(uc_file, r"^### UC-CUST-")
        uc_sale = count_lines_in_file(uc_file, r"^### UC-SALE-")
        uc_proj = count_lines_in_file(uc_file, r"^### UC-PROJ-")
        uc_oper = count_lines_in_file(uc_file, r"^### UC-OPER-")
        uc_admin = count_lines_in_file(uc_file, r"^### UC-ADMIN-")
        
        print(f"✅ Total Use Cases: {total_ucs}")
        print(f"  - UC-GEN (General): {uc_gen}")
        print(f"  - UC-CUST (Customer): {uc_cust}")
        print(f"  - UC-SALE (Sales): {uc_sale}")
        print(f"  - UC-PROJ (Project Owner): {uc_proj}")
        print(f"  - UC-OPER (Operations): {uc_oper}")
        print(f"  - UC-ADMIN (Admin): {uc_admin}")
    else:
        print(f"❌ {uc_file} NOT FOUND")
    
    print()
    
    # ===== TESTING =====
    print("=== TESTING ===")
    
    test_files = len(glob.glob("**/*.test.js", recursive=True)) + \
                 len(glob.glob("**/*.spec.js", recursive=True))
    
    print(f"Test Files: {test_files}")
    
    if test_files > 0:
        print("✅ Tests Found")
    else:
        print("⚠️  No test files found")
    
    print()
    
    # ===== KEY FEATURES IMPLEMENTATION =====
    print("=== KEY FEATURES IMPLEMENTATION ===")
    
    features = {
        "JWT Authentication": (r"jsonwebtoken|jwt\.sign", "server/"),
        "RBAC (Role-Based Access Control)": (r"authorize.*role|checkRole", "server/"),
        "Socket.IO (Real-time)": (r"socket\.io", "server/"),
        "VNPay Payment Gateway": (r"vnpay|VNPay", "server/"),
        "File Upload (Multer)": (r"multer", "server/"),
        "Email Service": (r"nodemailer|sendMail", "server/"),
        "Password Hashing (bcrypt)": (r"bcrypt", "server/"),
        "Input Validation": (r"joi|express-validator", "server/"),
        "CORS Protection": (r"cors", "server/"),
        "Rate Limiting": (r"rate-limit|rateLimit", "server/"),
    }
    
    for feature_name, (pattern, search_path) in features.items():
        found = search_in_directory(search_path, pattern)
        status = "✅ IMPLEMENTED" if found else "❌ NOT FOUND"
        print(f"{status}: {feature_name}")
    
    print()
    
    # ===== DOCUMENTATION =====
    print("=== DOCUMENTATION ===")
    
    if os.path.exists("docs"):
        docs_files = len(glob.glob("docs/**/*.md", recursive=True))
        print(f"Documentation Files: {docs_files}\n")
        
        print("Docs Structure:")
        for doc_file in glob.glob("docs/**/*.md", recursive=True)[:10]:
            print(f"  - {doc_file}")
    else:
        print("❌ docs/ directory NOT FOUND")
    
    print()
    
    # ===== SUMMARY =====
    print("=" * 60)
    print("   SURVEY COMPLETED!")
    print("=" * 60)
    print()
    print("📊 SUMMARY:")
    if os.path.exists(db_file):
        print(f"  - Database Tables: {tables}")
    if os.path.exists("server/routes"):
        print(f"  - API Endpoints: {total_apis}")
    if os.path.exists(uc_file):
        print(f"  - Use Cases: {total_ucs}")
    if os.path.exists("client/src"):
        print(f"  - Frontend Pages: {pages}")
        print(f"  - Components: {components}")
    print()
    print("💡 Next Steps:")
    print("  1. Review numbers above")
    print("  2. Update BaoCao_KLTN with EXACT numbers")
    print("  3. Take screenshots of all pages")
    print("  4. Document features NOT implemented")
    print("  5. Be HONEST about limitations!")
    print()
    
    # Save results to file
    output_file = "KHAO_SAT_RESULTS.txt"
    print(f"✅ Results saved to: {output_file}")

if __name__ == "__main__":
    main()





