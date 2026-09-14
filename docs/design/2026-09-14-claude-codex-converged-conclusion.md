# Claude·Codex 교차 검토 결정 기록

2026-09-14 · 분석 출처와 이견 처리 기록 · 실행 설계의 별도 정본이 아님

최종 설계는 두 문서다: [신규 프로젝트용](2026-09-14-portable-agent-document-system.md), [현재 저장소용](2026-09-14-reference-document-loop-redesign.md). 이 기록은 두 설계의 대안이나 추가 지침이 아니다. 기존의 중복 설계 본문과 미적용 제안은 제거하고, 교차 검토가 실제로 이루어졌다는 출처와 중요한 판단 근거만 보존한다. 소유자는 통합자이며 리뷰 출처·이견 처리 정정 때 갱신한다.

## 실제 교차 검토

Orca 1.4.196에서 Claude는 새 세션으로 독립 분석 후 Codex 안을 읽었다. Codex는 보고서 전체와 실제 근거를 대조하고 A–L 쟁점을 반박했다. 같은 Claude 세션의 새 Task에서 재검토를 받았으며 9건 수용·3건 조건 수정 후 Codex가 통합했다. 이는 모든 최종 문장에 대한 Claude의 승인이나 비용 A/B 시험이 아니다.

| 단계 | 실제 기록 |
| --- | --- |
| 분석 Run | `run_4d3a370d27f7` |
| Claude 독립 분석 | `task_2b409f83c4c7` / `ctx_253100955353` |
| Claude 재검토 | `task_aabe3f7cf2d5` / `ctx_586287e98d24` |
| 구현·후속 검토 Run | `run_9099f617c68c` |
| Claude 통합 검토 | `task_a87d1e0e2a15`: 주요 변경 검토 후 세션 한도로 종료, 이후 수정분의 재승인은 아님 |
| Codex 최종 변경 검토 | `task_a1ffd89d3c0d`: 마지막 이관 보완 수용, Kelvin 반례로 로직 요구 R3 기각 |
| Copilot Grok 4.6 기록 정정 검토 | `task_095a14f6eda5`: 반례 재현 및 R3 미구현·최종 기록 확인 |

원본 분석은 `.ai-work/claude-codex-convergence/`의 `claude-analysis.md`, `codex-review-of-claude.md`, `codex-reassessment.md`, `claude-cross-review.md`다. 구현·후속 검증은 `.ai-work/document-loop-implementation/implementation-results.md`와 연결된 실행 원본이 보존한다. Claude 모델·effort는 런타임 기본값이었으므로 임의의 모델 이름을 붙이지 않는다.

## 유지한 결정과 기각한 설명

| 쟁점 | 최종 판단·근거 |
| --- | --- |
| 실행 skill 이름·새 폴더 트리 | screen-loop의 의미·검사를 고친다. 이름 변경이나 새 verification/fixture 트리만으로 비화면 지원이 개선되지 않음 |
| 제품 descriptor | PROJECT front matter 대신 product.json 경로 포인터. 현재 JSON 읽기와 맞고 정책·파서를 복제하지 않음 |
| 부분 근거 | 선택 행과 관련 부모 정책을 함께 읽음. 명시 관계가 없으면 부모 절 보존; 모든 산문을 무조건 버리거나 붙이지 않음 |
| 혼합 요청 | 전체 requirements와 units/currentUnit. 별도 deferred 원장을 만들지 않고 다음 단위로 계속 |
| 진입 근거 | 관련 형태 절이 존재해도 미전달이면 문제. 자연어 의미의 관련성까지 기계가 보장한다고 과장하지 않음 |
| 드릴 증거 | B의 형제 답지 사전 열람은 문서만의 재현성 증거가 아님. C/D의 준비 성공을 review/lint/test 전체 성공으로 쓰지 않음 |
| 실행 증거 | artifact hash만으로 부족. 현재 source/diff와 실제 실행 receipt를 연결 |
| 의미 검토 | export 이름·선언·인용 검사는 소비자 전용 prop이나 거짓 제품 사실을 못 증명함. 실제 diff·소비자·반례 검토 필요 |
| 이관 성공 | 빈 checkpoint나 파일 복사 성공으로 판단하지 않음. 유효한 과제와 실제 다른 제품 수용 필요 |
| 문서 교체 | 초기에는 게이트 결함을 우선 수정했으나, 사용자의 후속 재설계 요청에 따라 중복 초안을 대체하고 필수 읽기와 조건부 절차를 재분리 |

기계적 검사가 통과해도 의미 오류는 남을 수 있다. 실제 ASCII 유틸은 비ASCII Kelvin sign을 `toLowerCase()`로 k로 바꾸는 반례가 기존 테스트를 통과했다. 두 모델의 동의나 리뷰 기록 존재보다 이 반례를 우선해 성공 판정을 철회했다. 원인과 남은 수용 조건은 현재 저장소용 설계가 소유한다.
