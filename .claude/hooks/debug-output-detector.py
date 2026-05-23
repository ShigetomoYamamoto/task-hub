#!/usr/bin/env python3
"""PostToolUse(Edit|Write|MultiEdit): Swift デバッグ出力を即時警告"""
import json, sys, re

try:
    data = json.load(sys.stdin)
    path = data.get('tool_input', {}).get('file_path', '')
    if not path or not path.endswith('.swift'):
        sys.exit(0)

    PATTERNS = [r'\bprint\(', r'\bdebugPrint\(', r'\bdump\(', r'\bbreakpoint\(\)']

    try:
        content = open(path).read()
    except Exception:
        sys.exit(0)

    found = []
    for n, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith('//'):
            continue
        if any(re.search(p, line) for p in PATTERNS):
            found.append((n, stripped))

    if found:
        print(f'⚠️  デバッグ出力を検出: {path}')
        for n, line in found[:5]:
            print(f'  L{n}: {line}')
        print('  → Logger(subsystem:category:) を使用してください')
except SystemExit:
    raise
except Exception:
    sys.exit(0)
