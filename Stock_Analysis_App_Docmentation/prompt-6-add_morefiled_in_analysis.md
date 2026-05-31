Context:
I already have a working Stock Analysis & Trade Tracking application.
Requirement:
Enhance the Analysis Detail and Trade modules with trade creation from analysis and trailing stop-loss/target tracking functionality.
-Feature 1: Create Trade from Analysis
	-On the Analysis Detail page, add a new button:
	-“Create Trade” or “Buy Trade”

-When user clicks this button:
	-Automatically create/open Trade form with all relevant fields prefilled from Analysis.
	-Copy all important analysis attributes into Trade:
		-Stock Symbol
		-Trade Direction (Long/Short)
		-Stock Price
		- Risk Price → Initial Stop-loss (make editable to user update)
		- Reward Price → Initial Target (make editable to user update)
		-Risk %
		-Reward %
		-R/R Ratio
		-Setup Type
		-Notes
Create proper relationship between Analysis and Trade:
	-One Analysis can have one or multiple Trades
	-Trade table should store analysis_id foreign key
	-From Trade Detail page user should be able to navigate back to original Analysis
	-Analysis Detail page should show linked Trades list
	
Feature 2: Trade Trail / Trailing Stop-loss & Target Tracking
	-Enhance Trade module to support:
		-Trailing Stop-loss updates
		-Target revisions
		-Trail analysis history
Important Rule:
	-Never overwrite previous stop-loss or target values.
Instead:
	- Every change should create a new Trail Entry record with timestamp.
	- Maintain complete historical timeline of all SL/Target changes.

Create new module/table:
	-trade_trails
	Fields:
		- id
		- trade_id
		- previous_stop_loss
		- new_stop_loss
		- previous_target
		- new_target
		- reason
		- notes
		- created_at
		
Trade Detail Page should include:
	-Original Trade Details
	-Original Analysis Reference
	-Latest Active Stop-loss and Target
	-Trail History Timeline
	-Trail Notes
	-Trail Chart Images optional
	-P&L Impact Analysis
Latest Value Logic:
Dashboard and open trade tables should always display latest active stop-loss and target from most recent trail entry.

	Trail Analytics:
		System should later support analysis such as:
			- How many trades became profitable after trailing SL
			- Best trailing strategy
			- Average number of trail updates before target hit
			- SL movement history
			- Trade behavior after target revision
UI Requirements:
	- Add “Add Trail Entry” button on Trade Detail page
	- Show trail history in timeline/table format
	- Highlight latest active SL/Target
	- Keep responsive professional UI using existing design system
Instruction: Build the backend API and front end and  Updated CLAUDE.md and a new dated entry in docs/ with what changed and why.