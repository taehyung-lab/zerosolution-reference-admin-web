# 14. 현장발권

표 형식은 [README.md](README.md). Notion 열의 `(대기)`는 아래 **Notion 요점**과 `notion/` 원문으로 대체한다. **별도 창 chrome**(ZEROPLUS 타이틀 바 + □ ✕) 안에서 렌더되며 상단 바(통합검색·세션·알림)가 없다.

| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |
| --- | --- | --- | --- | --- | --- |
| 14.1 예매검색 | 상태 frame | default → 공연선택후(+Case) → 검색결과 → 발권중 | (대기) | — | 없음 |
| 14.1 예매검색 | 필터 | 공연 검색 lookup(chip) + 공연일* 종속 select + 예매처 단일 select + 검색어(예매번호…). 기간 없음. 검색/초기화 | (대기) | — | 6.1.1과 동일 mechanic |
| 14.1 예매검색 | toolbar | 보기 기본 200 · 정렬 예매번호. 우측 `스마트프린터 선택▾` + `발권실행` | (대기) | — | — |
| 14.1 예매검색 | table | checkbox + 6.1.1과 같은 컬럼(발권상태·프린터·티켓일련번호 포함) | (대기) | — | — |
| 14.2 신규예매 | 상태 frame | default → 공연선택후(+Case) → 팝업 티켓 발권 (미판독) | (대기) | — | — |
| 14.3 출입조회 | 상태 frame | default → 공연선택후 → 검색결과(+Case) (미판독) | (대기) | — | — |

관찰: 현장발권은 6.1.1 일반발권과 같은 filter·toolbar·table mechanic을 다른 shell(창)에서 재사용한다. list mechanic이 app shell·Router에 묶이면 재사용 불가.

## Notion 요점 (원문: [notion/14-onsite.md](notion/14-onsite.md))

- 담당자 지정 공연만 조회(DTsol). 신규예매 gate 명시. 보기 default 200(예매검색), 100(출입조회). 정렬 default 예매번호. 발권PC Client 미실행 alert.
