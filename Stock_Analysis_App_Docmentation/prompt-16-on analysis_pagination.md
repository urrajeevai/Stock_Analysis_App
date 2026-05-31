Context:
I already have a working Stock Analysis & Trade Tracking application.
Requirement:
Implement proper pagination on the Analysis List page(/analysis).
Objective:
Currently the Analysis page loads records without proper pagination. Add backend and frontend pagination support with configurable page size.
Backend Requirements:
	-Update Analysis List API to support pagination.
API:
GET /api/analysis
Query params:
- page optional, default 1
- page_size optional
- sort_by optional, default created_at
- sort_order optional, default desc
Default sorting:
- Sort by created date/time descending
- Latest analysis should appear first
2. Page Size Configuration
Page size should be configurable from application properties/config file.
Example:
ANALYSIS_PAGE_SIZE=20
Rules:
- If page_size is not passed from frontend, use default value from config/properties file
- If page_size is passed, validate it
- Minimum page size: 10
- Maximum page size: 100
- Default page size should come from config
4. Frontend Requirements
Update Analysis List page to display paginated records.
Show:
- Total number of records
- Current page number
- Total pages
- Previous button
- Next button
Example:
Showing page 1 of 7 | Total Records: 125
Pagination behavior:
- Previous button disabled on first page
- Next button disabled on last page
- Clicking Next loads next page
- Clicking Previous loads previous page
- Keep default sorting by creation date/time descending

5. UI Requirements
- Use existing application design system
- Pagination should be placed below the analysis table
- Show loading state while fetching data
- Show empty state if no records found
- Preserve existing search/filter functionality if available
6. Testing Requirements
Test cases:
- First page loads with default page size
- Next button loads next page
- Previous button loads previous page
- Total record count displays correctly
- Current page and total pages display correctly
- Default sorting shows latest records first
- Page size comes from config/properties file
- Invalid page number/page size handled safely
Instruction: Build the backend API and front end and  Updated CLAUDE.md and a new dated entry in docs/ with what changed and why.