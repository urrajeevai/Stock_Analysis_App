# Prompt 1: Add AI-Powered Food Recognition

Enable plan mode and then run the following prompt: (Shift+Tab)

Copy and paste the following into Claude Code:

```
Context: I have a working Stock Analysis & Trade Tracking app, Analysis table need to add filed (Risk Price, Reward Price, Risk Amount, Reward Amount, Risk %, Reward %,R/R Ratio,Buy Decision, Timeframe, add 4 image (chart image)) 

-Allowed file types: JPG, JPEG, PNG, WEBP.
Formula Logic – Long Trade:
Risk Amount = Stock Price - Risk Price
Reward Amount = Reward Price - Stock Price
Risk % = (Risk Amount / Stock Price) × 100
Reward % = (Reward Amount / Stock Price) × 100
R/R Ratio = Reward Amount / Risk Amount 
Buy Decision =if(R/R Ratio>2): yes (color green);  else No (color Red)

Formula Logic – Short Trade:
Risk Amount = Risk Price - Stock Price
Reward Amount = Stock Price - Reward Price
Risk % = (Risk Amount / Stock Price) × 100
Reward % = (Reward Amount / Stock Price) × 100
R/R Ratio = Reward Amount / Risk Amount
Buy Decision =if(R/R Ratio>2): yes (color green);  else No (color Red)


Instruction: Build the backend API and front end add these all filed and give option to upload image, 
Updated CLAUDE.md and a new dated entry in docs/ with what changed and why.
```

