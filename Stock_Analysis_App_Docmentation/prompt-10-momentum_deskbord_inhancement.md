

Context:
I already have a working Stock Analysis & Trade Tracking application with Momentum Score Dashboard functionality.

Requirement:
Improve the Trending Report business logic because the current implementation is not working correctly.

Objective:
User should be able to identify stocks whose momentum score is increasing continuously every day for a selected number of days or within a selected date range.

Input Filters:
-Number of Days,Example: 3 days, 5 days, 10 days
-Date Range
   - From Date
   - To Date
Business Requirement:
Example:
-If user selects:
- Number of Days = 3
Then system should:
- Find all stocks where momentum score increased continuously during last 3 days


Example Data:

RELIANCE
2026-05-20 → 61
2026-05-21 → 68
2026-05-22 → 75

This stock should appear because:
- score increased daily
- latest score is above 60
Expected Output:
Trending Report should show:
	-Symbol
	-Day1
	-Day2
	-Day3
	

Instruction: Build the backend API and front end and  Updated CLAUDE.md and a new dated entry in docs/ with what changed and why.
