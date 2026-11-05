import sys

with open('src/components/CommunicationsCenterView.tsx', 'r') as f:
    lines = f.readlines()

# Remove the incorrectly added </div> around line 205
for i, line in enumerate(lines):
    if "</>" in line:
        if i + 1 < len(lines) and "</div>" in lines[i+1]:
            del lines[i+1]
            break

with open('src/components/CommunicationsCenterView.tsx', 'w') as f:
    f.writelines(lines)

print("Removed wrong div")
