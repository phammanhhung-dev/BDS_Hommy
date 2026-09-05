#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Verify Features - Kiểm tra chi tiết từng feature đã implement
"""

import os
import re
import glob

def search_pattern_in_files(directory, pattern, extensions=['.js', '.jsx']):
    """Search for pattern in files and return matches with file paths"""
    results = []
    
    if not os.path.exists(directory):
        return results
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules
        if 'node_modules' in root:
            continue
            
        for file in files:
            if not any(file.endswith(ext) for ext in extensions):
                continue
                
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                    for match in matches:
                        # Get line number
                        line_num = content[:match.start()].count('\n') + 1
                        results.append({
                            'file': filepath.replace('\\', '/'),
                            'line': line_num,
                            'match': match.group(0)
                        })
            except:
                continue
    
    return results

def check_feature(feature_name, patterns, search_dirs):
    """Check if feature is implemented"""
    print(f"\n{'=' * 60}")
    print(f"🔍 Checking: {feature_name}")
    print('=' * 60)
    
    all_results = []
    
    for pattern_desc, pattern in patterns:
        for search_dir in search_dirs:
            results = search_pattern_in_files(search_dir, pattern)
            if results:
                all_results.extend(results)
                print(f"\n✅ Found: {pattern_desc}")
                print(f"   Pattern: {pattern}")
                print(f"   Location: {search_dir}")
                print(f"   Matches: {len(results)}")
                
                # Show first few matches
                for i, result in enumerate(results[:3]):
                    rel_path = result['file'].replace(os.getcwd().replace('\\', '/'), '').lstrip('/')
                    print(f"     - {rel_path}:{result['line']}")
                
                if len(results) > 3:
                    print(f"     ... and {len(results) - 3} more")
    
    if not all_results:
        print(f"\n❌ NOT FOUND: {feature_name}")
        print(f"   Feature may not be implemented or uses different pattern")
    else:
        print(f"\n✅ TOTAL MATCHES: {len(all_results)}")
    
    return len(all_results) > 0

def main():
    print("=" * 60)
    print("   FEATURE VERIFICATION")
    print("   Kiểm tra chi tiết features đã implement")
    print("=" * 60)
    print()
    
    # Get project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    print(f"Project Root: {project_root}\n")
    
    # Define features to check
    features = {
        "RBAC (Role-Based Access Control)": {
            "patterns": [
                ("authorize middleware", r"(authorize|checkRole|requireRole)\s*\("),
                ("role checking", r"(req\.user\.role|user\.roles|hasRole)"),
                ("permission checking", r"(permission|checkPermission|hasPermission)")
            ],
            "dirs": ["server/middleware", "server/controllers"]
        },
        
        "Socket.IO (Real-time)": {
            "patterns": [
                ("socket.io server", r"require\(['\"]socket\.io['\"]"),
                ("socket events", r"(socket\.on|socket\.emit|io\.emit)"),
                ("socket connection", r"io\.on\(['\"]connection['\"]")
            ],
            "dirs": ["server/"]
        },
        
        "Payment Gateway (VNPay/SePay)": {
            "patterns": [
                ("VNPay", r"(vnpay|VNPay|vnp_)"),
                ("SePay", r"(sepay|SePay|SEPay)"),
                ("payment verification", r"(verifyPayment|verify.*signature|hmac)")
            ],
            "dirs": ["server/routes", "server/controllers", "server/services"]
        },
        
        "File Upload (Multer)": {
            "patterns": [
                ("multer import", r"require\(['\"]multer['\"]"),
                ("upload middleware", r"(multer\(|upload\.(single|array|fields))"),
                ("file handling", r"req\.file|req\.files")
            ],
            "dirs": ["server/middleware", "server/routes", "server/controllers"]
        },
        
        "Email Service": {
            "patterns": [
                ("nodemailer", r"require\(['\"]nodemailer['\"]"),
                ("send email", r"(sendMail|sendEmail|transporter\.send)"),
                ("email config", r"(createTransport|emailConfig)")
            ],
            "dirs": ["server/services", "server/utils", "server/config"]
        },
        
        "Password Hashing (bcrypt)": {
            "patterns": [
                ("bcrypt import", r"require\(['\"]bcrypt"),
                ("hash password", r"bcrypt\.(hash|hashSync)"),
                ("compare password", r"bcrypt\.(compare|compareSync)")
            ],
            "dirs": ["server/models", "server/controllers", "server/services"]
        },
        
        "Input Validation": {
            "patterns": [
                ("Joi", r"require\(['\"]joi['\"]"),
                ("express-validator", r"require\(['\"]express-validator['\"]"),
                ("validation", r"(validate|validationResult|check\()")
            ],
            "dirs": ["server/middleware", "server/validators", "server/controllers"]
        },
        
        "CORS Protection": {
            "patterns": [
                ("cors import", r"require\(['\"]cors['\"]"),
                ("cors config", r"app\.use\(cors"),
                ("cors options", r"corsOptions|origin:")
            ],
            "dirs": ["server/", "server/config"]
        },
        
        "Rate Limiting": {
            "patterns": [
                ("rate limit import", r"require\(['\"]express-rate-limit"),
                ("rate limit config", r"(rateLimit|limiter)\s*="),
                ("rate limit usage", r"app\.use\(.*limit")
            ],
            "dirs": ["server/", "server/middleware"]
        },
        
        "JWT Implementation": {
            "patterns": [
                ("jwt import", r"require\(['\"]jsonwebtoken['\"]"),
                ("jwt sign", r"jwt\.sign\("),
                ("jwt verify", r"jwt\.verify\("),
                ("token middleware", r"(authenticate|verifyToken)")
            ],
            "dirs": ["server/middleware", "server/controllers", "server/utils"]
        },
        
        "Database Connection Pooling": {
            "patterns": [
                ("createPool", r"createPool\s*\("),
                ("pool config", r"connectionLimit|waitForConnections"),
                ("pool usage", r"pool\.(query|execute|getConnection)")
            ],
            "dirs": ["server/config", "server/models"]
        },
        
        "Logging (Winston/Morgan)": {
            "patterns": [
                ("winston", r"require\(['\"]winston['\"]"),
                ("morgan", r"require\(['\"]morgan['\"]"),
                ("logger", r"(logger\.(info|error|warn|debug)|console\.(log|error))")
            ],
            "dirs": ["server/", "server/utils", "server/config"]
        },
        
        "Error Handling Middleware": {
            "patterns": [
                ("error handler", r"(err,\s*req,\s*res,\s*next)\s*=>"),
                ("error middleware", r"app\.use\(.*error"),
                ("try-catch", r"try\s*\{[\s\S]{0,500}catch\s*\(")
            ],
            "dirs": ["server/middleware", "server/"]
        },
        
        "Real-time Chat": {
            "patterns": [
                ("chat events", r"(message:new|chat:message|send.*message)"),
                ("chat rooms", r"(join.*room|leave.*room|room:)"),
                ("online users", r"(user.*online|presence|connected.*users)")
            ],
            "dirs": ["server/", "client/src"]
        },
        
        "Notification System": {
            "patterns": [
                ("notification", r"(sendNotification|createNotification|pushNotification)"),
                ("notification model", r"(Thongbao|Notification)"),
                ("notification events", r"(notification:new|notify)")
            ],
            "dirs": ["server/", "client/src"]
        }
    }
    
    # Check each feature
    results = {}
    
    for feature_name, config in features.items():
        implemented = check_feature(
            feature_name,
            config["patterns"],
            config["dirs"]
        )
        results[feature_name] = implemented
    
    # Summary
    print("\n" + "=" * 60)
    print("   VERIFICATION SUMMARY")
    print("=" * 60)
    print()
    
    implemented_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    print(f"✅ Implemented: {implemented_count}/{total_count}")
    print(f"❌ Not Found: {total_count - implemented_count}/{total_count}")
    print()
    
    print("DETAILED RESULTS:")
    for feature_name, implemented in results.items():
        status = "✅ IMPLEMENTED" if implemented else "❌ NOT FOUND"
        print(f"  {status}: {feature_name}")
    
    print()
    print("=" * 60)
    print("   VERIFICATION COMPLETED!")
    print("=" * 60)
    print()
    print("💡 Next Steps:")
    print("  1. Review features marked as 'NOT FOUND'")
    print("  2. Either implement missing features OR")
    print("  3. Update report to NOT claim those features")
    print("  4. Be HONEST about what's implemented!")
    print()

if __name__ == "__main__":
    main()





