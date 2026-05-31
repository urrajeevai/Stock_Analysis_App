Context:
I already have a working Stock Analysis & Trade Tracking application with Dashboard, Analysis, Trade, and Trade Trail modules.

Requirement:
Enhance the Dashboard and Trade Dashboard to provide better profit/loss analytics and expandable historical trade analysis.

Feature 1: Dashboard Trade Summary Analytics

On the main Dashboard, add summary cards/widgets showing:
	-Total Number of Trades
	-Total Number of Profit Trades
	-Total Number of Loss Trades
	-Total Profit Amount for last 1 month (clickabke show list of all trade )
	-Total Loss Amount for last 1 month (clickabke show list of all trade )
	-Net P/L for last 1 month

Definitions:
	- Profit Trade = Closed trade where P/L > 0
	- Loss Trade = Closed trade where P/L < 0

P/L Calculation:
	For closed trades:
	Long Trade:
		-P/L Amount = (Exit Price - Entry Price) × Quantity

	Short Trade:
		-P/L Amount = (Entry Price - Exit Price) × Quantity

Net P/L:
Net P/L = Total Profit Amount - Total Loss Amount

Feature 2: Expandable Profit/Loss Trade List

On Dashboard:
	- Profit Trades count should be clickable
	- Loss Trades count should be clickable

When user clicks:
	- Initially load last 1 month trade data
	- Show matching trades in table/list

If user clicks “Load More”:
	- Add one more month historical data
	- Example:
		-First load = last 1 month
		-Second load = last 2 months
		-Third load = last 3 months
		-and so on

Do this separately for:
	- Profit trades
	- Loss trades

Required Filters:
	- Trade Type
	- Date Range
	- Symbol
	- Status
	- Profit/Loss category

Trade List Columns:
	- Symbol
	- Trade Type
	- Entry Date
	- Exit Date
	- Entry Price
	- Exit Price
	- Quantity
	- P/L Amount
	- P/L %
	- Holding Days
	- Status

Feature 3: Trade Dashboard P/L Display
On Trade Dashboard/List screen:
Add proper Profit/Loss calculation and display.
	Requirements:
		-If trade is closed:
			- Automatically calculate P/L based on entry price and exit price
		- Show:
			- P/L Amount
			- P/L %
			- Profit/Loss status

	-Color Coding:
	- Profit = Green
	- Loss = Red
	- Open = Neutral/Blue

Feature 4: Dashboard Charts
	Add charts/widgets:
		-Monthly Profit vs Loss chart
		-Weekly Net P/L trend
		-Trade Win/Loss distribution
		-Top 5 profitable trades
		-Top 5 losing trades
Instruction: Build the backend API and front end and  Updated CLAUDE.md and a new dated entry in docs/ with what changed and why.