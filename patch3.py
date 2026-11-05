import sys

with open('src/components/CasesView.tsx', 'r') as f:
    content = f.read()

target = """    const newC: CaseRecord = {
      id: "cs-" + Date.now(),
      serialNumber: cases.length + 1,
      caseNumber: caseNo,
      caseYear: parseInt(caseYr),"""

replacement = """    // Automatically format case number and year consistently based on local court standards
    let formattedCaseNo = caseNo.trim();
    let parsedYear = parseInt(caseYr) || new Date().getFullYear();
    
    // Extract format like "123/2026" or "123 لسنة 2026"
    const yearMatch = formattedCaseNo.match(/(?:\\/|لسنة)\\s*(\\d{4})/);
    if (yearMatch) {
      parsedYear = parseInt(yearMatch[1]);
      formattedCaseNo = formattedCaseNo.replace(yearMatch[0], '').trim();
    }
    
    // Standardize to digits only and pad if needed
    const digitsOnly = formattedCaseNo.replace(/\\D/g, "");
    if (digitsOnly.length > 0) {
      formattedCaseNo = digitsOnly;
    }
    
    const newC: CaseRecord = {
      id: "cs-" + Date.now(),
      serialNumber: cases.length + 1,
      caseNumber: formattedCaseNo,
      caseYear: parsedYear,"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/CasesView.tsx', 'w') as f:
        f.write(content)
    print("Success patch3")
else:
    print("Target not found patch3")
