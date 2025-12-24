## 项目图示（Mermaid）

下面包含三张图：E-R 图、用例图和类图。可在支持 mermaid 的渲染器中查看（例如 VS Code 的 Markdown Preview，或 GitHub 的 mermaid 支持）。

### Agent 架构图（总览）

```mermaid
flowchart LR
  %% Styles
  classDef layer fill:#f8fbff,stroke:#7aa2f7,stroke-width:1px
  classDef comp fill:#ffffff,stroke:#333,stroke-width:1px
  classDef service fill:#f7fff8,stroke:#2e7d32,stroke-width:1px
  classDef storage fill:#fff7f7,stroke:#c62828,stroke-width:1px

  %% Frontend Layer
  subgraph Frontend["Frontend (Vite + React + TS)"]
    F_API["py.ts\nRPC 调用封装"]:::comp
    F_UI["UI 组件/流程"]:::comp
  end
  %% class assignment to subgraph is not supported in flowchart

  %% Backend Layer (PyWebView Bridge)
  subgraph Backend["Backend (PyWebView Bridge)"]
    B_API["backend/api.py\n主 RPC 入口"]:::comp
    B_SA["backend/static_analysis_api.py"]:::comp
    B_WIN["backend/window.py\n创建 WebView 窗口"]:::comp
  end
  %% class assignment to subgraph is not supported in flowchart

  %% Core Layer (纯 Python 逻辑)
  subgraph Core["Core (业务/Agents)"]
    C_QT["qt_project/*\n扫描/静态分析/单元/UI 测试"]:::servicec
    C_VIS["services/visual_agent.py\n视觉测试 Agent"]:::service
    C_AI["ai/deepseek_client.py\nAI 分析客户端"]:::service
    C_UTIL["utils/logger.py"]:::comp
  end
  %% class assignment to subgraph is not supported in flowchart

  %% Storage/DB
  DB[(database/*\nSQLite 模型/管理)]:::storage

  %% Edges: Frontend -> Backend -> Core -> DB/AI
  F_API -->|window.pywebview.async RPC| B_API
  F_UI --> F_API
  B_API --> C_QT
  B_API --> C_VIS
  B_SA --> C_QT
  C_QT --> DB
  C_VIS --> DB
  C_QT -. 可选 AI 总结 .-> C_AI
  C_VIS -. 可选 AI 解释 .-> C_AI
  C_AI --> DB

  %% Annotation as a node (flowchart does not support `note over`)
  ANOTE{{说明}}
  ANOTE --- F_API
  ANOTE --- B_API
  click ANOTE "#" "仅传递 JSON 可序列化对象 / 前端调用使用 async/await"
```

**数据流简述**
- 前端 `py.ts` 通过 `window.pywebview` 以异步 RPC 调用后端 `backend/api.py` 或专项 API（如静态分析）。
- 后端 Bridge 仅做参数校验与转发，真正逻辑在 `core/`：
  - `qt_project/*` 负责项目扫描、静态分析（`cppcheck_manager.py`）、测试执行（`unit_test_runner.py`、`ui_test_runner.py`）。
  - `services/visual_agent.py` 管理视觉测试步骤、截图采集与结果记录。
  - `ai/deepseek_client.py` 为可选 AI 解释/总结模块。
- 结果统一入库到 `database/*`，前端再拉取展示与回放。

**架构约束**
- 仅传递 JSON 可序列化数据（不传函数/类实例）。
- 前端所有 Python 调用必须 `await`，避免阻塞 UI。
- 前后端端口需一致：见 `backend/config.py` 与 `frontend/vite.config.ts`。

**E-R 图（Mermaid • Chen 风格）**

```mermaid
flowchart LR
  classDef entity fill:#ffffff,stroke:#111,stroke-width:1px
  classDef attr fill:#ffffff,stroke:#111,stroke-width:1px
  classDef pk fill:#fff8e1,stroke:#f39c12,stroke-width:2px
  classDef rel fill:#f8f8f8,stroke:#666,stroke-width:1px

  %% Core persisted entities (DB tables)
  E_TEST_RUNS[TEST_RUNS]:::entity
  E_TEST_CASE_DETAILS[TEST_CASE_DETAILS]:::entity
  E_TEST_SCREENSHOTS[TEST_SCREENSHOTS]:::entity

  %% Conceptual entities (runtime/derived)
  E_PROJECT[PROJECT]:::entity
  E_UNIT_TEST_FILE[UNIT_TEST_FILE]:::entity
  E_STATIC_RUN[STATIC_ANALYSIS_RUN]:::entity
  E_STATIC_ISSUE[STATIC_ISSUE]:::entity
  E_ISSUE_LOC[ISSUE_LOCATION]:::entity
  E_SOURCE_FILE[SOURCE_FILE]:::entity

  %% Attributes for PROJECT
  A_P_path(((path))):::pk
  A_P_name(((name))):::attr
  E_PROJECT --- A_P_path
  E_PROJECT --- A_P_name

  %% Attributes for UNIT_TEST_FILE
  A_UTF_name(((name))):::attr
  A_UTF_src(((file_path))):::attr
  A_UTF_exe(((executable_path))):::attr
  A_UTF_exists(((exists))):::attr
  E_UNIT_TEST_FILE --- A_UTF_name
  E_UNIT_TEST_FILE --- A_UTF_src
  E_UNIT_TEST_FILE --- A_UTF_exe
  E_UNIT_TEST_FILE --- A_UTF_exists

  %% Attributes for TEST_RUNS
  A_TR_id(((id\nPK))):::pk
  A_TR_project_path(((project_path))):::attr
  A_TR_test_name(((test_name))):::attr
  A_TR_test_type(((test_type))):::attr
  A_TR_status(((status))):::attr
  A_TR_total(((total))):::attr
  A_TR_passed(((passed))):::attr
  A_TR_failed(((failed))):::attr
  A_TR_skipped(((skipped))):::attr
  A_TR_duration(((duration))):::attr
  A_TR_output(((output))):::attr
  A_TR_ai_analysis(((ai_analysis))):::attr
  A_TR_created_at(((created_at))):::attr
  E_TEST_RUNS --- A_TR_id
  E_TEST_RUNS --- A_TR_project_path
  E_TEST_RUNS --- A_TR_test_name
  E_TEST_RUNS --- A_TR_test_type
  E_TEST_RUNS --- A_TR_status
  E_TEST_RUNS --- A_TR_total
  E_TEST_RUNS --- A_TR_passed
  E_TEST_RUNS --- A_TR_failed
  E_TEST_RUNS --- A_TR_skipped
  E_TEST_RUNS --- A_TR_duration
  E_TEST_RUNS --- A_TR_output
  E_TEST_RUNS --- A_TR_ai_analysis
  E_TEST_RUNS --- A_TR_created_at

  %% Attributes for TEST_CASE_DETAILS
  A_TCD_id(((id\nPK))):::pk
  A_TCD_run_id(((run_id\nFK))):::attr
  A_TCD_case_name(((case_name))):::attr
  A_TCD_status(((status))):::attr
  A_TCD_message(((message))):::attr
  E_TEST_CASE_DETAILS --- A_TCD_id
  E_TEST_CASE_DETAILS --- A_TCD_run_id
  E_TEST_CASE_DETAILS --- A_TCD_case_name
  E_TEST_CASE_DETAILS --- A_TCD_status
  E_TEST_CASE_DETAILS --- A_TCD_message

  %% Attributes for TEST_SCREENSHOTS
  A_TS_id(((id\nPK))):::pk
  A_TS_run_id(((run_id\nFK))):::attr
  A_TS_step_number(((step_number))):::attr
  A_TS_step_name(((step_name))):::attr
  A_TS_image_data(((image_data))):::attr
  A_TS_created_at(((created_at))):::attr
  E_TEST_SCREENSHOTS --- A_TS_id
  E_TEST_SCREENSHOTS --- A_TS_run_id
  E_TEST_SCREENSHOTS --- A_TS_step_number
  E_TEST_SCREENSHOTS --- A_TS_step_name
  E_TEST_SCREENSHOTS --- A_TS_image_data
  E_TEST_SCREENSHOTS --- A_TS_created_at

  %% Attributes for STATIC_ANALYSIS_RUN
  A_SAR_ts(((timestamp))):::attr
  A_SAR_files(((files_checked))):::attr
  A_SAR_total(((total_issues))):::attr
  A_SAR_err(((error_count))):::attr
  A_SAR_warn(((warning_count))):::attr
  E_STATIC_RUN --- A_SAR_ts
  E_STATIC_RUN --- A_SAR_files
  E_STATIC_RUN --- A_SAR_total
  E_STATIC_RUN --- A_SAR_err
  E_STATIC_RUN --- A_SAR_warn

  %% Attributes for STATIC_ISSUE
  A_SI_id(((id))):::attr
  A_SI_sev(((severity))):::attr
  A_SI_msg(((message))):::attr
  E_STATIC_ISSUE --- A_SI_id
  E_STATIC_ISSUE --- A_SI_sev
  E_STATIC_ISSUE --- A_SI_msg

  %% Attributes for ISSUE_LOCATION
  A_LOC_file(((file))):::attr
  A_LOC_line(((line))):::attr
  A_LOC_col(((column))):::attr
  E_ISSUE_LOC --- A_LOC_file
  E_ISSUE_LOC --- A_LOC_line
  E_ISSUE_LOC --- A_LOC_col

  %% Attributes for SOURCE_FILE
  A_F_path(((path))):::pk
  E_SOURCE_FILE --- A_F_path

  %% Relationships as diamonds
  R_P_TR{has\nrun}:::rel
  R_P_UTF{has\nunit\nfile}:::rel
  R_TR_TCD{has\ndetails}:::rel
  R_TR_TS{has\nscreenshots}:::rel
  R_UTF_TR{executes}:::rel
  R_P_SAR{has\nanalysis}:::rel
  R_SAR_SI{reports}:::rel
  R_SI_LOC{at}:::rel
  R_LOC_FILE{on}:::rel

  %% Cardinalities
  E_PROJECT ---|1| R_P_TR
  R_P_TR ---|0..*| E_TEST_RUNS

  E_PROJECT ---|1| R_P_UTF
  R_P_UTF ---|0..*| E_UNIT_TEST_FILE

  E_UNIT_TEST_FILE ---|1| R_UTF_TR
  R_UTF_TR ---|0..*| E_TEST_RUNS

  E_TEST_RUNS ---|1| R_TR_TCD
  R_TR_TCD ---|0..*| E_TEST_CASE_DETAILS

  E_TEST_RUNS ---|1| R_TR_TS
  R_TR_TS ---|0..*| E_TEST_SCREENSHOTS

  E_PROJECT ---|1| R_P_SAR
  R_P_SAR ---|0..*| E_STATIC_RUN

  E_STATIC_RUN ---|1| R_SAR_SI
  R_SAR_SI ---|0..*| E_STATIC_ISSUE

  E_STATIC_ISSUE ---|1| R_SI_LOC
  R_SI_LOC ---|1..*| E_ISSUE_LOC

  E_ISSUE_LOC ---|1| R_LOC_FILE
  R_LOC_FILE ---|1| E_SOURCE_FILE

  %% Layout hints (soft)
  E_PROJECT --- R_P_TR
  E_PROJECT --- R_P_UTF
  E_PROJECT --- R_P_SAR
```

**构件图（可复用组件）**

```plantuml
@startuml
left to right direction
skinparam componentStyle rectangle

package "Frontend (Vite + React)" {
  [VisualTestPanel.tsx] as VisualPanel
  [api/visual.ts] as VisualAPI
  [api/py.ts] as PyBridgeTS
}

package "Backend (PyWebView Bridge)" {
  [backend/api.py] as BackendAPI
  [backend/static_analysis_api.py] as StaticAnalysisAPI
}

package "Core" {
  component "VisualAgent" as VisualAgent [[core/services/visual_agent.py]]
  component "Qt Scanner" as QtScanner [[core/qt_project/unit_test_scanner.py]]
  component "UI Test Runner" as UITestRunner [[core/qt_project/ui_test_runner.py]]
  component "Unit Test Runner" as UnitTestRunner [[core/qt_project/unit_test_runner.py]]
  component "TestRecorder" as TestRecorder [[core/qt_project/test_recorder.py]]
  component "TestDatabase" as TestDatabase [[core/database/db_manager.py]]
}

package "Tools" {
  component "cppcheck" as Cppcheck [[tools/cppcheck/]]
}

VisualPanel --> VisualAPI : call
VisualAPI --> PyBridgeTS : use window.pywebview
PyBridgeTS --> BackendAPI : RPC

BackendAPI --> VisualAgent : uses
BackendAPI --> QtScanner : uses
BackendAPI --> UITestRunner : uses
BackendAPI --> UnitTestRunner : uses
BackendAPI --> TestRecorder : uses
BackendAPI --> StaticAnalysisAPI : uses

TestRecorder --> TestDatabase : persist
StaticAnalysisAPI --> Cppcheck : executes

UITestRunner ..> TestRecorder : produce screenshots
UnitTestRunner ..> TestRecorder : produce results

@enduml
```

**用例图（PlantUML）**

```plantuml
@startuml
left to right direction
skinparam usecaseBorderColor #333
skinparam usecaseBackgroundColor #ffffff
skinparam linetype polyline
skinparam nodesep 80
skinparam ranksep 80

actor Tester as User
actor "cppcheck" as Cppcheck
actor "Target Qt App" as AUT

rectangle "SLA Qt Tester" {
  rectangle "测试与记录" as AreaTests {
    usecase "扫描 Qt 项目" as UC_ScanProjects
    usecase "查看项目详情/文件树" as UC_ProjectInfo
    usecase "扫描单元测试" as UC_ScanUnit
    usecase "运行单元测试并记录" as UC_RunUnit
    usecase "运行 UI 测试并记录" as UC_RunUI
    usecase "获取测试历史/详情/统计" as UC_History
    usecase "AI 分析测试失败" as UC_AIAnalyze
    usecase "清理旧记录" as UC_Cleanup
  }

  rectangle "视觉与静态分析" as AreaVisual {
    usecase "启动/关闭被测应用" as UC_AppCtrl
    usecase "实时监控/截屏" as UC_Monitor
    usecase "窗口聚焦/信息" as UC_Window
    usecase "压力测试(自动操作)" as UC_Stress
    usecase "执行 AI 指令" as UC_AICmd
    usecase "视觉结果验证" as UC_VisualVerify
    usecase "设置 AI Key" as UC_SetKey

    usecase "检查/安装 cppcheck" as UC_CppcheckSetup
    usecase "项目静态分析" as UC_StaticProject
    usecase "文件静态分析" as UC_StaticFile
  }
}

AreaTests -[hidden]-> AreaVisual

User -[hidden]- AreaTests
User -[hidden]- AreaVisual

User --> UC_ScanProjects
User --> UC_ProjectInfo
User --> UC_ScanUnit
User --> UC_RunUnit
User --> UC_RunUI
User --> UC_History
User --> UC_AIAnalyze
User --> UC_Cleanup

User --> UC_AppCtrl
User --> UC_Monitor
User --> UC_Window
User --> UC_Stress
User --> UC_AICmd
User --> UC_VisualVerify
User --> UC_SetKey

User --> UC_CppcheckSetup
User --> UC_StaticProject
User --> UC_StaticFile

UC_StaticProject ..> Cppcheck : uses
UC_StaticFile ..> Cppcheck : uses

UC_AppCtrl ..> AUT : controls
UC_Monitor ..> AUT : observes
UC_Stress ..> AUT : automates
UC_AICmd ..> AUT : automates
UC_VisualVerify ..> AUT : verifies

@enduml
```

**类图（重要类与关系，简化）**

```mermaid
classDiagram
    class API {
      - playground_dir: Path
      - visual_agent: VisualAgent
      - test_recorder: TestRecorder
      + scan_qt_projects()
      + run_ui_test_with_record()
      + launch_target_app()
    }

    class VisualAgent {
      - target_exe: Path
      - target_process
      - ai_client
      + launch_target_app()
      + close_target_app()
      + get_screen_frame()
      + run_stress_test()
      + verify_visual_result()
    }

    class TestRecorder {
      - db: TestDatabase
      + record_unit_test()
      + record_ui_test()
      + update_ai_analysis()
    }

    class TestDatabase {
      - db_path: Path
      + save_test_run()
      + save_test_case_details()
      + save_screenshot()
      + get_test_run_detail()
    }

    class TestRun
    class TestCaseDetail
    class Screenshot
    class UITestResult
    class UITestScreenshot

    API --> VisualAgent : uses
    API --> TestRecorder : uses
    TestRecorder --> TestDatabase : uses
    TestRecorder --> Screenshot : reads
    TestDatabase o-- TestRun
    TestDatabase o-- TestCaseDetail
    TestDatabase o-- Screenshot
    VisualAgent ..> UITestScreenshot : produces (files)
    UITestResult "1" o-- "*" UITestScreenshot : contains

```

---

简要说明：
- ER 图基于 `core/database/db_manager.py` 中的三张表结构。
- 用例图反映前端（用户）→ API → VisualAgent / TestRecorder / TestDatabase 的交互链路。
- 类图为简化视图，展示主要类与依赖关系（`API`、`VisualAgent`、`TestRecorder`、`TestDatabase`、数据模型）。

渲染提示：在 VS Code 中打开此文件并使用 Markdown Preview（确保安装 mermaid 支持扩展，或使用 `Markdown Preview Enhanced`）。

## 数据库设计

**概览**

- 目标：持久化测试运行历史、用例级别明细与 UI 截图，支持历史检索、统计、以及后续 AI 分析。
- 存储：SQLite（项目根目录 `test_history.db`）。实现见 [core/database/db_manager.py](core/database/db_manager.py)，数据模型见 [core/database/models.py](core/database/models.py)。
- 表与关系：
  - `test_runs`：测试运行主表（一条记录代表一次单元/UI 测试执行）。
  - `test_case_details`：用例明细（从属 `test_runs`；1:N）。
  - `test_screenshots`：截图（从属 `test_runs`；1:N）。

**表结构要点**

- `test_runs`
  - 关键字段：`project_path`、`test_name`、`test_type('unit'|'ui')`、`status('passed'|'failed'|'error')`、`total/passed/failed/skipped`、`duration`、`output`、`ai_analysis`、`created_at`。
  - 用途：作为一次测试会话的聚合根，关联明细与截图，承载整体状态与控制台输出、AI 分析结论。
- `test_case_details`
  - 关键字段：`run_id(FK)`、`case_name`、`status('PASS'|'FAIL'|'SKIP')`、`message`。
  - 用途：反映用例级断言结果与失败信息，便于定位问题。
- `test_screenshots`
  - 关键字段：`run_id(FK)`、`step_number`、`step_name`、`image_data(BLOB)`、`created_at`。
  - 用途：保存 UI 步骤截图；前端读取时可转 base64 传输展示。

**关系与索引**

- 关系：`test_runs (1) —> (N) test_case_details`；`test_runs (1) —> (N) test_screenshots`。
- 外键：DDL 中声明 `FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE`（建议在连接后启用 `PRAGMA foreign_keys=ON` 以确保约束生效）。
- 索引：
  - `test_runs(project_path)`：加速按项目路径筛选历史。
  - `test_runs(created_at DESC)`：加速时间倒序读取最新记录。
  - `test_screenshots(run_id)`：加速按运行批次读取截图。

**数据流（写入与读取）**

- 写入：
  - 单元测试：由 `UnitTestRunner` 解析 QTest 输出，`TestRecorder.record_unit_test()` 写入 `test_runs` 与 `test_case_details`。
  - UI 测试：由 `UITestRunner` 产出截图，`TestRecorder.record_ui_test()` 写入 `test_runs` 与 `test_screenshots`。
  - AI 分析：`TestRecorder.update_ai_analysis()` 或后续流程更新 `test_runs.ai_analysis`。
- 读取：
  - 列表：`TestDatabase.get_test_runs(project_path, limit)` 按项目与时间倒序分页。
  - 详情：`TestDatabase.get_test_run_detail(run_id)` 聚合主记录、用例明细与截图。
  - 统计：`TestDatabase.get_statistics(project_path)` 计算汇总指标。

**改进建议**

- 开启外键约束：在每次 `sqlite3.connect()` 后执行 `PRAGMA foreign_keys=ON`，确保级联删除与引用完整性。
- 存储策略：当截图体量较大时，可改为存储文件路径+元数据（避免数据库膨胀与备份压力），并提供清理策略。
- 复合索引：根据查询热点考虑 `(project_path, created_at)` 复合索引；对 `test_name` 辅助检索也可加索引。
- 写入性能：启用 WAL 模式（`PRAGMA journal_mode=WAL`）提升并发读写体验。
- 时间语义：统一时区（UTC）并在前端展示时本地化；`duration` 可改为数值（毫秒）便于统计。

**数据库 ER 图（PlantUML）**

```plantuml
@startuml
left to right direction
hide circle
skinparam linetype ortho

entity "test_runs" as TEST_RUNS {
  * id : INTEGER <<PK>>
  --
  project_path : TEXT
  test_name : TEXT
  test_type : TEXT
  status : TEXT
  total : INTEGER
  passed : INTEGER
  failed : INTEGER
  skipped : INTEGER
  duration : TEXT
  output : TEXT
  ai_analysis : TEXT
  created_at : TIMESTAMP
}

entity "test_case_details" as TEST_CASE_DETAILS {
  * id : INTEGER <<PK>>
  --
  run_id : INTEGER <<FK>>
  case_name : TEXT
  status : TEXT
  message : TEXT
}

entity "test_screenshots" as TEST_SCREENSHOTS {
  * id : INTEGER <<PK>>
  --
  run_id : INTEGER <<FK>>
  step_number : INTEGER
  step_name : TEXT
  image_data : BLOB
  created_at : TIMESTAMP
}

TEST_RUNS ||--o{ TEST_CASE_DETAILS : has
TEST_RUNS ||--o{ TEST_SCREENSHOTS : has

note right of TEST_RUNS
  Index: project_path\nIndex: created_at (DESC)
end note

note right of TEST_SCREENSHOTS
  Index: run_id
end note

@enduml
```

**数据库数据流图（DFD）**

```plantuml
@startuml
left to right direction
skinparam linetype ortho

actor Tester as User
rectangle "Frontend (VisualTestPanel.tsx)" as FE
rectangle "Backend API (backend/api.py)" as API
rectangle "UnitTestRunner (parse QTest)" as UTR
rectangle "UITestRunner (screenshots)" as UITR
rectangle "TestRecorder (core/qt_project/test_recorder.py)" as REC
database "SQLite (test_history.db)" as DB

User --> FE : user actions
FE --> API : RPC (list/detail/stats)
API --> DB : SELECT history/detail/stats
DB --> API : rows (JSON)
API --> FE : results

UTR --> REC : parsed results (summary+cases)
REC --> DB : INSERT test_runs
REC --> DB : INSERT test_case_details

UITR --> REC : screenshots (bytes)
REC --> DB : INSERT test_screenshots

API --> REC : set ai_analysis
REC --> DB : UPDATE test_runs.ai_analysis

@enduml
```

**数据库数据流图（Mermaid）**

```mermaid
flowchart LR
  classDef db fill:#f9f9f9,stroke:#333,stroke-width:1px

  %% External actor
  User((Tester))

  %% Grouped components
  subgraph Frontend [Frontend]
    FE[VisualTestPanel.tsx]
  end

  subgraph Backend [Backend API]
    API[backend/api.py]
  end

  subgraph Runners [Runners]
    UTR[UnitTestRunner<br/>parse QTest]
    UITR[UITestRunner<br/>screenshots]
  end

  REC[TestRecorder<br/>core/qt_project/test_recorder.py]
  DB[(SQLite<br/>test_history.db)]:::db

  %% Queries (read)
  User -->|user actions| FE
  FE -->|RPC list/detail/stats| API
  API -->|SELECT| DB
  DB -->|rows| API
  API -->|results| FE

  %% Writes (unit test results)
  UTR -->|summary + cases| REC
  REC -->|INSERT test_runs| DB
  REC -->|INSERT test_case_details| DB

  %% Writes (UI screenshots)
  UITR -->|screenshots| REC
  REC -->|INSERT test_screenshots| DB

  %% Update (AI analysis)
  API -->|set ai_analysis| REC
  REC -->|UPDATE ai_analysis| DB
```

**写入数据流（Mermaid）**

```mermaid
flowchart LR
  classDef db fill:#f9f9f9,stroke:#333,stroke-width:1px

  subgraph Runners [Runners]
    UTR[UnitTestRunner<br/>parse QTest]
    UITR[UITestRunner<br/>screenshots]
  end

  REC[TestRecorder<br/>core/qt_project/test_recorder.py]
  DB[(SQLite<br/>test_history.db)]:::db

  %% Unit test write
  UTR -->|summary + cases| REC
  REC -->|INSERT test_runs| DB
  REC -->|INSERT test_case_details| DB

  %% UI screenshots write
  UITR -->|screenshots bytes| REC
  REC -->|INSERT test_screenshots| DB
```

**查询数据流（Mermaid）**

```mermaid
flowchart LR
  classDef db fill:#f9f9f9,stroke:#333,stroke-width:1px

  User((Tester))
  subgraph Frontend [Frontend]
    FE[VisualTestPanel.tsx]
  end
  subgraph Backend [Backend API]
    API[backend/api.py]
  end
  DB[(SQLite<br/>test_history.db)]:::db

  User -->|actions| FE
  FE -->|RPC list/detail/stats| API
  API -->|SELECT| DB
  DB -->|rows JSON| API
  API -->|results| FE
```

**更新数据流（Mermaid）**

```mermaid
flowchart LR
  classDef db fill:#f9f9f9,stroke:#333,stroke-width:1px

  subgraph Backend [Backend API]
    API[backend/api.py]
  end
  REC[TestRecorder<br/>core/qt_project/test_recorder.py]
  DB[(SQLite<br/>test_history.db)]:::db

  API -->|set ai_analysis| REC
  REC -->|UPDATE test_runs.ai_analysis| DB
```

