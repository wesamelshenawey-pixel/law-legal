import sys

with open('src/components/CommunicationsCenterView.tsx', 'r') as f:
    content = f.read()

target = """      ) : ("""

replacement = """        </div>
      ) : ("""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/CommunicationsCenterView.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
