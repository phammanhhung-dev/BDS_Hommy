#!/bin/bash
# survey_system_stats.sh - Khảo sát thống kê hệ thống thực tế

echo "======================================"
echo "   HỆ THỐNG QUẢN LÝ CHO THUÊ PHÒNG TRỌ"
echo "   KHẢO SÁT THỐNG KÊ THỰC TẾ"
echo "======================================"
echo
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

echo "=== DATABASE STATISTICS ==="
if [ -f "thue_tro.sql" ]; then
    tables=$(grep -c "CREATE TABLE" thue_tro.sql)
    fks=$(grep -c "FOREIGN KEY" thue_tro.sql)
    indexes=$(grep -c "CREATE INDEX" thue_tro.sql)
    
    echo "✅ Total Tables: $tables"
    echo "✅ Foreign Keys: $fks"
    echo "✅ Indexes: $indexes"
    echo
    echo "Tables List:"
    grep "CREATE TABLE" thue_tro.sql | sed 's/CREATE TABLE /  - /' | sed 's/ .*//' | head -20
else
    echo "❌ thue_tro.sql NOT FOUND"
fi

echo
echo "=== BACKEND STATISTICS ==="

if [ -d "server" ]; then
    models=$(find server/models -name "*.js" 2>/dev/null | wc -l)
    controllers=$(find server/controllers -name "*.js" 2>/dev/null | wc -l)
    routes=$(find server/routes -name "*.js" 2>/dev/null | wc -l)
    middleware=$(find server/middleware -name "*.js" 2>/dev/null | wc -l)
    
    echo "✅ Models: $models files"
    echo "✅ Controllers: $controllers files"
    echo "✅ Routes: $routes files"
    echo "✅ Middleware: $middleware files"
else
    echo "❌ server/ directory NOT FOUND"
fi

echo
echo "=== API ENDPOINTS ==="

if [ -d "server/routes" ]; then
    total_apis=0
    
    for file in server/routes/*.js; do
        if [ -f "$file" ]; then
            count=$(grep -c "router\.\(get\|post\|put\|delete\|patch\)" "$file" 2>/dev/null || echo 0)
            filename=$(basename "$file")
            echo "  $filename: $count endpoints"
            total_apis=$((total_apis + count))
        fi
    done
    
    echo
    echo "✅ TOTAL API ENDPOINTS: $total_apis"
else
    echo "❌ server/routes/ NOT FOUND"
fi

echo
echo "=== FRONTEND STATISTICS ==="

if [ -d "client/src" ]; then
    pages=$(find client/src/pages -name "*.jsx" -o -name "*.js" 2>/dev/null | wc -l)
    components=$(find client/src/components -name "*.jsx" -o -name "*.js" 2>/dev/null | wc -l)
    css_files=$(find client/src -name "*.css" 2>/dev/null | wc -l)
    
    echo "✅ Pages: $pages files"
    echo "✅ Components: $components files"
    echo "✅ CSS Files: $css_files files"
    echo
    echo "Pages by Role:"
    for dir in client/src/pages/*/; do
        if [ -d "$dir" ]; then
            role=$(basename "$dir")
            count=$(find "$dir" -name "*.jsx" -o -name "*.js" 2>/dev/null | wc -l)
            echo "  - $role: $count pages"
        fi
    done
else
    echo "❌ client/src/ directory NOT FOUND"
fi

echo
echo "=== USE CASES ==="

if [ -f "docs/use-cases-v1.2.md" ]; then
    total_ucs=$(grep -c "^### UC-" docs/use-cases-v1.2.md)
    uc_gen=$(grep -c "^### UC-GEN-" docs/use-cases-v1.2.md)
    uc_cust=$(grep -c "^### UC-CUST-" docs/use-cases-v1.2.md)
    uc_sale=$(grep -c "^### UC-SALE-" docs/use-cases-v1.2.md)
    uc_proj=$(grep -c "^### UC-PROJ-" docs/use-cases-v1.2.md)
    uc_oper=$(grep -c "^### UC-OPER-" docs/use-cases-v1.2.md)
    uc_admin=$(grep -c "^### UC-ADMIN-" docs/use-cases-v1.2.md)
    
    echo "✅ Total Use Cases: $total_ucs"
    echo "  - UC-GEN (General): $uc_gen"
    echo "  - UC-CUST (Customer): $uc_cust"
    echo "  - UC-SALE (Sales): $uc_sale"
    echo "  - UC-PROJ (Project Owner): $uc_proj"
    echo "  - UC-OPER (Operations): $uc_oper"
    echo "  - UC-ADMIN (Admin): $uc_admin"
else
    echo "❌ docs/use-cases-v1.2.md NOT FOUND"
fi

echo
echo "=== TESTING ==="

test_files=$(find . -name "*.test.js" -o -name "*.spec.js" 2>/dev/null | wc -l)
echo "Test Files: $test_files"

if [ $test_files -gt 0 ]; then
    echo "✅ Tests Found"
else
    echo "⚠️  No test files found"
fi

echo
echo "=== KEY FEATURES IMPLEMENTATION ==="

check_feature() {
    feature_name=$1
    search_pattern=$2
    search_path=$3
    
    if grep -rq "$search_pattern" "$search_path" 2>/dev/null; then
        echo "✅ $feature_name: IMPLEMENTED"
    else
        echo "❌ $feature_name: NOT FOUND"
    fi
}

check_feature "JWT Authentication" "jsonwebtoken\|jwt\.sign" "server/"
check_feature "RBAC (Role-Based Access Control)" "authorize.*role\|checkRole" "server/"
check_feature "Socket.IO (Real-time)" "socket\.io" "server/"
check_feature "VNPay Payment Gateway" "vnpay\|VNPay" "server/"
check_feature "File Upload (Multer)" "multer" "server/"
check_feature "Email Service" "nodemailer\|sendMail" "server/"
check_feature "Password Hashing (bcrypt)" "bcrypt" "server/"
check_feature "Input Validation" "joi\|express-validator" "server/"
check_feature "CORS Protection" "cors" "server/"
check_feature "Rate Limiting" "rate-limit\|rateLimit" "server/"

echo
echo "=== DOCUMENTATION ==="

docs_files=$(find docs -name "*.md" 2>/dev/null | wc -l)
echo "Documentation Files: $docs_files"

if [ -d "docs" ]; then
    echo "Docs Structure:"
    find docs -name "*.md" 2>/dev/null | sed 's/^/  - /' | head -10
fi

echo
echo "======================================"
echo "   SURVEY COMPLETED!"
echo "======================================"
echo
echo "📊 SUMMARY:"
echo "  - Database Tables: $tables"
echo "  - API Endpoints: $total_apis"
echo "  - Use Cases: $total_ucs"
echo "  - Frontend Pages: $pages"
echo "  - Components: $components"
echo
echo "💡 Next Steps:"
echo "  1. Review numbers above"
echo "  2. Update BaoCao_KLTN with EXACT numbers"
echo "  3. Take screenshots of all pages"
echo "  4. Document features NOT implemented"
echo





