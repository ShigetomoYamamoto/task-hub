# データモデル コードマップ（TaskHub）

DESIGN.md Phase 3.2 で詳細設計済み。実装後にこのファイルを更新すること。

| ファイルパス | エンティティ | 主なプロパティ / 特記事項 |
|-----------|-----------|---------------------|
| `TaskHub/Core/Models/Project.swift` | `Project` | name, colorHex, iconName, lists（カスケード削除） |
| `TaskHub/Core/Models/TaskList.swift` | `TaskList` | name, isInbox（固定），project（optional） |
| `TaskHub/Core/Models/Task.swift` | `Task` | title, status, progress, workHoursByDate（辞書）, source, connectionId, externalId |
| `TaskHub/Core/Models/Subtask.swift` | `Subtask` | title, isCompleted, source, externalId |
| `TaskHub/Core/Models/Tag.swift` | `Tag` | name（unique）, colorHex |
| `TaskHub/Core/Models/Connection.swift` | `Connection` | kind, meIdentifier, configJSON, keychainRef |
| `TaskHub/Core/Models/SyncRecord.swift` | `SyncRecord` | connectionId, externalId, localTaskId, externalFingerprint |
| `TaskHub/Core/Models/ReportTemplate.swift` | `ReportTemplate` | name, periodKind, body（{{変数}}形式）, isBuiltIn |
| `TaskHub/Core/Models/ReportHistory.swift` | `ReportHistory` | templateName, renderedBody, generatedAt |
| `TaskHub/Core/Models/DateKey.swift` | `DateKey` | year, month, day（Codable + Hashable 値型） |
