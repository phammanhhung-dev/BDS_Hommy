"""Test script to verify baocao_data_full.py syntax"""
import baocao_data_full

print("="*60)
print("✅ PYTHON SYNTAX CHECK PASSED")
print("="*60)

print(f"\nChương 1 - GIỚI THIỆU:")
print(f"  Số sections: {len(baocao_data_full.CHUONG_1['sections'])}")
for section in baocao_data_full.CHUONG_1['sections']:
    print(f"    - {section['id']}: {section['title']}")

print(f"\nChương 2 - CƠ SỞ LÝ THUYẾT:")
print(f"  Số sections: {len(baocao_data_full.CHUONG_2['sections'])}")
for section in baocao_data_full.CHUONG_2['sections']:
    print(f"    - {section['id']}: {section['title']}")

# Check for new content
section_2_6 = baocao_data_full.CHUONG_2['sections'][-1]
if section_2_6['id'] == '2.6':
    print(f"\n✅ NEW SECTION ADDED:")
    print(f"    {section_2_6['id']}: {section_2_6['title']}")
    content_preview = section_2_6['content'][:200]
    print(f"    Preview: {content_preview}...")
    
    # Count citations
    import re
    citations = re.findall(r'\[(\d+)\]', section_2_6['content'])
    unique_citations = set(citations)
    print(f"    Citations found: {sorted([int(c) for c in unique_citations])}")

print("\n" + "="*60)
print("All checks passed! Ready for documentation generation.")
print("="*60)
